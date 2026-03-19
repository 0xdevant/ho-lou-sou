import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env, Deal } from "./types";
import {
  getDeals,
  getDealCounts,
  getBrands,
  upsertDeals,
  cleanOldDeals,
  purgeExcludedDeals,
} from "./db";
import { fetchRssFeeds } from "./rss";
import { startCrawlJob, pollCrawlJob, parseCrawlRecords } from "./crawl";
import { fetchKongsolo } from "./kongsolo";
import { fetchKlook } from "./klook";
import { fetchWellcome } from "./wellcome";
import { fetchSevenEleven } from "./seveneleven";
import { fetchGotrip } from "./gotrip";
import { fetchAeon } from "./aeon";
import { fetchCircleK } from "./circlek";
import { fetchMcdonalds } from "./mcdonalds";
import {
  filterDeals,
  deduplicateFirstParty,
  deduplicateCrossSource,
} from "./filter";
import { JETSOCLUB_FEEDS, RUNHOTEL_FEED, CRAWL_SOURCES } from "./sources";

type HonoEnv = { Bindings: Env };

const app = new Hono<HonoEnv>();

app.use(
  "/*",
  cors({
    origin: (origin) => {
      const allowed = [
        "https://discount.clawify.dev",
        "https://api-discount.clawify.dev",
        "http://localhost:5173",
        "http://localhost:4173",
      ];
      return allowed.includes(origin) ? origin : "https://discount.clawify.dev";
    },
    allowMethods: ["GET", "POST"],
  }),
);

app.use("/api/*", async (c, next) => {
  await next();
  if (c.req.method === "GET" && c.res.status === 200) {
    c.res.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600",
    );
  }
});

app.get("/api/deals", async (c) => {
  const category = c.req.query("category");
  const brand = c.req.query("brand");
  const source = c.req.query("source");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = parseInt(c.req.query("offset") || "0");
  const deals = await getDeals(c.env, {
    category: category || undefined,
    brand: brand || undefined,
    source: source || undefined,
    limit,
    offset,
  });
  return c.json({
    success: true,
    deals: interleaveDeals(deals),
    count: deals.length,
  });
});

function interleaveDeals(deals: Deal[]): Deal[] {
  const VALUABLE = new Set([
    "麥當勞",
    "Klook",
    "惠康",
    "萬寧",
    "7-Eleven",
    "Circle K",
    "AEON",
  ]);
  const premium: Deal[] = [];
  const rest: Deal[] = [];
  for (const d of deals) {
    (VALUABLE.has(d.source_name) ? premium : rest).push(d);
  }
  if (premium.length === 0 || rest.length === 0) return deals;
  const result: Deal[] = [];
  const ratio = Math.max(1, Math.floor(rest.length / premium.length));
  let pi = 0,
    ri = 0;
  while (pi < premium.length || ri < rest.length) {
    if (pi < premium.length) result.push(premium[pi++]);
    for (let n = 0; n < ratio && ri < rest.length; n++) result.push(rest[ri++]);
  }
  return result;
}

app.get("/api/init", async (c) => {
  const category = c.req.query("category");
  const [counts, brands, sourcesResult] = await Promise.all([
    getDealCounts(c.env),
    getBrands(c.env, category || undefined),
    (() => {
      let query = "SELECT source_name, COUNT(*) as count FROM deals";
      const binds: string[] = [];
      if (category) {
        query += " WHERE category = ?";
        binds.push(category);
      }
      query += " GROUP BY source_name ORDER BY count DESC";
      return c.env.DB.prepare(query)
        .bind(...binds)
        .all<{ source_name: string; count: number }>();
    })(),
  ]);
  const categories = [
    { id: "食", label: "飲食", icon: "🍜", count: counts["食"] || 0 },
    { id: "衣", label: "服飾購物", icon: "👔", count: counts["衣"] || 0 },
    { id: "住", label: "住宿酒店", icon: "🏨", count: counts["住"] || 0 },
    { id: "行", label: "機票旅遊", icon: "✈️", count: counts["行"] || 0 },
    { id: "超市", label: "超市便利店", icon: "🛒", count: counts["超市"] || 0 },
  ];
  return c.json({
    success: true,
    categories,
    brands,
    sources: sourcesResult.results,
  });
});

