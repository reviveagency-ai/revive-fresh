// api/habitat/validate.js
function hasAll(str, terms){ return terms.every(t => str.toLowerCase().includes(t.toLowerCase())); }
const bannedAbbr = ["mon-wed-fri","mon/tues","w/","btw","aka"];

async function readBody(req) {
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => data += c);
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  let text = "";
  const q = req.query || {};

  if (req.method === "POST") {
    const raw = await readBody(req);
    const type = req.headers["content-type"] || "";
    if (type.includes("application/json")) {
      try { const j = JSON.parse(raw || "{}"); text = j.text || ""; } catch {}
    } else if (type.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(raw);
      text = params.get("text") || "";
    } else {
      text = raw || "";
    }
  } else {
    text = q.text || "";
  }

  const issues = [];
  if (!text.trim()) issues.push("No content provided.");

  if (!hasAll(text, ["objective:", "outcome:", "assignee:", "due date:", "channel:", "priority:"])) {
    issues.push("Missing one or more required header fields (Objective/Outcome/Assignee/Due Date/Channel/Priority).");
  }

  if (!text.toLowerCase().includes("(et)")) issues.push("Due date/time should specify (ET).");

  if (!text.toLowerCase().includes("### steps"))   issues.push("Missing '### Steps' section (numbered).");
  if (!text.toLowerCase().includes("### gotchas")) issues.push("Missing '### Gotchas' section.");
  if (!text.toLowerCase().includes("### proof of completion")) issues.push("Missing '### Proof of completion' section.");

  bannedAbbr.forEach(a => { if (text.toLowerCase().includes(a)) issues.push(`Contains banned abbreviation: "${a}"`); });

  res.status(200).json({ ok: issues.length === 0, issues });
};
