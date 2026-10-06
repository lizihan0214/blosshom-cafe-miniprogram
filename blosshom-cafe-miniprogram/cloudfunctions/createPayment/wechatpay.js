const crypto = require('crypto')
const https = require('https')
const publicConfig = Object.freeze({ appid: 'wx9911d30b35ffc8b1', mchid: '1749685098', serialNo: '7C6DE7A1C3F4D0C8465DF4CED25506E0848047D8', publicKeyId: 'PUB_KEY_ID_0117496850982026082200192186001005' })

const API_HOST = 'api.mch.weixin.qq.com'

function required(name) {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`云端缺少 ${name} 配置`)
  return value
}

function decodePem(name, marker) {
  let value
  try { value = Buffer.from(required(name), 'base64').toString('utf8') } catch (error) { throw new Error(`${name} 不是有效的 Base64`) }
  if (!value.includes(marker)) throw new Error(`${name} 内容格式无效`)
  return value
}

function loadConfig() {
  const config = {
    appid: process.env.WECHATPAY_APPID || publicConfig.appid,
    mchid: process.env.WECHATPAY_MCHID || publicConfig.mchid,
    serialNo: process.env.WECHATPAY_CERT_SERIAL_NO || publicConfig.serialNo,
    privateKey: decodePem('WECHATPAY_PRIVATE_KEY_BASE64', 'PRIVATE KEY'),
    publicKeyId: process.env.WECHATPAY_PUBLIC_KEY_ID || publicConfig.publicKeyId,
    publicKey: decodePem('WECHATPAY_PUBLIC_KEY_BASE64', 'PUBLIC KEY'),
    notifyUrl: required('WECHATPAY_NOTIFY_URL')
  }
  if (!/^wx[a-zA-Z0-9]{16}$/.test(config.appid)) throw new Error('WECHATPAY_APPID 格式无效')
  if (!/^\d{8,32}$/.test(config.mchid)) throw new Error('WECHATPAY_MCHID 格式无效')
  if (!/^PUB_KEY_ID_\d+$/.test(config.publicKeyId)) throw new Error('WECHATPAY_PUBLIC_KEY_ID 格式无效')
  if (!/^https:\/\//.test(config.notifyUrl)) throw new Error('WECHATPAY_NOTIFY_URL 必须是 HTTPS 地址')
  return config
}

function nonce() { return crypto.randomBytes(16).toString('hex') }
function sign(message, privateKey) { return crypto.sign('RSA-SHA256', Buffer.from(message), privateKey).toString('base64') }

function authorization(method, path, body, config, timestamp, nonceStr) {
  const signature = sign(`${method}\n${path}\n${timestamp}\n${nonceStr}\n${body}\n`, config.privateKey)
  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`
}

function header(headers, name) {
  const key = Object.keys(headers || {}).find(item => item.toLowerCase() === name.toLowerCase())
  return key ? String(headers[key]) : ''
}

function verifyWechatSignature(headers, body, config) {
  const serial = header(headers, 'wechatpay-serial')
  const timestamp = header(headers, 'wechatpay-timestamp')
  const nonceStr = header(headers, 'wechatpay-nonce')
  const signature = header(headers, 'wechatpay-signature')
  if (!serial || !timestamp || !nonceStr || !signature) throw new Error('微信支付应答缺少验签信息')
  if (serial !== config.publicKeyId) throw new Error('微信支付公钥 ID 不匹配')
  if (signature.startsWith('WECHATPAY/SIGNTEST/')) throw new Error('拒绝微信支付签名探测流量')
  const valid = crypto.verify('RSA-SHA256', Buffer.from(`${timestamp}\n${nonceStr}\n${body}\n`), config.publicKey, Buffer.from(signature, 'base64'))
  if (!valid) throw new Error('微信支付应答验签失败')
}

function requestWechatPay(method, path, payload, config) {
  const body = payload == null ? '' : JSON.stringify(payload)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const nonceStr = nonce()
  const auth = authorization(method, path, body, config, timestamp, nonceStr)
  return new Promise((resolve, reject) => {
    const request = https.request({ hostname: API_HOST, port: 443, method, path, timeout: 9000, headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: auth, 'User-Agent': 'Blosshom-Cafe-CloudFunction/1.0', ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) } }, response => {
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('utf8')
        try {
          verifyWechatSignature(response.headers, responseBody, config)
          const data = responseBody ? JSON.parse(responseBody) : null
          if (response.statusCode < 200 || response.statusCode >= 300) {
            const error = new Error(data && data.message ? `微信支付：${data.message}` : `微信支付接口返回 ${response.statusCode}`)
            error.code = data && data.code
            error.statusCode = response.statusCode
            throw error
          }
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

async function createJsapiOrder(config, data) {
  const result = await requestWechatPay('POST', '/v3/pay/transactions/jsapi', {
    appid: config.appid,
    mchid: config.mchid,
    description: data.description,
    out_trade_no: data.outTradeNo,
    time_expire: data.timeExpire,
    attach: data.orderNo,
    notify_url: config.notifyUrl,
    amount: { total: data.amount, currency: 'CNY' },
    payer: { openid: data.openid }
  }, config)
  if (!result || !result.prepay_id) throw new Error('微信支付未返回 prepay_id')
  return result.prepay_id
}

function createPaymentParams(config, prepayId) {
  const timeStamp = String(Math.floor(Date.now() / 1000))
  const nonceStr = nonce()
  const packageValue = `prepay_id=${prepayId}`
  return { timeStamp, nonceStr, package: packageValue, signType: 'RSA', paySign: sign(`${config.appid}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`, config.privateKey) }
}

module.exports = { authorization, createJsapiOrder, createPaymentParams, loadConfig, requestWechatPay, verifyWechatSignature }
