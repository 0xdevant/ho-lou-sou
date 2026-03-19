import type { Deal } from './types';
import { decodeEntities } from './utils';

const BASE = 'https://www.aeonstores.com.hk';

function parsePage(html: string): Deal[] {
  const deals: Deal[] = [];
  const now = Math.floor(Date.now() / 1000);
  const seen = new Set<string>();

  const itemRe = /<div class="item (activity|card)">\s*<p class="title">([^<]*)<\/p>[\s\S]*?<a[^>]*href="(\/promotion\/download\?id=(\d+)[^"]*)"[^>]*><img[^>]*alt="([^"]*)"[^>]*>/g;
  let match;

  while ((match = itemRe.exec(html)) !== null) {
    const type = match[1];
    const promoId = match[4];
    const title = decodeEntities(match[5].trim());
    const downloadUrl = match[3];
    const imageUrl = downloadUrl.replace('f=file_chk', 'f=image_chk');

    if (!title || title.length < 3) continue;
    if (seen.has(promoId)) continue;
    seen.add(promoId);

    const skipPatterns = ['全年優惠', '免息分期', '黃色小票', '賺積分'];
    if (skipPatterns.some(p => title.includes(p))) continue;

    deals.push({
      id: `aeon_${promoId}`,
      title: title.slice(0, 200),
      description: type === 'card' ? '會員尊享優惠' : 'AEON 推廣活動',
      source_url: `${BASE}${downloadUrl}`,
      source_name: 'AEON',
      category: '超市',
      brand: 'AEON',
      image_url: `${BASE}/promotion/download?id=${promoId}&q[id_eq]=${promoId}&f=image_chk`,
      expiry_text: null,
      labels: '優惠,aeon',
      crawled_at: now,
      published_at: null,
      created_at: now,
    });
  }

  return deals;
}

export async function fetchAeon(): Promise<Deal[]> {
  try {
    const resp = await fetch(`${BASE}/promotion`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    if (!resp.ok) {
      console.error(`AEON: HTTP ${resp.status}`);
      return [];
    }
    const html = await resp.text();
    const deals = parsePage(html);
    console.log(`AEON: fetched ${deals.length} deals`);
    return deals;
  } catch (e) {
    console.error('AEON error:', e);
    return [];
  }
}
