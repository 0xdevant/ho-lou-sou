#!/usr/bin/env npx tsx
/**
 * Standalone ingestion script — runs all free fetchers and POSTs results
 * to the Worker /api/ingest endpoint. Designed for GitHub Actions cron.
 *
 * Usage: npx tsx scripts/ingest.ts
 * Env:   API_URL (required), REFRESH_SECRET (optional)
 */

import { fetchRssFeeds } from '../worker/src/rss';
import { fetchKongsolo } from '../worker/src/kongsolo';
import { fetchKlook } from '../worker/src/klook';
import { fetchWellcome } from '../worker/src/wellcome';
import { fetchSevenEleven } from '../worker/src/seveneleven';
import { fetchGotrip } from '../worker/src/gotrip';
import { fetchAeon } from '../worker/src/aeon';
import { fetchCircleK } from '../worker/src/circlek';
import { fetchMcdonalds } from '../worker/src/mcdonalds';
import { JETSOCLUB_FEEDS, RUNHOTEL_FEED } from '../worker/src/sources';
import type { Deal } from '../worker/src/types';

const API_URL = process.env.API_URL || 'https://api-discount.clawify.dev';
const SECRET = process.env.REFRESH_SECRET || '';

interface FetcherResult {
  name: string;
  deals: Deal[];
  ms: number;
  error?: string;
}

async function runFetcher(name: string, fn: () => Promise<Deal[]>): Promise<FetcherResult> {
  const start = Date.now();
  try {
    const deals = await fn();
    return { name, deals, ms: Date.now() - start };
  } catch (e) {
    return { name, deals: [], ms: Date.now() - start, error: String(e) };
  }
}

async function main() {
  console.log(`Ingesting to ${API_URL}`);
  const t0 = Date.now();

  const results = await Promise.all([
    runFetcher('Jetso Club', () => fetchRssFeeds(JETSOCLUB_FEEDS)),
    runFetcher('RunHotel', () => fetchRssFeeds(RUNHOTEL_FEED)),
    runFetcher('Kongsolo', () => fetchKongsolo()),
    runFetcher('Klook', () => fetchKlook()),
    runFetcher('Wellcome', () => fetchWellcome()),
    runFetcher('7-Eleven', () => fetchSevenEleven()),
    runFetcher('GOtrip', () => fetchGotrip()),
    runFetcher('AEON', () => fetchAeon()),
    runFetcher('Circle K', () => fetchCircleK()),
    runFetcher('麥當勞', () => fetchMcdonalds()),
  ]);

  for (const r of results) {
    const status = r.error ? `ERROR: ${r.error}` : `${r.deals.length} deals`;
    console.log(`  ${r.name}: ${status} (${r.ms}ms)`);
  }

  const allDeals = results.flatMap(r => r.deals);
  console.log(`\nTotal: ${allDeals.length} deals fetched in ${Date.now() - t0}ms`);

  if (allDeals.length === 0) {
    console.error('No deals fetched — skipping ingest');
    process.exit(1);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (SECRET) headers['Authorization'] = `Bearer ${SECRET}`;

  const BATCH = 100;
  let totalInserted = 0;
  for (let i = 0; i < allDeals.length; i += BATCH) {
    const batch = allDeals.slice(i, i + BATCH);
    const resp = await fetch(`${API_URL}/api/ingest`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ deals: batch }),
    });

    const text = await resp.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      console.error(`Batch ${i / BATCH + 1}: HTTP ${resp.status} — non-JSON response (${text.slice(0, 200)})`);
      process.exit(1);
    }

    if (data.success) {
      console.log(`Batch ${i / BATCH + 1}: ${data.received} => ${data.filtered} filtered => ${data.inserted} upserted`);
      totalInserted += (data.inserted as number) || 0;
    } else {
      console.error(`Batch ${i / BATCH + 1} failed:`, data);
      process.exit(1);
    }
  }
  console.log(`Done — ${totalInserted} total upserted`);

}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
