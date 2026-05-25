# ADR — Potion Inventory System

**Date:** 2026-05-25  
**Status:** Draft  
**Author:** Tech Lead  

---

## 1. Context & Problem

The game needs a **potion system** where:
- A **potion** is a named list of `action2` configs (from `IsoGame/map/action2/`) that execute in sequence when the player uses the potion on the map.
- The player can **craft** potions via a UI panel, adding/removing/reordering actions (each action's config is built from its type's config schema).
- The player can **see** their potion inventory (name + remaining uses).
- The player can **use** a potion by clicking on the map.
- The inventory must be **persisted** per user (default: `"mickey-test"`).

---

## 2. Key Architectural Observations

| Component | File(s) | Role |
|---|---|---|
| **Head Menu** | `IsoGameAddon/iso/web/js/menu/headMenu.ts` | Tab + sub-tool system with param slots |
| **Menu Sections** | `assetMenu.ts`, `buildingMenu.ts`, etc. | Each exports a `MenuTab` factory |
| **Center Dialog** | `dialog.ts` (`DialogManager`) | Modal overlay for asset/selection UI |
| **Player State** | `IsoGame/mapIso/mapState.ts` | Currently only position / direction / mouse |
| **Action2 System** | `IsoGame/map/action2/` | `defineAction()`, `ACTION_REGISTRY`, `TilesActions.doActions()` |
| **Action Configs** | `IsoGame/map/action2/utils/types.ts` | `BaseTileActionConfig { func, x, y }` + per-action extensions |
| **Tool System** | `IsoGame/tools/toolRegistry.ts`, `toolHandlers.ts` | Similar pattern: registry + `executeAt(x, y)` |
| **Persistence (client)** | `IsoGame/map/persistence/db/mapWebDatabase.ts` | IndexedDB with `MapChunks` / `MapDeltas` stores |
| **Persistence (server)** | `IsoGame/map/persistence/db/mapServerDatabase.ts`, `mapRouter.ts` | SQLite + Oak REST routes |
| **Server** | `webServer.ts` | Oak app, imports `mapRouter` |
| **Imports** | `deno.json` | `@iso-game/` → `./IsoGame/`, `@iso-web/` → `./IsoGameAddon/iso/web/` |

---

## 3. Design Decisions

### 3.1 Potion Data Model

A potion is a serialisable object:

```ts
interface Potion {
  id: string;               // UUID
  name: string;             // User-given label
  actions: ActionEntry[];   // Ordered list of action configs
  remainingUses: number;    // How many times it can still be used
  createdAt: number;        // Timestamp
}

interface ActionEntry {
  func: string;             // Key into ACTION_REGISTRY (e.g. "lvlSet", "colorSquare")
  config: Record<string, unknown>;  // The action's config fields (extending BaseTileActionConfig)
}
```

The `config` for each entry will omit `x` and `y` (those are filled at use-time from the clicked tile).

### 3.2 Where to Add the Player State + Inventory

**Decision:** Add a `playerState` property to `MapState` (`IsoGame/mapIso/mapState.ts`).

```ts
// Inside MapState
playerState: PlayerState = {
  username: "mickey-test",
  inventory: [],        // Potion[]
};
```

Rationale:
- `MapState` is the root singleton already accessible from both worker and UI message handlers.
- No need for a new global — avoids adding another singleton pattern to the codebase.
- The worker (`gameWorker.ts`) already imports `gobalMapState`.

### 3.3 Persistence Strategy

**Decision:** Use **IndexedDB** for the client-side potion inventory, with an optional **server-side SQLite** sync endpoint for future multi-device support.

#### Client-side (IndexedDB)

Create a new store `PotionInventory` in the existing `MapWebDatabase` (`mapWebDatabase.ts`):

```ts
// Schema upgrade: add store "PotionInventory" with keyPath "id"
interface PotionRecord {
  id: string;
  username: string;           // "mickey-test"
  potion: Potion;             // Full potion object
  updatedAt: number;
}
```

Add methods:
- `savePotion(username, potion)`
- `getAllPotions(username)` → `Potion[]`
- `deletePotion(id)`

