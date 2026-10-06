<template>
  <view class="page">
    <view class="heading"><view><text class="title">我的订单</text><text class="muted note">{{ modeNote }}</text></view><button class="refresh" :disabled="loading" @click="load">{{ loading ? '刷新中' : '刷新' }}</button></view>
    <view v-if="!cloudMode" class="demo-banner">{{ modeBanner }}</view>
    <empty-state v-if="!loading && !orders.length" title="还没有订单" :description="emptyDescription" action="去点单" @action="menu" />
    <view v-else><order-card v-for="order in orders" :key="order.orderNo" :order="order" @click="detail(order.orderNo)" /></view>
  </view>
</template>

<script>
import EmptyState from '../../components/empty-state/empty-state.vue'
import OrderCard from '../../components/order-card/order-card.vue'
import { isCloudReady } from '../../services/cloud'
import { getMyOrders } from '../../services/order'
export default {
  components: { EmptyState, OrderCard },
  data: () => ({ orders: [], loading: true, cloudMode: isCloudReady() }),
  computed: {
    modeNote() { return this.cloudMode ? '订单进度以门店实际处理为准' : '当前仅展示本机模拟订单' },
    modeBanner() { return '演示数据保存在本机，不是门店真实交易记录' },
    emptyDescription() { return this.cloudMode ? '完成点单后，订单会显示在这里' : '完成一次模拟下单后会显示在这里' }
  },
  onShow() { uni.showTabBar({ animation: false }); this.load() },
  methods: { async load() { this.loading = true; try { this.orders = await getMyOrders() } catch (error) { uni.showToast({ title: error.message || '订单加载失败', icon: 'none' }) } finally { this.loading = false } }, menu() { uni.switchTab({ url: '/pages/menu/index' }) }, detail(orderNo) { uni.navigateTo({ url: `/pages/order-detail/index?orderNo=${encodeURIComponent(orderNo)}` }) } }
}
</script>

<style scoped>
.heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 26rpx; }.heading .title, .heading .note { display: block; }.note { margin-top: 10rpx; font-size: 23rpx; }.refresh { min-height: 72rpx; padding: 0 24rpx; line-height: 72rpx; border-radius: 36rpx; color: #5A3826; background: #FFFDF8; font-size: 24rpx; }.demo-banner { margin-bottom: 28rpx; padding: 18rpx; border-radius: 14rpx; color: #5A3826; background: #F1E5D4; text-align: center; font-size: 22rpx; }
</style>
