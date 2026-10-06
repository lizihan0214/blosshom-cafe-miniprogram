<template>
  <view class="product card" :class="{ disabled: item.soldOut }" @click="$emit('add', item)">
    <view class="picture" :style="{ background: item.imageTone || '#E8DED1' }"><image v-if="item.image" class="product-image" :src="item.image" mode="aspectFill" /><text v-else>Blosshom</text></view>
    <view class="content">
      <view class="row"><text class="product-name">{{ item.name }}</text><text v-if="item.soldOut" class="sold">售罄</text></view>
      <text class="description">{{ item.description }}</text>
      <view class="row bottom"><text class="price">{{ money(item.basePrice) }}</text><button class="add" :disabled="item.soldOut" @click.stop="$emit('add', item)">+</button></view>
    </view>
  </view>
</template>

<script>
import { formatMoney } from '../../utils/money'
export default { props: { item: { type: Object, required: true } }, methods: { money: formatMoney } }
</script>

<style scoped>
.product { display: flex; margin-bottom: 20rpx; overflow: hidden; }
.disabled { opacity: .58; }
.picture { width: 190rpx; min-height: 190rpx; display: flex; align-items: center; justify-content: center; overflow: hidden; color: rgba(52,38,31,.58); font: italic 24rpx Georgia, serif; }.product-image { width: 100%; height: 100%; min-height: 190rpx; }
.content { flex: 1; padding: 22rpx; }
.row { display: flex; align-items: center; justify-content: space-between; }
.product-name { font-size: 31rpx; font-weight: 600; }
.description { display: block; min-height: 62rpx; margin-top: 10rpx; color: #8D7D70; font-size: 24rpx; line-height: 1.45; }
.bottom { margin-top: 12rpx; }
.sold { color: #8D7D70; font-size: 22rpx; }
.add { width: 64rpx; min-width: 64rpx; height: 64rpx; padding: 0; line-height: 60rpx; border-radius: 50%; color: #FFFDF8; background: #5A3826; font-size: 38rpx; }
</style>
