import { callCloudFunction, isCloudReady } from './cloud'
import { readStorage, writeStorage } from './storage'

const ORDER_KEY = 'blosshom-demo-orders-v1'

export async function getMyOrders() {
  if (isCloudReady()) return callCloudFunction('getMyOrders', {})
  return readStorage(ORDER_KEY, [])
}

export async function queryOrder(orderNo) {
  if (isCloudReady()) return callCloudFunction('queryOrder', { orderNo })
  const order = readStorage(ORDER_KEY, []).find(item => item.orderNo === orderNo)
  if (!order) throw new Error('未找到模拟订单')
  return order
}

export function saveDemoOrder(order) {
  const orders = readStorage(ORDER_KEY, [])
  const index = orders.findIndex(item => item.orderNo === order.orderNo)
  if (index >= 0) orders.splice(index, 1, order)
  else orders.unshift(order)
  writeStorage(ORDER_KEY, orders)
  return order
}
