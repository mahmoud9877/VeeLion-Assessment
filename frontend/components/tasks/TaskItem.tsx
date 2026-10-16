"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import type { Task } from "@/types/api";

type TaskItemProps = {
  task: Task;
  busy: boolean;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskItem({ task, busy, onToggle, onDelete }: TaskItemProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <li className={task.completed ? "card task-item task-item--done" : "card task-item"} aria-busy={busy}>
      <div className="task-item__body">
        <p className="task-item__title">{task.title}</p>
        <p className="task-item__meta">
          Updated <time dateTime={task.updatedAt}>{formatDateTime(task.updatedAt)}</time>
        </p>
      </div>

      <span className={task.completed ? "badge badge--success" : "badge badge--warning"}>
        {task.completed ? "Completed" : "Pending"}
      </span>

      <div className="task-item__actions">
        {confirmingDelete ? (
          <>
            <button
              type="button"
              className="button button--danger"
              onClick={() => onDelete(task)}
              disabled={busy}
              aria-label={`Confirm deleting ${task.title}`}
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={task.completed ? "button" : "button button--primary"}
              onClick={() => onToggle(task)}
              disabled={busy}
              aria-label={`Mark ${task.title} as ${task.completed ? "pending" : "completed"}`}
            >
              {busy ? "Saving…" : task.completed ? "Mark as Pending" : "Mark as Completed"}
            </button>
            <button
              type="button"
              className="button button--ghost button--icon"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
              aria-label={`Delete ${task.title}`}
              title="Delete task"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </li>
  );
}
