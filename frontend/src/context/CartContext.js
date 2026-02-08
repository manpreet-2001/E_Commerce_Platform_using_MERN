import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');

  // Fetch cart from API
  const fetchCart = useCallback(async () => {
    setCartLoading(true);
    setCartError('');
    try {
      const res = await axios.get('/api/cart');
      const list = res.data?.data ?? res.data;
      setCartItems(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err.response?.status === 401) {
        setCartItems([]);
        return;
      }
      setCartError(err.response?.data?.message || 'Failed to load cart');
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // When user logs in, fetch cart; when user logs out, clear cart
  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartError('');
    }
  }, [token, fetchCart]);

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    setCartError('');
    try {
      const res = await axios.post('/api/cart', { productId, quantity });
      const list = res.data?.data ?? res.data;
      setCartItems(Array.isArray(list) ? list : []);
      return { success: true, message: res.data?.message || 'Added to cart' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart';
      setCartError(msg);
      return { success: false, message: msg };
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    setCartError('');
    try {
      const res = await axios.delete(`/api/cart/${productId}`);
      const list = res.data?.data ?? res.data;
      setCartItems(Array.isArray(list) ? list : []);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove from cart';
      setCartError(msg);
      return { success: false, message: msg };
    }
  };

  // Update quantity for one item
  const updateQuantity = async (productId, quantity) => {
    setCartError('');
    try {
      const res = await axios.put(`/api/cart/${productId}`, { quantity });
      const list = res.data?.data ?? res.data;
      setCartItems(Array.isArray(list) ? list : []);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update quantity';
      setCartError(msg);
      return { success: false, message: msg };
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setCartError('');
    try {
      await axios.delete('/api/cart');
      setCartItems([]);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to clear cart';
      setCartError(msg);
      return { success: false, message: msg };
    }
  };

  // Total number of items (sum of quantities)
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Total price (if product has price)
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price ?? 0;
    const qty = item.quantity || 0;
    return sum + price * qty;
  }, 0);

  const value = {
    cartItems,
    cartLoading,
    cartError,
    cartCount,
    cartTotal,
    fetchCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