Bump `WEB_DB_VERSION` to `2` with an `onupgradeneeded` handler.

#### Server-side (SQLite)

Add a new table `potion_inventory` and REST routes in `mapRouter.ts`:

```sql
CREATE TABLE IF NOT EXISTS potion_inventory (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  potion_data TEXT NOT NULL,    -- JSON-serialised Potion
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Routes:
- `GET /api/potions?username=mickey-test` → list potions
- `POST /api/potions` → save/update a potion
- `DELETE /api/potions/:id` → delete

For the initial implementation we can start with **IndexedDB only** and add the server routes as a follow-up.

### 3.4 Menu Integration — "Potion" Tab in Head Menu

**Decision:** Add a new tab `potion` to the `MenuTab[]` array in `main.ts`, following the exact same pattern as `assetMenuTab`.

Location in `main.ts` (the `config_tag` array):
```ts
const config_tag: MenuTab[] = [
  flyMenuTab(gameWorker),
  { id: "inspect", icon: "👀", ... },
  terrainMenuTab(gameWorker),
  colorMenuTab(gameWorker),
  assetMenuTab(gameWorker, handler),
  buildingMenuTab(gameWorker),
  potionMenuTab(gameWorker, handler),   // <-- NEW
];
```

The new file: `IsoGameAddon/iso/web/js/menu/sections/potionMenu.ts`

Structure:
```ts
export const potionMenuTab = (gameWorker: Worker) => ({
  id: "potion",
  icon: "🧪",
  sub: [
    {
      id: "craft_potion",
      icon: "🔬",
      callback_select: () => openCraftDialog(),
    },
    {
      id: "potion_list",
      icon: "📜",
      callback_select: () => openPotionListDialog(),
    },
  ],
}) as MenuTab;
```

### 3.5 Craft Dialog — Action Config Form Builder

**Decision:** Use the `DialogManager` pattern (same as asset selection in `assetMenu.ts`).

The craft dialog will:
1. Show a list of **action types** (from `ACTION_REGISTRY`).
2. When an action type is selected, render a **config form** based on the action's config type.
3. Allow stacking multiple action entries, with up/down reorder and remove buttons.
4. A "Save" button collects all entries + a name input → creates a `Potion` → saves to IndexedDB.

#### How to derive the form from an action type:

Add a metadata export to each action module (or to the registry) that describes the config schema:

```ts
// In each action module, beside the defineAction call:
export const lvlSetMeta: ActionMeta = {
  key: "lvlSet",
  label: "Set Level",
  fields: [
    { key: "lvl", type: "number", label: "Level", default: 1, min: 0, max: 255 },
    { key: "size", type: "number", label: "Brush Size", default: 1, min: 1, max: 20 },
  ],
};
```

**Alternative (simpler):** Use a central `ACTION_META_REGISTRY` that maps each action key to its form fields. This avoids modifying every action file:

```ts
// IsoGame/map/action2/actions/metaRegistry.ts
export const ACTION_META_REGISTRY: Record<string, ActionField[]> = {
  lvlSet: [
    { key: "lvl", type: "number", label: "Level", default: 1, min: 0, max: 255 },
  ],
  color: [
    { key: "r", type: "number", label: "Red", default: 128, min: 0, max: 255 },
    { key: "g", type: "number", label: "Green", default: 128, min: 0, max: 255 },
    { key: "b", type: "number", label: "Blue", default: 128, min: 0, max: 255 },
  ],
  // ... etc
};
```

**Decision:** Use the **central meta registry** approach — it's decoupled and easier to maintain.

### 3.6 Potion Usage Flow

When the player selects a potion from the list and clicks "Use":
1. The potion becomes the **active potion** (stored in `playerState.activePotionId`).
2. The system registers a temporary "use potion" tool.
3. Player clicks on the map → the tool sends a `usePotion` action to the worker.
4. Worker receives `usePotion`, resolves the potion from `playerState`, builds an array of `BaseTileActionConfig` (injecting `x`, `y` from the click), and calls `TilesActions.doActions(confs)`.
5. `remainingUses` is decremented. If 0, the potion is removed from inventory.
6. UI is updated via a `potionUsed` message back to the main thread.

**Implementation addition:**
- Add a `PotionHandler` in `IsoGame/handlers/game/func/potionHandlers.ts` (parallel to `toolHandlers.ts`):
  ```ts
  export interface EventUsePotion extends TBaseMessage<"usePotion"> {
    potionId: string;
    gridX: number;
    gridY: number;
  }
  ```
- Register this handler in `indexGameHandler` (alongside `toolHandlers`).

### 3.7 File Map — What Gets Created / Modified

```
NEW FILES:
  IsoGameAddon/iso/web/js/menu/sections/potionMenu.ts
    - Exports potionMenuTab() factory
    - Contains openCraftDialog(), openPotionListDialog()
    - Contains the craft form builder UI

  IsoGame/map/action2/actions/metaRegistry.ts
    - ACTION_META_REGISTRY: maps action key → form fields config

  IsoGame/handlers/game/func/potionHandlers.ts
    - EventUsePotion + usePotion handler
    - Decrements remainingUses, calls TilesActions.doActions()

