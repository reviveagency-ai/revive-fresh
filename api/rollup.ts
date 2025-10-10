// api/rollup.ts — Vercel serverless function
import type { VercelRequest, VercelResponse } from "@vercel/node";

const HL_BASE = "https://services.leadconnectorhq.com";

/** LeadConnector requires a Version header on ALL calls.
 *  Most endpoints also behave better if LocationId is sent as a HEADER.
 */
async function hl<T = any>(
  path: string,
  init: RequestInit & { locationId?: string } = {}
): Promise<T> {
  const token = process.env.HL_API_TOKEN!;
  if (!token) throw new Error("Missing HL_API_TOKEN env");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    Version: "2021-07-28", // REQUIRED by LeadConnector/HighLevel
    ...(init.headers as Record<string, string> | undefined),
  };
  // Also pass LocationId as a header whenever we know it
  if (init.locationId) headers["LocationId"] = init.locationId;

  const resp = await fetch(`${HL_BASE}${path}`, { ...init, headers });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`HL ${path} ${resp.status}: ${txt}`.slice(0, 800));
  }
  return (await resp.json()) as T;
}

async function postToSlack(channel: string, text: string) {
  const token = process.env.SLACK_BOT_TOKEN!;
  if (!token) throw new Error("Missing SLACK_BOT_TOKEN env");
  const resp = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel,
      text,
      unfurl_links: false,
      unfurl_media: false,
    }),
  });
  return resp.json();
}

function rangeLast7() {
  const now = new Date();
  const end = now;
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  const label = `${startISO.slice(0, 10)}–${endISO.slice(0, 10)}`;
  return { startISO, endISO, label };
}

type Pipeline = { id: string; name: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const dry = req.query.dry_run === "1";
    const doLivePost = req.query.post === "live";
    const channel = process.env.SLACK_CHANNEL_MASTER || "";
    const locs = (process.env.RYZE_LOCATION_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { startISO, endISO, label } = rangeLast7();

    const results: Array<{
      locationId: string;
      clientName: string;
      totals: { newLeads: number };
      pipelines: Array<{ id: string; name: string; newLeads: number }>;
      errors?: string[];
    }> = [];

    for (const loc of locs) {
      const summary = {
        locationId: loc,
        clientName: "", // optional: map later
        totals: { newLeads: 0 },
        pipelines: [] as Array<{ id: string; name: string; newLeads: number }>,
        errors: [] as string[],
      };

      try {
        // 1) Pipelines — send both query param and LocationId header
        const pipes: Pipeline[] = await hl(
          `/opportunities/pipelines?locationId=${encodeURIComponent(loc)}`,
          { locationId: loc }
        );

        // 2) For each pipeline, count opportunities created in the last 7 days
        for (const p of pipes) {
          try {
            // Preferred POST search (with LocationId header)
            let data: any;
            try {
              data = await hl(`/opportunities/search`, {
                method: "POST",
                locationId: loc,
                body: JSON.stringify({
                  locationId: loc,
                  pipelineId: p.id,
                  createdAtStart: startISO,
                  createdAtEnd: endISO,
                  limit: 1, // minimize payload; we only need totals
                }),
              });
            } catch {
              // Fallback GET (still include LocationId header)
              data = await hl(
                `/opportunities/search?locationId=${encodeURIComponent(
                  loc
                )}&pipelineId=${encodeURIComponent(
                  p.id
                )}&createdAtStart=${encodeURIComponent(
                  startISO
                )}&createdAtEnd=${encodeURIComponent(endISO)}&limit=1`,
                { locationId: loc }
              );
            }

            const total =
              (typeof data?.total === "number" && data.total) ||
              (typeof data?.meta?.total === "number" && data.meta.total) ||
              (Array.isArray(data) ? data.length : 0);

            summary.pipelines.push({ id: p.id, name: p.name, newLeads: total });
            summary.totals.newLeads += total;
          } catch (e: any) {
            summary.errors?.push(
