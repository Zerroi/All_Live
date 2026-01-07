import { DouyuSign } from '../utils/douyuSign'

/**
 * 斗鱼直播流服务
 */
export class DouyuLive {
  private readonly API_BASE = '/api/douyu'
  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43'

  /**
   * 获取房间直播流地址
   * @param roomId 房间ID
   * @param rate 清晰度码率，默认为 -1（最高清晰度）
   * @param cdn CDN节点，默认为空（自动选择）
   */
  async getLiveStream(
    roomId: string,
    rate: number = -1,
    cdn: string = ''
  ): Promise<string | null> {
    try {
      // 1. 获取房间信息
      const roomInfo = await this._getRoomInfo(roomId)

      // 2. 获取加密数据
      const crptext = await this._getCrptext(roomId)
        // console.log('crptext type:', typeof crptext, 'value:', crptext);
      // 3. 生成签名
      const signData = await DouyuSign.getSign(crptext.data[`room${roomId}`], roomId)

      // 4. 构建请求参数
      const params = this._buildParams(signData, rate, cdn)

      // 5. 获取直播流URL
      const playUrl = await this._getPlayUrl(roomId, params)

      return playUrl
    } catch (error) {
      console.error('获取直播流失败:', error)
      return null
    }
  }

  /**
   * 获取可用的清晰度列表
   * @param roomId 房间ID
   */
  async getQualities(roomId: string): Promise<Quality[]> {
    try {
      // 1. 获取房间信息
      const roomInfo = await this._getRoomInfo(roomId)

      // 2. 获取加密数据
      const crptext = await this._getCrptext(roomId)

      // 3. 生成签名
      const signData = await DouyuSign.getSign(crptext, roomId)

      // 4. 构建请求参数（获取所有清晰度）
      const params = this._buildParams(signData, -1, '')

      // 5. 获取播放信息
      const playInfo = await this._getPlayInfo(roomId, params)

      const qualities: Quality[] = []

      // 获取可用CDN列表
      const cdns: string[] = []
      if (playInfo.data?.cdnsWithName) {
        for (const item of playInfo.data.cdnsWithName) {
          cdns.push(item.cdn)
        }
        // 将 scdn 开头的CDN放到最后
        cdns.sort((a, b) => {
          if (a.startsWith('scdn') && !b.startsWith('scdn')) {
            return 1
          } else if (!a.startsWith('scdn') && b.startsWith('scdn')) {
            return -1
          }
          return 0
        })
      }

      // 获取清晰度列表
      if (playInfo.data?.multirates) {
        for (const item of playInfo.data.multirates) {
          qualities.push({
            name: item.name,
            rate: item.rate,
            cdns: cdns,
          })
        }
      }

      return qualities
    } catch (error) {
      console.error('获取清晰度列表失败:', error)
      return []
    }
  }

  /**
   * 获取房间信息
   */
  async getRoomInfo(roomId: string): Promise<RoomInfo | null> {
    try {
      const roomInfo = await this._getRoomInfo(roomId)
      const h5RoomInfo = await this._getH5RoomInfo(roomId)

      return {
        roomId: roomInfo.room_id.toString(),
        roomName: roomInfo.room_name,
        ownerName: roomInfo.owner_name,
        ownerAvatar: roomInfo.owner_avatar,
        roomPic: roomInfo.room_pic,
        showDetails: roomInfo.show_details,
        isLive: roomInfo.show_status === 1 && roomInfo.videoLoop !== 1,
        isRecord: roomInfo.videoLoop === 1,
        online: parseInt(roomInfo.room_biz_all?.hot || '0', 10),
        showTime: h5RoomInfo.data?.show_time?.toString(),
      }
    } catch (error) {
      console.error('获取房间信息失败:', error)
      return null
    }
  }

