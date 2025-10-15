// api/habitat/validate.js
function hasAll(str, terms){ return terms.every(t => str.toLowerCase().includes(t.toLowerCase())); }
const bannedAbbr = ["mon-wed-fri","mon/tues","w/","btw","aka"];

module.exports = async (req, res) => {
  const q = req.query || {};
  const text = q.text || "";
  const issues = [];

  if (!text.trim()) issues.push("No content provided.");
  // Required header fields
  if (!hasAll(text, ["objective:", "outcome:", "assignee:", "due date:", "channel:", "priority:"])) {
    issues.push("Missing one or more required header fields (Objective/Outcome/Assignee/Due Date/Channel/Priority).");
  }
  // Check ET mention
  if (!text.toLowerCase().includes("(et)")) issues.push("Due date/time should specify (ET).");
  // Checklist sections
  if (!text.toLowerCase().includes("### steps"))   issues.push("Missing '### Steps' section (numbered).");
  if (!text.toLowerCase().includes("### gotchas")) issues.push("Missing '### Gotchas' section.");
  if (!text.toLowerCase().includes("### proof of completion")) issues.push("Missing '### Proof of completion' section.");

  // Abbreviations
  bannedAbbr.forEach(a => { if (text.toLowerCase().includes(a)) issues.push(`Contains banned abbreviation: "${a}"`); });

  res.status(200).json({ ok: issues.length === 0, issues });
};
