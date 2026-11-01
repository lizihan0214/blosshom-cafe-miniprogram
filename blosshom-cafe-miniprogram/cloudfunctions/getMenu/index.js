const cloud = require('wx-server-sdk')
const { withSpecs } = require('./product-specs')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function serialize(value) {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serialize)
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((result, key) => {
      result[key] = serialize(value[key])
      return result
    }, {})
  }
  return value
}

exports.main = async (event = {}) => {
  const [categoryResult, productResult, storeResult] = await Promise.all([
    db.collection('categories').where({ enabled: true }).orderBy('sort', 'asc').limit(100).get(),
    db.collection('products').where({ enabled: true }).orderBy('sort', 'asc').limit(100).get(),
    db.collection('store_config').doc('default').get().catch(() => ({ data: null }))
  ])

  const categories = categoryResult.data.map(item => ({ ...item, id: item.id || item._id }))
  const products = productResult.data.map(item => withSpecs({ ...item, id: item.id || item._id }, event.specsVersion))

  return serialize({
    categories,
    products,
    storeConfig: storeResult.data || null,
    source: 'cloud',
    fetchedAt: Date.now()
  })
}
