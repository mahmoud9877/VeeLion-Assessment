type RefreshButtonProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

export function RefreshButton({ refreshing, onRefresh }: RefreshButtonProps) {
  return (
    <button type="button" className="button" onClick={onRefresh} disabled={refreshing}>
      {refreshing ? "Refreshing…" : "Refresh"}
    </button>
  );
}
