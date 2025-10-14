// api/ghl/pipelines.js
const { getAuth, getLocationIdFromReq } = require("../_config");

module.exports = async (req, res) => {
  const auth = getAuth();
  if (!auth.ok) return res.status(500).json({ ok:false, error:auth.error });

  const locationId = getLocationIdFromReq(req);
  if (!locationId) {
    return res.status(400).json({ ok:false, error:"Missing locationId. Use ?loc=<alias> or set DEFAULT_LOCATION_ID." });
  }

  const url = `${auth.host}/v1/pipelines/?locationId=${encodeURIComponent(locationId)}`;
  const r = await fetch(url, { headers:{ Authorization:`Bearer ${auth.token}`, Version:"2021-07-28", Accept:"application/json" }});
  const data = await r.json().catch(()=> ({}));
  res.status(r.ok ? 200 : r.status).json({ ok:r.ok, status:r.status, data });
};
