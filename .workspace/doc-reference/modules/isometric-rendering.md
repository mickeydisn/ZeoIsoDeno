# Isometric Rendering

> Files: `IsoGame/mapIso/canvasMapDrawer.ts`, `IsoGame/mapIso/grid.ts`, `IsoGame/mapIso/asset/`

## Purpose

Renders the isometric tile map onto an OffscreenCanvas and manages the DOM grid overlay for tile interaction.

## CanvasMapDrawers

```ts
class CanvasMapDrawers {
  world: World
  conf: CanvasMapDrawersConf
  assetLoader: AssetLoaderOpti
  canvas: OffscreenCanvas
  bufferMapLvl: Float32Array
  bufferMapInfo: Float32Array
}
```

### Configuration

```ts
interface CanvasMapDrawersConf {
  DRAW_TILE_COUNT: number  // Tiles visible (default: 40)
  SCALE_SIZE: number       // Base scale (default: 1)
  SCALE_MOD: number        // Scale modifier (default: 1)
}
```

### Shared Buffers

- `bufferMapLvl` — `Float32Array` of tile elevation levels for grid height mapping
- `bufferMapInfo` — `Float32Array` of tile metadata for info queries

These are transferred to the main thread via `SharedArrayBuffer` for efficient grid updates.

### `drawUpdate(x, y, subX, subY)`

Main render method called each frame:
1. Clears canvas
2. Iterates visible tiles at current camera position
3. Renders each tile as an isometric diamond using loaded assets
4. Applies elevation offset for 3D effect

## AssetLoaderOpti

Manages sprite assets for tile rendering:

```ts
class AssetLoaderOpti {
  static create(): Promise<AssetLoaderOpti>
  getAsset(name: string): ImageBitmap
}
```

Loads optimized PNG sprites from `img/asset_opti/` directory. Assets include terrain tiles, buildings, trees, rocks, and other items.

## GridMapDrawers

```ts
class GridMapDrawers {
  gameWorker: Worker
  bufferMapLvl: Float32Array
  bufferMapInfo: Float32Array
  mod: number
}
```

### `updateGrid()`

Called from the main thread render loop. Reads shared `bufferMapLvl` and updates CSS 3D transforms on grid cells to match terrain elevation. Creates the visual tile hover effect.

## Isometric Transform

The HTML grid uses CSS 3D transforms:

```css
transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
transform-style: preserve-3d;
```

This creates the classic isometric projection view.