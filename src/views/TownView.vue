<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/playerStore';
import { useSoundStore } from '@/stores/soundStore';

const router = useRouter();
const store = usePlayerStore();
const soundStore = useSoundStore();

const showLevelSelect = ref(false);
const showHelp = ref(false);
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
    soundStore.playSe('cancel'); return;
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

// ▼ データリセット処理
const resetSaveData = () => {
  if (confirm('【WARNING】\n本当にデータをすべて消去しますか？\nこの操作は取り消せません。\nAre you sure you want to reset ALL data?')) {
    localStorage.clear();
    location.reload();
  }
};
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
        <span class="icon">☕</span><span class="label">JAZZ CAFE</span>
      </button>
      <button class="menu-card dojo" @click="goToDojo">
        <span class="icon">🏯</span><span class="label">DOJO</span>
      </button>
      <button class="menu-card mission" @click="openMission">
        <span class="icon">⚔️</span><span class="label">MISSION</span>
      </button>
      <button class="menu-card help" @click="openHelp">
        <span class="icon">?</span><span class="label">MANUAL</span>
      </button>
    </main>

    <div v-if="showLevelSelect" class="modal-overlay" @click.self="closeMission">
      <div class="modal-window">
        <h2>>> SELECT MISSION</h2>
        <ul class="stage-list">
          <li v-for="stage in STAGES" :key="stage.id" 
              :class="{ locked: store.state.maxStageReached < stage.id }"
              @click="goToStage(stage.id)">
            <span class="stage-id">0{{ stage.id }}</span>
            <div class="stage-info">
              <span class="name">{{ stage.name }}</span>
              <small class="desc">{{ stage.desc }}</small>
            </div>
            <span class="status">{{ store.state.maxStageReached < stage.id ? 'LOCK' : 'OPEN' }}</span>
          </li>
        </ul>
        <button class="close-btn" @click="closeMission">CLOSE</button>
      </div>
    </div>

    <div v-if="showHelp" class="modal-overlay" @click.self="closeHelp">
      <div class="modal-window help-window">
        <div class="help-header">
          <h2>>> SYSTEM MANUAL</h2>
          <button class="lang-btn" @click="toggleManualLang">{{ manualLang === 'ja' ? 'EN' : 'JP' }}</button>
        </div>
        
        <div class="help-content-scroll">
          <div v-if="manualLang === 'ja'" class="manual-ja">
            <section>
              <h3>1. ゲームの目的</h3>
              <p>表示される音（C, F#など）と同じ音を指板上でクリックしてください。</p>
            </section>
            <section>
              <h3>2. 命のともしび「松明（TORCH）」</h3>
              <p>時間とともに減るゲージです。0になるとゲームオーバー。正解で回復します。</p>
            </section>
            <section>
              <h3>3. コンボシステム</h3>
              <p>正解するとRUSHモードへ。同じ弦を使わずに連続正解するとコンボボーナスが入ります。</p>
            </section>
            <section>
<<<<<<< HEAD
              <h3>4. 経済とWIZシステム</h3>
              <p>手に入れたアイテムは「JAZZ CAFE」で売ることができます。あなたが売ったアイテムは、その後<span class="highlight">店の在庫として店頭に並びます。</span>レアなアイテムを誤って売ってしまっても、お金さえあれば買い戻せます。</p>
            </section>

            <section>
              <h3>5. 呪いと道場</h3>
              <p>ダンジョンで拾うアイテムには「呪い」がかかっていることがあります。呪われたアイテムは持っているだけで悪影響を及ぼしますが、「DOJO」で師匠にお金を払えば浄化（アイテム化）できます。</p>
            </section>
            
=======
              <h3>4. WIZシステム & 呪い</h3>
              <p>売ったアイテムは店に並びます。呪われたアイテムはDOJOで浄化してください。</p>
            </section>
