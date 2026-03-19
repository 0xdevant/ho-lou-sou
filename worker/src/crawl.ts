import type { Env, Deal, SourceConfig, CrawlJobResponse, CrawlResultResponse, Category } from './types';
import { extractBrand } from './brand';

export async function startCrawlJob(env: Env, source: SourceConfig): Promise<string | null> {
  const url = source.urls[0];
  const body: Record<string, unknown> = {
    url,
    render: source.render,
    limit: source.limit,
    formats: ['markdown'],
    rejectResourceTypes: ['image', 'media', 'font', 'stylesheet'],
  };
  if (source.includePatterns) {
    body.options = { includePatterns: source.includePatterns };
  }

  try {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/crawl`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    const data = await resp.json() as CrawlJobResponse;
    if (data.success) {
      console.log(`Crawl job started for ${source.name}: ${data.result}`);
      return data.result;
    }
    console.error(`Crawl job failed for ${source.name}:`, data.errors);
    return null;
  } catch (e) {
    console.error(`Crawl request error for ${source.name}:`, e);
    return null;
  }
}

export async function pollCrawlJob(env: Env, jobId: string): Promise<CrawlResultResponse | null> {
  try {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/crawl/${jobId}?status=completed`,
      {
        headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` },
      }
    );
    return await resp.json() as CrawlResultResponse;
  } catch (e) {
    console.error(`Poll error for job ${jobId}:`, e);
    return null;
  }
}

function guessCategory(title: string, markdown: string, source: SourceConfig): Category {
  const text = (title + ' ' + markdown).toLowerCase();

  const foodKeywords = ['餐', '食', '飲', '麥當勞', 'mcdonald', 'kfc', '壽司', '拉麵', '咖啡', 'coffee', '茶', '奶', '雞', '牛', '飯', '麵', '蛋糕', '甜品', '雪糕', '便當', '早餐', '午餐', '晚餐', '堂食', '外賣'];
  const superKeywords = ['超市', '便利', '7-eleven', 'circle k', 'ok便利', '百佳', '惠康', '萬寧', '屈臣氏', '759', '阿信屋', '家樂福'];
  const travelKeywords = ['機票', '航空', 'express', '酒店', 'hotel', '旅遊', '旅行', 'travel', 'flight', 'klook', 'kkday', 'staycation', '自由行'];
  const clothKeywords = ['服飾', '時裝', 'fashion', 'uniqlo', 'zara', 'h&m', '開倉', '百貨', 'sale', '折扣', '潮物', '鞋', '手袋'];
  const homeKeywords = ['住宿', '酒店', 'hotel', 'staycation', 'airbnb', '公寓', '度假'];

  if (homeKeywords.some(k => text.includes(k))) return '住';
  if (travelKeywords.some(k => text.includes(k))) return '行';
  if (superKeywords.some(k => text.includes(k))) return '超市';
  if (clothKeywords.some(k => text.includes(k))) return '衣';
  if (foodKeywords.some(k => text.includes(k))) return '食';

  return source.defaultCategory;
}

function generateCrawlId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'cr_' + Math.abs(hash).toString(36);
}

export function parseCrawlRecords(result: CrawlResultResponse, source: SourceConfig): Deal[] {
  const deals: Deal[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (const record of result.result.records) {
    if (record.status !== 'completed' || !record.markdown) continue;

    const title = record.metadata?.title?.replace(/\n/g, '').trim() || '';
    if (!title || title.length < 5) continue;

    const category = guessCategory(title, record.markdown.slice(0, 500), source);
    const desc = record.markdown
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#*_~`>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);
    const { brand, cleanTitle } = extractBrand(title);

    deals.push({
      id: generateCrawlId(record.url),
      title: cleanTitle.slice(0, 200),
      description: desc || null,
      source_url: record.url,
      source_name: source.name,
      category,
      brand,
      image_url: null,
      expiry_text: null,
      labels: source.name,
      crawled_at: now,
      published_at: record.metadata?.lastModified || null,
      created_at: now,
    });
  }

  return deals;
}
