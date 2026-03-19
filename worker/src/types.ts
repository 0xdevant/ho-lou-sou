export interface Env {
  DB: D1Database;
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
  WORKER_ENV: string;
  RESEND_API_KEY?: string;
  REFRESH_SECRET?: string;
  /** JSON array or comma-separated exclude keywords (title/description/labels) */
  FILTER_EXCLUDE_KEYWORDS?: string;
  /** JSON array or comma-separated clickbait substrings to drop */
  FILTER_CLICKBAIT_PATTERNS?: string;
}

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  source_url: string;
  source_name: string;
  category: string;
  brand: string | null;
  image_url: string | null;
  expiry_text: string | null;
  labels: string | null;
  crawled_at: number;
  published_at: string | null;
  created_at: number;
}

export type Category = "食" | "衣" | "住" | "行" | "超市";

export interface CrawlJobResponse {
  success: boolean;
  result: string;
  errors?: { message: string }[];
}

export interface CrawlResultResponse {
  success: boolean;
  result: {
    id: string;
    status:
      | "completed"
      | "running"
      | "errored"
      | "cancelled_due_to_limits"
      | "cancelled_by_user"
      | "cancelled_due_to_timeout";
    browserSecondsUsed: number;
    total: number;
    finished: number;
    skipped?: number;
    cursor?: number;
    records: CrawlRecord[];
  };
}

export interface CrawlRecord {
  url: string;
  status:
    | "completed"
    | "queued"
    | "disallowed"
    | "skipped"
    | "errored"
    | "cancelled";
  markdown?: string;
  metadata?: {
    status: number;
    title: string;
    url: string;
    lastModified?: string;
  };
}

export interface SourceConfig {
  name: string;
  type: "rss" | "crawl" | "direct";
  urls: string[];
  render: boolean;
  limit: number;
  categoryMap: Record<string, Category>;
  defaultCategory: Category;
  includePatterns?: string[];
}
