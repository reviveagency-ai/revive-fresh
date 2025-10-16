module.exports = async (req, res) => {
  try {
    // Basic env sanity (don’t print secrets)
    const envInfo = {
      vercelEnv: process.env.VERCEL_ENV,     // "production" / "preview" / "development"
      hasClientId: !!process.env.HL_CLIENT_ID,
      hasClientSecret: !!process.env.HL_CLIENT_SECRET,
      rtLen: (process.env.HL_REFRESH_TOKEN || '').length,
      rtHead: (process.env.HL_REFRESH_TOKEN || '').slice(0, 12),
      rtTail: (process.env.HL_REFRESH_TOKEN || '').slice(-12),
    };

    // If you POST {"rt":"..."} we'll test that value directly (no env vars involved)
    if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
      const rt = body.rt;

      if (!rt) return res.status(400).json({ error: 'missing_rt_in_body' });

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

      const data = await r.json().catch(() => ({}));
      // mask tokens if present
      if (data.access_token) data.access_token = data.access_token.slice(0,20) + '…' + data.access_token.slice(-12);
      if (data.refresh_token) data.refresh_token = data.refresh_token.slice(0,20) + '…' + data.refresh_token.slice(-12);

      return res.status(r.ok ? 200 : r.status).json({ ok: r.ok, status: r.status, data });
    }

    // GET -> just show env snapshot (masked)
    return res.status(200).json(envInfo);
  } catch (e) {
    console.error('diag error:', e);
    return res.status(500).json({ error: 'diag_failed', message: String(e) });
  }
};
