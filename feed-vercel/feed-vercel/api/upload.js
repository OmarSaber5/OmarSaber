const fs = require('fs/promises');
const crypto = require('crypto');
const formidable = require('formidable');
const { requireAdmin } = require('../lib/auth');
const { put, latestManifest, saveManifest, deletePaths } = require('../lib/storage');
const { extractClientName } = require('../lib/csv');

function parseForm(req) {
  const form = formidable({ multiples: true, maxFiles: 150, maxFileSize: 5 * 1024 * 1024, filter: ({ originalFilename }) => originalFilename?.toLowerCase().endsWith('.csv') });
  return new Promise((resolve, reject) => form.parse(req, (error, fields, files) => error ? reject(error) : resolve({ fields, files })));
}

function asArray(value) { return Array.isArray(value) ? value : value ? [value] : []; }
function safeName(value) { return String(value).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 80) || 'client'; }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const { files } = await parseForm(req);
    const all = asArray(files.files);
    const master = all.find((file) => file.originalFilename.toLowerCase() === 'master.csv');
    const clients = all.filter((file) => file !== master);
    if (!master || !clients.length) return res.status(400).json({ error: 'اختر master.csv وملف عميل واحد على الأقل.' });

    const previous = await latestManifest();
    const masterBuffer = await fs.readFile(master.filepath);
    const masterBlob = await put(`data/master/${Date.now()}-master.csv`, masterBuffer, { access: 'private', contentType: 'text/csv; charset=utf-8', addRandomSuffix: true, cacheControlMaxAge: 0 });
    const uploadedClients = [];

    for (const file of clients) {
      const buffer = await fs.readFile(file.filepath);
      const fileId = safeName(file.originalFilename.replace(/\.csv$/i, ''));
      const name = extractClientName(buffer.toString('utf8'), fileId);
      const blob = await put(`data/clients/${fileId}-${Date.now()}.csv`, buffer, { access: 'private', contentType: 'text/csv; charset=utf-8', addRandomSuffix: true, cacheControlMaxAge: 0 });
      const oldClient = previous.clients.find((client) => client.id === fileId);
      uploadedClients.push({ id: fileId, name, token: oldClient?.token || crypto.randomBytes(24).toString('base64url'), pathname: blob.pathname });
    }

    const manifest = { master: { pathname: masterBlob.pathname }, clients: uploadedClients, updatedAt: new Date().toISOString() };
    await saveManifest(manifest);
    await deletePaths([previous.master?.pathname, ...previous.clients.map((client) => client.pathname)]);
    return res.status(200).json({ ok: true, uploaded: uploadedClients.length, updatedAt: manifest.updatedAt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'فشل الرفع. تأكد أن كل الملفات CSV أصغر من 5 ميجابايت.' });
  }
};

module.exports.config = { api: { bodyParser: false } };
