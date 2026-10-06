import { assertCents, cartTotal, formatMoney, lineTotal } from '../src/utils/money'

describe('integer money helpers', () => {
  test('formats integer cents', () => { expect(formatMoney(2203)).toBe('¥22.03') })
  test('calculates totals', () => { expect(lineTotal(2500, 2)).toBe(5000); expect(cartTotal([{ unitPrice: 2200, quantity: 1 }, { unitPrice: 2500, quantity: 2 }])).toBe(7200) })
  test('rejects invalid cents', () => { expect(() => assertCents(22.5)).toThrow(); expect(() => assertCents(-1)).toThrow() })
})
