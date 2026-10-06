import { addToCart, clearCart, getCartCount, getCartItems, getCartTotal, setQuantity } from '../src/store/cart'

const latte = { id: 'latte', name: '经典拿铁', basePrice: 2200, enabled: true, soldOut: false }

describe('persistent cart model', () => {
  beforeEach(() => clearCart())
  test('merges same options and applies integer surcharge', () => {
    addToCart(latte, { temperature: 'iced', size: 'large', sugar: 'half' }, 1)
    addToCart(latte, { temperature: 'iced', size: 'large', sugar: 'half' }, 2)
    expect(getCartCount()).toBe(3); expect(getCartTotal()).toBe(7500); expect(getCartItems()[0].unitPrice).toBe(2500)
  })
  test('keeps different options and removes at zero', () => {
    addToCart(latte, { size: 'regular' }, 1); addToCart(latte, { size: 'large' }, 1)
    expect(getCartItems()).toHaveLength(2); setQuantity(getCartItems()[0].signature, 0); expect(getCartItems()).toHaveLength(1)
  })
  test('blocks sold-out items', () => { expect(() => addToCart({ ...latte, soldOut: true }, {}, 1)).toThrow('商品当前不可购买') })
})
