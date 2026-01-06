export enum LiveMessageType {
  chat = 'chat',
  gift = 'gift',
  system = 'system',
}

export interface LiveMessageColor {
  r: number
  g: number
  b: number
}

export interface LiveMessage {
  type: LiveMessageType
  userName: string
  message: string
  color: LiveMessageColor
}

export interface DanmakuCallbacks {
  onMessage?: (msg: LiveMessage) => void
  onClose?: (msg: string) => void
  onReady?: () => void
}
