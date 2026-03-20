import api from './api'

// Cart API calls
export const cartAPI = {
  // Add item to cart
  addToCart: (productId, quantity = 1) => {
    return api.post('/cart/add', { productId, quantity })
  },

  // Get cart items
  getCart: () => {
    return api.get('/cart')
  },

  // Update cart item quantity
  updateCartItem: (productId, quantity) => {
    return api.put('/cart/update', { productId, quantity })
  },

  // Remove item from cart
  removeFromCart: (productId) => {
    return api.delete('/cart/remove', { data: { productId } })
  },

  // Clear entire cart
  clearCart: () => {
    return api.delete('/cart/clear')
  },

  // Get cart summary (item count, total items)
  getCartSummary: () => {
    return api.get('/cart/summary')
  }
}

export default cartAPI
