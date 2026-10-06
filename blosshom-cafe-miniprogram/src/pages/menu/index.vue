<template>
  <view class="menu-page">
    <view class="page menu-content">
      <view class="intro">
        <view class="menu-brand">
          <text class="menu-brand-cn">繁花</text>
          <text class="menu-brand-en">Blosshom &amp; Cafe</text>
        </view>
        <view class="intro-side">
          <text v-if="tableNo" class="table-badge">{{ tableNo }} 桌 · 堂食</text>
          <text class="intro-meta">ORDER · 全部商品</text>
        </view>
      </view>
      <view v-if="menuOffline" class="offline-banner">当前展示最近一次缓存菜单，联网并下拉刷新后才能创建订单。</view>
      <view class="menu-body">
        <view class="categories"><button v-for="category in categories" :key="category.id" class="category" :class="{ active: active === category.id }" @click="selectCategory(category.id)">{{ category.name }}</button></view>
        <view class="product-list">
          <view v-if="loading" class="loading muted">正在准备点单内容…</view>
          <view v-else>
            <view v-for="section in menuSections" :id="`category-${section.id}`" :key="section.id" class="category-section">
              <view class="category-title">{{ section.name }}</view>
              <view v-for="menuItem in section.products" :key="menuItem.id" class="product card" :class="{ disabled: menuItem.soldOut }">
                <view class="picture" :style="{ background: menuItem.imageTone || '#E8DED1' }">
                  <image v-if="menuItem.image" class="product-image" :src="menuItem.image" mode="aspectFill" @error="handleImageError(menuItem)" />
                  <text v-else>Blosshom</text>
                </view>
                <view class="content">
                  <view class="row product-heading">
                    <view class="product-titles"><text class="product-name-cn">{{ chineseName(menuItem.name) }}</text><text v-if="englishName(menuItem.name)" class="product-name-en">{{ englishName(menuItem.name) }}</text></view>
                    <text v-if="menuItem.soldOut" class="sold">售罄</text>
                  </view>
                  <text class="description">{{ menuItem.description }}</text>
                  <view class="row bottom"><text class="price">{{ money(menuItem.basePrice) }}</text><button class="add" :disabled="menuItem.soldOut" @click.stop="addProduct(menuItem)">+</button></view>
                </view>
              </view>
            </view>
            <view class="scroll-spacer"></view>
          </view>
        </view>
      </view>
    </view>
    <view v-if="cartCount" class="menu-cart-bar">
      <view class="menu-cart-summary">
        <view class="menu-cart-icon">
          <view class="cart-icon-handle"></view>
          <view class="cart-icon-basket"></view>
          <view class="cart-icon-wheel cart-icon-wheel-left"></view>
          <view class="cart-icon-wheel cart-icon-wheel-right"></view>
        </view>
        <text class="menu-cart-count">{{ cartCount }}</text>
        <text class="menu-cart-total">{{ cartTotalDisplay }}</text>
      </view>
      <button class="menu-cart-checkout" hover-class="menu-cart-checkout-active" @click="openCart">查看购物车</button>
    </view>
  </view>
</template>

