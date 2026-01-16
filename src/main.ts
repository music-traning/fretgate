import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css' // CSSがあれば

// ▼ 追加: Vercel Analytics のインポート
import { inject } from '@vercel/analytics'

// ▼ 追加: アナリティクスの初期化
inject()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')