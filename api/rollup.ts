// api/rollup.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const HL = 'https://services.leadconnectorhq.com';

async function hl<T = any>(path: string, init: RequestInit = {}) {
  const token = process.env.HL_API_TOKEN!;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(init.headers || {})
  };
  const resp = await fetch(`${HL}${path}`, { ...init, headers });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`HL ${path} ${resp.status}: ${txt}`.slice(0, 500));
  }
  return resp.json() as Promise<T>;
}

async function postToSlack(channel: string, text: string) {
  const token = process.env.SLACK_BOT_TOKEN!;
  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel, text, unfurl_links: false, unfurl_media: false }),
  });
  return resp.json();
}

function getRangeLast7Days() {
  const now = new Date();
  const end = new Date(now);                // now
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  // HL expects ISO strings
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    label: `${start.toISOString().slice(0,10)}–${end.toISOString().slice(0,10)}`
  };
}

type Pipeline = { id: string; name: string };
type LocationSummary = {
  locationId: string;
  clientName: string;        // best-effort (may be blank if not mapped)
  totals: { newLeads: number };
  pipelines: Array<{ name: string; id: string; newLeads: number }>;
  errors?: string[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dry = req.query.dry_run === '1';
  const doLivePost = req.query.post === 'live';
  const channel = process.env.SLACK_CHANNEL_MASTER || '';
  const locs = (process.env.RYZE_LOCATION_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const { startISO, endISO, label } = getRangeLast7Days();

  const results: LocationSummary[] = [];
  for (const loc of locs) {
    const summary: LocationSummary = {
      locationId: loc,
      clientName: '', // (optional: map if you keep a CSV env; we’ll fill later)
      totals: { newLeads: 0 },
      pipelines: [],
      errors: []
    };
    try {
      // 1) Pipelines
      const pipes: Pipeline[] = await hl(`/opportunities/pipelines?locationId=${encodeURIComponent(loc)}`);

      // 2) Count opportunities created in window per pipeline
      for (const p of pipes) {
        try {
          // Some HL tenants require POST for searching; we try POST first, fallback to GET.
          let data: any;
          try {
            data = await hl(`/opportunities/search`, {
              method: 'POST',
              body: JSON.stringify({
                locationId: loc,
                pipelineId: p.id,
                createdAtStart: startISO,
                createdAtEnd: endISO,
                limit: 1 // minimize payload; we'll read total if provided
              }),
            });
          } catch (_e) {
            // Fallback GET (if supported on your account)
            data = await hl(
              `/opportunities/search?locationId=${encodeURIComponent(loc)}&pipelineId=${encodeURIComponent(p.id)}&createdAtStart=${encodeURIComponent(startISO)}&createdAtEnd=${encodeURIComponent(endISO)}&limit=1`
            );
          }

          // Try common shapes: { total } or { meta: { total } } or array.length
          const total =
            (typeof data?.total === 'number' && data.total) ||
            (typeof data?.meta?.total === 'number' && data.meta.total) ||
            (Array.isArray(data) ? data.length : 0);

          summary.pipelines.push({ name: p.name, id: p.id, newLeads: total });
          summary.totals.newLeads += total;
        } catch (e:any) {
          summary.errors?.push(`Count fail for pipeline ${p.name}: ${e.message || e}`);
        }
      }
    } catch (e:any) {
      summary.errors?.push(`Pipelines fetch failed: ${e.message || e}`);
    }
    results.push(summary);
  }

  const payload = {
    ok: true,
    range: label,
    endpoint: '/api/rollup',
    channel: channel || '(unset)',
    locationsProcessed: results.length,
    results
  };

  if (dry) return res.status(200).json(payload);

  // Format a compact Slack message
  const lines: string[] = [];
  lines.push(`:bar_chart: Weekly RYZE Rollup — ${label}`);
  for (const r of results) {
    const name = r.clientName || r.locationId;
    lines.push(`\n*${name}*`);
    lines.push(`Totals: *${r.totals.newLeads}* new`);
    if (r.pipelines.length) {
      for (const p of r.pipelines) {
        lines.push(`• ${p.name}: ${p.newLeads} new`);
      }
    }
    if (r.errors && r.errors.length) {
      lines.push(`⚠️ ${r.errors.join(' | ')}`);
    }
  }
  const text = lines.join('\n');

  if (doLivePost && channel) {
    const r = await postToSlack(channel, text);
    return res.status(200).json({ ...payload, posted: r });
  }

  return res.status(200).json({ ...payload, message: "Append ?post=live to send this to Slack once you're happy." });
}
