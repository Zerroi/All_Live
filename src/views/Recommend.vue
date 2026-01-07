<template>
  <div class="recommend-page">
    <h1 class="page-title">推荐直播</h1>
    
    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="rooms.length === 0" class="empty">
      暂无推荐直播
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
        </div>
        <div class="room-info">
          <div class="room-title">{{ room.title }}</div>
          <div class="room-user">{{ room.userName }}</div>
        </div>
      </div>
    </div>

    <div v-if="hasMore && !loading" class="load-more" @click="loadMore">
      加载更多
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
const hasMore = ref(false)
const currentPage = ref(1)

onMounted(() => {
  loadRooms()
})

async function loadRooms() {
  if (loading.value) return
  
  loading.value = true
  try {
    const result = await douyuLive.getRecommendRooms(currentPage.value)
    rooms.value = [...rooms.value, ...result.items]
    hasMore.value = result.hasMore
  } catch (error) {
    console.error('加载推荐直播失败:', error)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (hasMore.value && !loading.value) {
    currentPage.value++
    loadRooms()
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
.recommend-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 24px;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
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

.load-more {
  text-align: center;
  padding: 16px;
  background: rgba(255, 107, 0, 0.2);
  color: #ff6b00;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  font-weight: 500;
}

.load-more:hover {
  background: rgba(255, 107, 0, 0.3);
}
</style>
