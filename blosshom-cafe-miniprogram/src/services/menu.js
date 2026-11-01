import { categories, products } from '../config/menu'
import { callCloudFunction, getCloudFileURLs, isCloudReady } from './cloud'
import { readStorage, writeStorage } from './storage'

const MENU_CACHE_KEY = 'blosshom-cloud-menu-v1'
const ASSET_CACHE_KEY = 'blosshom-menu-assets-v1'
const ASSET_TTL = 10 * 60 * 1000
let pendingMenu = null
const bundledProducts = products.reduce((result, item) => {
  result[item.id] = item
  return result
}, {})
let offlineMenu = false

function validMenu(menu) {
  return menu && Array.isArray(menu.categories) && Array.isArray(menu.products) && menu.categories.length > 0
}

function cachePayload(menu) {
  return {
    categories: menu.categories,
    products: menu.products,
    storeConfig: menu.storeConfig || null,
    fetchedAt: menu.fetchedAt || Date.now()
  }
}

function isCloudFileID(value) {
  return typeof value === 'string' && value.startsWith('cloud://')
}

function normalizeBundledImage(image) {
  if (typeof image !== 'string') return ''
  return image.startsWith('../../static/') ? image.replace('../../static/', '/static/') : image
}

function saveCache(key, value) {
  try { writeStorage(key, value) } catch (error) { /* A full local cache must not break online ordering. */ }
}

function bounded(promise) {
  let timer
  return Promise.race([promise, new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('菜单连接超时，请下拉重试')), 12000)
  })]).finally(() => clearTimeout(timer))
}

function preview(menu) {
  const assets = readStorage(ASSET_CACHE_KEY, null)
  const urls = assets && Date.now() - assets.savedAt < ASSET_TTL ? assets.urls : {}
  return { ...menu, products: menu.products.map(item => {
    const bundled = bundledProducts[item.id || item._id]
    const fallbackImage = normalizeBundledImage(bundled && bundled.image)
    const imagePending = isCloudFileID(item.image) && !(urls || {})[item.image]
    return { ...item, image: isCloudFileID(item.image) ? ((urls || {})[item.image] || fallbackImage) : (item.image || fallbackImage), fallbackImage, imagePending }
  }) }
}

// Synchronous: never wait for the network before showing a previous menu.
export function getCachedMenu() {
  if (!isCloudReady()) return null
  const cached = readStorage(MENU_CACHE_KEY, null)
  if (!validMenu(cached)) return null
  return { ...preview(cached), source: 'cache', offline: true }
}

function fetchMenu() {
  if (!pendingMenu) pendingMenu = bounded(callCloudFunction('getMenu', { specsVersion: 1 })).finally(() => { pendingMenu = null })
  return pendingMenu
}

async function withResolvedAssets(menu) {
  const cloudFileIDs = menu.products.map(item => item.image).filter(isCloudFileID)
  const cached = readStorage(ASSET_CACHE_KEY, null)
  let cloudFileURLs = cached && Date.now() - cached.savedAt < ASSET_TTL ? { ...cached.urls } : {}
  try {
    const missing = cloudFileIDs.filter(id => !cloudFileURLs[id])
    if (missing.length) {
      const fresh = await bounded(getCloudFileURLs(missing))
      cloudFileURLs = { ...cloudFileURLs, ...fresh }
      // Do not extend the lifetime of previously signed URLs.
      saveCache(ASSET_CACHE_KEY, { urls: cloudFileURLs, savedAt: cached && Object.keys(cached.urls || {}).length && Date.now() - cached.savedAt < ASSET_TTL ? cached.savedAt : Date.now() })
    }
  } catch (error) {
    // Keep usable cached URLs if the image service is temporarily unavailable.
  }

  return {
    ...menu,
    products: menu.products.map(item => {
      const bundled = bundledProducts[item.id || item._id]
      const bundledImage = normalizeBundledImage(bundled && bundled.image)
      const resolvedImage = isCloudFileID(item.image) ? (cloudFileURLs[item.image] || bundledImage) : (item.image || bundledImage)
      return {
        ...item,
        image: resolvedImage,
        imagePending: isCloudFileID(item.image) && !cloudFileURLs[item.image],
        fallbackImage: bundledImage,
        imageTone: item.imageTone || (bundled && bundled.imageTone)
      }
    })
  }
}

export function isMenuOffline() { return offlineMenu }

export async function getMenu({ onData } = {}) {
  if (isCloudReady()) {
    try {
      const menu = await fetchMenu()
      if (!validMenu(menu)) throw new Error('云端菜单数据为空或格式无效')
      offlineMenu = false
      saveCache(MENU_CACHE_KEY, cachePayload(menu))
      if (onData) onData({ ...preview(menu), source: 'cloud', offline: false })
      const normalizedMenu = await withResolvedAssets(menu)
      return { ...normalizedMenu, source: 'cloud', offline: false }
    } catch (error) {
      const cached = readStorage(MENU_CACHE_KEY, null)
      if (!validMenu(cached)) throw error
      offlineMenu = true
      return { ...preview(cached), source: 'cache', offline: true }
    }
  }
  offlineMenu = false
  return {
    ...await withResolvedAssets({ categories: categories.filter(item => item.id), products: products.filter(item => item.enabled) }),
    source: 'demo',
    offline: false,
    fetchedAt: Date.now()
  }
}
