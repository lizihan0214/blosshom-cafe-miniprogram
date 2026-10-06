<template>
  <view class="page checkout-page">
    <view v-if="!cloudMode" class="demo-banner">{{ modeNotice }}</view>
    <view class="section-title first">门店信息</view>
    <view class="store-card card"><view><text class="store-name">{{ store.name }}</text><text class="muted">{{ store.hours }}</text></view><text class="tag">营业中</text></view>
    <view class="section-title">选择用餐方式</view>
    <view class="mode-switch card"><button v-for="mode in diningModes" :key="mode.value" class="mode" :class="{ active: form.diningMode === mode.value }" @click="form.diningMode = mode.value">{{ mode.label }}</button></view>
    <view v-if="form.diningMode === 'dine-in'" class="table-card card">
      <view class="table-copy"><text class="label table-label">桌号 *</text><text class="muted table-help">扫描桌面二维码会自动带入</text></view>
      <input v-model.trim="form.tableNo" class="field table-field" maxlength="8" placeholder="例如：08" />
      <text v-if="tableTouched && !tableValid" class="error">请输入桌牌上的桌号</text>
    </view>
    <view class="section-title">取餐信息</view>
    <view class="form card">
      <text class="label">取餐称呼 *</text><input v-model.trim="form.pickupName" class="field" maxlength="20" placeholder="例如：李女士" />
      <text class="label">订单备注</text><textarea v-model.trim="form.remark" class="field remark" maxlength="100" placeholder="选填，请勿填写敏感个人信息" />
    </view>
    <view class="section-title">订单明细</view>
    <view class="order card"><view class="line mode-line"><text>用餐方式</text><text>{{ orderDiningLabel }}</text></view><view v-for="item in items" :key="item.signature" class="line"><view><text>{{ item.productName }} × {{ item.quantity }}</text><text class="muted option">{{ summary(item.options) }}</text></view><text>{{ money(item.unitPrice * item.quantity) }}</text></view><view class="line total-line"><text>合计</text><text class="price total">{{ money(total) }}</text></view></view>
    <button class="primary pay" :disabled="submitting || !canSubmit" @click="submit">{{ submitLabel }}</button>
    <text class="safety">{{ safetyNotice }}</text>
  </view>
</template>

<script>
import { storeConfig } from '../../config/store'
import { getCartItems, getCartTotal } from '../../store/cart'
import { isCloudReady } from '../../services/cloud'
import { createClientRequestId, createPayment, requestWechatPayment } from '../../services/payment'
import { formatMoney } from '../../utils/money'
import { optionSummary } from '../../utils/options'
import { getTableNo, normalizeTableNo } from '../../utils/table-context'
export default {
  data: () => ({ store: storeConfig, items: [], total: 0, cloudMode: isCloudReady(), clientRequestId: '', diningModes: [{ value: 'dine-in', label: '堂食' }, { value: 'takeaway', label: '外带' }], form: { pickupName: '', remark: '', diningMode: 'dine-in', tableNo: '' }, tableTouched: false, submitting: false }),
  computed: {
    tableValid() { return this.form.diningMode === 'takeaway' || Boolean(normalizeTableNo(this.form.tableNo)) },
    diningModeLabel() { return this.form.diningMode === 'takeaway' ? '外带' : '堂食' },
    orderDiningLabel() { return this.form.diningMode === 'takeaway' ? '外带' : `${normalizeTableNo(this.form.tableNo) || '--'} 桌 · 堂食` },
    canSubmit() { return this.items.length && this.form.pickupName && this.tableValid },
    modeNotice() { return this.cloudMode ? '微信支付 · 商品和金额将由云端重新校验' : '开发演示模式 · 本页不会发起真实微信支付' },
    submitLabel() { if (this.submitting) return this.cloudMode ? '正在发起微信支付…' : '正在创建模拟订单…'; return this.cloudMode ? `微信支付 · ${this.money(this.total)}` : `模拟支付 · ${this.money(this.total)}` },
    safetyNotice() { return this.cloudMode ? '付款完成后请留在当前页面，系统会自动确认订单。' : '这是开发模式模拟支付，不会调用微信支付、不会扣款，也不代表真实交易成功。' }
  },
  onLoad() { this.clientRequestId = createClientRequestId(); this.form.tableNo = getTableNo() },
  onShow() { this.items = getCartItems(); this.total = getCartTotal(); if (!this.items.length) { uni.showToast({ title: '请先选择商品', icon: 'none' }); setTimeout(() => uni.navigateBack(), 600) } },
  methods: {
    money: formatMoney, summary: optionSummary,
    async submit() { this.tableTouched = true; if (!this.canSubmit || this.submitting) return; this.submitting = true; let orderNo = ''; try { const result = await createPayment({ ...this.form, tableNo: this.form.diningMode === 'dine-in' ? normalizeTableNo(this.form.tableNo) : '', clientRequestId: this.clientRequestId, items: this.items, amount: this.total }); orderNo = result.order.orderNo; if (this.cloudMode) await requestWechatPayment(result.payment); uni.navigateTo({ url: `/pages/payment-result/index?orderNo=${encodeURIComponent(orderNo)}` }) } catch (error) { if (orderNo && error.cancelled) { uni.navigateTo({ url: `/pages/payment-result/index?orderNo=${encodeURIComponent(orderNo)}&hint=cancelled` }) } else { uni.showToast({ title: error.message || '发起支付失败', icon: 'none' }) } } finally { this.submitting = false } }
  }
}
</script>

