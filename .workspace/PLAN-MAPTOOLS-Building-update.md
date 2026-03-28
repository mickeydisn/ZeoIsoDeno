# Plan — Building Tools Update & Cleanup

> ZeoIsoDeno Implementation Plan — 2026-03-28
> Tech Lead: Code Quality & Consistency Pass

---

## Introduction

The building tools system (Phases 1-4) is functionally complete but requires a quality pass to align with production standards. Three key areas need attention:

1. **Package Organization**: The `wcBuilding2/` package has grown organically and needs structural cleanup — legacy code remnants in `gameWorker.ts` (hardcoded `gridClick_Building` handler), unclear separation between core and config layers, and naming inconsistencies.

2. **Configuration Completeness**: The current `endLoopMax` slider cap (5000) is excessive; it should be 1000. Additionally, building configurations have other undocumented properties (asset collections, face types, growth patterns) that should be exposed or at minimum validated.

3. **CSS Consistency**: The building configuration UI uses CSS classes (`.building-config-header`, `.building-config-btn`, `.param-row`) that have **no definitions** in any stylesheet. The existing CSS files have duplicated rules and inconsistent patterns that should be consolidated.

This update focuses on code hygiene, configuration correctness, and UI consistency — no new features.

---

## Phase 1: Legacy Code Removal & Package Cleanup

> **Goal**: Remove dead code and establish clean package boundaries.
> **Duration**: 0.5 day

### Task 1.1: Remove Legacy Building Handler

**File**: `web/js/gameWorker.ts` (MODIFY)

- [x] Remove the `gridClick_Building` handler block (hardcoded `WcBuildConf_GraveA`)
- [x] Verify no other code references `gridClick_Building` action
- [x] Remove unused `WcBuildConf_GraveA` direct import if only used in legacy handler
- [x] Confirm `placeBuildingTool` is the sole building placement entry point

### Task 1.2: Audit wcBuilding2 Package Exports

**File**: `IsoGame/wcBuilding2/` (AUDIT)

- [x] Review `AbstractBuildConf.ts` — ensure base class exports are minimal and focused
- [x] Review `wcBuildingFactory.ts` — confirm `WcBuildingFactoryGenarator` is the only public API needed
- [x] Review `wcUtils.ts` — verify utility functions are actually used; remove dead exports
- [x] Review `wcBuildFace.ts` — check if face type constants can be consolidated
- [x] Document the intended public API of the package (what external code should import)

### Task 1.3: Naming Consistency Pass

**Files**: `IsoGame/wcBuilding2/*.ts`

- [x] Standardize file naming: `wcBuild*` prefix pattern (e.g., `wcBuildAction.ts` → keep, `AbstractBuildConf.ts` → renamed to `wcAbstractBuildConf.ts`)
- [x] Standardize class naming: ensure all classes follow `WcBuild*` pattern (`AbstractWcBuildConf` → `WcAbstractBuildConf`, `WcBuildingFactory` → `WcBuildFactory`, `WcBuildingFactoryGenarator` → `WcBuildFactoryGenarator`)
- [x] Update all import paths after renames
- [x] Verify no broken imports after renaming

---

## Phase 2: Configuration Property Fixes

> **Goal**: Fix parameter ranges and expose additional building properties.
> **Duration**: 0.5 day

### Task 2.1: Fix End Loop Max Range

**File**: `web/js/menu/toolMenu.ts` (MODIFY)

- [x] Change `endLoopSlider` set default to `1000`
- [x] Update `defaultEndLoop` values in building configs if any exceed 1000
- [x] Verify `buildingConfigRegistry.ts` default values are within new range

**File**: `IsoGame/tools/buildingConfigRegistry.ts` (VERIFY)

- [x] Check all 6 building configs have `defaultEndLoop <= 1000`
- [x] Adjust any configs that exceed the new maximum

### Task 2.2: Audit Building Configuration Properties

**Files**: `IsoGame/wcBuilding2/conf/buildConf_*.ts` (AUDIT)

- [x] List all properties used across building configs:
  - `growLoopCount` (exposed ✓)
  - `endLoopMax` (exposed ✓)
  - Asset collection references (hardcoded per config class, not user-configurable)
  - Face type configurations (`faceLinkWeight`, `faceLinks` — internal geometry parameters)
  - Growth pattern parameters (embedded in face links and weight distributions)
- [x] Determine which additional properties are meaningful for user configuration
- [x] Document findings; recommend which (if any) to expose in UI

**Findings:**
- `growLoopCount` and `endLoopMax` are the only properties meaningful for user configuration
- Face link weights and connections are implementation details defining building geometry — too complex for simple UI
- Asset references are hardcoded per config class and not suitable for runtime configuration
- **Recommendation**: No additional properties should be exposed in the UI

### Task 2.3: Add Configuration Validation

