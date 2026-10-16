"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import type { ActivityLog } from "@/types/api";

function sortNewestFirst(items: ActivityLog[]): ActivityLog[] {
  return [...items].sort((a, b) => Date.parse(b.when) - Date.parse(a.when));
}

function filterActivities(items: ActivityLog[], query: string): ActivityLog[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return items;
  }

  return items.filter(
    (item) =>
      (item.action ?? "").toLowerCase().includes(needle) ||
      (item.info ?? "").toLowerCase().includes(needle)
  );
}

export function useActivities() {
  const { data, loading, error, hasLoaded, reload } = useApiResource<ActivityLog[]>(
    "/api/activity",
    "Could not load activity right now."
  );

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const activities = useMemo(() => sortNewestFirst(data ?? []), [data]);
  const visibleActivities = useMemo(
    () => filterActivities(activities, deferredQuery),
    [activities, deferredQuery]
  );

  return {
    activities,
    visibleActivities,
    query,
    loading,
    hasLoaded,
    error,
    setQuery,
    reload,
  };
}
