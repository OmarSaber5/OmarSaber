const { COOKIE_NAME } = require('../lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
  res.status(200).json({ ok: true });
};
