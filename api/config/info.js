const { getAuth, getLocationIdFromReq, parseLocationEnv, redactedToken } = require("../_config");
module.exports = async (req, res) => {
  const auth = getAuth();
  const { ids, byAlias } = parseLocationEnv();
  const resolved = getLocationIdFromReq(req);
  res.status(200).json({
    ok: true,
    auth: auth.ok ? { host: auth.host, isJWT: auth.isJWT, token: redactedToken(auth.token) } : { error: auth.error },
    env: { DEFAULT_LOCATION_ID: process.env.DEFAULT_LOCATION_ID || null, LOCATION_IDS_count: ids.length, LOCATION_IDS_preview: ids.slice(0,5) },
    aliases: byAlias,
    resolved_locationId: resolved || null,
    hint: "Use ?locationId=<id> or ?loc=<alias>. Ensure envs are scoped to All Environments."
  });
};
