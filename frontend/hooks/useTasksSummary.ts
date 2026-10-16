"use client";

import { useApiResource } from "@/hooks/useApiResource";
import type { TasksSummary } from "@/types/api";

export function useTasksSummary() {
  const { data, loading, error, hasLoaded, reload } = useApiResource<TasksSummary>(
    "/api/reports",
    "Could not load the report right now."
  );

  return { summary: data, loading, error, hasLoaded, reload };
}
