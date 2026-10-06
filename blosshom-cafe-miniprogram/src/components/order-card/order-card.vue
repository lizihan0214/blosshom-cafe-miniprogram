<template>
  <view class="order card" hover-class="order-active" @click="$emit('click')">
    <view class="head"><text class="number">{{ order.demo ? '模拟订单' : '订单' }} {{ order.orderNo }}</text><text class="status">{{ status }}</text></view>
    <text v-for="(item, index) in order.items" :key="index" class="item">{{ item.productName }} × {{ item.quantity }} · {{ summary(item.options) }}</text>
    <view class="foot"><view><text class="muted time">{{ time }}</text><text v-if="order.diningMode === 'dine-in' && order.tableNo" class="table-no">{{ order.tableNo }} 桌 · 堂食</text><text v-else class="table-no">外带</text></view><text class="price">{{ money(order.amount) }}</text></view>
    <view v-if="order.pickupCode" class="pickup"><text>{{ order.demo ? '模拟取餐号' : '取餐号' }}</text><text class="pickup-code">{{ order.pickupCode }}</text></view>
  </view>
</template>

<script>
import { formatMoney } from '../../utils/money'
import { optionSummary } from '../../utils/options'
import { orderStatusText } from '../../utils/order-status'
export default {
  props: { order: { type: Object, required: true } },
  computed: { status() { return orderStatusText(this.order) }, time() { return new Date(this.order.createdAt).toLocaleString() } },
  methods: { money: formatMoney, summary: optionSummary }
}
</script>

<style scoped>
.order { margin-bottom: 20rpx; padding: 26rpx; }.order-active { opacity: .82; }.head, .foot { display: flex; justify-content: space-between; gap: 18rpx; }.number { overflow: hidden; color: #8D7D70; font-size: 22rpx; text-overflow: ellipsis; white-space: nowrap; }.status { flex-shrink: 0; color: #68705A; font-weight: 600; }.item { display: block; margin-top: 18rpx; font-size: 26rpx; }.foot { align-items: flex-end; margin-top: 24rpx; padding-top: 20rpx; border-top: 1rpx solid #E8DED1; }.time, .table-no { display: block; font-size: 22rpx; }.table-no { margin-top: 7rpx; color: #5A3826; font-weight: 600; }.pickup { display: flex; align-items: center; justify-content: space-between; margin-top: 22rpx; padding: 18rpx 22rpx; border-radius: 12rpx; color: #FFFDF8; background: #68705A; }.pickup-code { font-size: 38rpx; font-weight: 600; }
</style>
