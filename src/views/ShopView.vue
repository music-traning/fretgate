<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePlayerStore } from '@/stores/playerStore';
import { useRouter } from 'vue-router';
import { useSoundStore } from '@/stores/soundStore'; // 追加
import type { Item } from '@/stores/playerStore';

const store = usePlayerStore();
const router = useRouter();
const soundStore = useSoundStore(); // 追加

type ShopMode = 'MENU' | 'BUY' | 'SELL';
const mode = ref<ShopMode>('MENU');
const masterMessage = ref('「……いらっしゃい」');
const showModal = ref(false);
const modalType = ref<'BUY' | 'SELL'>('BUY');
const selectedItem = ref<(Item & { originalIndex?: number }) | null>(null);

const itemsForSale = computed(() => {
  return store.state.shopStock.map((id: number) => {
    return store.getItemDetail(id);
  }).filter((item: any) => item !== undefined) as Item[];
});

const myInventory = computed(() => {
  return store.state.inventory.map((id: number, index: number) => {
    const detail = store.getItemDetail(id);
    return detail ? { ...detail, originalIndex: index } : null;
  }).filter((item: any) => item !== null) as (Item & { originalIndex: number })[];
});

const openTradeModal = (item: Item & { originalIndex?: number }, type: 'BUY' | 'SELL') => {
  selectedItem.value = item;
  modalType.value = type;
  showModal.value = true;
  soundStore.playSe('decision');
};

const executeTrade = () => {
  if (!selectedItem.value) return;

  if (modalType.value === 'BUY') {
    if (store.buyItem(selectedItem.value)) {
      masterMessage.value = `「${selectedItem.value.name}だな。　……いい　センスだ」`;
      soundStore.playSe('coin'); // ▼ チャリーン！
      closeModal();
    } else {
      soundStore.playSe('cancel');
      // alert('「……おい。　カネが　たりないぞ」');
    }
  } else {
    if (selectedItem.value.originalIndex !== undefined) {
      store.sellItem(selectedItem.value.originalIndex, selectedItem.value);
      masterMessage.value = '「……たしかに　あずかった」';
      soundStore.playSe('coin'); // ▼ チャリーン！
      closeModal();
    }
  }
};

const closeModal = () => {
  showModal.value = false;
  selectedItem.value = null;
  soundStore.playSe('cancel');
};

const leaveShop = () => {
  router.push('/town'); 
};

const getItemIcon = (type: string) => {
  if (type === 'consumable') return '☕';
  if (type === 'junk') return '🗑️';
  if (type === 'gear') return '🎸';
  if (type === 'curse') return '💀';
  if (type === 'charm') return '🧿';
  return '📦';
};
</script>

