# PLAN — Potion Inventory System

## Summary

This feature adds a **potion crafting & inventory system** to the game. A potion is a named list of map actions (`action2`) that execute in sequence when the player uses the potion on the map — essentially a **macro system for tile operations**.

### Existing Patterns & References

The feature must follow these established code patterns:

| Existing Pattern | Reference File | How We Reuse It |
|---|---|---|
| **Head Menu tab + sub-tools** | `IsoGameAddon/iso/web/js/main.ts` (lines 66-85), `assetMenu.ts`, `buildingMenu.ts` | Add a `potion` tab with 2 sub-tools: "craft" + "list" |
| **Center dialog for selection** | `IsoGameAddon/iso/web/js/menu/dialog.ts` (`DialogManager`), `assetMenu.ts` (lines 303-324) | Open craft dialog and inventory list as modals |
| **Worker message handlers** | `IsoGame/handlers/game/func/toolHandlers.ts`, `interactionHandlers.ts` | Create `potionHandlers.ts` with same `gameAction()` + `TGameHandlerAction` pattern |
| **Handler registration** | `IsoGame/handlers/handlers.ts` (line 17-23, `AllGameHandlers` array) | Append potion handlers to `AllGameHandlers` |
| **Action2 system** | `IsoGame/map/action2/tilesActions.ts` (`doActions()`) | Execute potion action chains via `TilesActions.doActions(confs)` |
| **Action config types** | `IsoGame/map/action2/utils/types.ts` (`BaseTileActionConfig { func, x, y }`) | Each potion action entry extends this |
| **Tool system (analogous)** | `IsoGame/tools/toolRegistry.ts` (singleton + registry pattern) | Potion activation uses same `executeAt(x, y)` mental model but via action2 |
| **MapState singleton** | `IsoGame/mapIso/mapState.ts` (lines 99-239) | Add `playerState` property here |
| **IndexedDB persistence** | `IsoGame/map/persistence/db/mapWebDatabase.ts` (all CRUD methods) | Extend with `PotionInventory` store |
| **Server DB** | `IsoGame/map/persistence/db/mapServerDatabase.ts`, `mapRouter.ts` | Add `potion_inventory` table + REST routes |
| **Mouse click → tile execution** | `interactionHandlers.ts` (`mouseClick` handler, lines 63-89) | Potion use intercepts click, resolves tile coords, calls `doActions()` |
| **Import aliases** | `deno.json` (`@iso-game/`, `@iso-web/`) | Use these for all cross-package imports |

---

## Phases

### Phase 1 — Foundation: Player State & Persistence

**Goal:** Add the player state object with inventory to `MapState`, and build the IndexedDB persistence layer.

---

#### Step 1.1 — Add PlayerState to MapState

**File:** `IsoGame/mapIso/mapState.ts`

- [x] Define `PotionActionEntry` interface:
  ```ts
  export interface PotionActionEntry {
    func: string;                     // key into ACTION_REGISTRY (e.g. "lvlSet", "color")
    config: Record<string, unknown>;  // action params, WITHOUT x/y (filled at use-time)
  }
  ```
- [x] Define `Potion` interface:
  ```ts
  export interface Potion {
    id: string;
    name: string;
    actions: PotionActionEntry[];
    remainingUses: number;
    createdAt: number;
  }
  ```
- [x] Define `PlayerState` interface:
  ```ts
  export interface PlayerState {
    username: string;               // default "mickey-test"
    inventory: Potion[];
    activePotionId: string | null;  // which potion is selected for use
  }
  ```
- [x] Add `playerState: PlayerState` property to `MapState` class (initialized with defaults).

> **Code added:** `IsoGame/mapIso/mapState.ts` — interfaces `PotionActionEntry`, `Potion`, `PlayerState` exported; `playerState` property on `MapState` with default `username: "mickey-test"` and empty inventory.

---

#### Step 1.2 — Extend MapWebDatabase with PotionInventory Store

**File:** `IsoGame/map/persistence/db/mapWebDatabase.ts`

- [x] Define `PotionRecord` interface:
  ```ts
  interface PotionRecord {
    id: string;
    username: string;
    potion: Potion;
    updatedAt: number;
  }
  ```
