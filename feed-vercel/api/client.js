const { latestManifest, readBlob } = require('../lib/storage');
const { clientData } = require('../lib/csv');

module.exports = async function handler(req, res) {
  const token = String(req.query.token || '');
  if (!token || token.length < 20) return res.status(404).json({ error: 'الرابط غير صالح.' });
  try {
    const manifest = await latestManifest();
    const client = manifest.clients.find((item) => item.token === token);
    if (!client) return res.status(404).json({ error: 'الرابط غير صالح أو تم إيقافه.' });
    const csvText = await readBlob(client.pathname);
    const data = clientData(csvText, client.name);
    return res.status(200).setHeader('Cache-Control', 'private, no-store').json({ ...data, updatedAt: manifest.updatedAt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'تعذر تحميل كشف الحساب.' });
  }
};
