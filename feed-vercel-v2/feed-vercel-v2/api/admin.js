const { requireAdmin } = require('../lib/auth');
const { latestManifest, readBlob } = require('../lib/storage');
const { dashboardData } = require('../lib/csv');

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    const manifest = await latestManifest();
    if (!manifest.master) return res.status(200).json({ configured: false, clients: [] });
    const masterCsv = await readBlob(manifest.master.pathname);
    const dashboard = dashboardData(masterCsv);
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const clients = manifest.clients.map((client) => ({ ...client, url: `${baseUrl}/client?token=${client.token}` }));
    return res.status(200).json({ configured: true, updatedAt: manifest.updatedAt, clients, dashboard });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'تعذر تحميل البيانات.' });
  }
};
