# Phase 3: Integration and Grid Replacement

## Context

With the inverse projection (Phase 1) and click handler (Phase 2) ready, we now integrate the new system into the existing architecture. The current `GridMapDrawers` class in `grid.ts` creates a 40x40 div grid with CSS transforms. We need to replace this with the canvas-based click handler while preserving the same game worker communication interface.

## Objective

Replace the DOM-based grid system with the new `CanvasClickHandler`, update the main game loop initialization, and ensure backward compatibility with the existing worker message protocol.

## Tasks

### Task 3.1: Simplify `GridMapDrawers` class

- [x] Refactor `GridMapDrawers` to become a thin wrapper around `CanvasClickHandler`
- [x] Remove `_init_grid_contener()` method (no longer need DOM grid container)
- [x] Remove `_init_gridMatrix()` method (no longer need div grid cells)
- [x] Remove `_mapGrid` array (no longer need div references)
- [x] Keep constructor signature compatible with existing usage in `main.ts`
- [x] Instantiate `CanvasClickHandler` internally using passed parameters
- [x] Delegate `updateGrid()` to `CanvasClickHandler.updateMapData()` (no DOM updates needed)
- [x] Add `setHoverCallback()` pass-through method

### Task 3.2: Update `web/js/main.ts` initialization

- [x] Modify `callback_initCanvasMap` to pass canvas reference to `GridMapDrawers`
- [x] The canvas reference is needed for `CanvasClickHandler` event attachment
- [x] Since canvas is transferred to offscreen in worker, we need an alternative approach:
  - Option A: Attach click handler to the original canvas element before transfer
  - Option B: Use a separate transparent overlay canvas for click detection
  - Option C: Keep the original canvas element reference for event attachment (recommended)
- [x] Update `GridMapDrawers` constructor to accept the original canvas element
- [x] Ensure `gridMapDrawer.updateGrid()` call in `frameTick()` still works

### Task 3.3: Handle canvas transfer to offscreen

- [x] Problem: `canvasImageMap.transferControlToOffscreen()` makes the original canvas unavailable for event listeners
- [x] Solution: Attach event listeners to the original canvas element BEFORE transferring control
- [x] Or: Create a wrapper div around the canvas and attach events to that
- [x] Verify that click events still fire correctly after offscreen transfer
- [x] If events don't fire, fall back to wrapper div approach

### Task 3.4: Preserve game worker message protocol

- [x] Ensure `query_infoCell` message format is identical: `{ action: "query_infoCell", gridX: number, gridY: number }`
- [x] Ensure `toolClick` message format is identical: `{ action: "toolClick", gridX: number, gridY: number }`
- [x] Verify coordinate system matches: `gridX = mod * (-i + gridSize/2)`, `gridY = mod * (-j + gridSize/2)`
- [x] Map the inverse projection output to the expected coordinate space

### Task 3.5: Remove dead code from `grid.ts`

- [x] Remove `MAP_WIDTH`, `MAP_HEIGHT`, `globalScale` constants (no longer used for DOM sizing)
- [x] Remove `divTableGrid` property
- [x] Remove `_heightScall` property (height adjustment now handled mathematically)
- [x] Clean up any remaining DOM manipulation code

## Files Modified

- `IsoGame/mapIso/grid.ts` - Simplify to wrapper
- `web/js/main.ts` - Update initialization

## Dependencies

- Phase 1 complete (inverse projection)
- Phase 2 complete (canvas click handler)

## Verification

1. Start the application and verify canvas renders correctly
2. Click on tiles and verify `query_infoCell` and `toolClick` messages are sent
3. Verify tile coordinates match the visual position on the isometric map
4. Verify no DOM grid elements are created
5. Verify hover callback system works (if implemented in Phase 2)