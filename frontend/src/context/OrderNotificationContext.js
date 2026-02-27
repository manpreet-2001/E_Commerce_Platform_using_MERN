import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'ordersLastViewedAt';

const OrderNotificationContext = createContext(null);

export const OrderNotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [lastViewedAt, setLastViewedAt] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const isCustomer = !!token && !!user && user.role === 'customer';

  useEffect(() => {
    if (!isCustomer) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/api/orders');
        if (!cancelled && res.data?.data) setOrders(Array.isArray(res.data.data) ? res.data.data : []);
      } catch {
        if (!cancelled) setOrders([]);
      }
    };
    fetchOrders();
    return () => { cancelled = true; };
  }, [isCustomer]);

  const setOrdersViewed = useCallback((ordersList) => {
    if (!Array.isArray(ordersList) || ordersList.length === 0) return;
    const maxUpdated = Math.max(
      ...ordersList.map((o) => new Date(o.updatedAt || o.createdAt || 0).getTime())
    );
    setLastViewedAt(maxUpdated);
    try {
      localStorage.setItem(STORAGE_KEY, String(maxUpdated));
    } catch (e) {
      // ignore
    }
  }, []);

  const hasUnseenOrderUpdates = useMemo(() => {
    if (orders.length === 0) return false;
    if (lastViewedAt <= 0) return true;
    return orders.some(
      (o) => new Date(o.updatedAt || o.createdAt).getTime() > lastViewedAt
    );
  }, [orders, lastViewedAt]);

  const value = {
    hasUnseenOrderUpdates,
    setOrdersViewed
  };

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
};

export const useOrderNotification = () => {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error('useOrderNotification must be used within OrderNotificationProvider');
  }
  return context;
};

export default OrderNotificationContext;
