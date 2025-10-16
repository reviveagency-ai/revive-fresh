export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('No code received');
  }

  console.log('HighLevel code:', code);
  console.log('State:', state);

  res.send('Code received! Ready to exchange for access token.');
}
