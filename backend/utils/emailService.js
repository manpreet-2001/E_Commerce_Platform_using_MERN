const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || 'noreply@citytech.com';
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.REACT_APP_API_BASE || '';
const REGISTRATION_NOTIFY_EMAIL = process.env.REGISTRATION_NOTIFY_EMAIL || MAIL_FROM;

const isConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

if (!isConfigured) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Email: SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send emails).');
  } else {
    console.log('📧 Email: SMTP not configured on host. Add SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally MAIL_FROM, FRONTEND_URL, REGISTRATION_NOTIFY_EMAIL) in your host environment.');
  }
} else if (process.env.NODE_ENV === 'production') {
  console.log('📧 Email: SMTP configured (emails will be sent).');
}

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/**
 * Send a single email. No-op if SMTP is not configured.
 */
async function sendEmail(to, subject, html) {
  if (!transporter || !to) return;
  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send failed:', err.message || err);
    if (process.env.NODE_ENV === 'production') {
      console.error('Email error code:', err.code);
    }
  }
}

/**
 * Send order status change notification to the customer.
 * @param {Object} order - Order doc with user populated (name, email)
 * @param {string} newStatus - New status (e.g. 'shipped', 'cancelled')
 */
function sendOrderStatusEmail(order, newStatus) {
  if (!isConfigured) return;
  const user = order.user;
  const email = user?.email;
  if (!email) return;

  const orderId = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
  const label = STATUS_LABELS[newStatus] || newStatus;
  const customerName = user?.name || 'Customer';
  const orderLink = FRONTEND_URL ? `${FRONTEND_URL.replace(/\/$/, '')}/orders/${order._id}` : '';

  const subject = `Order #${orderId} – ${label}`;
  const html = `
    <p>Hi ${customerName},</p>
    <p>Your order <strong>#${orderId}</strong> status has been updated to <strong>${label}</strong>.</p>
    ${orderLink ? `<p><a href="${orderLink}">View order</a></p>` : ''}
    <p>Thanks,<br/>CityTech</p>
  `;

  sendEmail(email, subject, html).catch((err) => console.error('Order status email error:', err));
}

const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

/**
 * Send order confirmation email to the customer when an order is placed. Includes product details.
 * @param {Object} order - Order doc with user populated (name, email), items with product populated (name, price), shippingAddress, totalAmount, paymentMethod
 */
function sendOrderPlacedEmail(order) {
  if (!isConfigured) return;
  const user = order.user;
  const to = user?.email;
  if (!to) return;

  const orderId = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
  const customerName = user?.name || 'Customer';
  const orderLink = FRONTEND_URL ? `${FRONTEND_URL.replace(/\/$/, '')}/orders/${order._id}` : '';

  const items = order.items || [];
  const rows = items.map((item) => {
    const name = item.product?.name || 'Product';
    const qty = item.quantity || 1;
    const price = item.price || 0;
    const lineTotal = price * qty;
    return `<tr><td>${name}</td><td>${qty}</td><td>${formatCurrency(price)}</td><td>${formatCurrency(lineTotal)}</td></tr>`;
  }).join('');

  const addr = order.shippingAddress || {};
  const addressLines = [addr.fullName, addr.address, [addr.city, addr.state, addr.zip].filter(Boolean).join(', '), addr.country].filter(Boolean).join('<br/>') || '—';
  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card';

  const subject = `Order #${orderId} confirmed – CityTech`;
  const html = `
    <p>Hi ${customerName},</p>
    <p>Your order <strong>#${orderId}</strong> has been placed successfully.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 480px; margin: 16px 0;">
      <thead><tr style="background: #f1f5f9;"><th style="text-align: left; padding: 8px; border: 1px solid #e2e8f0;">Product</th><th style="text-align: center; padding: 8px; border: 1px solid #e2e8f0;">Qty</th><th style="text-align: right; padding: 8px; border: 1px solid #e2e8f0;">Price</th><th style="text-align: right; padding: 8px; border: 1px solid #e2e8f0;">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p><strong>Order total: ${formatCurrency(order.totalAmount)}</strong></p>
    <p><strong>Payment:</strong> ${paymentLabel}</p>
    <p><strong>Shipping address:</strong><br/>${addressLines}</p>
    ${orderLink ? `<p><a href="${orderLink}">View order</a></p>` : ''}
    <p>Thanks,<br/>CityTech</p>
  `;

  sendEmail(to, subject, html).catch((err) => console.error('Order placed email error:', err.message || err));
}

/**
 * Notify admin (or REGISTRATION_NOTIFY_EMAIL) when a new user registers.
 * @param {Object} user - User doc with name, email, role
 */
function sendNewUserNotifyEmail(user) {
  if (!isConfigured) {
    if (process.env.NODE_ENV !== 'production') console.log('📧 Registration email skipped: SMTP not configured.');
    return;
  }
  if (!REGISTRATION_NOTIFY_EMAIL) {
    if (process.env.NODE_ENV !== 'production') console.log('📧 Registration email skipped: REGISTRATION_NOTIFY_EMAIL not set.');
    return;
  }
  const name = user?.name || '—';
  const email = user?.email || '—';
  const role = user?.role || 'customer';
  const subject = `New user registered: ${email}`;
  const html = `
    <p>A new account was created.</p>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Role:</strong> ${role}</p>
    <p>—<br/>CityTech</p>
  `;
  if (process.env.NODE_ENV !== 'production') console.log('📧 Sending registration notification to', REGISTRATION_NOTIFY_EMAIL);
  sendEmail(REGISTRATION_NOTIFY_EMAIL, subject, html).catch((err) => console.error('New user notify email error:', err.message || err));
}

/**
 * Send a welcome email to the new user when they register.
 * @param {Object} user - User doc with name, email
 */
function sendWelcomeEmail(user) {
  if (!isConfigured) return;
  const to = user?.email;
  if (!to) return;
  const name = user?.name || 'there';
  const subject = 'Welcome to CityTech';
  const html = `
    <p>Hi ${name},</p>
    <p>Thanks for creating an account with CityTech. You can now sign in to shop, track orders, and more.</p>
    <p>—<br/>The CityTech Team</p>
  `;
  sendEmail(to, subject, html).catch((err) => console.error('Welcome email error:', err.message || err));
}

module.exports = {
  isConfigured,
  sendEmail,
  sendOrderStatusEmail,
  sendOrderPlacedEmail,
  sendNewUserNotifyEmail,
  sendWelcomeEmail,
};
