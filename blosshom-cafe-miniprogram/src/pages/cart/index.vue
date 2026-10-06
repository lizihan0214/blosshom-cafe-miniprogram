<template>
  <view class="page">
    <view class="title">购物车</view><text class="muted subtitle">每一份都将为你现做</text>
    <empty-state v-if="!items.length" title="购物车还是空的" description="去点单页挑一杯喜欢的饮品吧" action="去点单" @action="menu" />
    <view v-else>
      <view v-for="item in items" :key="item.signature" class="cart-item card">
        <view class="details"><text class="item-name">{{ chineseName(item.productName) }}</text><text v-if="englishName(item.productName)" class="item-name-en">{{ englishName(item.productName) }}</text><text class="muted item-options">{{ summary(item.options) }}</text><text class="price">{{ money(item.unitPrice) }}</text></view>
        <view class="stepper"><button @click="change(item, -1)">−</button><text>{{ item.quantity }}</text><button @click="change(item, 1)">＋</button></view>
      </view>
      <view class="summary card"><text>商品合计</text><text class="price total">{{ money(total) }}</text></view>
      <button class="primary checkout" @click="checkout">去结算 · {{ money(total) }}</button>
    </view>
  </view>
</template>

<script>
import EmptyState from '../../components/empty-state/empty-state.vue'
import { getCartItems, getCartTotal, setQuantity } from '../../store/cart'
import { formatMoney } from '../../utils/money'
import { optionSummary } from '../../utils/options'
export default { components: { EmptyState }, data: () => ({ items: [], total: 0 }), onShow() { this.refresh() }, methods: { money: formatMoney, summary: optionSummary, chineseName(name) { return String(name).split(' / ')[0] }, englishName(name) { const parts = String(name).split(' / '); return parts.length > 1 ? parts.slice(1).join(' / ') : '' }, refresh() { this.items = getCartItems(); this.total = getCartTotal() }, change(item, delta) { setQuantity(item.signature, item.quantity + delta); this.refresh() }, menu() { uni.switchTab({ url: '/pages/menu/index' }) }, checkout() { uni.navigateTo({ url: '/pages/checkout/index' }) } } }
</script>

<style scoped>
.subtitle { display: block; margin: 12rpx 0 34rpx; }.cart-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; padding: 26rpx; }.details { flex: 1; min-width: 0; }.item-name, .item-name-en, .details .muted, .details .price { display: block; }.item-name { font-size: 31rpx; font-weight: 600; }.item-name-en { margin-top: 3rpx; color: #8D7D70; font-size: 22rpx; }.details .item-options { margin: 9rpx 0 16rpx; font-size: 23rpx; }.stepper { display: flex; align-items: center; gap: 16rpx; }.stepper button { width: 68rpx; min-width: 68rpx; height: 68rpx; padding: 0; line-height: 64rpx; border: 1rpx solid #E8DED1; border-radius: 50%; color: #5A3826; background: #F7F3EB; }.summary { display: flex; justify-content: space-between; margin-top: 30rpx; padding: 28rpx; }.total { font-size: 36rpx; }.checkout { width: 100%; margin-top: 28rpx; }
</style>
