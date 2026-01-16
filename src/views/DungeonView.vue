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
const logMessage = ref('> BATTLE START');
const progress = ref(0);
const droppedItem = ref<any>(null);

const comboCount = ref(0);
const comboTimer = ref(0);
const isRushMode = ref(false);
let comboInterval: number | undefined;
const rushUsedStrings = ref<Set<number>>(new Set());

const currentNoteName = computed(() => NOTES[currentNoteIndex.value]);
const battlesLeft = computed(() => STAGE_QUOTA - progress.value);

const myConsumables = computed(() => {
  return store.state.inventory
    .map((id: number) => store.getItemDetail(id))
    .filter((item: any) => item && item.type === 'consumable');
});

const difficulty = computed(() => store.state.difficulty || 'NORMAL');

const isValidQuestion = (noteIndex: number): boolean => {
  const noteName = NOTES[noteIndex];
  // EASY: ステージ2まで黒鍵なし
  if (difficulty.value === 'EASY' && stageId.value <= 2) return !noteName.includes('#');
  // NORMAL: ステージ1だけ黒鍵なし
  if (stageId.value === 1) return !noteName.includes('#');
  
  return true;
};

const questionHistory = ref<number[]>([]);

const nextQuestion = () => {
  // 1. 現在のステージで有効な音(Candidates)を全てリストアップ
  const validNotes: number[] = [];
  for (let i = 0; i < 12; i++) {
      if (isValidQuestion(i)) validNotes.push(i);
  }

  // 2. 履歴の長さを「有効な音の総数の半分（切り捨て）」に制限する
  // 例: ステージ1(7音) -> 履歴3個保持 (直近3回と同じ音は出ない)
  // 例: ステージ2(12音) -> 履歴6個保持 (直近6回と同じ音は出ない)
  const historyLimit = Math.max(1, Math.floor(validNotes.length / 2));
  
  // 履歴配列が長すぎたら古い順に消す
  while (questionHistory.value.length >= historyLimit) {
    questionHistory.value.shift(); 
  }

  // 3. 有効な音の中から、履歴に含まれている音を除外する
  // さらに、念のため「現在の音」も除外する（履歴に含まれているはずだが明示的に）
  const candidates = validNotes.filter(note => 
    !questionHistory.value.includes(note) && note !== currentNoteIndex.value
  );

  let nextVal = -1;

  if (candidates.length > 0) {
    // 候補があればそこからランダムに選ぶ
    const randomIndex = Math.floor(Math.random() * candidates.length);
    nextVal = candidates[randomIndex];
  } else {
    // 【緊急回避】
    // 何らかの理由で候補がゼロになった場合（設定ミスなど）、
    // 単純に「今の音以外」から選ぶ
    const emergencyCandidates = validNotes.filter(n => n !== currentNoteIndex.value);
    const r = Math.floor(Math.random() * emergencyCandidates.length);
    nextVal = emergencyCandidates[r];
  }

  // 値を更新
  currentNoteIndex.value = nextVal;
  
  // 今回の音を履歴の末尾に追加
  questionHistory.value.push(nextVal);
};

const onFretClick = (stringNum: number, fretNum: number) => {
  soundStore.playGuitarNote(stringNum, fretNum);
  if (!isRunning.value || isGameOver.value || isStageClear.value) return;

  if (stageId.value === 3 && ![5, 6].includes(stringNum)) {
    logMessage.value = 'WARN: STRING 5/6 ONLY!';
    soundStore.playSe('cancel');
    return;
  }
  if (stageId.value === 4 && ![3, 4].includes(stringNum)) {
    logMessage.value = 'WARN: STRING 3/4 ONLY!';
    soundStore.playSe('cancel');
    return;
  }

  const stringIndex = stringNum - 1;
  const openNoteIndex = STRING_TUNING[stringIndex];
  const clickedNoteIndex = (openNoteIndex + fretNum) % 12;

  if (clickedNoteIndex === currentNoteIndex.value) {
    soundStore.playSe('decision');
    handleCorrect(stringNum);
  } else {
    answerWrong();
    stopCombo();
    soundStore.playSe('damage');
    // HARDモードはペナルティあり？
    if (difficulty.value === 'HARD') store.torch = Math.max(0, store.torch - 5);
    logMessage.value = 'MISS! TIME LOST!';
    
    // ミスしたら次の問題へ（違う音へ）
    nextQuestion();
  }
};