app.get("/api/categories", async (c) => {
  const counts = await getDealCounts(c.env);
  const categories = [
    { id: "食", label: "飲食", icon: "🍜", count: counts["食"] || 0 },
    { id: "衣", label: "服飾購物", icon: "👔", count: counts["衣"] || 0 },
    { id: "住", label: "住宿酒店", icon: "🏨", count: counts["住"] || 0 },
    { id: "行", label: "機票旅遊", icon: "✈️", count: counts["行"] || 0 },
    { id: "超市", label: "超市便利店", icon: "🛒", count: counts["超市"] || 0 },
  ];
  return c.json({ success: true, categories });
});

app.get("/api/brands", async (c) => {
  const category = c.req.query("category");
  const brands = await getBrands(c.env, category || undefined);
  return c.json({ success: true, brands });
});

app.get("/api/sources", async (c) => {
  const category = c.req.query("category");
  let query = "SELECT source_name, COUNT(*) as count FROM deals";
  const binds: string[] = [];
  if (category) {
    query += " WHERE category = ?";
    binds.push(category);
  }
  query += " GROUP BY source_name ORDER BY count DESC";
  const result = await c.env.DB.prepare(query)
    .bind(...binds)
    .all<{ source_name: string; count: number }>();
  return c.json({ success: true, sources: result.results });
});

app.get("/api/search", async (c) => {
  const q = c.req.query("q") || "";
  if (q.length < 2) return c.json({ success: true, deals: [], count: 0 });

  const result = await c.env.DB.prepare(
    `SELECT * FROM deals WHERE title LIKE ? OR description LIKE ? OR brand LIKE ? ORDER BY crawled_at DESC LIMIT 50`,
  )
    .bind(`%${q}%`, `%${q}%`, `%${q}%`)
    .all();

  return c.json({
    success: true,
    deals: result.results,
    count: result.results.length,
  });
});

app.post("/api/contact", async (c) => {
  try {
    const recent = await c.env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM contact_messages WHERE created_at > ?",
    )
      .bind(Math.floor(Date.now() / 1000) - 3600)
      .first<{ cnt: number }>();
    if (recent && recent.cnt >= 10)
      return c.json({ success: false, error: "提交太頻繁，請稍後再試" }, 429);

    const { name, email, message } = await c.req.json<{
      name: string;
      email: string;
      message: string;
    }>();
    if (!name || !email || !message)
      return c.json({ success: false, error: "Missing fields" }, 400);
    if (message.length > 2000)
      return c.json({ success: false, error: "Message too long" }, 400);
    await c.env.DB.prepare(
      "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)",
    )
      .bind(name.slice(0, 100), email.slice(0, 200), message.slice(0, 2000))
      .run();

    if (c.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "好路數 <noreply@clawify.dev>",
          to: "contact@clawify.dev",
          subject: `好路數 新訊息 - ${name}`,
          text: `由: ${name}\nEmail: ${email}\n\n${message}`,
        }),
      }).catch(() => {});
    }

    return c.json({ success: true });
  } catch {
    return c.json({ success: false, error: "Failed to submit" }, 500);
  }
});

app.get("/api/messages", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 50",
  ).all();
  return c.json({ success: true, messages: result.results });
});

