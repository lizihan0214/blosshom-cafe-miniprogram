const { TABLE_NUMBERS, buildQrPayload, parseEnvVersion } = require('../scripts/generate-table-qrcodes')

describe('table mini program code generator', () => {
  test('uses the confirmed 01-12 table range', () => {
    expect(TABLE_NUMBERS).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'])
  })

  test('builds a short scene for the menu page', () => {
    expect(buildQrPayload('08', 'trial')).toEqual(expect.objectContaining({ scene: 't=08', page: 'pages/menu/index', env_version: 'trial', check_path: true, width: 430 }))
  })

  test('rejects unknown tables and environments', () => {
    expect(() => buildQrPayload('13')).toThrow('不支持的桌号')
    expect(() => parseEnvVersion(['--env=unknown'])).toThrow('二维码环境')
  })
})
