import type { Task } from "@/types/api";
import { TaskItem } from "@/components/tasks/TaskItem";
import { StateMessage } from "@/components/ui/StateMessage";

type TaskListProps = {
  tasks: Task[];
  pendingTaskIds: ReadonlySet<string>;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskList({ tasks, pendingTaskIds, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <StateMessage variant="empty" message="No tasks match this filter." />;
  }

  return (
    <ul className="task-list" aria-label="Task list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          busy={pendingTaskIds.has(task.id)}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
