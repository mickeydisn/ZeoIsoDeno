# ADR-SAVE-CHUNK: Delta-Based Chunk Saving System

## Status
Proposed

## Context
The game uses a procedurally generated map based on noise functions. Currently, map modifications are not persisted, or the existing (commented-out) implementation attempts to save every tile, which is inefficient. We need a system that:
1. Persists map modifications made by users.
2. Minimizes storage by only saving "deltas" (differences from the raw generated state).
3. Loads chunks on demand.
4. Supports client-side persistence (IndexedDB) with server synchronization (SQLite).

## Decision
We will implement a **Delta-Based Chunk Saving System**.

### 1. Change Detection
Each `Tile` will be able to determine if it has been modified. A tile is considered "dirty" if:
- `currentLvl != genLvl2`
- `currentColor` does not match `genColor`
- `items` do not match `genItems`
- `isBlock` or `isFrise` flags have been toggled from their defaults.

### 2. Data Structure for Persistence
Chunks will be the unit of synchronization.
- **Client Storage**: IndexedDB with two stores:
    - `MapChunks`: Metadata about modified chunks (cx, cy, lastModified).
    - `MapTiles`: Individual modified tiles, indexed by `chunkId`.
- **Serialization**: Only modified properties of a tile will be stored in JSON format.

### 3. Load/Save Workflow
- **Loading**:
    1. Generate the chunk using the noise functions.
    2. Query IndexedDB for any stored tiles belonging to this chunk.
    3. Overwrite the generated tile properties with the stored values.
- **Saving**:
    1. Scan the chunk for modified tiles.
    2. If a tile is modified, serialize its current state.
    3. Update IndexedDB.

### 4. Synchronization
- A synchronization service will track "dirty" chunks that need to be sent to the server.
- The server will store these deltas in a SQLite database.
- Synchronization can be triggered manually or automatically (e.g., when a chunk is unloaded).

## Consequences
- **Positive**: significantly reduced storage requirements and network traffic.
- **Positive**: Reproducible maps from seed + small delta payloads.
- **Negative**: Slight CPU overhead when loading chunks to merge generated data with deltas.
- **Negative**: Risk of "stale" deltas if the procedural generation logic changes (noise function updates). We should include a versioning strategy for the generation logic.
