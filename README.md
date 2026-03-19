# 好路數 — 香港著數優惠一覽

Aggregates the latest deals and discounts across Hong Kong into a single, clean interface. Covers food, shopping, hotels, travel, and supermarkets.

**Live:** https://discount.clawify.dev

## Architecture

| Layer    | Product           | URL / role                                     |
| -------- | ----------------- | ---------------------------------------------- |
| Frontend | Cloudflare Pages  | `discount.clawify.dev` — React, Vite, Tailwind |
| API      | Cloudflare Worker | `api-discount.clawify.dev` — Hono              |
| Data     | Cloudflare D1     | SQLite at edge (e.g. APAC / HKG)               |

```
  Pages (React)          Worker (Hono)              D1 (SQLite)
 ┌──────────────┐       ┌──────────────┐          ┌──────────────┐
 │ discount.    │  HTTP │ api-discount.│   SQL    │ deals, etc.  │
 │ clawify.dev  │ ────▶ │ clawify.dev  │ ───────▶ │              │
 └──────────────┘       └──────────────┘          └──────────────┘
```

- **Frontend:** React + Vite + Tailwind CSS on Cloudflare Pages
- **Backend:** Cloudflare Worker with Hono framework
- **Database:** Cloudflare D1 (SQLite at edge, APAC region)
- **Ingestion:** Cron-triggered at 8am, 9am, 6pm HKT daily

## Data Sources

| Source          | Method                | Category             |
| --------------- | --------------------- | -------------------- |
| Jetso Club      | RSS feeds             | All                  |
| RunHotel        | RSS feed              | Hotels / Buffets     |
| Kongsolo        | Direct HTML fetch     | All                  |
| Klook           | Direct HTML fetch     | Buffets / Activities |
| 惠康 (Wellcome) | Direct HTML fetch     | Supermarket          |
| 7-Eleven        | Direct HTML fetch     | Supermarket          |
| Circle K        | Direct HTML fetch     | Supermarket          |
| GOtrip          | Direct HTML fetch     | Travel / Hotels      |
| AEON            | Direct HTML fetch     | Supermarket          |
| Jetso Today     | Cloudflare /crawl API | All                  |
| Uniqlo          | Cloudflare /crawl API | Fashion              |

## Deal filtering (per deployer, no secrets in git)

Keywords are read **only** from Worker environment variables (`FILTER_*`), or from **`worker/.dev.vars`** locally. They are **not** defined in application source code — set them in the Cloudflare Dashboard (or `.dev.vars`).

### Recommended format: comma-separated (no JSON)

Paste **one line** of keywords separated by commas. No brackets, no quotes needed.

| Variable                    | Example value (single line)        |
| --------------------------- | ---------------------------------- |
| `FILTER_EXCLUDE_KEYWORDS`   | `keyword-one, keyword-two, 某詞`   |
| `FILTER_CLICKBAIT_PATTERNS` | `網民, 網友, 被指, clickbait-term` |

Spaces after commas are fine. Matching is substring: if title, description, or labels **contain** any keyword, the deal is dropped on ingest.

### Where to set

Dashboard → **Workers & Pages** → your worker → **Settings** → **Variables and Secrets** → **Add variable**. Use **Plaintext** or **Encrypt** (secret) — both work the same in code.

After saving, **redeploy** the worker so the value applies.

### Purge old rows already in the database

Filtering only affects **new** ingests. To remove existing rows that match your keywords:

```bash
REFRESH_SECRET=your-secret npm run purge
```

(`API_URL` defaults to production; override for local.) Or `POST /api/purge-excluded` with `Authorization: Bearer …` if `REFRESH_SECRET` is set.

### Local dev

Use the same `FILTER_*` variable names in `worker/.dev.vars` (see `worker/.dev.vars.example`).

### Optional JSON / bracket lists

Strict JSON (`["a","b"]`) and bracket lists (`[a,b]`) are supported; curly/smart quotes are normalised. Comma-separated is still the easiest in the Dashboard.

## Project Structure

```
ho-lou-sou/
├── web/                  # Frontend (React + Vite)
│   └── src/
│       ├── App.tsx
│       ├── components/   # DealCard, CategoryTabs, BrandTags, etc.
│       └── hooks/        # useDeals, useCategories, useBrands, useSearch
├── worker/               # Backend (Cloudflare Worker)
│   └── src/
│       ├── index.ts      # Hono routes + cron handlers
│       ├── db.ts         # D1 database operations
│       ├── rss.ts        # RSS feed parser (Jetso Club, RunHotel)
│       ├── crawl.ts      # Cloudflare /crawl API integration
│       ├── kongsolo.ts   # Direct fetch parser for kongsolo.com
│       ├── klook.ts      # Direct fetch parser for Klook promos
│       ├── brand.ts      # Brand extraction from deal titles
│       ├── filter.ts     # Content filter (exclude non-HK deals)
│       ├── sources.ts    # Source configurations
│       └── types.ts      # TypeScript types
└── package.json          # Workspace root with deploy scripts
```

## Development

```bash
# Install dependencies
npm install

# Run worker locally (port 8787)
cd worker && npm run dev

# Run frontend locally (port 5173, proxies /api to worker)
cd web && npm run dev

# Or run frontend against production API
cd web && VITE_API_URL=https://api-discount.clawify.dev npm run dev
```

Requires local D1 schema setup on first run:

```bash
cd worker && npx wrangler d1 execute ho-lou-sou-db --local --file=schema.sql
```

## Deployment

```bash
# Deploy everything (worker + frontend)
npm run deploy

# Deploy worker only
npm run deploy:worker

# Deploy frontend only
npm run deploy:web
```

Worker secrets (set once via `wrangler secret put`):

- `CF_ACCOUNT_ID` — Cloudflare account ID
- `CF_API_TOKEN` — API token with Browser Rendering permission
