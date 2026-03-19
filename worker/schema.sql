DROP TABLE IF EXISTS deals;

CREATE TABLE deals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  expiry_text TEXT,
  labels TEXT,
  crawled_at INTEGER NOT NULL,
  published_at TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_deals_category ON deals(category);
CREATE INDEX idx_deals_crawled ON deals(crawled_at DESC);
CREATE INDEX idx_deals_source ON deals(source_name);
CREATE INDEX idx_deals_brand ON deals(brand);
CREATE INDEX idx_deals_cat_crawled ON deals(category, crawled_at DESC);
CREATE INDEX idx_deals_source_cat ON deals(source_name, category);
