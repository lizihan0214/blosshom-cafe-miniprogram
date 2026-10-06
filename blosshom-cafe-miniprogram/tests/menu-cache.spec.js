describe('CloudBase menu cache fallback', () => {
  const cloudMenu = {
    categories: [{ id: 'coffee', name: '咖啡', enabled: true, sort: 10 }],
    products: [{ id: 'latte', name: '拿铁', category: 'coffee', enabled: true, sort: 10, basePrice: 2200 }],
    storeConfig: { name: 'Blosshom & Cafe' }
  }

  beforeEach(() => {
    jest.resetModules()
    process.env.VUE_APP_CLOUDBASE_ENV_ID = 'test-env'
    process.env.VUE_APP_USE_CLOUD = 'true'
  })

  afterEach(() => {
    delete global.wx
    delete process.env.VUE_APP_CLOUDBASE_ENV_ID
    delete process.env.VUE_APP_USE_CLOUD
  })

  test('stores a valid cloud menu then returns it as offline cache', async () => {
    const callFunction = jest.fn().mockResolvedValueOnce({ result: cloudMenu }).mockRejectedValueOnce(new Error('network down'))
    global.wx = { cloud: { callFunction } }
    const { getMenu, isMenuOffline } = require('../src/services/menu')

    const online = await getMenu()
    expect(online.source).toBe('cloud')
    expect(isMenuOffline()).toBe(false)

    const cached = await getMenu()
    expect(cached.source).toBe('cache')
    expect(cached.offline).toBe(true)
    expect(cached.products[0].id).toBe('latte')
    expect(isMenuOffline()).toBe(true)
  })

  test('uses the bundled product image when a known cloud product has no image yet', async () => {
    global.wx = {
      cloud: {
        callFunction: jest.fn().mockResolvedValue({
          result: {
            ...cloudMenu,
            products: [{ id: 'C001', name: '浓缩咖啡', category: 'coffee', enabled: true, sort: 10, basePrice: 1000, image: '' }]
          }
        })
      }
    }
    const { getMenu } = require('../src/services/menu')

    const menu = await getMenu()

    expect(menu.products[0].image).toBe('/static/menu-images/C001.jpg')
  })

  test('converts CloudBase file IDs to temporary HTTPS URLs before rendering', async () => {
    const fileID = 'cloud://test-env.bucket/C001.jpg'
    const getTempFileURL = jest.fn().mockResolvedValue({
      fileList: [{ fileID, status: 0, tempFileURL: 'https://example.test/C001.jpg' }]
    })
    global.wx = {
      cloud: {
        callFunction: jest.fn().mockResolvedValue({
          result: {
            ...cloudMenu,
            products: [{ id: 'C001', name: '浓缩咖啡', category: 'coffee', enabled: true, sort: 10, basePrice: 1000, image: fileID }]
          }
        }),
        getTempFileURL
      }
    }
    const { getMenu } = require('../src/services/menu')

    const menu = await getMenu()

    expect(getTempFileURL).toHaveBeenCalledWith({ fileList: [fileID] })
    expect(menu.products[0].image).toBe('https://example.test/C001.jpg')
    expect(menu.products[0].fallbackImage).toBe('/static/menu-images/C001.jpg')
  })

  test('falls back to the bundled image when a cloud file cannot be resolved', async () => {
    const fileID = 'cloud://test-env.bucket/C001.jpg'
    global.wx = {
      cloud: {
        callFunction: jest.fn().mockResolvedValue({
          result: {
            ...cloudMenu,
            products: [{ id: 'C001', name: '浓缩咖啡', category: 'coffee', enabled: true, sort: 10, basePrice: 1000, image: fileID }]
          }
        }),
        getTempFileURL: jest.fn().mockResolvedValue({ fileList: [{ fileID, status: -1 }] })
      }
    }
    const { getMenu } = require('../src/services/menu')

    const menu = await getMenu()

    expect(menu.products[0].image).toBe('/static/menu-images/C001.jpg')
  })
})
