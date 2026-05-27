# Plan: Potion Persistence Server Sync

**Based on:** `REVIEW-PLAYER-PERCISTANCE.md`  
**Goal:** Add a server sync pipeline for potion inventory (analogous to the existing map delta pipeline)

---

## Overview

The potion inventory currently lives only in IndexedDB on the client. The server has working SQLite tables (`potion_inventory`) and Oak routes (`GET/POST/DELETE /api/potions`), but the **client never calls them**. This plan adds an HTTP client class and wires it into the existing sync manager so potions flow: Client Memory → IndexedDB → HTTP → Server SQLite.

---

## Phase 1: Create `PotionServerPersistence` HTTP Client

**Files:**
- `IsoGame/map/persistence/db/potionServerPersistence.ts` (NEW)
- `IsoGame/map/interface.ts` (modify — add potion operations to `IMapPersistence`)

### 1.1 New file: `potionServerPersistence.ts`

```typescript
// Analogous to mapServerPersistence.ts but for potions.
export class PotionServerPersistence {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  async getAllPotions(username: string): Promise<Potion[]> { /* fetch GET /api/potions?username=... */ }
  async savePotion(username: string, potion: Potion): Promise<void> { /* fetch POST /api/potions */ }
  async deletePotion(id: string): Promise<void> { /* fetch DELETE /api/potions/:id */ }
}

export const potionServerPersistence = new PotionServerPersistence();
```

**Details:**
- `getAllPotions`: `fetch(/api/potions?username=...)` → parse `{ potions: Potion[] }`
- `savePotion`: `fetch(POST /api/potions, { username, potion })` → send full potion object
- `deletePotion`: `fetch(DELETE /api/potions/${id})` → just the ID
- Error handling: check `response.ok`, parse JSON error body, throw descriptive Error

### 1.2 Update `IMapPersistence` interface

Add potion CRUD methods so future persistence implementations have a contract:

```typescript
export interface IMapPersistence {
  saveChunkDeltas(cx: number, cy: number, deltas: any[]): Promise<void>;
  loadChunkDeltas(cx: number, cy: number): Promise<any[]>;
  // NEW: Potion operations
  savePotion(username: string, potion: Potion): Promise<void>;
  getAllPotions(username: string): Promise<Potion[]>;
  deletePotion(id: string): Promise<void>;
}
```

---

## Phase 2: Add Potion Sync to `MapSyncManager`

**File:** `IsoGame/map/persistence/db/mapSyncManager.ts`

### 2.1 Add dirty potion tracking

```typescript
import { potionServerPersistence } from "./potionServerPersistence.ts";

private dirtyPotions: Map<string, { username: string; potion?: Potion; action: 'save' | 'delete' }> = new Map();
```

### 2.2 Add methods to mark potions dirty

```typescript
markPotionDirty(username: string, potion: Potion): void {
  this.dirtyPotions.set(potion.id, { username, potion, action: 'save' });
}

markPotionDeleted(username: string, potionId: string): void {
  this.dirtyPotions.set(potionId, { username, action: 'delete' });
}
```

### 2.3 Extend `syncToRemote()` to handle potions

After the existing chunk sync loop, add:

```typescript
if (this.dirtyPotions.size > 0) {
  const potionsToSync = Array.from(this.dirtyPotions);
  this.dirtyPotions.clear();

  for (const [id, entry] of potionsToSync) {
    try {
      if (entry.action === 'delete') {
        await potionServerPersistence.deletePotion(id);
      } else if (entry.potion) {
        await potionServerPersistence.savePotion(entry.username, entry.potion);
      }
    } catch (error) {
      // Add back on failure
      this.dirtyPotions.set(id, entry);
      console.error(...);
    }
  }
}
```

### 2.4 Add `loadPotionsFromServer()` method

```typescript
async loadPotionsFromServer(username: string): Promise<Potion[]> {
  try {
    const potions = await potionServerPersistence.getAllPotions(username);
    // Apply to local state (called by client after loading)
    return potions;
  } catch (error) {
    console.error(`[MapSyncManager] Failed to load potions from server:`, error);
    throw error; // Let caller decide fallback
  }
}
```

