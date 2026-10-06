const crypto = require('crypto')

const PICKUP_CODE_PATTERN = /^\d{3}$/

function shanghaiBusinessDate(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now())
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
}

async function allocatePickupCode(db, order, randomInt = crypto.randomInt) {
  if (PICKUP_CODE_PATTERN.test(String(order.pickupCode || ''))) {
    return { code: order.pickupCode, date: order.pickupDate || shanghaiBusinessDate(order.paidAt) }
  }

  const date = shanghaiBusinessDate(order.paidAt)
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const code = String(randomInt(1, 1000)).padStart(3, '0')
    const collision = await db.collection('orders').where({ pickupDate: date, pickupCode: code }).limit(1).get()
    if (!collision.data.some(item => item._id !== order._id)) return { code, date }
  }
  throw new Error('暂时无法生成唯一取餐号，请稍后重试')
}

module.exports = { PICKUP_CODE_PATTERN, allocatePickupCode, shanghaiBusinessDate }
