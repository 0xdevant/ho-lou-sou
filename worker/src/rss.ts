import type { Category, Deal, SourceConfig } from './types';
import { extractBrand } from './brand';

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  categories: string[];
}

function extractText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(re);
  if (!match) return '';
  let text = match[1];
  // Handle CDATA
  const cdata = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdata) text = cdata[1];
  return text.trim();
}

function extractAllText(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g');
  const results: string[] = [];
  let match;
  while ((match = re.exec(xml)) !== null) {
    let text = match[1];
    const cdata = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    if (cdata) text = cdata[1];
    results.push(text.trim());
  }
  return results;
}

function extractFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return match ? match[1] : null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      title: extractText(itemXml, 'title'),
      link: extractText(itemXml, 'link'),
      description: extractText(itemXml, 'description'),
      pubDate: extractText(itemXml, 'pubDate'),
      categories: extractAllText(itemXml, 'category'),
    });
  }
  return items;
}

function categorizeItem(categories: string[], categoryMap: Record<string, Category>, defaultCategory: Category): Category {
  for (const cat of categories) {
    if (categoryMap[cat]) return categoryMap[cat];
  }
  return defaultCategory;
}

function generateId(prefix: string, url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return prefix + Math.abs(hash).toString(36);
}

export async function fetchRssFeeds(config: SourceConfig): Promise<Deal[]> {
  const deals: Deal[] = [];
  const seen = new Set<string>();
  const now = Math.floor(Date.now() / 1000);
  const prefix = config.name.slice(0, 2).toLowerCase() + '_';

  for (const feedUrl of config.urls) {
    try {
      const resp = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ho-lou-sou/1.0; RSS reader)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      });
      if (!resp.ok) {
        console.error(`RSS ${config.name} HTTP ${resp.status} for ${feedUrl}`);
        continue;
      }

      const xml = await resp.text();
      const items = parseRssItems(xml);

      for (const item of items) {
        if (seen.has(item.link)) continue;
        seen.add(item.link);

        const category = categorizeItem(item.categories, config.categoryMap, config.defaultCategory);
        const imageUrl = extractFirstImage(item.description);
        const desc = stripHtml(item.description).slice(0, 300);
        const { brand, cleanTitle } = extractBrand(item.title);

        deals.push({
          id: generateId(prefix, item.link),
          title: cleanTitle,
          description: desc || null,
          source_url: item.link,
          source_name: config.name,
          category,
          brand,
          image_url: imageUrl,
          expiry_text: null,
          labels: item.categories.join(','),
          crawled_at: now,
          published_at: item.pubDate || null,
          created_at: now,
        });
      }
    } catch (e) {
      console.error(`Failed to fetch feed ${feedUrl}:`, e);
    }
  }

  return deals;
}
