/**
 * Central route path constants.
 * Use these for <Link to={ROUTES.PRODUCTS}>, navigate(ROUTES.LOGIN), and Route path={ROUTES.HOME}.
 * Keeps routing consistent and easy to change in one place.
 */

export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id) => `/products/${id}`,
  ABOUT: '/about',
  CONTACT: '/contact',
  SHIPPING: '/shipping',
  RETURNS: '/returns',
  FAQ: '/faq',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: (id) => `/orders/${id}`,
  WISHLIST: '/wishlist',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VENDOR_DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin',
  NOT_FOUND: '*',
};

/** Path string for React Router Route (param routes use :id) */
export const ROUTE_PATHS = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  NOT_FOUND: '*',
};
