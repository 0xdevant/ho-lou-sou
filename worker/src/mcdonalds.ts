import type { Deal } from './types';
import { decodeEntities } from './utils';

const HOME_URL = 'https://www.mcdonalds.com.hk/';
const PROMO_RE = /https:\/\/campaign\.mcdonalds\.com\.hk\/ch\/promotions\/[^"#\s]+/g;

function extractMeta(html: string, attr: string): string {
  const re = new RegExp(`<meta[^>]*(?:name|property)="${attr}"[^>]*content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : '';
}

function extractTitle(html: string): string {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : '';
}

export async function fetchMcdonalds(): Promise<Deal[]> {
  const homeResp = await fetch(HOME_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HoLouSou/1.0)' },
    redirect: 'follow',
  });
  if (!homeResp.ok) return [];
  const homeHtml = await homeResp.text();

  const urls = [...new Set(homeHtml.match(PROMO_RE) || [])];
  if (urls.length === 0) return [];

  const deals: Deal[] = [];
  const now = Math.floor(Date.now() / 1000);

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HoLouSou/1.0)' },
          redirect: 'follow',
        });
        if (!resp.ok) return null;
        return { url, html: await resp.text() };
      } catch {
        return null;
      }
    })
  );

  for (const r of results) {
    if (!r) continue;
    const title = extractTitle(r.html);
    const desc = extractMeta(r.html, 'description') || extractMeta(r.html, 'og:description');
    const image = extractMeta(r.html, 'og:image');

    if (!title || title.length < 5) continue;

    const slug = r.url.replace(/.*\/promotions\//, '').replace(/\/$/, '');
    deals.push({
      id: `mcd_${slug}`,
      title: title.slice(0, 200),
      description: desc.slice(0, 300) || null,
      source_url: r.url,
      source_name: '麥當勞',
      category: '食',
      brand: '麥當勞',
      image_url: image || null,
      expiry_text: null,
      labels: '麥當勞',
      crawled_at: now,
      published_at: null,
      created_at: now,
    });
  }

  console.log(`McDonald's: fetched ${deals.length} deals from ${urls.length} promo pages`);
  return deals;
}
