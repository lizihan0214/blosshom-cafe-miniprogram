import { optionGroups, optionSummary, defaultOptions } from '../src/utils/options'
import { addToCart, clearCart, getCartItems } from '../src/store/cart'
const { buildTrustedItems } = require('../cloudfunctions/createPayment/domain')
const { buildReceipt } = require('../cloudfunctions/dispatchPrint/xpyun')
const presets = require('../docs/product-specs.json')
const { withSpecs } = require('../cloudfunctions/createPayment/product-specs')
test('new menu and payment use identical rules while old clients stay unchanged', () => {
  const menuRules = require('../cloudfunctions/getMenu/product-specs')
  for (const [id, options] of Object.entries(presets)) {
    const original = { id, options: {} }
    expect(withSpecs(original)).toEqual(original)
    expect(withSpecs(original, 1).options).toEqual(options)
    expect(menuRules.withSpecs(original, 1)).toEqual(withSpecs(original, 1))
  }
})
const product = { id: 'T001', name: '柠檬茶', basePrice: 1600, enabled: true, soldOut: false, options: presets.T001 }
beforeEach(() => clearCart())
test('groups expose ice and sugar, tea has six bases', () => {
  expect(optionGroups(product).map(g => g.label)).toEqual(['冰量', '糖分'])
  expect(presets.T004.teaBase).toHaveLength(6)
})
test('defaults select normal ice and half sugar but never choose tea for customers', () => {
  expect(defaultOptions(product)).toEqual({ ice: '标准冰', sugar: '五分糖' })
  expect(defaultOptions({ options: presets.T004 })).toEqual({})
  for (const id of ['C004', 'C006', 'C007']) expect(presets[id].ice).not.toContain('去冰')
  expect(withSpecs({ id: 'T004' }, 1).name).toBe('功夫茶套装 / Gongfu Tea Set')
  expect(withSpecs({ id: 'C002', description: '热 · 可换燕麦奶 +5 元（请备注）' }, 1).description).not.toContain('燕麦奶')
})
test('different choices stay separate and incomplete choices cannot be added', () => {
  expect(() => addToCart(product, {})).toThrow('请选择冰量')
  addToCart(product, { ice: '少冰', sugar: '五分糖' })
  addToCart(product, { ice: '去冰', sugar: '三分糖' })
  expect(getCartItems()).toHaveLength(2)
  expect(optionSummary(getCartItems()[0].options)).toBe('少冰 · 五分糖')
})
test('trusted order validates and receipt carries choices with unchanged price', () => {
  const result = buildTrustedItems([product], [{ productId: 'T001', quantity: 1, options: { ice: '少冰', sugar: '七分糖' } }])
  expect(result.amount).toBe(1600)
  expect(buildReceipt({ ...result, orderNo: 'TEST', diningMode: 'dine-in', tableNo: '01' })).toContain('少冰 · 七分糖')
  expect(() => buildTrustedItems([product], [{ productId: 'T001', quantity: 1, options: { ice: '很多冰', sugar: '七分糖' } }])).toThrow('规格已变更')
})
test('tea base is mandatory and is stored and printed', () => {
  const tea = { ...product, id: 'T004', name: '围炉煮茶', basePrice: 2800, options: presets.T004 }
  expect(() => buildTrustedItems([tea], [{ productId: tea.id, quantity: 1, options: {} }])).toThrow('规格已变更')
  const result = buildTrustedItems([tea], [{ productId: tea.id, quantity: 1, options: { teaBase: '小青柑' } }])
  expect(buildReceipt({ ...result, orderNo: 'TEST' })).toContain('小青柑')
  expect(result.amount).toBe(2800)
})
