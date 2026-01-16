// src/types.ts
export type ItemType = 'consumable' | 'junk' | 'gear' | 'curse';

export interface Item {
  id: number;
  name: string;
  description: string;
  type: ItemType;
  buy_price: number;
  sell_price: number;
  effect?: (state: any) => void; // 使用時の効果
}