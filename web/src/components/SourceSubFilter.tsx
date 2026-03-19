import type { Deal } from "../hooks/useDeals";

const SOURCE_FILTERS: Record<string, { label: string; keywords: string[] }[]> =
  {
    惠康: [
      {
        label: "飲品",
        keywords: [
          "礦泉水",
          "蒸餾水",
          "飲用水",
          "茶",
          "咖啡",
          "汁",
          "奶",
          "啤",
          "酒",
          "飲品",
          "飲料",
          "乳",
          "可樂",
          "雪碧",
          "汽水",
          "豆漿",
          "寶礦力",
        ],
      },
      {
        label: "肉類",
        keywords: [
          "肉",
          "雞",
          "牛",
          "豬",
          "魚",
          "蝦",
          "排骨",
          "海鮮",
          "三文魚",
          "蝦仁",
        ],
      },
      {
        label: "零食",
        keywords: [
          "薯片",
          "餅",
          "朱古力",
          "糖果",
          "零食",
          "雪糕",
          "曲奇",
          "杏仁",
          "果仁",
        ],
      },
      {
        label: "糧油",
        keywords: [
          "米",
          "麵",
          "油",
          "醬",
          "粉",
          "醋",
          "鹽",
          "糖",
          "花生油",
          "粟米油",
          "芥花籽",
        ],
      },
      {
        label: "家居",
        keywords: ["紙", "洗", "清潔", "廁", "牙", "沐浴", "護", "衛生"],
      },
    ],
    "7-Eleven": [
      {
        label: "飲品",
        keywords: [
          "礦泉水",
          "蒸餾水",
          "飲用水",
          "茶",
          "咖啡",
          "汁",
          "奶",
          "啤",
          "酒",
          "飲品",
          "飲料",
          "乳",
          "可樂",
          "汽水",
          "寶礦力",
        ],
      },
      {
        label: "零食",
        keywords: [
          "薯片",
          "餅",
          "朱古力",
          "糖",
          "零食",
          "雪糕",
          "杏仁",
          "果仁",
        ],
      },
      {
        label: "食品",
        keywords: ["飯", "麵", "包", "腸", "粥", "便當", "三文治", "壽司"],
      },
      {
        label: "衣物",
        keywords: ["tee", "t-shirt", "shirt", "衫", "褲", "襪", "帽", "衛衣"],
      },
    ],
  };

function matchesFilter(title: string, keywords: string[]): boolean {
  const lower = title.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function filterBySubFilter(
  title: string,
  source: string,
  label: string,
): boolean {
  const filters = SOURCE_FILTERS[source];
  if (!filters) return true;
  const f = filters.find((f) => f.label === label);
  if (!f) return true;
  return matchesFilter(title, f.keywords);
}

interface Props {
  source: string;
  deals: Deal[];
  active: string | null;
  onSelect: (label: string | null) => void;
}

export default function SourceSubFilter({
  source,
  deals,
  active,
  onSelect,
}: Props) {
  const filters = SOURCE_FILTERS[source];
  if (!filters) return null;

  const counted = filters
    .map((f) => ({
      ...f,
      count: deals.filter((d) => matchesFilter(d.title, f.keywords)).length,
    }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  if (counted.length === 0) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto py-1 px-4 no-scrollbar">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
          active === null
            ? "btn-active"
            : "bg-gray-100 text-text-muted hover:bg-gray-200"
        }`}
      >
        全部
      </button>
      {counted.map((f) => (
        <button
          key={f.label}
          onClick={() => onSelect(active === f.label ? null : f.label)}
          className={`shrink-0 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
            active === f.label
              ? "btn-active"
              : "bg-gray-100 text-text-muted hover:bg-gray-200"
          }`}
        >
          {f.label}
          <span
            className={`ml-1 ${active === f.label ? "opacity-70" : "opacity-40"}`}
          >
            {f.count}
          </span>
        </button>
      ))}
    </div>
  );
}
