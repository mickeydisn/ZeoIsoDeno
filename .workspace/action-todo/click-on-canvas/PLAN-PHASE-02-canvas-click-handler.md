# Phase 2: Canvas Click Handler

## Context

With the inverse projection math in place (Phase 1), we need a dedicated handler class that attaches to the canvas element and processes mouse events. This class will use the `IsometricProjector.screenToTileWithHeight()` method to convert click positions to tile coordinates, then communicate with the game worker via the existing message protocol.

## Objective

Create a new `CanvasClickHandler` class that handles click and mouse move events on the canvas, converts screen coordinates to tile coordinates, and sends appropriate messages to the game worker.

## Tasks

### Task 2.1: Create `canvasClickHandler.ts` file

- [x] Create new file `IsoGame/mapIso/canvasClickHandler.ts`
- [x] Define class `CanvasClickHandler` with required dependencies:
  - `canvas: HTMLCanvasElement`
  - `projector: IsometricProjector`
  - `mapLvl: Float32Array`
  - `mapInfo: Float32Array`
  - `mapSize: number`
  - `gameWorker: Worker`

### Task 2.2: Implement click event handling

- [x] Add `setupEventListeners()` method called from constructor
- [x] Attach `click` event listener to canvas
- [x] In click handler: get canvas bounding rect via `getBoundingClientRect()`
- [x] Compute scale factors: `scaleX = canvas.width / rect.width`, `scaleY = canvas.height / rect.height`
- [x] Convert click coordinates: `screenX = (event.clientX - rect.left) * scaleX`, `screenY = (event.clientY - rect.top) * scaleY`
- [x] Extract `centerX` and `centerY` from `mapInfo` buffer
- [x] Call `projector.screenToTileWithHeight()` with screen coordinates
- [x] If tile is valid, post `query_infoCell` message to game worker
- [x] If tile is valid, post `toolClick` message to game worker
- [x] Log detected tile coordinates for debugging

### Task 2.3: Implement mouse move event handling

- [x] Attach `mousemove` event listener to canvas
- [x] Track `lastHoveredTile: PointIso | null` state
- [x] On mouse move: convert coordinates same as click handler
- [x] Compare new tile with `lastHoveredTile` to detect changes
- [x] If tile changed, update `lastHoveredTile` and call hover callback
- [x] Attach `mouseleave` event listener to clear hover state

### Task 2.4: Implement hover callback system

- [x] Add `hoverCallback?: (tile: PointIso | null) => void` property
- [x] Add `setHoverCallback(callback)` method
- [x] Call callback only when tile changes (not on every mouse move)
- [x] Provide `hasTileChanged()` helper comparing two `PointIso` values

### Task 2.5: Implement data update methods

- [x] Add `updateMapData(mapLvl, mapInfo)` method to refresh shared buffer references
- [x] Add `destroy()` method to remove all event listeners
- [x] Ensure proper cleanup to prevent memory leaks

## Files Modified

- `IsoGame/mapIso/canvasClickHandler.ts` (new file)

## Dependencies

- Phase 1 must be complete (`IsometricProjector.screenToTileWithHeight` available)

## Verification

1. Instantiate `CanvasClickHandler` with a mock canvas and projector
2. Simulate click events and verify correct tile coordinates are computed
3. Verify game worker receives `query_infoCell` and `toolClick` messages with correct `gridX`/`gridY`
4. Verify hover callback fires only when tile changes