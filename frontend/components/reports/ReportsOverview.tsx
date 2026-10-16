"use client";

import { useTasksSummary } from "@/hooks/useTasksSummary";
import { StatusBreakdown } from "@/components/reports/StatusBreakdown";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { StatCard } from "@/components/ui/StatCard";
import { StateMessage } from "@/components/ui/StateMessage";

function percentage(part: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
}

export function ReportsOverview() {
  const { summary, loading, error, hasLoaded, reload } = useTasksSummary();

  return (
    <div className="page">
      <PageHeader
        title="Reports"
        description="A quick snapshot of tasks and activity."
        actions={hasLoaded ? <RefreshButton refreshing={loading} onRefresh={reload} /> : null}
      />

      {!hasLoaded && loading ? <StateMessage variant="loading" message="Loading report…" /> : null}

      {!hasLoaded && error ? (
        <StateMessage
          variant="error"
          title="The report could not be loaded"
          message={error}
          actionLabel="Try again"
          onAction={reload}
        />
      ) : null}

      {summary ? (
        <>
          {error ? (
            <div className="alert" role="alert">
              <span>Could not refresh the report: {error}</span>
            </div>
          ) : null}

          <section className="stats-grid" aria-label="Summary">
            <StatCard label="Total tasks" value={summary.total} />
            <StatCard
              label="Completed"
              value={summary.byStatus.done}
              hint={`${percentage(summary.byStatus.done, summary.total)} of all tasks`}
            />
            <StatCard label="Recent activity" value={summary.recentActivityCount} hint="Logged events" />
          </section>

          <StatusBreakdown byStatus={summary.byStatus} total={summary.total} />
        </>
      ) : null}
    </div>
  );
}
