# TASKS-P2-SUMMARY — Priority 2 Features Continuation

## Overview

This document summarizes the implementation status and next steps for Priority 2 (P2) features of the Building Configuration Editor:

1. **Loading JSON configs** — Runtime loading of saved JSON building configurations back into the editor and game
2. **Asset image display on tiles** — Using the asset loader to display actual asset images when tiles reference assets

---

## Feature 1: Loading JSON Configs

### What's Missing / Needs Improvement

#### 1.1 Client-Side JSON Config Loading in Editor

**Status:** ✅ COMPLETED

**What was done:**
- Added API endpoint `GET /editor/load/building/:name` in `server.ts`
- Added API endpoint `GET /editor/load/asset-collection/:name` in `server.ts`
- Added `loadBuilding(name)` method to `ApiClient` in `api.ts`
- Added `loadAssetCollection(name)` method to `ApiClient` in `api.ts`
- Updated library panel `handleItemClick()` in `library.ts` to load JSON configs via API
- JSON configs now load into editor state and become editable

#### 1.2 JSON Config Editing Workflow

**Problem:** When a JSON config is loaded via extraction or loading, the editor properly populates the panels. However, there's no distinction between extracted and loaded-from-JSON configs, and no "Save As" or "Revert" functionality.

**Files to Update:**
- `IsoGame/wcBuilding2/editor/web/js/state.ts`
- `IsoGame/wcBuilding2/editor/web/js/panels/building.ts`
- `IsoGame/wcBuilding2/editor/web/js/panels/assetCollection.ts`

**Tasks:**
- [x] Update `setActiveConfig` to track source ("extracted" vs "loaded" vs "json")
- [x] Dirty state tracking works correctly for loaded JSON configs (`markDirty()` in state.ts)
 - [x] Add visual indicator distinguishing "Extracted" vs "Loaded from JSON" configs
 - [x] Implement "Revert to Original" for dirty JSON configs (reload from disk)
 - [ ] Add "Save As..." functionality for creating copies of existing configs

#### 1.3 Config Registry Integration

**Problem:** The loader uses registry lookups but the editor doesn't fully leverage the registry for config management.

**Files to Update:**
- `IsoGame/wcBuilding2/editor/web/js/api.ts`
- `IsoGame/wcBuilding2/editor/server.ts`

**Tasks:**
- [ ] Add `GET /editor/registry/building/:id/metadata` endpoint for config metadata
- [ ] Add registry ID to library panel items for proper loading
- [ ] Implement config deletion endpoint
- [ ] Add config duplication endpoint
- [ ] Support config versioning/migration

#### 1.4 Error Handling & Edge Cases

**Tasks:**
- [ ] Handle corrupted JSON files gracefully
- [ ] Handle version migration (future schema changes)
- [ ] Handle missing face keys when loading configs
- [ ] Validate tile references on load
- [ ] Add loading indicators for JSON config loading
- [ ] Add retry logic for failed loads

---

## Feature 2: Asset Image Display on Tiles

### Current Status: ✅ FULLY INTEGRATED

The infrastructure for loading and displaying asset images exists but is not yet integrated into the tile editor UI. When a tile references an asset (via `assets: [{ key: "wallDoor", sufix: "#..." }]`), the editor should display the actual asset image.

### What's Missing / Needs Implementation

#### 2.1 Asset Image Rendering in Canvas Preview

**Status:** ✅ COMPLETED

**What was done:**
- Implemented `drawTileAssets()` method in `Canvas2DPreview` (`canvas2d.ts`)
- Asset images render at correct isometric position on tile rhombus
- Color filter suffix transformation applied via canvas filter (`buildColorFilter()`)
- Asset rotation (`keyR`) handled at 90°, 180°, 270° increments
- Asset height layering (`h: 0, 1, 2`) stacks assets vertically
- Asset offset (`off: {x, y}`) applied for precise positioning
- Missing/broken images handled gracefully (placeholder shown via `AssetPreviewService`)

