# ADR: Current Project Architecture Analysis

## Status
Living Document

## Architecture Overview

### Core Engine (`IsoGame/`)
- **Singleton Pattern**: Heavily used for `World`, `MapState`, `FactoryMap`, `FactoryTileGenerator`, etc. 
- **Procedural Generation**: Stacked generators (`FactoryTileRawGenerator` -> `FactoryTileGenerator` -> `Chunk` -> `Tile`).
- **State Management**: `MapState` centralizes viewport and input state.
- **Action System**: `TilesActions` (v1 and v2) handle map modifications.

### Worker Layer (`IsoGameAddon/iso/web/js/`)
- **GameWorker**: Offloads game logic and rendering from the main thread.
- **MessageHandler**: Custom RPC-like system for communication between threads.

## Pattern Errors & Refactoring Needs

### 1. Excessive Singleton Usage
- **Problem**: Classes like `World`, `MapState`, and all factories are singletons. This makes testing difficult and prevents running multiple world instances (e.g., for multi-dimensional maps or mini-games).
- **Refactor**: Move towards Dependency Injection or a Service Locator pattern (partially hinted at in `IsoGame/map/interface.ts`).

### 2. Lack of Abstraction in Message Handling
- **Problem**: `GameWorker.ts` has a large map of handlers. As the game grows, this will become unmaintainable.
- **Refactor**: Split handlers into domain-specific modules (e.g., `MapHandlers`, `EntityHandlers`, `ToolHandlers`).

### 3. Tight Coupling in Tile/Chunk Generation
- **Problem**: `Tile` calls `FactoryTileRawGenerator` and `FactoryTileGenerator` directly in its constructor.
- **Refactor**: Use a Factory to create Tiles and inject the generated data.

### 4. Direct DOM/Canvas references in Logic
- **Problem**: `MapState` and `GameWorker` sometimes leak rendering concerns into logic.
- **Refactor**: Strict separation between `MapState` (logical coordinates) and `CanvasMapDrawer` (screen coordinates).

## Stories for Refactoring

### Story 1: Decouple Tile from Generators
- **Goal**: Make `Tile` a pure data class.
- **Action**: Modify `Tile` constructor to accept pre-generated data. Update `Chunk` to handle the generation flow using factories before creating `Tile` instances.

### Story 2: Modularize MessageHandler
- **Goal**: Clean up `GameWorker.ts`.
- **Action**: Create a `WorkerRouter` that delegates messages to specific handler classes based on action prefix (e.g., `map:*`, `tool:*`).

### Story 3: Transition from Singletons to IWorld context
- **Goal**: Reduce global state reliance.
- **Action**: Start passing an `IWorld` context to classes instead of having them call `Instance.getInstance()`.

### Story 4: Implement Delta-Based Persistence (As per ADR-SAVE-CHUNK)
- **Goal**: Persist map modifications efficiently.
- **Action**: Implement the dirty flag and serialization logic in `Tile` and `Chunk`.
