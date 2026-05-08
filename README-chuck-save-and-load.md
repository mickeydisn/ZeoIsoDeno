# Chunk Save & Load — Delta System

This document summarizes the current delta-based chunk save/load implementation, how it is integrated in the project, and recommended next steps.

## Purpose
Only tile-level modifications (deltas) are persisted rather than whole generated chunks. This keeps storage small and lets procedurally-generated worlds retain user edits.

## Public interface
Location: IsoGame/map/interface.ts

IMapPersistence:
- saveChunkDeltas(cx: number, cy: number, deltas: any[]): Promise<void>
- loadChunkDeltas(cx: number, cy: number): Promise<any[]>

Any persistence implementation should implement those two methods.

## Implementations & key files
- Client (IndexedDB)
  - IsoGameAddon/iso/web/js/worker/db.ts — low-level IndexedDB manager (`mapDB`) with:
    - saveDeltas(cx, cy, deltas)
    - loadDeltas(cx, cy)
    - saveChunkMeta / getChunkMeta
  - IsoGameAddon/iso/web/js/worker/localPersistence.ts — higher-level wrapper used by the worker (registered at runtime). (init, saveChunkDeltas, loadChunkDeltas, flushSaveQueue expected here)
- Remote (Server)
  - IsoGameAddon/iso/web/js/worker/remotePersistence.ts — sends/receives deltas to server via:
    - POST /api/map/deltas  (body: { cx, cy, deltas })
    - GET /api/map/deltas?cx=...&cy=...
  - Server endpoint expected in webServer.ts (ensure path and payload match).

- Sync & orchestration
  - IsoGameAddon/iso/web/js/worker/mapSyncManager.ts — background sync manager:
    - Saves to local first, schedules remote push
    - Periodic sync (SYNC_PERIOD_MS) pushes dirty chunks to remote
    - Exposes forceSync() to flush local queue then push
  - IsoGameAddon/iso/web/js/worker/handlers/initHandlers.ts
    - Calls localPersistence.init()
    - Calls FactoryMap.getInstance().setPersistence(localPersistence) so map factory can use the persistence for load/save
  - IsoGameAddon/iso/web/js/main.ts (and game worker) wires worker -> mapSyncManager/localPersistence

- Data model
  - IsoGame/map/object/tile.ts
    - Tracks generated state vs current state
    - checkDirty(), toDeltaJson(), applyDelta()
    - toDeltaJson returns either null or an object that includes coordinates and only changed fields
  - IsoGame/map/object/chunk.ts
    - getDeltas(): collects tile deltas for the chunk
    - applyDeltas(deltas): applies tile deltas to the chunk matrix

## Current flow (save)
1. Tile state mutates (tile.lvl, tile.color, items, isBlock, isFrise).
2. Tile marks itself dirty (set by setters and/or checkDirty()).
3. Chunk.getDeltas() collects deltas (tile.toDeltaJson()).
4. localPersistence.saveChunkDeltas(cx, cy, deltas) persists into IndexedDB (mapDB.saveDeltas).
5. mapSyncManager periodically reads dirty chunks and calls remotePersistence.saveChunkDeltas(cx, cy, deltas).
6. remotePersistence POSTs to /api/map/deltas for server-side persistence (SQLite).

## Current flow (load)
1. When a chunk is created / requested, FactoryMap is configured with persistence (initHandlers).
2. FactoryMap (or init handler) asks mapSyncManager/localPersistence for stored deltas for cx,cy.
3. Returned deltas are applied with chunk.applyDeltas(deltas) to overlay user edits on generated data.

## Observations / correctness checks
- The core pieces exist and integrate:
  - Tile/Chunk delta API is implemented (checkDirty, toDeltaJson, applyDelta).
  - IndexedDB manager (mapDB) provides chunk metadata and delta storage APIs.
  - remotePersistence serializes deltas and calls server endpoints.
  - mapSyncManager orchestrates local-first + background remote sync.
  - initHandlers initializes localPersistence and sets FactoryMap persistence.
- Implementation details that should be validated in runtime:
  - Delta shape consistency: the system expects deltas containing coordinates and changed fields (tile.toDeltaJson returns { x, y, ... }). All producers/consumers should use that same shape.
  - localPersistence implementation must match mapDB API (init, saveChunkDeltas, loadChunkDeltas, flushSaveQueue). initHandlers and mapSyncManager call these methods — confirm localPersistence exports them.
  - Server API (webServer.ts) must accept POST /api/map/deltas with the same delta shape and support GET returning { deltas: [...] }. Confirm CORS and error responses match remotePersistence error handling (remotePersistence expects JSON error body).
  - Chunk.applyDeltas uses modulo logic for coordinates — verify negative coordinates behave as intended (the code calculates positive modulo).
  - mapDB.saveDeltas deletes existing deltas for a chunk then adds new ones in the same transaction. This is functional but replaces entire chunk delta set (not incremental patching). This is intended but note it overwrites previous deltas.

## Minor code issues / suggestions
- Multiple versions / small inconsistencies observed in copies of mapSyncManager / chunk code across the tree (some variants push { x, y, d } and others push full delta objects). Ensure there is a single canonical delta shape across modules.
- remotePersistence throws after reading response.json(); if server returns non-JSON error body this may throw prior to generating useful message. Consider defensive handling.
- mapDB.saveDeltas current behavior replaces all deltas for the chunk. If you want incremental patches, change store strategy (upsert by tile coords).
- Consider adding chunk/version metadata (e.g., version or checksum) to detect remote/local divergence and merge conflicts.
- Unit/integration tests are missing for the persistence path (tile mutation -> local save -> remote upload -> reload). Add tests for:
  - tile.toDeltaJson / applyDelta round-trip
  - local DB save/load
  - remote API contract (mock server)
  - negative coordinate edge cases

## Next steps / roadmap
- Verify the server API implementation:
  - Confirm webServer.ts implements POST /api/map/deltas and GET /api/map/deltas with the expected payload/response.
  - Add authentication or origin checks if needed.
- Stabilize delta shape across all modules and remove duplicate/old implementations.
- Add tests for the full save/load loop and CI checks.
- Improve retry/backoff on remotePersistence.saveChunkDeltas and better offline handling UI/state.
- Optimize delta storage:
  - Optionally compress or batch deltas for very large edits.
  - Add per-tile identifiers for partial upserts instead of full-chunk replace.
- Add metrics/logging for sync success/failures and a manual "force sync" UI control.

## Quick checklist to validate locally
- From the app:
  - Edit some tiles, refresh the page, verify edits persist.
  - Inspect IndexedDB (browser devtools -> Application -> IndexedDB -> ZeoIsoMapDB) to see MapChunks / MapDeltas entries.
  - If server is enabled, verify the server DB has saved deltas and that GET /api/map/deltas returns expected arrays.
- If something fails during these checks, capture console errors (worker/main thread) and server logs; they indicate where the contract differs.