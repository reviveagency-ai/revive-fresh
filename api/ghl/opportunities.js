// api/ghl/opportunities.js
const { getAuth, getLocationIdFromReq } = require("../_config");

function buildUrl(host, isJWT, locationId, q) {
  const params = new URLSearchParams();
  if (!isJWT) params.set("locationId", locationId); // REST needs it in query
  if (q.pipelineId) params.set("pipelineId", q.pipelineId);
  if (q.limit) params.set("limit", q.limit);
  if (q.startAfterId) params.set("startAfterId", q.startAfterId);

  // JWT base (no /v1) vs REST base (/v1)
  const base = isJWT ? `${host}/opportunities/` : `${host}/v1/opportunities/`;
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

module.exports = async (req, res) => {
  try {
    const auth = getAuth();
    if (!auth.ok) return res.status(500).json({ ok: false, error: auth.error });

    const locationId = getLocationIdFromReq(req);
    if (!locationId) return res.status(400).json({ ok: false, error: "Missing locationId." });

    const url = buildUrl(auth.host, auth.isJWT, locationId, req.query || {});
    const headers = { Accept: "application/json", Version: "2021-07-28" };

    if (auth.isJWT) {
      headers.Authorization = `Bearer ${auth.token}`;
      headers["Location-Id"] = locationId;
      headers["LocationId"]   = locationId;
    } else {
      headers.Authorization = `Bearer ${auth.token}`;
    }

    let r = await fetch(url, { headers });
    if (!auth.isJWT && r.status === 401) {
      r = await fetch(url, { headers: { ...headers, Authorization: undefined, "X-API-KEY": auth.token } });
    }

    let body;
    try { body = await r.json(); } catch { body = { raw: await r.text().catch(() => "<no-body>") }; }
    return res.status(r.ok ? 200 : r.status).json({ ok: r.ok, status: r.status, data: body });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Unhandled server error", detail: String(e) });
  }
};

