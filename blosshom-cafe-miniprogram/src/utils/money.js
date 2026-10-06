export function assertCents(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('金额必须是非负安全整数（分）')
  return value
}

export function formatMoney(cents) {
  assertCents(cents)
  return `¥${(cents / 100).toFixed(2)}`
}

export function lineTotal(unitPrice, quantity) {
  assertCents(unitPrice)
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new TypeError('数量必须是正整数')
  return unitPrice * quantity
}

export function cartTotal(items) { return items.reduce((sum, item) => sum + lineTotal(item.unitPrice, item.quantity), 0) }
