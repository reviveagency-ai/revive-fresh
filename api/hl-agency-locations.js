const { getAccessToken } = require('./_hl');

module.exports = async (req, res) => {
  try {
    const token = await getAccessToken();

    // Use your agency companyId from the payload you pasted earlier:
    const companyId = 'J8dN2wQIVAe9kXvIW4eF';

    const url = new URL('https://services.leadconnectorhq.com/locations/');
    url.searchParams.set('companyId', companyId);
    url.searchParams.set('limit', '50');

    const r = await fetch(url.toString(), {
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
    console.error('locations error:', e);
    return res.status(500).json({ error: 'locations_failed', message: String(e) });
  }
};
