const { getAccessToken } = require('./_hl');

module.exports = async (req, res) => {
  try {
    const token = await getAccessToken();

    const r = await fetch('https://services.leadconnectorhq.com/snapshots/', {
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
    console.error('snapshots error:', e);
    return res.status(500).json({ error: 'snapshots_failed', message: String(e) });
  }
};
