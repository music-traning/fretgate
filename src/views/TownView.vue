<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/playerStore';
import { useSoundStore } from '@/stores/soundStore';

const router = useRouter();
const store = usePlayerStore();
const soundStore = useSoundStore();

// UI状態管理
const showLevelSelect = ref(false);
const showHelp = ref(false);

// マニュアル用言語設定 ('ja' | 'en')
const manualLang = ref<'ja' | 'en'>('ja');

const toggleManualLang = () => {
  manualLang.value = manualLang.value === 'ja' ? 'en' : 'ja';
  soundStore.playSe('decision');
};

const STAGES = [
  { id: 1, name: "Stage 1: Cメジャーの廃墟", desc: "白鍵のみ。初心者の墓場。" },
  { id: 2, name: "Stage 2: 臨時記号の地下墓地", desc: "黒鍵（#）が登場する。" },
  { id: 3, name: "Stage 3: 五度圏の塔", desc: "低音弦（5,6弦）縛り。" },
  { id: 4, name: "Stage 4: 煉獄のミッドレンジ", desc: "中音域（3,4弦）縛り。" },
  { id: 5, name: "Stage 5: 魔城フレットゲイト", desc: "全弦・全フレット総力戦。" },
];

const goToStage = (stageId: number) => {
  if (store.state.maxStageReached < stageId) {
    soundStore.playSe('cancel');
    return;
  }
  soundStore.playSe('decision');
  router.push(`/dungeon/${stageId}`);
};

const goToCafe = () => { soundStore.playSe('decision'); router.push('/cafe'); };
const goToDojo = () => { soundStore.playSe('decision'); router.push('/dojo'); };
const openMission = () => { soundStore.playSe('decision'); showLevelSelect.value = true; };
const openHelp = () => { soundStore.playSe('decision'); showHelp.value = true; };
const closeHelp = () => { soundStore.playSe('cancel'); showHelp.value = false; };
const closeMission = () => { soundStore.playSe('cancel'); showLevelSelect.value = false; };
</script>

