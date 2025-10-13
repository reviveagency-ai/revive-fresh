// api/rollup-debug.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const mask = (v?: string) => (v ? `${v.slice(0, 4)}…${v.slice(-4)}` : '(unset)');
  const env = {
    node: process.version,
    TZ: process.env.TZ || '(unset)',
    SLACK_CHANNEL_MASTER: process.env.SLACK_CHANNEL_MASTER || '(unset)',
    RYZE_LOCATION_IDS: (process.env.RYZE_LOCATION_IDS || '(unset)').split(',').map(s => s.trim()).filter(Boolean),
    HL_API_TOKEN_present: !!process.env.HL_API_TOKEN,
    HL_API_TOKEN_preview: mask(process.env.HL_API_TOKEN),
    SLACK_BOT_TOKEN_present: !!process.env.SLACK_BOT_TOKEN,
    SLACK_BOT_TOKEN_preview: mask(process.env.SLACK_BOT_TOKEN),
  };
  return res.status(200).json({ ok: true, env });
}
