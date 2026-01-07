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
import {computed, nextTick, onMounted, onUnmounted, ref} from 'vue'
import {useRoute} from 'vue-router'
import ArtPlayer from '@/components/ArtPlayer.vue'
import {DouyuDanmaku} from '@/services/douyuDanmaku'
import {DouyuLive} from '@/services/douyuLive'
import type {LiveMessage} from '@/types/danmaku'

const route = useRoute()

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
  isBottom.value = (target.scrollHeight - target.clientHeight) - target.scrollTop <= 10
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
  height: 100%;
  width: 100%;
}

.room-left {
  position: relative;
  width: 78%;
  height: 100%;
}

.room-left-video {
  position: absolute;
  width: 100%;
  background-color: black;
  top: 0px;
  left: 0px;
  bottom: 80px;
}

.room-left-video-notLive {
  position: absolute;
  top: 0px;
  left: 0px;
  bottom: 80px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: justify;
  font-weight: bolder;
  font-size: 25px;
  color: #939495;
  background-color: black;
}

.room-left-video-play {
  width: 100%;
  height: 100%;
}

.room-left-info {
  width: 100%;
  height: 80px;
  position: absolute;
  bottom: 0px;
  left: 0px;
}

.room-left-info-head {
  float: left;
  margin-top: 9px;
  margin-left: 8px;
  width: 60px;
  height: 60px;
  box-shadow: #2b2b2b 0px 0px 5px 1px;
  border-radius: 10px;
}

.head-pic-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.room-left-info-after-head {
  float: left;
  margin-left: 10px;
  margin-top: 8px;
}

.room-left-info-after-head-name {
  font-weight: bold;
  font-size: 20px;
}

.info-isLive {
  margin-top: 6px;
  margin-right: 5px;
  float: left;
  height: 18px;
  width: 45px;
  background-color: #c10f0f;
  border-radius: 10px;
  font-size: 5px;
  font-weight: 600;
  text-align: center;
  color: #F3F6F8;
}

.info-notLive {
  margin-top: 6px;
  margin-right: 5px;
  float: left;
  height: 18px;
  width: 45px;
  background-color: #979797;
  border-radius: 10px;
  font-size: 5px;
  font-weight: 600;
  text-align: center;
  color: #F3F6F8;
}

.room-left-info-after-head-owner {
  margin-top: 10px;
  font-weight: bold;
  font-size: 15px;
}

.room-left-info-right {
  float: right;
  margin-top: 8px;
  margin-right: 10px;
  font-size: 35px;
}

.room-left-info-right-link {
  margin-top: 5px;
  float: right;
  margin-right: 25px;
  transition: all 0.2s;
}

.room-left-info-right-link:hover {
  cursor: pointer;
  transform: scale(1.2);
}

.room-left-info-right-link a {
  color: #4e4c4c;
  text-decoration: none;
}

.room-left-info-right-link a:hover {
  text-decoration: underline;
  color: #4e4c4c;
}

.room-right {
  width: 22%;
  height: 92%;
  position: fixed;
  top: 50px;
  right: 0px;
  border-left: 1px solid #c8c8c9;
}

.room-right-top {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: justify;
  font-weight: bold;
  font-size: 20px;
  border-bottom: 1px solid #c8c8c9;
}

.room-right-body {
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  position: absolute;
  top: 40px;
  bottom: 0px;
}

.room-right-body::-webkit-scrollbar {
  width: 8px;
}

.room-right-body::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: #8e8e8e;
}

.room-right-body-danmu-box {
  display: flex;
  flex-direction: column;
}

.room-right-show-danmu {
  margin-top: 10px;
  margin-left: 10px;
  font-size: 15px;
  width: 94%;
}

.danmu-name {
  float: left;
  font-weight: bold;
}

.danmu-msg {
  margin-left: 5px;
  font-weight: normal;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
}

.to-bottom {
  position: absolute;
  bottom: 80px;
  background-color: rgba(54, 51, 51, 0.7);
  font-weight: bold;
  color: #ffffff;
  left: 37%;
  height: 30px;
  border-radius: 20px;
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: justify;
}

.to-bottom:hover {
  cursor: pointer;
  background-color: #4e4c4c;
}
</style>
