const webhook = process.env.SLACK_WEBHOOK_URL;
async function readBody(req){ return new Promise((r,j)=>{let d="";req.on("data",c=>d+=c);req.on("end",()=>r(d));req.on("error",j);}); }
module.exports = async (req, res) => {
  try {
    if (!webhook) return res.status(500).json({ ok:false, error:"Missing SLACK_WEBHOOK_URL env" });
    const raw = await readBody(req); let body = {}; try { body = JSON.parse(raw||"{}"); } catch {}
    const title = body.title || req.query.title || "Untitled";
    const tags = body.tags || (req.query.tags ? String(req.query.tags).split(",") : []);
    const content = body.body || req.query.body || "(no body)";
    const payload = { text: [`*Revive Habitat Log*`,`*Title:* ${title}`, tags.length?`*Tags:* ${tags.join(", ")}`:null, `*Content:* ${content}`].filter(Boolean).join("\n") };
    const r = await fetch(webhook, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    res.status(r.ok?200:500).json({ ok:r.ok, provider_response: await r.text().catch(()=>"" ) });
  } catch (e) { res.status(500).json({ ok:false, error:e.message }); }
};
