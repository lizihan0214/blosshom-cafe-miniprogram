const crypto = require('crypto')
const publicConfig = Object.freeze({ publicKeyId: 'PUB_KEY_ID_0117496850982026082200192186001005' })

function required(name) {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`云端缺少 ${name} 配置`)
  return value
}

function decodePem(name) {
  const value = Buffer.from(required(name), 'base64').toString('utf8')
  if (!value.includes('PUBLIC KEY')) throw new Error(`${name} 内容格式无效`)
  return value
}

function header(headers, name) {
  const key = Object.keys(headers || {}).find(item => item.toLowerCase() === name.toLowerCase())
  return key ? String(headers[key]) : ''
}

function verifyCallback(headers, rawBody) {
  const publicKeyId = process.env.WECHATPAY_PUBLIC_KEY_ID || publicConfig.publicKeyId
  const serial = header(headers, 'wechatpay-serial')
  const timestamp = header(headers, 'wechatpay-timestamp')
  const nonce = header(headers, 'wechatpay-nonce')
  const signature = header(headers, 'wechatpay-signature')
  if (serial !== publicKeyId || !timestamp || !nonce || !signature) throw new Error('回调验签信息无效')
  if (signature.startsWith('WECHATPAY/SIGNTEST/')) throw new Error('拒绝签名探测流量')
  if (!/^\d{10}$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) throw new Error('回调时间戳无效')
  const publicKey = decodePem('WECHATPAY_PUBLIC_KEY_BASE64')
  const valid = crypto.verify('RSA-SHA256', Buffer.from(`${timestamp}\n${nonce}\n${rawBody}\n`), publicKey, Buffer.from(signature, 'base64'))
  if (!valid) throw new Error('回调验签失败')
}

function decryptResource(resource) {
  if (!resource || resource.algorithm !== 'AEAD_AES_256_GCM') throw new Error('回调加密算法不受支持')
  const key = Buffer.from(required('WECHATPAY_API_V3_KEY'), 'utf8')
  if (key.length !== 32) throw new Error('API v3 密钥长度无效')
  const encrypted = Buffer.from(String(resource.ciphertext || ''), 'base64')
  if (encrypted.length <= 16) throw new Error('回调密文无效')
  const ciphertext = encrypted.subarray(0, encrypted.length - 16)
  const authTag = encrypted.subarray(encrypted.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(String(resource.nonce || ''), 'utf8'))
  decipher.setAuthTag(authTag)
  decipher.setAAD(Buffer.from(String(resource.associated_data || ''), 'utf8'))
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  return JSON.parse(plaintext)
}

module.exports = { decryptResource, verifyCallback }
