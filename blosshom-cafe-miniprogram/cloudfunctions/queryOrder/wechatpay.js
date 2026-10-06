const crypto = require('crypto')
const https = require('https')
const publicConfig = Object.freeze({ mchid: '1749685098', serialNo: '7C6DE7A1C3F4D0C8465DF4CED25506E0848047D8', publicKeyId: 'PUB_KEY_ID_0117496850982026082200192186001005' })

function required(name) {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`云端缺少 ${name} 配置`)
  return value
}

function decodePem(name, marker) {
  const value = Buffer.from(required(name), 'base64').toString('utf8')
  if (!value.includes(marker)) throw new Error(`${name} 内容格式无效`)
  return value
}

function loadConfig() {
  return {
    mchid: process.env.WECHATPAY_MCHID || publicConfig.mchid,
    serialNo: process.env.WECHATPAY_CERT_SERIAL_NO || publicConfig.serialNo,
    privateKey: decodePem('WECHATPAY_PRIVATE_KEY_BASE64', 'PRIVATE KEY'),
    publicKeyId: process.env.WECHATPAY_PUBLIC_KEY_ID || publicConfig.publicKeyId,
    publicKey: decodePem('WECHATPAY_PUBLIC_KEY_BASE64', 'PUBLIC KEY')
  }
}

function nonce() { return crypto.randomBytes(16).toString('hex') }
function header(headers, name) { const key = Object.keys(headers || {}).find(item => item.toLowerCase() === name.toLowerCase()); return key ? String(headers[key]) : '' }

function requestWechatPay(method, path, payload, config) {
  const body = payload == null ? '' : JSON.stringify(payload)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const nonceStr = nonce()
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${method}\n${path}\n${timestamp}\n${nonceStr}\n${body}\n`), config.privateKey).toString('base64')
  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`
  return new Promise((resolve, reject) => {
    const request = https.request({ hostname: 'api.mch.weixin.qq.com', port: 443, method, path, timeout: 9000, headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: authorization, 'User-Agent': 'Blosshom-Cafe-CloudFunction/1.0', ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) } }, response => {
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('utf8')
        try {
          const responseSerial = header(response.headers, 'wechatpay-serial')
          const responseTimestamp = header(response.headers, 'wechatpay-timestamp')
          const responseNonce = header(response.headers, 'wechatpay-nonce')
          const responseSignature = header(response.headers, 'wechatpay-signature')
          if (responseSerial !== config.publicKeyId || !responseTimestamp || !responseNonce || !responseSignature) throw new Error('微信支付应答验签信息无效')
          if (responseSignature.startsWith('WECHATPAY/SIGNTEST/')) throw new Error('拒绝微信支付签名探测流量')
          const valid = crypto.verify('RSA-SHA256', Buffer.from(`${responseTimestamp}\n${responseNonce}\n${responseBody}\n`), config.publicKey, Buffer.from(responseSignature, 'base64'))
          if (!valid) throw new Error('微信支付应答验签失败')
          const data = responseBody ? JSON.parse(responseBody) : null
          if (response.statusCode < 200 || response.statusCode >= 300) { const error = new Error(data && data.message ? `微信支付：${data.message}` : `微信支付接口返回 ${response.statusCode}`); error.code = data && data.code; throw error }
          resolve(data)
        } catch (error) { reject(error) }
      })
    })
    request.on('timeout', () => request.destroy(new Error('微信支付接口请求超时')))
    request.on('error', reject)
    if (body) request.write(body)
    request.end()
  })
}

function queryTransaction(config, outTradeNo) {
  return requestWechatPay('GET', `/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?mchid=${encodeURIComponent(config.mchid)}`, null, config)
}

module.exports = { loadConfig, queryTransaction, requestWechatPay }
