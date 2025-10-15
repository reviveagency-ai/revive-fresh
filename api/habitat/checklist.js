// api/habitat/checklist.js
function jsonParam(q, name, def) {
  try { return q[name] ? JSON.parse(q[name]) : def; } catch { return def; }
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const title    = q.title    || "Untitled Task";
  const assignee = q.assignee || "@assignee";
  const due      = q.due      || "YYYY-MM-DD";
  const channel  = q.channel  || "#work-updates";  // <-- defaulted here
  const priority = q.priority || "P2";

  const steps   = jsonParam(q, "steps", [
    "Research keywords (primary + 3–5 secondary phrases) and confirm intent",
    "Map H1/H2/H3 structure and define internal link targets",
    "Draft copy (700–900 words) with meta title and meta description",
    "Quality assurance: links, spelling, schema suggestion, image alt text, calls to action",
    "Publish page, request indexing, update sitemap, share live URL"
  ]);

  const gotchas = jsonParam(q, "gotchas", [
    "Use Eastern Time for all dates (append '(ET)')",
    "No abbreviations anywhere",
    "Include at least two internal links"
  ]);

  const proof   = q.proof || "Live URL, Search Console 'request indexing' screenshot, and Lighthouse scores";

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
