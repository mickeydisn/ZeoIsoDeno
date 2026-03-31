# ARD-REF-shared-buffer: Worker-Main Communication Protocol

## Purpose
Enable zero-copy hover state transfer between the Web Worker (mouse event processing) and the main thread (canvas rendering) using `SharedArrayBuffer`.

## Source Location
- `IsoGame/mapIso/canvasMapDrawer.ts` — buffer allocation and read
- `IsoGame/worker/game/GameWorker.ts` — hover state write

## Buffer Layout

The `mapInfo` `Float32Array` (10 slots = 40 bytes) is split into two logical regions:

### Camera & View (indices 0-3) — Pre-existing
| Index | Field | Type | Description |
|-------|-------|------|-------------|
| 0 | `centreX` | float | Camera center X in tile coordinates |
| 1 | `centreY` | float | Camera center Y in tile coordinates |
| 2 | `offX` | float | Panning offset X (sub-tile) |
| 3 | `offY` | float | Panning offset Y (sub-tile) |

### Hover State (indices 4-7) — New in this branch
| Index | Field | Type | Description |
|-------|-------|------|-------------|
| 4 | `hoverX` | float | Grid X coordinate of hovered tile (0..DRAW_TILE_COUNT-1) |
| 5 | `hoverY` | float | Grid Y coordinate of hovered tile |
| 6 | `hoverZ` | float | Display height of hovered tile |
| 7 | `hasHover` | float | Boolean flag: `1.0` = hover active, `0.0` = no hover |

### Terrain Info (index 8+) — Extended
| Index | Field | Type | Description |
|-------|-------|------|-------------|
| 8 | `avgLvl` | float | Average terrain level (used for relative height display) |
| 9 | _reserved_ | float | Unused (future extension) |

## Write Side (Worker)
In `GameWorker.ts`, each `mousemove` event:
```typescript
if (tile) {
    mapInfo[4] = tile.x;
    mapInfo[5] = tile.y;
    mapInfo[6] = tile.z;
    mapInfo[7] = 1;
} else {
    mapInfo[7] = 0;
}
```

## Read Side (Main Thread)
In `CanvasMapDrawers.drawUpdate()`:
```typescript
const hasHover = this.mapInfo[7] === 1;
if (hasHover) {
    this.hoveredTile = new PointIso(
        this.mapInfo[4],  // gridX
        this.mapInfo[5],  // gridY
        this.mapInfo[6],  // height
    );
} else {
    this.hoveredTile = null;
}
```

## Synchronization Considerations
- **Single writer, single reader**: Worker writes hover data; main thread reads during `drawUpdate()`.
- **No atomic operations needed**: Float32 writes are single-instruction on modern CPUs. The read may see stale data for one frame — acceptable for visual hover feedback.
- **Buffer size change**: Extended from 4 slots (16 bytes) to 10 slots (40 bytes) — a breaking change requiring both sides to agree.

## Why SharedArrayBuffer?
- Zero message-passing overhead (no `postMessage` serialization)
- Immediate visibility on the main thread without waiting for worker response
- Maintains the existing architecture pattern already used for `mapLvl` and camera data