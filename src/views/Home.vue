<template>
  <div class="home">
    <div class="home-container">
      <h1 class="title">斗鱼直播</h1>
      <p class="subtitle">输入房间ID开始观看</p>
      
      <div class="search-box">
        <input
          v-model="roomId"
          type="text"
          placeholder="请输入房间ID"
          class="room-input"
          @keyup.enter="goToRoom"
        />
        <button @click="goToRoom" class="go-btn">进入直播间</button>
      </div>

      <div class="tips">
        <p>提示：输入斗鱼直播间的房间ID即可观看</p>
        <p>例如：房间ID 9999 可以进入官方直播间</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const roomId = ref('')

function goToRoom() {
  const id = roomId.value.trim()
  if (id) {
    router.push(`/room/${id}`)
  }
}
</script>

<style scoped>
.home {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.home-container {
  text-align: center;
  padding: 60px 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 500px;
  width: 90%;
}

.title {
  font-size: 48px;
  font-weight: bold;
  color: #ff6b00;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
}

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.room-input {
  flex: 1;
  padding: 14px 20px;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  outline: none;
  transition: all 0.3s;
}

.room-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.room-input:focus {
  border-color: #ff6b00;
  background: rgba(255, 255, 255, 0.15);
}

.go-btn {
  padding: 14px 30px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.go-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
}

.go-btn:active {
  transform: translateY(0);
}

.tips {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  line-height: 1.8;
}

.tips p {
  margin: 4px 0;
}
</style>