app.get("/api/health", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT source_name, COUNT(*) as count, MAX(crawled_at) as latest
     FROM deals GROUP BY source_name ORDER BY count DESC`,
  ).all<{ source_name: string; count: number; latest: number }>();
  const now = Math.floor(Date.now() / 1000);
  const sources = result.results.map((r) => ({
    source: r.source_name,
    count: r.count,
    latest_ago_hours: Math.round(((now - r.latest) / 3600) * 10) / 10,
    healthy: now - r.latest < 86400 * 2,
  }));
  const totalDeals = sources.reduce((s, r) => s + r.count, 0);
  const allHealthy = sources.every((s) => s.healthy);
  return c.json({
    status: allHealthy ? "ok" : "degraded",
    totalDeals,
    sources,
  });
});

app.post("/api/ingest", async (c) => {
  const secret = c.env.REFRESH_SECRET;
  if (secret) {
    const auth = c.req.header("Authorization");
    if (auth !== `Bearer ${secret}`)
      return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  try {
    const { deals } = await c.req.json<{ deals: Deal[] }>();
    if (!Array.isArray(deals))
      return c.json({ success: false, error: "Invalid payload" }, 400);
    const filtered = deduplicateCrossSource(
      deduplicateFirstParty(filterDeals(deals, c.env)),
    );
    const inserted = await upsertDeals(c.env, filtered);
    console.log(
      `Ingest: received ${deals.length} => ${filtered.length} after filter/dedup => ${inserted} upserted`,
    );
    return c.json({
      success: true,
      received: deals.length,
      filtered: filtered.length,
      inserted,
    });
  } catch (e) {
    return c.json({ success: false, error: "Invalid payload" }, 400);
  }
});

app.post("/api/refresh", async (c) => {
  const secret = c.env.REFRESH_SECRET;
  if (secret) {
    const auth = c.req.header("Authorization");
    if (auth !== `Bearer ${secret}`)
      return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  const results = await runFeedIngestion(c.env);
  return c.json({ success: true, ...results });
});

/** Remove DB rows matching getExcludeKeywords(env) */
app.post("/api/purge-excluded", async (c) => {
  const secret = c.env.REFRESH_SECRET;
  if (secret) {
    const auth = c.req.header("Authorization");
    if (auth !== `Bearer ${secret}`)
      return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  const { deleted, keywordCount } = await purgeExcludedDeals(c.env);
  return c.json({ success: true, deleted, keywordCount });
});

type SourceCounts = Record<string, number>;

async function fetchAllFreeDeals(env: Env): Promise<{
  deals: Deal[];
  sources: SourceCounts;
}> {
  const fetchers = [
    { key: "jc", fn: () => fetchRssFeeds(JETSOCLUB_FEEDS) },
    { key: "rh", fn: () => fetchRssFeeds(RUNHOTEL_FEED) },
    { key: "ks", fn: fetchKongsolo },
    { key: "kl", fn: fetchKlook },
    { key: "wc", fn: fetchWellcome },
    { key: "se", fn: fetchSevenEleven },
    { key: "gt", fn: fetchGotrip },
    { key: "ae", fn: fetchAeon },
    { key: "ck", fn: fetchCircleK },
    { key: "mc", fn: fetchMcdonalds },
  ];

  const results = await Promise.all(fetchers.map((f) => f.fn()));
  const filtered = results.map((r) => filterDeals(r, env));
  const sources: SourceCounts = {};
  fetchers.forEach((f, i) => {
    sources[f.key] = filtered[i].length;
  });
  const combined = filtered.flat();
  const deals = deduplicateCrossSource(deduplicateFirstParty(combined));
  console.log(`Fetched ${combined.length} => ${deals.length} after dedup`);
  return { deals, sources };
}

async function runFeedIngestion(env: Env) {
  console.log("Starting feed ingestion...");
  const { deals, sources } = await fetchAllFreeDeals(env);
  const inserted = await upsertDeals(env, deals);

  const crawlResults: string[] = [];
  for (const source of CRAWL_SOURCES) {
    const jobId = await startCrawlJob(env, source);
    if (jobId) crawlResults.push(`${source.name}: job ${jobId}`);
    await new Promise((r) => setTimeout(r, 11000));
  }

  const cleaned = await cleanOldDeals(env);
  return { inserted, sources, crawlJobs: crawlResults, cleaned };
}

async function runCrawlPoll(env: Env) {
  for (const source of CRAWL_SOURCES) {
    const jobId = await startCrawlJob(env, source);
    if (!jobId) continue;

    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise((r) => setTimeout(r, 10000));
      const result = await pollCrawlJob(env, jobId);
      if (!result) continue;

      if (result.result.status !== "running") {
        if (result.result.status === "completed") {
          const deals = filterDeals(parseCrawlRecords(result, source), env);
          console.log(`Parsed ${deals.length} deals from ${source.name}`);
          await upsertDeals(env, deals);
        } else {
          console.error(
            `Crawl job ${jobId} for ${source.name}: ${result.result.status}`,
          );
        }
        break;
      }
    }

    await new Promise((r) => setTimeout(r, 11000));
  }
}

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const trigger = event.cron;
    console.log(`Cron triggered: ${trigger}`);

    if (trigger === "0 0 * * *") {
      await cleanOldDeals(env);
      const { deleted: purged } = await purgeExcludedDeals(env);
      console.log(
        `Daily cleanup done (purged ${purged} excluded-keyword rows)`,
      );
    }

    if (trigger === "0 1 * * *") {
      ctx.waitUntil(runCrawlPoll(env));
    }
  },
};
