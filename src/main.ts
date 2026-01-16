import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './style.css'

import { inject } from '@vercel/analytics'

// 本番環境でのみ計測（開発中はカウントされない設定）
inject()

// ▼ 以前のService Workerが残っている場合に強制削除する処理
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            registration.unregister().then((boolean) => {
                if (boolean) console.log('Old Service Worker unregistered.');
            });
        }
        // 強制リロードが必要な場合があるため、キャッシュもクリア（念のため）
        if (registrations.length > 0) {
            caches.keys().then((names) => {
                for (let name of names) caches.delete(name);
            });
        }
    });
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')