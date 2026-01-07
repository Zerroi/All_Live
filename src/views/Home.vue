<template>
  <div class="home">
    <aside class="home-aside">
      <router-link class="home-aside-item" to="/home/recommend">
        <div class="home-aside-item-icon">🏠</div>
        <div class="home-aside-item-words">推荐</div>
      </router-link>

      <router-link class="home-aside-item" to="/home/follow">
        <div class="home-aside-item-icon">⭐</div>
        <div class="home-aside-item-words">关注</div>
      </router-link>
    </aside>

    <main class="home-main">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  console.log('Home mounted')
})

onUnmounted(() => {
  console.log('Home unmounted')
})
</script>

<style scoped>
.home {
  display: flex;
  height: 100vh;
  background: #0f0f1a;
}

.home-aside {
  width: 130px;
  padding-top: 10px;
  height: 100%;
  box-shadow: 5px 0px 5px -5px #4e4c4c;
  overflow: hidden;
  position: relative;
  background: #1a1a2e;
}

.home-aside-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  padding-left: 20px;
  width: 100%;
  height: 50px;
  transition: all 0.3s;
  text-decoration: none;
  color: #e0e0e0;
}

.home-aside-item:hover {
  cursor: pointer;
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.1);
}

.home-aside-item.router-link-active {
  background: rgba(255, 107, 0, 0.2);
  color: #ff6b00;
  font-weight: bold;
}

.home-aside-item-icon {
  font-size: 20px;
  margin-right: 10px;
}

.home-aside-item-words {
  font-size: 14px;
  font-weight: 300;
}

.home-main {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 20px;
}

.home-main::-webkit-scrollbar {
  width: 8px;
}

.home-main::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: #8e8e8e;
}

.home-main::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
</style>
