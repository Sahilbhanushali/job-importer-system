## Updated Architecture Overview

### 1. Data ingestion

- `jobs/jobsFetcher.ts` reads a curated list of RSS/Atom feeds.
- Each run acquires a Redis NX lock (`job-importer:feed-lock`) with TTL to avoid concurrent executions.
- XML payloads are fetched with axios (timeout + UA header) and parsed via `xml2js`.
- Aggregated jobs are chunked (200 per BullMQ job) and enqueued with metadata, exponential backoff, and dedup-ready IDs.
- Fetch cadence is configurable via `JOB_FETCH_INTERVAL_MS`; optional immediate run on boot.

### 2. Redis & BullMQ

- Single `ioredis` client handles app-level commands, exposing latency probes + graceful shutdown handler.
- BullMQ queue, scheduler, and events share a single connection config (TLS-ready). Queue-level logging captures failures/completions.
- Worker concurrency is tunable (`WORKER_CONCURRENCY`). Each worker normalizes payloads, upserts jobs, and writes structured import logs.
- Import logs store counts, failures, duration, queue job id, and auto-expire after 90 days to keep metrics manageable.

### 3. MongoDB schema

- `jobs` collection:
  - Unique `jobId`, `status`, `source`, `rawPayload`, `lastImportedAt`.
  - Text index on title/company/description, plus status + recency indexes for dashboards.
  - Failure metadata stored for UI badges & retries.
- `import_logs` collection for operator insight (totals, duration, status). TTL index cleans up old runs.

### 4. API surface

- Express 5 with Helmet, compression, structured logging (Pino), rate-limiting, and strict CORS allow-list.
- Routes:
  - `/api/dashboard` -> summary cards + queue counts + recent logs.
  - `/api/jobs` -> pagination/search/filter/sort + bulk retry/delete endpoints.
  - `/api/imports/upload` -> CSV-driven manual imports (validated via Zod, chunked into queue).
  - `/api/health` + `/api/health/redis` -> readiness endpoints for monitoring.
  - `/api/import-logs` -> paginated history for UI chart/table.
- Central error middleware + 404 handler keep responses predictable.

### 5. Frontend

- Next.js 15 App Router, React 19, Tailwind v4.
- Components:
  - `DashboardStats`, `ImportForm`, `JobsTable`, `JobDetailModal`, `ImportHistory`, `Layout`.
  - Toast + Theme providers for notifications and dark mode toggle (persisted in `localStorage`).
- Client hits Express API directly via `NEXT_PUBLIC_API_URL` (no Next API proxy). `apiClient` handles base URL + credentials.
- CSV uploader (Papaparse) supports preview, column mapping, validation, and upload progress.
- Jobs table offers search, status filtering, sorting, pagination, and bulk actions surfaced via toasts.

### 6. Deployment considerations

- Dockerfiles for both server and client to support containerized deployments; compose file wires Redis + both services for local dev.
- Graceful shutdown closes HTTP server, worker, BullMQ infrastructure, and Redis connections.
- Logging is JSON in production (Pino) and pretty-printed locally.

### 7. Future enhancements

- Add webhooks/websockets for live progress updates.
- Implement Bull Board or Arena for queue visibility.
- Extend test suite (Jest/Supertest) and add Cypress smoke tests for CSV importer.
