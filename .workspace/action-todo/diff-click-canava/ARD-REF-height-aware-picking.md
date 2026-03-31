# ARD-REF-height-aware-picking: Height-Aware Tile Picking

## Purpose
Correctly identify which tile is under the mouse cursor when tiles have varying heights (terrain elevation).

## Source Location
`IsoGame/mapIso/simpleIso/IsometricProjector.ts` — method `screenToTileWithHeight()`

## Problem Statement
The basic `screenToTile()` assumes a flat Z=0 plane. In an isometric terrain with varying heights, a tile at `(tx, ty, z=5)` renders higher on screen than `(tx, ty, z=0)`. A naive flat inverse projection will pick the wrong tile when clicking on elevated terrain.

## Algorithm: Candidate Sort + Front-to-Back Hit Testing

### Phase 1: Candidate Generation & X-Filtering
```
for each tile (tx, ty) in mapSize × mapSize:
    z = mapLvl[tx * mapSize + ty]          // read actual height
    cx = originX + sx * ((tx - offsetX) - (ty - offsetY))  // projected center X
    if |screenX - cx| <= sx:               // tile's diamond spans ±sx in X
        add (tx, ty, z) to candidates
```
This efficiently prunes tiles whose X projection cannot possibly contain the mouse.

### Phase 2: Depth Sort (Painter's Algorithm Inverse)
```
depth(tile) = tx + ty - 2 * tz * ratio
ratio = ISO_LVL_SCALE / SCALE_MOD / (2 * 16 * SCALE_SIZE)
```
Sort candidates **front-to-back** (highest depth first → `db - da`). The tile rendered last (visually on top) should be tested first.

### Phase 3: Point-in-Face Test
```
for each candidate (front to back):
    if _isPointInTileFace(candidate, screenX, screenY):
        return candidate    // first hit = topmost visible tile
return null
```

## Key Design Decisions
1. **Depth sort direction**: `db - da` ensures front-most tiles are tested first, matching the painter's algorithm render order.
2. **X pre-filter**: Only checks `|screenX - cx| <= sx` rather than full diamond containment, trading a few extra candidates for O(1) per-tile filtering.
3. **Height from `mapLvl`**: Reads actual terrain data, not assumed Z=0.

## Complexity
- Candidate generation: O(mapSize²) worst case, but X-filtering typically eliminates ~75% of tiles.
- Sort: O(n log n) where n = candidates after filtering.
- Hit testing: O(n) average (early exit on first match).

## Alternative: screenToTileWithHeight2 (Experimental)
An alternative approach using top-edge Y interpolation (`_getTileTopScreenYAtX()`) is partially implemented but not currently used in production. It tests `screenY >= topY` instead of the full rhombus test.