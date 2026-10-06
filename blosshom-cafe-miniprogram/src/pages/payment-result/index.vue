<template>
  <view class="page result-page">
    <view v-if="order && order.demo" class="demo-banner">{{ modeBanner }}</view>
    <view v-if="loading" class="center muted">正在读取订单…</view>
    <view v-else-if="order" class="result card">
      <text class="icon">{{ icon }}</text><text class="result-title">{{ title }}</text><text class="muted message">{{ message }}</text>
      <view v-if="order.demo && order.paymentStatus === 'UNPAID'" class="actions"><button class="primary" @click="choose('success')">模拟支付成功</button><button class="secondary" @click="choose('cancel')">模拟用户取消</button></view>
      <view v-if="order.pickupCode" class="pickup"><text>{{ order.demo ? '模拟取餐号' : '取餐号' }}</text><text class="code">{{ order.pickupCode }}</text></view>
      <view v-if="order.diningMode === 'dine-in' && order.tableNo" class="table-confirm"><text>堂食桌号</text><text class="table-code">{{ order.tableNo }}</text></view>
      <view class="amount"><text>订单金额</text><text class="price">{{ money(order.amount) }}</text></view>
      <button v-if="!order.demo && order.paymentStatus !== 'PAID'" class="secondary orders" @click="refresh">重新查询支付结果</button>
      <button class="secondary orders" @click="openDetail">查看订单详情</button>
    </view>
  </view>
</template>

<script>
import { queryOrder } from '../../services/order'
import { simulatePayment } from '../../services/payment'
import { clearCart } from '../../store/cart'
import { formatMoney } from '../../utils/money'
export default {
  data: () => ({ orderNo: '', order: null, loading: true, hint: '', attempts: 0, timer: null }),
  computed: {
    modeBanner() { return '模拟支付结果 · 不代表真实微信支付' },
    title() { return { UNPAID: this.order.demo ? '等待模拟支付' : '等待支付', PAYING: '支付确认中', PAID: this.order.demo ? '模拟支付成功' : '支付成功', CLOSED: this.order.demo ? '模拟支付已取消' : '订单已关闭' }[this.order.paymentStatus] || '支付处理中' },
    message() { if (!this.order.demo && this.hint === 'cancelled' && this.order.paymentStatus !== 'PAID') return '你已取消支付。如已扣款，请点击下方按钮重新查询。'; return { UNPAID: this.order.demo ? '请选择一个模拟结果；此操作不会扣款。' : '订单尚未完成支付。', PAYING: '正在确认付款结果，请稍候。', PAID: this.order.demo ? '仅用于验证前端流程，正式取餐号须由云端在确认真实付款后生成。' : this.order.diningMode === 'dine-in' ? '订单已发送到门店，请在座位上稍候。' : '订单已发送到门店，请留意取餐提示。', CLOSED: '订单未付款，门店不会开始制作。' }[this.order.paymentStatus] || '可稍后重新查询订单。' },
    icon() { return this.order.paymentStatus === 'PAID' ? '✓' : this.order.paymentStatus === 'CLOSED' ? '×' : '…' }
  },
  onLoad(query) { this.orderNo = query.orderNo || ''; this.hint = query.hint || ''; this.refresh(true) },
  onUnload() { if (this.timer) clearTimeout(this.timer) },
  methods: {
    money: formatMoney,
    async refresh(auto = false) { if (this.timer) clearTimeout(this.timer); this.loading = !this.order; try { this.order = await queryOrder(this.orderNo); if (auto && this.order && ['UNPAID', 'PAYING'].includes(this.order.paymentStatus) && this.attempts < 4) { this.attempts += 1; this.timer = setTimeout(() => this.refresh(true), 1500) } else if (this.order && this.order.paymentStatus === 'PAID') clearCart() } catch (error) { uni.showToast({ title: error.message, icon: 'none' }) } finally { this.loading = false } },
    async choose(outcome) { this.order = await simulatePayment(this.order, outcome); if (outcome === 'success') clearCart() },
    openDetail() { uni.redirectTo({ url: `/pages/order-detail/index?orderNo=${encodeURIComponent(this.orderNo)}` }) }
  }
}
</script>

<style scoped>
.demo-banner { padding: 20rpx; border-left: 6rpx solid #C7A27C; color: #5A3826; background: #F1E5D4; text-align: left; font-size: 24rpx; }.center { padding: 160rpx 0; text-align: center; }.result { margin-top: 36rpx; padding: 52rpx 34rpx; text-align: center; }.icon { display: block; width: 100rpx; height: 100rpx; margin: 0 auto 26rpx; line-height: 96rpx; border: 2rpx solid #68705A; border-radius: 50%; color: #68705A; font-size: 54rpx; }.result-title { display: block; font-size: 40rpx; font-weight: 600; }.message { display: block; max-width: 520rpx; margin: 18rpx auto 36rpx; line-height: 1.7; }.actions button { width: 100%; margin-top: 18rpx; }.secondary { min-height: 82rpx; line-height: 82rpx; border: 1rpx solid #C7A27C; border-radius: 16rpx; color: #5A3826; background: #FFFDF8; }.pickup { margin: 30rpx 0 16rpx; padding: 28rpx; border-radius: 14rpx; color: #FFFDF8; background: #68705A; }.pickup text { display: block; }.code { margin-top: 12rpx; font-size: 60rpx; font-weight: 600; letter-spacing: 4rpx; }.table-confirm { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; padding: 20rpx 24rpx; border: 1rpx solid #E8DED1; border-radius: 12rpx; background: #F7F3EB; }.table-code { color: #5A3826; font-size: 34rpx; font-weight: 600; }.amount { display: flex; justify-content: space-between; padding: 28rpx 0; border-top: 1rpx solid #E8DED1; }.orders { width: 100%; margin-top: 24rpx; }
</style>
