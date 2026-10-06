const { buildTrustedItems, validateCustomer } = require('../cloudfunctions/createPayment/domain')

const product = {
  _id: 'latte',
  id: 'latte',
  name: '拿铁',
  basePrice: 2200,
  enabled: true,
  soldOut: false,
  options: { temperature: ['iced', 'hot'], size: ['regular', 'large'], sugar: [] },
  optionPrices: { size: { large: 300 } }
}

describe('CloudBase trusted order pricing', () => {
  test('recalculates price from cloud product snapshot', () => {
    const result = buildTrustedItems([product], [{ productId: 'latte', quantity: 2, options: { temperature: 'iced', size: 'large' }, unitPrice: 1 }])
    expect(result.amount).toBe(5000)
    expect(result.items[0]).toEqual(expect.objectContaining({ productName: '拿铁', unitPrice: 2500, subtotal: 5000 }))
  })

  test('rejects stale options, sold-out products and invalid quantities', () => {
    expect(() => buildTrustedItems([product], [{ productId: 'latte', quantity: 1, options: { temperature: 'warm', size: 'regular' } }])).toThrow('规格已变更')
    expect(() => buildTrustedItems([{ ...product, soldOut: true }], [{ productId: 'latte', quantity: 1, options: {} }])).toThrow('下架或售罄')
    expect(() => buildTrustedItems([product], [{ productId: 'latte', quantity: 0, options: {} }])).toThrow('数量无效')
  })

  test('validates and limits customer fields without logging secrets', () => {
    const result = validateCustomer({ pickupName: ' 李女士 ', remark: '少冰', diningMode: 'dine-in', tableNo: ' a-08 ', clientRequestId: 'REQ_123456789012' })
    expect(result).toEqual({ pickupName: '李女士', remark: '少冰', diningMode: 'dine-in', tableNo: 'A-08', clientRequestId: 'REQ_123456789012' })
    expect(validateCustomer({ pickupName: '测试', diningMode: 'dine-in', clientRequestId: 'REQ_123456789012' }).tableNo).toBe('')
    expect(validateCustomer({ pickupName: '测试', diningMode: 'takeaway', clientRequestId: 'REQ_123456789012' }).tableNo).toBe('')
  })
})
