const OPTION_KEYS = ['temperature', 'size', 'sugar']

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function validateCustomer(payload) {
  const pickupName = cleanText(payload.pickupName, 20)
  const remark = cleanText(payload.remark, 100)
  const diningMode = payload.diningMode === 'takeaway' ? 'takeaway' : payload.diningMode === 'dine-in' ? 'dine-in' : ''
  const tableNo = cleanText(payload.tableNo, 8).toUpperCase()
  const clientRequestId = cleanText(payload.clientRequestId, 80)

  if (!pickupName) throw new Error('请填写取餐称呼')
  if (!diningMode) throw new Error('请选择堂食或外带')
  if (tableNo && !/^[A-Z0-9-]{1,8}$/.test(tableNo)) throw new Error('桌号无效，请重新扫描桌面二维码')
  if (!/^[A-Za-z0-9_-]{12,80}$/.test(clientRequestId)) throw new Error('订单请求标识无效')

  return { pickupName, remark, diningMode, tableNo: diningMode === 'dine-in' ? tableNo : '', clientRequestId }
}

function normalizeOptions(product, selected) {
  const schema = product.options || {}
  const result = {}

  OPTION_KEYS.forEach(key => {
    const allowed = Array.isArray(schema[key]) ? schema[key] : []
    const value = selected && selected[key] ? String(selected[key]) : ''
    if (!allowed.length) {
      if (value) throw new Error(`${product.name} 不支持所选规格`)
      return
    }
    if (!allowed.includes(value)) throw new Error(`${product.name} 的规格已变更，请重新选择`)
    result[key] = value
  })

  return result
}

function optionSurcharge(product, options) {
  const prices = product.optionPrices || {}
  return OPTION_KEYS.reduce((total, key) => {
    const group = prices[key] || {}
    const surcharge = group[options[key]] || 0
    if (!Number.isSafeInteger(surcharge) || surcharge < 0) throw new Error(`${product.name} 的规格价格配置无效`)
    return total + surcharge
  }, 0)
}

function buildTrustedItems(products, requestedItems) {
  if (!Array.isArray(requestedItems) || !requestedItems.length || requestedItems.length > 50) throw new Error('订单商品无效')
  const productMap = new Map(products.map(product => [product.id || product._id, product]))

  const items = requestedItems.map(requested => {
    const product = productMap.get(String(requested.productId || ''))
    if (!product || !product.enabled || product.soldOut) throw new Error('部分商品已下架或售罄，请刷新菜单')
    if (!Number.isSafeInteger(requested.quantity) || requested.quantity < 1 || requested.quantity > 99) throw new Error('商品数量无效')
    if (!Number.isSafeInteger(product.basePrice) || product.basePrice < 0) throw new Error(`${product.name} 的价格配置无效`)

    const options = normalizeOptions(product, requested.options || {})
    const unitPrice = product.basePrice + optionSurcharge(product, options)
    const subtotal = unitPrice * requested.quantity
    if (!Number.isSafeInteger(subtotal)) throw new Error('订单金额超出范围')

    return {
      productId: product.id || product._id,
      productName: product.name,
      options,
      quantity: requested.quantity,
      unitPrice,
      subtotal
    }
  })

  const amount = items.reduce((sum, item) => sum + item.subtotal, 0)
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('订单金额无效')
  return { items, amount }
}

module.exports = { buildTrustedItems, validateCustomer }
