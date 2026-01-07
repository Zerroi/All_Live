<template>
  <div class="room-main-container">
    <div class="room-left">
      <div v-if="roomInfo && roomInfo.isLive" class="room-left-video">
        <ArtPlayer
          ref="playerRef"
          :stream-url="streamUrl"
          :danmaku-enabled="danmakuEnabled"
          :danmaku-messages="danmakuMessages"
          @error="handlePlayerError"
          @ready="handlePlayerReady"
          class="room-left-video-play"
        />
      </div>
      <div v-else class="room-left-video-notLive">直播间未开播</div>
      <div class="room-left-info">
        <div class="room-left-info-head">
          <div class="head-pic-placeholder">{{ roomInfo?.ownerName?.charAt(0) || '?' }}</div>
        </div>
        <div class="room-left-info-after-head">
          <div class="room-left-info-after-head-name">
            <div :class="roomInfo?.isLive ? 'info-isLive' : 'info-notLive'">
              {{ roomInfo?.isLive ? '直播中' : '未开播' }}
            </div>
            {{ roomInfo?.roomName || '加载中...' }}
          </div>
          <div class="room-left-info-after-head-owner">
            斗鱼 · {{ roomInfo?.ownerName || '未知' }}
          </div>
        </div>
        <div class="room-left-info-right">
          <div class="room-left-info-right-link">
            <a :href="getRoomUrl()" target="_blank" title="跳转到直播间">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="room-right">
      <div class="room-right-top">
        直播聊天
      </div>
      <div ref="danmakuListRef" class="room-right-body" @scroll="handleScroll">
        <div class="room-right-body-danmu-box">
          <transition-group name="danmu">
            <div v-for="(msg, index) in danmakuMessages" :key="index" class="room-right-show-danmu">
              <span class="danmu-name">{{ msg.userName }}:</span>
              <span class="danmu-msg">{{ msg.message }}</span>
            </div>
          </transition-group>
        </div>
      </div>
      <div v-if="!isBottom" @click="scrollToBottom" class="to-bottom">
        返回底部
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArtPlayer from '@/components/ArtPlayer.vue'
import { DouyuDanmaku } from '@/services/douyuDanmaku'
import { DouyuLive } from '@/services/douyuLive'
import type { LiveMessage } from '@/types/danmaku'

const route = useRoute()
const router = useRouter()

const roomId = computed(() => route.params.id as string)
const playerRef = ref<InstanceType<typeof ArtPlayer> | null>(null)
const danmakuListRef = ref<HTMLElement | null>(null)

const streamUrl = ref('')
const danmakuMessages = ref<LiveMessage[]>([])
const danmakuEnabled = ref(true)
const roomInfo = ref<any>(null)
const isBottom = ref(true)

let douyuDanmaku: DouyuDanmaku | null = null
let douyuLive: DouyuLive | null = null

onMounted(async () => {
  douyuLive = new DouyuLive()
  douyuDanmaku = new DouyuDanmaku()

  // 设置弹幕回调
  douyuDanmaku.setCallbacks({
    onMessage: (msg: LiveMessage) => {
      danmakuMessages.value.push(msg)
      // 限制弹幕列表长度
      if (danmakuMessages.value.length > 200) {
        danmakuMessages.value.splice(0, 100)
      }
      // 自动滚动到底部
      nextTick(() => {
        if (isBottom.value) {
          scrollToBottom()
        }
      })
    },
    onClose: (msg: string) => {
      console.error('弹幕连接关闭:', msg)
    },
    onReady: () => {
      console.log('弹幕连接成功')
    },
  })

  // 获取房间信息
  await loadRoomInfo()
  
  // 加载直播流
  await loadStream()

  // 连接弹幕
  if (roomId.value) {
    douyuDanmaku.start(roomId.value)
  }
})

onUnmounted(() => {
  cleanup()
})

function getRoomUrl() {
  return `https://www.douyu.com/${roomId.value}`
}

async function loadRoomInfo() {
  if (!douyuLive) return

  const info = await douyuLive.getRoomInfo(roomId.value)
  
  if (info) {
    roomInfo.value = info
  }
}

async function loadStream() {
  if (!douyuLive) return

  const url = await douyuLive.getLiveStream(roomId.value)
  
  if (url) {
    streamUrl.value = url
  }
}

function handlePlayerError(message: string) {
  console.error('播放器错误:', message)
}

function handlePlayerReady() {
  console.log('播放器就绪')
}

function handleScroll() {
  if (!danmakuListRef.value) return
  
  const target = danmakuListRef.value
  const isAtBottom = (target.scrollHeight - target.clientHeight) - target.scrollTop <= 10
  isBottom.value = isAtBottom
}

function scrollToBottom() {
  nextTick(() => {
    if (danmakuListRef.value) {
      danmakuListRef.value.scrollTop = danmakuListRef.value.scrollHeight
    }
    isBottom.value = true
  })
}

function cleanup() {
  douyuDanmaku?.stop()
  douyuDanmaku = null
  douyuLive = null
  danmakuMessages.value = []
}
</script>

<style scoped>
.room-main-container {
  height: 100vh;
  width: 100%;
  display: flex;
  background: #0f0f1a;
}

.room-left {
  position: relative;
  width: 78%;
  height: 100%;
}

.room-left-video {
  position: absolute;
  width: 100%;
  background-color: #000;
  top: 0;
  left: 0;
  bottom: 80px;
}

.room-left-video-notLive {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 80px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: justify;
  font-weight: bolder;
  font-size: 25px;
  color: #939495;
  background-color: #000;
}

.room-left-video-play {
  width: 100%;
  height: 100%;
}

.room-left-info {
  width: 100%;
  height: 80px;
  position: absolute;
  bottom: 0;
  left: 0;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.room-left-info-head {
  float: left;
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
}

.head-pic-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.room-left-info-after-head {
  float: left;
  margin-left: 12px;
  margin-top: 8px;
}

.room-left-info-after-head-name {
  font-weight: bold;
  font-size: 18px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-isLive {
  height: 20px;
  padding: 0 8px;
  background-color: #ff4444;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: #fff;
  display: flex;
  align-items: center;
}

.info-notLive {
  height: 20px;
  padding: 0 8px;
  background-color: #666;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: #fff;
  display: flex;
  align-items: center;
}

.room-left-info-after-head-owner {
  margin-top: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.room-left-info-right {
  float: right;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 20px;
}

.room-left-info-right-link a {
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.room-left-info-right-link a:hover {
  color: #fff;
  transform: scale(1.1);
}

.room-right {
  width: 22%;
  height: 100%;
  position: relative;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.room-right-top {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: justify;
  font-weight: bold;
  font-size: 16px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.room-right-body {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px;
}

.room-right-body::-webkit-scrollbar {
  width: 6px;
}

.room-right-body::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
}

.room-right-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.room-right-body-danmu-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-right-show-danmu {
  font-size: 14px;
  color: #fff;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.danmu-name {
  font-weight: bold;
  color: #ff6b00;
}

.danmu-msg {
  color: rgba(255, 255, 255, 0.9);
}

.to-bottom {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 107, 0, 0.9);
  font-weight: bold;
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.to-bottom:hover {
  background-color: rgba(255, 107, 0, 1);
  transform: translateX(-50%) scale(1.05);
}

/* 弹幕动画 */
.danmu-enter-active,
.danmu-leave-active {
  transition: all 0.3s ease;
}

.danmu-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.danmu-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
