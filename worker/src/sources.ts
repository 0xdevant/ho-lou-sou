import type { Category, SourceConfig } from "./types";

const JETSOCLUB_CATEGORY_MAP: Record<string, Category> = {
  飲食: "食",
  自助餐: "食",
  "超市/便利店": "超市",
  服飾: "衣",
  美容化妝: "衣",
  百貨公司: "衣",
  旅游或活動: "行",
  "旅游/活動": "行",
  機票: "行",
  交通或通訊: "行",
  娛樂購物: "衣",
  網購: "衣",
  銀行或信用卡: "食",
  電器: "衣",
  開倉: "衣",
};

export const JETSOCLUB_FEEDS: SourceConfig = {
  name: "Jetso Club",
  type: "rss",
  urls: [
    "https://www.jetsoclub.com/feeds/posts/default/-/飲食?alt=rss&max-results=25",
    "https://www.jetsoclub.com/feeds/posts/default/-/超市%2F便利店?alt=rss&max-results=25",
    "https://www.jetsoclub.com/feeds/posts/default/-/服飾?alt=rss&max-results=15",
    "https://www.jetsoclub.com/feeds/posts/default/-/旅游或活動?alt=rss&max-results=15",
    "https://www.jetsoclub.com/feeds/posts/default/-/機票?alt=rss&max-results=15",
    "https://www.jetsoclub.com/feeds/posts/default/-/自助餐?alt=rss&max-results=15",
    "https://www.jetsoclub.com/feeds/posts/default/-/百貨公司?alt=rss&max-results=10",
    "https://www.jetsoclub.com/feeds/posts/default/-/開倉?alt=rss&max-results=10",
  ],
  render: false,
  limit: 0,
  categoryMap: JETSOCLUB_CATEGORY_MAP,
  defaultCategory: "食",
};

const RUNHOTEL_CATEGORY_MAP: Record<string, Category> = {
  酒店優惠: "住",
  自助餐: "食",
  自助餐優惠: "食",
  酒店餐飲優惠: "食",
  最新消息: "住",
  信用卡: "食",
  Staycation: "住",
};

export const RUNHOTEL_FEED: SourceConfig = {
  name: "RunHotel",
  type: "rss",
  urls: ["https://www.runhotel.hk/feed/"],
  render: false,
  limit: 0,
  categoryMap: RUNHOTEL_CATEGORY_MAP,
  defaultCategory: "住",
};

export const CRAWL_SOURCES: SourceConfig[] = [
  {
    name: "Jetso Today",
    type: "crawl",
    urls: ["https://www.jetsotoday.com/"],
    render: false,
    limit: 40,
    categoryMap: JETSOCLUB_CATEGORY_MAP,
    defaultCategory: "食",
  },
  {
    name: "Uniqlo",
    type: "crawl",
    urls: ["https://www.uniqlo.com.hk/zh_HK/"],
    render: true,
    limit: 20,
    categoryMap: {},
    defaultCategory: "衣",
    includePatterns: ["https://www.uniqlo.com.hk/**"],
  },
  // Pending consent from HSBC – re-enable once approved
  // {
  //   name: "HSBC",
  //   type: "crawl",
  //   urls: ["https://www.redhotoffers.hsbc.com.hk/tc/yro/"],
  //   render: true,
  //   limit: 30,
  //   categoryMap: {},
  //   defaultCategory: "食",
  //   includePatterns: ["https://www.redhotoffers.hsbc.com.hk/**"],
  // },
  {
    name: "萬寧",
    type: "crawl",
    urls: ["https://www.mannings.com.hk/zh-hant/promotions"],
    render: true,
    limit: 30,
    categoryMap: {},
    defaultCategory: "超市",
    includePatterns: ["https://www.mannings.com.hk/**"],
  },
];
