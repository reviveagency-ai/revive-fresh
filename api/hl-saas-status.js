const { getAccessToken } = require('./_hl');

module.exports = async (req, res) => {
  try {
    const token = await getAccessToken();
    const urlObj = new URL(req.url, 'http://localhost');
    const locationId = urlObj.searchParams.get('locationId');
    if (!locationId) return res.status(400).json({ error: 'missing_locationId' });

    const r = await fetch(`https://services.leadconnectorhq.com/saas/locations/${locationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        Accept: 'application/json'
      }
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.status(200).json(data);
  } catch (e) {
    console.error('saas status error:', e);
    return res.status(500).json({ error: 'saas_status_failed', message: String(e) });
  }
};
