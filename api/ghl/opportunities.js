// api/ghl/opportunities.js
const { getAuth, getLocationIdFromReq } = require("../_config");

async function call(url, token, isJWT, locationId) {
  if (isJWT) {
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Location-Id": locationId,
        Version: "2021-07-28",
        Accept: "application/json"
      }
    });
  }
  let r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", Accept: "application/json" }
  });
  if (r.status === 401) {
    r = await fetch(url, {
      headers: { "X-API-KEY": token, Version: "2021-07-28", Accept: "application/json" }
    });
  }
  return r;
}

module.exports = async (req, res) => {
  try {
    const auth = getAuth();
    if (!auth.ok) return res.status(500).json({ ok: false, error: auth.error });

    const locationId = getLocationIdFromReq(req);
    if (!locationId) return res.status(400).json({ ok: false, error: "Missing locationId." });

    const params = new URLSearchParams({ locationId });
    if (req.query.pipelineId) params.set("pipelineId", req.query.pipelineId);
    if (req.query.limit) params.set("limit", req.query.limit);
    if (req.query.startAfterId) params.set("startAfterId", req.query.startAfterId);

    const url = `${auth.host}/v1/opportunities/?${params.toString()}`;
    const r = await call(url, auth.token, auth.isJWT, locationId);

    let data; try { data = await r.json(); } catch { data = { raw: await r.text().catch(()=>"<no-body>") }; }
    return res.status(r.ok ? 200 : r.status).json({ ok: r.ok, status: r.status, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Unhandled server error", detail: String(e) });
  }
};
