<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSoundStore } from '@/stores/soundStore';

const router = useRouter();
const soundStore = useSoundStore();

// 状態管理
const isStarted = ref(false); // スタートボタンを押したか
const isLoading = ref(false); // ロード中か
const showLogo = ref(false);  // ロゴ表示フェーズか
const showFlash = ref(false); // フラッシュ演出

// 1. ユーザーが画面をクリックした時に呼ばれる関数
const initializeAndStart = async () => {
  if (isLoading.value) return; 
  isLoading.value = true;

  try {
    console.log("Audio initializing...");
    await soundStore.initAudio();
    
    console.log("Play BGM...");
    await soundStore.playBgm('opening');

    isStarted.value = true;

  } catch (e) {
    console.error("Audio Start Error:", e);
    alert("オーディオの起動に失敗しました。");
  } finally {
    isLoading.value = false;
  }
};

const onCrawlEnd = () => {
  triggerLogo();
};

const triggerLogo = () => {
  showFlash.value = true;
  setTimeout(() => { showFlash.value = false; }, 100);
  showLogo.value = true;
};

// 街へ移動
const skipToTown = () => {
  router.push('/town');
};
</script>

<template>
  <div class="opening-container">
    
    <div v-if="!isStarted" class="start-overlay" @click="initializeAndStart">
      <div class="center-content">
        <h1 class="title-text">FRETGATE</h1>
        <div v-if="isLoading" class="loading-text">LOADING...</div>
        <div v-else class="blink-text">>> CLICK TO START <<</div>
        <p class="warning-text">※音が出ます / SOUND ON</p>
      </div>

      <footer class="copyright">
        <a href="https://note.com/jazzy_begin" target="_blank" @click.stop>
          ©2026 buro
        </a>
      </footer>
    </div>

    <div v-else class="story-screen">
      <button class="skip-btn" @click="skipToTown">>> SKIP</button>
      <div v-if="showFlash" class="flash-overlay"></div>

      <div v-if="!showLogo" class="crawl-container">
        <div class="crawl-content" @animationend="onCrawlEnd">
          <p>ときに　せいれき　2030ねん……。</p>
          <br>
          <p>AGI（シンギュラリティー）の　とうらいにより</p>
          <p>じんるいは　ろうどうから　かいほうされた。</p>
          <br>
          <p>すべての　にんげんが　ゲイジュツを　あいし</p>
          <p>うたを　うたい　えを　かく　じだい。</p>
          <br>
          <p>だが　ここに　ひとり……</p>
          <p>ぜつぼうの　ふちに　いる　オトコがいた。</p>
          <br>
          <p>かれは　ギタリスト。</p>
          <p>しかし　かれは　しらなかった。</p>
          <p>指板（フレットボード）の　おとが</p>
          <p>どこにあるのかを。</p>
          <br>
          <p>「タブふが　なければ　なにも　ひけない」</p>
          <br>
          <p>まわりは　みな　てんさい　ばかり。</p>
          <p>かれの　おとは　だれにも　とどかない。</p>
          <br>
          <p>かれには　ゆめが　あった。</p>
          <p>「6げんの　まじゅつし」に　なること。</p>
          <p>じゆうに　ソロを　かなでる　こと。</p>
          <br>
          <p>あるひ　かれは　きいた。</p>
          <p>まちの　はずれに　AIが　つくったという</p>
          <p>「5つの　まじょう（Fretgate）」の　うわさを。</p>
          <br>
          <p>そこは　ひとの　こころを　おる　ちごく。</p>
          <p>いどんだ　ものは　みな　ぎがを　うしない</p>
          <p>はいじんと　なって　かえってくるという。</p>
          <br>
          <p>それでも　オトコは　ギターを　せおった。</p>
          <p>ピック　ひとつを　にぎりしめ</p>
          <p>だれも　いかない　アレチへと　むかう。</p>
          <br>
          <p>これは　ひとりの　ギタリストの</p>
          <p>こどくな　たたかいの　きろく　である……。</p>
          <div class="spacer"></div>
        </div>
      </div>

      <div v-else class="title-screen" @click="skipToTown">
        <h1 class="main-logo">FRETGATE</h1>
        <p class="sub-title">- The 6-String Magician -</p>
        <p class="press-start">CLICK TO TOWN</p>

        <footer class="copyright">
          <a href="https://note.com/jazzy_begin" target="_blank" @click.stop>
            ©2026 buro
          </a>
        </footer>
      </div>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.opening-container {
  width: 100vw; height: 100vh;
  background: #000; color: #fff;
  overflow: hidden; position: relative;
  font-family: 'DotGothic16', sans-serif;
}

/* フッター用スタイル */
.copyright {
  position: absolute; bottom: 15px; width: 100%; text-align: center;
  z-index: 2000; pointer-events: none; /* 周りはクリック透過 */
  a {
    pointer-events: auto; /* リンクはクリック可能 */
    color: #666; text-decoration: none; font-family: sans-serif; font-size: 0.8rem; letter-spacing: 1px;
    &:hover { color: #fff; text-decoration: underline; }
  }
}

/* スタート画面 */
.start-overlay {
  width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  background: #000; z-index: 2000; cursor: pointer;
  position: relative; /* フッター配置用 */
}
.center-content { text-align: center; }
.title-text {
  font-family: 'VT323', monospace; font-size: 5rem;
  color: var(--neon-green); text-shadow: 0 0 20px var(--neon-green);
  margin-bottom: 30px;
}
.blink-text { font-size: 1.5rem; animation: blink 1s infinite; }
.loading-text { font-size: 1.5rem; color: #f0f; }
.warning-text { margin-top: 20px; font-size: 0.8rem; color: #666; }

.story-screen { width: 100%; height: 100%; position: relative; }
.skip-btn {
  position: absolute; top: 20px; right: 20px;
  background: transparent; color: #666; border: 1px solid #666;
  padding: 5px 10px; cursor: pointer; z-index: 100;
  &:hover { color: #fff; border-color: #fff; }
}

.crawl-container { width: 100%; height: 100%; display: flex; justify-content: center; perspective: 300px; }
.crawl-content { 
  text-align: center; font-size: 1.5rem; line-height: 2; color: #ddd; 
  position: absolute; top: 100%; 
  animation: scrollUp 90s linear forwards; 
  width: 90%; max-width: 800px; 
}
@keyframes scrollUp { 
  0% { top: 100%; opacity: 0; } 5% { opacity: 1; } 90% { opacity: 1; } 100% { top: -500%; opacity: 0; } 
}
.spacer { height: 50vh; }

.flash-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; z-index: 999; pointer-events: none; }

.title-screen { 
  height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; 
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; cursor: pointer;
  position: relative;
}
.main-logo { font-family: 'VT323', monospace; font-size: 6rem; margin: 0; color: transparent; -webkit-text-stroke: 2px var(--neon-pink); text-shadow: 4px 4px 0px var(--neon-cyan); letter-spacing: 5px; }
.sub-title { font-size: 1.5rem; color: var(--neon-green); margin-top: 10px; }
.press-start { margin-top: 50px; font-size: 1.2rem; animation: blink 1s infinite; }

@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

@media (max-width: 600px) { 
  .crawl-content { font-size: 1rem; } 
  .main-logo { font-size: 3.5rem; }
  .title-text { font-size: 3rem; }
}
@media (max-height: 500px) { .crawl-content { font-size: 1.1rem; line-height: 1.8; } }
</style>