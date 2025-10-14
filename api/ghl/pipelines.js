// api/ghl/pipelines.js
const { getAuth, getLocationIdFromReq } = require("../_config");

async function fetchPipelines(host, token, isJWT, locationId) {
  const url = isJWT
    ? `${host}/v1/pipelines/`                 // JWT mode: header selects location
    : `${host}/v1/pipelines/?locationId=${encodeURIComponent(locationId)}`; // API-key mode

  // Base headers
  const base = { Accept: "application/json", Version: "2021-07-28" };

  if (isJWT) {
    // Agency OAuth JWT + Location-Id header
    return fetch(url, {
      headers: {
        ...base,
        Authorization: `Bearer ${token}`,
        "Location-Id": locationId,
        // Some tenants require this alternate casing; harmless to include both:
        "LocationId": locationId
      }
    });
  }

  // Location API key mode
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
    if (!locationId) {
      return res.status(400).json({ ok: false, error: "Missing locationId. Use ?loc=<alias> or set DEFAULT_LOCATION_ID." });
    }

    const r = await fetchPipelines(auth.host, auth.token, auth.isJWT, locationId);

    let body;
    try { body = await r.json(); }
    catch { body = { raw: await r.text().catch(() => "<no-body>") }; }

    return res.status(r.ok ? 200 : r.status).json({ ok: r.ok, status: r.status, data: body });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Unhandled server error", detail: String(e) });
  }
};

