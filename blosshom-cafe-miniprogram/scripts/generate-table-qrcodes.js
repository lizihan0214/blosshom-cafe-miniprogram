'use strict'

const fs = require('fs')
const https = require('https')
const path = require('path')

const TABLE_NUMBERS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
const PAGE = 'pages/menu/index'

function parseEnvVersion(argv = process.argv.slice(2)) {
  const argument = argv.find(item => item.startsWith('--env='))
  const value = argument ? argument.slice('--env='.length) : 'release'
  if (!['release', 'trial', 'develop'].includes(value)) throw new Error('二维码环境只能是 release、trial 或 develop')
  return value
}

function buildQrPayload(tableNo, envVersion = 'release') {
  if (!TABLE_NUMBERS.includes(tableNo)) throw new Error(`不支持的桌号：${tableNo}`)
  return {
    scene: `t=${tableNo}`,
    page: PAGE,
    check_path: true,
    env_version: envVersion,
    width: 430,
    auto_color: false,
    is_hyaline: false
  }
}

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, response => {
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve({ statusCode: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

async function postJson(url, payload) {
  const body = Buffer.from(JSON.stringify(payload))
  return request(url, { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': body.length } }, body)
}

function parseWechatError(response, label) {
  const contentType = String(response.headers['content-type'] || '')
  if (!contentType.includes('json') && response.body[0] !== 0x7b) return null
  let result
  try { result = JSON.parse(response.body.toString('utf8')) } catch (error) { throw new Error(`${label}返回了无法识别的响应`) }
  if (result.errcode) throw new Error(`${label}失败：${result.errcode} ${result.errmsg || ''}`.trim())
  return result
}

async function getStableAccessToken(appid, secret) {
  const response = await postJson('https://api.weixin.qq.com/cgi-bin/stable_token', { grant_type: 'client_credential', appid, secret, force_refresh: false })
  const result = parseWechatError(response, '获取微信 access_token')
  if (!result || !result.access_token) throw new Error('微信未返回 access_token')
  return result.access_token
}

async function generateTableQRCodes({ appid, secret, envVersion, outputDir }) {
  const token = await getStableAccessToken(appid, secret)
  fs.mkdirSync(outputDir, { recursive: true })
  const manifest = []

  for (const tableNo of TABLE_NUMBERS) {
    const response = await postJson(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${encodeURIComponent(token)}`, buildQrPayload(tableNo, envVersion))
    parseWechatError(response, `生成 ${tableNo} 桌小程序码`)
    if (response.statusCode !== 200 || response.body.length < 1000) throw new Error(`生成 ${tableNo} 桌小程序码失败：响应不是有效图片`)
    const filename = `table-${tableNo}-${envVersion}.png`
    fs.writeFileSync(path.join(outputDir, filename), response.body)
    manifest.push({ tableNo, scene: `t=${tableNo}`, page: PAGE, envVersion, filename })
    process.stdout.write(`已生成 ${tableNo} 桌：${filename}\n`)
  }

  fs.writeFileSync(path.join(outputDir, `manifest-${envVersion}.json`), `${JSON.stringify({ generatedAt: new Date().toISOString(), appid, tables: manifest }, null, 2)}\n`)
  return manifest
}

async function main() {
  const appid = String(process.env.WECHAT_APPID || '').trim()
  const secret = String(process.env.WECHAT_APPSECRET || '').trim()
  if (!/^wx[a-zA-Z0-9]{16}$/.test(appid)) throw new Error('请通过 WECHAT_APPID 环境变量提供有效的小程序 AppID')
  if (!secret) throw new Error('请通过 WECHAT_APPSECRET 环境变量临时提供 AppSecret；不要把它写入源码或 .env 文件')
  const envVersion = parseEnvVersion()
  const outputDir = path.resolve(process.env.TABLE_QR_OUTPUT_DIR || path.join(process.cwd(), 'artifacts', 'table-qrcodes'))
  await generateTableQRCodes({ appid, secret, envVersion, outputDir })
  process.stdout.write(`完成：${outputDir}\n`)
}

if (require.main === module) main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })

module.exports = { TABLE_NUMBERS, PAGE, buildQrPayload, parseEnvVersion }
