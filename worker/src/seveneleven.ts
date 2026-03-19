import type { Deal } from './types';
import { decodeEntities } from './utils';

const BASE = 'https://www.7-eleven.com.hk';

function parsePage(html: string): Deal[] {
  const deals: Deal[] = [];
  const now = Math.floor(Date.now() / 1000);
  const seen = new Set<string>();

  const itemRe = /<div class="ware-item"[^>]*>.*?<a[^>]*href="([^"]+)".*?alt="([^"]+)".*?class="price"[^>]*>\$(\d+)/gs;
  let match;

  while ((match = itemRe.exec(html)) !== null) {
    const url = match[1];
    const rawTitle = decodeEntities(match[2].trim());
    const salePrice = match[3];

    const blockStart = Math.max(0, match.index);
    const block = html.slice(blockStart, match.index + match[0].length + 200);
    const oldMatch = block.match(/old-price"[^>]*>\s*\$(\d[\d,]*)/);

    if (!oldMatch) continue;

    const origPrice = oldMatch[1].replace(/,/g, '');
    if (parseInt(origPrice) <= parseInt(salePrice)) continue;

    const id = url.match(/\/i\/(\d+)/)?.[1] || rawTitle.slice(0, 20);
    if (seen.has(id)) continue;
    seen.add(id);

    const discount = Math.round((1 - parseInt(salePrice) / parseInt(origPrice)) * 100);
    const desc = `$${salePrice} (原價 $${origPrice}) 減${discount}%`;

    deals.push({
      id: '7e_' + id,
      title: rawTitle.slice(0, 200),
      description: desc,
      source_url: `${BASE}${url}`,
      source_name: '7-Eleven',
      category: '超市',
      brand: null,
      image_url: null,
      expiry_text: null,
      labels: '優惠,7-eleven',
      crawled_at: now,
      published_at: null,
      created_at: now,
    });
  }

  return deals;
}

export async function fetchSevenEleven(): Promise<Deal[]> {
  try {
    const resp = await fetch(`${BASE}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    if (!resp.ok) {
      console.error(`7-Eleven: HTTP ${resp.status}`);
      return [];
    }
    const html = await resp.text();
    const deals = parsePage(html);
    console.log(`7-Eleven: fetched ${deals.length} deals`);
    return deals;
  } catch (e) {
    console.error('7-Eleven error:', e);
    return [];
  }
}
