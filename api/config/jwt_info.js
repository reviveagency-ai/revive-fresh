// api/config/jwt_info.js
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  return Buffer.from(str + '='.repeat(pad), 'base64').toString('utf8');
}

function parseJwt(jwt) {
  try {
    const parts = (jwt || '').split('.');
    if (parts.length < 2) return { error: 'Not a JWT' };
    const header = JSON.parse(b64urlDecode(parts[0]));
    const payload = JSON.parse(b64urlDecode(parts[1]));
    return { header, payload };
  } catch (e) {
    return { error: String(e) };
  }
}

module.exports = async (req, res) => {
  const token = process.env.HL_API_TOKEN || '';
  const parsed = parseJwt(token);
  const now = Math.floor(Date.now() / 1000);

  let expISO = null, iatISO = null, expIn = null;
  if (parsed.payload?.exp) {
    expISO = new Date(parsed.payload.exp * 1000).toISOString();
    expIn = parsed.payload.exp - now; // seconds
  }
  if (parsed.payload?.iat) iatISO = new Date(parsed.payload.iat * 1000).toISOString();

  res.status(200).json({
    ok: true,
    hasToken: Boolean(token),
    isLikelyJWT: token.startsWith('eyJ'),
    header: parsed.header || null,
    payload: parsed.payload || null,
    issued_at_iso: iatISO,
    expires_at_iso: expISO,
    expires_in_seconds: expIn,
    now_iso: new Date().toISOString(),
    note: "If expires_in_seconds <= 0, you need a fresh Agency OAuth ACCESS token (not refresh token)."
  });
};
