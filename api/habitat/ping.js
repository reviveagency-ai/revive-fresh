module.exports = async (req, res) => {
  res.status(200).json({ ok: true, app: "revive-habitat", time: new Date().toISOString() });
};
