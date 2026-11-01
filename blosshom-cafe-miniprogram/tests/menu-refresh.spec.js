import { mergeMenuProducts } from '../src/utils/menu-refresh'

test('refresh keeps the loaded image and node while updating prices and stock', () => {
  const old = { id: 'S001', image: 'https://loaded.jpg', basePrice: 2600, sort: 10 }
  const [next] = mergeMenuProducts([old], [{ id: 'S001', image: '', imagePending: true, basePrice: 2800, soldOut: true, sort: 10 }])
  expect(next).toBe(old)
  expect(next.image).toBe('https://loaded.jpg')
  expect(next.basePrice).toBe(2800)
  expect(next.soldOut).toBe(true)
})

test('resolved replacement is applied; removed products are not retained', () => {
  const old = { id: 'S001', image: 'old.jpg', sort: 10 }
  const result = mergeMenuProducts([old, { id: 'removed' }], [{ id: 'S001', image: 'new.jpg', imagePending: false, sort: 10 }])
  expect(result).toHaveLength(1)
  expect(result[0]).toBe(old)
  expect(result[0].image).toBe('new.jpg')
})

test('pending fallback does not replace a loaded photo, but intentional removal does', () => {
  const old = { id: 'C001', image: 'loaded.jpg' }
  expect(mergeMenuProducts([old], [{ id: 'C001', image: '/static/old.jpg', imagePending: true }])[0].image).toBe('loaded.jpg')
  expect(mergeMenuProducts([old], [{ id: 'C001', image: '', imagePending: false }])[0].image).toBe('')
})