**File**: `IsoGame/tools/buildingConfigRegistry.ts` (MODIFY)

- [x] Add validation in `createBuildingConfig()`:
  - `growLoopCount` must be between 5 and 100
  - `endLoopMax` must be between 50 and 1000
- [x] Return error or clamp values if out of range
- [x] Log warnings for invalid configurations

---

## Phase 3: CSS Consistency & Building UI Styling

> **Goal**: Add missing CSS definitions and consolidate duplicated styles.
> **Duration**: 0.5 day

### Task 3.1: Add Missing Building UI Styles

**File**: `web/stylesIso.css` (MODIFY)

- [x] Add `.building-config-header` styles
- [x] Add `.building-config-btn` styles (align with existing `.tool-btn` pattern)
- [x] Add `.building-name` styles
- [x] Add `.building-empty` styles (empty state message)
- [x] Add `.param-row` styles (label + slider layout)
- [x] Add `#buildingConfigPanel` container styles
- [x] Add `#buildingDescription` styles

### Task 3.2: Consolidate Duplicated CSS

**Files**: `web/styles.css`, `web/styles2.css`, `web/stylesIso.css` (MODIFY)

- [x] Remove duplicate `.active` class from `styles.css` and `styles2.css` (keep in `stylesIso.css`)
- [x] Remove duplicate `pre` tag styles from `styles2.css` (keep in `stylesIso.css`)
- [x] Remove empty/duplicate `body` rules from `styles.css` and `styles2.css`
- [x] Verify `indexIso.html` only links `stylesIso.css` (single source of truth)

### Task 3.3: Align Building Panel with Existing UI Patterns

**File**: `web/js/menu/toolMenu.ts` (MODIFY)

- [ ] Refactor building config panel HTML to reuse existing CSS classes:
  - Use `.tool-btn` pattern for config buttons (not custom `.building-config-btn`)
  - Use `.category-header` pattern for panel header
  - Use existing slider/input patterns from other tool panels
- [ ] Remove inline styles where CSS classes exist
- [ ] Ensure consistent spacing, font sizes, and colors with rest of tool menu

---

## Phase 4: Verification & Documentation

> **Goal**: Validate all changes work correctly and document the cleaned-up architecture.
> **Duration**: 0.5 day

### Task 4.1: Functional Testing

- [ ] Test building placement with each of the 6 configurations
- [ ] Test parameter sliders (grow loop 5-100, end loop 50-1000)
- [ ] Test config switching preserves parameter values
- [ ] Verify legacy `gridClick_Building` removal doesn't break anything
- [ ] Check browser console for any import/definition errors

### Task 4.2: Visual Testing

- [ ] Verify building config panel renders with correct styles
- [ ] Verify panel shows/hides correctly with structure category
- [ ] Verify active config button has visual feedback
- [ ] Verify slider values display correctly
- [ ] Compare building panel styling with other tool panels for consistency

### Task 4.3: Code Quality Check

- [ ] Run TypeScript compiler — no errors
- [ ] Run linter if configured — no warnings
- [ ] Verify no unused imports remain after cleanup
- [ ] Verify all renamed files have correct import paths

---

## File Summary

| File | Type | Phase |
|------|------|-------|
| `web/js/gameWorker.ts` | MODIFY | 1 |
| `IsoGame/wcBuilding2/AbstractBuildConf.ts` | RENAME | 1 |
| `IsoGame/wcBuilding2/*.ts` | AUDIT | 1 |
| `IsoGame/tools/buildingConfigRegistry.ts` | MODIFY | 2 |
| `web/js/menu/toolMenu.ts` | MODIFY | 2, 3 |
| `web/stylesIso.css` | MODIFY | 3 |
| `web/styles.css` | MODIFY | 3 |
| `web/styles2.css` | MODIFY | 3 |

---

## Estimated Effort

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| Phase 1 | Legacy removal & cleanup (3 tasks) | 0.5 day |
| Phase 2 | Config fixes (3 tasks) | 0.5 day |
| Phase 3 | CSS consistency (3 tasks) | 0.5 day |
| Phase 4 | Verification (3 tasks) | 0.5 day |
| **Total** | **12 tasks** | **2 days** |

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Renaming files may break imports | Use IDE refactoring tools; verify with TypeScript compiler |
| Removing legacy handler may have hidden callers | Search codebase for `gridClick_Building` references before removal |
| CSS consolidation may affect other pages | Verify only `indexIso.html` uses the game styles; other pages use separate CSS |
| Config validation may reject valid edge cases | Use clamping (not rejection) for out-of-range values |

---

## Implementation Order

1. **Phase 1** → Remove dead code, clean up package structure
2. **Phase 2** → Fix configuration ranges and add validation
3. **Phase 3** → Add missing CSS and consolidate styles
4. **Phase 4** → Test everything works correctly

Each phase should be committed independently for clean git history.