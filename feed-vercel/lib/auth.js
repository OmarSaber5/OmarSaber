const crypto = require('crypto');

const COOKIE_NAME = 'deif_admin';

function secret() {
  if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is not configured.');
  return process.env.ADMIN_PASSWORD;
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function adminCookie() {
  const value = `${Date.now()}.${crypto.randomBytes(18).toString('base64url')}`;
  return `${value}.${sign(value)}`;
}

function isAdmin(req) {
  try {
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((item) => {
      const index = item.indexOf('=');
      return [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1))];
    }));
    const value = cookies[COOKIE_NAME];
    if (!value) return false;
    const lastDot = value.lastIndexOf('.');
    const payload = value.slice(0, lastDot);
    const signature = value.slice(lastDot + 1);
    const expected = sign(payload);
    return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  res.status(401).json({ error: 'غير مصرح بالدخول' });
  return false;
}

module.exports = { COOKIE_NAME, adminCookie, isAdmin, requireAdmin };