<template>
  <div class="shop-container">
    <div class="status-bar">
      <span>FUNDS: {{ store.state.jCoin }} J</span>
    </div>
    <div class="master-dialog">
      <div class="master-face">🕶️</div>
      <p class="message">{{ masterMessage }}</p>
    </div>

    <main class="interaction-area">
      <div v-if="mode === 'MENU'" class="menu-list">
        <button @click="mode = 'BUY'">BUY (かう)</button>
        <button @click="mode = 'SELL'">SELL (うる)</button>
        <button @click="leaveShop" class="danger">EXIT (でる)</button>
      </div>
      
      <div v-if="mode === 'BUY'" class="shop-content">
        <div class="list-header">
          <button @click="mode = 'MENU'" class="back-btn">← BACK</button>
          <span>STOCK LIST</span>
        </div>
        <div class="card-grid">
          <div 
            v-for="item in itemsForSale" 
            :key="item.id" 
            class="item-card"
            :class="item.type"
            @click="openTradeModal(item, 'BUY')"
          >
            <div class="card-icon">{{ getItemIcon(item.type) }}</div>
            <div class="card-name">{{ item.name }}</div>
            <div class="card-price">{{ item.buy_price }} J</div>
          </div>
        </div>
      </div>

      <div v-if="mode === 'SELL'" class="shop-content">
        <div class="list-header">
          <button @click="mode = 'MENU'" class="back-btn">← BACK</button>
          <span>YOUR INVENTORY</span>
        </div>
        <div class="card-grid">
          <p v-if="myInventory.length === 0" class="empty-msg">（うるものが　なにもない……）</p>
          <div 
            v-for="item in myInventory" 
            :key="item.originalIndex" 
            class="item-card sell-mode"
            @click="openTradeModal(item, 'SELL')"
          >
            <div class="card-icon">{{ getItemIcon(item.type) }}</div>
            <div class="card-name">{{ item.name }}</div>
            <div class="card-price">{{ item.sell_price }} J</div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showModal && selectedItem" class="modal-overlay">
      <div class="modal-window trade-window" :class="selectedItem.type">
        <h2 class="modal-title">
          {{ modalType === 'BUY' ? '>> PURCHASE' : '>> SELL' }}
        </h2>
        <div class="item-detail">
          <div class="detail-icon">{{ getItemIcon(selectedItem.type) }}</div>
          <h3 class="detail-name">{{ selectedItem.name }}</h3>
          <div class="detail-info">
            <p class="desc">{{ selectedItem.description }}</p>
            <div class="price-row">
              <span class="label">PRICE:</span>
              <span class="val">
                {{ modalType === 'BUY' ? selectedItem.buy_price : selectedItem.sell_price }} J
              </span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="confirm-btn" @click="executeTrade">
            {{ modalType === 'BUY' ? 'PAY (支払う)' : 'SELL (売却)' }}
          </button>
          <button class="cancel-btn" @click="closeModal">CANCEL (やめる)</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shop-container {
  height: 100dvh; display: flex; flex-direction: column; padding: 10px;
  background-image: linear-gradient(#001100 1px, transparent 1px), linear-gradient(90deg, #001100 1px, transparent 1px);
  background-size: 40px 40px;
  color: #fff;
  font-family: 'VT323', monospace;
}
.status-bar { border: 1px solid #00f0ff; padding: 5px; margin-bottom: 10px; text-align: right; color: #00f0ff; }
.master-dialog { border: 2px solid #0aff0a; padding: 10px; margin-bottom: 10px; background: rgba(0, 20, 0, 0.8); display: flex; gap: 10px; align-items: center; }
.master-face { font-size: 2.5rem; }
.interaction-area { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

.menu-list button {
  background: transparent; color: #0aff0a; border: 1px solid #0aff0a; padding: 20px; margin-bottom: 10px; width: 100%; cursor: pointer; font-size: 1.5rem; font-family: inherit;
  &:hover { background: #0aff0a; color: #000; }
  &.danger { border-color: #888; color: #888; &:hover { background: #fff; color: #000; } }
}

.shop-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.list-header { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; border-bottom: 2px solid #0aff0a; padding-bottom: 5px; }
.back-btn { background: #000; border: 1px solid #fff; color: #fff; padding: 5px 10px; cursor: pointer; font-family: inherit;}

.card-grid {
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  overflow-y: auto; 
  padding-bottom: 20px;
}

.item-card {
  border: 1px solid #333; background: rgba(0, 20, 0, 0.8);
  padding: 10px; text-align: center; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: space-between;
  height: 120px;
  &:hover { background: #0aff0a; color: #000; .card-price { color: #000; } }
  &.consumable { border-color: #0aff0a; }
  &.junk { border-color: #888; color: #aaa; }
  &.gear { border-color: gold; color: gold; }
  &.curse { border-color: #f0f; color: #f0f; }
}

.card-icon { font-size: 2rem; margin-bottom: 5px; }
.card-name { font-size: 0.9rem; line-height: 1.1; flex: 1; display: flex; align-items: center; word-break: break-all;}
.card-price { font-size: 1rem; font-weight: bold; color: #00f0ff; margin-top: 5px; }
.empty-msg { width: 100%; text-align: center; color: #888; grid-column: 1 / -1; }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
  z-index: 999; display: flex; justify-content: center; align-items: center;
}

.modal-window {
  background: #000; border: 2px solid #fff; padding: 20px; width: 90%; max-width: 400px;
  text-align: center; display: flex; flex-direction: column; gap: 15px;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.2);
  &.consumable { border-color: #0aff0a; box-shadow: 0 0 20px #0aff0a; }
  &.junk { border-color: #888; box-shadow: 0 0 20px #888; }
  &.gear { border-color: gold; box-shadow: 0 0 20px gold; }
  &.curse { border-color: #f0f; box-shadow: 0 0 20px #f0f; }
}

.modal-title { margin: 0; color: #fff; border-bottom: 1px dashed #555; padding-bottom: 10px; }
.item-detail { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.detail-icon { font-size: 4rem; }
.detail-name { font-size: 1.5rem; margin: 0; color: var(--neon-cyan); }
.detail-info { background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 5px; width: 100%; }
.desc { color: #ccc; font-size: 1rem; margin-bottom: 15px; line-height: 1.4; }
.price-row { 
  display: flex; justify-content: center; gap: 10px; font-size: 1.5rem; border-top: 1px solid #555; padding-top: 10px;
  .label { color: #888; }
  .val { color: #00f0ff; font-weight: bold; }
}
.modal-actions {
  display: flex; gap: 10px; margin-top: 10px;
  button { flex: 1; padding: 15px; border: none; font-size: 1.2rem; cursor: pointer; font-family: inherit; font-weight: bold; }
  .confirm-btn { background: #0aff0a; color: #000; &:hover { background: #fff; } }
  .cancel-btn { background: transparent; border: 1px solid #fff; color: #fff; &:hover { background: #333; } }
}
</style>