**Code Sketch:**
```typescript
private drawTileAssets(x: number, y: number, tile: TileConfig): void {
  if (!tile.assets) return;
  
  tile.assets.forEach((asset) => {
    const img = this.assetImages.get(asset.key);
    if (!img) return;
    
    // Apply color suffix filter if present
    if (asset.sufix?.startsWith('#')) {
      // Extract H, C, S, B values and apply color transformation
      const filter = this.buildColorFilter(asset.sufix);
      this.ctx.filter = filter;
    }
    
    // Calculate screen position with rotation and offset
    const screenPos = this.gridToScreen(x, y);
    const rotation = (asset.keyR ?? 0) * 90 * Math.PI / 180;
    const offset = asset.off ?? { x: 0, y: 0 };
    const heightOffset = (asset.h ?? 0) * 10; // Layer offset
    
    // Draw image with isometric transform
    this.ctx.save();
    this.ctx.translate(screenPos.x + offset.x, screenPos.y + offset.y - heightOffset);
    this.ctx.rotate(rotation);
    this.ctx.drawImage(img, -img.width / 2, -img.height / 2);
    this.ctx.restore();
    this.ctx.filter = 'none';
  });
}
```

#### 2.2 Asset Thumbnail Display in Tile Editor

**Status:** ✅ COMPLETED

**What was done:**
- Added `AssetPreviewService` to `AssetListEditorOptions` interface
- Added thumbnail preview container at start of each asset row
- Thumbnails show actual asset images loaded via `AssetPreviewService`
- Color suffix preview applied dynamically using CSS filter (`buildCSSFilter()`)
- Thumbnails update when suffix changes in real-time

**Implementation Approach:**
- Use `AssetPreviewService.loadImage(key)` to get HTMLImageElement
- Create `<img>` elements next to asset dropdowns
- Apply CSS filters for color suffix preview: `filter: hue-rotate(...) saturate(...) brightness(...)`
- Use tooltip library or custom implementation for hover details

#### 2.3 Asset Preview in Tile Editor

**Status:** ✅ COMPLETED

**What was done:**
- Integrated `AssetPreviewService` into `TileEditorPanel` (`tile.ts`)
- Preload asset images for tiles being edited via `loadAvailableAssets()`
- `renderCanvasPreview()` now loads and sets asset images for canvas
- `reloadAssetPreviews()` refreshes canvas when assets change
- Canvas2DPreview renders loaded assets with filters

#### 2.4 Color Suffix Preview & Filter Application

**Status:** ✅ COMPLETED

**What was done:**
- Implemented `buildColorFilter()` in `canvas2d.ts` for canvas rendering
- Implemented `buildCSSFilter()` in `assetList.ts` for HTML element filtering
- Both parsers handle `#H{hue}_C{chroma}_S{saturation}_B{brightness}` format
- Partial suffixes are handled (missing components default to 0/100)
- Canvas filter applied when drawing asset images
- CSS filter applied to thumbnail previews in asset list

#### 2.5 Asset Collection Tile Preview

**Problem:** Asset collection editor panel doesn't show visual previews of tile assets.

**Files to Update:**
- `IsoGame/wcBuilding2/editor/web/js/panels/assetCollection.ts`
- `IsoGame/wcBuilding2/editor/web/js/components/canvas2d.ts`

**Tasks:**
- [ ] Add tile preview section to asset collection editor
- [ ] Show grid of tiles with their asset images rendered
- [ ] Support clicking tile to open tile editor modal
- [ ] Show template parameter resolved view (actual colors vs placeholders)

#### 2.6 Performance Optimization

**Problem:** Loading many asset images could be slow if not optimized.

**Tasks:**
- [ ] Implement asset image caching strategy (LRU cache, max size)
- [ ] Implement progressive loading (visible tiles first)
- [ ] Add loading placeholders while images load
- [ ] Implement viewport-based asset loading (only load assets for visible tiles)
- [ ] Add asset image preload on building config load
- [ ] Implement Web Worker for heavy image processing (color transforms)
- [ ] Add memory usage monitoring and cache eviction

---

## Technical Notes

### Asset Image Loading Flow

```
Server: GET /editor/asset-preview/:key
  → Reads img/asset_opti/{key}.png
  → Returns image/png

Client: AssetPreviewService.loadImage(key)
  → Fetches /editor/asset-preview/{key}
  → Creates HTMLImageElement from response
  → Caches in Map<string, HTMLImageElement>
  → Returns cached image on subsequent calls

Canvas2DPreview.drawTileAssets()
  → Gets loaded images from AssetPreviewService
  → Applies color filter transformations
  → Draws at isometric position with rotation/offset
```

