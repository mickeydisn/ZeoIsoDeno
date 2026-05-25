# REVIEW: Map Persistence Layer

> Date: 2026-05-25
> Scope: `/IsoGame/map/persistence/` and related files

---

## Files Reviewed

| File | Purpose |
|------|---------|
| `IsoGame/map/persistence/db/mapWebDatabase.ts` | IndexedDB wrapper — stores tile deltas in the browser |
| `IsoGame/map/persistence/db/mapWebPersistence.ts` | High-level web persistence with debounced saves |
| `IsoGame/map/persistence/db/mapServerDatabase.ts` | SQLite database for server-side delta storage |
| `IsoGame/map/persistence/db/mapServerPersistence.ts` | HTTP client for communicating with the server API |
| `IsoGame/map/persistence/db/mapRouter.ts` | Oak router handling `/api/map/deltas` GET/POST |
| `IsoGame/map/persistence/db/mapSyncManager.ts` | Sync orchestrator — ties local IndexedDB to remote server |
| `IsoGame/map/persistence/const.ts` | Shared constants |
| `IsoGame/map/factory/factoryMap.ts` | Consumes persistence layer when loading chunks |
| `IsoGame/map/object/chunk.ts` | `getDeltas()` / `applyDeltas()` on the chunk |
| `IsoGame/map/object/tile.ts` | `toDeltaJson()` / `applyDelta()` / `checkDirty()` / `clearItem()` |

---

## 🚨 BUG #1 – Load order causes local (unsynced) data loss (CRITICAL) ✅ FIXED

### Location
`IsoGame/map/factory/factoryMap.ts`, method `loadChunkDeltas()`, lines 55–73.

### Description
When a chunk is loaded, deltas were fetched from **both** the web persistence (IndexedDB) and the server persistence (SQLite), applied **sequentially**, with the server always overwriting the web changes.

Since `applyDelta()` blindly overwrites each field (`items`, `color`, `lvl`, etc.) without any merge strategy, the **server version always won**, even if it was **stale**.

### How this manifested as an intermittent bug

**Scenario:**
1. User modifies a tile (e.g., places an item or changes color)
2. `markChunkDirty` saves to IndexedDB immediately (debounced to 1s)
3. The server sync loop runs **every 5 seconds** — sync may not have happened yet
4. User reloads the page
5. Web loads → applies the change ✓
6. Server loads → applies **old data** → **overwrites the change** ✗

The bug was "intermittent" because:
- If the 5s sync **had** completed before reload → both sources have the same data → bug didn't appear
- If the 5s sync **had NOT** completed before reload → server data was stale, overwrites the local change → bug appeared

### Fix applied
Web (IndexedDB) is now the **authoritative** source. If web has deltas for a chunk, they are applied and the method returns immediately. The server is only used as a **fallback** when web has no data. This ensures local unsynced changes are never overwritten by stale server data.

---

## 🚨 BUG #2 – Race condition in debounce queue flush (MEDIUM-HIGH) ✅ FIXED

### Location
`IsoGame/map/persistence/db/mapWebPersistence.ts`, methods `saveChunkDeltas()` and `flushSaveQueue()`, lines 29–65.

### Description
The `flushSaveQueue()` method takes a snapshot of the queue and then **clears it**:

```ts
async flushSaveQueue(): Promise<void> {
  const entries = Array.from(this.saveQueue.entries());  // snapshot
  this.saveQueue.clear();                                 // clear
  for (const [key, deltas] of entries) {
    await mapDB.saveDeltas(cx, cy, deltas);
  }
}
```

Between the `clear()` and the end of the `for` loop, `saveChunkDeltas` can be called by `markChunkDirty`. The sequence is:

