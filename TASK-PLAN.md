# Task Plan: Refactor GameWorker Message Handlers

## Problem Statement

The `IsoGameAddon/iso/web/js/gameWorker.ts` file contains a large, monolithic Map of message handlers (lines 170-349). As the game grows, this will become unmaintainable. The handlers need to be split into domain-specific modules.

## Current State Analysis

### Handlers Map in gameWorker.ts (Lines 170-349)

The current handlers can be categorized into these domains:

1. **Initialization** (3 handlers): `initWorker`, `initCanvasMap`, `setOffScreenCanvas`
2. **Rendering** (2 handlers): `startRender`, `stopRender`
3. **Map/View** (1 handler): `setCenter`
4. **Interaction** (4 handlers): `gridClick`, `mouseClick`, `mouseMove`, `updateKeyboard`
5. **Tool System** (9 handlers): `setBuildingConfig`, `setBuildingParams`, `setActiveTool`, `setBrushSize`, `setColor`, `setActiveAsset`, `getAsset`, `toolClick`
6. **Query** (1 handler): `query_infoCell`

---

## Implementation Plan

### Phase 1: Create Domain-Specific Handler Modules

Create new handler modules in `IsoGameAddon/iso/web/js/worker/handlers/`:

#### 1.1 InitHandlers.ts
- `initWorker` - Initialize game worker
- `initCanvasMap` - Initialize canvas map drawer
- `setOffScreenCanvas` - Set offscreen canvas

#### 1.2 RenderHandlers.ts
- `startRender` - Start render loop
- `stopRender` - Stop render loop
- `setCenter` - Set map center position

#### 1.3 InteractionHandlers.ts
- `gridClick` - Handle grid click (city creation)
- `mouseClick` - Handle mouse click (tool execution)
- `mouseMove` - Handle mouse movement
- `updateKeyboard` - Handle keyboard updates

#### 1.4 ToolHandlers.ts
- `setBuildingConfig` - Set building configuration
- `setBuildingParams` - Set building parameters
- `setActiveTool` - Set active tool
- `setBrushSize` - Set brush size
- `setColor` - Set active color
- `setActiveAsset` - Set active asset
- `getAsset` - Get asset by ID
- `toolClick` - Execute tool at position

#### 1.5 QueryHandlers.ts
- `query_infoCell` - Query cell information

---

### Phase 2: Create Handler Aggregator

#### 2.1 HandlersRegistry.ts
Create a registry that combines all domain handlers:
- Import all domain handler modules
- Provide a unified `getAllHandlers()` method
- Support handler registration and lookup

---

### Phase 3: Refactor GameWorker.ts

#### 3.1 Simplify GameWorker
- Remove inline handler definitions
- Import and use HandlersRegistry
- Keep only worker-specific logic (loop, FPS, etc.)

---

### Phase 4: Update MessageHandler.ts (Optional)

#### 4.1 Type Safety Enhancement
- Add type-safe handler interfaces for each domain
- Export handler types for better TypeScript support

---

## File Structure After Refactoring

```
IsoGameAddon/iso/web/js/
├── gameWorker.ts              # Simplified, uses registry
├── worker/
│   ├── messageHandler.ts      # Existing (keep as-is or enhance)
│   └── handlers/
│       ├── index.ts           # HandlersRegistry - exports all handlers
│       ├── InitHandlers.ts   # Initialization handlers
│       ├── RenderHandlers.ts # Rendering handlers
│       ├── InteractionHandlers.ts # Mouse/keyboard handlers
│       ├── ToolHandlers.ts   # Tool system handlers
│       └── QueryHandlers.ts  # Query handlers
```

---

## Implementation Order

| Task | Description | Priority |
|------|-------------|----------|
| 1 | Create `worker/handlers/ToolHandlers.ts` | HIGH - Largest domain (9 handlers) |
| 2 | Create `worker/handlers/InteractionHandlers.ts` | HIGH - 4 handlers |
| 3 | Create `worker/handlers/InitHandlers.ts` | MEDIUM - 3 handlers |
| 4 | Create `worker/handlers/RenderHandlers.ts` | MEDIUM - 3 handlers |
| 5 | Create `worker/handlers/QueryHandlers.ts` | LOW - 1 handler |
| 6 | Create `worker/handlers/index.ts` (Registry) | HIGH - Aggregator |
| 7 | Refactor `gameWorker.ts` to use registry | HIGH |
| 8 | Test and verify all handlers work | HIGH |

---

## Benefits

1. **Maintainability**: Each domain has its own file
2. **Scalability**: Easy to add new handlers to specific domains
3. **Testability**: Can unit test each handler domain independently
4. **Readability**: Clear separation of concerns
5. **Collaboration**: Multiple developers can work on different domains

---

## Notes

- Keep backward compatibility during refactoring
- Ensure all existing message types in `messageHandler.ts` are preserved
- Consider adding handler documentation/comments
- Future: Could implement auto-discovery of handlers via decorators