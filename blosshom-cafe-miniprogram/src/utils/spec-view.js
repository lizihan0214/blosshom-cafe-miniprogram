import { optionGroups, optionLabel, optionSummary } from './options'
import { formatMoney } from './money'

// Send an ordinary serializable view model to WXML; no nested template method calls.
export function buildSpecView(product, selected = {}, quantity = 1) {
  const count = Number.isInteger(quantity) ? Math.max(1, Math.min(99, quantity)) : 1
  const parts = String(product.name || '').split(' / ')
  const groups = optionGroups(product).map(group => ({
    key: group.key,
    label: group.label,
    choices: group.values.map(value => ({ value, label: optionLabel(value), selected: selected[group.key] === value }))
  }))
  const complete = groups.every(group => group.choices.some(choice => choice.selected))
  const validPrice = Number.isSafeInteger(product.basePrice) && product.basePrice >= 0
  return { title: parts[0], english: parts.slice(1).join(' / '), groups, quantity: count,
    total: validPrice ? formatMoney(product.basePrice * count) : '价格暂不可用',
    complete: complete && validPrice,
    summary: complete ? optionSummary(selected) : '请选择' + groups.filter(group => !group.choices.some(choice => choice.selected)).map(group => group.label).join('、') }
}
