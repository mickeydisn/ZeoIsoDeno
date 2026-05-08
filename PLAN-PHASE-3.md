# Phase 3: Server-Side Persistence (SQLite)

**Goal:** Create a backend to persist deltas in a SQLite database.
**Dependencies:** Phase 1

## Tasks

- [x] Task: Implement SQLite database schema
  - Detail: Create a table `map_deltas` with columns: `cx`, `cy`, `x`, `y`, `data` (JSON).
- [x] Task: Create Server API endpoints in `webServer.ts`
  - Detail: `POST /api/map/deltas` to save deltas.
  - Detail: `GET /api/map/deltas?cx=...&cy=...` to load deltas for a chunk.
- [x] Task: Implement `RemotePersistence` service in worker
  - Detail: Handle synchronization between IndexedDB and the server.
