# Plan — Asset Preview Fix & Enhancement

> ZeoIsoDeno Implementation Plan — 2026-03-28
> Tech Lead: Implementation Breakdown

---

## Introduction

The asset preview in the tool menu (`web/js/menu/toolMenu.ts`) currently uses a broken CSS sprite-based approach. The `updateAssetPreview()` function calculates background-position offsets based on hardcoded column/row values, but this doesn't correctly display the selected asset. The sprite sheet layout assumptions (256px width, 64px per column) don't match the actual sprite dimensions (192px width per asset, 224px height per asset).

The solution is to leverage the existing `AssetLoaderOpti.getAsset()` function, which already handles:
1. Loading and caching assets from sprite sheets
2. Splitting the asset key to extract the base key and filter suffix (e.g., `"AstroBase_NE#H30_C120_S80_B100"`)
3. Applying color filters (hue, contrast, saturation, brightness) via `colorVariation()`
4. Returning an `OffscreenCanvas` ready for display

Additionally, the menu should expose hue, contrast, saturation, and brightness controls that dynamically update the asset preview and send the full asset key (with filter suffix) to the worker.

**Key integration points:**
- `web/js/menu/toolMenu.ts` — Replace `updateAssetPreview()` to use `AssetLoaderOpti.getAsset()`, add filter UI controls
- `IsoGame/mapIso/asset/assetLoaderOpti.ts` — Already has `getAsset()` with filter support (no changes needed)
- `IsoGame/mapIso/asset/assetUtils.ts` — Already has filter parsing and application (no changes needed)

---

## Task 1: Refactor Asset Preview to Use AssetLoaderOpti.getAsset()

**File**: `web/js/menu/toolMenu.ts`

### Current Problem
The `updateAssetPreview()` function uses CSS sprite positioning with hardcoded calculations:
```ts
const topOffset = assetIndex * 224;
const columnOffset = getColumnOffset(activeAssetSuffix);
// background-position: -${columnOffset}px -${topOffset}px;
```

This doesn't work because:
- `getColumnOffset()` assumes 64px columns (256 * 196/784), but actual columns are 192px
- The sprite sheet URL construction assumes a single file per group, which is correct, but position calculation is wrong
- No support for color filter suffixes

### Solution
Replace the sprite-based approach with a canvas-to-data-URL approach using `AssetLoaderOpti.getAsset()`.

### Changes Required

1. **Import AssetLoaderOpti** (or pass it as reference from worker):
   - The main thread doesn't have direct access to `AssetLoaderOpti` (it runs in the worker)
   - Need to either:
     - **Option A**: Send the asset preview as a bitmap from the worker (via `postMessage` with `ImageBitmap` transfer)
     - **Option B**: Duplicate a lightweight `getAsset()` on the main thread that reads the sprite sheet directly
     - **Option C**: Request the worker to send back a rendered preview as `ImageData` or blob URL

   **Recommended: Option C** — The worker already has `AssetLoaderOpti` loaded. When the user selects an asset, the worker can send back the rendered canvas as a blob URL or ImageBitmap.

2. **Worker Side** (`IsoGame/worker/game/GameWorker.ts` or `IsoGame/tools/assetTools.ts`):
   - In the `setActiveAsset` handler, use `assetLoader.getAsset(fullKey)` to get the canvas
   - Convert canvas to blob URL: `canvas.convertToBlob().then(blob => URL.createObjectURL(blob))`
   - Send `assetPreview` message to main thread with the blob URL

3. **Main Side** (`web/js/menu/toolMenu.ts`):
   - Handle `assetPreview` message from worker
   - Update `#selectedAssetPreview` with an `<img>` tag using the blob URL
   - Remove `updateAssetPreview()` function entirely

### Items

- [x] Add `assetPreview` message handler in `web/js/menu/toolMenu.ts` (exported function `handleAssetPreview(blobUrl: string)`)
- [x] Update `#selectedAssetPreview` rendering to use `<img>` with blob URL instead of CSS sprite
- [x] Modify `setActiveAsset` handler in worker to call `assetLoader.getAsset()` and send preview
- [x] Modify `setActiveAssetSuffix` to also trigger preview update via worker
- [x] Remove `updateAssetPreview()`, `getColumnOffset()`, `getAssetIndex()`, `getAssetGroup()` helper functions
- [x] Remove `.asset-preview-sprite` CSS class (replace with `.asset-preview-img`)

---

## Task 2: Add Color Filter Controls (Hue, Contrast, Saturation, Brightness)

**File**: `web/js/menu/toolMenu.ts`

### Current State
The menu has a direction suffix selector (`_NE`, `_NW`, `_SW`, `_SE`) but no color filter controls.

### Solution
Add sliders for hue, contrast, saturation, and brightness that:
1. Update the asset preview in real-time
2. Store the filter values in state
3. Construct the filter suffix string (e.g., `#H30_C100_S100_B100`)
4. Send the full asset key with filter to the worker via `setActiveAsset`

### Filter Format (from `assetUtils.ts`)
```
#H{hue}_C{contrast}_S{saturation}_B{brightness}
```
- H = hue: 0-360 (0 = no change)
- C = contrast: 5-250 (100 = no change)
- S = saturation: 5-250 (100 = no change)
- B = brightness: 5-250 (100 = no change)

Default values (no filter): `H0_C100_S100_B100` (can be omitted entirely)

### Changes Required

1. **Add filter state variables**:
   ```ts
   let activeHue: number = 0;
   let activeContrast: number = 100;
   let activeSaturation: number = 100;
   let activeBrightness: number = 100;
   ```

