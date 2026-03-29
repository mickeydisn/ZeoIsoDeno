# Phase 12: Performance Optimizations

## Context

For large maps, click detection and hover rendering need to be optimized to maintain smooth performance. A spatial index can speed up tile lookups, and hover rendering should avoid full canvas redraws. These optimizations ensure the system scales to large maps without performance degradation.

## Objective

Optimize click detection and hover rendering performance for large maps using spatial indexing and selective rendering.

## Tasks

### Task 12.1: Create `ClickDetectionOptimizer` class

- [ ] Create new file or integrate into existing system
- [ ] Implement spatial index using a grid-based approach
- [ ] Divide map into cells of configurable size (e.g., 10x10 tiles)
- [ ] Store tiles in `Map<string, PointIso[]>` keyed by cell coordinates

### Task 12.2: Implement spatial index building

- [ ] Add `buildIndex(tiles: PointIso[])` method
- [ ] Clear existing index
- [ ] For each tile, compute cell key: `${Math.floor(x/cellSize)}:${Math.floor(y/cellSize)}`
- [ ] Add tile to appropriate cell's array

### Task 12.3: Implement candidate lookup

- [ ] Add `getCandidates(screenX, screenY, radius?: number): PointIso[]` method
- [ ] Compute center cell from screen coordinates
- [ ] Return all tiles in cells within radius (default 2)
- [ ] This reduces search space from all tiles to nearby tiles only

### Task 12.4: Implement index update

- [ ] Add `updateTile(tile: PointIso)` method
- [ ] Remove tile from old cell
- [ ] Add tile to new cell
- [ ] Handle cell becoming empty (delete from map)

### Task 12.5: Optimize hover rendering

- [ ] Avoid full canvas redraw on hover change
- [ ] Use separate offscreen canvas for hover overlay
- [ ] Only redraw hover overlay when `hoveredTile` changes
- [ ] Composite hover overlay onto main canvas efficiently

### Task 12.6: Optimize tile cache cleanup

- [ ] Use spatial index to identify tiles to evict
- [ ] Only check tiles in cells far from current view
- [ ] Batch cache deletions for efficiency

## Files Modified

- `IsoGame/mapIso/clickDetectionOptimizer.ts` (new file)
- `IsoGame/mapIso/canvasMapDrawer.ts` (hover rendering optimization)

## Dependencies

- Phase 4 complete (hover rendering)

## Verification

1. Test with large map (100x100+) and verify click detection remains fast
2. Verify hover updates smoothly without frame drops
3. Profile click detection with and without spatial index
4. Verify cache cleanup doesn't cause frame hitches
5. Test with rapid mouse movement over many tiles