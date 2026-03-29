# Phase 1: Inverse Projection Module

## Context

This phase adds the core mathematical capability to convert screen coordinates back to tile coordinates. The `IsometricProjector` class currently only supports forward projection (3D tile to 2D screen). We need to add the inverse operation to enable click-to-tile detection.

The forward projection formula is:
```
screen_x = originX + (tile_x * 32 * SCALE_SIZE) + (tile_y * -32 * SCALE_SIZE)
screen_y = originY - (tile_x * 16 * SCALE_SIZE) - (tile_y * 16 * SCALE_SIZE) - (tile_z * ISO_LVL_SCALE / SCALE_MOD)
```

We solve this system of equations to derive the inverse formula.

## Objective

Extend `IsometricProjector` with `screenToTile()` and `screenToTileWithHeight()` methods that accurately convert 2D screen coordinates to 3D tile coordinates.

## Tasks

### Task 1.1: Add `screenToTile` method to `IsometricProjector`

- [x] Add method signature `screenToTile(screenX: number, screenY: number, tileZ: number = 0): PointIso | null`
- [x] Implement offset adjustment: subtract `originX` from screenX, subtract screenY from `originY`
- [x] Account for Z offset: subtract `tileZ * ISO_LVL_SCALE / SCALE_MOD` from adjusted Y
- [x] Solve the linear system: `tileX = (dx + dy) / (2 * scale_x) + offsetX`, `tileY = (dy - dx) / (2 * scale_x) + offsetY`
- [x] Return `PointIso` with computed tile coordinates
- [x] Export `ISO_LVL_SCALE` constant if not already exported (needed by callers)

### Task 1.2: Add `screenToTileWithHeight` method to `IsometricProjector`

- [x] Add method signature accepting `mapLvl: Float32Array`, `mapSize: number`, `centerX: number`, `centerY: number`
- [x] First pass: call `screenToTile` with `tileZ = 0` to get approximate tile position
- [x] Round to nearest integer tile coordinates
- [x] Validate bounds: check `tileX >= 0 && tileX < mapSize && tileY >= 0 && tileY < mapSize`
- [x] Look up actual height from `mapLvl` array using index `tileX * mapSize + tileY`
- [x] Second pass: call `screenToTile` again with the correct height for precise coordinates
- [x] Return final `PointIso` or `null` if out of bounds

### Task 1.3: Add `tileToScreen` helper method (optional but useful)

- [x] Add method that wraps `translatePoint` for clarity
- [x] Returns screen coordinates `{ x: number, y: number }` for a given tile
- [x] Useful for hover rendering and edge detection features

### Task 1.4: Unit validation of inverse projection

- [x] Verify that `screenToTile(translatePoint(tile))` returns the original tile coordinates
- [x] Test with various `SCALE_SIZE` values (0.5, 1, 2)
- [x] Test with various `tileZ` values (0, 1, 5)
- [x] Test with different `originX`/`originY` configurations

## Files Modified

- `IsoGame/mapIso/simpleIso/IsometricProjector.ts`

## Dependencies

None - this is the foundational phase.

## Verification

After implementation, verify inverse projection accuracy:
1. Create a test tile at known coordinates (e.g., x=20, y=20, z=0)
2. Call `translatePoint()` to get screen coordinates
3. Call `screenToTile()` with those screen coordinates
4. Confirm the returned tile matches the original