<template>
  <div class="town-container">
    <div class="cyber-grid"></div>
    
    <header class="town-header">
      <h1>NEO-OSAKA</h1>
      <div class="player-status">
        <span>J-COIN: {{ store.state.jCoin }}</span>
      </div>
    </header>

    <main class="menu-grid">
      <button class="menu-card cafe" @click="goToCafe">
        <span class="icon">☕</span>
        <span class="label">JAZZ CAFE</span>
      </button>

      <button class="menu-card dojo" @click="goToDojo">
        <span class="icon">🏯</span>
        <span class="label">DOJO</span>
      </button>

      <button class="menu-card mission" @click="openMission">
        <span class="icon">⚔️</span>
        <span class="label">MISSION</span>
      </button>

      <button class="menu-card help" @click="openHelp">
        <span class="icon">?</span>
        <span class="label">MANUAL</span>
      </button>
    </main>

    <div v-if="showLevelSelect" class="modal-overlay" @click.self="closeMission">
      <div class="modal-window">
        <h2>>> SELECT MISSION</h2>
        <ul class="stage-list">
          <li 
            v-for="stage in STAGES" 
            :key="stage.id"
            :class="{ locked: store.state.maxStageReached < stage.id }"
            @click="goToStage(stage.id)"
          >
            <span class="stage-id">0{{ stage.id }}</span>
            <div class="stage-info">
              <span class="name">{{ stage.name }}</span>
              <small class="desc">{{ stage.desc }}</small>
            </div>
            <span class="status" v-if="store.state.maxStageReached < stage.id">LOCK</span>
            <span class="status open" v-else>OPEN</span>
          </li>
        </ul>
        <button class="close-btn" @click="closeMission">CLOSE</button>
      </div>
    </div>

    <div v-if="showHelp" class="modal-overlay" @click.self="closeHelp">
      <div class="modal-window help-window">
        <div class="help-header">
          <h2>>> SYSTEM MANUAL</h2>
          <button class="lang-btn" @click="toggleManualLang">
            {{ manualLang === 'ja' ? 'EN' : 'JP' }}
          </button>
        </div>
        
        <div class="help-content-scroll">
          <div v-if="manualLang === 'ja'" class="manual-ja">
            <section>
              <h3>1. ゲームの目的</h3>
              <p>あなたはギターの指板を覚えたいギタリストです。画面に表示される音（C, F#など）と同じ音を、指板上のフレットをクリックして答えてください。</p>
            </section>

            <section>
              <h3>2. 命のともしび「松明（TORCH）」</h3>
              <p>時間経過とともに画面上の緑色のゲージ（松明）が減っていきます。0になるとゲームオーバーです。正解すると少し回復します。</p>
            </section>

            <section>
              <h3>3. コンボとRUSHモード</h3>
              <p>正解すると「RUSHモード」に入ります。この間、<span class="highlight">「直前に弾いた弦とは違う弦」</span>で同じ音を正解し続けるとコンボボーナスが発生します。</p>
              <p class="hint">コツ：同じ弦を連続で弾くとコンボが終了してしまいます。指板全体を広く使いましょう。</p>
            </section>

            <section>
              <h3>4. 経済とWIZシステム</h3>
              <p>手に入れたアイテムは「JAZZ CAFE」で売ることができます。あなたが売ったアイテムは、その後<span class="highlight">店の在庫として店頭に並びます。</span>レアなアイテムを誤って売ってしまっても、お金さえあれば買い戻せます。</p>
            </section>

            <section>
              <h3>5. 呪いと道場</h3>
              <p>ダンジョンで拾うアイテムには「呪い」がかかっていることがあります。呪われたアイテムは持っているだけで悪影響を及ぼしますが、「DOJO」で師匠にお金を払えば浄化（アイテム化）できます。</p>
            </section>
            
            <section>
              <h3>6. アプリとして遊ぶ (PWA)</h3>
              <p>ブラウザのメニューから<span class="highlight">「ホーム画面に追加」</span>または「アプリをインストール」を選ぶことで、このゲームをアプリとしてインストールできます。フルスクリーンで没入感のあるプレイが可能です。</p>
            </section>
          </div>

          <div v-else class="manual-en">
            <section>
              <h3>1. OBJECTIVE</h3>
              <p>You are a guitarist training to master the fretboard. Click the correct fret on the fretboard that matches the displayed note (Target).</p>
            </section>

            <section>
              <h3>2. TORCH (TIME LIMIT)</h3>
              <p>The green gauge (Torch) decreases over time. If it hits zero, it's Game Over. Correct answers restore the torch.</p>
            </section>

            <section>
              <h3>3. COMBO & RUSH MODE</h3>
              <p>Answering correctly triggers "RUSH MODE". During this mode, answering the same note on a <span class="highlight">DIFFERENT STRING</span> builds up a combo bonus.</p>
              <p class="hint">TIP: Hitting the same string twice resets the combo. Use the entire fretboard!</p>
            </section>

            <section>
              <h3>4. ECONOMY (WIZ SYSTEM)</h3>
              <p>You can sell items at the "JAZZ CAFE". Items you sell will be added to the <span class="highlight">Shop's Inventory</span>. You can buy them back later if you have enough J-Coins.</p>
            </section>

            <section>
              <h3>5. CURSES & THE DOJO</h3>
              <p>Some items found in dungeons are "Cursed". They may have negative effects. Visit the "DOJO" to pay the Master to cleanse them.</p>
            </section>

            <section>
              <h3>6. APP MODE (PWA)</h3>
              <p>You can install this game as an App by selecting <span class="highlight">"Add to Home Screen"</span> from your browser menu. This allows for full-screen, offline-capable gameplay.</p>
            </section>
          </div>
        </div>

        <button class="close-btn" @click="closeHelp">CLOSE</button>
      </div>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.town-container {
  height: 100vh;
  background: #050505; color: #fff; font-family: 'VT323', monospace;
  padding: 20px; position: relative;
  overflow-y: auto; overflow-x: hidden;
}

