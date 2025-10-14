// api/ghl/pipelines.js
const { getAuth, getLocationIdFromReq } = require("../_config");

module.exports = async (req, res) => {
  try {
    const auth = getAuth();
    if (!auth.ok) return res.status(500).json({ ok: false, error: auth.error });

    const locationId = getLocationIdFromReq(req);
    if (!locationId) return res.status(400).json({ ok: false, error: "Missing locationId." });

    // Correct path for JWT (LeadConnector) vs API-key (REST)
    const url = auth.isJWT
      ? `${auth.host}/opportunities/pipelines`
      : `${auth.host}/v1/pipelines/?locationId=${encodeURIComponent(locationId)}`;

    // Base headers
    const headers = { Accept: "application/json", Version: "2021-07-28" };

    // JWT must send Location-Id header
    if (auth.isJWT) {
      headers.Authorization = `Bearer ${auth.token}`;
      headers["Location-Id"] = locationId;
      headers["LocationId"]   = locationId; // harmless duplicate; some tenants accept this
    } else {
      headers.Authorization = `Bearer ${auth.token}`;
    }

    let r = await fetch(url, { headers });
    if (!auth.isJWT && r.status === 401) {
      // Some keys require X-API-KEY
      r = await fetch(url, { headers: { ...headers, Authorization: undefined, "X-API-KEY": auth.token } });
    }

    let body;
    try { body = await r.json(); } catch { body = { raw: await r.text().catch(() => "<no-body>") }; }
    return res.status(r.ok ? 200 : r.status).json({ ok: r.ok, status: r.status, data: body });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Unhandled server error", detail: String(e) });
  }
};
