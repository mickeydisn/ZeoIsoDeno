# Plan — Building Tools System

> ZeoIsoDeno Implementation Plan — 2026-03-28
> Tech Lead: Implementation Breakdown

---

## Introduction

The current building placement system in ZeoIsoDeno uses a hardcoded `gridClick_Building` handler in `gameWorker.ts` that always uses `WcBuildConf_GraveA` with fixed parameters (`growLoopCount: 20`, `endLoopMax: 100`). This lacks flexibility — users cannot select different building types or configure generation parameters before placement.

This plan extends the existing tool system (Phases 1-4 completed) with a dedicated **Building Tools** category. The implementation follows the established `MapTool` interface pattern and integrates with the existing `ToolRegistry`, `toolMenu.ts` UI, and `WcBuildingFactoryGenarator`. The user will be able to:
1. Select a building configuration from available types (Grave, House, Manor, LabBorder, LabPipe, RLab)
2. Configure generation parameters (`growLoopCount`, `endLoopMax`) via UI sliders
3. Place buildings using the selected configuration
4. Clear buildings from an area (future sub-plan)

**Key integration points:**
- `IsoGame/tools/structureTools.ts` — NEW file with building tool implementations
- `web/js/menu/toolMenu.ts` — Add building configuration selector UI in structure category
- `web/js/gameWorker.ts` — Register building tools, add config handlers
- `IsoGame/wcBuilding2/conf/` — Existing building configurations to expose

---

## Phase 1: Building Configuration Registry

> **Goal**: Create a registry of available building configurations and expose them to the tool system.
> **Duration**: 0.5 day

### Task 1.1: Create Building Config Registry

**File**: `IsoGame/tools/buildingConfigRegistry.ts` (NEW)

- [ ] Define `BuildingConfigEntry` interface:
  ```typescript
  interface BuildingConfigEntry {
    id: string;
    name: string;
    description: string;
    defaultGrowLoop: number;
    defaultEndLoop: number;
    createConfig(options: { growLoopCount: number; endLoopMax: number }): AbstractWcBuildConf;
  }
  ```
- [ ] Create `buildingConfigRegistry` Map with entries for all 6 building types:
  - `grave_a` → `WcBuildConf_GraveA`
  - `house_a` → `WcBuildConf_HouseA`
  - `manor_a` → `WcBuildConf_ManorA`
  - `lab_border_a` → `WcBuildConf_LabBorderA`
  - `lab_pipe_a` → `WcBuildConf_LabPipeA`
  - `r_lab_a` → `WcBuildConf_RLabA`
- [ ] Export `getBuildingConfigList()` function returning array of config info (id, name, description, defaults)
- [ ] Export `createBuildingConfig(id, options)` factory function

### Task 1.2: Add Building State to ToolRegistry

**File**: `IsoGame/tools/toolRegistry.ts` (MODIFY)

- [ ] Add `activeBuildingConfigId: string` property (default: `"grave_a"`)
- [ ] Add `buildingGrowLoop: number` property (default: `20`)
- [ ] Add `buildingEndLoop: number` property (default: `100`)
- [ ] Add `setBuildingConfig(id: string)` method
- [ ] Add `setBuildingParams(growLoop: number, endLoop: number)` method
- [ ] Add `getBuildingConfig()` method returning current config state

---

## Phase 2: Structure Tools Implementation

> **Goal**: Implement place building tool and register it in the tool system.
> **Duration**: 0.5 day

### Task 2.1: Create Structure Tools File

**File**: `IsoGame/tools/structureTools.ts` (NEW)

- [ ] Create `placeBuildingTool` implementing `MapTool` interface:
  ```typescript
  export const placeBuildingTool: MapTool = {
    id: "place_building",
    name: "Place Building",
    icon: "🏠",
    category: "structure",
    execute(x, y, brushSize, world) {
      // Get config from registry
      // Create WcBuildingFactoryGenarator
      // Call start2(x, y)
    }
  }
  ```
- [ ] Import `buildingConfigRegistry` to get current config
- [ ] Import `WcBuildingFactoryGenarator` from `wcBuilding2/wcBuildingFactory.ts`
- [ ] Import `toolRegistry` to get active building config/params
- [ ] Export `structureTools` array containing `placeBuildingTool`

### Task 2.2: Register Building Tools in Worker

**File**: `web/js/gameWorker.ts` (MODIFY)

- [ ] Import `structureTools` from `IsoGame/tools/structureTools.ts`
- [ ] Import `buildingConfigRegistry` functions
- [ ] Register `structureTools` in `initWorker` after asset tools:
  ```typescript
  structureTools.forEach((tool) => toolRegistry.register(tool));
  ```
- [ ] Add `setBuildingConfig` handler:
  ```typescript
  ["setBuildingConfig", (data) => {
    toolRegistry.setBuildingConfig(data.configId);
  }]
  ```
- [ ] Add `setBuildingParams` handler:
  ```typescript
  ["setBuildingParams", (data) => {
    toolRegistry.setBuildingParams(data.growLoop, data.endLoop);
  }]
  ```
- [ ] Send building config list to main thread after tool registration:
  ```typescript
  this.handler.send({
    action: "buildingConfigList",
    configs: getBuildingConfigList(),
  });
  ```

---

## Phase 3: Building Configuration UI

> **Goal**: Add building configuration selector and parameter controls to the tool menu.
> **Duration**: 0.5 day

### Task 3.1: Add Building Config State to ToolMenu

**File**: `web/js/menu/toolMenu.ts` (MODIFY)

