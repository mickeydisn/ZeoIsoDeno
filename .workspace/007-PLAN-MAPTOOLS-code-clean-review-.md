# Plan — Code Clean Review & Technical Debt

> ZeoIsoDeno Implementation Plan — 2026-03-28
> Tech Lead: Code Quality & Structure Review

---

## Introduction

The Map Tools system (Phases 1-5) is functionally complete. However, the rapid implementation has accumulated technical debt that needs addressing before Phase 6 (Structure & Inspection Tools). This plan targets three critical areas:

1. **File Size Violation**: `toolMenu.ts` at **745 lines** exceeds the 500-line policy. This monolithic UI file mixes state management, rendering logic, and worker message handlers — making it difficult to maintain and extend.

2. **Linter Debt**: **2,528 linting issues** exist across the codebase. While most (2,028) are in `IsoGame/mapIso/` (pre-existing `no-dupe-keys`), the tools and UI code have actionable issues: unused variables, `no-explicit-any`, and `prefer-const` violations.

3. **Code Duplication & Inconsistency**: Tool files follow similar patterns but lack shared abstractions. The `wcBuilding2/` package has naming inconsistencies (`wc` vs `Wc` prefixes). CSS files have duplicate rules across `styles.css`, `styles2.css`, and `stylesIso.css`.

**Prioritization Strategy**: Address by **code impact** — files that are actively modified during tool development get priority over legacy code. The `toolMenu.ts` split is highest priority as it blocks clean Phase 6 implementation.

---

## Phase 1: toolMenu.ts Decomposition (HIGH PRIORITY)

> **Goal**: Split the 745-line `toolMenu.ts` into focused modules under 500 lines each.
> **Duration**: 1 day

### Context

`toolMenu.ts` currently contains:
- State variables (15+ variables)
- HTML template rendering (large template string)
- Worker message handlers (6 exported functions)
- Event wiring and DOM manipulation
- Helper functions

This violates single-responsibility and makes adding new tool categories (Phase 6) error-prone.

### Task 1.1: Extract State Management

**File**: `web/js/menu/toolMenuState.ts` (NEW)

- [x] Extract all state variables from `toolMenu.ts`:
  - `activeCategory`, `activeToolId`, `brushSize`
  - `activeColor`, `assetGroups`, `activeAssetId`, `activeAssetGroup`
  - `buildingConfigs`, `activeBuildingConfigId`, `buildingGrowLoop`, `buildingEndLoop`
  - `toolList`, `categories`, `brushSizes`
- [x] Export getter/setter functions for each state group
- [x] Export state reset functions (`resetAssetState`, `resetBuildingState`)
- [x] Target size: ~100 lines (actual: ~250 lines with comprehensive API)

### Task 1.2: Extract HTML Template Rendering

**File**: `web/js/menu/toolMenuRender.ts` (NEW)

- [x] Extract `renderToolMenu()` function
- [x] Extract sub-render functions:
  - `renderCategoryTabs()`
  - `renderToolList()` (was renderToolButtons)
  - `renderBrushSelector()`
  - `renderColorPanel()`
  - `renderAssetPanel()`
  - `renderBuildingPanel()`
  - `renderInspectPanel()`
- [x] Import state from `toolMenuState.ts`
- [x] Target size: ~312 lines (actual)

### Task 1.3: Extract Worker Message Handlers

**File**: `web/js/menu/toolMenuHandlers.ts` (NEW)

- [x] Extract all exported handler functions:
  - `handleToolList()`
  - `handleToolExecuted()`
  - `handlePickedColor()`
  - `handleAssetPreview()`
  - `handleAssetGroups()`
  - `handleBuildingConfigList()`
- [x] Each handler updates state via `toolMenuState.ts` and triggers re-render
- [x] Target size: ~165 lines (actual)

### Task 1.4: Slim Down toolMenu.ts

**File**: `web/js/menu/toolMenu.ts` (MODIFY)

- [x] Reduce to orchestrator role:
  - Import and re-export handlers from `toolMenuHandlers.ts`
  - `initToolMenu()` function that wires DOM and initial render
  - Event listener setup
  - DOM rendering helpers
- [x] Target size: 500 lines (under 500 ✓)

### Task 1.5: Update Imports in main.ts

