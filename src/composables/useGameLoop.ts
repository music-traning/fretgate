// src/composables/useGameLoop.ts
import { ref, onUnmounted } from 'vue';
import { usePlayerStore } from '@/stores/playerStore';

export function useGameLoop(onGameOver: () => void) {
  const store = usePlayerStore();
  const isRunning = ref(false);
  let lastTime = 0;
  
  // 減衰スピード (難易度係数)
  const DECAY_RATE = 0.05; // 1フレームあたりの減少量

  const loop = (timestamp: number) => {
    if (!isRunning.value) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // 松明を減らす
    store.torch -= DECAY_RATE * (deltaTime / 16); 

    if (store.torch <= 0) {
      store.torch = 0;
      isRunning.value = false;
      onGameOver();
    } else {
      requestAnimationFrame(loop);
    }
  };

  const startBattle = () => {
    store.torch = store.maxTorch; // 全回復して開始
    isRunning.value = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  };

  const answerCorrectly = () => {
    // 正解時の回復（上限あり）
    store.torch = Math.min(store.torch + 15, store.maxTorch);
    store.addCoin(10); // 報酬
  };

  const answerWrong = () => {
    // 不正解時のペナルティ（大ダメージ）
    store.torch -= 20;
    // 画面揺らしエフェクトなどのトリガーをここで引く
  };

  onUnmounted(() => {
    isRunning.value = false;
  });

  return { isRunning, startBattle, answerCorrectly, answerWrong };
}