  /**
   * 内部方法：获取房间信息
   */
  private async _getRoomInfo(roomId: string): Promise<any> {
    const response = await fetch(`${this.API_BASE}/betard/${roomId}`, {
      headers: {
        'User-Agent': this.USER_AGENT,
        'Referer': `https://www.douyu.com/${roomId}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.room
  }

  /**
   * 内部方法：获取H5房间信息
   */
  private async _getH5RoomInfo(roomId: string): Promise<any> {
    const response = await fetch(`${this.API_BASE}/swf_api/h5room/${roomId}`, {
      headers: {
        'User-Agent': this.USER_AGENT,
        'Referer': `https://www.douyu.com/${roomId}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 内部方法：获取加密数据
   */
  private async _getCrptext(roomId: string): Promise<any> {
    const response = await fetch(`${this.API_BASE}/swf_api/homeH5Enc?rids=${roomId}`, {
      headers: {
        'User-Agent': this.USER_AGENT,
        'Referer': `https://www.douyu.com/${roomId}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 内部方法：构建请求参数
   */
  private _buildParams(signData: string, rate: number, cdn: string): string {
    let params = signData
    params += '&cdn=' + cdn
    params += '&rate=' + rate
    params += '&ver=Douyu_223061205'
    params += '&iar=1&ive=1&hevc=0&fa=0'
    return params
  }

  /**
   * 内部方法：获取播放信息
   */
  private async _getPlayInfo(roomId: string, params: string): Promise<any> {
    const response = await fetch(`${this.API_BASE}/lapi/live/getH5Play/${roomId}`, {
      method: 'POST',
      headers: {
        'User-Agent': this.USER_AGENT,
        'Referer': `https://www.douyu.com/${roomId}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 内部方法：获取播放URL
   */
  private async _getPlayUrl(roomId: string, params: string): Promise<string> {
    const playInfo = await this._getPlayInfo(roomId, params)

    if (playInfo.error !== 0) {
      throw new Error(playInfo.msg || '获取播放URL失败')
    }

    const rtmpUrl = playInfo.data?.rtmp_url
    const rtmpLive = playInfo.data?.rtmp_live

    if (!rtmpUrl || !rtmpLive) {
      throw new Error('播放URL为空')
    }

    // 解码HTML实体
    const decodedLive = this._htmlUnescape(rtmpLive.toString())

    return `${rtmpUrl}/${decodedLive}`
  }

  /**
   * HTML实体解码
   */
  private _htmlUnescape(str: string): string {
    const entities: Record<string, string> = {
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"',
    }

    return str.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity)
  }

  /**
   * 获取推荐直播间列表
   * @param page 页码，默认为1
   */
  async getRecommendRooms(page: number = 1): Promise<LiveCategoryResult> {
    try {
      const response = await fetch(`${this.API_BASE}/japi/weblist/apinc/allpage/6/${page}`, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Referer': 'https://www.douyu.com/',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const items: LiveRoomItem[] = []

      if (result.data?.rl) {
        for (const item of result.data.rl) {
          // 只获取直播中的房间（type === 1）
          if (item.type !== 1) {
            continue
          }

          const roomItem: LiveRoomItem = {
            cover: item.rs16?.toString() || '',
            online: item.ol || 0,
            roomId: item.rid?.toString() || '',
            title: item.rn?.toString() || '',
            userName: item.nn?.toString() || '',
          }
          items.push(roomItem)
        }
      }

      const hasMore = page < (result.data?.pgcnt || 1)

      return {
        hasMore,
        items,
      }
    } catch (error) {
      console.error('获取推荐直播间失败:', error)
      return {
        hasMore: false,
        items: [],
      }
    }
  }

  /**
   * 获取关注列表
   * 注意：此方法需要用户登录态，实际使用时需要配合登录系统
   */
  async getFollowRooms(): Promise<LiveRoomItem[]> {
    try {
      // 斗鱼关注列表API需要登录态
      // 这里提供一个基础实现，实际使用时需要从cookie或token中获取用户信息
      const response = await fetch(`${this.API_BASE}/japi/weblist/apinc/myfollow/1/0`, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Referer': 'https://www.douyu.com/',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const items: LiveRoomItem[] = []

      if (result.data?.rl) {
        for (const item of result.data.rl) {
          // 只获取直播中的房间
          if (item.show_status === 1) {
            const roomItem: LiveRoomItem = {
              cover: item.room_pic?.toString() || '',
              online: parseInt(item.hot || '0', 10),
              roomId: item.room_id?.toString() || '',
              title: item.room_name?.toString() || '',
              userName: item.nickname?.toString() || '',
            }
            items.push(roomItem)
          }
        }
      }

      return items
    } catch (error) {
      console.error('获取关注列表失败:', error)
      return []
    }
  }
}

/**
 * 直播间项
 */
export interface LiveRoomItem {
  /** 封面图 */
  cover: string
  /** 在线人数 */
  online: number
  /** 房间ID */
  roomId: string
  /** 房间标题 */
  title: string
  /** 主播名称 */
  userName: string
}

/**
 * 直播分类结果
 */
export interface LiveCategoryResult {
  /** 是否有更多数据 */
  hasMore: boolean
  /** 房间列表 */
  items: LiveRoomItem[]
}

/**
 * 清晰度信息
 */
export interface Quality {
  /** 清晰度名称 */
  name: string
  /** 码率 */
  rate: number
  /** 可用CDN列表 */
  cdns: string[]
}

/**
 * 房间信息
 */
export interface RoomInfo {
  /** 房间ID */
  roomId: string
  /** 房间名称 */
  roomName: string
  /** 主播名称 */
  ownerName: string
  /** 主播头像 */
  ownerAvatar: string
  /** 房间封面 */
  roomPic: string
  /** 直播详情 */
  showDetails: string
  /** 是否直播中 */
  isLive: boolean
  /** 是否是回放 */
  isRecord: boolean
  /** 在线人数 */
  online: number
  /** 开播时间 */
  showTime?: string
}
