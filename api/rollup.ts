// api/rollup.ts  (Vercel serverless function)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dry = req.query.dry_run === '1';
  const channel = process.env.SLACK_CHANNEL_MASTER || '(unset)';
  const locs = (process.env.RYZE_LOCATION_IDS || '').split(',').filter(Boolean);
  const payload = {
    ok: true,
    endpoint: '/api/rollup',
    now: new Date().toISOString(),
    channel,
    locationsDetected: locs,
    note: 'Endpoint live. Use ?dry_run=1 to preview. Cron is set for Mondays 9:10am ET.'
  };
  return res.status(200).json(dry ? payload : { ...payload, message: 'No Slack post on this call.' });
}
