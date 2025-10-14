module.exports = async (req, res) => {
  const text = process.env.GUIDELINES_MD || "";
  res.status(200).json({
    ok: true,
    hasGuidelines: Boolean(text.trim()),
    guidelines: text || "Set GUIDELINES_MD in Vercel → Env Vars."
  });
};