<script>
import { getMenu } from '../../services/menu'
import { addToCart, getCartCount, getCartTotal } from '../../store/cart'
import { formatMoney } from '../../utils/money'
import { getTableNo, saveTableNo, tableNoFromLaunchOptions } from '../../utils/table-context'
import { shareToFriends, shareToTimeline } from '../../config/share'
export default {
  data: () => ({ categories: [], products: [], active: '', loading: true, menuOffline: false, pageScrollTop: 0, sectionTops: [], cartCount: 0, cartTotal: 0, cartTotalDisplay: '¥0.00', tableNo: '' }),
  computed: {
    menuSections() {
      return this.categories.map(category => ({ ...category, products: this.products.filter(product => product.category === category.id) })).filter(section => section.products.length)
    }
  },
  onLoad(options) { const scannedTable = tableNoFromLaunchOptions(options); this.tableNo = scannedTable ? saveTableNo(scannedTable) : getTableNo(); this.loadMenu() }, onShow() { uni.showTabBar({ animation: false }); this.refreshCart() }, onPullDownRefresh() { this.loadMenu().finally(() => uni.stopPullDownRefresh()) },
  onPageScroll(event) { this.handlePageScroll(event.scrollTop) },
  onReachBottom() { this.activateLastCategory() },
  onShareAppMessage() { return shareToFriends('/pages/menu/index') },
  onShareTimeline() { return shareToTimeline() },
  methods: {
    money: formatMoney,
    chineseName(name) { return String(name).split(' / ')[0] },
    englishName(name) { const parts = String(name).split(' / '); return parts.length > 1 ? parts.slice(1).join(' / ') : '' },
    handleImageError(product) {
      const fallback = product.fallbackImage || ''
      if (product.image === fallback) return
      this.$set(product, 'image', fallback)
    },
    async loadMenu() { this.loading = true; try { const menu = await getMenu(); this.menuOffline = Boolean(menu.offline); this.categories = [...menu.categories].sort((a, b) => a.sort - b.sort); this.products = [...menu.products].sort((a, b) => a.sort - b.sort); if (!this.active && this.categories[0]) this.active = this.categories[0].id } catch (error) { uni.showToast({ title: error.message || '点单内容加载失败', icon: 'none' }) } finally { this.loading = false; this.$nextTick(() => this.measureSections()) } },
    selectCategory(categoryId) {
      this.active = categoryId
      uni.pageScrollTo({ selector: `#category-${categoryId}`, duration: 260 })
    },
    measureSections() {
      const query = uni.createSelectorQuery().in(this)
      query.selectAll('.category-section').boundingClientRect()
      query.exec(results => {
        const sections = results && results[0]
        if (!Array.isArray(sections)) return
        this.sectionTops = sections.slice(0, this.menuSections.length).map((section, index) => ({ id: this.menuSections[index].id, top: section.top + this.pageScrollTop }))
      })
    },
    handlePageScroll(scrollTop) {
      this.pageScrollTop = scrollTop
      if (!this.sectionTops.length) { this.measureSections(); return }
      const position = scrollTop + 80
      let current = this.sectionTops[0].id
      this.sectionTops.forEach(section => { if (position >= section.top) current = section.id })
      if (current !== this.active) this.active = current
    },
    activateLastCategory() { const last = this.menuSections[this.menuSections.length - 1]; if (last) this.active = last.id },
    addProduct(product) { try { addToCart(product, {}, 1); this.refreshCart() } catch (error) { uni.showToast({ title: error.message, icon: 'none' }) } },
    refreshCart() { this.cartCount = getCartCount(); this.cartTotal = getCartTotal(); this.cartTotalDisplay = formatMoney(this.cartTotal) }, openCart() { uni.navigateTo({ url: '/pages/cart/index' }) }
  }
}
</script>