1. `flushSaveQueue` starts → snapshots entries = `[chunk_A → deltas_v1]` → clears queue
2. **User modifies tile** → `markChunkDirty` → `saveChunkDeltas(chunk_A, deltas_v2)` → queue.set("chunk_A", deltas_v2) ✓
3. `flushSaveQueue` continues → saves `deltas_v1` (from the snapshot) → old version!
4. **No second flush happens** → `deltas_v2` sits in the queue forever (until the next user action triggers another save)

### Root cause
`flushSaveQueue()` took a snapshot of the queue and cleared it, but if `saveChunkDeltas()` was called during the async `for` loop (writing to IndexedDB), the new entry was orphaned — never flushed until the next user action.

### Fix applied
1. **Mutex guard (`flushing` flag)**: prevents concurrent flushes. New entries arriving during a flush are queued normally.
2. **Loop-until-empty**: after flushing all snapshot entries, re-checks the queue. If new entries arrived, flushes again.
3. **Re-arm on exit**: after the `finally` block releases the mutex, if the queue is non-empty, a new debounce timeout is scheduled.
4. **Skip new timeout during flush**: `saveChunkDeltas()` skips scheduling if `this.flushing === true`, since the flush will pick up the new data and re-arm itself.

---

## ⚠️ BUG #3 – `getDeltas()` returns data that may not be clean after apply (MEDIUM) ✅ FIXED

### Location
`IsoGame/map/object/chunk.ts`, `getDeltas()`, lines 108–120.

### Description
`getDeltas()` iterates all tiles and checks `tile.checkDirty()`. The dirty check compares the current value against `genLvl2`, `genColor`, `genItems`.

After `applyDeltas()` is called during load, the tile state is populated with saved data. But these saved values may differ from `gen*` values, so **tiles remain dirty after loading**. This means:

1. Chunk is loaded → deltas applied → tiles are now in saved state
2. `getDeltas()` is called (e.g., by sync timer) → all previously-saved tiles still report as dirty
3. **Duplicate save**: the same data is saved again to both IndexedDB and server
4. Items/colors that were set by the user are written again, potentially re-triggering downstream consumers

### Why it was not always visible
- If the same data is saved again, the `INSERT OR REPLACE` (server) and delete-then-add (IndexedDB) result in no visible change
- But tiles remained dirty after load, so every sync cycle re-uploaded the same data

### Fix applied
Added a `_modified: boolean` tracked property on `Tile`. It is set to `true` by:
- `lvl` setter
- `color` setter
- `isBlock` / `isFrise` setters (now converted to getter/setter pairs using private `_isBlock` / `_isFrise`)
- `clearItem()`
- `clearColor()`

It is **not** set by `applyDelta()` or `fromJsonSave()` (loading from DB is not a user mutation).

`checkDirty()` now returns `this._modified` directly instead of comparing against generated values.

`toDeltaJson()` resets `_modified = false` after taking the snapshot, so the tile is clean until the next explicit user action.

---

## ⚠️ BUG #4 – Item comparison uses `JSON.stringify` which is fragile (LOW-MEDIUM) ✅ FIXED

### Location
`IsoGame/map/object/tile.ts`, `toDeltaJson()`.

### Description
Previously relied on `JSON.stringify()` for item comparison, which is order-sensitive and nondeterministic for object key ordering.

### Fix applied
Added `_itemsEqual()` helper that serializes each item with alphabetically-sorted keys using `JSON.stringify(item, Object.keys(item).sort())`, producing deterministic comparison regardless of key insertion order.

---

## ⚠️ BUG #5 – `mapWebDatabase.saveDeltas` cursor-based delete + adds ordering (LOW) ✅ FIXED

### Location
`IsoGame/map/persistence/db/mapWebDatabase.ts`, `saveDeltas()`.

### Description
The old method used `index.openCursor()` inside a callback, then queued `store.add()` calls before the cursor `delete` callbacks fired. This meant adds executed before deletes within the transaction, risking duplicate records if the cursor delete failed silently.

