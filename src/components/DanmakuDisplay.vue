<template>
  <div class="danmaku-container" ref="containerRef">
    <transition-group name="danmaku">
      <div
        v-for="danmaku in danmakuList"
        :key="danmaku.id"
        class="danmaku-item"
        :style="{
          top: danmaku.top + 'px',
          color: `rgb(${danmaku.color.r}, ${danmaku.color.g}, ${danmaku.color.b})`,
          animationDuration: danmaku.duration + 's',
        }"
      >
        <span class="danmaku-name">{{ danmaku.userName }}:</span>
        <span class="danmaku-text">{{ danmaku.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { LiveMessage } from '@/types/danmaku'

interface DanmakuItem extends LiveMessage {
  id: number
  top: number
  duration: number
}

interface Props {
  messages: LiveMessage[]
  enabled?: boolean
  maxCount?: number
  speed?: number
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  maxCount: 50,
  speed: 8,
})

const containerRef = ref<HTMLElement | null>(null)
const danmakuList = ref<DanmakuItem[]>([])
let danmakuId = 0
let containerHeight = 0
let usedRows = new Set<number>()

onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight)
})

function updateContainerHeight() {
  if (containerRef.value) {
    containerHeight = containerRef.value.clientHeight
  }
}

watch(
  () => props.messages,
  (newMessages) => {
    if (!props.enabled) return

    // 只处理新消息
    const lastLength = danmakuList.value.length
    const newItems = newMessages.slice(lastLength)

    for (const msg of newItems) {
      addDanmaku(msg)
    }

    // 限制弹幕数量
    if (danmakuList.value.length > props.maxCount) {
      danmakuList.value = danmakuList.value.slice(-props.maxCount)
    }
  },
  { deep: true }
)

function addDanmaku(message: LiveMessage) {
  const rowHeight = 30 // 每行弹幕高度
  const maxRows = Math.floor(containerHeight / rowHeight)
  
  // 找到可用的行
  let row = findAvailableRow(maxRows)
  
  const danmaku: DanmakuItem = {
    id: ++danmakuId,
    ...message,
    top: row * rowHeight,
    duration: 10 + Math.random() * 5, // 10-15秒随机速度
  }

  danmakuList.value.push(danmaku)

  // 标记该行为已使用
  usedRows.add(row)

  // 弹幕动画结束后释放行
  setTimeout(() => {
    usedRows.delete(row)
    // 移除已显示的弹幕
    const index = danmakuList.value.findIndex(d => d.id === danmaku.id)
    if (index !== -1) {
      danmakuList.value.splice(index, 1)
    }
  }, danmaku.duration * 1000)
}

function findAvailableRow(maxRows: number): number {
  // 尝试找到一个未使用的行
  for (let i = 0; i < maxRows; i++) {
    if (!usedRows.has(i)) {
      return i
    }
  }
  // 如果所有行都被使用，随机选择一行
  return Math.floor(Math.random() * maxRows)
}

function clear() {
  danmakuList.value = []
  usedRows.clear()
}

defineExpose({
  clear,
})
</script>

<style scoped>
.danmaku-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 5;
}

.danmaku-item {
  position: absolute;
  right: -100%;
  white-space: nowrap;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  animation: danmaku-scroll linear forwards;
}

.danmaku-name {
  color: #ff6b00;
  margin-right: 4px;
}

.danmaku-text {
  color: #fff;
}

@keyframes danmaku-scroll {
  from {
    right: -100%;
  }
  to {
    right: 100%;
  }
}

.danmaku-enter-active,
.danmaku-leave-active {
  transition: all 0.3s ease;
}

.danmaku-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.danmaku-leave-to {
  opacity: 0;
}
</style>
