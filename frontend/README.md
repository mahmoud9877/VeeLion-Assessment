# Frontend – Task Management System

Next.js 14 (App Router, TypeScript) frontend for the task dashboard, activity feed and reports.

## Getting Started

1. Start the backend first (see [`../backend/README.md`](../backend/README.md)); it runs on `http://localhost:4000`.
2. Install and run the frontend:

   ```bash
   cd frontend
   cp .env.example .env.local   # NEXT_PUBLIC_BACKEND_API_URL=http://localhost:4000
   npm install
   npm run dev
   ```

3. Open `http://localhost:3000`.

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

Backend endpoint reference: [`docs/backend-endpoints.md`](docs/backend-endpoints.md).

## Tasks

### 1. Code Review – `REVIEW.md`

- [x] Create [`REVIEW.md`](../REVIEW.md)
- [x] Review the Task Dashboard (`app/tasks`, `components/tasks`, `hooks/useTasks.ts`)
- [x] Review the Activity Feed (`app/activity/page.tsx`)
- [x] Review the API proxy routes (`app/api/*`) and `lib/backendApi.ts`
- [x] Group findings by category:
  - [x] Performance
  - [x] Maintainability
  - [x] UX issues
  - [x] Code quality
  - [x] React best practices
- [x] For each finding, state **what is wrong**, **why it matters**, and the **suggested improvement**

### 2. Refactor Both Modules

Improve the existing code without rewriting it from scratch, and keep all current functionality working.

- [x] Task Dashboard
  - [x] Apply the fixes from `REVIEW.md`
  - [x] Keep: listing tasks, status filter, toggling completion
- [x] Activity Feed
  - [x] Apply the fixes from `REVIEW.md`
  - [x] Keep: listing activity, search
- [x] Verify both pages still work end to end against the backend

### 3. Build the Reports Module – `/reports`

- [x] Add a proxy route `app/api/reports/route.ts` → `GET /reports/tasks-summary`
- [x] Add a typed fetch helper in `lib/backendApi.ts` and a `TasksSummary` type in `types/api.ts`
- [x] Create the page `app/reports/page.tsx` with reusable components
- [x] Display:
  - [x] Total number of tasks
  - [x] Tasks grouped by status (`todo`, `in-progress`, `done`)
  - [x] Recent activity count
- [x] Handle the loading state
- [x] Handle the error state
- [x] Link the page from the home page / navigation

### 4. Improve the UI

- [x] Define a consistent visual style (colors, spacing, typography) in `app/globals.css`
- [x] Restyle the Task Dashboard
- [x] Restyle the Activity Feed
- [x] Style the Reports page
- [x] Add shared navigation between pages
- [x] Check the layout on mobile widths

### 5. Submission

- [ ] Push to a public GitHub repository
- [ ] Include the updated code and `REVIEW.md`
- [ ] Keep a clean commit history
- [ ] Share the repository link
