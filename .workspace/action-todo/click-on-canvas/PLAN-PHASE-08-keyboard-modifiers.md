# Phase 8: Keyboard Modifier Support

## Context

Different click actions should be triggered based on keyboard modifiers (Shift, Ctrl, Alt). This allows a single click to perform different operations depending on which modifier key is held. The cursor should also change to indicate the current action mode.

## Objective

Implement keyboard modifier tracking and map modifiers to different click actions with visual cursor feedback.

## Tasks

### Task 8.1: Create `ClickModifierHandler` class

- [ ] Create new file or integrate into `CanvasClickHandler`
- [ ] Track modifier state: `shift: boolean`, `ctrl: boolean`, `alt: boolean`
- [ ] Listen to `keydown` and `keyup` events on document
- [ ] Update modifier state on each key event

### Task 8.2: Implement action mapping

- [ ] Add `getClickAction(): string` method
- [ ] Map modifiers to action names:
  - No modifier: `"select"` (default action)
  - Shift: `"multiSelect"` (drag selection mode)
  - Ctrl/Cmd: `"info"` (show tile info)
  - Alt: `"teleport"` (teleport to tile)
- [ ] Return action name based on current modifier state

### Task 8.3: Implement cursor feedback

- [ ] Add `getCursor(): string` method returning CSS cursor value
- [ ] Map actions to cursors:
  - select: `"pointer"`
  - info: `"help"`
  - teleport: `"crosshair"`
  - multiSelect: `"cell"`
- [ ] Add `updateCursor()` method to apply cursor to canvas
- [ ] Call `updateCursor()` on modifier state change

### Task 8.4: Integrate with click handler

- [ ] In `CanvasClickHandler`, check modifier action before processing click
- [ ] Dispatch different behavior based on action:
  - select: standard tile click
  - info: query tile info only
  - teleport: send teleport command
  - multiSelect: activate drag selection (Phase 6)
- [ ] Include action type in click event data

## Files Modified

- `IsoGame/mapIso/clickModifierHandler.ts` (new file) or `IsoGame/mapIso/canvasClickHandler.ts`

## Dependencies

- Phase 2 complete (canvas click handler)

## Verification

1. Hold Ctrl and click a tile, verify info action is triggered
2. Hold Alt and click a tile, verify teleport action is triggered
3. Hold Shift and click, verify multi-select mode activates
4. Click without modifiers, verify default select action
5. Verify cursor changes when holding different modifier keys
6. Verify cursor returns to default when releasing modifier