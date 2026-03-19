import type { Deal } from './types';
import { decodeEntities } from './utils';

const BASE = 'https://www.wellcome.com.hk';

function parsePage(html: string): Deal[] {
  const deals: Deal[] = [];
  const now = Math.floor(Date.now() / 1000);
  const seen = new Set<string>();

  const itemRe = /<div class="ware-item"[^>]*>.*?<a[^>]*href="([^"]+)".*?alt="([^"]+)".*?<div class="price-container"(.*?)<div class="(?:addCart|input-content)"/gs;
  let match;

  while ((match = itemRe.exec(html)) !== null) {
    const url = match[1];
    const title = decodeEntities(match[2].trim());
    const priceBlock = match[3];

    const oldMatch = priceBlock.match(/old-price[^>]*>\s*\$?([\d.]+)/);
    const newMatch = priceBlock.match(/class="price"[^>]*>\$([\d]+)/);
    const decMatch = priceBlock.match(/price-small[^>]*>\.([\d]+)/);
    const tagMatch = priceBlock.match(/price-tag[^>]*>([^<]+)/);

    if (!newMatch || !oldMatch) continue;

    const salePrice = `${newMatch[1]}.${decMatch ? decMatch[1] : '00'}`;
    const oldPrice = oldMatch[1];
    const tag = tagMatch ? tagMatch[1].trim() : null;

    const id = url.match(/\/i\/(\d+)/)?.[1] || title.slice(0, 20);
    if (seen.has(id)) continue;
    seen.add(id);

    const priceParts = [`$${salePrice} (原價 $${oldPrice})`];
    if (tag) priceParts.push(tag);

    deals.push({
      id: 'wc_' + id,
      title: title.slice(0, 200),
      description: priceParts.join(' '),
      source_url: `${BASE}${url}`,
      source_name: '惠康',
      category: '超市',
      brand: null,
      image_url: null,
      expiry_text: null,
      labels: '優惠,wellcome',
      crawled_at: now,
      published_at: null,
      created_at: now,
    });
  }

  return deals;
}

export async function fetchWellcome(): Promise<Deal[]> {
  try {
    const resp = await fetch(`${BASE}/zh-hant`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    if (!resp.ok) {
      console.error(`Wellcome: HTTP ${resp.status}`);
      return [];
    }
    const html = await resp.text();
    const deals = parsePage(html);
    console.log(`Wellcome: fetched ${deals.length} deals`);
    return deals;
  } catch (e) {
    console.error('Wellcome error:', e);
    return [];
  }
}