<style scoped>
.menu-page { min-height: 100vh; }.menu-content { box-sizing: border-box; min-height: 100vh; padding-bottom: 208rpx; }.intro { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 30rpx; }.menu-brand { display: flex; flex-direction: column; min-width: 0; }.menu-brand-cn { color: #4A3023; font-family: "Songti SC", "STSong", "SimSun", serif; font-size: 43rpx; font-weight: 500; line-height: 1.08; letter-spacing: 7rpx; }.menu-brand-en { margin-top: 7rpx; color: #765A49; font-family: Georgia, "Times New Roman", serif; font-size: 23rpx; font-style: italic; line-height: 1; letter-spacing: 1.5rpx; }.intro-side { display: flex; align-items: flex-end; flex-direction: column; gap: 10rpx; }.table-badge { padding: 8rpx 14rpx; border: 1rpx solid #C7A27C; border-radius: 8rpx; color: #5A3826; background: #FFFDF8; font-size: 21rpx; font-weight: 600; }.intro-meta { flex-shrink: 0; padding-bottom: 2rpx; color: #A08F82; font-family: Georgia, "Times New Roman", serif; font-size: 19rpx; line-height: 1.2; letter-spacing: 1rpx; }.offline-banner { margin: -12rpx 0 24rpx; padding: 16rpx 20rpx; border-left: 6rpx solid #C7A27C; color: #5A3826; background: #F1E5D4; font-size: 22rpx; line-height: 1.5; }.menu-body { display: flex; align-items: flex-start; gap: 18rpx; }.categories { position: sticky; top: 20rpx; flex-shrink: 0; width: 126rpx; padding: 8rpx 0; overflow: hidden; border: 1rpx solid #E8DED1; border-radius: 14rpx; background: rgba(255,253,248,.96); }.category { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 100%; min-height: 96rpx; margin: 0; padding: 12rpx 10rpx; border-left: 6rpx solid transparent; border-radius: 0; color: #8D7D70; background: transparent; font-size: 24rpx; line-height: 1.25; white-space: normal; }.category.active { border-left-color: #5A3826; color: #5A3826; background: #F1E5D4; font-weight: 600; }.product-list { flex: 1; min-width: 0; }.category-section { padding-bottom: 8rpx; }.category-title { margin: 4rpx 0 16rpx; padding-left: 4rpx; color: #5A3826; font-size: 29rpx; font-weight: 600; }.scroll-spacer { height: 40rpx; }.loading { padding: 80rpx 0; text-align: center; }
.product { display: flex; box-sizing: border-box; width: 100%; margin-bottom: 18rpx; overflow: hidden; }.disabled { opacity: .58; }.picture { flex-shrink: 0; width: 156rpx; min-height: 204rpx; display: flex; align-items: center; justify-content: center; overflow: hidden; color: rgba(52,38,31,.58); font: italic 21rpx Georgia, serif; }.product-image { width: 100%; height: 100%; min-height: 204rpx; }.content { display: flex; flex: 1; flex-direction: column; min-width: 0; padding: 17rpx; }.row { display: flex; align-items: center; justify-content: space-between; }.product-heading { align-items: flex-start; }.product-titles { flex: 1; min-width: 0; }.product-name-cn, .product-name-en { display: block; width: 100%; overflow: hidden; white-space: normal; word-break: break-word; }.product-name-cn { font-size: 27rpx; font-weight: 600; line-height: 1.35; }.product-name-en { margin-top: 3rpx; color: #8D7D70; font-size: 21rpx; line-height: 1.3; }.description { display: -webkit-box; min-height: 62rpx; max-height: 94rpx; margin-top: 8rpx; overflow: hidden; color: #8D7D70; font-size: 21rpx; line-height: 1.45; white-space: normal; word-break: break-all; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }.bottom { margin-top: auto; padding-top: 10rpx; }.sold { flex-shrink: 0; margin-left: 8rpx; color: #8D7D70; font-size: 20rpx; }.price { font-size: 26rpx; }.add { width: 56rpx; min-width: 56rpx; height: 56rpx; padding: 0; line-height: 52rpx; border-radius: 50%; color: #FFFDF8; background: #5A3826; font-size: 34rpx; }
.menu-cart-bar { position: fixed; z-index: 10; right: 0; bottom: 0; left: 0; display: flex; align-items: center; box-sizing: border-box; height: 88rpx; padding: 12rpx 28rpx; border-top: 1rpx solid rgba(255,253,248,.16); background: #34261F; box-shadow: 0 -10rpx 30rpx rgba(52,38,31,.14); }
.menu-cart-summary { display: flex; align-items: center; }.menu-cart-icon { position: relative; flex-shrink: 0; width: 52rpx; height: 52rpx; margin-right: 14rpx; border: 1rpx solid rgba(255,253,248,.16); border-radius: 50%; background: rgba(255,253,248,.09); }.cart-icon-handle { position: absolute; top: 13rpx; left: 9rpx; width: 13rpx; height: 4rpx; border-radius: 2rpx; background: #C7A27C; transform: rotate(12deg); }.cart-icon-basket { position: absolute; top: 17rpx; left: 17rpx; box-sizing: border-box; width: 25rpx; height: 17rpx; border: 3rpx solid #FFFDF8; border-top-width: 2rpx; border-radius: 3rpx 3rpx 5rpx 5rpx; transform: skew(-7deg); }.cart-icon-wheel { position: absolute; top: 37rpx; width: 6rpx; height: 6rpx; border-radius: 50%; background: #C7A27C; }.cart-icon-wheel-left { left: 20rpx; }.cart-icon-wheel-right { left: 36rpx; }.menu-cart-count { display: inline-block; min-width: 42rpx; height: 42rpx; margin-right: 18rpx; line-height: 42rpx; text-align: center; border-radius: 21rpx; color: #34261F; background: #C7A27C; font-size: 22rpx; }.menu-cart-total { color: #FFFDF8; font-size: 32rpx; font-weight: 600; }
.menu-cart-checkout { position: absolute; top: 12rpx; right: 28rpx; display: flex; align-items: center; justify-content: center; height: 64rpx; margin: 0; padding: 0 30rpx; border-radius: 32rpx; color: #34261F; background: #FFFDF8; font-size: 26rpx; line-height: 1; }.menu-cart-checkout-active { opacity: .84; }
</style>
