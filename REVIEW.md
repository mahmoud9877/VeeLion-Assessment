# Code Review: Full System

**Scope:** the whole project. That covers the Express backend (`backend/`), the Next.js frontend (`frontend/`), the Docker setup (`docker-compose.yml`, both `Dockerfile`s) and the docs.

**Method:**
- Every source file was read.
- Bugs were reproduced against running copies of the services, never against live data. This included concurrency tests (20 and later 100 parallel writes) and headless-browser tests of every page in light, dark and mobile layouts.
- Three independent review passes (backend, frontend, infrastructure and integration) were run on the final code. Each of their claims was checked again before it was included.

**Severity:** 🔴 bug, data loss or deployment breakage · 🟠 should fix · 🟡 nice to have.

**How this document is organised**
- [Part 1](#part-1-frontend-original-code): findings in the original frontend. All fixed.
- [Part 2](#part-2-backend-original-code): findings in the original backend. All fixed.
- [Part 3](#part-3-current-system-open-findings): open findings in the system as it is now.
- [Part 4](#part-4-what-was-done): what was changed.
- [Part 5](#part-5-recommended-next-steps): recommended next steps.

---

## Part 1: Frontend (original code)

The Task Dashboard is in reasonable shape. It already has a custom hook, small presentational components, typed responses and loading, error and empty states. Its problems are mostly about error handling and concurrency. The Activity Feed is the problematic module. It keeps derived data in state, re-renders on a timer, duplicates logic, renders every timestamp twice, has no loading or error states, and **crashes when the API returns an error**. The proxy layer turns every backend error into a `500`.

### 1. Performance

#### 🔴 P1. Activity Feed re-renders on a 1.4s timer
**Where:** `app/activity/page.tsx` (the `tick` interval and the effects that depend on it)

**What is wrong:** A `setInterval` bumps `tick` every 1.4s. Every tick re-runs the filter effect, then copies the whole list into `forcedList` (alternating a shallow copy and a deep copy), then recomputes `stats`. Each tick triggers several renders of the full list, even when nothing has changed.

**Why it matters:** The cost grows with the size of the list. It keeps the CPU busy and drains battery on an idle page. It also makes the component very hard to reason about.

**Improvement:** Remove the timer, `tick` and `forcedList`. If the feed should refresh live, poll the API on purpose (for example every 30s, paused while the tab is hidden) rather than re-rendering stale data.

#### 🟠 P2. Derived data stored in state and synced with effects
**Where:** `app/activity/page.tsx` (`shownActivity`, `forcedList`)

**What is wrong:** The filtered list is computed in a `useEffect` and written back to state. This always takes an extra render, and for one frame the UI shows stale results.

**Why it matters:** Each change causes an extra render, and the copies of the data can drift apart. This is a well-known React anti-pattern ("You might not need an effect").

**Improvement:** Compute the filtered list during render with `useMemo(() => filter(all, query), [all, query])`. Keep only the source data and the query in state.

#### 🟡 P3. Search filters on every keystroke without deferring
**Where:** `app/activity/page.tsx`

**What is wrong:** The search runs on every keystroke at urgent priority.

**Why it matters:** This is fine for small lists, but typing becomes laggy once the feed grows.

**Improvement:** Pass the query through `useDeferredValue` so typing stays responsive.

---

### 2. Maintainability

#### 🟠 M1. Duplicated logic in the Activity Feed
**Where:** `app/activity/page.tsx`

**What is wrong:**
- `formatTimeA` and `formatTimeB` are identical.
- `applyFilterA` and `applyFilterB` are the same filter, one using `includes` and one using `indexOf`.
- Both filters run in sequence on the same input.

**Why it matters:** A future fix has to be made in two places, and readers waste time looking for a difference that doesn't exist.

**Improvement:** Keep one `filterActivities()` and one shared `formatDateTime()` (in `lib/format.ts`).

#### 🟠 M2. The Activity Feed is one 130-line page component
**Where:** `app/activity/page.tsx`

**What is wrong:** Data fetching, filtering, formatting and markup all live in a single `"use client"` page.

**Why it matters:** None of it can be reused or tested in isolation. It is also inconsistent with the Task module, which already uses a hook plus components.

**Improvement:** Mirror the Task module:
- a `useActivities()` hook
- `ActivitySearch`, `ActivityList` and `ActivityItem` components
- a thin page that composes them

#### 🟠 M3. The fetch helper and error parsing live inside `useTasks`
**Where:** `hooks/useTasks.ts`

**What is wrong:** `requestJson` and `getErrorMessage` are defined privately inside the tasks hook.

**Why it matters:** The Activity and Reports modules need the same helpers, so they would end up copying them.

**Improvement:** Move them to `lib/http.ts` and share them.

#### 🟠 M4. Inline styles everywhere
**Where:** every page and component

**What is wrong:** Layout and colours are written as inline `style={{...}}` objects.

**Why it matters:**
- Styles can't be reused, and the design isn't consistent.
- Hover, focus and media queries are impossible.
- A new object is created on every render.

**Improvement:** Use semantic CSS classes built on design tokens in `globals.css`.

#### 🟡 M5. Navigation repeated on every page
**Where:** `app/tasks/page.tsx`, `app/activity/page.tsx`

**What is wrong:** Each page renders its own "Back" link.

**Why it matters:** There's no global navigation, so a user has to go back to the home page to switch modules.

**Improvement:** Put a shared `SiteHeader` with active-link state in `app/layout.tsx`.

#### 🟡 M6. Pointless try/catch blocks in `lib/backendApi.ts`
**Where:** `lib/backendApi.ts`

**What is wrong:** Every function wraps its body in `try { ... } catch (e) { throw new Error(e.message) }`. This rebuilds the error and loses its type, stack and status, and the same code is repeated three times.

**Improvement:** Use one generic `backendRequest<T>()` that throws a typed `BackendError` with the HTTP `status`.

---

### 3. UX issues

#### 🔴 U1. A failed toggle hides the whole task list
**Where:** `components/tasks/TaskDashboard.tsx`, `hooks/useTasks.ts`

**What is wrong:** The load error and the update error share one `error` state, and the list only renders when `!error`. One failed PATCH replaces every task with an error box and a "Retry" button, and Retry reloads the list instead of retrying the toggle.

**Why it matters:** One failed action wipes the user's view.

**Improvement:**
- Keep `loadError` and `actionError` separate.
- Show the action error inline, with a dismiss button, above a list that stays visible.

#### 🔴 U2. The Activity Feed has no loading, error or empty states
**Where:** `app/activity/page.tsx`

**What is wrong:**
- While the data loads, the page shows "Total: 0" and an empty list.
- If the request fails, the error is swallowed.
- A search with no matches shows nothing at all.

**Why it matters:** The user can't tell "loading", "failed" and "nothing here" apart.

**Improvement:** Add explicit loading, error-with-retry and empty states, with separate messages for "no activity yet" and "no matches".

#### 🟠 U3. Every timestamp is rendered twice
**Where:** `app/activity/page.tsx`

**What is wrong:** Each item shows `formatTimeA(when)` and `formatTimeB(when)`, which produce the same string.

**Improvement:** Render it once, in a `<time dateTime=...>` element.

#### 🟠 U4. Placeholder text shown as content
**Where:** `app/activity/page.tsx`

**What is wrong:** Missing fields render as "(no action)" or "(no info)".

**Improvement:** Hide missing fields, or fall back to a neutral label.

#### 🟡 U5. Activity is shown oldest first
**Where:** `app/activity/page.tsx`

**What is wrong:** The list is in the order it was stored, so the newest events end up at the bottom.

**Improvement:** Sort by `when`, newest first, which is what people expect from a feed.

#### 🟡 U6. The whole task list is replaced by "Loading..." on every refetch
**Where:** `components/tasks/TaskDashboard.tsx`

**What is wrong:** The list unmounts on every reload.

**Improvement:** Show a placeholder only on the first load. Keep the current data visible while a refetch runs.

#### 🟡 U7. The home page cards have no description, and a module is missing
**Where:** `app/page.tsx`

**What is wrong:**
- The cards are just headings with empty space underneath.
- There's no entry for Reports.

**Improvement:** Add a description to each card, and add a Reports card.

#### 🟡 U8. The filter buttons don't show counts
**Where:** `components/tasks/StatusFilter.tsx`

**What is wrong:** The user can't see how many tasks are in each status before clicking.

**Improvement:** Show a count on each filter, for example "Pending 3".

---

### 4. Code quality

#### 🔴 C1. The Activity Feed crashes when the API returns an error
**Where:** `app/activity/page.tsx`

**What is wrong:** The page calls `response.json()` without checking `response.ok`. When the proxy returns `{ error: {...} }` with a 500, that object is stored as the list. `forcedList.map` then throws `TypeError: forcedList.map is not a function`, and the whole page fails.

**Improvement:**
- Check `response.ok`.
- Parse the error body.
- Show an error state.

#### 🔴 C2. The proxy routes turn every backend error into a 500
**Where:** `app/api/tasks/[id]/route.ts`, `app/api/tasks/route.ts`, `app/api/activity/route.ts`

**What is wrong:** `backendApi` throws a plain `Error`, so the HTTP status is lost, and each route handler returns `500` for everything. A `404 Task not found` or a `400` validation error reaches the browser as a `500`. Invalid JSON sent to the PATCH route (`request.json()` throws) also returns `500` instead of `400`.

**Why it matters:**
- The client can't tell a user error from a server failure.
- Logs and monitoring fill up with false 5xx errors.

**Improvement:**
- Throw a `BackendError` that carries `status`.
- Forward that status and message in the proxy.
- Return `400` for an unreadable body.

#### 🟠 C3. `requestJson` hides the real error
**Where:** `hooks/useTasks.ts`

**What is wrong:**
- The `throw` inside the `try` is caught by its own `catch` and rebuilt.
- If the error body isn't JSON (for example an HTML 502 page from a proxy), the user sees the parser's message, `Unexpected token '<'...`, instead of the fallback "Request failed with 502".

**Improvement:** Parse the body in its own `try` and fall back cleanly, as in the shared `lib/http.ts`.

#### 🟠 C4. A single `updatingTaskId` breaks when two tasks are toggled at once
**Where:** `hooks/useTasks.ts`

**What is wrong:** Suppose the user toggles task A, then task B before A finishes. When A's request completes, `setUpdatingTaskId("")` clears B's busy state while B's request is still running. B's button becomes active again and can be submitted twice.

**Improvement:** Track pending ids in a `Set<string>`.

#### 🟡 C5. Unused or misleading values
**Where:** `app/activity/page.tsx`, `hooks/useTasks.ts`

**What is wrong:**
- `stats.everySecondTick` is computed but never used.
- `useTasks` returns `tasks`, which nothing reads.

**Improvement:** Remove both.

#### 🟡 C6. Loose error type
**Where:** `types/api.ts`

**What is wrong:** `ErrorResponse` makes `error` and `message` optional. The backend always sends both, and can also send `details`.

**Improvement:** Match the documented error shape: required `message`, optional `details`.

#### 🟡 C7. Proxy routes rely on implicit dynamic rendering
**Where:** `app/api/*`

**What is wrong:** In Next 14, `GET` route handlers can be statically cached. These routes are only dynamic because their `fetch` calls happen to use `cache: "no-store"`.

**Improvement:** Declare `export const dynamic = "force-dynamic"` so the intent is explicit.

---

### 5. React best practices

#### 🔴 R1. `useEffect` used for derived state
**Where:** `app/activity/page.tsx`

**What is wrong:** The page uses `useEffect` to compute derived state (see P2). The timer effect also makes state change on its own, without any user input.

**Improvement:** Compute the values during render with `useMemo`, and keep effects for syncing with external systems only.

#### 🟠 R2. No cleanup or cancellation on fetch
**Where:** `app/activity/page.tsx`, `hooks/useTasks.ts`

**What is wrong:** A response that arrives after unmount, or after a newer request, still calls `setState`.

**Improvement:** Use an `AbortController` in the effect and ignore aborted requests.

#### 🟠 R3. Everything on the Activity page runs on the client
**Where:** `app/activity/page.tsx`

**What is wrong:** The whole route, including the static heading and layout, is a client component.

**Improvement:** Keep the page a server component and push `"use client"` down to the interactive parts, as the Tasks page already does.

#### 🟡 R4. Accessibility gaps
**Where:** `app/activity/page.tsx`, `components/tasks/TaskDashboard.tsx`

**What is wrong:**
- The search input has a placeholder but no label.
- Status changes (loading, errors) aren't announced to screen readers.
- The `<br />` between duplicated timestamps is meaningless.

**Improvement:**
- Give the search a visually hidden `<label>`.
- Use `role="status"` and `role="alert"` on state messages.
- Use semantic `<time>` elements.

---

---

## Part 2: Backend (original code)

**Summary.** The layering (routes → controllers → services) was a good start, but it wasn't applied consistently:
- Validation was split between controllers and services, with different rules in each.
- A complete validator module existed but was never used.
- The activity module ignored the shared store and error handling entirely.

Two bugs were serious: concurrent writes corrupted the data file, which took down every endpoint, and PATCH saved any field the client sent.

### 🔴 B1. Concurrent writes corrupt `tasks.json` and take the whole API down
**Where:** `utils/jsonStore.js` (now `utils/jsonFileStore.js`), used by every service

**What is wrong:** Every write read the whole file, changed it and wrote it back, with nothing stopping two requests from overlapping. Twenty parallel `POST /tasks` requests all returned `201`, but they left the file as invalid JSON: a shorter write landed on top of a longer one and left its tail behind.

**Why it matters:** Once the file is invalid JSON, **every** endpoint returns `500` until someone repairs the file by hand. Even when the file survives, overlapping writes silently lose data.

**Fix applied:**
- Changes to each file now run one at a time through a queue (`JsonFileStore.update`). The queue is shared by every store object that points at the same file.
- Each save goes to a temporary file that is then renamed over the real one, so readers never see a half-written file.

**Verified:** 50 parallel creates, 30 parallel updates and 10 parallel deletes left exactly the expected data. A later independent run of 100 parallel creates did too.

### 🔴 B2. PATCH saves any field the client sends
**Where:** `tasks.service.js` (`{ ...existingTask, ...updates }`)

**What is wrong:** The controller only checked `title` and `completed`, then copied the whole request body into the stored task. A request like `{"completed":true,"id":"hijacked","createdAt":"x","owner":"evil"}` was saved exactly as sent.

**Why it matters:** A client could change a task's `id` (breaking its URL), rewrite its history, or add arbitrary fields.

**Fix applied:** Every body is validated against a list of allowed fields, and unknown fields get `400` with `unsupportedFields` listing them. Only the cleaned values reach the service.

### 🟠 B3. File paths depend on where the server is started
**Where:** every service (`path.join(process.cwd(), 'data', …)`)

**What is wrong:** The data folder was found relative to the folder the server was started from, not where the code lives.

**Why it matters:** Starting the server from outside `backend/` made every request return `500`.

**Fix applied:** The data folder is set once in `createApp()`, based on `__dirname`, and can be passed in as `createApp({ dataDir })`.

### 🟠 B4. Validation scattered, inconsistent and partly dead
**Where:** `tasks.controller.js`, `tasks.service.js`, `utils/taskValidator.js` (never imported)

**What is wrong:**
- The same rules were written twice, with different messages.
- The rules disagreed: create accepted a 1-character title, but update rejected it as "too short".
- A complete validator that blocked unknown fields existed, but nothing called it.

**Fix applied:**
- Validators live in `modules/*/validators/` and are applied by `validateBody` middleware in the routes.
- Shared checks are in the base class `utils/bodyValidator.js`, which `TasksValidator` and `ActivitiesValidator` extend.
- Controllers contain no logic, and services trust their input.

### 🟠 B5. `POST /activity` accepts anything
**Where:** the activity module

**What is wrong:** An empty body saved `{ action: undefined, info: undefined }`.

**Fix applied:** `action` is required, must be a non-empty string and is trimmed. `info` is optional, must be a string and is trimmed. Unknown fields are rejected.

### 🟠 B6. The activity module bypasses the shared infrastructure
**Where:** `activity.service.js`, `activity.routes.js`

**What is wrong:**
- It used blocking `readFileSync` and `writeFileSync`.
- Two identical loaders existed (`loadDataA` and `loadDataB`).
- Ids were `String(Date.now())`, so two entries in the same millisecond got the same id.
- Its routes had no `asyncHandler`.

**Fix applied:**
- It uses the shared asynchronous store and queue.
- Ids are UUIDs.
- Routes are wrapped in `asyncHandler`.

### 🟠 B7. Task changes are never written to the activity log
**Where:** system level

**What is wrong:** Nothing ever called `POST /activity`, so the Activity feed and the Reports count never changed. The UI also didn't use `POST /tasks` or `DELETE /tasks/:id`, even though the backend supports them.

**Fix applied:**
- The tasks service logs `Task created`, `Task completed`, `Task reopened`, `Task renamed` and `Task deleted` itself.
- A failure to log never fails the task request.
- The UI now has "Add task" and a two-step delete.

### 🟡 B8. A wrong-shaped data file is silently erased
**Where:** `jsonStore.js` (now `jsonFileStore.js`)

**What is wrong:** Valid JSON that wasn't an array was read as `[]`, and the next write replaced the file's contents.

**Fix applied:** The store now throws an error and leaves the file untouched.

### 🟡 B9. Inconsistent naming and layering
**What is wrong:**
- Module names mixed singular and plural (`activity` vs `tasks`).
- Controller function names didn't match the services (`patchTask`/`removeTask` vs `updateTask`/`deleteTask`).
- Naming was mixed elsewhere too (`createNewActivity`, `utils/taskValidator.js` vs `*.service.js`).
- The reports controller wrapped itself in `asyncHandler`, unlike the others.

**Fix applied:**
- One file naming scheme, `<module>.<layer>.js`, with plural module names.
- Controller function names match the service functions they call.
- All wiring (validation and async handling) happens in the routes.
- The `/activity` URL and `activity.json` file names were kept, so existing clients and data keep working.

---

## Part 3: Current system (open findings)

These are issues in the code **as it is now**, after the refactor. They come from three independent review passes, merged, deduplicated and checked again. None of them breaks the app in normal use. Most are about deployment, hardening and long-term maintenance.

### 3.1 Deployment and infrastructure

#### ✅ D1. The Docker data volume works only because the host user ID happens to match (fixed)
**Where:** `docker-compose.yml` (`./backend/data:/app/data`), `backend/Dockerfile` (`chown` then `USER node`)

**What is wrong:** The bind mount hides the image's `chown`ed folder, so `/app/data` keeps the host's ownership. Writes succeed only because the host user ID is 1000, the same as `node` in `node:20-alpine`.

**Why it matters:** On any other host user ID (CI, another developer's machine, rootless Docker), every POST/PATCH/DELETE fails with `EACCES`. The store needs write access to the folder itself, because it creates a temporary file and renames it. GET requests keep working, so this looks like a partial outage.

**Fix applied:** The bind mount was replaced with the named volume `backend-data`, which Docker fills from the image (owned by `node`) on first use. The problem was reproduced with a container running as user 1001: reads returned `200` and every write returned `500 EACCES`. With the named volume, create, update and delete work, and the data survives a container restart. How to inspect, back up and reset the data is in `backend/README.md`.

#### 🟠 D2. The backend's write API is published on every network interface, with no authentication
**Where:** `docker-compose.yml` (`"4000:4000"`)

**What is wrong:** The browser only talks to the Next.js API routes, and Next reaches the backend over the Compose network, so publishing port 4000 adds nothing.

**Why it matters:** Anyone who can reach the host can create, change and delete tasks directly.

**Fix:** Use `expose: ["4000"]`, or bind to `127.0.0.1:4000:4000` for debugging. (The project has no authentication at all, which is acceptable for this assessment, but it should be stated.)

#### 🟠 D3. The server-only backend URL is a build-time `NEXT_PUBLIC_` variable
**Where:** `frontend/lib/constants.ts`, `frontend/Dockerfile` (build `ARG`), `.env.example`

**What is wrong:** Only the route handlers read the URL, but `NEXT_PUBLIC_*` values are written into the build at build time.

**Why it matters:**
- The same image can't be pointed at a different backend.
- Setting `environment:` in Compose has no effect.
- The prefix suggests the value is safe for browsers. A future client-side import would ship the internal `http://backend:4000` address to browsers.

**Fix:**
- Rename it to `BACKEND_API_URL` and read it at request time from a module marked `import "server-only"`.
- Drop the build `ARG` and set the value under `environment:` instead.

#### 🟠 D4. No graceful shutdown
**Where:** `backend/src/server.js`, both `Dockerfile` `CMD`s

**What is wrong:** Node runs as PID 1 with no `SIGTERM` handler, so `docker compose stop` waits 10 seconds and then kills the process.

**Why it matters:**
- Requests in progress are dropped.
- A kill between the task write and its activity write leaves the two files out of sync.
- Leftover `*.tmp` files can stay in `data/`.

**Fix:**
- Add `init: true` in Compose.
- On `SIGTERM`, call `server.close()` and wait for the store queues to finish.

#### 🟡 D5. No health check, no request logging
**What is wrong:**
- There's no `/health` endpoint and no Docker `HEALTHCHECK`, so `depends_on` only controls start order.
- Only 5xx errors are logged.

**Fix:**
- Add a backend `GET /health` and a Compose `healthcheck` with `condition: service_healthy`.
- Add a one-line request log (method, path, status, duration).
- Make the data folder configurable with a `DATA_DIR` environment variable. `createApp({ dataDir })` already accepts it; only the environment-variable connection in `server.js` is missing.

### 3.2 Security and abuse

#### 🟠 S1. No size limits, and the data grows forever
**Where:** the validators, `express.json()`, `GET /tasks` and `GET /activity`

**What is wrong:**
- A 99,000-character title is accepted. The only cap is the 100 KB body limit.
- Every write re-saves the whole file.
- Both list endpoints return everything, with no pagination.
- A "Task renamed" entry stores both the old and the new title.

**Why it matters:** Repeated large requests slow down every later request and fill the disk.

**Fix:**
- Cap the lengths of `title`, `action` and `info` (for example 200, 100 and 500 characters).
- Set `express.json({ limit: '10kb' })`.
- Add `limit`/`offset` to `GET /activity`, or keep only the last N entries.

#### 🟠 S2. Clients can forge activity entries
**Where:** `POST /activity`

**What is wrong:** Any client can write `{"action":"Task deleted"}`, which looks identical to the entries the server logs itself.

**Why it matters:** The activity log can't be trusted as an audit trail.

**Fix:**
- Remove the public `POST /activity`, since the backend now logs task changes itself.
- Or tag every entry with `source: "system" | "user"`.

#### 🟡 S3. The proxy lets `..` through as a task id
**Where:** `frontend/app/api/tasks/[id]/route.ts` → `lib/backendApi.ts`

**What is wrong:** `encodeURIComponent("..")` leaves `..` unchanged. The URL parser then turns `…/tasks/..` into the backend's root address.

**Why it matters:** The impact is small today, because the backend answers 404, but the proxy shouldn't let path traversal reach the backend.

**Fix:** Check the id against `/^[A-Za-z0-9-]{1,64}$/` in the route and return `400` otherwise.

#### 🟡 S4. Version and error details leak
**What is wrong:**
- The backend sends `X-Powered-By: Express`.
- The 404 response repeats `req.originalUrl` back to the client.
- Body-parser messages are passed through as they are, for example `Unexpected token …`.
- The Next app sets no security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`).

**Fix:**
- Add `app.disable('x-powered-by')`, or helmet.
- Return a fixed 404 message.
- Map body-parser errors by `error.type` to fixed messages.
- Add `headers()` in `next.config.mjs`.

### 3.3 Reliability and correctness

#### 🟠 R1. A refresh can overwrite newer changes in the Tasks UI
**Where:** `hooks/useApiResource.ts`, `hooks/useTasks.ts`

**What is wrong:** `reload()` replaces all the data when it finishes. Suppose the user clicks Refresh and then quickly adds, toggles or deletes a task. The GET started before the change, but it can finish after it.

**Why it matters:** The task reverts, reappears after deletion or disappears after creation, until the next refresh.

**Fix:**
- Disable Refresh while a change is in progress, or cancel the running GET when a change starts.
- Or keep a counter of changes and ignore GET results that started before the latest change.

#### 🟠 R2. Proxy calls to the backend have no timeout
**Where:** `frontend/lib/backendApi.ts`

**What is wrong:** A backend that accepts the connection and then stalls leaves requests hanging for minutes, until the Node HTTP client's default timeout.

**Why it matters:** The spinner hangs, and so does "Refreshing…".

**Fix:** Pass `signal: AbortSignal.timeout(8000)` and map a timeout to `504`.

#### 🟡 R3. A damaged data file still breaks every request
**Where:** `jsonFileStore.js`

**What is wrong:**
- Invalid JSON, or a `null` entry inside the array, returns `500` on every request until the file is fixed by hand.
- If a write fails, its temporary file is left behind.
- Data isn't flushed to disk before the rename.

**Fix:**
- Check the files once at startup and refuse to start with a clear message.
- Delete the temporary file when a write fails, using `finally`.
- Optionally call `fsync` before the rename.

#### 🟡 R4. An update that changes nothing still changes `updatedAt`
**Where:** `tasks.service.js`

**What is wrong:** `PATCH {"completed":false}` on a task that is already pending bumps `updatedAt` but logs no activity, so the two disagree.

**Fix:** If nothing changed, skip the write and return the existing task.

#### 🟡 R5. Responses are cast to their types without being checked
**Where:** `frontend/lib/backendApi.ts`, `lib/http.ts` (`as T`)

**What is wrong:** If the backend's response shape changes, the code still type-checks but throws inside render. With no error boundary, that crashes the page.

**Fix:**
- Add small runtime checks (or zod) in `backendApi`, returning `502` on a mismatch.
- Add `app/error.tsx` (see F3).

### 3.4 API design

#### 🟡 A1. Response envelopes are inconsistent
**What is wrong:** `/tasks*` responses are wrapped in `{ data }`, while `/activity` and `/reports/tasks-summary` return raw values.

**Status:** This is documented and the frontend handles it, but every client needs a different unwrapping rule per module.

**Fix:** Use `{ data }` everywhere, and update the frontend in the same change.

#### 🟡 A2. The report numbers don't mean what their labels say
**What is wrong:**
- `"in-progress"` is always `0`, because tasks only have a `completed` true/false field.
- `recentActivityCount` counts every activity ever logged, but the UI calls it "Recent activity".

**Fix:**
- Either count only a time window (for example the last 7 days) or rename the field and label to "Total events".
- Hide or annotate the "In progress" row until tasks have a real `status` field.

#### 🟡 A3. The proxy repeats backend validation, with different wording
**What is wrong:**
- `POST /api/tasks` and `PATCH /api/tasks/:id` check the body again, with their own messages (`title is required` vs `"title" is required.`).
- PATCH is limited to `completed`, even though the backend also accepts `title`.

**Fix:** Forward the body and let the backend be the only place that validates. Its status codes are already forwarded.

#### 🟡 A4. Unsupported methods return 404 instead of 405
**Example:** `PUT /tasks/:id` returns `404 Route not found`.

**Fix:** Add a 405 handler with an `Allow` header.

### 3.5 Frontend

#### 🟠 F1. Accessibility: focus handling
**Where:** `components/tasks/TaskItem.tsx`, `app/globals.css`

**What is wrong:**
- Opening or cancelling the delete confirmation removes the focused button, so focus falls back to `<body>`. The same happens after a delete.
- The focus style is `outline: none` plus a `box-shadow`. Windows high-contrast (forced-colors) mode removes box-shadows, so focus becomes invisible.

**Fix:**
- Move focus to the confirm button when the confirmation opens. Move it back to the trash button on Cancel, and to the next task after a delete.
- Use `outline: 2px solid transparent` together with the shadow.

#### 🟡 F2. Smaller accessibility issues
**What is wrong:**
- The `aria-label`s don't contain the visible text (WCAG 2.5.3). For example, the button showing "Delete" is labelled "Confirm deleting …".
- Reduced-motion settings only slow the spinner. Hover lifts and bar animations still move.

#### 🟡 F3. No `error.tsx`, `not-found.tsx` or favicon
**What is wrong:**
- A render error shows Next's default error screen, without the site header.
- Unknown URLs get the bare default 404 page.
- Every visit triggers a 404 for `/favicon.ico`.

#### 🟡 F4. CSS and edge cases
**What is wrong:**
- `color-mix()` and `backdrop-filter` have no fallback. On older browsers the sticky header becomes see-through.
- Safari before version 18 needs `-webkit-backdrop-filter`.
- The active navigation link matches by prefix, so `/tasks-archive` would also highlight "Tasks".
- Sorting by an invalid date (`NaN`) gives an order that depends on the browser.

### 3.6 Testing and repo hygiene

#### 🟠 H1. No tests, no linting, no CI
**What is wrong:**
- The backend has only `start` and `dev` scripts.
- The frontend has no `lint` script and no ESLint.
- There is no `.github/` folder.

**Why it matters:** Nothing protects the validators, the write queue, the proxy's status forwarding, or the race-condition logic in the hooks.

**Fix:**
- **Backend:** `node --test` with supertest against `createApp({ dataDir: <temp folder> })`.
- **Frontend:** `next lint`, `tsc --noEmit`, and Vitest with React Testing Library and MSW for the hooks.
- **CI:** a small GitHub Actions workflow that runs all of these plus `docker compose build`.

#### 🟠 H2. Test data is committed and changes all the time
**Where:** `backend/data/*.json`

**What is wrong:** The running container writes straight into tracked files through the bind mount. Every manual test changes what gets committed. Smoke-test data such as "Test tasssk" and "sss" is already in the staged changes.

**Why it matters:** The "clean commit history" requirement can't be met while this keeps happening.

**Fix:**
- Commit seed files in `data/seed/` and copy them on first start.
- Add `backend/data/*.json` and `*.tmp` to `.gitignore`.

#### 🟡 H3. Mixed line endings, with no `.gitattributes`
**What is wrong:**
- 71 tracked files use CRLF and 8 use LF: both `Dockerfile`s, both `.dockerignore` files, `docker-compose.yml`, `next.config.mjs` and both data files.
- The backend always writes its data files with LF.

**Fix:** Add `.gitattributes` with `* text=auto eol=lf` (the safer choice for a repo deployed on Linux), then run `git add --renormalize .`.

#### 🟡 H4. Small gaps
**What is wrong:**
- The root README has no instructions for running both services together (`docker compose up --build`, ports, where data is stored, environment variables).
- `.dockerignore` doesn't exclude `.env*` or `*.tmp`.
- The `Date.now()` fallback in `utils/id.js` can never run, since `randomUUID` always exists on Node 14.17 and later.
- `backend/package.json` has no `engines` field.

### Known, accepted limitations
- The write queue works within one process only. Running several backend instances would need a real database.
- The task write and its activity write aren't saved as a single all-or-nothing step. A failure to log never fails the task request (by design).
- There is no authentication or authorisation anywhere, which is out of scope for this assessment.

### Checked and found fine
- **Validation:** the allow-list blocks prototype pollution (`__proto__` and `constructor` keys are rejected).
- **Body parsing:** malformed JSON gets `400` and oversized bodies get `413`.
- **Errors:** 500 responses hide internal details.
- **API contract:** the backend, `types/api.ts` and `backend-endpoints.md` agree on fields, status codes and the error shape.
- **Proxy statuses:** `201`, `204`, `400`, `404` and `503` are forwarded correctly.
- **Concurrent rendering:** React StrictMode's double effects, request cancellation, double-submit protection and route caching all behave correctly.
- **Dates:** formatting can't cause a server/client mismatch, because lists only render after the client has fetched them.

---

## Part 4: What was done

Every finding in Parts 1 and 2 is fixed:

| Area | Change |
|---|---|
| Shared | `lib/http.ts` (`requestJson`, `getErrorMessage`), `lib/format.ts`, `components/ui/*` (`PageHeader`, `StateMessage`, `StatCard`), `SiteHeader` in the layout |
| Proxy | `lib/backendApi.ts` with a generic `backendRequest` and `BackendError`. Routes forward the backend status, return `400` on bad JSON, and are `force-dynamic`. New `app/api/reports/route.ts` |
| Tasks | Separate `loadError` and `actionError`, a `Set` of pending ids, counts on the filters, the list stays visible on refetch, abortable fetch |
| Activity | `useActivities` hook. `ActivitySearch`, `ActivityList` and `ActivityItem` components. No timer, `useMemo` and `useDeferredValue` filtering, newest first, loading, error and empty states |
| Tasks (new) | Users can now create tasks (form with validation) and delete them (two-step confirm), through new `POST /api/tasks` and `DELETE /api/tasks/:id` proxy routes. The backend logs every create, complete/reopen, rename and delete to the activity feed |
| Reports | New `/reports` page using `useTasksSummary`, with stat cards, a status breakdown, and loading and error states |
| UI | New design tokens, light and dark themes, responsive layout, focus styles. The only inline style left is the data-driven bar width in `StatusBreakdown` |
| Backend | Every finding in Part 2: a safe concurrent store, allow-list validation in route middleware, no logic in controllers, file paths from `__dirname`, consistent naming, automatic activity logging |
| Backend (OOP) | Classes throughout:
- `JsonFileStore`.
- A `BodyValidator` base class with `TasksValidator` and `ActivitiesValidator`.
- `TasksService`, `ActivitiesService` and `ReportsService`, with dependencies passed in through their constructors.
- Controller classes.
- Router factory functions.
- A single composition root, `createApp({ dataDir })`.

Responses match the previous version exactly (35-request comparison) |
| Docs | `frontend/docs/backend-endpoints.md` matches the current API, including the validation rules, error messages and activity logging. `frontend/README.md` has the setup steps and the task checklist |


---

## Part 5: Recommended next steps

In priority order:

1. **Make deployment safe:**
   - ~~Use a named volume for the data (D1)~~ ✅ done.
   - Stop publishing port 4000 (D2).
   - Use a runtime `BACKEND_API_URL` (D3).
2. **Protect against abuse:**
   - Add length limits and a smaller body limit (S1).
   - Remove or tag public `POST /activity` (S2).
   - Validate task ids in the proxy (S3).
3. **Make it robust:**
   - Add a backend timeout in the proxy (R2).
   - Fix the refresh-versus-change race (R1).
   - Add graceful shutdown with `init: true` (D4).
   - Skip no-op updates (R4).
4. **Add a safety net:** backend API tests, frontend hook tests, lint and CI (H1).
5. **Clean the repo before submitting:**
   - Use seed data and gitignore the live data files (H2).
   - Add `.gitattributes` and renormalise line endings (H3).
   - Add root run instructions (H4).
6. **Polish:** consistent `{ data }` envelopes (A1), honest report labels (A2), focus handling (F1), `error.tsx` and `not-found.tsx` and a favicon (F3).
