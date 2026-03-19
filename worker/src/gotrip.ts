import type { Deal, Category } from './types';
import { extractBrand } from './brand';

const BASE = 'https://www.gotrip.hk';

const CATEGORY_PAGES: { url: string; category: Category; name: string }[] = [
  { url: `${BASE}/tag/staycation/`, category: '住', name: 'Staycation' },
  { url: `${BASE}/%e9%a6%99%e6%b8%af%e9%85%92%e5%ba%97/`, category: '住', name: '香港酒店' },
  { url: `${BASE}/%e6%97%85%e9%81%8ajetso/`, category: '行', name: '旅遊Jetso' },
];

const PRICE_KEYWORDS = [
  '低至', '人均$', '人均hk$', '/位', '/晚',
  '折', '減$', '半價', '買一送一', '送一',
  '特價', '勁減', '激減',
  '$1,', '$2,', '$3,', '$4,', '$5,', '$6,', '$7,', '$8,', '$9,',
];

const PRICE_RE = /\$\d|hk\$\d|\d+折|\d+%\s*off/i;

function decodeHtml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

function isDeal(title: string): boolean {
  const lower = title.toLowerCase();
  if (PRICE_RE.test(lower)) return true;
  return PRICE_KEYWORDS.some(kw => lower.includes(kw));
}

function generateId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash |= 0;
  }
  return 'gt_' + Math.abs(hash).toString(36);
}

function parsePage(html: string, category: Category): Deal[] {
  const deals: Deal[] = [];
  const now = Math.floor(Date.now() / 1000);

  const linkRe = /<a[^>]*href="(https:\/\/www\.gotrip\.hk\/[^"]*)"[^>]*>([^<]{10,})<\/a>/g;
  let match;

  while ((match = linkRe.exec(html)) !== null) {
    const url = match[1];
    const rawTitle = decodeHtml(match[2].trim());

    if (url.includes('/tag/') || url.includes('/category/') || url.includes('/page/') || url.includes('/awards/')) continue;
    if (rawTitle.length < 8) continue;
    if (!isDeal(rawTitle)) continue;

    const id = generateId(url);
    const { brand, cleanTitle } = extractBrand(rawTitle);

    deals.push({
      id,
      title: cleanTitle.slice(0, 200),
      description: null,
      source_url: url,
      source_name: 'GOtrip',
      category,
      brand,
      image_url: null,
      expiry_text: null,
      labels: 'gotrip',
      crawled_at: now,
      published_at: null,
      created_at: now,
    });
  }

  return deals;
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HoLouSou/1.0)', 'Accept': 'text/html' },
      redirect: 'follow',
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    const m = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    return m?.[1] || null;
  } catch {
    return null;
  }
}

export async function fetchGotrip(): Promise<Deal[]> {
  const allDeals: Deal[] = [];
  const seen = new Set<string>();

  for (const page of CATEGORY_PAGES) {
    try {
      const resp = await fetch(page.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
      });
      if (!resp.ok) {
        console.error(`GOtrip ${page.name}: HTTP ${resp.status}`);
        continue;
      }

      const html = await resp.text();
      const deals = parsePage(html, page.category);

      for (const d of deals) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          allDeals.push(d);
        }
      }
    } catch (e) {
      console.error(`GOtrip ${page.name} error:`, e);
    }
  }

  const images = await Promise.all(allDeals.map(d => fetchOgImage(d.source_url)));
  for (let i = 0; i < allDeals.length; i++) {
    allDeals[i].image_url = images[i];
  }

  console.log(`GOtrip: fetched ${allDeals.length} deals`);
  return allDeals;
}
