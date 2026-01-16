<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSoundStore } from '@/stores/soundStore';

const router = useRouter();
const soundStore = useSoundStore();

const showEndCard = ref(false); // エンドカード表示フラグ

// スクロール完了時に呼ばれる
const onCrawlEnd = () => {
  showEndCard.value = true;
};

// タイトルへ戻る
const returnToTitle = () => {
  soundStore.stopBgm();
  router.push('/');
};

onMounted(async () => {
  await soundStore.initAudio();
  soundStore.playBgm('opening'); // テーマ曲を再生
});
</script>

<template>
  <div class="ending-container" @click="returnToTitle">
    
    <div class="stars"></div>
    <div class="twinkling"></div>

    <div v-if="!showEndCard" class="crawl-container">
      <div class="crawl-content" @animationend="onCrawlEnd">
        <p>ながい　たたかいは　おわった。</p>
        <br>
        <p>AIとの　しとうを　せいし</p>
        <p>ギタリストは　ついに</p>
        <p>フレットボードを　マスターした。</p>
        <br>
        <p>だが　かれは　きづく。</p>
        <p>「6げんの　まじゅつし」への　みちは</p>
        <p>まだ　はじまった　ばかりだと。</p>
        <br>
        <p>レジェンドたちの　テクニック。</p>
        <p>たましいを　ゆさぶる　リズム。</p>
        <p>セッションでの　あいてへの　リスペクト。</p>
        <br>
        <p>ギタリストは　ネオ・オオサカを</p>
        <p>あとにした。</p>
        <br>
        <p>これは　いっしょうを　かけた</p>
        <p>ミッションだ。</p>
        <br>
        <p>すべては　たびだちの</p>
        <p>じょしょうに　すぎない。</p>
        <p>あらたな　ステージが　まっている。</p>
        <br>
        <p>いつか　だれかに</p>
        <p>じぶんの　おとが　とどくように……。</p>
        
        <div class="spacer"></div>
      </div>
    </div>

    <div v-else class="end-card-screen">
      <div class="end-card">
        <h1>THANK YOU FOR PLAYING</h1>
        <p class="sub">- FRETGATE -</p>
        <p class="click-hint">CLICK TO TITLE</p>
      </div>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.ending-container {
  width: 100vw; height: 100vh;
  background: #000; color: #fff;
  overflow: hidden; position: relative;
  font-family: 'DotGothic16', sans-serif;
  cursor: pointer;
}

/* 星空背景 */
.stars, .twinkling {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; display: block;
}
.stars { background: #000 url('http://www.script-tutorials.com/demos/360/images/stars.png') repeat top center; z-index: 0; }
.twinkling { background: transparent url('http://www.script-tutorials.com/demos/360/images/twinkling.png') repeat top center; z-index: 1; animation: move-twink-back 200s linear infinite; opacity: 0.5; }

@keyframes move-twink-back {
  from {background-position:0 0;}
  to {background-position:-10000px 5000px;}
}

/* スクロールエリア */
.crawl-container {
  position: relative; z-index: 10;
  width: 100%; height: 100%;
  display: flex; justify-content: center;
  perspective: 300px;
}

.crawl-content {
  text-align: center; font-size: 1.5rem; line-height: 2.2; color: #ddd;
  position: absolute; top: 100%;
  
  /* ▼ 修正: 時間を90秒に延長 */
  animation: scrollUp 90s linear forwards; 
  
  width: 90%; max-width: 800px;
}

/* ▼ 修正: -600%まで移動させて確実に画面外へ飛ばす */
@keyframes scrollUp {
  0% { top: 100%; opacity: 0; }
  5% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: -600%; opacity: 0; }
}

.spacer { height: 50vh; }

/* エンドカード画面 */
.end-card-screen {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  z-index: 20;
  animation: fadeIn 2s ease forwards;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.end-card {
  text-align: center;
  border: 4px double #fff;
  padding: 40px;
  background: rgba(0,0,0,0.8);
  box-shadow: 0 0 50px rgba(255, 255, 255, 0.2);
}

h1 { font-family: 'VT323', monospace; font-size: 4rem; color: var(--neon-cyan); margin: 0; text-shadow: 0 0 20px var(--neon-cyan); }
.sub { font-family: 'VT323', monospace; font-size: 2rem; color: #888; margin-top: 10px; }
.click-hint { margin-top: 30px; animation: blink 1s infinite; font-size: 1.2rem; }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

@media (max-width: 600px) {
  .crawl-content { font-size: 1.1rem; }
  h1 { font-size: 2.5rem; }
  .end-card { padding: 20px; width: 90%; }
}
</style>