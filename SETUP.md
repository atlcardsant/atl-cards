# ATL Cards — Setup Guide

## What changed
The site now has a real backend. Cards and settings are stored in **Vercel KV** (Vercel's built-in database). The admin panel is secured with password hashing and signed tokens — nothing sensitive touches the frontend.

---

## One-time setup (takes ~10 minutes)

### Step 1 — Enable Vercel KV
1. Go to your Vercel dashboard → your `atl-cards` project
2. Click the **Storage** tab
3. Click **Create Database** → choose **KV**
4. Name it anything (e.g. `atl-cards-kv`) → click **Create**
5. Click **Connect to Project** and select your project
6. Click **Connect** — this automatically adds the required environment variables

### Step 2 — Add your token secret
1. In Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `TOKEN_SECRET`
   - **Value:** any long random string, e.g. `xK9#mQ2$pL7@nR4vT8wZ1` (make it unique)
3. Click **Save**

### Step 3 — Push the new code
Replace your existing repo files with this new folder structure, then:
```bash
git add .
git commit -m "add real backend with vercel kv"
git push
```
Vercel will auto-deploy in about 60 seconds.

---

## How to open the admin panel
- Click the **ATL Cards logo 5 times fast** in the top-left nav
- Default password: `atlcards2025`
- Change your password in Settings immediately after first login

---

## Project structure
```
/
├── public/
│   └── index.html       ← your website
├── api/
│   ├── _auth.js         ← JWT signing/verification (not a route)
│   ├── login.js         ← POST login, PUT change password
│   ├── cards.js         ← GET/POST/PUT/DELETE cards
│   └── settings.js      ← GET/POST eBay URL
├── package.json
├── vercel.json
└── SETUP.md
```

## Security notes
- Passwords are stored as SHA-256 hashes — never in plain text
- Admin sessions use signed JWT tokens, valid for 24 hours
- All write operations require a valid token in the Authorization header
- Card listings are publicly readable (needed for the website)
- The Supabase service key / Vercel KV credentials never touch the frontend
