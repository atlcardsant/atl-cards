const { cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, firstName } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const kitRes = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KIT_API_KEY}`
      },
      body: JSON.stringify({ email_address: email, first_name: firstName || '', state: 'active' })
    });

    const data = await kitRes.json();
    console.log('Kit status:', kitRes.status);
    console.log('Kit body:', JSON.stringify(data));

    if (!kitRes.ok) {
      return res.status(500).json({ error: data.message || data.errors || 'Kit API error', detail: data });
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Subscribe error:', e);
    return res.status(500).json({ error: e.message });
  }
};
