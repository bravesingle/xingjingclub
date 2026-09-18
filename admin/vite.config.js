import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // host: true 监听 0.0.0.0（供 Docker 容器/局域网访问，Cloudflare 隧道演示需要）
    host: true,
    port: 5173,
    open: false,
    // Cloudflare 临时隧道域名放行（quick tunnel 域名每次重启会变，用 .trycloudflare.com 通配）
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      // 同源代理：/api、/uploads → 后端 3000（本地开发 + Cloudflare 临时演示共用）
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:3000', changeOrigin: true }
    }
  },
  build: {
    chunkSizeWarningLimit: 1500
  }
})
