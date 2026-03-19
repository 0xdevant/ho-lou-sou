# Contributing to 好路數

感謝你有興趣為好路數作出貢獻！以下指南會幫你快速上手。

## Getting Started

```bash
git clone https://github.com/0xdevant/ho-lou-sou.git
cd ho-lou-sou
npm install
```

Set up the local D1 database:

```bash
cd worker && npx wrangler d1 execute ho-lou-sou-db --local --file=schema.sql
```

Run locally:

```bash
# Terminal 1: Worker (API on port 8787)
cd worker && npm run dev

# Terminal 2: Frontend (port 5173, proxies /api to worker)
cd web && npm run dev
```

To populate local data, run the ingest script against your local worker:

```bash
API_URL=http://localhost:8787 npx tsx scripts/ingest.ts
```

## Project Structure

| Directory            | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `web/`               | React + Vite + Tailwind frontend                      |
| `worker/`            | Cloudflare Worker (Hono) backend + all source parsers |
| `scripts/`           | Ingestion script used by GitHub Actions               |
| `.github/workflows/` | CI/CD and scheduled ingestion                         |

## Adding a New Data Source

This is the most common type of contribution. Each source has its own file in `worker/src/`.

1. **Create a parser** — add `worker/src/yoursite.ts` exporting a `fetchYourSite(): Promise<Deal[]>` function. See existing parsers like `wellcome.ts`, `seveneleven.ts`, or `circlek.ts` for reference.

2. **Map categories** — each deal needs a category: `食`, `衣`, `住`, `行`, or `超市`.

3. **Register the fetcher** — add it to:
   - `worker/src/index.ts` → `fetchAllFreeDeals()` array
   - `scripts/ingest.ts` → `Promise.all([...])` array

4. **Add brand extraction** (if applicable) — update `worker/src/brand.ts` with known brand names for the source.

5. **Add first-party dedup** (if applicable) — if the source is a brand's official site (e.g., Uniqlo, Wellcome), add it to `FIRST_PARTY_BRANDS` in `worker/src/filter.ts` so aggregator duplicates are removed.

6. **Test locally** — run `API_URL=http://localhost:8787 npx tsx scripts/ingest.ts` and check the frontend.

### Parser Guidelines

- Use direct HTTP fetch whenever possible (no crawl quota cost)
- Use `decodeEntities()` from `worker/src/utils.ts` for HTML entity decoding
- Use `extractBrand()` from `worker/src/brand.ts` to normalize brand names
- Set `source_name` to a recognizable display name (e.g., `'Circle K'`, `'惠康'`)
- Generate stable, unique IDs prefixed with a short source code (e.g., `ck_123`, `wc_abc`)

### Deal Interface

```typescript
interface Deal {
  id: string; // Unique, stable ID
  title: string; // Deal title (max 200 chars)
  description: string | null;
  source_url: string; // Link to original page
  source_name: string; // Display name of the source
  category: "食" | "衣" | "住" | "行" | "超市";
  brand: string | null;
  image_url: string | null;
  expiry_text: string | null;
  labels: string | null;
  crawled_at: number; // Unix timestamp
  published_at: string | null;
  created_at: number; // Unix timestamp
}
```

## Adding UI Features

The frontend is in `web/src/`. Key files:

- `App.tsx` — main state management, routing, header
- `components/DealCard.tsx` — individual deal card rendering
- `components/BrandTags.tsx` — brand/source filter buttons
- `components/DealTypeFilter.tsx` — deal type filter (買一送一, x折, etc.)
- `components/SourceSubFilter.tsx` — source-specific sub-filters (e.g., Wellcome categories)
- `hooks/useDeals.ts` — data fetching hooks

The app supports dark mode via a `.dark` class on `<html>`. Use Tailwind classes and CSS variables from `index.css` for theming.

## Code Style

- TypeScript strict mode
- No unnecessary comments — code should be self-explanatory
- Keep parsers self-contained in their own files
- Reuse shared utilities from `worker/src/utils.ts`

## Submitting Changes

1. Fork the repo and create a feature branch
2. Make your changes
3. Test locally with both worker and frontend
4. Open a pull request with a clear description of what and why

## Reporting Issues

If you find incorrect categorisation, missing deals, or broken sources, please open an issue with:

- What you expected to see
- What you actually see
- The deal title or source URL if applicable

## Questions?

Use the contact form at https://discount.clawify.dev/?p=contact or open a GitHub issue.
