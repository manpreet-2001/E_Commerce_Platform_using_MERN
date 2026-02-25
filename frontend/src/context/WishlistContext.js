import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { token } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setWishlistLoading(true);
    try {
      const res = await axios.get('/api/wishlist');
      const list = res.data?.data ?? [];
      const ids = res.data?.productIds ?? list.map((p) => (p._id || p).toString());
      setWishlistItems(Array.isArray(list) ? list : []);
      setWishlistProductIds(Array.isArray(ids) ? ids : []);
    } catch (err) {
      if (err.response?.status === 401) {
        setWishlistItems([]);
        setWishlistProductIds([]);
        return;
      }
      setWishlistItems([]);
      setWishlistProductIds([]);
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setWishlistProductIds([]);
    }
  }, [token, fetchWishlist]);

  const isInWishlist = useCallback((productId) => {
    const id = productId?.toString?.() ?? productId;
    return wishlistProductIds.includes(id);
  }, [wishlistProductIds]);

  const addToWishlist = async (productId) => {
    try {
      const res = await axios.post('/api/wishlist', { productId });
      const ids = res.data?.productIds ?? [];
      setWishlistProductIds(ids);
      await fetchWishlist();
      return { success: true, message: res.data?.message || 'Added to wishlist' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to wishlist';
      return { success: false, message: msg };
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const res = await axios.delete(`/api/wishlist/${productId}`);
      const ids = res.data?.productIds ?? [];
      setWishlistProductIds(ids);
      setWishlistItems((prev) => prev.filter((p) => (p._id || p).toString() !== productId.toString()));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove from wishlist';
      return { success: false, message: msg };
    }
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return removeFromWishlist(productId);
    }
    return addToWishlist(productId);
  };

  const value = {
    wishlistItems,
    wishlistProductIds,
    wishlistLoading,
    wishlistCount: wishlistItems.length,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
