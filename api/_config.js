// api/_config.js
// Helper utilities for auth + location resolution across JWT (Agency OAuth) and API Key modes.

function parseLocationEnv() {
  // Accept LOCATION_IDS (preferred) or RYZE_LOCATION_IDS (legacy).
  // Format supports:
  //   - Plain IDs: "abc, def, ghi"
  //   - Aliases:   "Revive:abc, UPM:def"
  const raw = process.env.LOCATION_IDS || process.env.RYZE_LOCATION_IDS || "";
  const parts = raw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);

  const byAlias = {};   // alias (lowercase) -> id
  const ids = [];       // list of all ids (in order)

  for (const p of parts) {
    const m = p.match(/^([^:]+):(.+)$/);
    if (m) {
      const alias = m[1].trim().toLowerCase();
      const id = m[2].trim();
      byAlias[alias] = id;
      ids.push(id);
    } else {
      ids.push(p);
    }
  }
  return { ids, byAlias };
}

function getAuth() {
  // Prefer Agency OAuth JWT if present (handles ALL clients via Location-Id header).
  // Fall back to Location API Key (works only for the location that issued the key).
  const token = process.env.HL_API_TOKEN || process.env.GHL_API_KEY || process.env.HL_API_KEY;
  if (!token) return { ok: false, error: "Missing HL_API_TOKEN or GHL_API_KEY" };

  const isJWT = /^eyJ/.test(token); // JWTs start with eyJ...
  const host = isJWT
    ? "https://services.leadconnectorhq.com" // OAuth/JWT host
    : "https://rest.gohighlevel.com";        // API-key host

  return { ok: true, token, isJWT, host };
}

function getLocationIdFromReq(req) {
  // Priority:
  // 1) Explicit query (?locationId=<id> or ?loc=<alias>)
  // 2) DEFAULT_LOCATION_ID env
  // 3) First ID from LOCATION_IDS / RYZE_LOCATION_IDS
  const q = req.query || {};
  const { ids, byAlias } = parseLocationEnv();

  const locQ = (q.locationId || q.loc || "").toString().trim();
  if (locQ) {
    const lower = locQ.toLowerCase();
    if (byAlias[lower]) return byAlias[lower]; // alias match
    return locQ; // assume direct id
  }

  if (process.env.DEFAULT_LOCATION_ID) return process.env.DEFAULT_LOCATION_ID;
  if (ids.length > 0) return ids[0];

  return null;
}

function redactedToken(t) {
  if (!t) return null;
  return t.length <= 10 ? "***" : `${t.slice(0, 5)}…${t.slice(-3)}`;
}

module.exports = {
  getAuth,
  getLocationIdFromReq,
  parseLocationEnv,
  redactedToken
};
