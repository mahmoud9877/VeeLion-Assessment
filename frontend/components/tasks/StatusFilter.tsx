import type { TaskCounts } from "@/hooks/useTasks";
import type { TaskFilter } from "@/types/api";

const FILTERS: Array<{ label: string; value: TaskFilter }> = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
];

type StatusFilterProps = {
  value: TaskFilter;
  counts: TaskCounts;
  onChange: (value: TaskFilter) => void;
};

export function StatusFilter({ value, counts, onChange }: StatusFilterProps) {
  return (
    <div className="segmented" role="group" aria-label="Filter tasks by status">
      {FILTERS.map((filter) => {
        const active = filter.value === value;

        return (
          <button
            key={filter.value}
            type="button"
            className={active ? "segmented__option segmented__option--active" : "segmented__option"}
            onClick={() => onChange(filter.value)}
            aria-pressed={active}
          >
            {filter.label}
            <span className="count">{counts[filter.value]}</span>
          </button>
        );
      })}
    </div>
  );
}
