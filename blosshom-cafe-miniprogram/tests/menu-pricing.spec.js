const { products } = require('../src/config/menu')

describe('menu pricing', () => {
  test('all alcoholic drinks are priced at ¥68', () => {
    const alcoholicDrinks = products.filter((product) => product.category === 'cocktails')

    expect(alcoholicDrinks).toHaveLength(12)
    expect(alcoholicDrinks.every((product) => product.basePrice === 6800)).toBe(true)
  })
})
