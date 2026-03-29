# Phase 10: Path Visualization

## Context

For movement planning and navigation, users need to visualize a path between tiles. The path is defined as a list of waypoint tiles connected by lines. This is useful for showing routes, movement plans, or connected structures.

## Objective

Implement path visualization that draws lines and waypoint markers connecting a sequence of tiles on the canvas.

## Tasks

### Task 10.1: Create `PathVisualizer` class

- [ ] Create new file `IsoGame/mapIso/pathVisualizer.ts`
- [ ] Create offscreen canvas for path overlay
- [ ] Store reference to main canvas and projector

### Task 10.2: Implement path drawing

- [ ] Add `drawPath(tiles: PointIso[], color?: string)` method
- [ ] Clear previous path overlay
- [ ] Convert each tile to screen coordinates using `translatePoint()`
- [ ] Draw line connecting all waypoints in sequence
- [ ] Use dashed line style for visual distinction
- [ ] Default color: green with alpha (e.g., `"rgba(0, 255, 0, 0.5)"`)

### Task 10.3: Implement waypoint markers

- [ ] Draw filled circle at each waypoint position
- [ ] Use same color as path line
- [ ] Radius: 5 pixels
- [ ] Draw markers on top of path line

### Task 10.4: Implement path management

- [ ] Add `clearPath()` method to remove current path
- [ ] Add `getPathOverlay(): OffscreenCanvas` method for compositing
- [ ] Support updating path without recreating overlay

### Task 10.5: Integrate with canvas rendering

- [ ] Composite path overlay onto main canvas after tile rendering
- [ ] Only draw path overlay when path is active
- [ ] Ensure path renders on top of tiles but below hover overlay

## Files Modified

- `IsoGame/mapIso/pathVisualizer.ts` (new file)
- `IsoGame/mapIso/canvasMapDrawer.ts` (composite path overlay)

## Dependencies

- Phase 1 complete (inverse projection)

## Verification

1. Draw a path with 3+ waypoints and verify lines connect them
2. Verify waypoint markers appear at each tile
3. Verify dashed line style is applied
4. Clear path and verify overlay is removed
5. Verify path renders correctly with different tile heights
6. Verify path is visible on top of tile rendering