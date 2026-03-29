# Phase 11: Tile History (Undo/Redo)

## Context

When users modify tiles through tools, they need the ability to undo and redo changes. The history system records tile state changes (previous state and new state) and allows reverting or reapplying changes. This is essential for a good editing experience.

## Objective

Implement an undo/redo system that tracks tile modifications and allows reverting or reapplying changes.

## Tasks

### Task 11.1: Create `TileHistory` class

- [ ] Create new file `IsoGame/mapIso/tileHistory.ts`
- [ ] Define history entry type: `{ tile: PointIso, previousState: {...}, newState: {...}, timestamp: number }`
- [ ] Track `history: Array<HistoryEntry>` and `currentIndex: number`
- [ ] Set default `maxHistory: number = 100`

### Task 11.2: Implement change recording

- [ ] Add `recordChange(tile, previousState, newState)` method
- [ ] When recording, truncate any redo history (entries after currentIndex)
- [ ] Add new entry to history array
- [ ] Increment currentIndex
- [ ] If history exceeds maxHistory, remove oldest entry

### Task 11.3: Implement undo

- [ ] Add `undo(): { tile: PointIso, state: {...} } | null` method
- [ ] If currentIndex < 0, return null (nothing to undo)
- [ ] Get entry at currentIndex
- [ ] Decrement currentIndex
- [ ] Return tile and previousState for restoration

### Task 11.4: Implement redo

- [ ] Add `redo(): { tile: PointIso, state: {...} } | null` method
- [ ] If currentIndex >= history.length - 1, return null (nothing to redo)
- [ ] Increment currentIndex
- [ ] Get entry at currentIndex
- [ ] Return tile and newState for restoration

### Task 11.5: Implement history query methods

- [ ] Add `canUndo(): boolean` - return currentIndex >= 0
- [ ] Add `canRedo(): boolean` - return currentIndex < history.length - 1
- [ ] Add `getHistorySize(): number` - return history.length
- [ ] Add `clear()` method to reset history

### Task 11.6: Integrate with tool execution

- [ ] Capture tile state before tool execution
- [ ] Capture tile state after tool execution
- [ ] Call `recordChange()` with before/after states
- [ ] Wire undo/redo to keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- [ ] Apply undo/redo results by restoring tile state via game worker

## Files Modified

- `IsoGame/mapIso/tileHistory.ts` (new file)

## Dependencies

- Phase 2 complete (click handler for tool integration)

## Verification

1. Make a tile change and verify it is recorded in history
2. Press Ctrl+Z and verify the change is undone
3. Press Ctrl+Shift+Z and verify the change is redone
4. Make multiple changes and verify undo reverts in correct order
5. Make a change, undo, then make a new change - verify redo history is cleared
6. Verify history is limited to maxHistory size