MODIFIED FILES:
  IsoGame/mapIso/mapState.ts
    - Add PlayerState interface with inventory, activePotionId
    - Add playerState property to MapState

  IsoGameAddon/iso/web/js/main.ts
    - Import potionMenuTab
    - Add potionMenuTab(gameWorker, handler) to config_tag

  IsoGame/map/persistence/db/mapWebDatabase.ts
    - Add PotionInventory store (upgrade to v2)
    - Add savePotion, getAllPotions, deletePotion methods

  IsoGame/map/persistence/const.ts
    - Bump WEB_DB_VERSION to 2

OPTIONAL (server-side follow-up):
  IsoGame/map/persistence/db/mapServerDatabase.ts
    - Add potion_inventory table
  
  IsoGame/map/persistence/db/mapRouter.ts
    - Add /api/potions routes
```

---

## 4. Implementation Phases

### Phase 1 — Foundation (PR 1)
1. Add `PlayerState` to `MapState`.
2. Create `ACTION_META_REGISTRY` with form field definitions for all registered actions.
3. Extend `MapWebDatabase` with the `PotionInventory` store.
4. Create `potionHandlers.ts` with `usePotion` handler.
5. Wire the `usePotion` handler into the game handler index.

### Phase 2 — UI (PR 2)
1. Create `potionMenu.ts` with the menu tab definition.
2. Implement `openPotionListDialog()` — shows potion inventory from IndexedDB.
3. Implement "Use" button → sends `usePotion` to worker.
4. Implement `openCraftDialog()` — the form builder from meta registry.
5. Wire `potionMenuTab` into `main.ts`.

### Phase 3 — Polish & Server (PR 3)
1. Add server-side persistence routes for potions.
2. Auto-sync potion inventory on save.
3. "Buy potion" → add 1 to remainingUses (simple increment).
4. UI polish (confirmation dialogs, error states).

---

## 5. Open Questions

1. **Action meta registry completeness:** Do we need *all* action types to be craftable, or a subset? Initially a subset (e.g., `lvlSet`, `color`, `colorSquare`, `itemAddKey`, `setBlocked`) is safer.
2. **Potion "buy" mechanic:** The spec says "buy one (just add one for now)" — this implies a future currency system. For now, increment `remainingUses` by 1 on "buy".
3. **Concurrent potion use:** If a potion has 0 remaining uses mid-use, should we abort remaining actions? Yes — decrement at the start, and if 0, don't execute.

---

## 6. Sequence Diagram (Use Potion)

```
Player clicks "Use" on potion
  → main thread: gameWorker.postMessage({ action: "usePotion", potionId, gridX, gridY })
  → Worker: GameMessageHandler receives "usePotion"
  → PotionHandler:
      1. Lookup potion from playerState (loaded from IndexedDB)
      2. If remainingUses <= 0, reject
      3. Decrement remainingUses
      4. Build ActionEntry[] → BaseTileActionConfig[] (inject x, y)
      5. tilesActions.doActions(confs)
      6. Persist updated inventory
      7. Send "potionUsed" response back
  → Main thread: handler.handleIncoming("potionUsed")
      1. Refresh potion list UI
      2. Show brief feedback