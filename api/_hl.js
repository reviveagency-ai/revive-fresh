// api/_hl.js
async function getAccessToken() {
  const missing = ['HL_CLIENT_ID','HL_CLIENT_SECRET','HL_REFRESH_TOKEN'].filter(k => !process.env[k]);
  if (missing.length) throw new Error('Missing env vars: ' + missing.join(', '));

  const form = new URLSearchParams();
  form.set('client_id', process.env.HL_CLIENT_ID);
  form.set('client_secret', process.env.HL_CLIENT_SECRET);
  form.set('grant_type', 'refresh_token');
  form.set('refresh_token', process.env.HL_REFRESH_TOKEN);

  const r = await fetch('https://services.leadconnectorhq.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: form
  });
  const data = await r.json();

  if (!r.ok || !data.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(data));
  // If API returns a new refresh_token, rotate yours in storage later.
  return data.access_token;
}

module.exports = { getAccessToken };
