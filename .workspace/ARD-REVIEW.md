# ADR Review — Technical Debt Assessment

> ZeoIsoDeno Codebase Review — 2026-03-28
> Reviewer: Tech Lead

## Executive Summary

The codebase has a solid foundation with clear architectural intent (dual-threaded worker pattern), but accumulated technical debt impacts maintainability and developer experience. This ADR prioritizes cleanup stories by impact and effort.

---

## Critical Issues (P0)

### 1. Typo in Core Filenames

| Current | Expected |
|---------|----------|
| `IsoGame/word.ts` | `IsoGame/world.ts` |
| `web/js/gobalState.ts` | `web/js/globalState.ts` |
| `IsoGame/entity/CitienBheavior.ts` | `IsoGame/entity/CitizenBehavior.ts` |
| `IsoGame/entity/CitizenTrais.ts` | `IsoGame/entity/CitizenTraits.ts` |

**Impact**: Confusing for new developers, unprofessional appearance
**Effort**: Low (rename + update imports)
**Story**: Rename files and update all import references

---

### 2. Untyped Worker Messages

```ts
// Current — unsafe
export type GameHandlerData = any;

// Proposed — type-safe
interface GameMessage {
  action: string;
  payload?: unknown;
}

interface InitWorkerMessage extends GameMessage {
  action: "initWorker";
}

interface GridClickMessage extends GameMessage {
  action: "gridClick";
  payload: { x: number; y: number };
}
```

**Impact**: Runtime errors, poor IDE support, hard to maintain message protocol
**Effort**: Medium (define interfaces, update handlers)
**Story**: Create `web/js/worker/messageTypes.ts` with typed message interfaces

---

## High Priority (P1)

### 3. Mixed Concerns in GlobalState

`gobalState.ts` directly manipulates DOM elements, mixing state management with UI rendering.

**Current Issues**:
- `initMenu()` generates raw HTML strings
- `updatGlobalJSON()` directly sets DOM `.value` properties
- No separation between state and view

**Proposed**:
```
web/js/
├── state/
│   └── globalState.ts    # Pure state, no DOM
├── ui/
│   └── stateForm.ts      # DOM binding layer
```

**Impact**: Hard to test, hard to reuse state logic
**Effort**: Medium
**Story**: Extract pure state class, create separate UI binding module

---

### 4. Inconsistent Singleton Patterns

| Class | Pattern Used |
|-------|--------------|
| `FactoryMap` | `static getInstance()` |
| `TileActions` | `static getInstance()` |
| `AssetLoaderOpti` | `static create()` (async factory) |
| `World` | Passed as constructor parameter |

**Proposed**: Standardize on dependency injection via constructor parameters. Singletons make testing difficult and hide dependencies.

**Impact**: Inconsistent API, harder testing
**Effort**: Medium
**Story**: Refactor to pass instances through constructors consistently

---

### 5. Dead Code & Experimental Artifacts

```
img/untitled folder/       # 20+ experimental HTML files
img/untitled_folder/       # Duplicate directory
IsoGame/map/object/        # Empty directory
web/jsP/old/              # Old implementations
```

**Impact**: Repository size, confusion about active code
**Effort**: Low
**Story**: Archive or remove dead directories, document if needed

---

### 6. Commented-Out Code Blocks

`web/indexIso.html` contains ~80 lines of commented-out JavaScript for keyboard movement and map fetching.

**Impact**: Code noise, confusion about active vs deprecated features
**Effort**: Low
**Story**: Remove commented code, move to git history or separate doc if needed

---

## Medium Priority (P2)

### 7. Missing Error Handling

Worker communication has no error handling:

```ts
// Current — silent failures
self.onmessage = (e) => this.handlers.get(e.data.action)?.(e.data);

// Proposed
self.onmessage = (e) => {
  const handler = this.handlers.get(e.data.action);
  if (!handler) {
    console.error(`Unknown action: ${e.data.action}`);
    return;
  }
  try {
    handler(e.data);
  } catch (err) {
    this.handler.send({ action: "error", error: err.message });
  }
};
```

**Impact**: Silent failures, hard to debug
**Effort**: Low
**Story**: Add error handling and logging to message handlers

---

### 8. Confusing Module Organization

```
IsoGame/map/
├── action/
│   ├── TileUtil.ts       # Duplicate name with tileActions.ts?
│   └── swapPoint.ts
├── tileActions.ts        # Singleton actions
└── ...
```

**Proposed**: Clear naming:
- `action/` → `operations/` (low-level tile operations)
- `tileActions.ts` → `tileActionManager.ts` (high-level orchestration)

**Impact**: Confusing navigation
**Effort**: Low
**Story**: Rename directories and files for clarity

---

### 9. No Configuration Management

Game constants are hardcoded:
- `DRAW_TILE_COUNT: 40`
- `SCALE_SIZE: 1`
- Chunk size `128`
- Building growth limits

**Proposed**: Centralize in `IsoGame/config/gameConfig.ts`

**Impact**: Hard to tune, no easy way to create presets
**Effort**: Low
**Story**: Extract constants to configuration module

---

### 10. No Unit Tests

No test files found in the codebase.

**Proposed**: Start with critical path tests:
- `FactoryMap` tile generation
- `City` graph algorithms
- `MessageHandler` protocol

**Impact**: Regression risk, refactoring fear
**Effort**: High (ongoing)
**Story**: Set up test framework, add tests for core modules

---

## Low Priority (P3)

### 11. CSS Organization

Multiple CSS files with unclear purpose:
- `styles.css`, `styles2.css`, `stylesIso.css`

**Story**: Consolidate and document CSS architecture

### 12. Asset Management

Sprites in `img/asset_opti/` have inconsistent naming:
- `AstroBase.png` vs `MyPerso2.png` vs `GrokClean1.png`

**Story**: Establish naming convention for assets

### 13. Documentation Gaps

- No JSDoc on public APIs
- No README in `IsoGame/` directory
- Complex algorithms (city generation) lack inline comments

**Story**: Add JSDoc and algorithm documentation

---

## Prioritized Story Backlog

| Priority | Story | Effort | Impact |
|----------|-------|--------|--------|
| P0-1 | Fix typo filenames | Low | High |
| P0-2 | Type worker messages | Medium | High |
| P1-3 | Separate state from DOM | Medium | High |
| P1-4 | Standardize singletons | Medium | Medium |
| P1-5 | Remove dead code directories | Low | Medium |
| P1-6 | Remove commented code | Low | Low |
| P2-7 | Add error handling | Low | Medium |
| P2-8 | Rename confusing modules | Low | Low |
| P2-9 | Extract configuration | Low | Low |
| P2-10 | Add unit tests | High | High |

---

## Recommended Sprint Plan

**Sprint 1** (Quick wins):
- P0-1: Fix typo filenames
- P1-5: Remove dead code
- P1-6: Remove commented code
- P2-9: Extract configuration

**Sprint 2** (Type safety):
- P0-2: Type worker messages
- P2-7: Add error handling

**Sprint 3** (Architecture):
- P1-3: Separate state from DOM
- P1-4: Standardize singletons
- P2-8: Rename confusing modules

**Sprint 4** (Quality):
- P2-10: Set up test framework + initial tests

---

## Conclusion

The codebase shows clear architectural vision but needs disciplined cleanup. The P0 and P1 items should be addressed before major feature work to reduce friction for the team. Sprint 1 can be completed in 1-2 days and will significantly improve code hygiene.