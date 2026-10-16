"use client";

import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/api";
import { AddTaskForm } from "@/components/tasks/AddTaskForm";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskList } from "@/components/tasks/TaskList";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { StateMessage } from "@/components/ui/StateMessage";

export function TaskDashboard() {
  const {
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
  } = useTasks();

  const handleToggle = (task: Task) => {
    updateTaskStatus(task.id, !task.completed);
  };

  const handleDelete = (task: Task) => {
    deleteTask(task.id);
  };

  return (
    <div className="page">
      <PageHeader
        title="Task Dashboard"
        description="Track what is pending and what is done."
        actions={hasLoaded ? <RefreshButton refreshing={loading} onRefresh={reload} /> : null}
      />

      {!hasLoaded && loading ? <StateMessage variant="loading" message="Loading tasks…" /> : null}

      {!hasLoaded && loadError ? (
        <StateMessage
          variant="error"
          title="Tasks could not be loaded"
          message={loadError}
          actionLabel="Try again"
          onAction={reload}
        />
      ) : null}

      {hasLoaded ? (
        <>
          {loadError ? (
            <div className="alert" role="alert">
              <span>Could not refresh tasks: {loadError}</span>
            </div>
          ) : null}

          {actionError ? (
            <div className="alert" role="alert">
              <span>{actionError}</span>
              <button type="button" className="button button--ghost button--small" onClick={dismissActionError}>
                Dismiss
              </button>
            </div>
          ) : null}

          <AddTaskForm submitting={creating} onSubmit={createTask} />
          <StatusFilter value={filter} counts={counts} onChange={setFilter} />
          <TaskList
            tasks={filteredTasks}
            pendingTaskIds={pendingTaskIds}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        </>
      ) : null}
    </div>
  );
}
