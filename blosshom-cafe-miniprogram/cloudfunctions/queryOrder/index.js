const cloud = require('wx-server-sdk')
const publicConfig = Object.freeze({ mchid: '1749685098' })
const { loadConfig, queryTransaction } = require('./wechatpay')
const { allocatePickupCode } = require('./pickup-code')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function serialize(value) {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serialize)
  if (value && typeof value === 'object') return Object.keys(value).reduce((result, key) => { result[key] = serialize(value[key]); return result }, {})
  return value
}

function publicOrder(order) {
  const copy = serialize(order)
  delete copy.openid
  delete copy.mobile
  return copy
}

async function paidUpdate(order, transaction) {
  if (!transaction.amount || transaction.amount.total !== order.amount || transaction.mchid !== (process.env.WECHATPAY_MCHID || publicConfig.mchid)) throw new Error('微信支付订单金额或商户信息不匹配')
  const pickup = await allocatePickupCode(db, { ...order, paidAt: transaction.success_time || new Date() })
  return {
    paymentStatus: 'PAID',
    fulfillmentStatus: 'PREPARING',
    transactionId: transaction.transaction_id,
    pickupCode: pickup.code,
    pickupDate: pickup.date,
    paidAt: transaction.success_time ? new Date(transaction.success_time) : db.serverDate(),
    updatedAt: db.serverDate()
  }
}

async function syncPayment(order) {
  if (order.paymentStatus === 'PAID') {
    const pickup = await allocatePickupCode(db, order)
    if (pickup.code === order.pickupCode) return order
    await db.collection('orders').doc(order._id).update({ data: { pickupCode: pickup.code, pickupDate: pickup.date, updatedAt: db.serverDate() } })
    return { ...order, pickupCode: pickup.code, pickupDate: pickup.date }
  }
  if (!['UNPAID', 'PAYING'].includes(order.paymentStatus)) return order
  const config = loadConfig()
  let transaction
  try { transaction = await queryTransaction(config, order.outTradeNo) } catch (error) { if (error.code === 'ORDER_NOT_EXIST') return order; throw error }
  let update = null
  if (transaction.trade_state === 'SUCCESS') update = await paidUpdate(order, transaction)
  else if (['CLOSED', 'REVOKED', 'PAYERROR'].includes(transaction.trade_state)) update = { paymentStatus: 'CLOSED', updatedAt: db.serverDate() }
  else if (['NOTPAY', 'USERPAYING'].includes(transaction.trade_state) && order.paymentStatus !== 'PAYING') update = { paymentStatus: 'PAYING', updatedAt: db.serverDate() }
  if (!update) return order
  await db.collection('orders').doc(order._id).update({ data: update })
  const refreshed = await db.collection('orders').doc(order._id).get()
  return refreshed.data
}

async function requestPrint(order) {
  if (order.paymentStatus !== 'PAID') return
  try {
    await cloud.callFunction({ name: 'dispatchPrint', data: { orderNo: order.orderNo || order._id } })
  } catch (error) {
    console.error('dispatchPrint failed:', error && error.message ? error.message : 'unknown error')
  }
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext()
  const orderNo = String(event && event.orderNo || '').trim()
  if (!OPENID) throw new Error('无法确认当前用户身份')
  if (!/^BC\d{14}[A-Z0-9]{6}$/.test(orderNo)) throw new Error('订单号无效')

  const result = await db.collection('orders').where({ _id: orderNo, openid: OPENID }).limit(1).get()
  if (!result.data.length) throw new Error('未找到订单')
  const order = await syncPayment(result.data[0])
  await requestPrint(order)
  return publicOrder(order)
}
