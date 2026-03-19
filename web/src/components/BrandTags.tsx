import { useState, useEffect } from 'react';
import type { BrandInfo, Deal, SourceInfo } from '../hooks/useDeals';

export const BRAND_GROUPS: { key: string; label: string; keywords: string[]; categories: string[]; color: string; activeColor: string }[] = [
  { key: 'group:酒店', label: '酒店', keywords: ['酒店', 'hotel', 'staycation'], categories: ['食'], color: 'bg-blue-50 text-blue-600 hover:bg-blue-100', activeColor: 'bg-blue-600 text-white' },
];

const SOURCE_TAGS: { name: string; color: string; activeColor: string }[] = [
  { name: 'Klook', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', activeColor: 'bg-orange-500 text-white' },
  { name: '惠康', color: 'bg-red-50 text-red-600 hover:bg-red-100', activeColor: 'bg-red-600 text-white' },
  { name: '萬寧', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', activeColor: 'bg-amber-600 text-white' },
  { name: '7-Eleven', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100', activeColor: 'bg-emerald-600 text-white' },
  { name: 'Circle K', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', activeColor: 'bg-yellow-500 text-white' },
  { name: 'AEON', color: 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100', activeColor: 'bg-fuchsia-600 text-white' },
  { name: '麥當勞', color: 'bg-red-50 text-red-700 hover:bg-red-100', activeColor: 'bg-red-700 text-white' },
];

function computeVisibleSources(apiSources: SourceInfo[]) {
  if (apiSources.length === 0) return SOURCE_TAGS;
  const counts = new Map(apiSources.map(s => [s.source_name, s.count]));
  return SOURCE_TAGS.filter(s => (counts.get(s.name) || 0) > 0);
}

interface Props {
  brands: BrandInfo[];
  deals: Deal[];
  sourceCounts: SourceInfo[];
  activeCategory: string | null;
  activeBrand: string | null;
  activeSource: string | null;
  onSelectBrand: (brand: string | null) => void;
  onSelectSource: (source: string | null) => void;
}

function computeVisibleGroups(deals: Deal[], category: string | null) {
  return BRAND_GROUPS.filter(g => {
    if (!category || !g.categories.includes(category)) return false;
    return deals.some(d => d.brand && g.keywords.some(kw => d.brand!.toLowerCase().includes(kw)));
  });
}

export default function BrandTags({ brands, deals, sourceCounts, activeCategory, activeBrand, activeSource, onSelectBrand, onSelectSource }: Props) {
  const [cachedSources, setCachedSources] = useState(SOURCE_TAGS);
  const [cachedGroups, setCachedGroups] = useState<typeof BRAND_GROUPS>([]);

  useEffect(() => {
    setCachedSources(computeVisibleSources(sourceCounts));
  }, [sourceCounts]);

  useEffect(() => {
    setCachedGroups([]);
  }, [activeCategory]);

  const isUnfiltered = activeBrand === null && activeSource === null;
  useEffect(() => {
    if (isUnfiltered && deals.length > 0) {
      setCachedGroups(computeVisibleGroups(deals, activeCategory));
    }
  }, [deals, activeCategory, isUnfiltered]);

  const visibleSources = cachedSources;
  const visibleBrands = brands.filter(b => b.count > 0 && !SOURCE_TAGS.some(s => s.name === b.brand));
  const visibleGroups = cachedGroups;

  if (visibleBrands.length === 0 && visibleSources.length === 0 && visibleGroups.length === 0) return null;

  const isAll = activeBrand === null && activeSource === null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-4 no-scrollbar">
      <span className="shrink-0 text-[10px] text-text-muted/60 font-medium">品牌</span>
      <button
        onClick={() => { onSelectBrand(null); onSelectSource(null); }}
        className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-all ${
          isAll ? 'btn-active' : 'bg-gray-100 text-text-muted hover:bg-gray-200'
        }`}
      >
        全部
      </button>
      {visibleGroups.map(g => (
        <button
          key={g.key}
          onClick={() => { onSelectSource(null); onSelectBrand(activeBrand === g.key ? null : g.key); }}
          className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeBrand === g.key ? g.activeColor : g.color
          }`}
        >
          {g.label}
        </button>
      ))}
      {visibleSources.map(s => (
        <button
          key={s.name}
          onClick={() => { onSelectBrand(null); onSelectSource(activeSource === s.name ? null : s.name); }}
          className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeSource === s.name ? s.activeColor : s.color
          }`}
        >
          {s.name}
        </button>
      ))}
      {visibleBrands.map(b => (
        <button
          key={b.brand}
          onClick={() => { onSelectSource(null); onSelectBrand(activeBrand === b.brand ? null : b.brand); }}
          className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeBrand === b.brand ? 'btn-active' : 'bg-gray-100 text-text-muted hover:bg-gray-200'
          }`}
        >
          {b.brand}
          <span className="ml-1 opacity-60">{b.count}</span>
        </button>
      ))}
    </div>
  );
}
