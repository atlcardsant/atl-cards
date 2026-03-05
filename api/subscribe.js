const { cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, firstName } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const response = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': process.env.KIT_API_KEY
    },
    body: JSON.stringify({ email_address: email, first_name: firstName || '', state: 'active' })
  });

  if (!response.ok) {
    const err = await response.json();
    return res.status(500).json({ error: err.message || 'Kit API error' });
  }

  return res.json({ success: true });
};
