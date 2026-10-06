<template>
  <view class="home-landing">
    <image class="hero-background" src="../../static/home/hero-blosshom-wood-v1.jpg" mode="aspectFill" />
    <view class="hero-wash"></view>
    <button class="order-entry" hover-class="order-entry-pressed" @click="startOrder">
      <view class="order-main">
        <text class="order-cn">开始点单</text>
        <text class="order-separator"></text>
        <text class="order-en">START ORDER</text>
        <text class="order-arrow">→</text>
      </view>
      <view class="order-line"><view class="order-line-light"></view></view>
    </button>
  </view>
</template>

<script>
import { shareToFriends, shareToTimeline } from '../../config/share'

export default {
  onShow() {
    uni.hideTabBar({ animation: false })
  },
  onShareAppMessage() {
    return shareToFriends('/pages/home/index')
  },
  onShareTimeline() {
    return shareToTimeline()
  },
  methods: {
    startOrder() { uni.switchTab({ url: '/pages/menu/index' }) }
  }
}
</script>

<style scoped>
.home-landing { position: fixed; top: 0; right: 0; bottom: 0; left: 0; overflow: hidden; background: #6E4A2D; }
.hero-background, .hero-wash { position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%; }
.hero-wash { background: linear-gradient(180deg, rgba(38,24,14,.04) 0%, rgba(38,24,14,.06) 45%, rgba(38,24,14,.58) 100%); }
.order-entry { position: absolute; right: 56rpx; bottom: 156rpx; left: 56rpx; box-sizing: border-box; margin: 0; padding: 28rpx 8rpx 24rpx; border-radius: 0; color: #FFF9EE; background: rgba(59,37,22,.18); text-align: initial; text-shadow: 0 2rpx 12rpx rgba(35,22,13,.42); line-height: normal; transition: opacity .18s ease, transform .18s ease; }
.order-entry-pressed { opacity: .82; transform: scale(.985); }
.order-main { display: flex; align-items: center; justify-content: center; min-height: 74rpx; }
.order-cn { font: 600 42rpx/1.2 Georgia, "Songti SC", serif; letter-spacing: 3rpx; }
.order-separator { width: 1rpx; height: 36rpx; margin: 0 20rpx; background: rgba(255,249,238,.68); }
.order-en { font-size: 23rpx; font-weight: 600; line-height: 1.2; letter-spacing: 2rpx; }
.order-arrow { margin-left: 18rpx; font-size: 34rpx; line-height: 1; animation: arrow-breathe 1.8s ease-in-out infinite; }
.order-line { position: relative; height: 2rpx; margin-top: 20rpx; overflow: hidden; background: rgba(255,249,238,.48); }
.order-line-light { position: absolute; top: 0; left: -32%; width: 30%; height: 100%; background: linear-gradient(90deg, transparent, #FFF9EE, transparent); animation: line-flow 2.6s ease-in-out infinite; }
@keyframes arrow-breathe { 0%, 100% { transform: translateX(0); opacity: .72; } 50% { transform: translateX(10rpx); opacity: 1; } }
@keyframes line-flow { 0% { left: -32%; } 70%, 100% { left: 104%; } }
</style>
