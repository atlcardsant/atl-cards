const { Redis }                  = require('@upstash/redis');
const crypto                     = require('crypto');
const { createToken, verifyToken, cors } = require('./_auth');

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const DEFAULT_HASH = crypto.createHash('sha256').update('atlcards2025').digest('hex');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST /api/login — authenticate
  if (req.method === 'POST') {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Password required' });

    const inputHash  = crypto.createHash('sha256').update(password).digest('hex');
    let   storedHash = await kv.get('admin:password_hash');
    if (!storedHash) storedHash = DEFAULT_HASH;

    if (inputHash !== storedHash) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    return res.json({ token: createToken() });
  }

  // PUT /api/login — change password (requires current token)
  if (req.method === 'PUT') {
    if (!verifyToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const currentHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
    let   storedHash  = await kv.get('admin:password_hash');
    if (!storedHash) storedHash = DEFAULT_HASH;

    if (currentHash !== storedHash) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    await kv.set('admin:password_hash', newHash);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