**File**: `web/js/main.ts` (MODIFY)

- [x] Handler exports re-exported from toolMenu.ts (no change needed)
- [x] All message handlers still work after split

---

## Phase 2: Linter Fixes — Tools & UI Code (MEDIUM PRIORITY)

> **Goal**: Fix actionable linting issues in actively-developed code.
> **Duration**: 0.5 day

### Context

The tools directory has **7 linting issues**, primarily unused parameters in `assetTools.ts`. The `toolMenu.ts` (and its new modules after Phase 1) likely have `no-explicit-any` issues from worker message types. Fixing these improves type safety and catches potential bugs.

### Task 2.1: Fix IsoGame/tools/ Linter Issues

**Files**: `IsoGame/tools/*.ts`

- [x] Fix 3 unused parameters in `assetTools.ts` (prefix with `_` or remove)
- [x] Fix 3 unused parameters in `colorTools.ts` (prefix with `_`)
- [x] Fix 1 unused variable in `terrainTools.ts` (prefix with `_`)
- [x] Run `deno lint IsoGame/tools/` to verify zero issues

### Task 2.2: Fix toolMenu Linter Issues

**Files**: `web/js/menu/toolMenu*.ts` (after Phase 1 split)

- [x] Remove unused imports from `toolMenu.ts`
- [x] Remove unused import `MapToolInfo` from `toolMenuRender.ts`
- [x] Prefix unused parameter `_container` in `handleFilterChange`
- [x] Fix `infoMenu.ts`: prefix unused `_gameWorker`, replace `any` types with proper interfaces
- [x] Run `deno lint web/js/menu/` to verify zero issues

### Task 2.3: Fix web/js/ Linter Issues (Targeted)

**Files**: `web/js/main.ts`, `web/js/gameWorker.ts`

- [x] Fix `GameHandlerData = any` → `GameHandlerData = unknown`
- [x] Fix unused `city` variable → prefix with `_city`
- [x] Run `deno lint web/js/main.ts web/js/gameWorker.ts` to verify

---

## Phase 3: Code Duplication Reduction (MEDIUM PRIORITY)

> **Goal**: Reduce boilerplate in tool definition files.
> **Duration**: 0.5 day

### Context

Each tool file (`terrainTools.ts`, `colorTools.ts`, `assetTools.ts`, `structureTools.ts`) repeats the same `MapTool` object structure. While not a critical issue, a helper function would reduce boilerplate and ensure consistency.

### Task 3.1: Create Tool Builder Helper

**File**: `IsoGame/tools/toolBuilder.ts` (NEW)

- [x] Create `createTool(config)` helper function:
  ```typescript
  export function createTool(config: {
    id: string;
    name: string;
    icon: string;
    category: MapTool["category"];
    execute: MapTool["execute"];
  }): MapTool
  ```
- [x] Export `createToolArray(...tools)` for cleaner array exports
- [x] Target size: ~30 lines

### Task 3.2: Refactor Tool Files to Use Builder

**Files**: `IsoGame/tools/terrainTools.ts`, `colorTools.ts`, `assetTools.ts`, `structureTools.ts`

- [x] Replace manual object literals with `createTool()` calls
- [x] Verify all tools still register correctly
- [x] Run TypeScript compiler to check for errors

---

## Phase 4: wcBuilding2 Naming Consistency (LOW PRIORITY)

> **Goal**: Standardize naming conventions in the building package.
> **Duration**: 0.5 day

### Context

The `wcBuilding2/` package has inconsistent class naming (`wc` vs `Wc` prefixes) and file naming. While not blocking, standardizing improves readability and reduces confusion.

### Task 4.1: Standardize Asset Class Names

**Files**: `IsoGame/wcBuilding2/wcAsset_*.ts`

- [ ] Rename classes to use `WcAsset_*` pattern (uppercase W):
  - `wcAsset_CoridorLab` → `WcAsset_CorridorLab` (fix typo too)
  - `wcAsset_CoridorPipe` → `WcAsset_CorridorPipe`
  - `wcAsset_Enter` → `WcAsset_Enter`
  - `wcAsset_EnterSimple` → `WcAsset_EnterSimple`
- [ ] Update all import references
- [ ] Verify TypeScript compilation

