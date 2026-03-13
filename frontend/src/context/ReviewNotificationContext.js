import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'reviewsLastViewedAt';

const ReviewNotificationContext = createContext(null);

export const ReviewNotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [lastViewedAt, setLastViewedAt] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const role = user?.role;
  const isVendor = !!token && role === 'vendor';
  const isAdmin = !!token && role === 'admin';

  const fetch = useCallback(async () => {
    if (!isVendor && !isAdmin) {
      setReviews([]);
      return;
    }
    try {
      const url = isAdmin ? '/api/reviews/admin' : '/api/reviews/vendor/mine';
      const res = await axios.get(url);
      const list = res.data?.data ?? [];
      setReviews(Array.isArray(list) ? list : []);
    } catch {
      setReviews([]);
    }
  }, [isVendor, isAdmin]);

  useEffect(() => {
    if (!isVendor && !isAdmin) {
      setReviews([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await fetch();
    };
    run();
    const interval = setInterval(run, 60000);
    const onFocus = () => run();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [isVendor, isAdmin, fetch]);

  const markReviewsViewed = useCallback(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) return;
    const maxCreated = Math.max(...reviews.map((r) => new Date(r.createdAt || 0).getTime()));
    setLastViewedAt(maxCreated);
    try {
      localStorage.setItem(STORAGE_KEY, String(maxCreated));
    } catch {
      // ignore
    }
  }, [reviews]);

  // On first load when no "last viewed" is set, treat all current reviews as already seen (no popup for old data)
  const hasSetReviewsBaseline = React.useRef(false);
  useEffect(() => {
    if (!Array.isArray(reviews) || reviews.length === 0 || lastViewedAt > 0) return;
    if (!hasSetReviewsBaseline.current) {
      hasSetReviewsBaseline.current = true;
      const maxCreated = Math.max(...reviews.map((r) => new Date(r.createdAt || 0).getTime()));
      setLastViewedAt(maxCreated);
      try {
        localStorage.setItem(STORAGE_KEY, String(maxCreated));
      } catch {
        // ignore
      }
    }
  }, [reviews, lastViewedAt]);

  const unseenReviewCount = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    if (lastViewedAt <= 0) return reviews.length;
    return reviews.filter((r) => new Date(r.createdAt || 0).getTime() > lastViewedAt).length;
  }, [reviews, lastViewedAt]);

  const hasUnseenReviewUpdates = unseenReviewCount > 0;

  const value = {
    hasUnseenReviewUpdates,
    unseenReviewCount,
    markReviewsViewed,
    refreshReviews: fetch,
  };

  return (
    <ReviewNotificationContext.Provider value={value}>
      {children}
    </ReviewNotificationContext.Provider>
  );
};

export const useReviewNotification = () => {
  const context = useContext(ReviewNotificationContext);
  if (!context) {
    throw new Error('useReviewNotification must be used within ReviewNotificationProvider');
  }
  return context;
};

export default ReviewNotificationContext;

