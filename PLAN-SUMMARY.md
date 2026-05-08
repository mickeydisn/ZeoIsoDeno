# Plan: Delta-Based Chunk Saving System

Implement a production-ready persistence layer that saves only modified tile data (deltas) instead of entire chunks. This optimizes storage and allows procedurally generated maps to persist user modifications across sessions and between client and server.

## Phases

- [x] Phase 1: Foundation & Data Model - Extend Tile and Chunk models with dirty tracking and delta serialization.
- [x] Phase 2: Client-Side Persistence (IndexedDB) - Implement local storage for deltas to ensure offline persistence and fast loading.
- [x] Phase 3: Server-Side Persistence (SQLite) - Create API and database layer to synchronize deltas with the server.
- [x] Phase 4: Integration & Synchronization - Connect the game loop and worker to the persistence layer for automatic saving and loading.
