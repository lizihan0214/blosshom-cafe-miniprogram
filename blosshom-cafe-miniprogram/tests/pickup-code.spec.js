const { allocatePickupCode, shanghaiBusinessDate } = require('../cloudfunctions/queryOrder/pickup-code')

function database(results) {
  const get = jest.fn()
  results.forEach(result => get.mockResolvedValueOnce({ data: result }))
  const limit = jest.fn(() => ({ get }))
  const where = jest.fn(() => ({ limit }))
  return { collection: jest.fn(() => ({ where })), where, get }
}

describe('pickup code allocation', () => {
  test('uses a stable three-digit code already assigned to the order', async () => {
    const db = database([])
    await expect(allocatePickupCode(db, { _id: 'order-1', pickupCode: '007', pickupDate: '20260822' })).resolves.toEqual({ code: '007', date: '20260822' })
    expect(db.collection).not.toHaveBeenCalled()
  })

  test('retries a same-day collision and returns a zero-padded code', async () => {
    const db = database([[{ _id: 'other-order' }], []])
    const values = [7, 42]
    const pickup = await allocatePickupCode(db, { _id: 'order-1', pickupCode: '', paidAt: new Date('2026-08-22T10:00:00Z') }, () => values.shift())
    expect(pickup).toEqual({ code: '042', date: '20260822' })
    expect(db.get).toHaveBeenCalledTimes(2)
  })

  test('uses the Shanghai calendar day', () => {
    expect(shanghaiBusinessDate(new Date('2026-08-21T16:30:00Z'))).toBe('20260822')
  })
})
