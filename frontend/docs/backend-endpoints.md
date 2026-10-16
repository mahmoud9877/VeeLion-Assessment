# Backend API Endpoints

Base URL: `http://localhost:4000`

## Shared Error Shape

```ts
type ErrorResponse = {
  error: {
    message: string;
    details?: {
      unsupportedFields?: string[]; // present when the body has fields the endpoint does not accept
    };
  };
};
```

## Request Validation

All `POST` and `PATCH` bodies are validated before they reach the handler:

- The body must be a JSON object (`400 Body must be a JSON object.`).
- Only the documented fields are accepted. Any other field (for example `id`, `createdAt`) is rejected with
  `400 Body contains unsupported fields.` and the field names in `error.details.unsupportedFields`.
- String fields are trimmed before they are saved.
- Malformed JSON returns `400` with the parser message.

Other errors:
- `404 Route not found: <METHOD> <path>` for unknown routes.
- `500 Internal server error` for unexpected failures.

## Task Endpoints

### GET /tasks

Fetch all tasks.

```ts
type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

type GetTasksResponse = {
  data: Task[];
};
```

### GET /tasks/:id

Fetch one task by ID.

```ts
type GetTaskResponse = {
  data: Task;
};
```

Possible errors:
- `404` when task does not exist.

### POST /tasks

Create a task.

```ts
type CreateTaskRequest = {
  title: string; // required, trimmed, non-empty
  completed?: boolean; // default false
};

type CreateTaskResponse = {
  data: Task;
};
```

Possible errors:
- `400 Body must be a JSON object.`
- `400 Body contains unsupported fields.` (any field other than `title`, `completed`)
- `400 "title" is required.`
- `400 "title" must be a string.`
- `400 "title" cannot be empty.` (empty after trim)
- `400 "completed" must be a boolean.`

### PATCH /tasks/:id

Update task title or status.

```ts
type PatchTaskRequest = {
  title?: string; // if provided, trimmed, non-empty
  completed?: boolean;
};

type PatchTaskResponse = {
  data: Task;
};
```

At least one of `title` or `completed` is required. `updatedAt` is set by the server.

Possible errors:
- `400 Body must be a JSON object.`
- `400 Body contains unsupported fields.` (any field other than `title`, `completed`)
- `400 Provide at least one updatable field.`
- `400 "title" must be a string.`
- `400 "title" cannot be empty.`
- `400 "completed" must be a boolean.`
- `404 Task not found.`

### DELETE /tasks/:id

Delete task by ID.

```ts
type DeleteTaskResponse = void; // status 204
```

Possible errors:
- `404 Task not found.`

## Activity Endpoints

Task changes are logged automatically by the backend. The frontend does not need to call `POST /activity` for them:

| Task change | `action` | `info` |
|---|---|---|
| `POST /tasks` | `Task created` | task title |
| `PATCH /tasks/:id` changing `completed` | `Task completed` / `Task reopened` | task title |
| `PATCH /tasks/:id` changing `title` | `Task renamed` | `"old" → "new"` |
| `DELETE /tasks/:id` | `Task deleted` | task title |

A PATCH that changes nothing logs nothing.

### GET /activity

Fetch activity logs.

```ts
type ActivityLog = {
  id: string;
  action?: string;
  info?: string;
  when: string; // ISO datetime
};

type GetActivityResponse = ActivityLog[];
```

### POST /activity

Create activity log entry.

```ts
type CreateActivityRequest = {
  action: string; // required, trimmed, non-empty
  info?: string; // optional, trimmed
};

type CreateActivityResponse = ActivityLog;
```

Possible errors:
- `400 Body must be a JSON object.`
- `400 Body contains unsupported fields.` (any field other than `action`, `info`)
- `400 "action" is required and must be a string.`
- `400 "action" cannot be empty.`
- `400 "info" must be a string.`

Notes:
- Response shape for activity endpoints is raw objects/arrays (not wrapped in `data`).
- New entries get a UUID `id`; older entries may have numeric-string ids.
- `info` is omitted from the response when it was not sent, so keep `info` (and `action` for old entries) optional in the client type.

## Reports Endpoints

### GET /reports/tasks-summary

Fetch summary statistics for tasks and activity.

```ts
type TasksSummary = {
  total: number;
  byStatus: {
    todo: number;
    "in-progress": number;
    done: number;
  };
  recentActivityCount: number;
};

type GetTasksSummaryResponse = TasksSummary;
```

Notes:
- `in-progress` is currently returned as `0` because task data only includes boolean `completed`.
- `recentActivityCount` is currently the total number of activity entries (no time window is applied).
- Response shape is raw object.
