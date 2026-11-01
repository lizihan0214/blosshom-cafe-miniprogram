// Keep rendered image nodes and their loaded source during metadata refreshes.
export function mergeMenuProducts(previous, incoming) {
  const byId = new Map(previous.map(item => [item.id || item._id, item]))
  return incoming.map(item => {
    const existing = byId.get(item.id || item._id)
    if (!existing) return item
    const image = item.imagePending && existing.image ? existing.image : item.image
    Object.assign(existing, item, { image })
    return existing
  }).sort((a, b) => a.sort - b.sort)
}
