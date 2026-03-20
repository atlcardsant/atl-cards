const crypto = require('crypto');

const SECRET = process.env.TOKEN_SECRET || 'atlcards-dev-secret-CHANGE-IN-VERCEL';

function createToken() {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ admin: true, exp: Date.now() + 86400000 })).toString('base64url');
  const sig     = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  try {
    const [header, payload, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
    if (sig !== expected) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.admin === true && data.exp > Date.now();
  } catch { return false; }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = { createToken, verifyToken, cors };
