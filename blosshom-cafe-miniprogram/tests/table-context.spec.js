import { normalizeTableNo, tableNoFromLaunchOptions } from '../src/utils/table-context'

describe('table QR context', () => {
  test('accepts short table identifiers and normalizes case', () => {
    expect(normalizeTableNo(' a-08 ')).toBe('A-08')
  })

  test('reads direct and encoded scene parameters', () => {
    expect(tableNoFromLaunchOptions({ table: '08' })).toBe('08')
    expect(tableNoFromLaunchOptions({ scene: 't%3DA12' })).toBe('A12')
  })

  test('rejects unsafe or oversized table identifiers', () => {
    expect(normalizeTableNo('../01')).toBe('')
    expect(normalizeTableNo('123456789')).toBe('')
  })
})
