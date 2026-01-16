import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// ▼ 追加
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // ▼ 追加: PWA設定
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'theme.mid'], // 必要な静的ファイル
      manifest: {
        name: 'FRETGATE',
        short_name: 'FRETGATE',
        description: 'The 6-String Magician Training Game',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone', // これがフルスクリーンにする魔法
        orientation: 'landscape', // 横画面推奨なら指定（任意）
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})