import React, { useMemo } from 'react';
import './OrderHistoryModal.css';

const STATUS_TIMELINE_LABELS = {
  pending: 'Order received',
  confirmed: 'Order confirmed',
  shipped: 'Order shipped',
  delivered: 'Order delivered',
  cancelled: 'Cancelled',
};

const formatOrderDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
};

/**
 * Modal that shows order status history as a vertical timeline (newest first).
 * @param {{ order: { _id: string, status?: string, statusHistory?: Array<{ status: string, changedAt?: string, changedBy?: { name?: string, email?: string } }>, updatedAt?: string, createdAt?: string }, onClose: () => void }} props
 */
const OrderHistoryModal = ({ order, onClose }) => {
  const history = useMemo(() => {
    if (!order) return [];
    const raw = (order.statusHistory || []).length > 0
      ? [...(order.statusHistory || [])]
      : [{ status: order.status || 'pending', changedAt: order.updatedAt || order.createdAt }];
    return raw.sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0));
  }, [order]);

  const orderShortId = order?._id ? `#${order._id.slice(-6).toUpperCase()}` : '';

  const getStatusLabel = (entry, isFirst) => {
    const label = STATUS_TIMELINE_LABELS[entry.status] || entry.status;
    return isFirst && entry.status === 'pending' ? label : `Status changed to ${label}`;
  };

  if (!order) return null;

  return (
    <div
      className="order-history-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-history-modal-title"
    >
      <div
        className="order-history-modal"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="order-history-modal-header">
          <h2 id="order-history-modal-title" className="order-history-modal-title">
            Order History
          </h2>
          <p className="order-history-modal-subtitle">Order {orderShortId}</p>
          <button
            type="button"
            className="order-history-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="order-history-modal-body">
          <ul className="order-history-timeline" aria-label="Order status timeline">
            {history.map((entry, idx) => {
              const isFirst = idx === history.length - 1;
              const label = getStatusLabel(entry, isFirst);
              return (
                <li key={idx} className="order-history-timeline-item">
                  <span className="order-history-timeline-dot" aria-hidden />
                  <div className="order-history-timeline-content">
                    <div className="order-history-timeline-date">
                      {formatOrderDateTime(entry.changedAt)}
                    </div>
                    <div className="order-history-timeline-status-row">
                      <span className={`order-history-pill order-history-pill-${entry.status}`}>
                        {label}
                      </span>
                    </div>
                    <div className="order-history-timeline-note">
                      {entry.changedBy && (entry.changedBy.name || entry.changedBy.email)
                        ? `Updated by ${entry.changedBy.name || entry.changedBy.email}`
                        : 'No note added'}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryModal;
