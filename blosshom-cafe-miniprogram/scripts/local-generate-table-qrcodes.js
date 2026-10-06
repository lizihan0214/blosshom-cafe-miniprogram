'use strict'

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const querystring = require('querystring')
const { TABLE_NUMBERS, PAGE, buildQrPayload } = require('./generate-table-qrcodes')

const HOST = '127.0.0.1'
const PORT = 18761
const APPID = 'wx9911d30b35ffc8b1'
const OUTPUT = path.resolve(__dirname, '..', 'artifacts', 'table-qrcodes')
let used = false

function html(message = '', success = false) {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
  <title>繁花桌码生成</title><style>body{font:16px system-ui;margin:0;background:#f6f0e6;color:#38261d}.box{max-width:560px;margin:12vh auto;padding:36px;background:#fff;border-radius:18px;box-shadow:0 12px 40px #5b3a2222}h1{font-size:25px}input,button{box-sizing:border-box;width:100%;padding:14px;margin-top:12px;border-radius:10px}input{border:1px solid #cdbdaa}button{border:0;background:#663e29;color:#fff;font-weight:700}.note{color:#78685f;line-height:1.6}.msg{padding:12px;background:${success ? '#e9f6ec' : '#fff0ed'};border-radius:10px}</style>
  <div class="box"><h1>生成 01–12 桌正式小程序码</h1>${message ? `<p class="msg">${message}</p>` : ''}
  ${used ? '<p class="note">此一次性页面已经失效，可以关闭。</p>' : `<p class="note">AppSecret 只用于本机向微信换取短期令牌，不会写入文件、源码、环境变量或日志。</p><form method="post"><input name="secret" type="password" autocomplete="off" required placeholder="粘贴刚刚复制的 AppSecret"><button>生成 12 张正式桌码</button></form>`}</div>`
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify(payload))
    const req = https.request(url, { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': body.length } }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
    })
    req.on('error', reject)
    req.end(body)
  })
}

function parseError(response, label) {
  const contentType = String(response.headers['content-type'] || '')
  if (!contentType.includes('json') && response.body[0] !== 0x7b) return null
  const result = JSON.parse(response.body.toString('utf8'))
  if (result.errcode) throw new Error(`${label}失败：${result.errcode} ${result.errmsg || ''}`)
  return result
}

async function generate(secret) {
  const tokenResponse = await postJson('https://api.weixin.qq.com/cgi-bin/stable_token', { grant_type: 'client_credential', appid: APPID, secret, force_refresh: false })
  const tokenData = parseError(tokenResponse, '获取微信令牌')
  if (!tokenData?.access_token) throw new Error('微信未返回 access_token')
  fs.mkdirSync(OUTPUT, { recursive: true })
  const manifest = []
  for (const tableNo of TABLE_NUMBERS) {
    const response = await postJson(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${encodeURIComponent(tokenData.access_token)}`, buildQrPayload(tableNo, 'release'))
    parseError(response, `生成 ${tableNo} 桌小程序码`)
    if (response.statusCode !== 200 || response.body.length < 1000) throw new Error(`生成 ${tableNo} 桌小程序码失败`)
    const filename = `table-${tableNo}-release.png`
    fs.writeFileSync(path.join(OUTPUT, filename), response.body)
    manifest.push({ tableNo, scene: `t=${tableNo}`, page: PAGE, envVersion: 'release', filename, bytes: response.body.length })
  }
  fs.writeFileSync(path.join(OUTPUT, 'manifest-release.json'), JSON.stringify({ generatedAt: new Date().toISOString(), appid: APPID, tables: manifest }, null, 2) + '\n')
  return manifest
}

const server = http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'")
  if (req.method === 'GET') { res.end(html()); return }
  if (req.method !== 'POST' || used) { res.statusCode = 409; res.end(html('此页面已经失效。')); return }
  let body = ''
  req.on('data', chunk => { body += chunk; if (body.length > 4096) req.destroy() })
  req.on('end', async () => {
    let secret = String(querystring.parse(body).secret || '').trim()
    try {
      if (!secret) throw new Error('AppSecret 不能为空')
      const manifest = await generate(secret)
      used = true
      secret = ''
      res.end(html(`已生成 ${manifest.length} 张正式桌码。可以回到 Codex。`, true))
      setTimeout(() => server.close(), 1000)
    } catch (error) {
      secret = ''
      res.statusCode = 400
      res.end(html(String(error.message).replace(/[<>&]/g, '')))
    }
  })
})

server.listen(PORT, HOST, () => process.stdout.write(`READY http://${HOST}:${PORT}\n`))
setTimeout(() => { if (!used) server.close() }, 10 * 60 * 1000)
