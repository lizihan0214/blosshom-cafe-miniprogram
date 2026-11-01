const labels = { iced: '冰', hot: '热', regular: '标准杯', large: '大杯', none: '无糖', half: '半糖', standard: '标准糖' }
export function optionLabel(value) { return labels[value] || value || '' }
export const optionKeys = ['temperature', 'size', 'ice', 'sugar', 'teaBase']
const groupLabels = { temperature: '温度', size: '杯型', ice: '冰量', sugar: '糖分', teaBase: '茶底' }
export function optionGroups(product) {
  return optionKeys.filter(key => Array.isArray(product.options && product.options[key]) && product.options[key].length).map(key => ({ key, label: groupLabels[key], values: product.options[key] }))
}
export function optionSummary(options = {}) { return optionKeys.map(key => optionLabel(options[key])).filter(Boolean).join(' · ') || '默认规格' }
export function defaultOptions(product) {
  const defaults = { ice: '标准冰', sugar: '五分糖' }
  return optionGroups(product).reduce((result, group) => {
    if (group.values.includes(defaults[group.key])) result[group.key] = defaults[group.key]
    return result
  }, {})
}
