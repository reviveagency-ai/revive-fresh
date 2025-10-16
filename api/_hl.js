// api/_hl.js
let cached = { token: null, exp: 0 };

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && now < cached.exp - 60) return cached.token; // reuse until ~1min from expiry

  const miss = ['HL_CLIENT_ID','HL_CLIENT_SECRET','HL_REFRESH_TOKEN'].filter(k => !process.env[k]);
  if (miss.length) throw new Error('Missing env vars: ' + miss.join(', '));

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

  // If the API rotated the refresh token, log it once so you can update Vercel env.
  if (data.refresh_token) {
    console.log('ROTATE_REFRESH_TOKEN:', data.refresh_token); // copy this to HL_REFRESH_TOKEN after this run
  }

  cached.token = data.access_token;
  cached.exp = now + (data.expires_in || 3600);
  return cached.token;
}

module.exports = { getAccessToken };
