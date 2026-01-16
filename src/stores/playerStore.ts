import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { ref } from 'vue';
import itemsData from '@/data/items.json';

// 型定義をしっかりエクスポート
export interface Item {
  id: number;
  name: string;
  description: string;
  type: string;
  buy_price: number;
  sell_price: number;
  rarity?: number;
}

export const usePlayerStore = defineStore('player', () => {
  // ■ State (データ保存)
  const state = useStorage('fretgate_save_v3', { // バージョン変えてリセット
    jCoin: 1000,
    inventory: [] as number[],
    // WIZシステム: 店の在庫IDリスト（初期はID 1〜5のみ）
    shopStock: [1, 2, 3, 4, 5] as number[],
    currentStage: 1,
    maxStageReached: 1,
    deathCount: 0,
    // ▼ 追加: 難易度
    difficulty: 'NORMAL' as 'EASY' | 'NORMAL' | 'HARD',
  });

  const torch = ref(100);
  const maxTorch = ref(100);

  // ■ Actions (機能)

  // アイテム詳細を取得
  function getItemDetail(id: number): Item | undefined {
    return itemsData.find((i) => i.id === id) as Item | undefined;
  }

  // 購入
  function buyItem(item: Item) {
    if (state.value.jCoin >= item.buy_price) {
      state.value.jCoin -= item.buy_price;
      state.value.inventory.push(item.id);
      return true;
    }
    return false;
  }

  // 売却（WIZシステム：売ったものは店に並ぶ）
  function sellItem(index: number, item: Item) {
    state.value.inventory.splice(index, 1);
    state.value.jCoin += item.sell_price;

    // 在庫になければ追加
    if (!state.value.shopStock.includes(item.id)) {
      state.value.shopStock.push(item.id);
      state.value.shopStock.sort((a, b) => a - b); // ID順に整頓
    }
  }

  function addCoin(amount: number) {
    state.value.jCoin += amount;
  }

  function die() {
    state.value.deathCount++;
    state.value.jCoin = Math.floor(state.value.jCoin / 2);
  }

  function consumeItem(itemId: number): string {
    const itemIndex = state.value.inventory.indexOf(itemId);
    if (itemIndex === -1) return 'アイテムヲ　モッテイナイ';

    let message = '';
    let consumed = false;

    // 簡易ロジック: ID 1~10 は回復
    if (itemId <= 10) {
      if (torch.value >= maxTorch.value) return 'イマハ　ヒツヨウナイ (満タン)';
      torch.value = Math.min(torch.value + 30, maxTorch.value);
      message = '回復シタ (TORCH +30)';
      consumed = true;
    } else {
      message = 'ツカイカタガ　ワカラナイ……';
      consumed = false;
    }

    if (consumed) {
      state.value.inventory.splice(itemIndex, 1);
    }
    return message;
  }

  // ドロップ抽選
  function generateDropItem(): Item | null {
    if (Math.random() < 0.1) return null;
    const totalRarity = itemsData.reduce((sum, item) => sum + (item.rarity || 0), 0);
    let randomValue = Math.random() * totalRarity;
    for (const item of itemsData) {
      randomValue -= (item.rarity || 0);
      if (randomValue < 0) return item as Item;
    }
    return itemsData[0] as Item;
  }

  // アイテム入手
  function obtainItem(item: Item) {
    state.value.inventory.push(item.id);
  }

  // 呪い解除
  function removeCurse(index: number, cost: number): boolean {
    if (state.value.jCoin >= cost) {
      state.value.jCoin -= cost;
      state.value.inventory.splice(index, 1);
      return true;
    }
    return false;
  }

  // ステージ解放
  function unlockNextStage(currentStageId: number) {
    if (currentStageId >= state.value.maxStageReached) {
      const next = Math.min(currentStageId + 1, 5);
      state.value.maxStageReached = next;
    }
  }

  // 全てをexport
  return {
    state, torch, maxTorch,
    getItemDetail, buyItem, sellItem, addCoin, die, consumeItem,
    generateDropItem, obtainItem, removeCurse, unlockNextStage,
    allItems: itemsData
  };
});