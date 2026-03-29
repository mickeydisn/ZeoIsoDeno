# Phase 4: Hover and Visual Feedback

## Context

With click detection working via the canvas (Phase 3), we enhance the user experience by adding visual feedback when hovering over tiles. Currently there is no hover indication. We will render a semi-transparent highlight overlay on the hovered tile directly on the canvas, and optionally show a coordinate tooltip.

## Objective

Add hover highlighting rendered on the canvas and an optional coordinate tooltip to provide immediate visual feedback when the user moves the mouse over tiles.

## Tasks

### Task 4.1: Add hover state to `CanvasMapDrawers`

- [x] Add `hoveredTile: PointIso | null` property to `CanvasMapDrawers`
- [x] Add `setHoveredTile(tile: PointIso | null)` method
- [x] Store the hovered tile for use during rendering

### Task 4.2: Implement hover overlay rendering in `CanvasMapDrawers`

- [ ] Add `drawHoverOverlay()` private method
- [ ] If `hoveredTile` is null, skip rendering
- [ ] Convert hovered tile to display coordinates using `isoProject.translatePoint()`
- [ ] Draw a semi-transparent colored overlay on the hovered tile
- [ ] Use `Shape.SurfaceFlat()` with a highlight color (e.g., yellow with alpha 0.3)
- [ ] Call `drawHoverOverlay()` at the end of `drawIso()` method

### Task 4.3: Connect hover callback to canvas renderer

- [ ] In `GridMapDrawers` (or integration point), set up hover callback
- [ ] When `CanvasClickHandler` fires hover callback with a tile:
  - Call `canvasMapDrawers.setHoveredTile(tile)` if accessible
  - Or use a shared state mechanism (e.g., `SharedArrayBuffer` for tile coordinates)
- [ ] When hover callback fires with `null`, clear the hovered tile

### Task 4.4: Create coordinate tooltip (optional)

- [ ] Create `CoordinateTooltip` class or integrate into existing UI
- [ ] Create a fixed-position DOM element for the tooltip
- [ ] On hover, update tooltip text with `X: {x}  Y: {y}  Z: {z}`
- [ ] Position tooltip near the mouse cursor (offset by 15px)
- [ ] Hide tooltip when mouse leaves the canvas

### Task 4.5: Optimize hover rendering performance

- [ ] Only redraw hover overlay when `hoveredTile` changes
- [ ] Consider using a separate offscreen canvas for hover layer
- [ ] Composite hover layer onto main canvas only when needed
- [ ] Avoid full canvas redraw on every hover change if possible

## Files Modified

- `IsoGame/mapIso/canvasMapDrawer.ts` - Add hover rendering
- `IsoGame/mapIso/grid.ts` - Connect hover callback (or integration file)

## Dependencies

- Phase 2 complete (hover callback system in `CanvasClickHandler`)
- Phase 3 complete (integration working)

## Verification

1. Move mouse over the isometric canvas
2. Verify a semi-transparent highlight appears on the hovered tile
3. Verify the highlight follows the mouse smoothly
4. Verify the highlight disappears when mouse leaves the canvas
5. Verify coordinate tooltip shows correct tile coordinates
6. Verify no performance degradation during hover rendering