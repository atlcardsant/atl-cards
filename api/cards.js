const { Redis }             = require('@upstash/redis');
const { verifyToken, cors } = require('./_auth');

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — public, no auth needed
  if (req.method === 'GET') {
    const cards = (await kv.get('cards')) || [];
    return res.json(cards);
  }

  // All other methods require auth
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // POST — add a new card
  if (req.method === 'POST') {
    const { name, sport, meta, price, grade, badge, link } = req.body || {};
    if (!name || !sport || !meta || !price || !link) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cards = (await kv.get('cards')) || [];
    const card  = { id: Date.now().toString(), name, sport, meta, price, grade: grade || '', badge: badge || '', link, createdAt: new Date().toISOString() };
    cards.push(card);
    await kv.set('cards', cards);
    return res.status(201).json(card);
  }

  // PUT — update an existing card
  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Card ID required' });

    const cards = (await kv.get('cards')) || [];
    const idx   = cards.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Card not found' });

    cards[idx] = { ...cards[idx], ...req.body, id };
    await kv.set('cards', cards);
    return res.json(cards[idx]);
  }

  // DELETE — remove a card
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Card ID required' });

    const cards   = (await kv.get('cards')) || [];
    const updated = cards.filter(c => c.id !== id);
    if (updated.length === cards.length) return res.status(404).json({ error: 'Card not found' });

    await kv.set('cards', updated);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