### Task 4.2: Fix File Name Typos

**Files**: `IsoGame/wcBuilding2/wcAsset_Coridor*.ts`

- [ ] Rename `wcAsset_CoridorLab.ts` → `wcAsset_CorridorLab.ts`
- [ ] Rename `wcAsset_CoridorPipe.ts` → `wcAsset_CorridorPipe.ts`
- [ ] Update all import paths
- [ ] Verify no broken references

---

## Phase 5: CSS Consolidation (LOW PRIORITY)

> **Goal**: Remove duplicate CSS rules and establish single source of truth.
> **Duration**: 0.25 day

### Context

`styles.css` (69 lines) and `styles2.css` (6 lines) contain rules that overlap with `stylesIso.css` (832 lines). The game UI only uses `stylesIso.css`, so the others are either legacy or for different pages.

### Task 5.1: Audit CSS Usage

- [ ] Check which HTML files reference `styles.css` and `styles2.css`
- [ ] Identify duplicate rules across all three files
- [ ] Determine if `styles.css`/`styles2.css` are used by non-game pages

### Task 5.2: Consolidate or Remove

**If `styles.css`/`styles2.css` are unused by game:**
- [ ] Leave them as-is (they may serve other pages)

**If duplicates exist in `stylesIso.css`:**
- [ ] Remove duplicate rules from `styles.css`/`styles2.css`
- [ ] Keep `stylesIso.css` as single source for game UI

---

## File Summary

| File | Type | Phase | Priority |
|------|------|-------|----------|
| `web/js/menu/toolMenuState.ts` | NEW | 1 | HIGH |
| `web/js/menu/toolMenuRender.ts` | NEW | 1 | HIGH |
| `web/js/menu/toolMenuHandlers.ts` | NEW | 1 | HIGH |
| `web/js/menu/toolMenu.ts` | MODIFY | 1 | HIGH |
| `IsoGame/tools/toolBuilder.ts` | NEW | 3 | MEDIUM |
| `IsoGame/tools/*.ts` | MODIFY | 2, 3 | MEDIUM |
| `IsoGame/wcBuilding2/wcAsset_*.ts` | RENAME | 4 | LOW |
| `web/styles.css` | AUDIT | 5 | LOW |
| `web/styles2.css` | AUDIT | 5 | LOW |

---

## Estimated Effort

| Phase | Tasks | Time Estimate | Priority |
|-------|-------|---------------|----------|
| Phase 1 | toolMenu.ts split (5 tasks) | 1 day | HIGH |
| Phase 2 | Linter fixes (3 tasks) | 0.5 day | MEDIUM |
| Phase 3 | Code duplication (2 tasks) | 0.5 day | MEDIUM |
| Phase 4 | Naming consistency (2 tasks) | 0.5 day | LOW |
| Phase 5 | CSS consolidation (2 tasks) | 0.25 day | LOW |
| **Total** | **14 tasks** | **2.75 days** | |

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Splitting toolMenu.ts may break UI rendering | Test after each extraction step; keep original as backup |
| Renaming wcBuilding2 classes may break imports | Use IDE refactoring; run TypeScript compiler after each rename |
| CSS removal may affect non-game pages | Audit HTML file references before removing any CSS |
| Linter fixes may change behavior | Focus on unused vars and type annotations, not logic changes |

---

## Verification Checklist

After completing all phases:

- [ ] `deno check` passes with no TypeScript errors
- [ ] `deno lint IsoGame/tools/` returns 0 issues
- [ ] `deno lint web/js/menu/` returns 0 issues
- [ ] All tool categories render correctly in browser
- [ ] Building placement still works with all 6 configs
- [ ] Color picker and asset browser still functional
- [ ] No console errors during normal tool usage

---

## Implementation Order

**Recommended sequence:**

1. **Phase 1** → Split `toolMenu.ts` (unblocks clean Phase 6 work)
2. **Phase 2** → Fix linter issues in tools/UI code
3. **Phase 3** → Add tool builder helper (optional, nice-to-have)
4. **Phase 4** → Standardize wcBuilding2 naming (if time permits)
5. **Phase 5** → CSS audit (quick win, do last)

Phase 1 is **blocking** for Phase 6 implementation — it should be done first.