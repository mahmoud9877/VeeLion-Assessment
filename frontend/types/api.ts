export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: string;
  action?: string;
  info?: string;
  when: string;
};

export type TaskStatus = "todo" | "in-progress" | "done";

export type TasksSummary = {
  total: number;
  byStatus: Record<TaskStatus, number>;
  recentActivityCount: number;
};

export type TasksResponse = {
  data: Task[];
};

export type TaskResponse = {
  data: Task;
};

export type ErrorResponse = {
  error: {
    message: string;
    details?: {
      unsupportedFields?: string[];
    };
  };
};

export type TaskFilter = "all" | "completed" | "pending";
