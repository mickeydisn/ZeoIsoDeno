# Phase 4b: Height-Aware Overlay Fix

## Context

After implementing hover visual feedback (Phase 4), a bug was discovered where the overlay did not properly account for tile heights (levels). In isometric 3D view, tiles with higher levels appear visually "in front of" lower tiles. The initial implementation only checked the approximate tile position at Z=0, causing the overlay to appear on incorrect tiles when heights varied.

## Problem

When hovering over a tile with significant height, the overlay would appear on a neighboring tile because:
1. The inverse projection assumed Z=0 for initial tile detection
2. Higher tiles shift their visual position upward on screen
3. The mouse position at screen coordinates might actually be over a taller adjacent tile

## Solution Implemented

### Fix: Multi-tile Height Search (Current Implementation)

Modified `screenToTileWithHeight()` in `IsoGame/mapIso/simpleIso/IsometricProjector.ts`:

1. **First pass**: Get approximate tile position assuming Z=0
2. **3x3 grid search**: Check the approximate tile and its 8 neighbors
3. **Screen projection**: For each candidate tile, project its top surface using actual height from `mapLvl` buffer
4. **Distance comparison**: Select the tile whose projected top surface is closest to the mouse position
5. **Return**: The tile with correct height that best matches the mouse

```typescript
// Check a 3x3 grid around the approximate position
for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
        const checkX = tileX + dx;
        const checkY = tileY + dy;
        
        // Look up tile height and project to screen
        const tileHeight = mapLvl[checkX * mapSize + checkY];
        const tileScreen = this.tileToScreen(checkX, checkY, tileHeight);
        
        // Calculate distance from mouse to this tile's screen position
        const distance = Math.sqrt(
            Math.pow(screenX - tileScreen.x, 2) + 
            Math.pow(screenY - tileScreen.y, 2)
        );
        
        // Track closest tile
        if (distance < bestDistance) {
            bestDistance = distance;
            bestTile = new PointIso(checkX, checkY, tileHeight);
        }
    }
}
```

## Tasks Completed

- [x] Updated `screenToTileWithHeight()` to check neighboring tiles
- [x] Implemented distance-based tile selection accounting for height
- [x] Maintained fallback to approximate tile if no neighbors found

## Known Limitations of Current Solution

1. **3x3 grid is arbitrary**: May miss tiles further away that could be visually closer
2. **Does not use average height**: The `mapLvl` buffer contains heights but average height isn't leveraged
3. **Diagonal nature ignored**: In isometric view, tiles are arranged diagonally; the search pattern is rectangular
4. **Performance**: Checking 9 tiles per mouse move may be inefficient for large grids

## Proposed Better Solution

### Option A: Diagonal-Aware Search

In isometric projection, tiles form diagonal lines. The search should follow this pattern:

```typescript
// Isometric diagonal neighbors (NE, NW, SE, SW)
const diagonalOffsets = [
    { dx: 0, dy: 0 },   // Current tile
    { dx: 1, dy: 0 },   // East
    { dx: 0, dy: 1 },   // South  
    { dx: -1, dy: 0 },  // West
    { dx: 0, dy: -1 },  // North
    { dx: 1, dy: 1 },   // SE diagonal
    { dx: -1, dy: -1 }, // NW diagonal
    { dx: 1, dy: -1 },  // NE diagonal
    { dx: -1, dy: 1 },  // SW diagonal
];

// Priority: check tiles along the isometric axes first
// The visual "depth" in iso is determined by (x + y)
// Tiles with higher (x + y) appear in front
```

### Option B: Height-Relative Projection

Use average grid height to normalize the search:

```typescript
// Calculate average height of visible tiles
const avgHeight = mapLvl.reduce((a, b) => a + b, 0) / mapLvl.length;

// Adjust mouse Y position relative to average height
// Higher tiles shift up, lower tiles shift down
const heightAdjustment = (tileHeight - avgHeight) * ISO_LVL_SCALE;
const adjustedScreenY = screenY + heightAdjustment;

// Then use adjusted position for inverse projection
```

### Option C: Ray Casting (Most Accurate)

Cast a ray from the mouse position through the isometric scene:

1. Convert mouse to world-space ray
2. Intersect ray with each tile's top surface plane
3. Select the tile with the closest intersection point

```typescript
// For each tile, calculate its top surface plane
// Plane equation: z = tileHeight (constant)
// Ray: from camera through mouse position
// Find intersection and select closest tile
```

### Option D: Depth-Sorted Search

Sort tiles by their visual depth (x + y - 2*z) and search front-to-back:

```typescript
// Visual depth = x + y - 2 * z
// Tiles with higher depth appear in front
// Search from front to back, return first tile that contains mouse
```

## Tasks for Better Solution

- [ ] Implement diagonal-aware neighbor search (Option A)
- [ ] Add average height calculation to `mapInfo` buffer
- [ ] Use average height to normalize mouse position (Option B)
- [ ] Consider ray casting for pixel-perfect accuracy (Option C)
- [ ] Benchmark different approaches for performance
- [ ] Add unit tests for height edge cases
- [ ] Test with extreme height differences (e.g., cliffs, towers)

## Files Modified

- `IsoGame/mapIso/simpleIso/IsometricProjector.ts` - Updated `screenToTileWithHeight()`

## Dependencies

- Phase 4 complete (hover overlay rendering)
- `mapLvl` buffer properly populated with tile heights

## Verification

1. Create test tiles with varying heights (0, 1, 2, 3+ levels)
2. Hover over low tiles adjacent to high tiles
3. Verify overlay appears on correct tile (not shifted by height)
4. Test at tile boundaries where heights differ
5. Verify no flickering when moving mouse across height boundaries
6. Performance test with rapid mouse movement