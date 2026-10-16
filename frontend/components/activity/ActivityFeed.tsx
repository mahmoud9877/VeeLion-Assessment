"use client";

import { useActivities } from "@/hooks/useActivities";
import { ActivityList } from "@/components/activity/ActivityList";
import { ActivitySearch } from "@/components/activity/ActivitySearch";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { StateMessage } from "@/components/ui/StateMessage";

export function ActivityFeed() {
  const { activities, visibleActivities, query, loading, hasLoaded, error, setQuery, reload } =
    useActivities();

  return (
    <div className="page">
      <PageHeader
        title="Activity Feed"
        description="Everything that happened across the system, newest first."
        actions={hasLoaded ? <RefreshButton refreshing={loading} onRefresh={reload} /> : null}
      />

      {!hasLoaded && loading ? <StateMessage variant="loading" message="Loading activity…" /> : null}

      {!hasLoaded && error ? (
        <StateMessage
          variant="error"
          title="Activity could not be loaded"
          message={error}
          actionLabel="Try again"
          onAction={reload}
        />
      ) : null}

      {hasLoaded ? (
        <>
          {error ? (
            <div className="alert" role="alert">
              <span>Could not refresh activity: {error}</span>
            </div>
          ) : null}

          <ActivitySearch
            value={query}
            onChange={setQuery}
            total={activities.length}
            visible={visibleActivities.length}
          />

          {activities.length === 0 ? (
            <StateMessage variant="empty" message="No activity has been recorded yet." />
          ) : visibleActivities.length === 0 ? (
            <StateMessage
              variant="empty"
              message={`No activity matches “${query.trim()}”.`}
              actionLabel="Clear search"
              onAction={() => setQuery("")}
            />
          ) : (
            <ActivityList items={visibleActivities} />
          )}
        </>
      ) : null}
    </div>
  );
}