### 2.5 Rename `loadChunkServer()` to `loadChunkFromServer()` (low-priority cleanup)

---

## Phase 3: Update Client Flows in `potionMenu.ts`

**File:** `IsoGameAddon/iso/web/js/menu/sections/potionMenu.ts`

### 3.1 Import potion server sync

```typescript
import { potionServerPersistence } from "@iso-game/map/persistence/db/potionServerPersistence.ts";
import { mapSyncManager } from "@iso-game/map/persistence/db/mapSyncManager.ts";
```

### 3.2 Update `syncPotionsToPlayerState()` — merge from server

Change from:
```
read potions from IndexedDB → set playerState.inventory
```
To:
```
1. Read potions from IndexedDB as fallback
2. Try loading from server via `mapSyncManager.loadPotionsFromServer(username)`
3. If server returns potions, merge them (server is authoritative, but keep local mutations)
4. Set playerState.inventory
```

Strategy for merge: The server data is authoritative. So:
```typescript
async function syncPotionsToPlayerState(username: string): Promise<void> {
  try {
    let potions: Potion[];
    try {
      potions = await mapSyncManager.loadPotionsFromServer(username);
    } catch {
      // Fallback to IndexedDB
      potions = await mapDB.getAllPotions(username);
    }
    gobalMapState.playerState.inventory = potions;
  } catch (err) {
    console.warn("[PotionMenu] Failed to sync potions:", err);
  }
}
```

### 3.3 Update save flow (craft potion button)

After saving to IndexedDB (line 394), also mark as dirty for server sync:

```typescript
await mapDB.savePotion(gobalMapState.playerState.username, potion);
mapSyncManager.markPotionDirty(gobalMapState.playerState.username, potion);
```

### 3.4 Update delete flow (delete button in inventory)

Before removing from DOM (line 579), also mark as dirty for server sync:

```typescript
await mapDB.deletePotion(potion.id);
mapSyncManager.markPotionDeleted(gobalMapState.playerState.username, potion.id);
```

### 3.5 Update "Buy" (add use) flow

After saving to IndexedDB (line 561), also mark as dirty:

```typescript
await mapDB.savePotion(gobalMapState.playerState.username, potion);
mapSyncManager.markPotionDirty(gobalMapState.playerState.username, potion);
```

---

## Phase 4: Update `IMapPersistence` Interface — SKIPPED

**Decision:** The potion system has its own class hierarchy (`PotionServerPersistence`) separate from the map delta `IMapPersistence` interface. Adding potion methods to `IMapPersistence` would break `MapServerPersistence` which implements that interface. Since the potion sync uses a dedicated class, the interface should remain unchanged.

---

## Testing / Verification

1. **Type check:** `deno check IsoGame/map/persistence/db/potionServerPersistence.ts IsoGame/map/persistence/db/mapSyncManager.ts IsoGameAddon/iso/web/js/menu/sections/potionMenu.ts`
2. **Manual test:** Craft a potion → reload page → verify potion persists in inventory (should now sync to server, then load from server on startup)
3. **Manual test:** Delete a potion → reload → verify it's gone
4. **Edge case:** Server offline → should gracefully fall back to IndexedDB

---

## Files to Create

| File | Action |
|------|--------|
| `IsoGame/map/persistence/db/potionServerPersistence.ts` | **Create** — HTTP client class |

## Files to Modify

| File | Changes |
|------|---------|
| `IsoGame/map/persistence/db/mapSyncManager.ts` | Add potion dirty tracking, sync loop, loadPotionsFromServer |
| `IsoGameAddon/iso/web/js/menu/sections/potionMenu.ts` | Import server sync, update save/delete/add-use to mark dirty, update syncPotionsToPlayerState |

---

## Future Improvements (not in scope for this task)

- Periodic sync of dirty potions (currently triggered on each save/delete)
- Consistent username management (currently hardcoded `"mickey-test"` on both sides)
- `MapWebPersistence` implementing `IMapPersistence` potion methods (already done in `mapDB` but via a different class)