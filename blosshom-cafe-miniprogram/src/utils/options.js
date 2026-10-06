const labels = { iced: '冰', hot: '热', regular: '标准杯', large: '大杯', none: '无糖', half: '半糖', standard: '标准糖' }
export function optionLabel(value) { return labels[value] || value || '' }
export function optionSummary(options) { return ['temperature', 'size', 'sugar'].map(key => optionLabel(options[key])).filter(Boolean).join(' · ') || '默认规格' }
