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
   * オーディオ初期化 (安全第一モード)
   */
  async function initAudio() {
    if (isReady.value) return;
    
    console.log('[SoundStore] Initializing...');
    try {
      await Tone.start();
      console.log('[SoundStore] Tone started.');
      isReady.value = true;

      // 1. BGM用シンセ (空で作ってから設定する安全策)
      bgmSynth = new Tone.PolySynth(Tone.Synth).toDestination();
      bgmSynth.volume.value = -12;
      bgmSynth.set({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
      });

      // 2. SE用シンセ
      seSynth = new Tone.PolySynth(Tone.Synth).toDestination();
      seSynth.volume.value = -8;
      seSynth.set({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 1 }
      });

      // 3. ギター用シンセ
      // PluckSynthは相性問題が出やすいので、まずはSynthで代用して確実に動かす
      guitarSynth = new Tone.PolySynth(Tone.Synth).toDestination();
      guitarSynth.volume.value = -5;
      guitarSynth.set({
        oscillator: { type: "triangle" }, // 矩形波やノコギリ波でもOK
        envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 1.2 }
      });

      console.log('[SoundStore] All Synths created successfully.');

    } catch (e: any) {
      console.error('[SoundStore] Init Error:', e);
      alert(`【深刻なエラー】オーディオ初期化に失敗しました。\n原因: ${e.message || e}`);
    }
  }

  function playGuitarNote(stringNum: number, fretNum: number) {
    if (isMuted.value || !guitarSynth) return;
    const OPEN_STRINGS = [0, 64, 59, 55, 50, 45, 40]; 
    const baseNote = OPEN_STRINGS[stringNum];
    const midiNote = baseNote + fretNum;
    const noteName = Tone.Frequency(midiNote, "midi").toNote();
    guitarSynth.triggerAttackRelease(noteName, "8n");
  }

  function playSe(type: 'decision' | 'cancel' | 'coin' | 'damage' | 'clear') {
    if (isMuted.value || !seSynth) return;
    switch (type) {
      case 'decision': seSynth.triggerAttackRelease("C6", "32n"); break;
      case 'cancel': seSynth.triggerAttackRelease("G4", "32n"); break;
      case 'coin': seSynth.triggerAttackRelease(["B5", "E6"], "16n"); break;
      case 'damage': seSynth.triggerAttackRelease(["C2", "F#2"], "8n"); break;
      case 'clear': seSynth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "8n"); break;
    }
  }

  /**
   * BGM再生 (詳細診断付き)
   */
  async function playBgm(key: string) {
    if (isMuted.value) return;
    if (currentBgmKey.value === key) return;
    
    stopBgm();
    
    // 初期化がまだなら試みる
    if (!isReady.value) {
      try {
        await initAudio();
      } catch(e) {
        return; // 初期化失敗ならBGMも諦める
      }
    }

    const url = BGM_LIST[key];
    if (!url) {
      console.error(`BGM Key "${key}" not found.`);
      return;
    }

    console.log(`[SoundStore] Trying to fetch BGM: ${url}`);

    try {
      // ▼ 直接fetchしてステータスを確認する（原因切り分けのため）
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`ファイルが見つかりません (Status: ${response.status})`);
      }

      // データをArrayBufferとして取得
      const arrayBuffer = await response.arrayBuffer();
      // MIDIデータとして解析
      const midi = new Midi(arrayBuffer);

      console.log('[SoundStore] MIDI Parsed. Name:', midi.name);

      if (!bgmSynth) return;

      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;

      // ノート登録
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

    } catch (e: any) {
      console.error('[SoundStore] BGM Error:', e);
      alert(`BGM再生エラー\nURL: ${url}\n原因: ${e.message}`);
    }
  }

  function stopBgm() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (bgmSynth) bgmSynth.releaseAll();
    currentBgmKey.value = null;
  }

  return {
    isReady, isMuted,
    initAudio, playBgm, stopBgm, playGuitarNote, playSe
  };
});