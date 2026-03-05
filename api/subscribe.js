const { cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, firstName, recaptchaToken } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Verify reCAPTCHA
  if (!recaptchaToken) return res.status(400).json({ error: 'reCAPTCHA token missing' });
  const captchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`
  });
  const captchaData = await captchaRes.json();
  console.log('reCAPTCHA result:', JSON.stringify(captchaData));
  if (!captchaData.success || captchaData.score < 0.5) {
    return res.status(403).json({ error: 'reCAPTCHA failed' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Kit-Api-Key': process.env.KIT_API_KEY
  };

  try {
    // Step 1 — create/update subscriber
    const subRes = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email_address: email, first_name: firstName || '', state: 'active' })
    });
    const subData = await subRes.json();
    if (!subRes.ok) return res.status(500).json({ error: subData.errors || 'Failed to create subscriber' });

    const subscriberId = subData.subscriber?.id;

    // Step 2 — apply tag "website-signup"
    if (subscriberId) {
      const tagRes = await fetch('https://api.kit.com/v4/tags', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'website-signup' })
      });
      const tagData = await tagRes.json();
      const tagId = tagData.tag?.id;

      if (tagId) {
        await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email_address: email })
        });
      }
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Subscribe error:', e);
    return res.status(500).json({ error: e.message });
  }
};