>>>>>>> db7cb1135c0cec4dab2e106abc7db1ab96718537
          </div>
          <div v-else class="manual-en">
            <section>
              <h3>1. OBJECTIVE</h3>
              <p>Click the correct fret matching the displayed note.</p>
            </section>
            <section>
              <h3>2. TORCH (TIME)</h3>
              <p>Time limit gauge. Game over if it hits zero. Correct answers restore it.</p>
            </section>
            <section>
              <h3>3. COMBO SYSTEM</h3>
              <p>Don't hit the same string twice in a row during RUSH mode to get combo bonuses.</p>
            </section>
            <section>
<<<<<<< HEAD
              <h3>4. ECONOMY (WIZ SYSTEM)</h3>
              <p>You can sell items at the "JAZZ CAFE". Items you sell will be added to the <span class="highlight">Shop's Inventory</span>. You can buy them back later if you have enough J-Coins.</p>
            </section>

            <section>
              <h3>5. CURSES & THE DOJO</h3>
              <p>Some items found in dungeons are "Cursed". They may have negative effects. Visit the "DOJO" to pay the Master to cleanse them.</p>
            </section>

=======
              <h3>4. ECONOMY & CURSE</h3>
              <p>Sold items appear in the shop. Cleanse cursed items at the DOJO.</p>
            </section>
>>>>>>> db7cb1135c0cec4dab2e106abc7db1ab96718537
          </div>

          <div class="danger-zone">
            <h3>!! DANGER ZONE !!</h3>
            <button class="reset-btn" @click="resetSaveData">
              RESET SAVE DATA (データ初期化)
            </button>
          </div>
        </div>
        <button class="close-btn" @click="closeHelp">CLOSE</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 基本スタイルは維持しつつ、Danger Zoneを追加 */
.town-container { height: 100vh; background: #050505; color: #fff; font-family: 'VT323', monospace; padding: 20px; position: relative; }
.cyber-grid { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(rgba(0,50,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,50,0,0.3) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; z-index: 0; }
.town-header { position: relative; z-index: 1; border-bottom: 2px solid var(--neon-cyan); padding-bottom: 10px; margin-bottom: 30px; h1 { margin: 0; font-size: 2.5rem; color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); } .player-status { font-size: 1.2rem; color: #aaa; } }
.menu-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.menu-card { background: rgba(0,20,0,0.6); border: 1px solid var(--neon-green); padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; height: 120px; .icon { font-size: 2.5rem; } .label { font-size: 1.5rem; color: var(--neon-green); font-weight: bold; } &:hover { background: var(--neon-green); .label { color: #000; } } }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 100; display: flex; justify-content: center; align-items: center; }
.modal-window { background: #000; border: 2px solid #fff; padding: 20px; width: 90%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; }
.help-window { border-color: var(--neon-cyan); }
.help-header { display: flex; justify-content: space-between; border-bottom: 1px dashed var(--neon-cyan); margin-bottom: 10px; h2 { color: var(--neon-cyan); } }
.lang-btn { background: transparent; border: 1px solid var(--neon-cyan); color: var(--neon-cyan); cursor: pointer; }
.help-content-scroll { flex: 1; overflow-y: auto; }
section { margin-bottom: 20px; h3 { color: var(--neon-green); border-left: 4px solid var(--neon-green); padding-left: 10px; } p { color: #ccc; font-family: sans-serif; font-size: 0.9rem; } }
.stage-list { list-style: none; padding: 0; overflow-y: auto; li { border: 1px solid #333; margin-bottom: 10px; padding: 10px; display: flex; align-items: center; cursor: pointer; &.locked { opacity: 0.5; } .stage-id { font-size: 1.5rem; color: #555; margin-right: 10px; } .stage-info { flex: 1; } .name { color: var(--neon-green); } .status { color: #f00; } } }
.close-btn { width: 100%; padding: 15px; margin-top: 15px; background: transparent; border: 1px solid #fff; color: #fff; cursor: pointer; &:hover { background: #fff; color: #000; } }

/* Danger Zone Style */
.danger-zone { margin-top: 30px; border: 1px solid #f00; padding: 10px; text-align: center; }
.danger-zone h3 { color: #f00; border: none; padding: 0; margin-bottom: 10px; }
.reset-btn { background: #500; color: #fff; border: none; padding: 10px 20px; cursor: pointer; font-weight: bold; &:hover { background: #f00; } }
</style>