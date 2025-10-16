export default async function handler(req, res) {
  try {
    const missing = ['HL_CLIENT_ID','HL_CLIENT_SECRET','HL_REFRESH_TOKEN'].filter(k => !process.env[k]);
    if (missing.length) return res.status(500).send(`Missing env vars: ${missing.join(', ')}`);

    const form = new URLSearchParams();
    form.set('client_id', process.env.HL_CLIENT_ID);
    form.set('client_secret', process.env.HL_CLIENT_SECRET);
    form.set('grant_type', 'refresh_token');
    form.set('refresh_token', process.env.HL_REFRESH_TOKEN);

    const r = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept':'application/json' },
      body: form
    });

    const data = await r.json();
    if (!r.ok || !data.access_token) {
      console.error('Refresh failed:', { status: r.status, data });
      return res.status(500).json({ error: 'refresh_failed', details: data });
    }

    // TODO: persist new refresh_token if provided (rotate)
    // For now, just return access_token so you can test calls.
    return res.status(200).json({ access_token: data.access_token, expires_in: data.expires_in, scope: data.scope });
  } catch (e) {
    console.error('Refresh exception:', e);
    return res.status(500).json({ error: 'exception', message: String(e) });
  }
}
