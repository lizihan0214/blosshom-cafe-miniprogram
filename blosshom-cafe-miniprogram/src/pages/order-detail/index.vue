<template>
  <view class="page">
    <view v-if="loading" class="loading muted">正在查询订单…</view>
    <view v-else-if="order">
      <view class="summary card">
        <view class="summary-head"><text class="title-small">{{ order.demo ? '模拟订单' : '订单' }}</text><text class="status">{{ status }}</text></view>
        <text class="order-number">{{ order.orderNo }}</text>
        <view v-if="order.pickupCode" class="pickup"><text>{{ order.demo ? '模拟取餐号' : '取餐号' }}</text><text class="pickup-code">{{ order.pickupCode }}</text></view>
      </view>
      <view class="section-title">商品明细</view>
      <view class="card details">
        <view v-for="(item, index) in order.items" :key="index" class="line item-line">
          <view><text class="item-name">{{ item.productName }} × {{ item.quantity }}</text><text class="muted option">{{ summary(item.options) }}</text></view>
          <text>{{ money((item.subtotal || item.unitPrice * item.quantity)) }}</text>
        </view>
        <view class="line total"><text>合计</text><text class="price">{{ money(order.amount) }}</text></view>
      </view>
      <view class="section-title">取餐信息</view>
      <view class="card details">
        <view class="line"><text class="muted">用餐方式</text><text>{{ diningLabel }}</text></view>
        <view class="line"><text class="muted">取餐称呼</text><text>{{ order.pickupName }}</text></view>
        <view v-if="order.remark" class="line"><text class="muted">备注</text><text class="remark">{{ order.remark }}</text></view>
        <view class="line"><text class="muted">创建时间</text><text>{{ time }}</text></view>
      </view>
      <view v-if="!order.demo && ['UNPAID', 'PAYING'].includes(order.paymentStatus)" class="notice">订单尚未确认付款；如已完成微信支付，请点击“重新查询”，最终状态以云端查单和支付回调为准。</view>
      <button class="secondary refresh" @click="load">重新查询</button>
    </view>
  </view>
</template>

<script>
import { queryOrder } from '../../services/order'
import { formatMoney } from '../../utils/money'
import { optionSummary } from '../../utils/options'
import { orderStatusText } from '../../utils/order-status'

export default {
  data: () => ({ orderNo: '', order: null, loading: true }),
  computed: {
    status() { return orderStatusText(this.order) },
    diningLabel() { return this.order.diningMode === 'takeaway' ? '外带' : this.order.tableNo ? `${this.order.tableNo} 桌 · 堂食` : '堂食' },
    time() { return new Date(this.order.createdAt).toLocaleString() }
  },
  onLoad(query) { this.orderNo = query.orderNo || ''; this.load() },
  methods: {
    money: formatMoney,
    summary: optionSummary,
    async load() { this.loading = true; try { this.order = await queryOrder(this.orderNo) } catch (error) { uni.showToast({ title: error.message || '订单查询失败', icon: 'none' }) } finally { this.loading = false } }
  }
}
</script>

<style scoped>
.loading { padding: 160rpx 0; text-align: center; }.summary, .details { padding: 28rpx; }.summary-head, .line { display: flex; justify-content: space-between; gap: 24rpx; }.title-small { font-size: 36rpx; font-weight: 600; }.status { color: #68705A; font-weight: 600; }.order-number { display: block; margin-top: 12rpx; color: #8D7D70; font-size: 22rpx; word-break: break-all; }.pickup { display: flex; align-items: center; justify-content: space-between; margin-top: 26rpx; padding: 20rpx 24rpx; border-radius: 12rpx; color: #FFFDF8; background: #68705A; }.pickup-code { font-size: 44rpx; font-weight: 600; letter-spacing: 3rpx; }.line { margin-bottom: 24rpx; }.line:last-child { margin-bottom: 0; }.item-line { align-items: flex-start; }.item-name, .option { display: block; }.option { margin-top: 7rpx; font-size: 22rpx; }.total { margin-top: 4rpx; padding-top: 24rpx; border-top: 1rpx solid #E8DED1; font-weight: 600; }.remark { max-width: 420rpx; text-align: right; word-break: break-word; }.notice { margin-top: 28rpx; padding: 20rpx 24rpx; border-left: 6rpx solid #C7A27C; color: #5A3826; background: #F1E5D4; font-size: 23rpx; line-height: 1.6; }.secondary { min-height: 82rpx; line-height: 82rpx; border: 1rpx solid #C7A27C; border-radius: 16rpx; color: #5A3826; background: #FFFDF8; }.refresh { width: 100%; margin-top: 28rpx; }
</style>