const handleCorrect = (stringNum: number) => {
  // ▼ 報酬計算ロジック
  // ベース報酬
  let earn = 5;
  if (isRushMode.value) {
    comboCount.value++;
    earn += comboCount.value * 2;
  }

  // ステージボーナス (奥に行くほど儲かる)
  // Stage 1: x1.0, Stage 2: x1.2, ... Stage 5: x1.8
  const stageBonus = 1.0 + (stageId.value - 1) * 0.2;
  
  // 難易度ボーナス (難しいほど儲かる)
  // EASY: x0.5, NORMAL: x1.0, HARD: x2.0
  let diffBonus = 1.0;
  if (difficulty.value === 'EASY') diffBonus = 0.5;
  if (difficulty.value === 'HARD') diffBonus = 2.0;

  const totalEarn = Math.floor(earn * stageBonus * diffBonus);
  store.addCoin(totalEarn);

  if (isRushMode.value) {
    if (rushUsedStrings.value.has(stringNum)) {
      // 同じ弦を使ってしまったらコンボ終了 -> 次の問題へ
      logMessage.value = 'COMBO FINISHED (SAME STRING)';
      stopCombo();
      answerCorrectly();
      nextQuestion();
    } else {
      // コンボ成功 -> 同じ問題のまま継続
      logMessage.value = `COMBO x${comboCount.value} (+${totalEarn}J)`;
      answerCorrectly();
      startRushMode(stringNum, true);
    }
  } else {
    // 初回正解 -> RUSH開始（Target維持）
    logMessage.value = `CORRECT! (+${totalEarn}J)`;
    answerCorrectly();
    progress.value++;
    startRushMode(stringNum, false);
  }

  if (progress.value >= STAGE_QUOTA) handleStageClear();
  // ここでは nextQuestion() しない（コンボ継続のため）
};

