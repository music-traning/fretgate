import { createRouter, createWebHistory } from 'vue-router'
import OpeningView from '@/views/OpeningView.vue'
import TownView from '@/views/TownView.vue'       // 新しい街メニュー
import ShopView from '@/views/ShopView.vue'       // 喫茶店
import DojoView from '@/views/DojoView.vue'       // 師匠の家（これから作る）
import DungeonView from '@/views/DungeonView.vue' // ダンジョン

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Opening',
      component: OpeningView
    },
    {
      path: '/town',
      name: 'Town',
      component: TownView // ここが拠点のトップ
    },
    {
      path: '/cafe',      // 喫茶店は専用のURLへ移動
      name: 'Cafe',
      component: ShopView
    },
    {
      path: '/dojo',      // 師匠の家
      name: 'Dojo',
      component: DojoView
    },
    {
      path: '/dungeon/:stageId', // ステージIDを受け取れるように変更
      name: 'Dungeon',
      component: DungeonView
    },
    {
      path: '/ending',
      name: 'ending',
      component: () => import('../views/EndingView.vue')
    }
  ]
})

export default router