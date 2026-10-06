const memory = Object.create(null)

export function readStorage(key, fallback) {
  try {
    if (typeof uni !== 'undefined') {
      const value = uni.getStorageSync(key)
      return value === '' || value == null ? fallback : value
    }
  } catch (error) { /* istanbul ignore next */ return fallback }
  return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : fallback
}

export function writeStorage(key, value) {
  memory[key] = value
  if (typeof uni !== 'undefined') uni.setStorageSync(key, value)
}
