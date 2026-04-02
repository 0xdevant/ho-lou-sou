import type { CategoryInfo } from "../hooks/useDeals";

interface Props {
  categories: CategoryInfo[];
  active: string | null;
  onSelect: (id: string | null) => void;
}

const ALL_ICON = "🔥";

export default function CategoryTabs({ categories, active, onSelect }: Props) {
  const items = [
    { id: null, icon: ALL_ICON, label: "全部", count: 0 },
    ...categories,
  ];

  return (
    <div className="grid grid-cols-6 gap-0.5 px-2 pt-2 pb-0.5 sm:gap-1 sm:px-4 sm:pt-3 sm:pb-1 md:pb-3">
      {items.map((cat) => {
        const isActive = cat.id === active;
        return (
          <button
            key={cat.id ?? "__all"}
            onClick={() => onSelect(cat.id)}
            className={`flex flex-col items-center gap-0.5 py-1.5 sm:gap-1 sm:py-2 rounded-lg sm:rounded-xl transition-all ${
              isActive ? "bg-brand/10" : "hover:bg-gray-50"
            }`}
          >
            <span
              className={`text-[1.375rem] sm:text-2xl leading-none transition-transform ${isActive ? "sm:scale-110" : ""}`}
            >
              {cat.icon}
            </span>
            <span
              className={`font-medium leading-tight text-center ${
                isActive ? "text-brand" : "text-text-muted"
              } ${cat.label && cat.label.length > 4 ? "text-[8px] min-[400px]:text-[11px]" : "text-[10px] sm:text-[11px]"}`}
            >
              {cat.label}
            </span>
            {cat.count > 0 && (
              <span
                className={`hidden sm:inline text-[10px] leading-none ${
                  isActive ? "text-brand/70" : "text-text-muted/50"
                }`}
              >
                {cat.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
