const cloud = require('wx-server-sdk')
const { buildTrustedItems, validateCustomer } = require('./domain')
const { createJsapiOrder, createPaymentParams, loadConfig } = require('./wechatpay')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function orderNumber() {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
  const random = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0')
  return `BC${timestamp}${random}`
}

async function loadProducts(items) {
  const ids = [...new Set(items.map(item => String(item.productId || '')))]
  if (ids.some(id => !id) || ids.length > 50) throw new Error('订单商品无效')
  const results = await Promise.all(ids.map(id => db.collection('products').doc(id).get().catch(() => ({ data: null }))))
  return results.map(result => result.data).filter(Boolean)
}

function publicOrder(order) {
  const copy = { ...order }
  delete copy.openid
  delete copy.mobile
  return copy
}

function paymentResult(order, config, reused) {
  return {
    mode: 'wechatpay',
    order: publicOrder(order),
    payment: createPaymentParams(config, order.prepayId),
    reused
  }
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) throw new Error('无法确认当前用户身份')

  const config = loadConfig()
  const customer = validateCustomer(event || {})
  const existing = await db.collection('orders').where({ openid: OPENID, clientRequestId: customer.clientRequestId }).limit(1).get()
  if (existing.data.length) {
    const order = existing.data[0]
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'CLOSED') return { mode: 'wechatpay', order: publicOrder(order), payment: null, reused: true }
    if (order.prepayId && order.paymentExpiresAt && new Date(order.paymentExpiresAt).getTime() > Date.now() + 60000) return paymentResult(order, config, true)
    throw new Error('该订单支付会话已失效，请在订单详情中查询状态后重新下单')
  }

  const products = await loadProducts(event.items || [])
  const trusted = buildTrustedItems(products, event.items || [])
  const orderNo = orderNumber()
  const now = db.serverDate()
  const order = {
    orderNo,
    outTradeNo: orderNo,
    openid: OPENID,
    clientRequestId: customer.clientRequestId,
    pickupName: customer.pickupName,
    diningMode: customer.diningMode,
    tableNo: customer.tableNo,
    remark: customer.remark,
    items: trusted.items,
    amount: trusted.amount,
    pickupCode: '',
    paymentStatus: 'UNPAID',
    fulfillmentStatus: 'PENDING',
    transactionId: '',
    createdAt: now,
    paidAt: null,
    updatedAt: now
  }

  await db.collection('orders').doc(orderNo).set({ data: order })
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  let prepayId
  try {
    prepayId = await createJsapiOrder(config, { orderNo, outTradeNo: orderNo, openid: OPENID, amount: trusted.amount, description: 'Blosshom & Cafe 餐饮订单', timeExpire: expiresAt.toISOString() })
  } catch (error) {
    await db.collection('orders').doc(orderNo).update({ data: { paymentErrorCode: error.code || 'CREATE_FAILED', updatedAt: db.serverDate() } })
    throw error
  }
  await db.collection('orders').doc(orderNo).update({ data: { prepayId, paymentExpiresAt: expiresAt, paymentStatus: 'PAYING', paymentErrorCode: '', updatedAt: db.serverDate() } })
  return paymentResult({ ...order, prepayId, paymentExpiresAt: expiresAt.toISOString(), paymentStatus: 'PAYING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, config, false)
}
