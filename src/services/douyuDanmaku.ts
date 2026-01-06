import { BinaryReader, BinaryWriter } from '@/utils/binary'
import type { LiveMessage, LiveMessageColor, LiveMessageType, DanmakuCallbacks } from '@/types/danmaku'

/**
 * 斗鱼弹幕解析器
 */
export class DouyuDanmaku {
  private serverUrl = 'wss://danmuproxy.douyu.com:8506'
  private heartbeatTime = 45 * 1000
  private ws: WebSocket | null = null
  private heartbeatTimer: number | null = null
  private reconnectTimer: number | null = null
  private roomId: string = ''
  private callbacks: DanmakuCallbacks = {}
  private isConnecting = false
  private isManualClose = false

  // 常量
  private readonly CLIENT_SEND_TO_SERVER = 689
  private readonly ENCRYPTED = 0
  private readonly RESERVED = 0

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: DanmakuCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * 启动连接
   */
  async start(roomId: string): Promise<void> {
    this.roomId = roomId
    this.isManualClose = false
    await this.connect()
  }

  /**
   * 连接 WebSocket
   */
  private async connect(): Promise<void> {
    if (this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      this.ws = new WebSocket(this.serverUrl)

      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => {
        this.isConnecting = false
        this.callbacks.onReady?.call(this)
        this.joinRoom(this.roomId)
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        const data = new Uint8Array(event.data)
        this.decodeMessage(data)
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        this.isConnecting = false
        this.stopHeartbeat()
        if (!this.isManualClose) {
          this.callbacks.onClose?.call(this, '与服务器断开连接，正在尝试重连')
          this.scheduleReconnect()
        }
      }
    } catch (error) {
      this.isConnecting = false
      console.error('Connection error:', error)
      this.callbacks.onClose?.call(this, '连接失败')
    }
  }

  /**
   * 加入房间
   */
  private joinRoom(roomId: string): void {
    const loginMsg = this.serializeDouyu(`type@=loginreq/roomid@=${roomId}/`)
    this.sendMessage(loginMsg)

    const joinMsg = this.serializeDouyu(`type@=joingroup/rid@=${roomId}/gid@=-9999/`)
    this.sendMessage(joinMsg)
  }

  /**
   * 发送消息
   */
  private sendMessage(data: Uint8Array): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = window.setInterval(() => {
      this.heartbeat()
    }, this.heartbeatTime)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    this.stopReconnect()
    this.reconnectTimer = window.setTimeout(() => {
      if (!this.isManualClose) {
        this.connect()
      }
    }, 3000)
  }

  /**
   * 停止重连
   */
  private stopReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * 心跳包
   */
  private heartbeat(): void {
    const data = this.serializeDouyu('type@=mrkl/')
    this.sendMessage(data)
  }

  /**
   * 停止连接
   */
  stop(): void {
    this.isManualClose = true
    this.stopHeartbeat()
    this.stopReconnect()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.callbacks = {}
  }

  /**
   * 解码消息
   */
  private decodeMessage(data: Uint8Array): void {
    try {
      const result = this.deserializeDouyu(data)
      if (result === null) {
        return
      }
      const jsonData = this.sttToJObject(result)

      const type = jsonData['type']?.toString()
      
      if (type === 'chatmsg') {
        // 屏蔽阴间弹幕
        if (jsonData['dms'] === null) {
          return
        }
        const col = parseInt(jsonData['col']?.toString() || '0', 10) || 0
        const liveMsg: LiveMessage = {
          type: 'chat' as LiveMessageType,
          userName: jsonData['nn']?.toString() || '',
          message: jsonData['txt']?.toString() || '',
          color: this.getColor(col),
        }

        this.callbacks.onMessage?.call(this, liveMsg)
      }
    } catch (error) {
      console.error('Decode message error:', error)
    }
  }

  /**
   * 序列化斗鱼协议
   */
  private serializeDouyu(body: string): Uint8Array {
    try {
      const encoder = new TextEncoder()
      const buffer = encoder.encode(body)

      const writer = new BinaryWriter()
      writer.writeInt(4 + 4 + body.length + 1, 4, 'little')
      writer.writeInt(4 + 4 + body.length + 1, 4, 'little')
      writer.writeInt(this.CLIENT_SEND_TO_SERVER, 2, 'little')
      writer.writeInt(this.ENCRYPTED, 1, 'little')
      writer.writeInt(this.RESERVED, 1, 'little')
      writer.writeBytes(Array.from(buffer))
      writer.writeInt(0, 1, 'little')

      return writer.buffer
    } catch (error) {
      console.error('Serialize error:', error)
      return new Uint8Array(0)
    }
  }

  /**
   * 反序列化斗鱼协议
   */
  private deserializeDouyu(buffer: Uint8Array): string | null {
    try {
      const reader = new BinaryReader(buffer)
      const fullMsgLength = reader.readInt32('little')
      reader.readInt32('little') // fullMsgLength2
      const bodyLength = fullMsgLength - 9
      reader.readShort('little') // packType
      reader.readByte() // encrypted
      reader.readByte() // reserved

      const bytes = reader.readBytes(bodyLength)

      reader.readByte() // 固定为0

      const decoder = new TextDecoder()
      return decoder.decode(new Uint8Array(bytes))
    } catch (error) {
      console.error('Deserialize error:', error)
      return null
    }
  }

  /**
   * STT 格式转 JSON 对象
   */
  private sttToJObject(str: string): any {
    if (str.includes('//')) {
      const result: any[] = []
      for (const field of str.split('//')) {
        if (field === '') {
          continue
        }
        result.push(this.sttToJObject(field))
      }
      return result
    }
    if (str.includes('@=')) {
      const result: Record<string, any> = {}
      for (const field of str.split('/')) {
        if (field === '') {
          continue
        }
        const tokens = field.split('@=')
        const k = tokens[0]
        const v = this.unescapeSlashAt(tokens[1] || '')
        result[k] = this.sttToJObject(v)
      }
      return result
    } else if (str.includes('@A=')) {
      return this.sttToJObject(this.unescapeSlashAt(str))
    } else {
      return this.unescapeSlashAt(str)
    }
  }

  /**
   * 反转义特殊字符
   */
  private unescapeSlashAt(str: string): string {
    return str.split('@S').join('/').split('@A').join('@')
  }

  /**
   * 获取弹幕颜色
   */
  private getColor(type: number): LiveMessageColor {
    switch (type) {
      case 1:
        return { r: 255, g: 0, b: 0 }
      case 2:
        return { r: 30, g: 135, b: 240 }
      case 3:
        return { r: 122, g: 200, b: 75 }
      case 4:
        return { r: 255, g: 127, b: 0 }
      case 5:
        return { r: 155, g: 57, b: 244 }
      case 6:
        return { r: 255, g: 105, b: 180 }
      default:
        return { r: 255, g: 255, b: 255 }
    }
  }
}
