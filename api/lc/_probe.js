// api/ghl/_probe.js
module.exports = (req, res) => {
  res.status(200).json({ ok: true, route: "/api/ghl/_probe" });
};
