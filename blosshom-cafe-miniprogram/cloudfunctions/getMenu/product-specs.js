const ice = ['去冰', '少冰', '标准冰']
const sugar = ['三分糖', '五分糖', '七分糖']
function withSpecs(product, version) {
  if (version !== 1) return product
  const id = product.id || product._id
  let added = {}
  if (['C003', 'C004', 'C005', 'C006', 'C007', 'C011', 'T001', 'T002', 'T003'].includes(id)) added.ice = ice
  if (['C004', 'C006', 'C007'].includes(id)) added.ice = ['少冰', '标准冰']
  if (['T001', 'T002', 'T003'].includes(id)) added.sugar = sugar
  if (id === 'T004') added.teaBase = ['正山小种', '茉莉花茶', '小青柑', '凤凰单枞', '福鼎白茶', '英红九号']
  const description = id === 'T004' ? String(product.description || '').replace('请在订单备注中填写茶底。', '') : product.description
  const cleanDescription = String(description || '').replace(/ · 可换燕麦奶 \+5 元（请备注）/g, '')
  const finalDescription = id === 'T004' ? '28元/套 · 六款茶底任选一，搭配花生、瓜子、坚果和桂圆，热水无限供应。' : ['C009', 'C010'].includes(id) ? cleanDescription.replace('甜度可调整', '默认不额外加糖') + (cleanDescription.includes('默认不额外加糖') || cleanDescription.includes('甜度可调整') ? '' : ' · 默认不额外加糖') : cleanDescription
  return { ...product, name: id === 'T004' ? '功夫茶套装 / Gongfu Tea Set' : product.name, description: finalDescription, options: { ...product.options, ...added } }
}
module.exports = { withSpecs }
