import { useState, useEffect } from "react";
import type { Deal } from "../hooks/useDeals";
import DealCard from "./DealCard";

const PAGE_SIZES = [10, 30, 50];

interface Props {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  isFav?: (id: string) => boolean;
  onToggleFav?: (id: string) => void;
}

export default function DealList({ deals, loading, error, isFav, onToggleFav }: Props) {
  const [pageSize, setPageSize] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [deals, pageSize]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-4 py-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 border border-border animate-pulse"
          >
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-text-muted">{error}</p>
        <p className="text-sm text-text-muted mt-1">請稍後再試</p>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-4xl mb-2">📭</p>
        <p className="text-text-muted">暫無優惠資訊</p>
        <p className="text-sm text-text-muted mt-1">
          可以 Refresh 載入最新著數
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(deals.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const paged = deals.slice(start, start + pageSize);

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <p className="text-xs text-text-muted">
          共 {deals.length} 個優惠
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-text-muted mr-1">每頁</span>
          {PAGE_SIZES.map(size => (
            <button
              key={size}
              onClick={() => setPageSize(size)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                pageSize === size
                  ? 'btn-active'
                  : 'bg-gray-100 text-text-muted hover:bg-gray-200'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        {paged.map((deal) => (
          <DealCard key={deal.id} deal={deal} isFav={isFav?.(deal.id)} onToggleFav={onToggleFav} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-text-muted hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            上一頁
          </button>
          <span className="text-xs text-text-muted">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-text-muted hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}
