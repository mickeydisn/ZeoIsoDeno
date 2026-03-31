# ARD-REF-rhombus-test: Point-in-Tile-Face Rhombus Test

## Purpose
Determine whether a screen point `(screenX, screenY)` falls within the projected top face (rhombus/diamond shape) of a tile, including its visible side walls.

## Source Location
`IsoGame/mapIso/simpleIso/IsometricProjector.ts` — method `_isPointInTileFace()`

## Algorithm: Normalized Coordinate Test

### Step 1: Project Diamond Corners
```typescript
top    = translatePoint(tx,     ty,     z)   // closest point (top vertex)
right  = translatePoint(tx + 1, ty,     z)   // right vertex
bottom = translatePoint(tx + 1, ty + 1, z)   // farthest point (bottom vertex)
left   = translatePoint(tx,     ty + 1, z)   // left vertex
```

### Step 2: Compute Center and Half-Extents
```typescript
cx     = (top.x + bottom.x) / 2     // diamond center X
cy     = (topY + botY) / 2          // diamond center Y
halfW  = (right.x - left.x) / 2     // half-width (horizontal extent)
halfH  = (botY - topY) / 2          // half-height (vertical extent)
```

### Step 3: Normalize to Diamond-Local Coordinates
```typescript
u = (screenX - cx) / halfW    // -1..+1 horizontally
v = (screenY - cy) / halfH    // -1..+1 vertically
```

### Step 4: Top Face Test
```typescript
|u| + |v| <= 1.0    // inside rhombus
```
This is the standard diamond/rhombus inclusion test in normalized coordinates.

### Step 5: Side Wall Extension
```typescript
|u| <= 1.0 && v > 1.0 && v <= 2.0    // below top face, within one wall-height
```
Allows clicking on the visible side walls of raised tiles. The wall extends one `halfH` unit below the top face bottom edge.

## Why This Works
In normalized (u, v) space, the rhombus becomes a unit diamond centered at origin with vertices at (0, ±1) and (±1, 0). The L1 norm `|u| + |v| <= 1` defines the interior of this diamond exactly.

## Edge Cases Handled
- Clicking on the visible "cliff face" of elevated tiles
- Tiles with zero height (flat terrain): wall test still works gracefully
- Degenerate tiles (halfW <= 0 or halfH <= 0): implicitly rejected

## Visual Reference
```
        (0, -1)  top
           /\
          /  \
 (-1, 0) <----> (1, 0)   ← side walls
          \  /
           \/
        (0, 1)  bottom
```
The wall extension allows points with `v` slightly > 1 (below the bottom vertex) to be accepted if they fall within the horizontal bounds.