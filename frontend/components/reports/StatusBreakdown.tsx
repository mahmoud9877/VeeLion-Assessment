import type { TaskStatus, TasksSummary } from "@/types/api";

const STATUSES: Array<{ key: TaskStatus; label: string }> = [
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In progress" },
  { key: "done", label: "Done" },
];

type StatusBreakdownProps = {
  byStatus: TasksSummary["byStatus"];
  total: number;
};

export function StatusBreakdown({ byStatus, total }: StatusBreakdownProps) {
  return (
    <section className="card breakdown" aria-labelledby="breakdown-title">
      <h2 id="breakdown-title" className="breakdown__title">
        Tasks by status
      </h2>

      <ul className="breakdown__list">
        {STATUSES.map(({ key, label }) => {
          const count = byStatus[key] ?? 0;
          const share = total === 0 ? 0 : Math.round((count / total) * 100);

          return (
            <li key={key} className="breakdown__row">
              <div className="breakdown__label">
                <span className={`breakdown__swatch breakdown__swatch--${key}`} aria-hidden="true" />
                {label}
              </div>
              <div
                className="breakdown__bar"
                role="meter"
                aria-label={`${label} share`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={share}
              >
                <span className={`breakdown__fill breakdown__fill--${key}`} style={{ width: `${share}%` }} />
              </div>
              <span className="breakdown__value">
                {count} <span className="breakdown__share">({share}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
