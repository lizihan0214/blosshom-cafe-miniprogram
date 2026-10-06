<script>
import { hydrateCart } from './store/cart'
import { initCloud } from './services/cloud'

export default {
  onLaunch() {
    hydrateCart()
    initCloud()
  }
}
</script>

<style>
page { background: #F7F3EB; color: #34261F; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; font-size: 28rpx; }
view, text, button, input, textarea { box-sizing: border-box; }
button::after { border: 0; }
.page { min-height: 100vh; padding: 32rpx 28rpx 180rpx; }
.card { background: #FFFDF8; border: 1rpx solid #E8DED1; border-radius: 18rpx; }
.title { font-family: Georgia, "Songti SC", serif; font-size: 44rpx; font-weight: 600; }
.muted { color: #8D7D70; }
.price { color: #5A3826; font-weight: 600; }
.primary { min-height: 88rpx; line-height: 88rpx; border-radius: 14rpx; color: #FFFDF8; background: #5A3826; font-size: 30rpx; font-weight: 600; letter-spacing: 1rpx; }
.primary[disabled] { color: #FFFDF8; background: #BBA99D; }
.section-title { margin: 38rpx 0 20rpx; font-size: 34rpx; font-weight: 600; }
.field { width: 100%; min-height: 88rpx; padding: 20rpx 24rpx; background: #FFFDF8; border: 1rpx solid #E8DED1; border-radius: 12rpx; }
</style>
