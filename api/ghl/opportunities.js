// api/ghl/opportunities.js
const { getAuth, getLocationIdFromReq } = require("../_config");

function buildOppsUrl(host, isJWT, locationId, q) {
  const params = new URLSearchParams();
  if (!isJWT) params.set("locationId", locationId); // API-key mode only
  if (q.pipelineId) params.set("pipelineId", q.pipelineId);
  if (q.limit) params.set("limit", q.limit);
  if (q.startAfterId) params.set("startAfterId", q.startAfterId);
  return `${host}/v1/opportunities/?${params.toString()}`;
}

async function fetchOpps(url, token, isJWT, locationId) {
  const base = { Accept: "application/json", Version: "2021-07-28" };

  if (isJWT) {
    return fetch(url, {
      headers: {
        ...base,
        Authorization: `Bearer ${token}`,
        "Location-Id": locationId,
        "LocationId": locationId
      }
    });
  }

  let r = await fetch(url, { headers: { ...base, Authorization: `Bearer ${token}` } });
  if (r.status === 401) {
    r = await fetch(url, { headers: { ...base, "X-API-KEY": token } });
  }
  return r;
}

module.exports = async (req, res) => {
  try {
    const auth = getAuth();
    if (!auth.ok) return res.status(500).json({ ok: false, error: auth.error });

    const locationId = getLocationIdFromReq(req);
    if (!locationId) return res.status(400).json({ ok: false, error: "Missing locationId." });

    const url = buildOppsUrl(auth.host, auth.isJWT, locationId, req.query || {});
    const r = await fetchOpps(url, auth.token, auth.isJWT, locationId);

    let body;
    try { body = await r.json(); }
    catch { body = { raw: await r.text().catch(() => "<no-body>") }; }

    return res.status(r.ok ? 200 : r.status).json({ ok: r.ok, status: r.status, data: body });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Unhandled server error", detail: String(e) });
  }
};

