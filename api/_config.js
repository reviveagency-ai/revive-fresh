// api/_config.js
function parseLocationEnv() {
  const raw = process.env.LOCATION_IDS || process.env.RYZE_LOCATION_IDS || "";
  const parts = raw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
  const byAlias = {};
  const ids = [];
  for (const p of parts) {
    const m = p.match(/^([^:]+):(.+)$/);
    if (m) {
      const alias = m[1].trim();
      const id = m[2].trim();
      byAlias[alias.toLowerCase()] = id;
      ids.push(id);
    } else {
      ids.push(p);
    }
  }
  return { ids, byAlias };
}

function getAuth() {
  const token = process.env.HL_API_TOKEN || process.env.GHL_API_KEY || process.env.HL_API_KEY;
  if (!token) {
    return { ok: false, error: "Missing HL_API_TOKEN or GHL_API_KEY" };
  }
  const isJWT = /^eyJ/.test(token);
  const host = isJWT ? "https://services.leadconnectorhq.com" : "https://rest.gohighlevel.com";
  return { ok: true, token, isJWT, host };
}

function getLocationIdFromReq(req) {
  const q = req.query || {};
  const { ids, byAlias } = parseLocationEnv();
  const locQ = (q.locationId || q.loc || "").toString().trim();
  if (locQ) {
    const lower = locQ.toLowerCase();
    if (byAlias[lower]) return byAlias[lower];
    return locQ;
  }
  if (process.env.DEFAULT_LOCATION_ID) return process.env.DEFAULT_LOCATION_ID;
  if (ids.length > 0) return ids[0];
  return null;
}

function redactedToken(t) {
  if (!t) return null;
  if (t.length <= 10) return "***";
  return `${t.slice(0, 5)}…${t.slice(-3)}`;
}

module.exports = { getAuth, getLocationIdFromReq, parseLocationEnv, redactedToken };
