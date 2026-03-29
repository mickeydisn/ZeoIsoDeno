# Phase 5: Edge Detection

## Context

With click-to-tile detection working, we can enhance precision by detecting when a click is near a tile edge. This is useful for placing walls, fences, or other edge-aligned structures. The system calculates the distance from the click point to each of the four tile edges and returns edge information when within threshold.

## Objective

Add edge detection capability to the tile click system, allowing tools to know if a click was on a tile edge and which edge was targeted.

## Tasks

### Task 5.1: Add edge detection to `IsometricProjector`

- [ ] Add `getTileCorners(tile: PointIso): PointIso[]` method
- [ ] Compute the four corner screen positions of a tile using `translatePoint()`
- [ ] Define four edges: NE, NW, SE, SW connecting the corners
- [ ] Return array of four corner points in screen space

### Task 5.2: Implement distance to line segment calculation

- [ ] Add `distanceToLineSegment(px, py, x1, y1, x2, y2): number` private method
- [ ] Use vector projection to find closest point on line segment
- [ ] Handle edge cases where closest point is at segment endpoints
- [ ] Return Euclidean distance from click point to closest point

### Task 5.3: Implement `detectEdge` method

- [ ] Add `detectEdge(screenX, screenY, tile: PointIso): { edge: string | null, position: number }` method
- [ ] Get tile corners in screen space
- [ ] Check distance to each of the four edges
- [ ] If distance < threshold (e.g., 10 pixels), return edge name and normalized position (0-1)
- [ ] If no edge within threshold, return `{ edge: null, position: 0 }`

### Task 5.4: Expose edge info through `CanvasClickHandler`

- [ ] Add edge detection call in click handler after tile detection
- [ ] Include edge info in click event data
- [ ] Allow tools to access edge information for placement decisions

## Files Modified

- `IsoGame/mapIso/simpleIso/IsometricProjector.ts`
- `IsoGame/mapIso/canvasClickHandler.ts`

## Dependencies

- Phase 1 complete (inverse projection)
- Phase 2 complete (canvas click handler)

## Verification

1. Click near the NE edge of a tile and verify edge "NE" is returned
2. Click in the center of a tile and verify edge is null
3. Verify position value is between 0 and 1 when edge detected
4. Test all four edges (NE, NW, SE, SW)