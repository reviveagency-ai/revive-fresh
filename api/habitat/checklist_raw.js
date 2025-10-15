module.exports = async (req, res) => {
  const params = new URLSearchParams(req.url.split("?")[1] || "");
  const title    = params.get("title")    || "Untitled Task";
  const assignee = params.get("assignee") || "@assignee";
  const due      = params.get("due")      || "YYYY-MM-DD";
  const channel  = params.get("channel")  || "#work-updates";
  const priority = params.get("priority") || "P2";

  const md = [
    `**Objective:** ${title}`,
    `**Outcome:** (describe the result in 1 sentence)`,
    `**Assignee:** ${assignee}`,
    `**Due Date:** ${due} (ET)`,
    `**Channel:** ${channel}`,
    `**Priority:** ${priority}`,
    ``,
    `### Steps`,
    `1. Research keywords (primary + 3–5 secondary phrases) and confirm intent`,
    `2. Map H1/H2/H3 structure and define internal link targets`,
    `3. Draft copy (700–900 words) with meta title and meta description`,
    `4. Quality assurance: links, spelling, schema suggestion, image alt text, calls to action`,
    `5. Publish page, request indexing, update sitemap, share live URL`,
    ``,
    `### Gotchas`,
    `- Use Eastern Time for all dates (append "(ET)")`,
    `- No abbreviations anywhere`,
    `- Include at least two internal links`,
    ``,
    `### Proof of completion`,
    `- Live URL, Search Console "request indexing" screenshot, and Lighthouse scores`
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(md);
};
