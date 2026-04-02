import { useState, useCallback, useEffect } from "react";
import { useDeals, useInit, useSearch } from "./hooks/useDeals";
import CategoryTabs from "./components/CategoryTabs";
import BrandTags, { BRAND_GROUPS } from "./components/BrandTags";
import DealList from "./components/DealList";
import SearchBar from "./components/SearchBar";
import DealTypeFilter, { filterByDealType } from "./components/DealTypeFilter";
import SourceSubFilter, {
  filterBySubFilter,
} from "./components/SourceSubFilter";
import AboutPage from "./components/AboutPage";
import PrivacyPage from "./components/PrivacyPage";
import ContactPage from "./components/ContactPage";
import DisclaimerPage from "./components/DisclaimerPage";
import { useFavourites } from "./hooks/useFavourites";
import { useTheme } from "./hooks/useTheme";

function getInitialParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    cat: p.get("cat"),
    brand: p.get("brand"),
    source: p.get("source"),
    page:
      (p.get("p") as "about" | "privacy" | "contact" | "disclaimer") || null,
  };
}

function syncUrl(params: Record<string, string | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  const url = qs ? `?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export default function App() {
  const initial = getInitialParams();
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initial.cat,
  );
  const [activeBrand, setActiveBrand] = useState<string | null>(initial.brand);
  const [activeSource, setActiveSource] = useState<string | null>(
    initial.source,
  );
  const [activeDealType, setActiveDealType] = useState<string | null>(null);
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFavs, setShowFavs] = useState(false);
  const [page, setPage] = useState<
    "home" | "about" | "privacy" | "contact" | "disclaimer"
  >(initial.page || "home");
  const { toggle: toggleFav, isFav, count: favCount } = useFavourites();
  const { isDark, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    if (page !== "home") {
      syncUrl({ p: page });
    } else {
      syncUrl({
        cat: activeCategory,
        brand: activeBrand,
        source: activeSource,
      });
    }
  }, [activeCategory, activeBrand, activeSource, page]);

  const {
    categories,
    brands,
    sources: sourceCounts,
  } = useInit(activeCategory || undefined);
  const isGroupBrand = activeBrand?.startsWith("group:") ?? false;
  const {
    deals: rawDeals,
    loading,
    error,
    refresh,
  } = useDeals(
    activeCategory || undefined,
    isGroupBrand ? undefined : activeBrand || undefined,
    activeSource || undefined,
  );

  const deals = isGroupBrand
    ? rawDeals.filter((d) => {
        const group = BRAND_GROUPS.find((g) => g.key === activeBrand);
        if (!group) return true;
        const brand = (d.brand || "").toLowerCase();
        return (
          brand.length > 0 && group.keywords.some((kw) => brand.includes(kw))
        );
      })
    : rawDeals;
  const { results: searchResults, searching, search } = useSearch();

  const handleCategorySelect = useCallback((id: string | null) => {
    setActiveCategory(id);
    setActiveBrand(null);
    setActiveSource(null);
    setActiveDealType(null);
    setActiveSubFilter(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBrandSelect = useCallback((brand: string | null) => {
    setActiveBrand(brand);
    setActiveDealType(null);
    setActiveSubFilter(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSourceSelect = useCallback((source: string | null) => {
    setActiveSource(source);
    setActiveDealType(null);
    setActiveSubFilter(null);
  }, []);

  const handleSearch = useCallback(
    (q: string) => {
      setIsSearching(q.length >= 2);
      search(q);
    },
    [search],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  };

  let filteredDeals = activeDealType
    ? deals.filter((d) =>
        filterByDealType(
          [d.title, d.description || "", d.labels || ""],
          activeDealType,
        ),
      )
    : deals;
  if (activeSubFilter && activeSource) {
    filteredDeals = filteredDeals.filter((d) =>
      filterBySubFilter(d.title, activeSource, activeSubFilter),
    );
  }
  const favedDeals = showFavs
    ? filteredDeals.filter((d) => isFav(d.id))
    : filteredDeals;
  const displayDeals = isSearching ? searchResults : favedDeals;

  if (page === "about")
    return (
      <AboutPage
        onBack={() => setPage("home")}
        onContact={() => setPage("contact")}
      />
    );
  if (page === "privacy") return <PrivacyPage onBack={() => setPage("home")} />;
  if (page === "contact") return <ContactPage onBack={() => setPage("home")} />;
  if (page === "disclaimer")
    return (
      <DisclaimerPage
        onBack={() => setPage("home")}
        onContact={() => setPage("contact")}
      />
    );

  return (
    <div className="min-h-screen max-w-2xl mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <button
            onClick={() => {
              setPage("home");
              setActiveCategory(null);
              setActiveBrand(null);
              setActiveSource(null);
              setActiveDealType(null);
              setActiveSubFilter(null);
              setIsSearching(false);
              setShowFavs(false);
              syncUrl({});
            }}
            className="flex items-center gap-2.5 text-left"
          >
            <img src="/logo.png" alt="好路數" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-text tracking-tight leading-tight">
                好路數
              </h1>
              <p className="text-[10px] sm:text-xs text-text-muted leading-snug">
                香港著數優惠一覽 ·{" "}
                <a
                  href="https://clawify.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text"
                  onClick={(e) => e.stopPropagation()}
                >
                  Powered by Clawify
                </a>
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={isDark ? "淺色模式" : "深色模式"}
              title={isDark ? "淺色模式" : "深色模式"}
            >
              {isDark ? (
                <svg
                  className="w-5 h-5 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => setShowFavs((f) => !f)}
              className={`relative p-2 rounded-full transition-colors ${showFavs ? "bg-red-50" : "hover:bg-gray-100"}`}
              aria-label="收藏"
            >
              <svg
                className={`w-5 h-5 ${showFavs ? "text-red-500 fill-red-500" : "text-text-muted"}`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                fill="none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {favCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {favCount > 99 ? "99" : favCount}
                </span>
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
              aria-label="重新整理"
            >
              <svg
                className={`w-5 h-5 text-text-muted${refreshing ? " animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h5M20 20v-5h-5M4.5 9A8 8 0 0120 12M19.5 15A8 8 0 014 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <SearchBar onSearch={handleSearch} searching={searching} />

        {!isSearching && (
          <>
            <CategoryTabs
              categories={categories}
              active={activeCategory}
              onSelect={handleCategorySelect}
            />
            <BrandTags
              brands={brands}
              deals={deals}
              sourceCounts={sourceCounts}
              activeCategory={activeCategory}
              activeBrand={activeBrand}
              activeSource={activeSource}
              onSelectBrand={handleBrandSelect}
              onSelectSource={handleSourceSelect}
            />
            <DealTypeFilter
              deals={deals}
              active={activeDealType}
              onSelect={setActiveDealType}
            />
            {activeSource && (
              <SourceSubFilter
                source={activeSource}
                deals={deals}
                active={activeSubFilter}
                onSelect={setActiveSubFilter}
              />
            )}
          </>
        )}
      </header>

      <main>
        {isSearching && searchResults.length > 0 && (
          <div className="px-4 pt-3">
            <p className="text-sm text-text-muted">
              找到 {searchResults.length} 個結果
            </p>
          </div>
        )}
        <DealList
          deals={displayDeals}
          loading={loading && !isSearching}
          error={error}
          isFav={isFav}
          onToggleFav={toggleFav}
        />
      </main>

      <footer className="text-center py-6 text-xs text-text-muted space-y-1">
        <p>資料來自 Klook、惠康、7-Eleven、AEON、萬寧等</p>
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={() => setPage("about")}
            className="underline hover:text-text"
          >
            關於我哋
          </button>
          <span>·</span>
          <button
            onClick={() => setPage("privacy")}
            className="underline hover:text-text"
          >
            私隱政策
          </button>
          <span>·</span>
          <button
            onClick={() => setPage("contact")}
            className="underline hover:text-text"
          >
            聯絡我哋
          </button>
          <span>·</span>
          <button
            onClick={() => setPage("disclaimer")}
            className="underline hover:text-text"
          >
            免責聲明
          </button>
          <span>·</span>
          <a
            href="https://buymeacoffee.com/0xant"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text"
          >
            請我飲杯咖啡 ☕
          </a>
        </div>
      </footer>
    </div>
  );
}
