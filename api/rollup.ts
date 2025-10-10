// api/rollup.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dry = req.query.dry_run === '1';
  const smoke = req.query.post === 'smoke'; // call with ?post=smoke to send a Slack test
  const channel = process.env.SLACK_CHANNEL_MASTER || '(unset)';
  const locs = (process.env.RYZE_LOCATION_IDS || '').split(',').filter(Boolean);

  const payload = {
    ok: true,
    endpoint: '/api/rollup',
    now: new Date().toISOString(),
    channel,
    locationsDetected: locs,
    note: 'Cron set for Mondays 9:10am ET (13:10 UTC).',
  };

  if (smoke && channel !== '(unset)') {
    const r = await postToSlack(channel, ':white_check_mark: Rollup endpoint connected. Next step: wire live GHL counts.');
    return res.status(200).json({ ...payload, slackResult: r });
  }

  return res.status(200).json(dry ? payload : { ...payload, message: 'Live route OK. Add GHL fetch next.' });
}
