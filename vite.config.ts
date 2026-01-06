import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/douyu': {
        target: 'https://www.douyu.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/douyu/, ''),
        ws: false,
      },
    },
  },
})
