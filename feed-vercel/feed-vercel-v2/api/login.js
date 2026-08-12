const { COOKIE_NAME, adminCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const password = req.body?.password;
  if (!process.env.ADMIN_PASSWORD || typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
  }
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(adminCookie())}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
  return res.status(200).json({ ok: true });
};