### Color Suffix Format

The color suffix format `#H{hue}_C{chroma}_S{saturation}_B{brightness}` maps to:

| Component | Range | Description | CSS Filter Equivalent |
|-----------|-------|-------------|----------------------|
| H (Hue) | 0-360 | Hue rotation | `hue-rotate(H deg)` |
| C (Chroma) | 0-255 | Base color lightness | `brightness(C / 128)` |
| S (Saturation) | 0-100+ | Saturation level | `saturate(S / 50 * 100%)` |
| B (Brightness) | 0-255 | Brightness level | `brightness(B / 128)` |

Example: `#H210_C115_S35_B120`
- Hue: 210° (blue shift)
- Chroma: 115 (slightly lighter than mid)
- Saturation: 35% (desaturated)
- Brightness: 120 (slightly bright)

Filter: `hue-rotate(210deg) saturate(70%) brightness(94%)`

### JSON Config Loading Flow

```
1. User clicks JSON config "HouseA" in library panel
2. Library panel calls apiClient.loadBuilding("HouseA")
3. API client fetches GET /editor/load/building/HouseA
4. Server reads conf/buildings/HouseA.json
5. Server returns JSON BuildingConfig
6. Client parses and sets as activeConfig in state
7. Building editor panel renders with loaded config
8. User edits tiles, parameters, etc.
9. User saves → POST /editor/save/building/HouseA
10. Server overwrites conf/buildings/HouseA.json
```

---

## Dependencies Between Features

```
Asset Image Display (2.1)
  └── Requires: AssetPreviewService (done)
  └── Requires: /editor/asset-preview/:key endpoint (done)
  └── Requires: Color filter parsing (2.4)
  
JSON Config Loading (1.1-1.4)
  └── Requires: /editor/load/* endpoints (new)
  └── Requires: Library panel updates
  └── Independent of: Asset display

Asset Thumbnails in UI (2.2-2.3)
  └── Requires: Asset Image Display foundation
  └── Enhances: Tile editor UX

Color Filter System (2.4)
  └── Required by: Canvas asset rendering
  └── Required by: Asset thumbnail previews
```

---

## Related Files Reference

### Server-Side
| File | Purpose |
|------|---------|
| `IsoGame/wcBuilding2/editor/server.ts` | HTTP endpoints (add load endpoints here) |
| `IsoGame/wcBuilding2/editor/loader.ts` | JSON config loader (core loading logic) |
| `IsoGame/wcBuilding2/editor/types.ts` | TypeScript interfaces |

### Client-Side
| File | Purpose |
|------|---------|
| `IsoGame/wcBuilding2/editor/web/js/api.ts` | API client (add load methods here) |
| `IsoGame/wcBuilding2/editor/web/js/state.ts` | State management |
| `IsoGame/wcBuilding2/editor/web/js/panels/library.ts` | Library sidebar (add JSON loading here) |
| `IsoGame/wcBuilding2/editor/web/js/panels/building.ts` | Building editor panel |
| `IsoGame/wcBuilding2/editor/web/js/panels/tile.ts` | Tile editor modal |
| `IsoGame/wcBuilding2/editor/web/js/panels/assetCollection.ts` | Asset collection editor |

### Components
| File | Purpose |
|------|---------|
| `IsoGame/wcBuilding2/editor/web/js/components/canvas2d.ts` | 2D preview canvas (add asset rendering here) |
| `IsoGame/wcBuilding2/editor/web/js/components/assetList.ts` | Asset list editor (add thumbnails here) |
| `IsoGame/wcBuilding2/editor/web/js/components/colorPicker.ts` | Color suffix picker |
| `IsoGame/wcBuilding2/editor/web/js/components/faceEditor.ts` | Face configuration widget |

### Services
| File | Purpose |
|------|---------|
| `IsoGame/wcBuilding2/editor/web/js/services/assetPreview.ts` | Asset image loading service |
| `IsoGame/wcBuilding2/editor/web/js/services/preview.ts` | Generation preview service |

---
