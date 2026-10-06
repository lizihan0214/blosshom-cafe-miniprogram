import { orderStatusText } from '../src/utils/order-status'

describe('customer-facing order status', () => {
  test('prioritizes fulfillment progress after payment', () => {
    expect(orderStatusText({ paymentStatus: 'PAID', fulfillmentStatus: 'PREPARING' })).toBe('制作中')
    expect(orderStatusText({ paymentStatus: 'PAID', fulfillmentStatus: 'READY' })).toBe('待取餐')
  })

  test('keeps payment statuses before payment', () => {
    expect(orderStatusText({ paymentStatus: 'PAYING' })).toBe('支付确认中')
  })
})
