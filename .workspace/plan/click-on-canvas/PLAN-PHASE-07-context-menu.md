# Phase 7: Right-Click Context Menu

## Context

Right-clicking on a tile should show a context menu with tile-specific actions. This provides quick access to common operations like viewing tile info, copying coordinates, or teleporting. The menu is a DOM element positioned at the click location.

## Objective

Implement a right-click context menu that appears on tile right-click with configurable actions.

## Tasks

### Task 7.1: Create `TileContextMenu` class

- [ ] Create new file `IsoGame/mapIso/tileContextMenu.ts`
- [ ] Create menu DOM element with dark semi-transparent styling
- [ ] Position menu as fixed, high z-index
- [ ] Store reference to canvas for coordinate conversion

### Task 7.2: Implement context menu trigger

- [ ] Handle `contextmenu` event on canvas
- [ ] Prevent default browser context menu
- [ ] Convert click position to tile coordinates
- [ ] Store `currentTile: PointIso | null`
- [ ] Show menu at click position

### Task 7.3: Implement menu display logic

- [ ] Add tile coordinates header showing `Tile: X, Y`
- [ ] Render action items as clickable divs
- [ ] Add hover highlight on menu items
- [ ] Position menu to stay within viewport bounds
- [ ] Flip position if menu would overflow right/bottom edge

### Task 7.4: Implement menu hide logic

- [ ] Hide menu on any click outside menu
- [ ] Hide menu on Escape key press
- [ ] Hide menu after action is executed

### Task 7.5: Implement action system

- [ ] Add `actions: Map<string, (tile: PointIso) => void>` storage
- [ ] Add `addAction(id, label, callback)` method for custom actions
- [ ] Register default actions: Show Info, Copy Coords, Teleport, Measure Distance
- [ ] Execute action callback with current tile when clicked

### Task 7.6: Add tile context integration

- [ ] Add `setTile(tile: PointIso | null)` method
- [ ] Allow external systems to update current tile (e.g., from hover callback)
- [ ] Add `destroy()` method for cleanup

## Files Modified

- `IsoGame/mapIso/tileContextMenu.ts` (new file)

## Dependencies

- Phase 2 complete (tile detection)

## Verification

1. Right-click on a tile and verify context menu appears
2. Verify menu shows correct tile coordinates
3. Click an action and verify callback is invoked
4. Click outside menu and verify it hides
5. Press Escape and verify menu hides
6. Verify menu stays within viewport when right-clicking near edges
7. Verify default browser context menu is suppressed on canvas