- [ ] Add state variables:
  ```typescript
  let buildingConfigs: Array<{ id: string; name: string; description: string; defaultGrowLoop: number; defaultEndLoop: number }> = [];
  let activeBuildingConfigId: string = "grave_a";
  let buildingGrowLoop: number = 20;
  let buildingEndLoop: number = 100;
  ```

### Task 3.2: Render Building Config UI

**File**: `web/js/menu/toolMenu.ts` (MODIFY)

- [ ] Add `buildingConfigPanel` HTML section in `renderToolMenu()` (hidden by default, shown when structure category is active):
  ```html
  <div id="buildingConfigPanel" style="display: none">
    <div class="building-config-header">Building Configuration</div>
    <div id="buildingConfigSelector">
      <!-- Config buttons rendered dynamically -->
    </div>
    <div id="buildingParams">
      <div class="param-row">
        <span>Grow Loop:</span>
        <input type="range" min="5" max="100" value="${buildingGrowLoop}" id="growLoopSlider">
        <span id="growLoopValue">${buildingGrowLoop}</span>
      </div>
      <div class="param-row">
        <span>End Loop Max:</span>
        <input type="range" min="50" max="5000" value="${buildingEndLoop}" id="endLoopSlider">
        <span id="endLoopValue">${buildingEndLoop}</span>
      </div>
    </div>
    <div id="buildingDescription">${getActiveBuildingDescription()}</div>
  </div>
  ```
- [ ] Show/hide `buildingConfigPanel` when structure category is selected/deselected
- [ ] Add `renderBuildingConfigSelector()` function to populate config buttons
- [ ] Add click handlers for config buttons → send `setBuildingConfig` to worker
- [ ] Add input handlers for sliders → send `setBuildingParams` to worker
- [ ] Add `getActiveBuildingDescription()` helper function

### Task 3.3: Handle Building Config List from Worker

**File**: `web/js/menu/toolMenu.ts` (MODIFY)

- [ ] Add `handleBuildingConfigList()` exported function:
  ```typescript
  export function handleBuildingConfigList(configs: BuildingConfigEntry[]) {
    buildingConfigs = configs;
    // Re-render building config selector
  }
  ```

### Task 3.4: Wire Message Handler in Main

**File**: `web/js/main.ts` (MODIFY)

- [ ] Import `handleBuildingConfigList` from `toolMenu.ts`
- [ ] Add handler for `buildingConfigList` message from worker:
  ```typescript
  handlers.append("buildingConfigList", (data) => {
    handleBuildingConfigList(data.configs);
  });
  ```

---

## Phase 4: Building Removal (Sub-Plan)

> **Goal**: Plan the implementation of building removal functionality.
> **Duration**: Planning only (implementation in separate plan)

### Task 4.1: Research Building Removal

- [ ] Investigate how buildings are stored in the world/tile system
- [ ] Determine if buildings leave persistent tile data that can be identified
- [ ] Check if `TilesActions` has a `clearAllSquare` or similar function
- [ ] Assess if building removal requires tracking placed building tiles

### Task 4.2: Design Removal Approach

- [ ] Option A: Clear all tiles in area (destructive, simple)
- [ ] Option B: Track placed building tiles, selectively remove (complex, precise)
- [ ] Option C: Undo/redo system for building operations (most complex)
- [ ] Document recommended approach and create sub-plan

### Task 4.3: Create Sub-Plan Document

- [ ] Create `.workspace/PLAN-MAPTOOLS-BuildingRemoval.md` with:
  - Chosen approach and rationale
  - Implementation tasks
  - Integration points with existing tool system
  - Estimated effort

---

## File Summary

| File | Type | Phase |
|------|------|-------|
| `IsoGame/tools/buildingConfigRegistry.ts` | NEW | 1 |
| `IsoGame/tools/toolRegistry.ts` | MODIFY | 1 |
| `IsoGame/tools/structureTools.ts` | NEW | 2 |
| `web/js/gameWorker.ts` | MODIFY | 2 |
| `web/js/menu/toolMenu.ts` | MODIFY | 3 |
| `web/js/main.ts` | MODIFY | 3 |
| `.workspace/PLAN-MAPTOOLS-BuildingRemoval.md` | NEW | 4 |

---

## Message Protocol Summary

| Direction | Action | Payload | Phase |
|-----------|--------|---------|-------|
| Worker → Main | `buildingConfigList` | `{ configs: BuildingConfigEntry[] }` | 2 |
| Main → Worker | `setBuildingConfig` | `{ configId: string }` | 3 |
| Main → Worker | `setBuildingParams` | `{ growLoop: number, endLoop: number }` | 3 |

---

## Estimated Effort

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| Phase 1 | Config Registry (2 tasks) | 0.5 day |
| Phase 2 | Structure Tools (2 tasks) | 0.5 day |
| Phase 3 | Building UI (4 tasks) | 0.5 day |
| Phase 4 | Removal Planning (3 tasks) | 0.5 day |
| **Total** | **11 tasks** | **2 days** |

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Building configs may not exist for all types | Verify all 6 configs exist in `conf/` directory; create missing ones if needed |
| `WcBuildingFactoryGenarator` may have side effects | Test with small `growLoopCount` values; monitor world state |
| Slider ranges may not match valid parameter ranges | Test with boundary values; add validation in worker handler |
| Building removal complexity | Keep removal as separate sub-plan; implement simple clear-first approach |

---

## Implementation Order

1. **Phase 1** → Create config registry and extend ToolRegistry
2. **Phase 2** → Implement place building tool and register in worker
3. **Phase 3** → Add building config UI to tool menu
4. **Phase 4** → Research and plan building removal

Each phase can be tested independently before proceeding to the next.