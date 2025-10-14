// api/ghl/pipelines.js
const { getAuth, getLocationIdFromReq } = require("../_config");

module.exports = async (req, res) => {
  const auth = getAuth();
  if (!auth.ok) return res.status(500).json({ ok:false, error:auth.error });

  const locationId = getLocationIdFromReq(req);
  if (!locationId) {
    return res.status(400).json({
      ok:false,
      error:"Missing locationId. Use ?loc=<alias> / ?locationId=<id> or set DEFAULT_LOCATION_ID."
    });
  }

  // OAuth (JWT) vs API-key paths
  const url = auth.isJWT
    ? `${auth.host}/v1/locations/${encodeURIComponent(locationId)}/pipelines`
    : `${auth.host}/v1/pipelines/?locationId=${encodeURIComponent(locationId)}`;

  try
