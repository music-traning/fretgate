<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePlayerStore } from '@/stores/playerStore';
import { useRouter } from 'vue-router';

const store = usePlayerStore();
const router = useRouter();

const message = ref('「……なんだ。　また　へんなクセを　つけてきたのか」');
const CURSE_COST = 2000;

const SENSEI_QUOTES: Record<number, string> = {
  80: '「ペンタトニックは　逃げ場所ではない。　あくまで　スケールの　一部だ」',
  81: '「耳は　ギタリストの　命だ。　スタジオでは　耳栓を　しろ」',
  82: '「リズムとは　点ではない。　円だ。　ウラ拍を　感じろ」',
  83: '「脱力だ。　無駄な力が　お前の　寿命を　縮めているぞ」',
  84: '「金銭感覚も　プロの　資質だ。　ご利用は　計画的にな」',
  85: '「機材で　音を　作るな。　指で　作れ。　弘法　筆を　選ばずだ」',
  86: '「スランプか？　それは　お前が　成長しようと　あがいている　証拠だ」',
  87: '「立ち位置を　変えろ。　アンプと　向き合うな。　基本だぞ」',
  88: '「客を　カボチャだと　思うな。　……金ヅルだと　思え」',
  89: '「迷ったら　全部　12時（フラット）に　戻せ。　そこが　スタートだ」',
  90: '「別れは　新しい　出会いの　始まりだ。　ソロギターの　練習でも　しておけ」',
};

const cursedItems = computed(() => {
  return store.state.inventory.map((id: number, index: number) => {
    const detail = store.getItemDetail(id);
    return detail && detail.type === 'curse' ? { ...detail, originalIndex: index } : null;
  }).filter((item): item is any => item !== null);
});

const cleanse = (item: any) => {
  if (confirm(`レッスン料 ${CURSE_COST} J-Coinで、\n「${item.name}」を　きょうせい　しますか？`)) {
    if (store.removeCurse(item.originalIndex, CURSE_COST)) {
      const quote = SENSEI_QUOTES[item.id] || '「よし。　毒は　抜けたぞ。　基礎練習を　おこたるな」';
      message.value = quote;
    } else {
      message.value = '「……レッスン料が　たりないぞ。　バイトでもしてこい」';
    }
  }
};

const backToTown = () => {
  router.push('/town');
};
</script>

<template>
  <div class="dojo-container">
    <div class="master-area">
      <div class="face">👴</div>
      <div class="dialog-box">
        <p class="name">理論の師匠</p>
        <p>{{ message }}</p>
      </div>
    </div>

    <div class="main-content">
      <h2>【 呪い矯正（カース・リムーブ） 】</h2>
      <p class="info">料金: 一律 {{ CURSE_COST }} J / 回</p>

      <ul class="curse-list">
        <li v-if="cursedItems.length === 0" class="empty">
          （のろわれた　アイテムは　もっていないようだ）
        </li>
        <li v-for="item in cursedItems" :key="item.originalIndex">
          <div class="item-row">
            <span class="curse-name">{{ item.name }}</span>
            <button @click="cleanse(item)" class="cleanse-btn">矯正する</button>
          </div>
          <small>{{ item.description }}</small>
        </li>
      </ul>
      
      <button class="back-btn" @click="backToTown">まちへ　もどる</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dojo-container {
  /* ▼ 修正: 高さを画面サイズに固定し、スクロールはこの中で完結させる */
  height: 100vh;
  overflow-y: auto; 
  padding: 20px;
  background: #110d0d; color: #e0e0e0;
  font-family: 'DotGothic16', sans-serif;
  display: flex; flex-direction: column;
  box-sizing: border-box; /* パディングを含めたサイズ計算 */
}

.master-area {
  display: flex; gap: 20px; align-items: center; margin-bottom: 20px;
  flex-shrink: 0; /* スクロールしても師匠の顔が潰れないように */

  .face { font-size: 4rem; background: #333; border-radius: 50%; width: 80px; height: 80px; text-align: center; line-height: 80px; border: 2px solid #fff; flex-shrink: 0; }
  .dialog-box {
    flex: 1; border: 2px solid #fff; padding: 15px; background: #000;
    .name { color: #aaa; font-size: 0.8rem; margin-bottom: 5px; }
  }
}

.main-content {
  flex: 1; /* 残りのスペースを埋める */
  display: flex; flex-direction: column;
  border: 1px solid #444; padding: 20px; background: rgba(0,0,0,0.5);
  margin-bottom: 20px;
}

h2 { color: #d32f2f; text-shadow: 0 0 10px #d32f2f; margin-top: 0; font-size: 1.5rem; flex-shrink: 0; }
.info { text-align: right; color: #aaa; margin-bottom: 10px; flex-shrink: 0; }

.curse-list {
  list-style: none; padding: 0; margin-top: 10px;
  /* リスト自体は親のスクロールに任せる */
  li { border-bottom: 1px dashed #444; padding: 15px 0; }
}

.item-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; flex-wrap: wrap; gap: 10px; }
.curse-name { color: #e57373; font-size: 1.2rem; }
.cleanse-btn {
  background: #d32f2f; color: #fff; border: none; padding: 8px 20px; cursor: pointer;
  &:hover { background: #ff5252; }
}

.back-btn {
  width: 100%; padding: 15px; margin-top: 20px;
  background: transparent; border: 1px solid #fff; color: #fff; cursor: pointer;
  flex-shrink: 0;
  &:hover { background: #fff; color: #000; }
}
</style>