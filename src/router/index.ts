import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home/recommend',
  },
  {
    path: '/home',
    component: () => import('@/views/Home.vue'),
    children: [
      {
        path: 'recommend',
        name: 'Recommend',
        component: () => import('@/views/Recommend.vue'),
      },
      {
        path: 'follow',
        name: 'Follow',
        component: () => import('@/views/Follow.vue'),
      },
    ],
  },
  {
    path: '/room/:id',
    name: 'Room',
    component: () => import('@/views/Room.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