- [x] Add `savePotion(username: string, potion: Potion): Promise<void>` method:
  - Opens transaction on `"PotionInventory"` store.
  - Uses `put()` with `PotionRecord` object.
- [x] Add `getAllPotions(username: string): Promise<Potion[]>` method:
  - Opens read transaction.
  - Gets all records, filters by `username`, returns `potion` field array.
- [x] Add `deletePotion(id: string): Promise<void>` method:
  - Opens readwrite transaction.
  - Calls `store.delete(id)`.

**File:** `IsoGame/map/persistence/const.ts`

- [x] Bump `WEB_DB_VERSION` from `1` to `2`.
- [x] In `onupgradeneeded`, add new object store `"PotionInventory"` with `keyPath: "id"`.

> **Code added:** `IsoGame/map/persistence/const.ts` — `WEB_DB_VERSION` bumped to `2`. `IsoGame/map/persistence/db/mapWebDatabase.ts` — `PotionInventory` store created with `username` index; methods `savePotion(username, potion)`, `getAllPotions(username)`, `deletePotion(id)` added.

---

#### Step 1.3 — (Optional) Server-Side Potion Persistence

**File:** `IsoGame/map/persistence/db/mapServerDatabase.ts`

- [ ] Add SQL table creation in `initSchema()`:
  ```sql
  CREATE TABLE IF NOT EXISTS potion_inventory (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    potion_data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] Add `savePotion(username, potion)` and `getAllPotions(username)` methods.

**File:** `IsoGame/map/persistence/db/mapRouter.ts`

- [ ] Add `GET /api/potions?username=...` route (returns list of potions).
- [ ] Add `POST /api/potions` route (saves/updates a potion).
- [ ] Add `DELETE /api/potions/:id` route (deletes a potion).

> **Note:** Step 1.3 can be deferred until Phase 3 — the feature works with IndexedDB only.

---

### Phase 2 — Action Meta for the Craft UI

**Goal:** Each action carries its own form metadata so the craft UI can render config forms dynamically.

**Approach:** Added an optional `meta?: ActionMeta` field to `TileAction` and a third parameter to `defineAction()`. Each action module now passes a `meta` object inline when the action is defined. `withShape` / `withLine` wrappers propagate `base.meta` automatically. No central registry needed — the craft UI reads `action.meta` directly from `ACTION_REGISTRY`.

---

#### Step 2.1 — Add Meta Types to action2 Types

**File:** `IsoGame/map/action2/utils/types.ts`

- [x] Define `ActionFieldType`, `ActionField`, `ActionMeta` types.
- [x] Add `meta?: ActionMeta` to `TileAction` type.
- [x] Add optional `meta` parameter to `defineAction()`.

---

#### Step 2.2 — Add Meta to Each Action Module

- [x] `block/setBlocked.action.ts` → meta with `isBlock` boolean field
- [x] `block/setFrise.action.ts` → meta (no fields)
- [x] `block/clearAll.action.ts` → meta (no fields)
- [x] `lvl/lvl.actions.ts` → meta for `clearLvl`, `lvlSet`, `lvlUp`, `lvlFlatSquare`, `lvlAvgSquare`, `lvlAvgBorder`
- [x] `lvl/lvlRamp.actions.ts` → meta for `lvlRampShape`
- [x] `lvl/lvlGradientShape.action.ts` → meta for `lvlGradientShape`
- [x] `lvl/lvlSmoothBorder.actions.ts` → meta for `lvlSmoothBorder`
- [x] `color/color.actions.ts` → meta for `color`, `clearColor`
- [x] `color/colorNoise.actions.ts` → meta for `colorNoise`, `colorSmoothShape`
- [x] `color/colorGradientShape.actions.ts` → meta for `colorGradientShape`
- [x] `item/item.actions.ts` → meta for `itemAddKey`, `itemForceKey`, `clearItem`, `temporaryItemsForceKey`

---

#### Step 2.3 — Propagate Meta in withShape / withLine

**File:** `IsoGame/map/action2/utils/withShape.ts`

- [x] `withShape()` passes `base.meta` to `defineAction()`.
- [x] `withLine()` passes `base.meta` to `defineAction()`.
- [x] Deleted `IsoGame/map/action2/actions/metaRegistry.ts` (replaced by embedded meta).

---

### Phase 3 — Potion Handler (Worker-side)

**Goal:** The worker receives "usePotion" messages and executes the potion's action chain on the map.

---

#### Step 3.1 — Create potionHandlers.ts

**New File:** `IsoGame/handlers/game/func/potionHandlers.ts`

- [x] Import `TilesActions` from `@iso-game/map/action2/tilesActions.ts`.
- [x] Import `gobalMapState` from `@iso-game/mapIso/mapState.ts`.
- [x] Define `EventUsePotion` message:
  ```ts
  export interface EventUsePotion extends TBaseMessage<"usePotion"> {
    potionId: string;
    gridX: number;
    gridY: number;
  }
  ```
- [x] Define `usePotion` handler:
  - Look up the potion from `gobalMapState.playerState.inventory` by `potionId`.
  - If not found or `remainingUses <= 0`, return `{ success: false, reason: "..." }`.
  - **Decrement `remainingUses`** by 1.
  - Build `BaseTileActionConfig[]` from potion `actions`:
    ```ts
    const confs = potion.actions.map(entry => ({
      func: entry.func,
      x: data.gridX,
      y: data.gridY,
      ...entry.config,   // spread extra params
    }));
    ```
  - Call `TilesActions.getInstance().doActions(confs)`.
  - If `remainingUses === 0`, remove the potion from inventory.
  - **Persist updated inventory** to IndexedDB via `"potionUsed"` message back to main thread (Option B).
  - Return `{ success: true, remainingUses }`.
- [x] Export `potionHandlers` array (same pattern as `toolHandlers` at line 150).

> **Important — Worker → IndexedDB:** The worker cannot directly access IndexedDB. We have two options:
> - **Option A:** `usePotion` handler sends a message back to the main thread (`postMessage({ action: "savePotionInventory", inventory })`) and the main thread persists it.
> - **Option B:** After `usePotion`, the worker sends `{ action: "potionUsed", potionId, remainingUses }` to the main thread, and the main thread reads the updated state and saves.
>
> **Decision: Use Option B** — the worker sends `"potionUsed"` response, main thread reads `gobalMapState.playerState` and persists to IndexedDB.

---

#### Step 3.2 — Register the Handler

**File:** `IsoGame/handlers/handlers.ts`

- [x] Import `potionHandlers` from `./game/func/potionHandlers.ts`.
- [x] Append `...potionHandlers` to the `AllGameHandlers` array (line 17-23):
  ```ts
  export const AllGameHandlers = [
    ...initHandlers,
    ...renderHandlers,
    ...interactionHandlers,
    ...toolHandlers,
    ...queryHandlers,
    ...potionHandlers,   // <-- NEW
  ] as const;
  ```

---

### Phase 4 — Potion Menu Tab & UI

**Goal:** The player can see the potion tab in the head menu, craft new potions via a dialog, and see/use existing potions from their inventory.

---

#### Step 4.1 — Create potionMenu.ts ✅

**New File:** `IsoGameAddon/iso/web/js/menu/sections/potionMenu.ts`

- [x] Import `MenuTab` from `../headMenu.ts`.
- [x] Import `DialogManager` from `../dialog.ts`.
- [x] Import `ACTION_REGISTRY` from `@iso-game/map/action2/actions/registry.ts` (uses embedded `meta` on each action).
- [x] Import `gobalMapState` from `@iso-game/mapIso/mapState.ts`.
- [x] Export `potionMenuTab` factory with sub-tools `craft_potion` and `potion_list`.

> **Code added:** `IsoGameAddon/iso/web/js/menu/sections/potionMenu.ts` — menu tab factory, craft dialog with dynamic form rendering, potion list dialog, persistence helpers.

---

#### Step 4.2 — Implement Craft Dialog (openCraftDialog) ✅

- [x] Open a dialog via `DialogManager.getInstance().open()`.
- [x] Multi-section layout: action type selector, config form, action list, add button, name input, save button.
- [x] `renderField()` supports `number`, `range`, `color`, `boolean`, `select`, `text`.
- [x] Action state management with `pendingActions`, `selectedActionKey`, `currentFormValues`.
- [x] Save: validates, creates UUID, calls `mapDB.savePotion()`, syncs player state, closes dialog.

---

#### Step 4.3 — Implement Potion List Dialog ✅

- [x] Opens dialog via `DialogManager.getInstance().open()`.
- [x] Fetches potions from `mapDB.getAllPotions("mickey-test")`.
- [x] Renders name, action count, remaining uses, Use/Buy/Delete buttons.
- [x] Empty state message.
- [x] Use button sets `activePotionId`, shows toast indicator, closes dialog.
- [x] Buy button increments uses, persists.
- [x] Delete button removes from DB, refreshes display.

---

#### Step 4.4 — Potion Persistence Helper ✅

- [x] Inlined in `potionMenu.ts`: `loadPotions()`, `savePotion()`, `deletePotion()`, `syncPotionsToPlayerState()`.
- [ ] Call `syncPotionsToPlayerState("mickey-test")` on app startup — deferred (can be added when needed).

---

#### Step 4.5 — Potion Use from Map Click ✅

- [x] "Use" button in potion list dialog sets `gobalMapState.playerState.activePotionId` + shows toast.
- [x] `mouseClick` handler in `interactionHandlers.ts` intercepts when `activePotionId` is set:
  - Looks up potion from `playerState.inventory`.
  - Decrements `remainingUses`.
  - Builds `BaseTileActionConfig[]` injecting `x`, `y` from click.
  - Calls `TilesActions.getInstance().doActions(confs)`.
  - Removes potion if uses === 0.
  - Resets `activePotionId`.
  - Sends `"potionUsed"` response back to main thread.
- [x] Main thread receives `"potionUsed"` → persists to IndexedDB → shows feedback.

---

#### Step 4.6 — Wire Potion Menu into main.ts ✅

- [x] Import `potionMenuTab` from `./menu/sections/potionMenu.ts`.
- [x] Add `potionMenuTab(gameWorker)` to `config_tag` array.
- [ ] `syncPotionsToPlayerState` call on startup — deferred (not critical for initial UI).

---

### Phase 5 — Integration & Polish

**Goal:** The feature works end-to-end end ends.

---

#### Step 5.1 — Handle "potionUsed" Response on Main Thread ✅

- [x] Registered `potionUsed` screen handler in `IsoGame/handlers/screen/func/mainMessage.ts`:
  - Persists updated potion to IndexedDB (or deletes if consumed).
  - Shows feedback toast (green for success, red for failure).

---

#### Step 5.2 — Add Visual Feedback for Potion Mode

- [ ] When `activePotionId` is set, change the mouse cursor to a "potion" icon or add a toast: "Select a tile to apply potion".
- [ ] Add a CSS class `.potion-mode` that highlights the potion tab or shows a colored border.
- [ ] Clear `activePotionId` on any error or ESC key.

---

#### Step 5.3 — Server Persistence Sync (Optional / Phase 3)

**File:** `webServer.ts`

- [ ] The `mapRouter` is already mounted — no server changes needed if we use the new routes from Step 1.3.

**UI Side:**

- [ ] After each `savePotion()` on IndexedDB, optionally also `POST /api/potions`.
- [ ] On app startup, optionally fetch from server and merge with IndexedDB.

---

#### Step 5.4 — Edge Cases & Error Handling

- [ ] **Empty action list:** Disable "Save" button when no actions added.
- [ ] **Duplicate potion names:** Not a problem — uses UUIDs, but show a warning.
- [ ] **IndexedDB unavailable:** Fallback to in-memory only (warn in console).
- [ ] **Worker message timeout:** If `usePotion` doesn't get a response, reset `activePotionId`.
- [ ] **Potion with 0 uses:** Auto-delete or gray out in list.
- [ ] **Multiple clicks while potion is active:** Only process one potion per click, reset `activePotionId` immediately.

---

## File Checklist (All Changes)

### New Files
- [x] `IsoGame/handlers/game/func/potionHandlers.ts` — worker-side usePotion handler
- [x] `IsoGameAddon/iso/web/js/menu/sections/potionMenu.ts` — menu tab, craft dialog, potion list dialog, persistence helpers
- [x] `IsoGameAddon/iso/web/js/menu/sections/potionPersistence.ts` (optional inline) — inlined in `potionMenu.ts`

### Modified Files
- [x] `IsoGame/mapIso/mapState.ts` — add `Potion`, `PotionActionEntry`, `PlayerState` interfaces + `playerState` property
- [x] `IsoGame/map/persistence/db/mapWebDatabase.ts` — add `PotionInventory` store + CRUD methods, bump version
- [x] `IsoGame/map/persistence/const.ts` — bump `WEB_DB_VERSION` to 2
- [x] `IsoGame/map/action2/utils/types.ts` — add `ActionField`, `ActionMeta`, `meta` on `TileAction`, third param on `defineAction()`
- [x] `IsoGame/map/action2/utils/withShape.ts` — propagate `base.meta` in `withShape` / `withLine`
- [x] `IsoGame/map/action2/actions/block/setBlocked.action.ts` — add meta
- [x] `IsoGame/map/action2/actions/block/setFrise.action.ts` — add meta
- [x] `IsoGame/map/action2/actions/block/clearAll.action.ts` — add meta
- [x] `IsoGame/map/action2/actions/lvl/lvl.actions.ts` — add meta to all level actions
- [x] `IsoGame/map/action2/actions/lvl/lvlRamp.actions.ts` — add meta
- [x] `IsoGame/map/action2/actions/lvl/lvlGradientShape.action.ts` — add meta
- [x] `IsoGame/map/action2/actions/lvl/lvlSmoothBorder.actions.ts` — add meta
- [x] `IsoGame/map/action2/actions/color/color.actions.ts` — add meta
- [x] `IsoGame/map/action2/actions/color/colorNoise.actions.ts` — add meta
- [x] `IsoGame/map/action2/actions/color/colorGradientShape.actions.ts` — add meta
- [x] `IsoGame/map/action2/actions/item/item.actions.ts` — add meta
- [x] `IsoGame/handlers/handlers.ts` — import + append `potionHandlers`
- [x] `IsoGame/handlers/game/func/interactionHandlers.ts` — intercept `mouseClick` when `activePotionId` is set, execute potion actions
- [x] `IsoGame/handlers/screen/func/mainMessage.ts` — add `potionUsed` screen handler for persistence + feedback
- [x] `IsoGameAddon/iso/web/js/main.ts` — import + register `potionMenuTab`
- [ ] `IsoGame/map/persistence/db/mapServerDatabase.ts` — add `potion_inventory` table + methods (optional)
- [ ] `IsoGame/map/persistence/db/mapRouter.ts` — add `/api/potions` routes (optional)

---

## Sequence: End-to-End "Craft & Use" Flow

```
1. Player opens game → main.ts loads → tab "🧪 Potion" visible in head menu
2. Player clicks "🧪 Potion" tab → sub-tools: "🔬 Craft" | "📜 List"
3. Player clicks "🔬 Craft" →
   - Dialog opens with action selector + config form + action list
   - Player picks "Set Level", enters lvl=5, clicks "Add" → action appears in list
   - Player picks "Apply Color", enters r=200/g=100/b=50, clicks "Add"
   - Player enters potion name "Earth Raiser", clicks "Save"
   → Potion saved to IndexedDB, dialog closes

4. Player clicks "📜 List" →
   - Dialog shows "Earth Raiser (2 actions, 1 use left)"
   - Player clicks "Use" → activePotionId set, dialog closes
   - UI shows "Potion armed — click the map"

5. Player clicks on a tile on the map →
   - mouseClick handler → detects activePotionId
   - Sends { action: "usePotion", potionId, gridX, gridY } to worker
   - Worker: looks up potion, decrements uses, builds configs, calls doActions()
   - Tile level set to 5, tile color applied
   - Worker sends back { action: "potionUsed", success: true, remainingUses: 0 }

6. Main thread receives "potionUsed" →
   - Persists updated inventory (potion now has 0 uses, gets deleted)
   - Shows toast: "Potion used! 0 uses remaining — potion consumed."
   - activePotionId reset to null