import { buildSpecView } from '../src/utils/spec-view'
import { defaultOptions } from '../src/utils/options'
const { withSpecs } = require('../cloudfunctions/getMenu/product-specs')
test('ice buttons, quantity and total are plain WXML data', () => {
  const product = withSpecs({ id: 'C003', name: '冰美式 / Iced Americano', basePrice: 1200 }, 1)
  const view = JSON.parse(JSON.stringify(buildSpecView(product, defaultOptions(product))))
  expect(view.groups[0].choices.map(c => c.label)).toEqual(['去冰', '少冰', '标准冰'])
  expect(view.groups[0].choices[2].selected).toBe(true)
  expect(view.quantity).toBe(1)
  expect(view.total).toBe('¥12.00')
  expect(view.complete).toBe(true)
  expect(buildSpecView(product, { ice: '少冰' }, 2).total).toBe('¥24.00')
})
test('tea base stays unselected and all six buttons have labels', () => {
  const product = withSpecs({ id: 'T004', basePrice: 2800 }, 1)
  const view = buildSpecView(product)
  expect(view.groups[0].choices).toHaveLength(6)
  expect(view.complete).toBe(false)
  expect(view.summary).toBe('请选择茶底')
  expect(buildSpecView(product, { teaBase: '英红九号' }).complete).toBe(true)
})