.cyber-grid {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-image: linear-gradient(rgba(0, 50, 0, 0.3) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0, 50, 0, 0.3) 1px, transparent 1px);
  background-size: 50px 50px; pointer-events: none; z-index: 0;
}

.town-header {
  position: relative; z-index: 1; border-bottom: 2px solid var(--neon-cyan);
  padding-bottom: 10px; margin-bottom: 30px;
  h1 { margin: 0; font-size: 2.5rem; color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }
  .player-status { display: flex; gap: 20px; font-size: 1.2rem; color: #aaa; margin-top: 5px; }
}

.menu-grid {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding-bottom: 40px;
}
@media (max-width: 600px) { .menu-grid { grid-template-columns: 1fr; } }

.menu-card {
  background: rgba(0, 20, 0, 0.6); border: 1px solid var(--neon-green); padding: 20px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s; height: 120px;
  .icon { font-size: 2.5rem; margin-bottom: 5px; }
  .label { font-size: 1.5rem; color: var(--neon-green); font-weight: bold; }
  &:hover { background: var(--neon-green); .label { color: #000; } }
}

/* Modal Styles */
.modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); 
  z-index: 100; display: flex; justify-content: center; align-items: center; 
}

.modal-window { 
  background: #000; border: 2px solid #fff; padding: 20px; 
  width: 90%; max-width: 600px; max-height: 85vh; 
  display: flex; flex-direction: column;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
}

.help-window { border-color: var(--neon-cyan); }

/* ヘルプヘッダー */
.help-header {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px dashed var(--neon-cyan); padding-bottom: 10px; margin-bottom: 10px;
  h2 { margin: 0; color: var(--neon-cyan); }
}

.lang-btn {
  background: transparent; border: 1px solid var(--neon-cyan); color: var(--neon-cyan);
  padding: 5px 10px; cursor: pointer; font-family: inherit; font-weight: bold;
  &:hover { background: var(--neon-cyan); color: #000; }
}

/* ヘルプ本文スクロール */
.help-content-scroll {
  flex: 1; overflow-y: auto; padding-right: 5px;
  
  /* スクロールバー装飾 */
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: #111; }
  &::-webkit-scrollbar-thumb { background: var(--neon-cyan); border-radius: 4px; }
}

section { margin-bottom: 25px; }
h3 { color: var(--neon-green); margin-bottom: 5px; border-left: 4px solid var(--neon-green); padding-left: 10px; }
p { line-height: 1.6; color: #ccc; margin: 0; font-family: sans-serif; font-size: 0.95rem; }
.highlight { color: #fff; font-weight: bold; background: rgba(255, 255, 255, 0.1); padding: 0 4px; }
.hint { color: #aaa; font-size: 0.85rem; margin-top: 5px; font-style: italic; }

.stage-list { 
  list-style: none; padding: 0; overflow-y: auto;
  li { border: 1px solid #333; margin-bottom: 10px; padding: 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; &.locked { opacity: 0.5; filter: grayscale(100%); } } 
  .stage-id { font-size: 1.5rem; color: #555; } 
  .stage-info { flex: 1; } 
  .name { display: block; font-size: 1.1rem; color: var(--neon-green); } 
  .desc { color: #888; font-size: 0.8rem; } 
  .status { font-weight: bold; color: #f00; &.open { color: #0f0; } } 
}

.close-btn { 
  width: 100%; padding: 15px; margin-top: 15px; 
  background: transparent; border: 1px solid #fff; color: #fff; 
  cursor: pointer; font-size: 1.2rem; font-family: inherit;
  &:hover { background: #fff; color: #000; }
}
</style>