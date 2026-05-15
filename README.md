# SimpleUAE — Next.js Edition

Converted from Node.js + Express to Next.js (App Router). Zero features changed. Zero design changes. Only the runtime platform changed.

## Getting started

### 1. Configure environment
Edit `.env.local` — key variables:
- `ADMIN_PLAIN_KEY` — default admin login key (change this)
- `JWT_SECRET` — secret for signing tokens (change in production)
- `SMTP_*` — email settings (optional; emails skipped if blank)

### 2. Install & run

```bash
npm install
npm run dev       # http://localhost:3000
```

### Production
```bash
npm run build
npm run start
```

## What changed vs the original Express backend

| Original | This project |
|---|---|
| `src/server.js` + Express | Next.js dev server |
| `src/routes/*.js` (router.get/post) | `app/api/***/route.js` (exported GET/POST/…) |
| `req`, `res.json()` | `Request`, `NextResponse.json()` |
| `express-rate-limit` middleware | In-memory rate limiters in route files |
| `src/db/jsondb.js` | `lib/jsondb.js` — identical logic |
| All services/models | `lib/` — identical logic |
| Frontend served by Express static | `public/index.html` served by Next.js |

## Data storage
JSON files in `/data/` directory (auto-created). No MongoDB required.

## Default login
Key: `SIMPLEAE2025` (change via `PUT /api/auth/key` after login)
