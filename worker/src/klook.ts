import type { Deal, Category } from './types';
import { extractBrand } from './brand';

const PROMO_PAGES: { url: string; category: Category }[] = [
  { url: 'https://www.klook.com/zh-HK/promo/klookhotelbuffet/', category: '食' },
];

const BASE = 'https://www.klook.com';

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

interface KlookDeal {
  activityId: string;
  url: string;
  title: string;
  rating: string | null;
  reviews: string | null;
  originalPrice: string | null;
  salePrice: string | null;
}

function parsePage(html: string): KlookDeal[] {
  const deals: KlookDeal[] = [];
  const linkRe = /<a[^>]*href="(\/zh-HK\/activity\/(\d+)-[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;

  while ((match = linkRe.exec(html)) !== null) {
    const url = match[1];
    const activityId = match[2];
    const inner = match[3];

    const text = decodeEntities(inner.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    if (text.length < 15) continue;

    const ratingMatch = text.match(/([\d.]+)\s*\([\d,]+則評價\)/);
    const reviewMatch = text.match(/\(([\d,]+)則評價\)/);
    const priceMatches = text.match(/HK\$\s*([\d,]+)\s+HK\$\s*([\d,]+)/);
    const singlePrice = !priceMatches ? text.match(/HK\$\s*([\d,]+)/) : null;

    const titleMatch = text.match(/^香港\s+(.+?)(?:\s+[\d.]+\s*\(|$)/);
    const title = titleMatch ? titleMatch[1].trim() : text.split(/\d\.\d/)[0].replace(/^香港\s+/, '').trim();

    deals.push({
      activityId,
      url,
      title: title.slice(0, 200),
      rating: ratingMatch ? ratingMatch[1] : null,
      reviews: reviewMatch ? reviewMatch[1] : null,
      originalPrice: priceMatches ? priceMatches[1] : null,
      salePrice: priceMatches ? priceMatches[2] : (singlePrice ? singlePrice[1] : null),
    });
  }

  return deals;
}

export async function fetchKlook(): Promise<Deal[]> {
  const deals: Deal[] = [];
  const seen = new Set<string>();
  const now = Math.floor(Date.now() / 1000);

  for (const { url, category } of PROMO_PAGES) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ho-lou-sou/1.0; RSS reader)',
          'Accept': 'text/html',
        },
      });
      if (!resp.ok) {
        console.error(`Klook ${url}: HTTP ${resp.status}`);
        continue;
      }

      const html = await resp.text();
      const parsed = parsePage(html);

      for (const item of parsed) {
        if (seen.has(item.activityId)) continue;
        seen.add(item.activityId);

        const { brand, cleanTitle } = extractBrand(item.title);
        const priceDesc = item.salePrice
          ? `HK$${item.salePrice}起${item.originalPrice ? ` (原價 HK$${item.originalPrice})` : ''}`
          : null;
        const ratingDesc = item.rating ? `${item.rating}星 (${item.reviews}則評價)` : '';
        const desc = [priceDesc, ratingDesc].filter(Boolean).join(' | ');

        deals.push({
          id: 'kl_' + item.activityId,
          title: cleanTitle,
          description: desc || null,
          source_url: BASE + item.url,
          source_name: 'Klook',
          category,
          brand,
          image_url: null,
          expiry_text: null,
          labels: 'klook',
          crawled_at: now,
          published_at: null,
          created_at: now,
        });
      }
    } catch (e) {
      console.error(`Klook fetch error:`, e);
    }
  }

  const images = await Promise.all(deals.map(async (d) => {
    try {
      const resp = await fetch(d.source_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HoLouSou/1.0)', 'Accept': 'text/html' },
        redirect: 'follow',
      });
      if (!resp.ok) return null;
      const html = await resp.text();
      const m = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
      return m?.[1] || null;
    } catch { return null; }
  }));
  for (let i = 0; i < deals.length; i++) deals[i].image_url = images[i];

  console.log(`Klook: fetched ${deals.length} deals from ${PROMO_PAGES.length} promo pages`);
  return deals;
}
