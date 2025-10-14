// api/ghl/pipelines.js
const { getAuth, getLocationIdFromReq } = require("../_config");

async function callPipelines(url, token, isJWT, locationId) {
  // JWT (Agency OAuth) -> LeadConnector host + Location-Id header
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

  // API Key (Location key) -> REST host; try Bearer then X-API-KEY
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
    const auth = getAuth(); // decides host based on token type
    if (!auth.ok) return res.status(500).json({ ok:false, error:auth.error });

    const locationId = getLocationIdFromReq(req);
    if (!locationId) {
      return res.status(400).json({ ok:false, error:"Missing locationId. Use ?loc=<alias> or set DEFAULT_LOCATION_ID / LOCATION_IDS." });
    }

    const url = `${auth.host}/v1/pipelines/?locationId=${encodeURIComponent(locationId)}`;
    const r = await callPipelines(url, auth.token, auth.isJWT, locationId);

    let data; try { data = await r.json(); } catch { data = { raw: await r.text().catch(()=>"<no-body>") }; }
    return res.status(r.ok ? 200 : r.status).json({ ok:r.ok, status:r.status, data });
  } catch (e) {
    return res.status(500).json({ ok:false, error:"Unhandled server error", detail:String(e) });
  }
};

