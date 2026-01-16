import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

export const useSoundStore = defineStore('sound', () => {
  const isReady = ref(false);
  const isMuted = ref(false);
  const currentBgmKey = ref<string | null>(null);

  // 音源ノード
  let bgmSynth: Tone.PolySynth | null = null;
  let guitarSynth: Tone.PolySynth | null = null;
  let seSynth: Tone.PolySynth | null = null;

  const BGM_LIST: Record<string, string> = {
    opening: '/theme.mid', 
    // ending: '/ending.mid',
  };

  /**
   * オーディオ初期化 (iPhone/PWA用・絶対止まらない版)
   */
  async function initAudio() {
    console.log('[SoundStore] initAudio: Start');

    // ▼ 1. まずコンテキストの蘇生を試みる (エラーは握りつぶす)
    try {
      if (Tone.context.state !== 'running') {
        console.log('[SoundStore] Context is suspended. Trying to resume...');
        await Tone.start();
        console.log('[SoundStore] Context Resumed!');
      }
    } catch (e) {
      console.warn('[SoundStore] Resume Failed (Silent Mode):', e);
      // ここで throw しない！失敗しても先に進む！
    }

    // ▼ 2. すでにシンセがあるならここで終了 (再生成しない)
    if (isReady.value && bgmSynth) {
      return;
    }

    // ▼ 3. シンセ生成 (ここでのエラーも握りつぶす)
    try {
      console.log('[SoundStore] Creating Synths...');
      
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
      console.log('[SoundStore] Init Success.');

    } catch (e) {
      console.error('[SoundStore] Synth Creation Failed:', e);
      // アラートは出さず、コンソールのみにする
      // isReady は false のままになるが、関数は正常終了させる
    }
  }

  function playGuitarNote(stringNum: number, fretNum: number) {
    // 準備できてなければ何もしない（エラーにしない）
    if (!isReady.value || isMuted.value || !guitarSynth) return;
    
    try {
      const OPEN_STRINGS = [0, 64, 59, 55, 50, 45, 40]; 
      const baseNote = OPEN_STRINGS[stringNum];
      const midiNote = baseNote + fretNum;
      const noteName = Tone.Frequency(midiNote, "midi").toNote();
      guitarSynth.triggerAttackRelease(noteName, "8n");
    } catch (e) {
      console.warn('Guitar Play Error:', e);
    }
  }

  function playSe(type: 'decision' | 'cancel' | 'coin' | 'damage' | 'clear') {
    if (!isReady.value || isMuted.value || !seSynth) return;
    try {
      switch (type) {
        case 'decision': seSynth.triggerAttackRelease("C6", "32n"); break;
        case 'cancel': seSynth.triggerAttackRelease("G4", "32n"); break;
        case 'coin': seSynth.triggerAttackRelease(["B5", "E6"], "16n"); break;
        case 'damage': seSynth.triggerAttackRelease(["C2", "F#2"], "8n"); break;
        case 'clear': seSynth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "8n"); break;
      }
    } catch (e) {
      console.warn('SE Play Error:', e);
    }
  }

  async function playBgm(key: string) {
    if (isMuted.value) return;
    if (currentBgmKey.value === key) return;
    
    try {
      stopBgm();
      
      // ここでもし initAudio が失敗していても、try-catch で守られているので止まらない
      if (!isReady.value) await initAudio();

      const url = BGM_LIST[key];
      if (!url) return;

      const response = await fetch(url);
      if (!response.ok) return; // 読み込めなければ静かに終了
      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);

      if (!bgmSynth) return;

      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;

      midi.tracks.forEach(track => {
        track.notes.forEach(note => {
          Tone.Transport.schedule((time) => {
            // ここでシンセが死んでいてもエラーで止まらないようにオプショナルチェーン使用
            bgmSynth?.triggerAttackRelease(note.name, note.duration, time, note.velocity);
          }, note.time);
        });
      });

      Tone.Transport.loop = true;
      Tone.Transport.loopEnd = midi.duration;
      Tone.Transport.start();
      currentBgmKey.value = key;

    } catch (e) {
      console.error('[SoundStore] BGM Play Error:', e);
      // BGM再生に失敗しても、ゲーム進行は止めない！
    }
  }

  function stopBgm() {
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (bgmSynth) bgmSynth.releaseAll();
      currentBgmKey.value = null;
    } catch (e) {
      console.warn('Stop BGM Error:', e);
    }
  }

  return {
    isReady, isMuted,
    initAudio, playBgm, stopBgm, playGuitarNote, playSe
  };
});