const url = process.env.SLACK_WEBHOOK_URL;

module.exports = async (req, res) => {
  if (!url) return res.status(500).json({ ok:false, error:"Missing SLACK_WEBHOOK_URL" });

  let text = req.query.text || "Hello from Revive Ops Hub";
  if (req.method === "POST") {
    try { const body = await new Promise(r=>{let d="";req.on("data",c=>d+=c);req.on("end",()=>r(d));});
          const json = JSON.parse(body||"{}"); if (json.text) text = json.text; } catch {}
  }

  const r = await fetch(url,{ method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ text }) });
  res.status(r.ok?200:500).json({ ok:r.ok });
};
