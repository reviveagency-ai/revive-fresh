// api/ghl/pipelines.js
const { getAuth, getLocationIdFromReq } = require("../_config");

module.exports = async (req, res) => {
  try {
    const auth = getAuth();
    if (!auth.ok) {
      console.error("AUTH_ERROR:", auth.error);
      return res.status(500).json({ ok: false, error: auth.error });
    }

    const locationId = getLocationIdFromReq(req);
    if (!locationId) {
      console.error("MISSING_LOCATION_ID");
      return res.status(400).json({
        ok: false,
        error: "Missing locationId. Use ?loc=<alias> or set DEFAULT_LOCATION_ID / LOCATION_IDS."
      });
    }

    const url = `${auth.host}/v1/pipelines/?locationId=${encodeURIComponent(locationId)}`;
    const headers = {
      Authorization: `Bearer ${auth.token}`,
      Version: "2021-07-28",
      Accept: "application/json"
    };

    let r;
    try {
      r = await fetch(url, { headers });
    } catch (netErr) {
      console.error("FETCH_ERROR:", netErr);
      return res.status(502).json({ ok: false, error: "Network error contacting GHL", detail: String(netErr) });
    }

    let data = {};
    try {
      data = await r.json();
    } catch (parseErr) {
      console.error("JSON_PARSE_ERROR:", parseErr);
      return res.status(r.ok ? 200 : r.status).json({
        ok: r.ok,
        status: r.status,
        error: "Failed to parse JSON from GHL",
        bodyText: await r.text().catch(() => "<no-body>")
      });
    }

    return res.status(r.ok ? 200 : r.status).json({ ok: r.ok, status: r.status, data });
  } catch (e) {
    console.error("UNHANDLED_ERROR:", e);
    return res.status(500).json({ ok: false, error: "Unhandled server error", detail: String(e) });
  }
};
