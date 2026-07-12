# TODO 001 — Consolidate Isometric Configuration (IsoConfig)

## Problem

The isometric grid configuration (`mapGridSize`, `mapGridTileScale`, `mapGridMod`, and display flags) is **duplicated across multiple types and locations** with different field names, making the system fragile and hard to maintain.

### Current Duplication

| Location | Type Name | Fields | Notes |
|----------|-----------|--------|-------|
| `IsoGame/mapIso/render/type.ts` | `MapGridLaout` | `mapGridSize`, `mapGridTileScale`, `mapGridMod`, `showTileBox`, `showIsFrise`, `showIsBlock` | Primary type used by render pipeline |
| `IsoGame/handlers/game/gameState.ts` | `CanvasMapConf` | `mapSize`, `tileScaleSize`, `tileScaleMod` | **Different field names** — same semantics |
| `IsoGame/handlers/render/state/renderState.ts` | `RenderState` (inline) | `mapGridSize`, `mapGridMod`, `mapGridTileScale` | Duplicate defaults |
| `IsoGame/handlers/render/state/renderStateUtils.ts` | (inline usage) | `renderState.mapGridMod` | Reads from RenderState |
| `IsoGame/handlers/render/handler/statesHandlers.ts` | `EventUpdateDrawConfigLayout` | `mapGridSize`, `mapGridMod`, `mapGridTileScale` | Duplicate interface |
| `IsoGame/handlers/render/handler/statesHandlers.ts` | `EventUpdateDrawConfigLayer` | `showTileBox`, `showIsFrise`, `showIsBlock` | Duplicate interface |
| `IsoGameAddon/iso/web/js/menu/sections/flyMenu.ts` | (inline objects) | `mapGridSize`, `mapGridTileScale`, `mapGridMod` | Hardcoded presets |

### Config Flow (Current)

```
flyMenu.ts (hardcoded presets)
  → postMessage({ action: "initCanvasMap", mapConf: {...} })
    → game/handler/initHandlers.ts (initCanvasMap handler)
      → new CanvasMapDrawers(_ctx, ..., isoConf, ...)  // uses MapGridLaout
      → gobalGameState.setIsoConf({ mapSize, tileScaleSize, tileScaleMod })  // CanvasMapConf
    → (also sent to render worker via separate message)
      → render/handler/initHandlers.ts (initRenderMap handler)
        → _ctx.conf.mapGridSize = ...  // MapGridLaout
      → render/handler/statesHandlers.ts (updateDrawConfigLayout)
        → _ctx.renderState.mapGridSize = ...  // RenderState
```

## Solution: Single `IsoConfig` Type

Create a single, unified configuration type used everywhere, with a single source of defaults.

### New Type: `IsoConfig`

```typescript
export interface IsoConfig {
  mapGridSize: number;
  mapGridTileScale: number;
  mapGridMod: number;
  showTileBox: boolean;
  showIsFrise: boolean;
  showIsBlock: boolean;
}
```

### Changes Required

#### Phase 1 — Create unified type and remove duplicates

- [x] **`IsoGame/mapIso/render/type.ts`**: Rename `MapGridLaout` → `IsoConfig`, keep as the canonical type. Keep `MapGridLaoutDefault` but rename to `DEFAULT_ISO_CONFIG`.
- [x] **`IsoGame/handlers/game/gameState.ts`**: Remove `CanvasMapConf` interface. Replace `isoConf: CanvasMapConf` with `isoConf: IsoConfig` (import from `render/type.ts`). Update `setIsoConf()` signature.
- [x] **`IsoGame/handlers/render/state/renderState.ts`**: Remove duplicate `mapGridSize`, `mapGridMod`, `mapGridTileScale` fields. Add `isoConfig: IsoConfig` field initialized from `DEFAULT_ISO_CONFIG`.
- [x] **`IsoGame/handlers/render/handler/statesHandlers.ts`**: Remove `EventUpdateDrawConfigLayout` and `EventUpdateDrawConfigLayer`. Replace with single `EventUpdateIsoConfig` that carries full `IsoConfig`.

