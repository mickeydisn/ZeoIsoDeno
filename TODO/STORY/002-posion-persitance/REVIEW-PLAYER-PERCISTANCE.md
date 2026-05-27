# Review: Player Persistence (Potion Inventory)

**Date:** 2026-05-27  
**Scope:** `IsoGame/map/persistence/db/` — potion inventory sync between client (IndexedDB) and server (SQLite)  

---

## Summary

The **map tile delta persistence** (chunk data) has a well-defined, working sync pipeline:

```
Client Memory → MapWebPersistence (IndexedDB) → MapSyncManager → MapServerPersistence (HTTP) → Server SQLite
```

The **potion inventory persistence** has **NO sync pipeline at all**. Potions are saved to IndexedDB and read from IndexedDB on the client side, but **never sent to or received from the server**. This is the root cause of the desync.

---

## Detailed Findings

### 1. Potions are client-only — no server sync exists

**Files involved:** `potionMenu.ts`, `mapWebDatabase.ts`, `mapRouter.ts`, `mapServerDatabase.ts`

The client code in `potionMenu.ts` performs all CRUD operations **exclusively** via `mapDB` (the IndexedDB wrapper):

| Operation | Client code calls | Server API exists? |
|-----------|------------------|-------------------|
| `savePotion()` | `mapDB.savePotion()` | ✅ `POST /api/potions` |
| `getAllPotions()` | `mapDB.getAllPotions()` | ✅ `GET /api/potions?username=...` |
| `deletePotion()` | `mapDB.deletePotion()` | ✅ `DELETE /api/potions/:id` |

The **server routes** in `mapRouter.ts` and **database methods** in `mapServerDatabase.ts` are fully implemented and functional. The only missing piece is **the client code that calls them**.

Unlike the map delta system which has `mapServerPersistence.ts` (a dedicated HTTP client class), there is **no equivalent HTTP client class for potions**. The potion operations bypass the server entirely.

### 2. `MapSyncManager` only handles map deltas, not potions

**File:** `mapSyncManager.ts`

`MapSyncManager` drives the periodic sync via `syncToRemote()` which iterates over `dirtyChunks` and calls `mapServerPersistence.saveChunkDeltas()`. There is no equivalent mechanism for potions:

- No `dirtyPotions` set
- No periodic sync of potion changes to the server
- No `loadPotionServer()` equivalent to `loadChunkServer()`

### 3. `IMapPersistence` interface has no potion methods

**File:** `IsoGame/map/interface.ts` (lines 222-226)

```typescript
export interface IMapPersistence {
  saveChunkDeltas(cx: number, cy: number, deltas: any[]): Promise<void>;
  loadChunkDeltas(cx: number, cy: number): Promise<any[]>;
}
```

This interface only defines map delta operations. There is no definition for potion CRUD, which means any future persistence implementation lacks a contract for potion operations.

### 4. Configuration consistency issue

The client-side code in `potionMenu.ts` and `mapState.ts` hardcodes the username as `"mickey-test"` (fallback). The server-side router also uses `"mickey-test"` as default:

- `mapRouter.ts` line 121-122: `const username = ctx.request.url.searchParams.get("username") || "mickey-test"`
- `mapState.ts` line 129: `username: "mickey-test"`

This is consistent for now, but fragile — if username management changes, the two sides could drift apart.

### 5. `syncPotionsToPlayerState()` only reads from IndexedDB

**File:** `potionMenu.ts` lines 30-37

```typescript
async function syncPotionsToPlayerState(username: string): Promise<void> {
  try {
    const potions = await mapDB.getAllPotions(username);
    gobalMapState.playerState.inventory = potions;
  } catch (err) {
    console.warn("[PotionMenu] Failed to sync potions:", err);
  }
}
```

This function synchronizes from IndexedDB → player state, but never from the server. If the user logs in on a different device or the IndexedDB is cleared, the inventory will be empty regardless of what's stored server-side.

### 6. Minor naming issue in `MapSyncManager`

**File:** `mapSyncManager.ts` line 27-34

The method `loadChunkServer()` actually **loads from the server** into the chunk, not the other way around. The name is misleading (reads as "load chunk to server"). Consider renaming to `loadChunkFromServer()`.

---

## Impact

| Issue | Severity | Impact |
|-------|----------|--------|
| No client-to-server potion sync | **High** | Potions crafted on one session are lost on page reload if IndexedDB is cleared, and are invisible to other clients/players |
| No server-to-client potion load at startup | **High** | Existing server potions are never loaded into the client's inventory |
| No potion methods in `IMapPersistence` interface | **Medium** | Future persistence implementations have no contract to follow |
| Misleading method name `loadChunkServer` | **Low** | Code clarity / maintenance |

---

## Recommended Fix

### Phase 1: Create a `PotionServerPersistence` HTTP client

Create a class (analogous to `mapServerPersistence.ts`) that handles potion HTTP calls:

```
IsoGame/map/persistence/db/potionServerPersistence.ts
```

Implement three methods:
- `getAllPotions(username: string): Promise<Potion[]>`
- `savePotion(username: string, potion: Potion): Promise<void>`
- `deletePotion(id: string): Promise<void>`

### Phase 2: Add potion sync to `MapSyncManager`

Extend `MapSyncManager` to also track dirty potions and sync them periodically (or on craft/delete). Add:
- A `dirtyPotions` tracking mechanism
- A `savePotionToServer()` / `deletePotionFromServer()` flow
- An initial `loadPotionsFromServer()` call on startup

### Phase 3: Update the client flows

- On `openPotionListDialog()` and `populatePotionSelect()`, first load from server, fall back to IndexedDB
- On save/delete, write to IndexedDB **and** send to server (or mark dirty and let the sync loop handle it)
- `syncPotionsToPlayerState()` should merge server data into the player state, not just IndexedDB data

### Phase 4: Update `IMapPersistence` interface (optional)

Add potion operations to the interface to enforce contracts for future implementations.

---

## Map Delta Pipeline (for reference — this works correctly)

For comparison, here is the map delta persistence pipeline that works:

```
[Editor] markChunkDirty(chunk)
    │
    ▼
mapWebPersistence.saveChunkDeltas()   ───►  IndexedDB (client)
    │
    ▼  (every 5 seconds via syncInterval)
mapSyncManager.syncToRemote()
    │
    ▼
mapServerPersistence.saveChunkDeltas()   ───►  HTTP POST /api/map/deltas
    │
    ▼
mapRouter  ───►  mapServerDatabase.saveDeltas()   ───►  SQLite (server)
```

The potion inventory needs an equivalent pipeline.