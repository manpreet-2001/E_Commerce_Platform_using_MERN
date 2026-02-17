/**
 * Statistics calculation for vendor dashboard.
 * Computes totals and chart data from products and vendor orders.
 *
 * @param {Array} products - List of vendor's products
 * @param {Array} orders - List of orders containing vendor's products (each with vendorSubtotal, status, createdAt)
 * @returns {Object} vendorStats
 */
export function computeVendorStats(products, orders) {
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const orderList = Array.isArray(orders) ? orders : [];

  const totalOrders = orderList.length;
  const totalRevenue = orderList.reduce((sum, o) => sum + (o.vendorSubtotal || 0), 0);
  const pendingOrders = orderList.filter((o) => o.status === 'pending').length;

  const statusCounts = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
  orderList.forEach((o) => {
    if (Object.prototype.hasOwnProperty.call(statusCounts, o.status)) {
      statusCounts[o.status] += 1;
    }
  });

  const ordersByStatusData = [
    { name: 'Pending', value: statusCounts.pending, fill: '#f59e0b' },
    { name: 'Confirmed', value: statusCounts.confirmed, fill: '#3b82f6' },
    { name: 'Shipped', value: statusCounts.shipped, fill: '#8b5cf6' },
    { name: 'Delivered', value: statusCounts.delivered, fill: '#10b981' },
    { name: 'Cancelled', value: statusCounts.cancelled, fill: '#ef4444' },
  ].filter((d) => d.value > 0);

  const now = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const ordersByDay = last30Days.map((date) => {
    const dateStr = date.toISOString().slice(0, 10);
    const count = orderList.filter((o) => {
      const od = new Date(o.createdAt || 0);
      return od.toISOString().slice(0, 10) === dateStr;
    }).length;
    const revenue = orderList
      .filter((o) => {
        const od = new Date(o.createdAt || 0);
        return od.toISOString().slice(0, 10) === dateStr;
      })
      .reduce((s, o) => s + (o.vendorSubtotal || 0), 0);
    return {
      date: dateStr,
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      orders: count,
      revenue,
    };
  });

  return {
    totalProducts,
    totalOrders,
    totalRevenue,
    pendingOrders,
    ordersByStatusData,
    ordersByDay,
  };
}
