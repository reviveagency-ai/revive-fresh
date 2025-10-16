export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('No code received');

    const body = new URLSearchParams({
      client_id: process.env.HL_CLIENT_ID,
      client_secret: process.env.HL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.HL_REDIRECT_URI,
    });

    // HighLevel token endpoints (try modern first, fallback to legacy)
    const endpoints = [
      'https://services.leadconnectorhq.com/oauth/token',
      'https://api.msgsndr.com/oauth/token'
    ];

    let tokenData = null, lastErr = null;
    for (const url of endpoints) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        const json = await r.json();
        if (r.ok && json.access_token) { tokenData = json; break; }
        lastErr = json;
      } catch (e) {
        lastErr = { error: e?.message || String(e) };
      }
    }

    if (!tokenData) {
      console.error('OAuth exchange failed:', lastErr);
      return res
        .status(500)
        .send('OAuth exchange failed. Check Vercel logs for details.');
    }

    // ⚠️ TEMP: log once for retrieval, then store securely (DB/Secrets).
    console.log('HL OAuth token payload:', tokenData);

    // Show a friendly message in the browser
    return res
      .status(200)
      .send('✅ Access token received! Check your Vercel logs and store the refresh_token securely.');
  } catch (err) {
    console.error('Callback error:', err);
    return res.status(500).send('Unexpected error during OAuth callback.');
  }
}
