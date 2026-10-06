import { readStorage, writeStorage } from '../services/storage'

const STORAGE_KEY = 'blosshom-table-context-v1'

export function normalizeTableNo(value) {
  const tableNo = String(value || '').trim().toUpperCase()
  return /^[A-Z0-9-]{1,8}$/.test(tableNo) ? tableNo : ''
}

export function tableNoFromLaunchOptions(options = {}) {
  const direct = normalizeTableNo(options.table || options.tableNo)
  if (direct) return direct

  let scene = String(options.scene || '').trim()
  try { scene = decodeURIComponent(scene) } catch (error) { /* keep original scene */ }
  const matched = scene.match(/(?:^|[&,])(?:table|tableNo|t)=([A-Za-z0-9-]{1,8})(?:$|[&,])/i)
  return normalizeTableNo(matched ? matched[1] : scene)
}

export function saveTableNo(tableNo) {
  const normalized = normalizeTableNo(tableNo)
  if (normalized) writeStorage(STORAGE_KEY, { tableNo: normalized, scannedAt: Date.now() })
  return normalized
}

export function getTableNo() {
  const context = readStorage(STORAGE_KEY, null)
  if (!context || !Number.isFinite(context.scannedAt) || Date.now() - context.scannedAt > 6 * 60 * 60 * 1000) return ''
  return normalizeTableNo(context && context.tableNo)
}

export function clearTableNo() {
  writeStorage(STORAGE_KEY, null)
}