const startRushMode = (stringNum: number, isContinuing: boolean) => {
  isRushMode.value = true;
  comboTimer.value = 100;
  
  if (!isContinuing) rushUsedStrings.value.clear();
  rushUsedStrings.value.add(stringNum); // 使用済み弦として記録

  if (comboInterval) clearInterval(comboInterval);
  comboInterval = setInterval(() => {
    // ゲージ減少速度
    comboTimer.value -= 2; 
    
    if (comboTimer.value <= 0) {
      stopCombo();
      logMessage.value = 'RUSH FINISHED';
      // 時間切れでコンボ終了 -> 次の問題へ
      nextQuestion();
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
  store.addCoin(100 + Math.floor(store.torch));
  store.unlockNextStage(stageId.value);
};

const { isRunning, startBattle, answerCorrectly, answerWrong } = useGameLoop(handleGameOver);

const useItem = (item: any) => {
  const resultMsg = store.consumeItem(item.id);
  logMessage.value = resultMsg;
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
    
    <header class="hud-panel">
      <div class="bars-container">
        <!-- 画面が狭いときは横並びにするラッパー -->
        <div class="bar-row">
            <div class="bar-group">
                <div class="bar-label">TORCH ({{difficulty}})</div>
                <div class="bar-bg search-bar">
                    <div class="bar-fill torch" 
                        :class="{ danger: store.torch < 30 }" 
                        :style="{ width: `${(store.torch / store.maxTorch) * 100}%` }">
                    </div>
                </div>
            </div>
            <div class="bar-group">
                <div class="bar-label">PROGRESS ({{ battlesLeft }})</div>
                <div class="bar-bg search-bar">
                    <div class="bar-fill progress" 
                        :style="{ width: `${(progress / STAGE_QUOTA) * 100}%` }">
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div class="status-row">
        <div class="target-display">
          <span class="sub">TARGET</span>
          <span class="note-char" :class="{ flicker: isRushMode }">{{ currentNoteName }}</span>
        </div>
        
        <div class="msg-display">
          <div v-if="isRushMode" class="rush-info">
            <span class="rush-text">RUSH! {{ comboCount }} COMBO</span>
            <div class="combo-gauge">
              <div class="combo-fill" :style="{ width: `${comboTimer}%` }"></div>
            </div>
          </div>
          <div v-else class="log-text">{{ logMessage }}</div>
        </div>

        <div class="btn-group">
          <button class="menu-btn" @click="showItemMenu = !showItemMenu">ITEM</button>
        </div>
      </div>

      <div v-if="showItemMenu" class="item-dropdown">
        <div v-if="myConsumables.length === 0" class="empty">NO ITEMS</div>
        <div v-for="(item, i) in myConsumables" :key="i" class="item-row" @click="item && useItem(item)">
          {{ item?.name }}
        </div>
      </div>
    </header>

    <main class="fretboard-area">
      <div class="fretboard">
        <div v-for="s in 6" :key="s" class="string-row">
          <div class="string-num" :class="{ 'highlight': rushUsedStrings.has(s) }">{{ s }}</div>
          <div class="string-line">
            <div v-for="i in 13" :key="i" class="fret" :class="{ 'nut': (i-1) === 0 }" @click="onFretClick(s, i-1)">
              <span v-if="(i-1) > 0 && [3,5,7,9,12].includes(i-1) && (s === 3 || s === 4)" class="dot"></span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="isStageClear" class="modal-overlay clear-mode">
      <div class="result-card">
        <h1>STAGE CLEAR!</h1>
        <div v-if="droppedItem" class="loot-info">
          <p>GET: {{ droppedItem.name }}</p>
          <div class="btns">
            <button @click="takeItemAndLeave" class="btn-get">GET</button>
            <button @click="leaveItemAndLeave" class="btn-trash">TRASH</button>
          </div>
        </div>
        <div v-else class="loot-info">
          <p>NO DROP...</p>
          <button @click="leaveItemAndLeave" class="btn-ok">RETURN</button>
        </div>
      </div>
    </div>

    <div v-if="isGameOver" class="modal-overlay danger-mode">
      <div class="result-card">
        <h1>GAME OVER</h1>
        <p>Torch burned out...</p>
        <button @click="backToTown" class="btn-revive">RETURN</button>
      </div>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.dungeon-container { height: 100dvh; background: #000; color: #fff; font-family: 'VT323', monospace; display: flex; flex-direction: column; overflow: hidden; &.rush-mode { background: #1a001a; } }
.hud-panel { background: #111; border-bottom: 2px solid #333; padding: 5px 10px; flex-shrink: 0; } /* Padding削減 */

.bars-container { margin-bottom: 5px; }
.bar-row { display: flex; gap: 10px; }
.bar-group { flex: 1; } /* 横並び時に均等配置 */

.bar-label { font-size: 0.8rem; color: #888; margin-bottom: 2px; }
.bar-bg { width: 100%; height: 8px; background: #333; margin-bottom: 0; position: relative; } /* 高さ削減 */
.bar-fill { height: 100%; transition: width 0.2s; }
.torch { background: var(--neon-green); &.danger { background: #f00; box-shadow: 0 0 10px #f00; } }
.progress { background: var(--neon-cyan); }

.status-row { display: flex; align-items: center; justify-content: space-between; height: 40px; } /* 高さ削減 */
.target-display { display: flex; flex-direction: row; gap:10px; align-items: center; width: auto; min-width: 80px; 
  .sub { font-size: 0.8rem; color: #aaa; } 
  .note-char { font-size: 2rem; line-height: 1; color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); } 
  .flicker { animation: flicker 0.1s infinite; } 
}
.msg-display { flex: 1; padding: 0 10px; font-size: 1.0rem; color: #ccc; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.rush-info { color: #f0f; .combo-gauge { height: 4px; background: #333; margin-top: 5px; width: 100%; } .combo-fill { height: 100%; background: #f0f; } }
.menu-btn { background: #000; border: 1px solid var(--neon-green); color: var(--neon-green); padding: 2px 10px; cursor: pointer; font-size: 1rem; }
.item-dropdown { position: absolute; top: 120px; right: 10px; background: rgba(0,0,0,0.9); border: 1px solid #fff; padding: 10px; z-index: 100; .item-row { padding: 5px; border-bottom: 1px solid #333; cursor: pointer; &:hover { color: var(--neon-green); } } }

.fretboard-area { flex: 1; display: flex; justify-content: center; align-items: center; overflow: auto; padding: 10px; }
.fretboard { display: flex; flex-direction: column; margin: auto; }
.string-row { display: flex; align-items: center; }
.string-num { width: 20px; color: #666; font-weight: bold; text-align: center; font-size: 0.8rem; &.highlight { color: #f0f; } } /* 幅削減 */
.string-line { display: flex; height: 35px; border-bottom: 1px solid #333; } /* 高さ削減 */
.fret { width: 40px; height: 100%; border-right: 2px solid #444; position: relative; display: flex; align-items: center; justify-content: center; &::before { content:''; position: absolute; width:100%; height:1px; background:#666; top:50%; } &:hover { background: rgba(255,255,255,0.1); } &.nut { width: 15px; border-right: 4px solid #888; background: #222; } } /* 幅削減 */
.dot { width: 8px; height: 8px; background: #666; border-radius: 50%; z-index: 2; }

/* PC等の大画面用 */
@media (min-width: 1024px) { 
  .string-line { height: 60px; } 
  .fret { width: 80px; } 
  .target-display .note-char { font-size: 3.5rem; } 
}

/* 縦が短い画面（iPhone SE横など）用 */
@media (max-height: 450px) {
  .hud-panel { padding: 2px 10px; }
  .status-row { height: 30px; }
  .string-line { height: 30px; }
  .fretboard-area { padding: 5px; }
  .target-display .note-char { font-size: 1.5rem; }
}

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); z-index: 999; }
.clear-mode { background: rgba(0, 50, 0, 0.8); }
.danger-mode { background: rgba(50, 0, 0, 0.8); }
.result-card {
  background: #000;
  border: 2px solid #fff;
  padding: 30px;
  text-align: center;
  width: 90%; max-width: 400px; max-height: 90vh; overflow-y: auto;
}
.btns { display: flex; gap: 10px; margin-top: 15px; justify-content: center; }
button { padding: 10px 20px; cursor: pointer; font-family: inherit; font-size: 1.2rem; }
.btn-get { background: var(--neon-green); border: none; color: #000; }
.btn-trash { background: transparent; border: 1px solid #fff; color: #fff; }
.btn-revive, .btn-ok { background: #fff; color: #000; border: none; }
@keyframes flicker { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
</style>