### Fix applied
Replaced cursor-based delete with a two-phase approach within the same transaction:
1. `index.getAllKeys()` — collect all primary keys for the chunk
2. `store.delete(key)` — delete by primary key (synchronous requests, ordered before adds)
3. `store.add(delta)` — add new records after all deletes are queued

This guarantees deletes are ordered before adds in the transaction queue, and eliminates the callback-ordering race.

---

## 💡 Design Observations (Not bugs, but worth noting)

### D1. `loadChunkServer` is unused

`MapSyncManager.loadChunkServer(chunk)` (line 27) is defined but never called. It directly fetches server deltas and applies them to the chunk. This looks like dead code or leftover from an earlier architecture.

### D2. No deduplication between web and server sources

On load, both web and server deltas are applied. If a tile was modified, saved to IndexedDB, then synced to server, both sources contain a delta for the same `(x, y)`. The tile's `applyDelta` is called **twice** — once from web, once from server. This works because the second call overwrites the first, but it's wasteful and fragile (see Bug #1).

### D3. No dirty flag clearing after load

After `applyDeltas`, tiles remain dirty because their state differs from the generated values. There is no `_dirty = false` mechanism. `getDeltas()` will keep returning deltas for all loaded tiles, not just newly modified ones.

### D4. Server path wraps delta redundantly

In `mapServerPersistence.ts` line 15:
```ts
const serverDeltas = deltas.map((d) => ({ x: d.x, y: d.y, data: d }));
```

The `data` field contains the original delta which **already has `x` and `y`**. So the wrapper `{ x, y, data: { x, y, lvl, items... } }` duplicates `x` and `y`. This is not a bug but adds unnecessary nesting and payload size.

### D5. Error handling in `syncToRemote` re-adds chunk but deltas may be stale

Line 80:
```ts
this.dirtyChunks.add(chunk);
```

If sync fails, the chunk is re-added. But `chunk.getDeltas()` will be called again on next sync, which means the **current state** is re-fetched. This is correct behavior.

---

## Summary Table

| # | Severity | Category | File | Description |
|---|----------|----------|------|-------------|
| 1 | **CRITICAL** | Data Loss | `factoryMap.ts` | Server data overwrites unsynced local changes on load |
| 2 | **HIGH** | Race Condition | `mapWebPersistence.ts` | Debounce flush can lose the last modification |
| 3 | **MEDIUM** | Inefficiency | `chunk.ts` | Tiles remain dirty after load, causing repeated saves |
| 4 | **LOW** | Fragility | `tile.ts` | JSON.stringify item comparison is order-sensitive |
| 5 | **LOW** | Race Condition | `mapWebDatabase.ts` | Cursor delete + adds order within transaction |

---

## Recommended Fixes (conceptual)

### Fix #1 (CRITICAL)
**Replace the sequential load with a single source of truth.** Two approaches:
- **Option A**: Load from web only (if available), and only fall back to server if web has no data. The server acts as backup.
- **Option B**: Compare timestamps between web and server deltas per tile, applying the **most recent** version. (Requires adding timestamps to deltas.)

### Fix #2 (HIGH)
**Guard the flush against concurrent writes:**
- Use a mutex/lock around the queue management
- Or use a two-phase approach: mark the queue as "flushing", new entries go to a secondary queue that is processed after the flush
- Or re-arm the timeout after flush with a small delay to catch late entries

### Fix #3 (MEDIUM)
**Mark tiles as clean after applying deltas:**
- In `applyDelta`, after setting values, reset the dirty flag (e.g., copy applied values back to `gen*` fields and clear `items` to match `genItems`)
- Or add a proper `_dirty` boolean flag set by setters and cleared after `getDeltas()` / `applyDeltas()`

### Fix #4 (LOW) ✅ DONE
Added deterministic `_itemsEqual()` helper using sorted-key JSON serialization.

### Fix #5 (LOW) ✅ DONE
Replaced cursor-based delete with `getAllKeys()` then `store.delete(key)` per key, ensuring deletes are ordered before adds in the transaction queue.
