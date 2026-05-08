# Phase 4: Integration & Synchronization

**Goal:** Hook everything together for automatic saving and loading.
**Dependencies:** Phase 2, Phase 3

## Tasks

- [x] Task: Implement Auto-Save Trigger
  - Detail: Update `TilesActions` or `Chunk` to mark chunks as "to be saved" when tiles change.
  - Detail: Implement a debounce or throttle mechanism for saving to IndexedDB.
- [x] Task: Create `MapSyncManager`
  - Detail: Manage the flow of deltas: Worker -> IndexedDB -> Server.
- [x] Task: Final testing and validation
  - Detail: Verify that map edits persist after page refresh and across different machines (if server sync is active).
