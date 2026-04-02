import type { Deal } from '../hooks/useDeals';

const DEAL_TYPES: { label: string; keywords: string[] }[] = [
  { label: '折扣', keywords: ['折', '% off', 'off'] },
  { label: '免費', keywords: ['免費', 'free'] },
  { label: '現金券', keywords: ['現金券', '消費券', '禮券', '現金回贈'] },
  { label: '信用卡', keywords: ['信用卡', '積分', '里數'] },
  { label: '限時', keywords: ['限時', '限定', '快閃'] },
  { label: '半價', keywords: ['半價', '50% off'] },
  { label: '買一送一', keywords: ['買一送一'] },
];

function matchesDealType(texts: string[], dt: { keywords: string[] }): boolean {
  const combined = texts.join(' ').toLowerCase();
  return dt.keywords.some(kw => combined.includes(kw));
}

export function filterByDealType(texts: string[], label: string): boolean {
  const dt = DEAL_TYPES.find(t => t.label === label);
  if (!dt) return false;
  return matchesDealType(texts, dt);
}

interface Props {
  deals: Deal[];
  active: string | null;
  onSelect: (label: string | null) => void;
}

export default function DealTypeFilter({ deals, active, onSelect }: Props) {
  const counted = DEAL_TYPES.map(dt => {
    const count = deals.filter(d =>
      matchesDealType([d.title, d.description || '', d.labels || ''], dt)
    ).length;
    return { ...dt, count };
  }).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 px-2 sm:py-1.5 sm:px-4 no-scrollbar">
      <span className="shrink-0 text-[9px] sm:text-[10px] text-text-muted/60 font-medium">類型</span>
      {counted.map(t => (
        <button
          key={t.label}
          onClick={() => onSelect(active === t.label ? null : t.label)}
          className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            active === t.label
              ? 'bg-brand text-white'
              : 'bg-gray-100 text-text-muted hover:bg-gray-200'
          }`}
        >
          {t.label}
          {t.count > 0 && (
            <span className={`ml-1 ${active === t.label ? 'opacity-70' : 'opacity-40'}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
