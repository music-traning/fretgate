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
  };

  /**
   * 【重要】ユーザー操作(Click/Touch)の直後に必ず呼ぶ関数
   * iPhoneのオーディオコンテキストを強制的に「再開」させる
   */
  async function checkAndResume() {
    try {
      if (Tone.context.state !== 'running') {
        console.log('[SoundStore] Force Resuming Context...');
        await Tone.start();
        console.log('[SoundStore] Context Resumed!');
      }
    } catch (e) {
      console.warn('[SoundStore] Resume failed:', e);
    }
  }

  /**
   * オーディオ初期化
   */
  async function initAudio() {
    console.log('[SoundStore] initAudio Start');
    
    // ここでも念のためResumeを呼ぶ
    await checkAndResume();

    if (isReady.value && bgmSynth) {
      console.log('[SoundStore] Already Ready');
      return;
    }

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
      console.log('[SoundStore] Init Success');

    } catch (e) {
      console.error('[SoundStore] Init Failed:', e);
    }
  }

  function playGuitarNote(stringNum: number, fretNum: number) {
    if (!isReady.value || isMuted.value || !guitarSynth) return;
    try {
      const OPEN_STRINGS = [0, 64, 59, 55, 50, 45, 40]; 
      const baseNote = OPEN_STRINGS[stringNum];
      const midiNote = baseNote + fretNum;
      const noteName = Tone.Frequency(midiNote, "midi").toNote();
      
      // 発音の前にコンテキストが死んでないか確認する保険
      if (Tone.context.state !== 'running') {
        Tone.context.resume().then(() => {
            guitarSynth?.triggerAttackRelease(noteName, "8n");
        });
      } else {
        guitarSynth.triggerAttackRelease(noteName, "8n");
      }
    } catch (e) {
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
    checkAndResume, // これを追加
    initAudio, playBgm, stopBgm, playGuitarNote, playSe
  };
});