<template>
  <div class="artplayer-wrapper">
    <div ref="artPlayerRef" class="artplayer-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Artplayer from 'artplayer'
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'
import type { LiveMessage } from '@/types/danmaku'

interface Props {
  streamUrl: string
  danmakuEnabled?: boolean
  danmakuMessages?: LiveMessage[]
}

interface Emits {
  (e: 'error', message: string): void
  (e: 'ready'): void
}

const props = withDefaults(defineProps<Props>(), {
  danmakuEnabled: true,
  danmakuMessages: () => []
})

const emit = defineEmits<Emits>()

const artPlayerRef = ref<HTMLDivElement | null>(null)
let artPlayer: Artplayer | null = null
let danmakuPlugin: any = null

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  if (artPlayer) {
    artPlayer.destroy()
    artPlayer = null
  }
})

watch(
  () => props.streamUrl,
  (newUrl) => {
    if (artPlayer && newUrl) {
      artPlayer.switchUrl(newUrl)
    }
  }
)

watch(
  () => props.danmakuMessages,
  (newMessages) => {
    if (danmakuPlugin && props.danmakuEnabled && newMessages.length > 0) {
      // 获取最新的一条消息
      const latestMessage = newMessages[newMessages.length - 1]
      if (latestMessage) {
        danmakuPlugin.emit({
          text: `${latestMessage.userName}: ${latestMessage.message}`,
          color: '#FFFFFF',
        })
      }
    }
  },
  { deep: true }
)

watch(
  () => props.danmakuEnabled,
  (enabled) => {
    if (danmakuPlugin) {
      danmakuPlugin.show = enabled
    }
  }
)

function initPlayer() {
  if (!artPlayerRef.value || !props.streamUrl) return

  artPlayer = new Artplayer({
    container: artPlayerRef.value,
    url: props.streamUrl,
    volume: 0.7,
    isLive: true,
    muted: false,
    autoplay: true,
    pip: true,
    autoSize: true,
    autoMini: true,
    screenshot: true,
    setting: true,
    loop: true,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    theme: '#ff6b00',
    lang: 'zh-cn',
    moreVideoAttr: {
      crossOrigin: 'anonymous',
    },
    customType: {
      m3u8: function (video: HTMLVideoElement, url: string) {
        // 如果需要支持 m3u8，可以在这里集成 hls.js
        video.src = url
      },
    },
    plugins: [
      artplayerPluginDanmuku({
        danmuku: [], // 初始弹幕列表为空，通过 watch 动态添加
        speed: 5, // 弹幕持续时间，范围在[1 ~ 10]
        margin: [10, '25%'], // 弹幕上下边距，支持像素数字和百分比
        opacity: 1, // 弹幕透明度，范围在[0 ~ 1]
        color: '#FFFFFF', // 默认弹幕颜色，可以被单独弹幕项覆盖
        mode: 0, // 默认弹幕模式: 0: 滚动，1: 顶部，2: 底部
        modes: [0, 1, 2], // 弹幕可见的模式
        fontSize: 25, // 弹幕字体大小，支持像素数字和百分比
        antiOverlap: true, // 弹幕是否防重叠
        synchronousPlayback: false, // 是否同步播放速度
        mount: undefined, // 弹幕发射器挂载点, 默认为播放器控制栏中部
        heatmap: true, // 是否开启热力图
        width: 512, // 当播放器宽度小于此值时，弹幕发射器置于播放器底部
        points: [], // 热力图数据
        filter: (danmu: any) => danmu.text.length <= 100, // 弹幕载入前的过滤器
        beforeVisible: () => true, // 弹幕显示前的过滤器，返回 true 则可以发送
        visible: true, // 弹幕层是否可见
        emitter: true, // 是否开启弹幕发射器
        maxLength: 200, // 弹幕输入框最大长度, 范围在[1 ~ 1000]
        lockTime: 5, // 输入框锁定时间，范围在[1 ~ 60]
        theme: 'dark', // 弹幕主题，支持 dark 和 light，只在自定义挂载时生效
        // 手动发送弹幕前的过滤器，返回 true 则可以发送，可以做存库处理
        beforeEmit(danmu: any) {
          return new Promise((resolve) => {
            console.log('发送弹幕:', danmu)
            setTimeout(() => {
              resolve(true)
            }, 100)
          })
        },
      }),
    ],
  })

  // 获取弹幕插件实例
  artPlayer.on('ready', () => {
    emit('ready')
    // 获取插件实例
    const plugins = artPlayer?.plugins || {}
    danmakuPlugin = Object.values(plugins).find((plugin: any) => plugin.name === 'artplayer-plugin-danmuku')
  })

  artPlayer.on('error', (error: any) => {
    emit('error', error.message || '播放器加载失败')
  })
}

defineExpose({
  getPlayer: () => artPlayer,
})
</script>

<style scoped>
.artplayer-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

.artplayer-container {
  width: 100%;
  height: 100%;
}

:deep(.artplayer) {
  width: 100%;
  height: 100%;
}

:deep(.artplayer-video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
