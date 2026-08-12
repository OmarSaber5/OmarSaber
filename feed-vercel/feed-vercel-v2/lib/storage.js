const { put, get, list, del } = require('@vercel/blob');

const MANIFEST_PREFIX = 'metadata/manifests/';

async function readBlob(pathname) {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result) return null;
  return new Response(result.stream).text();
}

async function latestManifest() {
  const { blobs } = await list({ prefix: MANIFEST_PREFIX });
  if (!blobs.length) return { clients: [], master: null, updatedAt: null };
  const latest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  return JSON.parse(await readBlob(latest.pathname));
}

async function saveManifest(manifest) {
  await put(`${MANIFEST_PREFIX}${Date.now()}.json`, JSON.stringify(manifest), {
    access: 'private',
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: true,
    cacheControlMaxAge: 0
  });
}

async function deletePaths(paths) {
  if (paths.filter(Boolean).length) await del(paths.filter(Boolean));
}

module.exports = { put, readBlob, latestManifest, saveManifest, deletePaths };
