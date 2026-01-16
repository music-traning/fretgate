<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/playerStore';
import { useSoundStore } from '@/stores/soundStore';
import { useGameLoop } from '@/composables/useGameLoop';

const route = useRoute();
const router = useRouter();
const store = usePlayerStore();
const soundStore = useSoundStore();

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRING_TUNING = [4, 11, 7, 2, 9, 4];
const STAGE_QUOTA = 10;
const stageId = computed(() => Number(route.params.stageId) || 1);

const currentNoteIndex = ref(0);
const isGameOver = ref(false);
const isStageClear = ref(false);
const showItemMenu = ref(false);
const logMessage = ref('> BATTLE_MODE: ACTIVE');
const progress = ref(0);
const droppedItem = ref<any>(null);

const comboCount = ref(0);
const comboTimer = ref(0);
const isRushMode = ref(false);
let comboInterval: number | undefined;
const rushUsedStrings = ref<Set<number>>(new Set());

const currentNoteName = computed(() => NOTES[currentNoteIndex.value]);
const progressPercent = computed(() => (progress.value / STAGE_QUOTA) * 100);
const battlesLeft = computed(() => STAGE_QUOTA - progress.value);

const myConsumables = computed(() => {
  return store.state.inventory
    .map((id: number) => store.getItemDetail(id))
    .filter((item: any) => item && item.type === 'consumable');
});

// ロジック
const isValidQuestion = (noteIndex: number): boolean => {
  const noteName = NOTES[noteIndex];
  if (stageId.value === 1) return !noteName.includes('#');
  return true;
};

const nextQuestion = () => {
  let nextVal = -1;
  let safetyCounter = 0;
  while (true) {
    nextVal = Math.floor(Math.random() * 12);
    if (nextVal === currentNoteIndex.value) continue;
    if (isValidQuestion(nextVal)) break;
    safetyCounter++;
    if (safetyCounter > 100) break; 
  }
  currentNoteIndex.value = nextVal;
};

const onFretClick = (stringNum: number, fretNum: number) => {
  soundStore.playGuitarNote(stringNum, fretNum);

  if (!isRunning.value || isGameOver.value || isStageClear.value) return;

  if (stageId.value === 3 && ![5, 6].includes(stringNum)) {
    logMessage.value = '> WARN: STRING 5/6 ONLY!';
    soundStore.playSe('cancel');
    return;
  }
  if (stageId.value === 4 && ![3, 4].includes(stringNum)) {
    logMessage.value = '> WARN: STRING 3/4 ONLY!';
    soundStore.playSe('cancel');
    return;
  }

  const stringIndex = stringNum - 1;
  const openNoteIndex = STRING_TUNING[stringIndex];
  const clickedNoteIndex = (openNoteIndex + fretNum) % 12;
  const clickedNoteName = NOTES[clickedNoteIndex];

  if (clickedNoteIndex === currentNoteIndex.value) {
    soundStore.playSe('decision');
    handleCorrect(stringNum);
  } else {
    answerWrong();
    stopCombo();
    soundStore.playSe('damage');
    logMessage.value = `> ERROR: [${clickedNoteName}] INVALID.`;
  }
};

const handleCorrect = (stringNum: number) => {
  if (isRushMode.value) {
    if (rushUsedStrings.value.has(stringNum)) {
      logMessage.value = `> COMBO FINISH. (REUSED)`;
      stopCombo();
      answerCorrectly();
      nextQuestion();
    } else {
      comboCount.value++;
      store.addCoin(5 + comboCount.value * 2);
      logMessage.value = `> COMBO x${comboCount.value}!`;
      answerCorrectly();
      startRushMode(stringNum, true);
    }
  } else {
    logMessage.value = '> CORRECT! RUSH!';
    answerCorrectly();
    progress.value++;
    startRushMode(stringNum, false);
  }

  if (progress.value >= STAGE_QUOTA) {
    handleStageClear();
  } else if (!isRushMode.value) {
    nextQuestion();
  }
};

const startRushMode = (stringNum: number, isContinuing: boolean) => {
  isRushMode.value = true;
  comboTimer.value = 100;
  if (!isContinuing) rushUsedStrings.value.clear();
  rushUsedStrings.value.add(stringNum);

  if (comboInterval) clearInterval(comboInterval);
  comboInterval = setInterval(() => {
    comboTimer.value -= 2;
    if (comboTimer.value <= 0) {
      stopCombo();
      logMessage.value = '> RUSH END';
    }
  }, 40);
};

const stopCombo = () => {
  isRushMode.value = false;
  comboCount.value = 0;
  comboTimer.value = 0;
  rushUsedStrings.value.clear();
  if (comboInterval) clearInterval(comboInterval);
};

const handleGameOver = () => {
  stopCombo();
  store.die();
  isGameOver.value = true;
};

const handleStageClear = () => {
  stopCombo();
  soundStore.playSe('clear');
  
  if (stageId.value === 5) {
    setTimeout(() => { router.push('/ending'); }, 2000);
    return;
  }

  isStageClear.value = true;
  droppedItem.value = store.generateDropItem();
  const bonus = Math.floor(store.torch);
  store.addCoin(100 + bonus);
  store.unlockNextStage(stageId.value);
};

