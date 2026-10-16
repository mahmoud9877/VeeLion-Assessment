"use client";

import { useCallback, useMemo, useState } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import { getErrorMessage, requestJson } from "@/lib/http";
import type { Task, TaskFilter, TaskResponse, TasksResponse } from "@/types/api";

export type TaskCounts = Record<TaskFilter, number>;

function sortNewestFirst(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function withoutId(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

export function useTasks() {
  const {
    data,
    setData,
    loading,
    error: loadError,
    hasLoaded,
    reload,
  } = useApiResource<TasksResponse>("/api/tasks", "Could not load tasks right now.");

  const [filter, setFilter] = useState<TaskFilter>("all");
  const [actionError, setActionError] = useState("");
  const [pendingTaskIds, setPendingTaskIds] = useState<ReadonlySet<string>>(() => new Set());
  const [creating, setCreating] = useState(false);

  const tasks = useMemo(() => sortNewestFirst(data?.data ?? []), [data]);

  const createTask = useCallback(
    async (title: string): Promise<boolean> => {
      setCreating(true);
      setActionError("");

      try {
        const body = await requestJson<TaskResponse>("/api/tasks", {
          method: "POST",
          body: JSON.stringify({ title }),
        });

        setData((previous) => ({ data: [...(previous?.data ?? []), body.data] }));
        // A new task is pending, so make sure the current filter does not hide it.
        setFilter((current) => (current === "completed" ? "all" : current));
        return true;
      } catch (error) {
        setActionError(getErrorMessage(error, "Could not create the task."));
        return false;
      } finally {
        setCreating(false);
      }
    },
    [setData]
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, completed: boolean) => {
      setPendingTaskIds((previous) => new Set(previous).add(taskId));
      setActionError("");

      try {
        const body = await requestJson<TaskResponse>(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: "PATCH",
          body: JSON.stringify({ completed }),
        });

        setData((previous) =>
          previous
            ? { data: previous.data.map((task) => (task.id === taskId ? body.data : task)) }
            : previous
        );
      } catch (error) {
        setActionError(getErrorMessage(error, "Could not update task status."));
      } finally {
        setPendingTaskIds((previous) => withoutId(previous, taskId));
      }
    },
    [setData]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      setPendingTaskIds((previous) => new Set(previous).add(taskId));
      setActionError("");

      try {
        await requestJson<void>(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });

        setData((previous) =>
          previous ? { data: previous.data.filter((task) => task.id !== taskId) } : previous
        );
      } catch (error) {
        setActionError(getErrorMessage(error, "Could not delete the task."));
      } finally {
        setPendingTaskIds((previous) => withoutId(previous, taskId));
      }
    },
    [setData]
  );

  const dismissActionError = useCallback(() => setActionError(""), []);

  const counts = useMemo<TaskCounts>(() => {
    const completed = tasks.filter((task) => task.completed).length;
    return { all: tasks.length, completed, pending: tasks.length - completed };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }

    if (filter === "pending") {
      return tasks.filter((task) => !task.completed);
    }

    return tasks;
  }, [tasks, filter]);

  return {
    filteredTasks,
    counts,
    filter,
    loading,
    hasLoaded,
    loadError,
    actionError,
    pendingTaskIds,
    creating,
    setFilter,
    reload,
    createTask,
    updateTaskStatus,
    deleteTask,
    dismissActionError,
  };
}
