module.exports = async (req, res) => {
  try {
    const key =
      process.env.HL_API_TOKEN ||
      process.env.GHL_API_KEY ||
      process.env.HL_API_KEY;

    if (!key) {
      return res.status(500).json({ ok:false, error:"Missing HL_API_TOKEN (or GHL_API_KEY)" });
    }

    // Accept several env names and fallbacks
    const ryzeList = (process.env.RYZE_LOCATION_IDS || process.env.LOCATION_IDS || "")
      .split(/[,\s]+/)
      .filter(Boolean);

    const locationId =
      req.query.locationId ||
      process.env.GHL_LOCATION_ID ||
      process.env.LOCATION_ID ||
      ryzeList[0];

    if (!locationId) {
      return res.status(400).json({ ok:false, error:"Missing locationId (query, GHL_LOCATION_ID, or RYZE_LOCATION_IDS)" });
    }

    const url = `https://rest.gohighlevel.com/v1/pipelines/?locationId=${encodeURIComponent(locationId)}`;
    const r = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${key}`,
        "Version": "2021-07-28",
        "Accept": "application/json"
      }
    });

    const data = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : r.status).json({ ok:r.ok, status:r.status, data });
  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
};
