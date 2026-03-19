import type { Deal } from './types';
import { extractBrand } from './brand';
import { decodeEntities } from './utils';

const PAGES = [
  'https://www.circlek.hk/hotpicks/new',
  'https://www.circlek.hk/hotpicks/deals',
];

function parseItems(html: string, pageUrl: string): Deal[] {
  const deals: Deal[] = [];
  const now = Math.floor(Date.now() / 1000);

  // product_main blocks have title + caption; product_main_cheap blocks have only images + dates
  const itemRe = /<div class="product_main">\s*<div class="poster"><img src="([^"]*)"[^>]*\/><\/div>\s*<div class="title">([^<]*)<\/div>\s*<div class="caption">([^<]*(?:<[^>]*>[^<]*)*?)<\/div>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(html)) !== null) {
    const imgPath = m[1];
    const rawTitle = decodeEntities(m[2]).trim();
    const rawCaption = decodeEntities(m[3]).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    if (!rawTitle || rawTitle.length < 3) continue;

    const { brand, cleanTitle } = extractBrand(rawTitle);

    const idMatch = html.slice(m.index, m.index + 800).match(/shareToFacebook\([^,]*,'(\d+)'/);
    const itemId = idMatch ? `ck_${idMatch[1]}` : `ck_${rawTitle.slice(0, 30)}`;

    deals.push({
      id: itemId,
      title: cleanTitle.slice(0, 200),
      description: rawCaption.slice(0, 300) || null,
      source_url: pageUrl,
      source_name: 'Circle K',
      category: '超市',
      brand,
      image_url: imgPath.startsWith('http') ? imgPath : `https://www.circlek.hk${imgPath}`,
      expiry_text: null,
      labels: 'Circle K',
      crawled_at: now,
      published_at: null,
      created_at: now,
    });
  }

  // product_main_cheap blocks (deals page) — image-only promos with dates
  const cheapRe = /<div class="product_main_cheap">\s*<div class="poster"><img src="([^"]*)"[^>]*\/><\/div>\s*<div class="date">([^<]*)<\/div>\s*<a href="javascript:shareToFacebook\([^,]*,'(\d+)'/g;
  while ((m = cheapRe.exec(html)) !== null) {
    const imgPath = m[1];
    const dateText = decodeEntities(m[2]).trim();
    const itemId = `ck_${m[3]}`;

    if (deals.some(d => d.id === itemId)) continue;

    deals.push({
      id: itemId,
      title: `Circle K 優惠推介`,
      description: dateText || null,
      source_url: pageUrl,
      source_name: 'Circle K',
      category: '超市',
      brand: 'Circle K',
      image_url: imgPath.startsWith('http') ? imgPath : `https://www.circlek.hk${imgPath}`,
      expiry_text: dateText.replace('推廣期：', '') || null,
      labels: 'Circle K',
      crawled_at: now,
      published_at: null,
      created_at: now,
    });
  }

  return deals;
}

export async function fetchCircleK(): Promise<Deal[]> {
  const allDeals: Deal[] = [];

  for (const url of PAGES) {
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HoLouSou/1.0)' },
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const deals = parseItems(html, url);
      allDeals.push(...deals);
      console.log(`Circle K: fetched ${deals.length} deals from ${url.split('/').pop()}`);
    } catch (e) {
      console.error(`Circle K fetch error for ${url}:`, e);
    }
  }

  return allDeals;
}
