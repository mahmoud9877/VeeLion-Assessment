import { BACKEND_BASE_URL } from "@/lib/constants";
import type { ActivityLog, ErrorResponse, Task, TaskResponse, TasksResponse, TasksSummary } from "@/types/api";

/** Error thrown for any failed backend call; keeps the backend's HTTP status so routes can forward it. */
export class BackendError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "BackendError";
  }
}

async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
    });
  } catch {
    throw new BackendError("Backend service is unavailable.", 503);
  }

  if (!response.ok) {
    let message = `Backend request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as Partial<ErrorResponse>;
      message = body.error?.message || message;
    } catch {
      // Non-JSON error body: keep the generic message.
    }

    throw new BackendError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getTasksFromBackend(): Promise<Task[]> {
  const body = await backendRequest<TasksResponse>("/tasks");
  return body.data;
}

export async function createTaskInBackend(title: string): Promise<Task> {
  const body = await backendRequest<TaskResponse>("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return body.data;
}

export async function updateTaskInBackend(taskId: string, completed: boolean): Promise<Task> {
  const body = await backendRequest<TaskResponse>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  return body.data;
}

export async function deleteTaskInBackend(taskId: string): Promise<void> {
  await backendRequest<void>(`/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
}

export async function getActivityFromBackend(): Promise<ActivityLog[]> {
  return backendRequest<ActivityLog[]>("/activity");
}

export async function getTasksSummaryFromBackend(): Promise<TasksSummary> {
  return backendRequest<TasksSummary>("/reports/tasks-summary");
}
