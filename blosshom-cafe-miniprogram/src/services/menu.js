import { categories, products } from '../config/menu'
import { callCloudFunction, getCloudFileURLs, isCloudReady } from './cloud'
import { readStorage, writeStorage } from './storage'

const MENU_CACHE_KEY = 'blosshom-cloud-menu-v1'
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

async function withResolvedAssets(menu) {
  const cloudFileIDs = menu.products.map(item => item.image).filter(isCloudFileID)
  let cloudFileURLs = {}
  try {
    cloudFileURLs = await getCloudFileURLs(cloudFileIDs)
  } catch (error) {
    cloudFileURLs = {}
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
        fallbackImage: bundledImage,
        imageTone: item.imageTone || (bundled && bundled.imageTone)
      }
    })
  }
}

export function isMenuOffline() { return offlineMenu }

export async function getMenu() {
  if (isCloudReady()) {
    try {
      const menu = await callCloudFunction('getMenu', {})
      if (!validMenu(menu)) throw new Error('云端菜单数据为空或格式无效')
      const normalizedMenu = await withResolvedAssets(menu)
      offlineMenu = false
      writeStorage(MENU_CACHE_KEY, cachePayload(menu))
      return { ...normalizedMenu, source: 'cloud', offline: false }
    } catch (error) {
      const cached = readStorage(MENU_CACHE_KEY, null)
      if (!validMenu(cached)) throw error
      offlineMenu = true
      return { ...await withResolvedAssets(cached), source: 'cache', offline: true }
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
