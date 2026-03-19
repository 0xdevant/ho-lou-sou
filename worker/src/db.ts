import type { Deal, Env } from './types';
import { getExcludeKeywords, getClickbaitPatterns } from './filter';

export async function upsertDeals(env: Env, deals: Deal[]): Promise<number> {
  let inserted = 0;
  const batchSize = 20;

  for (let i = 0; i < deals.length; i += batchSize) {
    const batch = deals.slice(i, i + batchSize);
    const stmts = batch.map(deal =>
      env.DB.prepare(
        `INSERT OR REPLACE INTO deals (id, title, description, source_url, source_name, category, brand, image_url, expiry_text, labels, crawled_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        deal.id,
        deal.title,
        deal.description,
        deal.source_url,
        deal.source_name,
        deal.category,
        deal.brand,
        deal.image_url,
        deal.expiry_text,
        deal.labels,
        deal.crawled_at,
        deal.published_at,
      )
    );
    await env.DB.batch(stmts);
    inserted += batch.length;
  }

  return inserted;
}

export async function getDeals(env: Env, opts: { category?: string; brand?: string; source?: string; limit?: number; offset?: number } = {}): Promise<Deal[]> {
  const { category, brand, source, limit = 50, offset = 0 } = opts;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (brand) {
    conditions.push('brand = ?');
    params.push(brand);
  }
  if (source) {
    conditions.push('source_name = ?');
    params.push(source);
  }

  let query = 'SELECT * FROM deals';
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY crawled_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await env.DB.prepare(query).bind(...params).all<Deal>();
  return result.results;
}

export async function getDealCounts(env: Env): Promise<Record<string, number>> {
  const result = await env.DB.prepare(
    'SELECT category, COUNT(*) as count FROM deals GROUP BY category'
  ).all<{ category: string; count: number }>();

  const counts: Record<string, number> = {};
  for (const row of result.results) {
    counts[row.category] = row.count;
  }
  return counts;
}

export async function getBrands(env: Env, category?: string): Promise<{ brand: string; count: number }[]> {
  let query = 'SELECT brand, COUNT(*) as count FROM deals WHERE brand IS NOT NULL';
  const params: unknown[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' GROUP BY brand ORDER BY count DESC';

  const result = await env.DB.prepare(query).bind(...params).all<{ brand: string; count: number }>();
  return result.results;
}

export async function cleanOldDeals(env: Env, maxAgeDays = 7): Promise<number> {
  const cutoff = Math.floor(Date.now() / 1000) - maxAgeDays * 86400;
  const result = await env.DB.prepare(
    'DELETE FROM deals WHERE crawled_at < ?'
  ).bind(cutoff).run();
  return result.meta.changes ?? 0;
}

/** Remove rows matching FILTER_EXCLUDE_KEYWORDS + FILTER_CLICKBAIT_PATTERNS (env only) */
export async function purgeExcludedDeals(env: Env): Promise<{
  deleted: number;
  keywordCount: number;
}> {
  const keywords = [
    ...new Set([...getExcludeKeywords(env), ...getClickbaitPatterns(env)]),
  ];
  if (keywords.length === 0) return { deleted: 0, keywordCount: 0 };
  let total = 0;
  for (const kw of keywords) {
    const like = `%${kw}%`;
    const r = await env.DB.prepare(
      `DELETE FROM deals WHERE title LIKE ? OR IFNULL(description,'') LIKE ? OR IFNULL(labels,'') LIKE ?`
    )
      .bind(like, like, like)
      .run();
    total += r.meta.changes ?? 0;
  }
  return { deleted: total, keywordCount: keywords.length };
}
