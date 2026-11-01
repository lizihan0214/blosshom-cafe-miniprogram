const crypto = require('crypto')
const https = require('https')

const API_HOST = 'open.xpyun.net'
const API_PATH = '/api/openapi/xprinter/print'
const OPTION_LABELS = Object.freeze({
  iced: '冰',
  hot: '热',
  regular: '标准杯',
  large: '大杯',
  none: '无糖',
  half: '半糖',
  standard: '标准糖'
})

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`缺少云端环境变量 ${name}`)
  return value
}

function loadConfig() {
  return {
    user: requiredEnv('XPYUN_USER'),
    userKey: requiredEnv('XPYUN_USER_KEY'),
    sn: requiredEnv('XPYUN_SN')
  }
}

function sign(user, userKey, timestamp) {
  return crypto.createHash('sha1').update(`${user}${userKey}${timestamp}`, 'utf8').digest('hex')
}

function safeText(value, maxLength = 80) {
  return String(value || '')
    .replace(/[<>]/g, character => character === '<' ? '＜' : '＞')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function chineseName(value) {
  return safeText(value, 60).split(/\s*\/\s*/)[0]
}

function optionSummary(options) {
  return ['temperature', 'size', 'ice', 'sugar', 'teaBase']
    .map(key => options && options[key] ? (OPTION_LABELS[options[key]] || safeText(options[key], 12)) : '')
    .filter(Boolean)
    .join(' · ')
}

function money(cents) {
  return `${(Number(cents || 0) / 100).toFixed(2)} 元`
}

function shanghaiTime(value) {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date).replace(/\//g, '-')
}

function buildReceipt(order) {
  const isDineIn = order.diningMode === 'dine-in'
  const serviceLabel = isDineIn ? '堂食' : '外带'
  const tableOrPickup = isDineIn && order.tableNo
    ? `<C><B2>桌号 ${safeText(order.tableNo, 8)}</B2><BR><BR></C>`
    : `<C><B2>取餐号 ${safeText(order.pickupCode || '---', 8)}</B2><BR><BR></C>`
  const shopHeading = '<C>繁花<BR>Blosshom & Cafe<BR><BR></C>'
  const lines = [
    shopHeading,
    tableOrPickup,
    `<C>${order.isTest ? '测试单，请勿制作（未扣款）' : '已支付'} · ${serviceLabel}<BR></C>`,
    '<L>--------------------------------<BR></L>'
  ]

  ;(order.items || []).forEach(item => {
    const name = chineseName(item.productName) || '商品'
    lines.push(`<L>${name}  x${Number(item.quantity || 0)}<BR></L>`)
    const options = optionSummary(item.options)
    if (options) lines.push(`<L>  ${safeText(options, 40)}<BR></L>`)
    lines.push(`<R>${money(item.subtotal)}<BR></R>`)
  })

  lines.push('<L>--------------------------------<BR></L>')
  lines.push(`<R>合计 ${money(order.amount)}<BR></R>`)
  if (order.remark) lines.push(`<L><BR><FONT w="0" h="1">备注：${safeText(order.remark, 100)}</FONT><BR><BR></L>`)
  lines.push(`<L>取餐称呼：${safeText(order.pickupName, 20)}<BR></L>`)
  if (order.pickupCode) lines.push(`<L>取餐码：${safeText(order.pickupCode, 8)}<BR></L>`)
  lines.push(`<L>下单时间：${shanghaiTime(order.paidAt || order.createdAt)}<BR></L>`)
  lines.push(`<L>订单尾号：${safeText(order.orderNo || order._id, 30).slice(-8)}<BR></L>`)
  lines.push('<C>请核对桌号与备注<BR><BR></C>')
  // Keep the prominent table/pickup heading unchanged. Enlarge body height
  // without widening characters, so 58 mm paper retains its line capacity.
  return lines.map(line => {
    if (line === shopHeading || line === tableOrPickup || line.includes('--------------------------------')) return line
    if (line.includes('<FONT')) return line
    return line.replace(/^<(L|C|R)>/, '<$1><FONT w="0" h="1">')
      .replace(/<\/(L|C|R)>$/, '</FONT></$1>')
  }).join('')
}

function postJson(path, payload, timeoutMs = 8000) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: API_HOST,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'content-length': body.length
      },
      timeout: timeoutMs
    }, response => {
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        let parsed
        try { parsed = JSON.parse(raw) } catch (error) { return reject(new Error(`芯烨云返回了无法解析的响应（HTTP ${response.statusCode}）`)) }
        if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error(`芯烨云请求失败（HTTP ${response.statusCode}）`))
        resolve(parsed)
      })
    })
    request.on('timeout', () => request.destroy(new Error('芯烨云请求超时，打印结果未知')))
    request.on('error', reject)
    request.end(body)
  })
}

async function printReceipt(config, order) {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const result = await postJson(API_PATH, {
    user: config.user,
    timestamp,
    sign: sign(config.user, config.userKey, timestamp),
    debug: '0',
    sn: config.sn,
    content: buildReceipt(order),
    copies: 1,
    cutter: 0,
    voice: 2,
    mode: 1,
    expiresIn: 7200,
    idempotent: String(order.orderNo || order._id).slice(0, 50)
  })
  if (result.code === 1013) return { printOrderId: '', duplicate: true }
  if (result.code !== 0) {
    const error = new Error(`芯烨云拒绝打印：${result.msg || result.code}`)
    error.code = result.code
    throw error
  }
  return { printOrderId: String(result.data || ''), duplicate: false }
}

async function queryPrinterStatus(config) {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const result = await postJson('/api/openapi/xprinter/queryPrinterStatus', {
    user: config.user, timestamp,
    sign: sign(config.user, config.userKey, timestamp),
    debug: '0', sn: config.sn
  })
  if (result.code !== 0) throw new Error(`芯烨云连接检查失败，错误码：${result.code}`)
  return { ok: true, printerStatus: result.data, online: result.data === 1 }
}

module.exports = { buildReceipt, loadConfig, printReceipt, queryPrinterStatus, safeText, sign }
