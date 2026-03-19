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
    <div className="grid grid-cols-6 gap-1 px-4 pt-3 pb-1 sm:pb-3">
      {items.map((cat) => {
        const isActive = cat.id === active;
        return (
          <button
            key={cat.id ?? "__all"}
            onClick={() => onSelect(cat.id)}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
              isActive ? "bg-brand/10" : "hover:bg-gray-50"
            }`}
          >
            <span
              className={`text-2xl leading-none transition-transform ${isActive ? "scale-110" : ""}`}
            >
              {cat.icon}
            </span>
            <span
              className={`font-medium leading-tight text-center ${
                isActive ? "text-brand" : "text-text-muted"
              } ${cat.label && cat.label.length > 4 ? "text-[9px] min-[400px]:text-[11px]" : "text-[11px]"}`}
            >
              {cat.label}
            </span>
            {cat.count > 0 && (
              <span
                className={`text-[10px] leading-none ${
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
