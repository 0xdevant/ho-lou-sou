import type { Category, Deal } from './types';
import { extractBrand } from './brand';
import { decodeEntities } from './utils';

const CATEGORY_PAGES: { path: string; category: Category }[] = [
  { path: '/category/1', category: '食' },
  { path: '/category/2', category: '衣' },
  { path: '/category/3', category: '衣' },
  { path: '/category/5', category: '衣' },
  { path: '/category/11', category: '行' },
  { path: '/category/12', category: '超市' },
  { path: '/category/15', category: '行' },
  { path: '/category/17', category: '食' },
];

const BASE = 'https://www.kongsolo.com';

const DEAL_KEYWORDS = [
  '優惠', '折扣', '折', '減', '免費', '半價', '特價', '著數',
  '買一送一', '送', '賞', '抽獎', '回贈', '獎賞', '禮遇',
  'coupon', 'discount', 'free', 'offer', 'sale', 'off',
  '低至', '平', '慳', '抵', '獨家', '限定', '限時',
  '信用卡', '積分', '里數', '回饋', '消費券', '現金券',
  '自助餐', 'buffet', 'staycation', '套票',
];

function generateId(detailId: string): string {
  return 'ks_' + detailId;
}

function parsePage(html: string, category: Category): Deal[] {
  const deals: Deal[] = [];
  const now = Math.floor(Date.now() / 1000);

  const linkRe = /<a[^>]*href="\/detail\/(\d+)\/"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = linkRe.exec(html)) !== null) {
    const detailId = match[1];
    const rawTitle = decodeEntities(match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
    if (!rawTitle || rawTitle.length < 4) continue;
    const lower = rawTitle.toLowerCase();
    if (!DEAL_KEYWORDS.some(kw => lower.includes(kw))) continue;

    const afterLink = html.slice(match.index + match[0].length, match.index + match[0].length + 200);
    let expiryText: string | null = null;
    const expiryMatch = afterLink.match(/餘下(\d+)日/) || afterLink.match(/即將到期/);
    if (expiryMatch) {
      expiryText = expiryMatch[0];
    }

    const { brand, cleanTitle } = extractBrand(rawTitle);

    deals.push({
      id: generateId(detailId),
      title: cleanTitle.slice(0, 200),
      description: null,
      source_url: `${BASE}/detail/${detailId}/`,
      source_name: 'Kongsolo',
      category,
      brand,
      image_url: null,
      expiry_text: expiryText,
      labels: 'kongsolo',
      crawled_at: now,
      published_at: null,
      created_at: now,
    });
  }

  return deals;
}

export async function fetchKongsolo(): Promise<Deal[]> {
  const deals: Deal[] = [];
  const seen = new Set<string>();

  for (const { path, category } of CATEGORY_PAGES) {
    try {
      const resp = await fetch(`${BASE}${path}`, {
        headers: { 'User-Agent': 'ho-lou-sou/1.0' },
      });
      if (!resp.ok) {
        console.error(`Kongsolo ${path}: HTTP ${resp.status}`);
        continue;
      }

      const html = await resp.text();
      const parsed = parsePage(html, category);

      for (const deal of parsed) {
        if (seen.has(deal.id)) continue;
        seen.add(deal.id);
        deals.push(deal);
      }
    } catch (e) {
      console.error(`Kongsolo ${path} error:`, e);
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
      if (!m?.[1]) return null;
      const img = m[1];
      if (img.includes('default.jpg') || img.includes('logo')) return null;
      return img;
    } catch { return null; }
  }));
  for (let i = 0; i < deals.length; i++) deals[i].image_url = images[i];

  console.log(`Kongsolo: fetched ${deals.length} deals from ${CATEGORY_PAGES.length} pages`);
  return deals;
}
