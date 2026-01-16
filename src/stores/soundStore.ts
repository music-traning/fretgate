import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

export const useSoundStore = defineStore('sound', () => {
  const isReady = ref(false);
  const isMuted = ref(false);
  const currentBgmKey = ref<string | null>(null);

  let bgmSynth: Tone.PolySynth | null = null;
  let guitarSynth: Tone.PolySynth | null = null;
  let seSynth: Tone.PolySynth | null = null;

  const BGM_LIST: Record<string, string> = {
    opening: '/theme.mid', 
  };

  /**
   * 【最終奥義】iOS PWA用の強制アンロック処理
   * Tone.jsを経由せず、Raw Contextで無音バッファを再生してこじ開ける
   */
  function unlockAudio() {
    try {
      // 生のAudioContextを取得
      const ctx = Tone.context.rawContext as AudioContext;
      
      // 1. 無音のバッファを作成 (0.1秒)
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      // 2. 出力先に繋いで再生
      source.connect(ctx.destination);
      if (source.start) {
        source.start(0);
      } else if ((source as any).noteOn) {
        (source as any).noteOn(0); // 古いiOS互換
      }

      // 3. 念押しでResume
      if (ctx.state !== 'running') {
        ctx.resume();
      }
      
      console.log('[SoundStore] Audio Unlocked via Silent Buffer');
    } catch (e) {
      console.warn('[SoundStore] Unlock failed:', e);
    }
  }

  /**
   * オーディオ初期化
   */
  async function initAudio() {
    if (isReady.value && bgmSynth) return;

    try {
      // 初期化時にもアンロックを試みる
      unlockAudio();
      await Tone.start();

      bgmSynth = new Tone.PolySynth(Tone.Synth).toDestination();
      bgmSynth.volume.value = -12;
      bgmSynth.set({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
      });

      seSynth = new Tone.PolySynth(Tone.Synth).toDestination();
      seSynth.volume.value = -8;
      seSynth.set({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 1 }
      });

      guitarSynth = new Tone.PolySynth(Tone.Synth).toDestination();
      guitarSynth.volume.value = -5;
      guitarSynth.set({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 1.2 }
      });

      isReady.value = true;
      console.log('[SoundStore] Init Success');
    } catch (e) {
      console.error('[SoundStore] Init Failed:', e);
    }
  }

  function playGuitarNote(stringNum: number, fretNum: number) {
    if (!isReady.value || isMuted.value || !guitarSynth) return;
    
    // ここで resume() を待つとラグの原因になるので、Fire & Forgetにする
    try {
      if (Tone.context.state !== 'running') {
        Tone.context.resume(); // 待たない
      }
      
      const OPEN_STRINGS = [0, 64, 59, 55, 50, 45, 40]; 
      const baseNote = OPEN_STRINGS[stringNum];
      const midiNote = baseNote + fretNum;
      const noteName = Tone.Frequency(midiNote, "midi").toNote();
      
      guitarSynth.triggerAttackRelease(noteName, "8n");
    } catch (e) {
      // エラーが出てもゲーム進行は止めない
      console.warn('Guitar Error:', e);
    }
  }

  function playSe(type: 'decision' | 'cancel' | 'coin' | 'damage' | 'clear') {
    if (!isReady.value || isMuted.value || !seSynth) return;
    try {
      if (Tone.context.state !== 'running') Tone.context.resume();

      switch (type) {
        case 'decision': seSynth.triggerAttackRelease("C6", "32n"); break;
        case 'cancel': seSynth.triggerAttackRelease("G4", "32n"); break;
        case 'coin': seSynth.triggerAttackRelease(["B5", "E6"], "16n"); break;
        case 'damage': seSynth.triggerAttackRelease(["C2", "F#2"], "8n"); break;
        case 'clear': seSynth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "8n"); break;
      }
    } catch (e) { console.warn('SE Error:', e); }
  }

  async function playBgm(key: string) {
    if (isMuted.value) return;
    if (currentBgmKey.value === key) return;
    
    try {
      // アンロック実行
      unlockAudio();
      
      stopBgm();
      if (!isReady.value) await initAudio();

      const url = BGM_LIST[key];
      if (!url) return;

      const response = await fetch(url);
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);

      if (!bgmSynth) return;

      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;

      midi.tracks.forEach(track => {
        track.notes.forEach(note => {
          Tone.Transport.schedule((time) => {
            bgmSynth?.triggerAttackRelease(note.name, note.duration, time, note.velocity);
          }, note.time);
        });
      });

      Tone.Transport.loop = true;
      Tone.Transport.loopEnd = midi.duration;
      Tone.Transport.start();
      currentBgmKey.value = key;
    } catch (e) {
      console.error('[SoundStore] BGM Error:', e);
    }
  }

  function stopBgm() {
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (bgmSynth) bgmSynth.releaseAll();
      currentBgmKey.value = null;
    } catch (e) {}
  }

  return {
    isReady, isMuted,
    unlockAudio, // ← これを公開
    initAudio, playBgm, stopBgm, playGuitarNote, playSe
  };
});