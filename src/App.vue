<script setup lang="ts">
// ここには特にロジックは不要です
</script>

<template>
  <router-view />
</template>

<style>
/* 全体のスタイルリセット（黒背景） */
body {
  margin: 0;
  padding: 0;
  background-color: #000; /* 漆黒 */
  color: #fff;
  font-family: 'Courier New', monospace; /* レトロ感 */
  overflow: hidden; /* 余計なスクロールを防ぐ */
}

#app {
  width: 100vw;
  height: 100vh;
}
</style>