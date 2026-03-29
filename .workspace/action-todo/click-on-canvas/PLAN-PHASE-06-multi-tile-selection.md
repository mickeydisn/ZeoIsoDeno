# Phase 6: Multi-Tile Drag Selection

## Context

For batch operations on multiple tiles, users need a way to select a rectangular area of tiles by dragging. This feature requires Shift key activation to distinguish from normal click behavior. The selection is computed in tile space and rendered as an overlay on the canvas.

## Objective

Implement drag-to-select functionality that allows users to select multiple tiles by holding Shift and dragging across the canvas.

## Tasks

### Task 6.1: Create `MultiTileSelector` class

- [ ] Create new file or integrate into `CanvasClickHandler`
- [ ] Track state: `isDragging`, `dragStart: PointIso | null`, `dragEnd: PointIso | null`
- [ ] Track `selectedTiles: Set<string>` using `"x:y"` key format
- [ ] Add `selectionCallback?: (tiles: PointIso[]) => void`

### Task 6.2: Implement drag start detection

- [ ] Handle `mousedown` event on canvas
- [ ] Only activate when Shift key is held (`event.shiftKey`)
- [ ] Convert mouse position to tile coordinates using inverse projection
- [ ] Set `isDragging = true`, store `dragStart` tile
- [ ] Clear any previous selection

### Task 6.3: Implement drag update

- [ ] Handle `mousemove` event while `isDragging` is true
- [ ] Convert mouse position to tile coordinates
- [ ] Update `dragEnd` tile
- [ ] Compute rectangular selection: all tiles between `dragStart` and `dragEnd`
- [ ] Update `selectedTiles` set with all tiles in rectangle

### Task 6.4: Implement drag end

- [ ] Handle `mouseup` event to end drag
- [ ] Call `selectionCallback` with array of selected tiles
- [ ] Set `isDragging = false`

### Task 6.5: Implement selection rendering

- [ ] Add method to draw selection rectangle overlay on canvas
- [ ] Highlight all selected tiles with distinct color (e.g., blue with alpha)
- [ ] Draw dashed rectangle border during active drag
- [ ] Clear overlay when selection is cleared

### Task 6.6: Add selection management methods

- [ ] `getSelectedTiles(): PointIso[]` - return current selection
- [ ] `clearSelection()` - clear all selected tiles
- [ ] `setSelectionCallback(callback)` - register selection callback

## Files Modified

- `IsoGame/mapIso/canvasClickHandler.ts` (or new file)

## Dependencies

- Phase 2 complete (canvas click handler)

## Verification

1. Hold Shift and drag across tiles to select an area
2. Verify all tiles in the rectangular area are selected
3. Verify selection callback fires with correct tile list
4. Verify selection overlay renders during drag
5. Verify selection clears when starting a new drag
6. Verify normal click (without Shift) still works for single tile