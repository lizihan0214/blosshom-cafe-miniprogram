const { buildReceipt, safeText, sign } = require('../cloudfunctions/dispatchPrint/xpyun')

describe('Xpyun receipt integration', () => {
  test('creates the documented SHA1 signature', () => {
    expect(sign('acc', 'abc', '123')).toBe(require('crypto').createHash('sha1').update('accabc123').digest('hex'))
  })

  test('formats a paid dine-in order with a prominent table number', () => {
    const receipt = buildReceipt({
      orderNo: 'BC20261008123456ABC123',
      diningMode: 'dine-in',
      tableNo: '08',
      pickupCode: '307',
      pickupName: '李女士',
      remark: '少冰，不要吸管',
      amount: 5000,
      paidAt: '2026-10-08T04:34:56.000Z',
      items: [{ productName: '拿铁 / Latte', quantity: 2, subtotal: 5000, options: { temperature: 'iced', size: 'large' } }]
    })
    expect(receipt).toContain('<B2>桌号 08</B2>')
    expect(receipt).toContain('拿铁  x2')
    expect(receipt).toContain('冰 · 大杯')
    expect(receipt).toContain('合计 50.00 元')
    expect(receipt).not.toContain('¥')
    expect(receipt).toContain('</B2><BR><BR></C>')
    expect(receipt).toContain('备注：少冰，不要吸管')
    expect(receipt).not.toContain('Latte')
    expect(receipt).toContain('<C>繁花<BR>Blosshom & Cafe<BR><BR></C>')
    expect(receipt).not.toMatch(/<(?:BOLD|B|CB)>/)
    expect(receipt).toContain('<L><FONT w="0" h="1">拿铁  x2')
    expect(receipt).toContain('<R><FONT w="0" h="1">合计 50.00 元')
    expect(receipt).toContain('<C><B2>桌号 08</B2><BR><BR></C>')
    let depth = 0
    for (const tag of receipt.match(/<\/?FONT[^>]*>/g)) {
      depth += tag.startsWith('</') ? -1 : 1
      expect(depth).toBeGreaterThanOrEqual(0)
      expect(depth).toBeLessThanOrEqual(1)
    }
    expect(depth).toBe(0)
  })

  test('neutralizes printer markup in customer-entered text', () => {
    expect(safeText('<CUT>\n测试')).toBe('＜CUT＞ 测试')
  })
})
