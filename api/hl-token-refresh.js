export default async function handler(req, res) {
  try {
    const rt = req.query.rt || process.env.HL_REFRESH_TOKEN;
    const missing = ['HL_CLIENT_ID','HL_CLIENT_SECRET'].filter(k => !process.env[k]);
    if (missing.length) return res.status(500).send(`Missing env vars: ${missing.join(', ')}`);
    if (!rt) return res.status(400).send('Missing refresh token (provide ?rt= or set HL_REFRESH_TOKEN)');
    // ...
    const form = new URLSearchParams();
    form.set('client_id', process.env.HL_CLIENT_ID);
    form.set('client_secret', process.env.HL_CLIENT_SECRET);
    form.set('grant_type', 'refresh_token');
    form.set('refresh_token', rt);
    // (rest unchanged)
