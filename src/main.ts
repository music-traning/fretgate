import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './style.css'

import { inject } from '@vercel/analytics'

// 本番環境でのみ計測（開発中はカウントされない設定）
inject()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')