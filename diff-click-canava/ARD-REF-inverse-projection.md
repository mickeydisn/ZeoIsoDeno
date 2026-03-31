# ARD-REF-inverse-projection: Inverse Projection Algorithm

## Purpose
Convert 2D screen coordinates back to 3D tile coordinates, reversing the isometric projection.

## Source Location
`IsoGame/mapIso/simpleIso/IsometricProjector.ts` — method `screenToTile()`

## Forward Projection Formula
```typescript
// In translatePoint():
const sx = 32 * SCALE_SIZE;   // horizontal tile width in pixels
const sy = 16 * SCALE_SIZE;   // half-width (used for vertical)

screenX = originX + (tx - ty) * sx
screenY = originY - (tx + ty) * sy - tz * ISO_LVL_SCALE / SCALE_MOD
```

## Inverse Derivation
Given `screenX`, `screenY`, and known `tileZ`:

1. **Adjust for origin**:
   - `dx = screenX - originX`
   - `dy = originY - screenY - (tileZ * ISO_LVL_SCALE / SCALE_MOD)`

2. **Solve the system** (2 equations, 2 unknowns):
   - `dx = (tx - ty) * sx`  →  `tx - ty = dx / sx`
   - `dy = (tx + ty) * sy`  →  `tx + ty = dy / sy`

3. **Combine**:
   - `tx_raw = (dx/sx + dy/sy) / 2`
   - `ty_raw = (dy/sy - dx/sx) / 2`

4. **Apply panning offset and floor**:
   - `tx = floor(tx_raw + offsetX)`
   - `ty = floor(ty_raw + offsetY)`

## Limitations
- Assumes a flat Z plane (known `tileZ`). Does not account for varying terrain heights.
- Returns fractional tile coordinates; caller must round or floor as needed.
- No bounds checking — may return negative or out-of-map coordinates.

## Usage
- Quick estimation for hover diagonal lines
- Initial guess for `screenToTileWithHeight` (unused in current implementation)
- Computing NE-SW diagonal coordinates via `getNESWDiagonalCoords()`

## Code Snippet
```typescript
screenToTile(screenX: number, screenY: number, tileZ: number = 0): PointIso | null {
    const { originX, originY, offsetX, offsetY, SCALE_SIZE, SCALE_MOD } = this.conf;
    const sx = 32 * SCALE_SIZE;
    const sy = 16 * SCALE_SIZE;
    const adjustedDx = screenX - originX;
    const adjustedDy = originY - screenY - (tileZ * ISO_LVL_SCALE / SCALE_MOD);
    const tileXRaw = (adjustedDx / sx + adjustedDy / sy) / 2;
    const tileYRaw = (adjustedDy / sy - adjustedDx / sx) / 2;
    const tileX = Math.floor(tileXRaw + offsetX);
    const tileY = Math.floor(tileYRaw + offsetY);
    return new PointIso(tileX, tileY, tileZ);
}