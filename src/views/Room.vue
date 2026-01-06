<template>
  <div class="room">
    <div class="room-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <div class="room-info">
        <h2 v-if="roomInfo" class="room-name">{{ roomInfo.roomName }}</h2>
        <p v-if="roomInfo" class="room-owner">主播：{{ roomInfo.ownerName }}</p>
        <div v-if="roomInfo && roomInfo.isLive" class="live-badge">直播中</div>
        <div v-else class="offline-badge">未开播</div>
      </div>
      <div class="room-id">房间ID: {{ roomId }}</div>
    </div>

    <div class="room-content">
      <div class="video-container">
        <LivePlayer
          ref="playerRef"
          :stream-url="streamUrl"
          @error="handlePlayerError"
          @ready="handlePlayerReady"
        />
        <DanmakuDisplay
          ref="danmakuDisplayRef"
          :messages="danmakuMessages"
          :enabled="danmakuEnabled"
        />
      </div>

      <div class="control-panel">
        <div class="control-row">
          <button @click="toggleDanmaku" class="control-btn" :class="{ active: danmakuEnabled }">
            {{ danmakuEnabled ? '弹幕: 开' : '弹幕: 关' }}
          </button>
          <button @click="refreshStream" class="control-btn">刷新直播流</button>
        </div>

        <div class="status-bar">
          <span v-if="connectionStatus" class="status-text" :class="connectionStatus.type">
            {{ connectionStatus.message }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LivePlayer from '@/components/LivePlayer.vue'
import DanmakuDisplay from '@/components/DanmakuDisplay.vue'
import { DouyuDanmaku } from '@/services/douyuDanmaku'
import { DouyuLive } from '@/services/douyuLive'
import type { LiveMessage } from '@/types/danmaku'

const route = useRoute()
const router = useRouter()

const roomId = computed(() => route.params.id as string)
const playerRef = ref<InstanceType<typeof LivePlayer> | null>(null)
const danmakuDisplayRef = ref<InstanceType<typeof DanmakuDisplay> | null>(null)

const streamUrl = ref('')
const danmakuMessages = ref<LiveMessage[]>([])
const danmakuEnabled = ref(true)
const roomInfo = ref<any>(null)
const connectionStatus = ref<{ type: string; message: string } | null>(null)

let douyuDanmaku: DouyuDanmaku | null = null
let douyuLive: DouyuLive | null = null

onMounted(async () => {
  douyuLive = new DouyuLive()
  douyuDanmaku = new DouyuDanmaku()

  // 设置弹幕回调
  douyuDanmaku.setCallbacks({
    onMessage: (msg: LiveMessage) => {
      danmakuMessages.value.push(msg)
    },
    onClose: (msg: string) => {
      showStatus('error', msg)
    },
    onReady: () => {
      showStatus('success', '弹幕连接成功')
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

function goBack() {
  router.push('/')
}

async function loadRoomInfo() {
  if (!douyuLive) return

  showStatus('info', '正在获取房间信息...')
  const info = await douyuLive.getRoomInfo(roomId.value)
  
  if (info) {
    roomInfo.value = info
    if (info.isLive) {
      showStatus('success', '正在直播')
    } else {
      showStatus('warning', '主播未开播')
    }
  } else {
    showStatus('error', '获取房间信息失败')
  }
}

async function loadStream() {
  if (!douyuLive) return

  showStatus('info', '正在加载直播流...')
  const url = await douyuLive.getLiveStream(roomId.value)
  
  if (url) {
    streamUrl.value = url
  } else {
    showStatus('error', '无法获取直播流，可能未开播或房间不存在')
  }
}

function handlePlayerError(message: string) {
  showStatus('error', message)
}

function handlePlayerReady() {
  showStatus('success', '直播流加载成功')
}

function toggleDanmaku() {
  danmakuEnabled.value = !danmakuEnabled.value
}

function refreshStream() {
  loadStream()
}

function showStatus(type: 'info' | 'success' | 'warning' | 'error', message: string) {
  connectionStatus.value = { type, message }
  setTimeout(() => {
    connectionStatus.value = null
  }, 5000)
}

function cleanup() {
  douyuDanmaku?.stop()
  douyuDanmaku = null
  douyuLive = null
  danmakuMessages.value = []
}
</script>

<style scoped>
.room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f0f1a;
}

.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn {
  padding: 8px 16px;
  font-size: 14px;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.room-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0 24px;
}

.room-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin: 0;
}

.room-owner {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.live-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  background: #ff4444;
  border-radius: 4px;
}

.offline-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  background: #666;
  border-radius: 4px;
}

.room-id {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.room-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.video-container {
  flex: 1;
  position: relative;
  background: #000;
}

.control-panel {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.control-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.control-btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.control-btn.active {
  background: #ff6b00;
}

.status-bar {
  min-height: 24px;
}

.status-text {
  font-size: 14px;
}

.status-text.info {
  color: #2196f3;
}

.status-text.success {
  color: #4caf50;
}

.status-text.warning {
  color: #ff9800;
}

.status-text.error {
  color: #f44336;
}
</style>
