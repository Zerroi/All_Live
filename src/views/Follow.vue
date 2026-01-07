<template>
  <div class="follow-page">
    <h1 class="page-title">我的关注</h1>
    
    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="rooms.length === 0" class="empty">
      <div class="empty-icon">⭐</div>
      <div class="empty-text">暂无关注的直播</div>
      <div class="empty-tip">登录后可以查看关注的主播</div>
    </div>

    <div v-else class="room-grid">
      <div
        v-for="room in rooms"
        :key="room.roomId"
        class="room-card"
        @click="goToRoom(room.roomId)"
      >
        <div class="room-cover">
          <img :src="room.cover" :alt="room.title" />
          <div class="room-online">{{ formatOnline(room.online) }}</div>
          <div class="room-live-badge">直播中</div>
        </div>
        <div class="room-info">
          <div class="room-title">{{ room.title }}</div>
          <div class="room-user">{{ room.userName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DouyuLive, type LiveRoomItem } from '@/services/douyuLive'

const router = useRouter()
const douyuLive = new DouyuLive()

const rooms = ref<LiveRoomItem[]>([])
const loading = ref(false)

onMounted(() => {
  loadRooms()
})

async function loadRooms() {
  loading.value = true
  try {
    const result = await douyuLive.getFollowRooms()
    rooms.value = result
  } catch (error) {
    console.error('加载关注列表失败:', error)
  } finally {
    loading.value = false
  }
}

function goToRoom(roomId: string) {
  router.push(`/room/${roomId}`)
}

function formatOnline(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}
</script>

<style scoped>
.follow-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 24px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

.empty {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.empty-tip {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.room-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.room-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.room-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 比例 */
  background: #2a2a3e;
  overflow: hidden;
}

.room-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-online {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
}

.room-live-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  background: #ff6b00;
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 500;
}

.room-info {
  padding: 12px;
}

.room-title {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-user {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
