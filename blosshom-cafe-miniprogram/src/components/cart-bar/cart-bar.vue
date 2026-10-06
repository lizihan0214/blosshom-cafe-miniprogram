<template>
  <view v-if="count" class="cart-bar">
    <view><text class="count">{{ count }}</text><text class="total">{{ money(total) }}</text></view>
    <button class="checkout" hover-class="checkout-active" @click="$emit('checkout')">查看购物车</button>
  </view>
</template>

<script>
import { formatMoney } from '../../utils/money'
export default { props: { count: Number, total: Number }, methods: { money: formatMoney } }
</script>

<style scoped>
.cart-bar { position: fixed !important; z-index: 10; left: 0; right: 0; bottom: calc(0rpx - env(safe-area-inset-bottom)) !important; display: flex; align-items: center; box-sizing: border-box; width: 100vw; height: 88rpx; min-height: 88rpx; max-height: 88rpx; padding: 12rpx 28rpx; border-top: 1rpx solid rgba(255,253,248,.16); background: #34261F; box-shadow: 0 -10rpx 30rpx rgba(52,38,31,.14); }
.count { display: inline-block; min-width: 42rpx; height: 42rpx; margin-right: 18rpx; line-height: 42rpx; text-align: center; border-radius: 21rpx; color: #34261F; background: #C7A27C; font-size: 22rpx; }.total { color: #FFFDF8; font-size: 32rpx; font-weight: 600; }
.checkout { position: absolute; top: 12rpx; right: 28rpx; display: flex; align-items: center; justify-content: center; height: 64rpx; margin: 0; padding: 0 30rpx; border-radius: 32rpx; color: #34261F; background: #FFFDF8; font-size: 26rpx; line-height: 1; }
.checkout-active { opacity: .84; }
</style>
