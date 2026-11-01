const cloud = require('wx-server-sdk')
const { loadConfig, printReceipt, queryPrinterStatus } = require('./xpyun')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const command = db.command

async function ensureJob(orderNo) {
  try {
    await db.collection('print_jobs').add({ data: {
      _id: orderNo,
      orderNo,
      status: 'PENDING',
      attempts: 0,
      printOrderId: '',
      lastError: '',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    } })
  } catch (error) {
    const existing = await db.collection('print_jobs').doc(orderNo).get().catch(() => ({ data: null }))
    if (!existing.data) throw error
  }
  return (await db.collection('print_jobs').doc(orderNo).get()).data
}

async function dispatch(order) {
  const config = loadConfig()
  const orderNo = String(order.orderNo || order._id)
  const job = await ensureJob(orderNo)
  if (job.status === 'SENT') return { ok: true, reused: true, printOrderId: job.printOrderId || '' }
  if (job.status === 'DISPATCHING') return { ok: true, reused: true, inProgress: true }
  if (job.status === 'UNKNOWN') return { ok: false, needsReview: true }

  const claim = await db.collection('print_jobs').where({ _id: orderNo, status: job.status }).update({ data: {
    status: 'DISPATCHING',
    attempts: command.inc(1),
    lastError: '',
    updatedAt: db.serverDate()
  } })
  if (!claim.stats || claim.stats.updated !== 1) return { ok: true, reused: true, inProgress: true }

  try {
    const result = await printReceipt(config, order)
    await db.collection('print_jobs').doc(orderNo).update({ data: {
      status: 'SENT',
      printOrderId: result.printOrderId,
      duplicateProtected: result.duplicate,
      sentAt: db.serverDate(),
      updatedAt: db.serverDate()
    } })
    return { ok: true, reused: result.duplicate, printOrderId: result.printOrderId }
  } catch (error) {
    const unknown = !Number.isInteger(error.code)
    await db.collection('print_jobs').doc(orderNo).update({ data: {
      status: unknown ? 'UNKNOWN' : 'FAILED',
      lastError: String(error && error.message || '打印失败').slice(0, 300),
      updatedAt: db.serverDate()
    } })
    throw error
  }
}

exports.main = async event => {
  // Internal-only function (invoke:false). Diagnostic never prints or returns credentials.
  if (event && event.action === 'diagnose') return queryPrinterStatus(loadConfig())
  if (event && event.action === 'testPrint') {
    const config = loadConfig()
    const status = await queryPrinterStatus(config)
    if (!status.online) throw new Error('打印机不在线或异常，取消测试')
    return printReceipt(config, {
      isTest: true, orderNo: 'TEST20261008RECEIPT03',
      diningMode: 'dine-in', tableNo: '08', pickupCode: '000',
      pickupName: '测试', remark: '测试单，请勿制作；检查中文及切纸', amount: 0,
      items: [{ productName: '拿铁 / Latte', quantity: 1, subtotal: 0,
        options: { temperature: 'iced', sugar: 'half' } }]
    })
  }
  if (process.env.XPYUN_ENABLED !== 'true') return { ok: false, disabled: true }
  const startsAt = Date.parse(process.env.XPYUN_STARTS_AT || '')
  if (!Number.isFinite(startsAt)) throw new Error('请配置 XPYUN_STARTS_AT，避免打印历史订单')
  const orderNo = String(event && event.orderNo || '').trim()
  if (!/^BC\d{14}[A-Z0-9]{6}$/.test(orderNo)) throw new Error('订单号无效')
  const result = await db.collection('orders').doc(orderNo).get().catch(() => ({ data: null }))
  if (!result.data) throw new Error('订单不存在')
  if (result.data.paymentStatus !== 'PAID') throw new Error('只有已支付订单才能打印')
  const paidAt = new Date(result.data.paidAt).getTime()
  if (!Number.isFinite(paidAt) || paidAt < startsAt) return { ok: false, historical: true }
  return dispatch(result.data)
}
