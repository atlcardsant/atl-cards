const { Redis }             = require('@upstash/redis');
const { verifyToken, cors } = require('./_auth');

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const DEFAULT_EBAY = 'https://www.ebay.com';

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — public
  if (req.method === 'GET') {
    const ebayUrl = (await kv.get('settings:ebay_url')) || DEFAULT_EBAY;
    return res.json({ ebayUrl });
  }

  // POST — update (requires auth)
  if (req.method === 'POST') {
    if (!verifyToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { ebayUrl } = req.body || {};
    if (!ebayUrl) return res.status(400).json({ error: 'ebayUrl required' });
    await kv.set('settings:ebay_url', ebayUrl);
    return res.json({ success: true, ebayUrl });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
