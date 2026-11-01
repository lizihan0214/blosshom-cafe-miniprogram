import { callCloudFunction, isCloudReady } from './cloud'
import { isMenuOffline } from './menu'
import { saveDemoOrder } from './order'

function demoId(now) { return `DEMO${now}` }
export function createClientRequestId() { return `REQ_${Date.now()}_${Math.random().toString(36).slice(2, 12)}` }

export async function createPayment(payload) {
  if (isCloudReady()) {
    if (isMenuOffline()) throw new Error('当前正在使用离线菜单，联网刷新后才能创建订单')
    const trustedPayload = {
      specsVersion: 1,
      pickupName: payload.pickupName, remark: payload.remark, diningMode: payload.diningMode, tableNo: payload.tableNo,
      clientRequestId: payload.clientRequestId,
      items: payload.items.map(item => ({ productId: item.productId, options: item.options, quantity: item.quantity }))
    }
    return callCloudFunction('createPayment', trustedPayload)
  }
  const now = Date.now()
  const order = {
    orderNo: demoId(now),
    pickupName: payload.pickupName,
    remark: payload.remark,
    diningMode: payload.diningMode,
    tableNo: payload.tableNo,
    clientRequestId: payload.clientRequestId,
    items: payload.items,
    amount: payload.amount,
    paymentStatus: 'UNPAID',
    fulfillmentStatus: 'PENDING',
    pickupCode: '',
    createdAt: now,
    demo: true
  }
  saveDemoOrder(order)
  return { mode: 'demo', order }
}

export function requestWechatPayment(payment) {
  if (!payment) return Promise.resolve({ skipped: true })
  if (typeof wx === 'undefined' || typeof wx.requestPayment !== 'function') return Promise.reject(new Error('当前环境无法调起微信支付'))
  return new Promise((resolve, reject) => {
    wx.requestPayment({
      ...payment,
      success: resolve,
      fail(error) {
        const cancelled = error && /cancel/i.test(String(error.errMsg || ''))
        const failure = new Error(cancelled ? '用户取消支付' : '微信支付未完成')
        failure.cancelled = cancelled
        reject(failure)
      }
    })
  })
}

export async function simulatePayment(order, outcome = 'success') {
  if (!order || !order.demo) throw new Error('只能模拟演示订单')
  const paid = outcome === 'success'
  const updated = {
    ...order,
    paymentStatus: paid ? 'PAID' : outcome === 'cancel' ? 'CLOSED' : 'UNPAID',
    pickupCode: paid ? `D${String(order.createdAt).slice(-3)}` : '',
    paidAt: paid ? Date.now() : null,
    simulatedOutcome: outcome
  }
  saveDemoOrder(updated)
  return updated
}
