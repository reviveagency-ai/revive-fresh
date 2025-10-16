module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost'); // base just to parse query
    const rt = url.searchParams.get('rt') || process.env.HL_REFRESH_TOKEN;

    const missing = ['HL_CLIENT_ID', 'HL_CLIENT_SECRET'].filter(k => !process.env[k]);
    if (missing.length) return res.status(500).send(`Missing env vars: ${missing.join(', ')}`);
    if (!rt) return res.status(400).send('Missing refresh token (provide ?rt= or set HL_REFRESH_TOKEN)');

    const form = new URLSearchParams();
    form.set('client_id', process.env.HL_CLIENT_ID);
    form.set('client_secret', process.env.HL_CLIENT_SECRET);
    form.set('grant_type', 'refresh_token');
    form.set('refresh_token', rt);

    const r = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: form
    });

    const data = await r.json();
    if (!r.ok || !data.access_token) {
      console.error('Refresh failed:', { status: r.status, data });
      return res.status(500).json({ error: 'refresh_failed', details: data });
    }

    // If API returns a new refresh_token, rotate it in your storage later.
    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      scope: data.scope,
      // refresh_token: data.refresh_token // <- log/rotate if present
    });
  } catch (e) {
    console.error('Refresh exception:', e);
    return res.status(500).json({ error: 'exception', message: String(e) });
  }
};
