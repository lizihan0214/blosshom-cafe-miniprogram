const crypto = require('crypto')
const { createPaymentParams, verifyWechatSignature } = require('../cloudfunctions/createPayment/wechatpay')
const { decryptResource, verifyCallback } = require('../cloudfunctions/paymentNotify/security')

const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
const publicKeyId = 'PUB_KEY_ID_1234567890'

describe('WeChat Pay API v3 cryptography boundaries', () => {
  beforeEach(() => {
    process.env.WECHATPAY_PUBLIC_KEY_ID = publicKeyId
    process.env.WECHATPAY_PUBLIC_KEY_BASE64 = Buffer.from(keys.publicKey).toString('base64')
    process.env.WECHATPAY_API_V3_KEY = '1234567890ABCDEF1234567890ABCDEF'
  })

  afterEach(() => {
    delete process.env.WECHATPAY_PUBLIC_KEY_ID
    delete process.env.WECHATPAY_PUBLIC_KEY_BASE64
    delete process.env.WECHATPAY_API_V3_KEY
  })

  test('generates verifiable mini-program payment parameters', () => {
    const config = { appid: 'wx9911d30b35ffc8b1', privateKey: keys.privateKey }
    const payment = createPaymentParams(config, 'wx-prepay-id')
    const message = `${config.appid}\n${payment.timeStamp}\n${payment.nonceStr}\n${payment.package}\n`
    expect(payment.signType).toBe('RSA')
    expect(crypto.verify('RSA-SHA256', Buffer.from(message), keys.publicKey, Buffer.from(payment.paySign, 'base64'))).toBe(true)
  })

  test('verifies signed responses and rejects a changed body', () => {
    const body = JSON.stringify({ prepay_id: 'wx-prepay-id' })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const nonce = 'response-nonce'
    const signature = crypto.sign('RSA-SHA256', Buffer.from(`${timestamp}\n${nonce}\n${body}\n`), keys.privateKey).toString('base64')
    const headers = { 'wechatpay-serial': publicKeyId, 'wechatpay-timestamp': timestamp, 'wechatpay-nonce': nonce, 'wechatpay-signature': signature }
    expect(() => verifyWechatSignature(headers, body, { publicKeyId, publicKey: keys.publicKey })).not.toThrow()
    expect(() => verifyWechatSignature(headers, `${body} `, { publicKeyId, publicKey: keys.publicKey })).toThrow('验签失败')
  })

  test('verifies and decrypts an AES-256-GCM callback resource', () => {
    const transaction = { out_trade_no: 'BC20260822123456ABC123', trade_state: 'SUCCESS', amount: { total: 100, currency: 'CNY' } }
    const apiKey = Buffer.from(process.env.WECHATPAY_API_V3_KEY)
    const nonce = '0123456789ab'
    const associatedData = 'transaction'
    const cipher = crypto.createCipheriv('aes-256-gcm', apiKey, Buffer.from(nonce))
    cipher.setAAD(Buffer.from(associatedData))
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(transaction)), cipher.final(), cipher.getAuthTag()]).toString('base64')
    const resource = { algorithm: 'AEAD_AES_256_GCM', nonce, associated_data: associatedData, ciphertext }
    const body = JSON.stringify({ event_type: 'TRANSACTION.SUCCESS', resource })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const callbackNonce = 'callback-nonce'
    const signature = crypto.sign('RSA-SHA256', Buffer.from(`${timestamp}\n${callbackNonce}\n${body}\n`), keys.privateKey).toString('base64')
    const headers = { 'Wechatpay-Serial': publicKeyId, 'Wechatpay-Timestamp': timestamp, 'Wechatpay-Nonce': callbackNonce, 'Wechatpay-Signature': signature }

    expect(() => verifyCallback(headers, body)).not.toThrow()
    expect(decryptResource(resource)).toEqual(transaction)
  })
})
