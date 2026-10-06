export function orderStatusText(order = {}) {
  if (order.demo) return { UNPAID: '待模拟支付', PAID: '模拟支付成功', CLOSED: '已取消' }[order.paymentStatus] || order.paymentStatus
  if (order.paymentStatus === 'UNPAID') return '待支付'
  if (order.paymentStatus === 'PAYING') return '支付确认中'
  if (order.paymentStatus === 'CLOSED') return '已关闭'
  if (order.paymentStatus === 'REFUNDED') return '已退款'
  if (order.paymentStatus !== 'PAID') return order.paymentStatus || '处理中'
  return { PENDING: '待制作', PREPARING: '制作中', READY: '待取餐', COMPLETED: '已完成', CANCELLED: '已取消' }[order.fulfillmentStatus] || '已支付'
}
