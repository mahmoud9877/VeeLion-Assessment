"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage, isAbortError, requestJson } from "@/lib/http";

/**
 * Loads JSON from one of the app's API routes.
 * Cancels the previous request on reload/unmount so stale responses never overwrite newer data.
 */
export function useApiResource<T>(url: string, errorFallback: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError("");

    try {
      setData(await requestJson<T>(url, { signal: controller.signal }));
    } catch (requestError) {
      if (!isAbortError(requestError)) {
        setError(getErrorMessage(requestError, errorFallback));
      }
    } finally {
      if (controllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [url, errorFallback]);

  useEffect(() => {
    reload();
    return () => controllerRef.current?.abort();
  }, [reload]);

  return {
    data,
    setData,
    loading,
    error,
    hasLoaded: data !== null,
    reload,
  };
}
