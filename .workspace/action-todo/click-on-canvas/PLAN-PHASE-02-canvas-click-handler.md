# Phase 2: Canvas Click Handler

## Context

With the inverse projection math in place (Phase 1), we need a dedicated handler class that attaches to the canvas element and processes mouse events. This class will use the `IsometricProjector.screenToTileWithHeight()` method to convert click positions to tile coordinates, then communicate with the game worker via the existing message protocol.

## Objective

Create a new `CanvasClickHandler` class that handles click and mouse move events on the canvas, converts screen coordinates to tile coordinates, and sends appropriate messages to the game worker.

## Tasks

### Task 2.1: Create `canvasClickHandler.ts` file

- [ ] Create new file `IsoGame/mapIso/canvasClickHandler.ts`
- [ ] Define class `CanvasClickHandler` with required dependencies:
  - `canvas: HTMLCanvasElement`
  - `projector: IsometricProjector`
  - `mapLvl: Float32Array`
  - `mapInfo: Float32Array`
  - `mapSize: number`
  - `gameWorker: Worker`

### Task 2.2: Implement click event handling

- [ ] Add `setupEventListeners()` method called from constructor
- [ ] Attach `click` event listener to canvas
- [ ] In click handler: get canvas bounding rect via `getBoundingClientRect()`
- [ ] Compute scale factors: `scaleX = canvas.width / rect.width`, `scaleY = canvas.height / rect.height`
- [ ] Convert click coordinates: `screenX = (event.clientX - rect.left) * scaleX`, `screenY = (event.clientY - rect.top) * scaleY`
- [ ] Extract `centerX` and `centerY` from `mapInfo` buffer
- [ ] Call `projector.screenToTileWithHeight()` with screen coordinates
- [ ] If tile is valid, post `query_infoCell` message to game worker
- [ ] If tile is valid, post `toolClick` message to game worker
- [ ] Log detected tile coordinates for debugging

### Task 2.3: Implement mouse move event handling

- [ ] Attach `mousemove` event listener to canvas
- [ ] Track `lastHoveredTile: PointIso | null` state
- [ ] On mouse move: convert coordinates same as click handler
- [ ] Compare new tile with `lastHoveredTile` to detect changes
- [ ] If tile changed, update `lastHoveredTile` and call hover callback
- [ ] Attach `mouseleave` event listener to clear hover state

### Task 2.4: Implement hover callback system

- [ ] Add `hoverCallback?: (tile: PointIso | null) => void` property
- [ ] Add `setHoverCallback(callback)` method
- [ ] Call callback only when tile changes (not on every mouse move)
- [ ] Provide `hasTileChanged()` helper comparing two `PointIso` values

### Task 2.5: Implement data update methods

- [ ] Add `updateMapData(mapLvl, mapInfo)` method to refresh shared buffer references
- [ ] Add `destroy()` method to remove all event listeners
- [ ] Ensure proper cleanup to prevent memory leaks

## Files Modified

- `IsoGame/mapIso/canvasClickHandler.ts` (new file)

## Dependencies

- Phase 1 must be complete (`IsometricProjector.screenToTileWithHeight` available)

## Verification

1. Instantiate `CanvasClickHandler` with a mock canvas and projector
2. Simulate click events and verify correct tile coordinates are computed
3. Verify game worker receives `query_infoCell` and `toolClick` messages with correct `gridX`/`gridY`
4. Verify hover callback fires only when tile changes