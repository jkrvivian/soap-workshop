import { Filter } from "lucide-react";

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function FilterButton({ label, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
        isActive
          ? "bg-soap-wood text-white shadow-sm"
          : "bg-white border border-stone-200 text-soap-accent hover:border-soap-wood"
      }`}
    >
      {label === "全部" && <Filter size={14} />}
      {label}
    </button>
  );
}
