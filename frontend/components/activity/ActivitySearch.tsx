type ActivitySearchProps = {
  value: string;
  total: number;
  visible: number;
  onChange: (value: string) => void;
};

export function ActivitySearch({ value, total, visible, onChange }: ActivitySearchProps) {
  return (
    <div className="toolbar">
      <label htmlFor="activity-search" className="visually-hidden">
        Search activity
      </label>
      <input
        id="activity-search"
        type="search"
        className="input"
        placeholder="Search by action or details…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="toolbar__meta" aria-live="polite">
        {visible === total ? `${total} entries` : `${visible} of ${total} entries`}
      </p>
    </div>
  );
}
