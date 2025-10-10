// pages/api/rollup.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dry_run } = req.query as { dry_run?: string };
  const channel = process.env.SLACK_CHANNEL_MASTER || "(unset)";
  const locs = (process.env.RYZE_LOCATION_IDS || "").split(",").filter(Boolean);
  const now = new Date().toISOString();

  const payload = {
    ok: true,
    endpoint: "/api/rollup",
    now,
    channel,
    locationsDetected: locs,
    note: "Endpoint live. Use ?dry_run=1 to preview. Cron is set for Mondays 9:10am ET."
  };

  if (dry_run === "1") return res.status(200).json(payload);
  return res.status(200).json({ ...payload, message: "No Slack post on this call. Add real data fetch next." });
}
