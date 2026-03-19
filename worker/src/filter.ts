import type { Deal, Env } from "./types";

/**
 * Filter keywords come only from Worker env (`FILTER_*`) or local `.dev.vars`.
 * Set in Cloudflare Dashboard → Variables / Secrets (not in source code).
 */

/** Dashboard / editors often paste curly quotes or `[a,b]` without JSON string quotes */
function normalizeKeywordEnv(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/[\u201C\u201D\uFF02]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

function parseKeywordList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const s = normalizeKeywordEnv(raw);
  try {
    const p = JSON.parse(s) as unknown;
    if (Array.isArray(p))
      return p.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    /* fall through */
  }
  if (s.startsWith("[") && s.endsWith("]")) {
    const inner = s.slice(1, -1).trim();
    if (inner)
      return inner
        .split(/[,\n]/)
        .map((x) => x.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    return [];
  }
  return s
    .split(/[,\n]/)
    .map((x) => x.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

/** From `FILTER_EXCLUDE_KEYWORDS` only */
export function getExcludeKeywords(env: Env): string[] {
  return [...new Set(parseKeywordList(env.FILTER_EXCLUDE_KEYWORDS))];
}

/** From `FILTER_CLICKBAIT_PATTERNS` only */
export function getClickbaitPatterns(env: Env): string[] {
  return [...new Set(parseKeywordList(env.FILTER_CLICKBAIT_PATTERNS))];
}

export function filterDeals(deals: Deal[], env: Env): Deal[] {
  const exclude = getExcludeKeywords(env);
  const clickbait = getClickbaitPatterns(env);
  return deals.filter((deal) => {
    const text = (
      deal.title +
      " " +
      (deal.description || "") +
      " " +
      (deal.labels || "")
    ).toLowerCase();
    if (exclude.some((kw) => text.includes(kw))) return false;
    if (clickbait.some((kw) => text.includes(kw))) return false;
    return true;
  });
}

const FIRST_PARTY_BRANDS: Record<string, string> = {
  uniqlo: "Uniqlo",
  惠康: "惠康",
  wellcome: "惠康",
  "circle k": "Circle K",
  ok便利店: "Circle K",
  aeon: "AEON",
  永旺: "AEON",
  麥當勞: "麥當勞",
  mcdonald: "麥當勞",
  萬寧: "萬寧",
  mannings: "萬寧",
};

const SOURCE_PRIORITY: Record<string, number> = {
  惠康: 10,
  "7-Eleven": 10,
  Uniqlo: 10,
  麥當勞: 10,
  萬寧: 10,
  Klook: 9,
  RunHotel: 8,
  GOtrip: 7,
  "Jetso Club": 6,
  Kongsolo: 5,
  "Circle K": 4,
  "Jetso Today": 3,
};

const FILLER_RE = /^(突發|快閃|限時|今期|最新|熱賣|勁爆|著數|獨家|重磅)/;

function stripTitle(title: string): string {
  return title
    .replace(
      /[【】「」\[\]►▶★☆●◆■□→⇒|｜│!！?？:：（）()～~#＃.,，。、\-\s]/g,
      "",
    )
    .replace(/[^\u4e00-\u9fff\w]/g, "")
    .toLowerCase()
    .replace(FILLER_RE, "");
}

function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function similarity(a: string, b: string): number {
  const sa = bigrams(a),
    sb = bigrams(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const bg of sa) if (sb.has(bg)) inter++;
  return inter / Math.min(sa.size, sb.size);
}

const AGGREGATORS = new Set([
  "Jetso Club",
  "Kongsolo",
  "Jetso Today",
  "GOtrip",
]);

export function deduplicateCrossSource(deals: Deal[]): Deal[] {
  const dominated = new Set<number>();
  const aggDeals = deals
    .map((d, i) => ({ d, i, stripped: stripTitle(d.title) }))
    .filter((x) => AGGREGATORS.has(x.d.source_name) && x.stripped.length >= 4);

  for (let i = 0; i < aggDeals.length; i++) {
    if (dominated.has(aggDeals[i].i)) continue;
    for (let j = i + 1; j < aggDeals.length; j++) {
      if (dominated.has(aggDeals[j].i)) continue;
      const sameSource =
        aggDeals[i].d.source_name === aggDeals[j].d.source_name;
      const sim = similarity(aggDeals[i].stripped, aggDeals[j].stripped);
      const threshold = sameSource ? 0.6 : 0.5;
      if (sim >= threshold) {
        if (sameSource) {
          const dropJ =
            aggDeals[i].d.title.length <= aggDeals[j].d.title.length;
          dominated.add(dropJ ? aggDeals[j].i : aggDeals[i].i);
        } else {
          const pi = SOURCE_PRIORITY[aggDeals[i].d.source_name] || 0;
          const pj = SOURCE_PRIORITY[aggDeals[j].d.source_name] || 0;
          dominated.add(pi >= pj ? aggDeals[j].i : aggDeals[i].i);
        }
      }
    }
  }
  return deals.filter((_, i) => !dominated.has(i));
}

export function deduplicateFirstParty(deals: Deal[]): Deal[] {
  const hasFirstParty = new Set<string>();
  for (const d of deals) {
    for (const [kw, brand] of Object.entries(FIRST_PARTY_BRANDS)) {
      if (d.source_name === brand) {
        hasFirstParty.add(kw);
      }
    }
  }
  if (hasFirstParty.size === 0) return deals;

  return deals.filter((d) => {
    for (const kw of hasFirstParty) {
      const brand = FIRST_PARTY_BRANDS[kw];
      if (d.source_name === brand) return true;
      const text = (d.title + " " + (d.brand || "")).toLowerCase();
      if (text.includes(kw)) return false;
    }
    return true;
  });
}
