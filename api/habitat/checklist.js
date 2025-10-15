// api/habitat/checklist.js
function jsonParam(q, name, def) {
  try { return q[name] ? JSON.parse(q[name]) : def; } catch { return def; }
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const title    = q.title    || "Untitled Task";
  const assignee = q.assignee || "@assignee";
  const due      = q.due      || "YYYY-MM-DD";
  const channel  = q.channel  || "#work-updates";
  const priority = q.priority || "P2";

  const steps   = jsonParam(q, "steps",   ["Write copy", "Design graphic", "QA links", "Schedule/Post"]);
  const gotchas = jsonParam(q, "gotchas", ["Confirm timezone is ET", "No abbreviations", "Tag responsible team"]);
  const proof   = q.proof || "Screenshot/URL + note in thread";

  const md = [
    `**Objective:** ${title}`,
    `**Outcome:** (describe the result in 1 sentence)`,
    `**Assignee:** ${assignee}`,
    `**Due Date:** ${due} (ET)`,
    `**Channel:** ${channel}`,
    `**Priority:** ${priority}`,
    ``,
    `### Steps`,
    ...steps.map((s, i) => `${i+1}. ${s}`),
    ``,
    `### Gotchas`,
    ...gotchas.map(g => `- ${g}`),
    ``,
    `### Proof of completion`,
    `- ${proof}`
  ].join("\n");

  res.status(200).json({ ok: true, markdown: md, json: {
    title, assignee, due, channel, priority, steps, gotchas, proof
  }});
};