#### Phase 2 — Update all consumers

- [x] **`IsoGame/handlers/render/state/renderStateUtils.ts`**: Update `tickRenderKeyboard()` to read `renderState.isoConfig.mapGridMod` instead of `renderState.mapGridMod`.
- [x] **`IsoGame/handlers/game/gameState.ts`**: Update `tickUpdateKeyboard()` to read `_stt.isoConf.mapGridMod` (field name stays same, type changes).
- [x] **`IsoGame/mapIso/canvasMapDrawer.ts`**: Update constructor to accept `IsoConfig`. Update `drawUpdate()` to use `_drawCtx.conf.mapGridMod`.
- [x] **`IsoGame/mapIso/render/drawTile.ts`**: Already uses `MapGridLaout` which is now an alias for `IsoConfig` — no changes needed.
- [x] **`IsoGame/mapIso/render/drawPlayer.ts`**: Same — no changes needed.
- [x] **`IsoGame/mapIso/render/drawGridOverlay.ts`**: Same — no changes needed.
- [x] **`IsoGame/mapIso/render/drawHoverOverlay.ts`**: Same — no changes needed.
- [x] **`IsoGame/mapIso/render/utils/drawTileUtils.ts`**: Same — no changes needed.
- [x] **`IsoGame/mapIso/render/utils/drawAsset.ts`**: Same — no changes needed.
- [x] **`IsoGame/mapIso/utils/simpleIso/IsometricProjector.ts`**: Already uses `MapGridLaout` which is now an alias — no changes needed.
- [x] **`IsoGame/mapIso/utils/iso/isomer.ts`**: Already uses individual params — no changes needed (it's a low-level utility).
- [x] **`IsoGame/handlers/render/create.ts`**: Update to use `IsoConfig` and `DEFAULT_ISO_CONFIG`.
- [x] **`IsoGame/handlers/render/update.ts`**: Already uses `TRenderHandlerContext` which now has `conf: IsoConfig` — no changes needed.
- [x] **`IsoGame/handlers/game/handler/initHandlers.ts`**: Update `EventInitCanvasMap` to use `IsoConfig`. Update handler to use `IsoConfig` directly instead of casting.
- [x] **`IsoGame/handlers/render/handler/initHandlers.ts`**: Update `EventInitRenderMap` to use `IsoConfig`. Update handler.
- [x] **`IsoGame/handlers/render/contexts.ts`**: Update `TRenderHandlerContext` to use `IsoConfig`.

#### Phase 3 — Update menu and message flow

- [x] **`IsoGameAddon/iso/web/js/menu/sections/flyMenu.ts`**: Already uses `MapGridLaout` field names which match `IsoConfig` — no changes needed.
- [x] **`IsoGameAddon/iso/web/js/gameWorker.ts`**: Update references to `gobalGameState.isoConf.tileScaleMod` → `gobalGameState.isoConf.mapGridMod`.

#### Phase 4 — Clean up

- [x] `MapGridLaoutOption` kept as `Partial<IsoConfig>` for backward compatibility.
- [x] Run `deno check` on all modified files — **PASS**.
- [x] Run `deno lint --fix` on all modified files — pre-existing lint issues unrelated to changes.
- [x] Register `stateHandlers` in `handlers.ts` render handler list.
- [x] Fix pre-existing `currentDiplayBox` missing from `TRenderHandlerContext`.
- [x] Remove unused imports (`MapGridLaout`, `IsoConfig`, `drawGridOverlay`).

## Migration Strategy

1. First, create the `IsoConfig` type and `DEFAULT_ISO_CONFIG` in `render/type.ts` (keeping old names as aliases temporarily).
2. Update all imports to use `IsoConfig`.
3. Remove `CanvasMapConf` from `gameState.ts`.
4. Update `RenderState` to use `IsoConfig`.
5. Update all handlers and consumers.
6. Remove old type aliases.
7. Test.