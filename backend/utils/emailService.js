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

/**
 * Notify admin (or REGISTRATION_NOTIFY_EMAIL) when a new user registers.
 * @param {Object} user - User doc with name, email, role
 */
function sendNewUserNotifyEmail(user) {
  if (!isConfigured || !REGISTRATION_NOTIFY_EMAIL) return;
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
  sendEmail(REGISTRATION_NOTIFY_EMAIL, subject, html).catch((err) => console.error('New user notify email error:', err));
}

module.exports = {
  isConfigured,
  sendEmail,
  sendOrderStatusEmail,
  sendNewUserNotifyEmail,
};
