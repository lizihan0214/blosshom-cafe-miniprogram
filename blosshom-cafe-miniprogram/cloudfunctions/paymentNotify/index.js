const cloud = require('wx-server-sdk')
const publicConfig = Object.freeze({ appid: 'wx9911d30b35ffc8b1', mchid: '1749685098' })
const { decryptResource, verifyCallback } = require('./security')
const { allocatePickupCode } = require('./pickup-code')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function response(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json; charset=utf-8' }, body: body ? JSON.stringify(body) : '' }
}

function rawBody(event) {
  if (!event || typeof event.body !== 'string') throw new Error('回调缺少原始请求体')
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body
}

function validateTransaction(transaction, order) {
  if (!transaction || transaction.trade_state !== 'SUCCESS') throw new Error('回调交易状态不是 SUCCESS')
  if (transaction.appid !== (process.env.WECHATPAY_APPID || publicConfig.appid) || transaction.mchid !== (process.env.WECHATPAY_MCHID || publicConfig.mchid)) throw new Error('回调 AppID 或商户号不匹配')
  if (transaction.out_trade_no !== order.outTradeNo) throw new Error('回调商户订单号不匹配')
  if (!transaction.amount || transaction.amount.total !== order.amount || transaction.amount.currency !== 'CNY') throw new Error('回调金额不匹配')
  if (!transaction.transaction_id) throw new Error('回调缺少微信支付订单号')
}

async function markPaid(transaction) {
  const result = await db.collection('orders').where({ outTradeNo: transaction.out_trade_no }).limit(1).get()
  if (!result.data.length) throw new Error('回调对应订单不存在')
  const order = result.data[0]
  validateTransaction(transaction, order)
  if (order.paymentStatus === 'PAID') {
    if (order.transactionId !== transaction.transaction_id) throw new Error('订单已绑定其他微信支付订单号')
    const pickup = await allocatePickupCode(db, order)
    if (pickup.code !== order.pickupCode) await db.collection('orders').doc(order._id).update({ data: { pickupCode: pickup.code, pickupDate: pickup.date, updatedAt: db.serverDate() } })
    return { ...order, pickupCode: pickup.code, pickupDate: pickup.date }
  }
  if (order.paymentStatus === 'REFUNDED') throw new Error('退款订单不能再次标记支付成功')
  const pickup = await allocatePickupCode(db, { ...order, paidAt: transaction.success_time || new Date() })
  await db.collection('orders').doc(order._id).update({ data: {
    paymentStatus: 'PAID',
    fulfillmentStatus: 'PREPARING',
    transactionId: transaction.transaction_id,
    pickupCode: pickup.code,
    pickupDate: pickup.date,
    paidAt: transaction.success_time ? new Date(transaction.success_time) : db.serverDate(),
    updatedAt: db.serverDate()
  } })
  return { ...order, paymentStatus: 'PAID', fulfillmentStatus: 'PREPARING', transactionId: transaction.transaction_id, pickupCode: pickup.code, pickupDate: pickup.date, paidAt: transaction.success_time || new Date() }
}

async function requestPrint(order) {
  try {
    await cloud.callFunction({ name: 'dispatchPrint', data: { orderNo: order.orderNo || order._id } })
  } catch (error) {
    console.error('dispatchPrint failed:', error && error.message ? error.message : 'unknown error')
  }
}

exports.main = async event => {
  try {
    const body = rawBody(event)
    verifyCallback(event.headers || {}, body)
    const notification = JSON.parse(body)
    if (notification.event_type !== 'TRANSACTION.SUCCESS') throw new Error('回调事件类型无效')
    const transaction = decryptResource(notification.resource)
    const order = await markPaid(transaction)
    await requestPrint(order)
    return response(200)
  } catch (error) {
    console.error('paymentNotify rejected:', error && error.message ? error.message : 'unknown error')
    return response(400, { code: 'FAIL', message: '回调处理失败' })
  }
}