<style scoped>
.checkout-page { padding-bottom: 220rpx; }.demo-banner { margin-bottom: 28rpx; padding: 20rpx 24rpx; border-left: 6rpx solid #C7A27C; color: #5A3826; background: #F1E5D4; text-align: left; font-size: 24rpx; }.first { margin-top: 10rpx; }.store-card { display: flex; align-items: center; justify-content: space-between; padding: 28rpx; }.store-name, .store-card .muted { display: block; }.store-name { margin-bottom: 10rpx; font-weight: 600; }.store-card .muted { font-size: 23rpx; }.tag { padding: 8rpx 14rpx; border-radius: 8rpx; color: #68705A; background: #EDF0E8; font-size: 22rpx; }.mode-switch { display: flex; gap: 12rpx; padding: 12rpx; }.mode { flex: 1; min-height: 76rpx; line-height: 76rpx; border: 1rpx solid #E8DED1; border-radius: 12rpx; color: #5A3826; background: #F7F3EB; font-size: 27rpx; }.mode.active { border-color: #5A3826; color: #FFFDF8; background: #5A3826; }.table-card { margin-top: 16rpx; padding: 24rpx; }.table-copy { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14rpx; }.table-label { margin: 0; }.table-help { font-size: 21rpx; }.table-field { font-size: 32rpx; font-weight: 600; letter-spacing: 2rpx; }.form { padding: 28rpx; }.label { display: block; margin: 25rpx 0 12rpx; font-weight: 600; }.label:first-child { margin-top: 0; }.remark { height: 150rpx; }.error { display: block; margin-top: 10rpx; color: #A14C3C; font-size: 23rpx; }.order { padding: 28rpx; }.line { display: flex; justify-content: space-between; gap: 20rpx; margin-bottom: 24rpx; }.mode-line { margin-bottom: 24rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid #E8DED1; }.option { display: block; margin-top: 7rpx; font-size: 22rpx; }.total-line { margin: 0; padding-top: 24rpx; border-top: 1rpx solid #E8DED1; }.total { font-size: 36rpx; }.pay { width: calc(100% - 56rpx); position: fixed; z-index: 5; left: 28rpx; bottom: calc(74rpx + env(safe-area-inset-bottom)); box-shadow: 0 10rpx 30rpx rgba(52,38,31,.2); }.safety { display: block; margin-top: 28rpx; color: #8D7D70; text-align: center; font-size: 21rpx; line-height: 1.6; }
</style>