const { isRunning, startBattle, answerCorrectly, answerWrong } = useGameLoop(handleGameOver);

const useItem = (item: any) => {
  const resultMsg = store.consumeItem(item.id);
  logMessage.value = `> ${resultMsg}`;
  soundStore.playSe('decision');
  showItemMenu.value = false;
};
const takeItemAndLeave = () => {
  if (droppedItem.value) store.obtainItem(droppedItem.value);
  soundStore.playSe('coin');
  router.push('/town');
};
const leaveItemAndLeave = () => {
  soundStore.playSe('cancel');
  router.push('/town');
};
const backToTown = () => router.push('/town');

onMounted(async () => {
  soundStore.stopBgm();
  await soundStore.initAudio();
  nextQuestion();
  startBattle();
});
onUnmounted(() => stopCombo());
</script>

<template>
  <div class="dungeon-container" :class="{ 'rush-mode': isRushMode }">
    <div v-if="isStageClear" class="modal-overlay clear-bg">
      <div class="modal-content drop-panel">
        <h1 class="clear-text">STAGE {{ stageId }} CLEAR</h1>
        <div class="loot-box">
          <p class="loot-title">BATTLE RESULT:</p>
          <div v-if="droppedItem" class="item-card" :class="droppedItem.type">
            <p class="drop-label">ENEMY DROPPED:</p>
            <h2 class="item-name">{{ droppedItem.name }}</h2>
            <p class="item-desc">{{ droppedItem.description }}</p>
            <p class="item-price">査定額: {{ droppedItem.sell_price }} J</p>
            <div class="choice-btns">
              <button @click="takeItemAndLeave" class="take-btn">>> GET (拾う)</button>
              <button @click="leaveItemAndLeave" class="leave-btn">>> TRASH (捨てる)</button>
            </div>
          </div>
          <div v-else class="no-drop">
            <p>NO ITEMS...</p>
            <button @click="leaveItemAndLeave" class="action-btn">>> 街へ帰還する</button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="isGameOver" class="modal-overlay danger-bg">
      <div class="modal-content">
        <h1>SIGNAL LOST</h1>
        <button @click="backToTown" class="revive-btn">REBOOT</button>
      </div>
    </div>

    <header class="hud-compact">
      <div class="gauges-row">
        <div class="gauge-container"><div class="gauge-fill progress" :style="{ width: `${progressPercent}%` }"></div></div>
        <div class="gauge-container"><div class="gauge-fill torch" :class="{ danger: store.torch < 30 }" :style="{ width: `${(store.torch / store.maxTorch) * 100}%` }"></div></div>
      </div>
      <div class="info-row">
        <div class="target-box">
          <div class="battle-count">
            <span class="label">REMAIN</span>
            <span class="val">{{ battlesLeft }}</span>
          </div>
          <div class="note-box">
            <span class="label">TARGET</span>
            <span class="target-note" :class="{ 'neon-flicker': isRushMode }">{{ currentNoteName }}</span>
          </div>
        </div>
        
        <div class="status-box">
          <div v-if="isRushMode" class="rush-status">
             <span class="rush-label">RUSH!</span><span class="combo-num">{{ comboCount }} COMBO</span>
             <div class="rush-timer-bar"><div class="fill" :style="{ width: `${comboTimer}%` }"></div></div>
          </div>
          <div v-else class="log-msg">{{ logMessage }}</div>
        </div>
        <button class="item-btn" @click="showItemMenu = !showItemMenu">ITEM</button>
      </div>
      <div v-if="showItemMenu" class="item-dropdown">
        <p v-if="myConsumables.length === 0" class="empty">NO ITEMS</p>
        <div v-for="(item, idx) in myConsumables" :key="idx" class="item-entry" @click="useItem(item)">{{ item?.name }}</div>
      </div>
    </header>

    <main class="fretboard-area">
      <div class="fretboard">
        <div v-for="s in 6" :key="s" class="string-container">
          <div class="string-num" :class="{ 'highlight': rushUsedStrings.has(s) }">{{ s }}</div>
          <div class="string-line">
            <div v-for="i in 13" :key="i" class="fret" :class="{ 'nut': (i-1) === 0 }" @click="onFretClick(s, i-1)">
              <span v-if="(i-1) > 0 && [3,5,7,9,12].includes(i-1) && (s === 3 || s === 4)" class="dot"></span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.dungeon-container {
  height: 100dvh; /* dvhでモバイルのアドレスバー対策 */
  display: flex; flex-direction: column; 
  background: #000; overflow: hidden;
  &.rush-mode { background: #100010; }
}

.hud-compact { flex-shrink: 0; background: #000; border-bottom: 1px solid #333; padding: 5px; }
.gauges-row { display: flex; gap: 5px; margin-bottom: 5px; height: 6px; .gauge-container { flex: 1; background: #222; } .gauge-fill { height: 100%; transition: width 0.2s; } .gauge-fill.progress { background: var(--neon-cyan); } .gauge-fill.torch { background: var(--neon-green); } .gauge-fill.torch.danger { background: var(--neon-pink); } }
.info-row { display: flex; align-items: center; justify-content: space-between; height: 50px; }

.target-box { 
  display: flex; align-items: center; gap: 15px; 
  .battle-count {
    display: flex; flex-direction: column; align-items: center;
    .label { font-size: 0.7rem; color: #888; }
    .val { font-size: 1rem; color: #fff; font-family: monospace; font-weight: bold; }
  }
  .note-box {
    display: flex; flex-direction: column; align-items: center;
    .label { font-size: 0.7rem; color: #888; }
    .target-note { font-size: 2.5rem; line-height: 0.9; color: var(--neon-cyan); font-weight: bold; text-shadow: 0 0 10px var(--neon-cyan); font-family: monospace; }
  }
}

.status-box { flex: 1; text-align: right; font-family: monospace; font-size: 0.8rem; color: #888; padding-right: 10px; overflow: hidden; white-space: nowrap; }
.rush-status { color: #f0f; .combo-num { font-size: 1.2rem; text-shadow: 0 0 5px #f0f; } .rush-timer-bar { width: 80px; height: 4px; background: #333; margin-left: auto; .fill { height: 100%; background: #f0f; } } }
.item-btn { background: #000; border: 1px solid var(--neon-green); color: var(--neon-green); padding: 5px 10px; font-size: 0.8rem; }
.item-dropdown { position: absolute; top: 70px; right: 5px; background: rgba(0,0,0,0.95); border: 1px solid var(--neon-green); padding: 10px; z-index: 200; min-width: 150px; color: #fff; }

/* ▼▼▼ 指板エリアの修正（PC中央寄せ＆サイズ調整） ▼▼▼ */
.fretboard-area {
  flex: 1; 
  display: flex;              /* 上下左右中央寄せのためにFlex化 */
  justify-content: center;    /* 左右中央 */
  align-items: center;        /* 上下中央 */
  overflow-x: auto;           /* はみ出たらスクロール */
  overflow-y: hidden; 
  position: relative; 
  width: 100%;
  padding: 10px;
}

/* 指板のコンテナ */
.fretboard { 
  display: flex; 
  flex-direction: column; 
  width: max-content; 
  margin: 0 auto;             /* 念のための自動マージン */
}

.string-container { display: flex; align-items: center; }

/* 弦番号 */
.string-num {
  width: 30px; height: 40px; 
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-family: monospace; font-weight: bold;
  position: sticky; left: 0; z-index: 50; background: #222; 
  border-right: 2px solid var(--neon-green); box-shadow: 2px 0 5px rgba(0,0,0,0.5);
}
.string-num.highlight { color: #f0f; background: #300; border-color: #f0f; text-shadow: 0 0 5px #f0f; }

/* 弦のライン */
.string-line { display: flex; height: 40px; border-bottom: 1px solid #222; }

/* フレット */
.fret {
  width: 50px; height: 100%; 
  border-right: 2px solid #444; position: relative; 
  display: flex; align-items: center; justify-content: center;
  &::before { content: ""; position: absolute; width: 100%; height: 1px; background: #888; top: 50%; pointer-events: none; }
  &:hover { background: rgba(10, 255, 10, 0.1); }
  &.nut { width: 30px; border-right: 4px solid #888; background: rgba(255, 255, 255, 0.05); }
}

.dot { width: 8px; height: 8px; background: #444; border-radius: 50%; z-index: 1; }

/* ▼▼▼ PC用レスポンシブ対応（画面幅1024px以上で巨大化） ▼▼▼ */
@media (min-width: 1024px) {
  .string-num { width: 40px; height: 60px; font-size: 1.2rem; }
  .string-line { height: 60px; }
  .fret { width: 80px; } /* フレット幅アップ */
  .fret.nut { width: 40px; }
  .dot { width: 12px; height: 12px; }
  
  /* ターゲット表示も大きく */
  .target-note { font-size: 4rem; }
}

/* モバイル横画面調整 */
@media (max-height: 500px) { 
  .string-line, .string-num { height: 35px; } 
  .target-note { font-size: 2rem; } 
}

/* モーダル類 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 9999; backdrop-filter: blur(5px); }
.clear-bg { background: rgba(0, 50, 0, 0.9); }
.danger-bg { background: rgba(50, 0, 0, 0.9); }
.modal-content { text-align: center; padding: 20px; background: #000; border: 2px solid #fff; min-width: 300px; max-width: 90%; }
.item-card { margin-top: 10px; padding: 10px; border: 1px dashed #fff; }
.choice-btns { display: flex; gap: 10px; margin-top: 10px; }
.take-btn, .leave-btn, .action-btn, .revive-btn { flex: 1; padding: 10px; border: 1px solid #fff; background: #000; color: #fff; }
.take-btn { background: var(--neon-green); color: #000; border: none; }
</style>