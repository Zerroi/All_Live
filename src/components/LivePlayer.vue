<template>
  <div class="live-player">
    <video
      ref="videoRef"
      class="video-player"
      controls
      autoplay
      playsinline
      :src="streamUrl"
      @error="handleError"
      @loadedmetadata="handleLoadedMetadata"
    ></video>
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在加载直播流...</p>
    </div>
    <div v-if="error" class="error-overlay">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

interface Props {
  streamUrl: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  error: [message: string]
  ready: []
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const loading = ref(true)
const error = ref('')

watch(
  () => props.streamUrl,
  (newUrl) => {
    if (newUrl) {
      loadStream(newUrl)
    }
  },
  { immediate: true }
)

function loadStream(url: string) {
  loading.value = true
  error.value = ''
  
  if (videoRef.value) {
    videoRef.value.src = url
    videoRef.value.load()
  }
}

function handleError() {
  loading.value = false
  error.value = '加载直播流失败，请检查房间ID是否正确或是否正在直播'
  emit('error', error.value)
}

function handleLoadedMetadata() {
  loading.value = false
  emit('ready')
}

function retry() {
  if (props.streamUrl) {
    loadStream(props.streamUrl)
  }
}

function play() {
  videoRef.value?.play()
}

function pause() {
  videoRef.value?.pause()
}

function getVideoElement() {
  return videoRef.value
}

onUnmounted(() => {
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.src = ''
  }
})

defineExpose({
  play,
  pause,
  getVideoElement,
})
</script>

<style scoped>
.live-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  z-index: 10;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-overlay p {
  margin-bottom: 16px;
  text-align: center;
  padding: 0 20px;
}

.retry-btn {
  padding: 10px 24px;
  background: #ff6b00;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #ff8533;
}
</style>
