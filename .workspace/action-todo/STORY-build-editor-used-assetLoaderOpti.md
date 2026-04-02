# Story: Build Editor Use AssetLoaderOpti

## Context

The `/editor/asset-preview/:key` endpoint in the building config editor currently suffers from a runtime mismatch. The server (Deno) was attempting to use browser-only Canvas APIs (`OffscreenCanvas`, `createImageBitmap`, `convertToBlob`) which are not available in the Deno server context, causing 500 errors when loading spritesheet-based assets like `platform_cornerOpen`, `platform_side`, and `platform_cornerDot`.

A temporary fix was applied using the `sharp` NPM library to extract sprites from spritesheets server-side. However, this introduces a new dependency and duplicates the extraction logic already present in the game's `AssetLoaderOpti` class.

## Goal

Replace the `sharp`-based extraction in the editor's asset-preview endpoint by properly using the existing `AssetLoaderOpti` class, eliminating code duplication and maintaining a single source of truth for asset loading logic.

## Why This Matters

1. **Code Reuse**: `AssetLoaderOpti` already contains the correct spritesheet extraction logic, including direction handling (NE/NW/SE/SW/N/S/E/W), scaling, and cut-size calculations.
2. **No New Dependencies**: Removes the `npm:sharp` dependency from the editor server.
3. **Consistency**: Ensures the editor previews match exactly what the game renders, since they use the same loader.
4. **Color Filter Support**: `AssetLoaderOpti.getAsset()` already handles color filter suffixes (e.g., `#H210_C115_S35_B120`) via `colorVariation()`, which the current endpoint does not fully support.

## Current Architecture

### AssetLoaderOpti (IsoGame/mapIso/asset/assetLoaderOpti.ts)
- **Runs in**: Browser / Web Worker context (uses `OffscreenCanvas`, `createImageBitmap`, `Blob`, `fetch`)
- **Loads**: All spritesheets at startup via `loadAssetFiles()`
- **Stores**: Cut sprites in `assetTree: Record<string, TypeAsset>` with `OffscreenCanvas` images
- **Provides**: `getAsset(key)` to retrieve a pre-cut canvas, with on-the-fly color variation caching
- **Key format**: `label_DIRECTION` (e.g., `platform_side_NE`) or `label_DIRECTION#filter` for color variants

### Editor Server (IsoGame/wcBuilding2/editor/server.ts)
- **Runs in**: Deno server context (Oak HTTP framework)
- **Problem**: Cannot instantiate `AssetLoaderOpti` because it depends on browser APIs (`OffscreenCanvas`, `createImageBitmap`)
- **Current workaround**: Uses `npm:sharp` to manually extract sprites from spritesheets

## Challenge

`AssetLoaderOpti` depends on browser APIs that are not available in Deno server context. Conversely, `npm:sharp` works in Deno but doesn't exist in the browser. We need a solution that works in both contexts or a way to share the loading logic.

## Proposed Approaches

### Approach A: Shared Core Logic with Platform-Specific Image APIs

**Extract the pure calculation logic** (cut coordinates, scaling, etc.) into a shared utility module, then implement platform-specific rendering:

1. Create `IsoGame/mapIso/asset/assetCutUtils.ts` — pure functions:
   - `getCutRect(label, direction, config)` → `{ x, y, width, height, destX, destY, destW, destH }`
   - `getSpritesheetPath(label, config)` → string path
   - Parse filter strings: `parseFilterStr(filterStr)` → filter config

2. Browser path: `AssetLoaderOpti` uses these utils with `OffscreenCanvas`
3. Server path: Editor server uses these utils with `sharp`

**Pros**: 
- Shared business logic, no duplication
- Both paths produce identical results (same math)
- Color variation logic can also be shared

**Cons**:
- Still maintains two rendering paths
- `sharp` dependency remains but with correct params from shared utils

### Approach B: Run AssetLoaderOpti in a Browser/Worker Context

Since the editor already runs in the browser, move the asset loading entirely client-side:

1. **Client fetches spritesheet info** from a lightweight endpoint that returns image config
2. **Client loads spritesheets** directly via `fetch()` (they're just PNGs in `/img/`)
3. **Client renders previews** using `AssetLoaderOpti` in a Web Worker or main thread

The server's `/editor/asset-preview/:key` endpoint becomes unnecessary — the client loads assets directly from `/img/asset_opti/...png`.

**Pros**:
- Zero new server dependencies
- Exact same rendering as the game
- No browser/Deno API mismatch

**Cons**:
- Requires changes to the editor client code
- May have CORS issues if not careful (though same-origin should work)
- Client needs to load all spritesheets

### Approach C: Use Deno's Canvas Support (Deno 2.x)

Deno 2.x has experimental canvas support via `--unstable-kv` or the `deno_canvas` package. Check if `OffscreenCanvas` and `createImageBitmap` are available with the right flags.

**Pros**:
- Most direct path — use existing code as-is

**Cons**:
- May require unstable flags
- Performance concerns with server-side canvas
- Not guaranteed to work in Deno 2.1.7

### Approach D: Hybrid — Serve Spritesheet Meta, Client Cuts

1. Server endpoint `/editor/asset-preview/:key` returns **JSON metadata** instead of an image:
   ```json
   {
     "spritesheetUrl": "/img/asset_opti/AstroPlatform.png",
     "cutRect": { "x": 0, "y": 896, "w": 192, "h": 352 },
     "outputSize": { "w": 192, "h": 352 },
     "scale": 0.7
   }
   ```
2. Client-side `AssetPreviewService` cuts the sprite using a canvas element

**Pros**:
- Server does no image processing
- Client uses standard browser canvas APIs
- Minimal server changes

**Cons**:
- Requires client changes to handle JSON response
- Adds latency (meta fetch → image fetch → canvas cut)

## Recommended Approach: **Approach B with Approach A's Shared Utils**

### Implementation Plan

#### Step 1: Extract Shared Cut Logic
Create `IsoGame/mapIso/asset/assetCutUtils.ts`:
```typescript
export const W_CUT_SIZE = 192; // 256 - 64
export const H_CUT_SIZE = 224; // 256 - 32

export interface CutRect {
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
  destX: number;
  destY: number;
  destW: number;
  destH: number;
}

export function getCutRect(
  direction: string,
  rowIndex: number,
  scall: boolean
): CutRect {
  const scaleFactor = scall ? 0.7 : 1;
  
  const directionColumns: Record<string, number> = {
    "NE": 0, "NW": 1, "SW": 2, "SE": 3,
    "N": 4, "W": 5, "S": 6, "E": 7,
  };
  const column = directionColumns[direction] ?? 0;
  
  return {
    srcX: W_CUT_SIZE * column + Math.floor(W_CUT_SIZE * ((1 - scaleFactor) / 2)),
    srcY: H_CUT_SIZE * rowIndex + Math.floor(H_CUT_SIZE * (1 - scaleFactor)),
    srcW: Math.floor(W_CUT_SIZE * scaleFactor),
    srcH: H_CUT_SIZE + 128,
    destX: 32,
    destY: scall ? 32 : 0,
    destW: W_CUT_SIZE,
    destH: Math.floor(H_CUT_SIZE / scaleFactor) + 128,
  };
}

export function findAssetInConfig(label: string) {
  // Returns { groupConfig, imageConfig } or null
  for (const group of assetOptiConfig) {
    const imageConfig = group.images.find(img => img.label === label);
    if (imageConfig) {
      return { groupConfig: group, imageConfig };
    }
  }
  return null;
}
```

#### Step 2: Update AssetLoaderOpti to Use Shared Utils
Modify `loadAssetImage()` in `AssetLoaderOpti` to call `getCutRect()` instead of duplicating the math.

#### Step 3: Client-Side Asset Loading
Modify the editor's `AssetPreviewService` (`IsoGame/wcBuilding2/editor/web/js/services/assetPreview.ts`) to:
1. Request preview URLs from the server (JSON with spritesheet info)
2. Load the spritesheet via `fetch()`
3. Cut the sprite using `OffscreenCanvas` with `getCutRect()` math
4. Return a blob URL for the image

OR, simpler: just load spritesheets directly in the client and use `AssetLoaderOpti`.

#### Step 4: Simplify or Remove Server Endpoint
Option A: Remove `/editor/asset-preview/:key` entirely and load assets client-side
Option B: Keep the endpoint but have it return JSON metadata for client-side rendering

## Acceptance Criteria

- [ ] Asset previews load correctly for both standalone PNGs and spritesheet assets
- [ ] Color filter suffixes (`#H210_C115_...`) are applied correctly to previews
- [ ] Direction suffixes (`_NE`, `_NW`, etc.) are handled correctly
- [ ] The `npm:sharp` dependency is removed from the editor server
- [ ] Editor previews match what the game renders (visual parity)
- [ ] No 500 errors in the asset-preview endpoint

## Files to Modify

1. `IsoGame/mapIso/asset/assetCutUtils.ts` — **NEW** Shared cut logic
2. `IsoGame/mapIso/asset/assetLoaderOpti.ts` — Refactor to use shared utils
3. `IsoGame/wcBuilding2/editor/server.ts` — Simplify/remove asset-preview endpoint
4. `IsoGame/wcBuilding2/editor/web/js/services/assetPreview.ts` — Implement client-side loading
5. `IsoGame/wcBuilding2/editor/web/js/panels/assetCollection.ts` — Use new preview approach

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `sharp` may fail on server | Use Approach B — move loading to client |
| Client loading heavy spritesheets | Lazy-load only needed spritesheets |
| Math mismatch between client/server | Extract to shared utils — single source |
| CORS issues loading images | All assets served from same origin |

## Timeline Estimate

- Shared utils extraction: ~30min
- AssetLoaderOpti refactor: ~15min
- Client-side preview implementation: ~45min
- Server simplification: ~15min
- Testing & debugging: ~30min

**Total: ~2.5 hours**