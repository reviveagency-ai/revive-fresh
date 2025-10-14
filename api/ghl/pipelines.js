module.exports = async (req, res) => {
  const key = process.env.GHL_API_KEY;
  const locationId = req.query.locationId || process.env.GHL_LOCATION_ID;
  if (!key) return res.status(500).json({ ok:false, error:"Missing GHL_API_KEY" });
  if (!locationId) return res.status(400).json({ ok:false, error:"Missing locationId" });

  const url = `https://rest.gohighlevel.com/v1/pipelines/?locationId=${encodeURIComponent(locationId)}`;
  const r = await fetch(url, {
    headers:{ Authorization:`Bearer ${key}`, Version:"2021-07-28", Accept:"application/json" }
  });
  const data = await r.json().catch(()=> ({}));
  res.status(r.ok?200:r.status).json({ ok:r.ok, status:r.status, data });
};