2. **Add filter UI controls** in `#assetBrowser` section (after `#suffixSelector`):
   ```html
   <div id="assetFilterControls">
     <div class="filter-row">
       <span>Hue:</span>
       <input type="range" min="0" max="360" value="0" class="filter-slider" data-filter="hue">
       <span class="filter-value">0°</span>
     </div>
     <div class="filter-row">
       <span>Sat:</span>
       <input type="range" min="5" max="250" value="100" class="filter-slider" data-filter="saturation">
       <span class="filter-value">100</span>
     </div>
     <div class="filter-row">
       <span>Con:</span>
       <input type="range" min="5" max="250" value="100" class="filter-slider" data-filter="contrast">
       <span class="filter-value">100</span>
     </div>
     <div class="filter-row">
       <span>Brt:</span>
       <input type="range" min="5" max="250" value="100" class="filter-slider" data-filter="brightness">
       <span class="filter-value">100</span>
     </div>
     <button id="resetFiltersBtn" class="filter-reset-btn">Reset Filters</button>
   </div>
   ```

3. **Add filter slider event handlers**:
   - On slider change: update state, rebuild filter suffix, trigger preview update
   - Update the `.filter-value` display next to each slider

4. **Add `buildFilterSuffix()` helper**:
   ```ts
   function buildFilterSuffix(): string {
     if (activeHue === 0 && activeContrast === 100 && activeSaturation === 100 && activeBrightness === 100) {
       return '';
     }
     return `#H${activeHue}_C${activeContrast}_S${activeSaturation}_B${activeBrightness}`;
   }
   ```

5. **Update `setActiveAsset()` and `setActiveAssetSuffix()`** to include filter suffix in the asset key sent to worker

6. **Add reset filters button handler**: reset all sliders to default, update preview

### Items

- [x] Add filter state variables (`activeHue`, `activeContrast`, `activeSaturation`, `activeBrightness`)
- [x] Add `#assetFilterControls` HTML block in `renderToolMenu()` (inside `#assetBrowser`)
- [x] Add `buildFilterSuffix()` helper function
- [x] Add filter slider event handlers in `renderToolMenu()`
- [x] Add `resetFiltersBtn` click handler
- [x] Update `setActiveAsset()` to include filter suffix in worker message
- [x] Update `setActiveAssetSuffix()` to trigger preview update with filter
- [x] Export `handleAssetPreview(blobUrl: string)` function for worker callback

---

## Task 3: Add CSS Styles for Filter Controls

**File**: `web/stylesIso.css`

### Changes Required

- [x] Add `#assetFilterControls` styles (padding, border, background)
- [x] Add `.filter-row` styles (flex row, gap, alignment)
- [x] Add `.filter-slider` styles (range input styling)
- [x] Add `.filter-value` styles (monospace, small font, fixed width)
- [x] Add `.filter-reset-btn` styles (matches existing button styles)

---

## Task 4: Worker Message Protocol Update

**File**: `IsoGame/worker/game/GameWorker.ts`

### Changes Required

- [x] In `setActiveAsset` handler:
  1. Get canvas from `assetLoader.getAsset(data.assetId)`
  2. If canvas exists, convert to blob URL: `canvas.convertToBlob().then(...)`
  3. Send `assetPreview` message to main: `{ action: "assetPreview", blobUrl: "..." }`
  4. Store `activeAssetId` in `toolRegistry`

- [x] Handle filter suffix in asset key:
  - The `data.assetId` will now include the filter suffix (e.g., `"AstroBase_NE#H30_C100_S100_B100"`)
  - `AssetLoaderOpti.getAsset()` already handles this format
  - No additional parsing needed on worker side

### Message Protocol Addition

| Direction | Action | Payload | Notes |
|-----------|--------|---------|-------|
| Worker → Main | `assetPreview` | `{ blobUrl: string }` | New message for asset preview |

---

## Task 5: Cleanup and Verification

### Items

- [x] Remove unused helper functions: `getColumnOffset()`, `getAssetIndex()`, `getAssetGroup()` — Already removed (never existed in final code)
- [x] Remove unused CSS class `.asset-preview-sprite` — Removed from `web/stylesIso.css`
- [x] Update `#selectedAssetLabel` to show full key including filter suffix — Already implemented in `setActiveAsset()`
- [x] `activeAssetSuffix` is still actively used for direction suffixes (`_NE`, `_NW`, `_SW`, `_SE`) — NOT unused, do NOT remove. The filter suffix system (`buildFilterSuffix()`) is separate and complementary.
- [ ] Test asset preview with different directions (`_NE`, `_NW`, `_SW`, `_SE`)
- [ ] Test asset preview with different filter values (hue rotation, saturation, etc.)
- [ ] Verify that placing assets on the map still works with filter suffixes
- [ ] Verify that the worker correctly receives and applies the full asset key

---

## File Summary

| File | Type | Changes |
|------|------|---------|
| `web/js/menu/toolMenu.ts` | MODIFY | Replace sprite preview with canvas-based preview, add filter UI, add message handler |
| `web/stylesIso.css` | MODIFY | Add filter control styles |
| `IsoGame/worker/game/GameWorker.ts` | MODIFY | Send asset preview blob URL to main thread |

---

## Implementation Order

1. **Task 4** (Worker) — Add preview generation and message sending
2. **Task 1** (Main) — Replace sprite preview with blob URL preview
3. **Task 2** (Main) — Add filter controls UI
4. **Task 3** (CSS) — Add filter control styles
5. **Task 5** (Cleanup) — Remove old code, verify functionality

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `OffscreenCanvas.convertToBlob()` not available in all browsers | Fallback to `toDataURL()` if `convertToBlob()` fails |
| Worker message latency for preview updates | Debounce slider changes (200ms), show loading state |
| Blob URL memory leaks | Revoke old blob URL before setting new one |
| Filter suffix parsing conflicts with `#` character | The `#` is already used by `AssetLoaderOpti.getAsset()` — no conflict |