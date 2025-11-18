# Job Importer – Redis + BullMQ + MongoDB + Next.js

Modernized importer that fetches RSS/Atom job feeds, queues them through Redis Cloud + BullMQ, persists to MongoDB, and exposes a responsive React dashboard for operators to monitor runs, upload CSVs, and manage jobs.

## Tech Stack

- **Server:** Node 18+, Express 5, BullMQ, ioredis, MongoDB, Pino, Helmet
- **Client:** Next.js 15 (App Router), React 19, Tailwind CSS v4, SWR-less custom data hooks
- **Infra:** Redis Cloud, MongoDB Atlas, optional Docker compose for local dev

## Project Structure

```
├── server/        # Express API, BullMQ worker, Redis integrations
├── client/        # Next.js dashboard UI
├── docs/          # Architecture notes
├── .env.example   # Shared env template
└── docker-compose.yml (optional local stack)
```

## Environment Variables

Copy `docs/env.example` to `.env` at the repo root (or per package) and fill in secrets:

```bash
cp docs/env.example .env
```

Key variables:

- `PORT`, `MONGODB_URI`
- `REDIS_URL` _or_ (`REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`)
- `REDIS_TLS=true` when using Redis Cloud (set `REDIS_TLS_REJECT_UNAUTHORIZED=false` for self-signed certs)
- `CORS_ORIGINS`, `RATE_LIMIT_*`, `JOB_FETCH_INTERVAL_MS`, `WORKER_CONCURRENCY`
- `NEXT_PUBLIC_API_URL` for the client (e.g., `http://localhost:5003`)

## Setup

1. **Install deps**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Run the stack (local)**
   ```bash
   # Terminal 1 – API + worker + scheduler
   cd server
   npm run dev

   # Terminal 2 – UI
   cd client
   npm run dev
   ```

   By default the worker runs inside the same Node process as the API. When scaling horizontally, start additional workers with `node src/server.js` or a dedicated worker entry if preferred.

3. **Trigger manual import (optional)**
   ```bash
   cd server
   node src/scripts/fetchJobs.js
   ```

## API Surface

- `GET /api/health` – service, Redis, MongoDB health snapshot
- `GET /api/health/redis` – latency-only ping
- `GET /api/dashboard` – summary cards + queue counts + latest logs
- `GET /api/jobs` – pagination, search, status filters, sort
- `GET /api/jobs/:id` – job detail payload for modal
- `POST /api/jobs/bulk/delete` – deletes selected IDs
- `POST /api/jobs/bulk/retry` – re-queues failed IDs
- `POST /api/imports/upload` – accepts CSV-mapped payloads from the UI
- `GET /api/import-logs` – paginated run history

## Testing & Verification

### Redis & API health
```bash
curl -X GET "$NEXT_PUBLIC_API_URL/api/health"
curl -X GET "$NEXT_PUBLIC_API_URL/api/health/redis"
```

### Import workflow
```bash
# Trigger fetcher
curl -X GET "$NEXT_PUBLIC_API_URL/api/ping"

# Manually upload jobs (example body trimmed)
curl -X POST "$NEXT_PUBLIC_API_URL/api/imports/upload" \
  -H "Content-Type: application/json" \
  -d '{"source":"manual","jobs":[{"title":"Example","company":"ACME"}]}'
```

### Jobs endpoints
```bash
curl "$NEXT_PUBLIC_API_URL/api/jobs?page=1&limit=20&status=failed"
curl "$NEXT_PUBLIC_API_URL/api/jobs/<jobId>"
```

### UI smoke test checklist

1. Load `http://localhost:3000`
2. Confirm stats + queue cards render
3. Upload sample CSV and ensure preview + column mapping works
4. Open job modal, check raw JSON + timeline
5. Toggle dark mode; ensure focus states visible

## Docker (optional)

1. Copy `.env.example` to `.env` and fill in values.
2. Run:
   ```bash
   docker compose up --build
   ```
   Compose brings up:
   - `api` (Express + worker)
   - `client` (Next.js)
   - `redis` (for local dev; point to Redis Cloud in production)

## Production Notes

- **Redis connection** uses ioredis with TLS, exponential backoff, NX locks, latency metrics, and graceful shutdown on SIGINT/SIGTERM.
- **BullMQ** infrastructure (queue, scheduler, events, worker) shares a single configuration object and auto-closes on shutdown.
- **Security**
  - Helmet, CORS allow-list, rate-limiter, structured logging with redaction.
  - `.env.example` captures every key; no secrets in repo.
- **Performance**
  - Feed fetcher uses Redis locks + chunked BullMQ jobs.
  - Mongo models indexed for search/status/recency.
  - Import logs auto-expire after 90 days to keep the collection lean (TTL index).
- **Client UX**
  - Tailwind-based responsive layout, keyboard-focusable controls, aria labels.
  - Toast notifications for all network operations.
  - Dark/light toggle stored in `localStorage`.

## Manual Validation Checklist

- [ ] `npm run dev` (server) connects to Mongo + Redis without warnings.
- [ ] `GET /api/health` returns `redis.status === "up"`.
- [ ] Dashboard cards show real numbers after first import.
- [ ] CSV upload with at least one required column queues jobs (check toast + Redis queue length).
- [ ] Bulk retry + delete buttons operate on selected rows.
- [ ] Job detail modal shows raw payload + external link.
- [ ] Dark mode toggle persists reload; focus styles visible.

## Deployment Tips

- Point `NEXT_PUBLIC_API_URL` to the deployed API (Render, Railway, Fly, etc.).
- For workers, run the same `server` build as a separate process or scale horizontally – concurrency configurable via `WORKER_CONCURRENCY`.
- Use Redis Cloud ACLs to scope connections; enable TLS and restrict IPs.
- Configure CI pipeline to run `npm run lint` in both `server` and `client`. Add integration tests or cURL scripts above to smoke-test deployments.
