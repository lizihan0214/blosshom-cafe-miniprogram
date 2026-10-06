import { createPayment, requestWechatPayment, simulatePayment } from '../src/services/payment'
import { queryOrder } from '../src/services/order'

describe('explicit demo payment flow', () => {
  test('creates unpaid demo order then records simulated result', async () => {
    const result = await createPayment({ pickupName: '测试', remark: '', diningMode: 'takeaway', amount: 2200, items: [{ productId: 'latte', productName: '经典拿铁', options: {}, unitPrice: 2200, quantity: 1 }] })
    expect(result.mode).toBe('demo'); expect(result.order.demo).toBe(true); expect(result.order.paymentStatus).toBe('UNPAID'); expect(result.order.pickupCode).toBe(''); expect(result.order.diningMode).toBe('takeaway')
    const paid = await simulatePayment(result.order, 'success')
    expect(paid.paymentStatus).toBe('PAID'); expect(paid.pickupCode).toMatch(/^D\d{3}$/); expect((await queryOrder(paid.orderNo)).simulatedOutcome).toBe('success')
  })

  test('passes only signed server parameters to wx.requestPayment and reports cancellation', async () => {
    global.wx = { requestPayment: jest.fn(options => options.success({ errMsg: 'requestPayment:ok' })) }
    const payment = { timeStamp: '123', nonceStr: 'nonce', package: 'prepay_id=test', signType: 'RSA', paySign: 'signature' }
    await expect(requestWechatPayment(payment)).resolves.toEqual({ errMsg: 'requestPayment:ok' })
    expect(global.wx.requestPayment).toHaveBeenCalledWith(expect.objectContaining(payment))

    global.wx.requestPayment = jest.fn(options => options.fail({ errMsg: 'requestPayment:fail cancel' }))
    await expect(requestWechatPayment(payment)).rejects.toMatchObject({ message: '用户取消支付', cancelled: true })
    delete global.wx
  })
})
