import type { Deal } from '../hooks/useDeals';

interface Props {
  deal: Deal;
  isFav?: boolean;
  onToggleFav?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  '食': 'bg-orange-100 text-orange-700',
  '衣': 'bg-purple-100 text-purple-700',
  '住': 'bg-blue-100 text-blue-700',
  '行': 'bg-green-100 text-green-700',
  '超市': 'bg-rose-100 text-rose-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  '食': '飲食',
  '衣': '服飾',
  '住': '住宿',
  '行': '旅遊',
  '超市': '超市',
};

const SOURCE_COLORS: Record<string, string> = {
  'Klook': 'bg-orange-500 text-white',
  '惠康': 'bg-red-600 text-white',
  '7-Eleven': 'bg-emerald-600 text-white',
  'AEON': 'bg-fuchsia-600 text-white',
  'Circle K': 'bg-yellow-500 text-white',
  '萬寧': 'bg-amber-600 text-white',
  '麥當勞': 'bg-red-700 text-white',
};

function cleanTitle(raw: string): string {
  return raw
    .replace(/【([^】]*)】/g, '$1')       // 【text】→ text
    .replace(/「([^」]*)」/g, '$1')       // 「text」→ text
    .replace(/\[([^\]]*)\]/g, '$1')      // [text] → text
    .replace(/^[►▶▷★☆●○◆◇■□▪▫→⇒❤️🔥💥🎉✨]+\s*/g, '') // leading decorative chars
    .replace(/[►▶▷★☆●○◆◇■□▪▫→⇒]+$/g, '')               // trailing decorative chars
    .replace(/\s*[|｜│]\s*/g, ' ')        // pipes → space
    .replace(/([!！]){2,}/g, '$1')        // !!! → !
    .replace(/\.{4,}/g, '...')            // ..... → ...
    .replace(/\s{2,}/g, ' ')             // collapse whitespace
    .trim();
}

function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`;
  return `${Math.floor(diff / 86400)} 日前`;
}

function parseDiscount(title: string, desc: string | null): number | null {
  const text = `${title} ${desc || ''}`;

  // $sale (原價 $original) — compute from prices
  const priceMatch = text.match(/\$([\d,.]+)\s*\(原價\s*\$([\d,.]+)\)/);
  if (priceMatch) {
    const sale = parseFloat(priceMatch[1].replace(/,/g, ''));
    const orig = parseFloat(priceMatch[2].replace(/,/g, ''));
    if (orig > sale && orig > 0) return Math.round((1 - sale / orig) * 100);
  }

  // 減XX% or XX% off
  const pctMatch = text.match(/減(\d{1,2})%/) || text.match(/(\d{1,2})%\s*off/i);
  if (pctMatch) {
    const pct = parseInt(pctMatch[1]);
    if (pct > 0 && pct <= 99) return pct;
  }

  // XX折 (e.g. 75折 = 25% off, 5折 = 50% off, 7.5折 = 25% off)
  const zhMatch = text.match(/(\d{1,2}(?:\.\d)?)\s*折/);
  if (zhMatch) {
    const fold = parseFloat(zhMatch[1]);
    if (fold >= 1 && fold <= 99) {
      const off = fold < 10 ? Math.round((10 - fold) * 10) : Math.round(100 - fold);
      if (off > 0 && off < 100) return off;
    }
  }

  if (text.includes('半價')) return 50;
  if (text.includes('買一送一')) return 50;

  return null;
}

export default function DealCard({ deal, isFav, onToggleFav }: Props) {
  const colorClass = CATEGORY_COLORS[deal.category] || 'bg-gray-100 text-gray-700';
  const catLabel = CATEGORY_LABELS[deal.category] || deal.category;
  const sourceColor = SOURCE_COLORS[deal.source_name];
  const discount = parseDiscount(deal.title, deal.description);

  return (
    <div className="group relative">
      <a
        href={deal.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl p-4 hover:shadow-md transition-shadow border bg-white border-border"
      >
        <div className="flex items-start gap-3">
          {deal.image_url && (
            <img
              src={deal.image_url}
              alt=""
              className="w-20 h-20 rounded-lg object-cover shrink-0 bg-gray-100"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 text-text pr-8">
              {cleanTitle(deal.title)}
            </h3>
            {deal.description && (
              <p className="text-text-muted text-[13px] mt-1 line-clamp-2 leading-relaxed">
                {deal.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                {catLabel}
              </span>
              {deal.brand && deal.brand !== deal.source_name && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-800 text-white">
                  {deal.brand}
                </span>
              )}
              {sourceColor && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColor}`}>
                  {deal.source_name}
                </span>
              )}
              {discount !== null && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-500 text-white">
                  -{discount}%
                </span>
              )}
              {deal.expiry_text && (
                <span className="text-xs text-red-500">
                  {deal.expiry_text}
                </span>
              )}
              <span className="text-xs text-text-muted ml-auto">
                {timeAgo(deal.crawled_at)}
              </span>
            </div>
          </div>
        </div>
      </a>
      {onToggleFav && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(deal.id); }}
          className={`absolute top-3 right-3 z-[1] p-1.5 rounded-full shadow-sm border fav-btn ${
            isFav
              ? 'visible bg-white border-red-200'
              : 'bg-white border-gray-200'
          }`}
          aria-label={isFav ? '取消收藏' : '收藏'}
        >
          <svg className={`w-4 h-4 ${isFav ? 'text-red-500 fill-red-500' : 'text-gray-300 fill-gray-300'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}
