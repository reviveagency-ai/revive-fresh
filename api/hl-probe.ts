import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.HL_API_TOKEN;
  const loc = (req.query.loc as string) || "";
  if (!token) return res.status(200).json({ ok:false, error:"HL_API_TOKEN missing in Vercel env" });
  if (!loc)   return res.status(200).json({ ok:false, error:"Add ?loc=<LOCATION_ID> to the URL" });

  const headers: Record<string,string> = {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    Accept: "application/json",
    LocationId: loc
  };

  try {
    const r = await fetch(
      `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${encodeURIComponent(loc)}`,
      { headers }
    );
    const text = await r.text();
    return res.status(200).json({ ok: r.ok, status: r.status, body: safeJson(text), sentHeaders: Object.keys(headers) });
  } catch (e:any) {
    return res.status(200).json({ ok:false, error:String(e) });
  }
}
function safeJson(t:string){ try { return JSON.parse(t);} catch { return t; } }
