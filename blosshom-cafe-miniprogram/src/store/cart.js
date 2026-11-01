import { optionPrice } from '../config/menu'
import { readStorage, writeStorage } from '../services/storage'
import { cartTotal } from '../utils/money'
import { optionKeys, optionGroups } from '../utils/options'

const CART_KEY = 'blosshom-cart-v1'
const state = { items: [] }

function optionSignature(options) {
  return optionKeys.map(key => options[key] || '').join('|')
}

function persist() { writeStorage(CART_KEY, state.items) }

export function hydrateCart() {
  const saved = readStorage(CART_KEY, [])
  state.items = Array.isArray(saved) ? saved.filter(item => item && Number.isSafeInteger(item.unitPrice) && item.quantity > 0).map(item => ({ ...item, signature: `${item.productId}:${optionSignature(item.options || {})}` })) : []
  return state.items
}

export function getCartItems() { return state.items.map(item => ({ ...item, options: { ...item.options } })) }
export function getCartCount() { return state.items.reduce((sum, item) => sum + item.quantity, 0) }
export function getCartTotal() { return cartTotal(state.items) }

export function addToCart(product, options, quantity = 1) {
  if (!product || !product.enabled || product.soldOut) throw new Error('商品当前不可购买')
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('数量无效')
  optionGroups(product).forEach(group => {
    if (!group.values.includes(options[group.key])) throw new Error(`请选择${group.label}`)
  })
  const signature = `${product.id}:${optionSignature(options)}`
  const current = state.items.find(item => item.signature === signature)
  const unitPrice = product.basePrice + (optionPrice[options.size] || 0)
  const pictures = { image: product.image || '', fallbackImage: product.fallbackImage || '', imageTone: product.imageTone || '' }
  if (current) { current.quantity += quantity; Object.assign(current, pictures) }
  else state.items.push({ signature, productId: product.id, productName: product.name, ...pictures, options: { ...options }, unitPrice, quantity, soldOut: false })
  persist()
}

export function setQuantity(signature, quantity) {
  if (!Number.isSafeInteger(quantity)) return
  if (quantity <= 0) state.items = state.items.filter(item => item.signature !== signature)
  else {
    const item = state.items.find(entry => entry.signature === signature)
    if (item) item.quantity = quantity
  }
  persist()
}

export function clearCart() { state.items = []; persist() }
