const cloud = require('wx-server-sdk')

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

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) throw new Error('无法确认当前用户身份')
  const result = await db.collection('orders').where({ openid: OPENID }).orderBy('createdAt', 'desc').limit(50).get()
  return result.data.map(publicOrder)
}
