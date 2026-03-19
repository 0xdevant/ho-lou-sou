import { useState, useEffect, useCallback } from 'react';

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
}

export interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  count: number;
}

export interface BrandInfo {
  brand: string;
  count: number;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const apiCache = new Map<string, { data: unknown; ts: number }>();

async function cachedFetch<T>(url: string, skipCache = false): Promise<T> {
  if (!skipCache) {
    const hit = apiCache.get(url);
    if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data as T;
  }
  const resp = await fetch(url);
  const data = await resp.json();
  apiCache.set(url, { data, ts: Date.now() });
  return data as T;
}

export function useDeals(category?: string, brand?: string, source?: string) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async (skipCache = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);
      if (source) params.set('source', source);
      params.set('limit', '100');
      const url = `${API_BASE}/api/deals?${params}`;
      const data = await cachedFetch<{ success: boolean; deals: Deal[] }>(url, skipCache);
      if (data.success) setDeals(data.deals);
      else setError('Failed to load deals');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [category, brand, source]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  return { deals, loading, error, refresh: () => fetchDeals(true) };
}

export interface SourceInfo {
  source_name: string;
  count: number;
}

export function useInit(category?: string) {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [brands, setBrands] = useState<BrandInfo[]>([]);
  const [sources, setSources] = useState<SourceInfo[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    const url = `${API_BASE}/api/init?${params}`;
    cachedFetch<{ success: boolean; categories: CategoryInfo[]; brands: BrandInfo[]; sources: SourceInfo[] }>(url)
      .then(data => {
        if (data.success) {
          setCategories(data.categories);
          setBrands(data.brands);
          setSources(data.sources);
        }
      })
      .catch(() => {});
  }, [category]);

  return { categories, brands, sources };
}

export function useSearch() {
  const [results, setResults] = useState<Deal[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const url = `${API_BASE}/api/search?q=${encodeURIComponent(query)}`;
      const data = await cachedFetch<{ success: boolean; deals: Deal[] }>(url);
      if (data.success) setResults(data.deals);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, []);

  return { results, searching, search };
}
