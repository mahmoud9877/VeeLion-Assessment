## Installation Steps

1. Navigate to the backend folder `cd backend`
2. Install the dependencies `npm i`
3. Run the server `npm run start`

It will be available on `http://localhost:4000`

## Running with Docker

From the repository root, run `docker compose up -d --build`.

Data is stored in the named volume `backend-data`, mounted at `/app/data`.
- **First start:** the volume is filled from `backend/data/*.json`, the seed data built into the image.
- **After that:** changes are saved in the volume. They survive restarts and rebuilds, and the files in `backend/data/` are not changed.

| Task | Command |
|---|---|
| View the data | `docker compose exec backend cat /app/data/tasks.json` |
| Back up the data | `docker compose cp backend:/app/data ./data-backup` |
| Reset to the seed data | `docker compose down -v`, then `docker compose up -d --build` (**deletes all saved data**) |

A named volume is used instead of a bind mount (`./backend/data:/app/data`) because the container runs as `node` (UID 1000). With a bind mount, saving only works when the host user is also UID 1000; on any other host it fails with `EACCES`.
