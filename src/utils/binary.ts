/**
 * 二进制数据写入器
 */
export class BinaryWriter {
  private data: number[] = []

  constructor(initialBuffer: number[] = []) {
    this.data = [...initialBuffer]
  }

  get bufferArray(): number[] {
    return this.data
  }

  get buffer(): Uint8Array {
    return new Uint8Array(this.data)
  }

  /**
   * 写入整数
   * @param value 值
   * @param byteLength 字节长度 (1, 2, 4)
   * @param endian 字节序，默认小端序
   */
  writeInt(value: number, byteLength: number, endian: 'little' | 'big' = 'little'): void {
    const bytes: number[] = []
    for (let i = 0; i < byteLength; i++) {
      bytes.push((value >> (i * 8)) & 0xff)
    }
    this.data.push(...(endian === 'little' ? bytes : bytes.reverse()))
  }

  /**
   * 写入字节数组
   * @param bytes 字节数组
   */
  writeBytes(bytes: number[] | Uint8Array): void {
    this.data.push(...bytes)
  }

  /**
   * 写入字符串
   * @param str 字符串
   */
  writeString(str: string): void {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    this.writeBytes(Array.from(bytes))
  }
}

/**
 * 二进制数据读取器
 */
export class BinaryReader {
  private position: number = 0

  constructor(private buffer: Uint8Array) {}

  /**
   * 读取字节
   */
  readByte(): number {
    if (this.position >= this.buffer.length) {
      throw new Error('Buffer overflow')
    }
    return this.buffer[this.position++]
  }

  /**
   * 读取短整型 (2字节)
   * @param endian 字节序，默认小端序
   */
  readShort(endian: 'little' | 'big' = 'little'): number {
    const bytes = [this.readByte(), this.readByte()]
    return endian === 'little'
      ? bytes[0] | (bytes[1] << 8)
      : (bytes[0] << 8) | bytes[1]
  }

  /**
   * 读取整型 (4字节)
   * @param endian 字节序，默认小端序
   */
  readInt32(endian: 'little' | 'big' = 'little'): number {
    const bytes = [this.readByte(), this.readByte(), this.readByte(), this.readByte()]
    return endian === 'little'
      ? bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)
      : (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
  }

  /**
   * 读取指定长度的字节数组
   * @param length 长度
   */
  readBytes(length: number): number[] {
    const bytes: number[] = []
    for (let i = 0; i < length; i++) {
      bytes.push(this.readByte())
    }
    return bytes
  }

  /**
   * 检查是否还有数据可读
   */
  hasMore(): boolean {
    return this.position < this.buffer.length
  }

  /**
   * 获取剩余字节数
   */
  remaining(): number {
    return this.buffer.length - this.position
  }
}
