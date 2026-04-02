# Phase 2: Core Logic Implementation

**Goal:** Implement group expansion logic and integrate with existing pipeline
**Dependencies:** Phase 1

## Tasks

- [x] Task: Import confsGroup_to_confsTile in loader.ts
  - Detail: Add import from "../wcUtils.ts"
  - File: `IsoGame/wcBuilding2/editor/loader.ts`

- [x] Task: Implement group expansion in loading pipeline
  - Detail: When loading config, if groups exist, expand them to tiles and merge with existing tiles array
  - File: `IsoGame/wcBuilding2/editor/loader.ts`
  - Note: Expansion happens at load time, stored config remains untouched

- [x] Task: Update sanitizer.ts to handle groups
  - Detail: Add sanitization logic for group objects and group items
  - File: `IsoGame/wcBuilding2/editor/sanitizer.ts`

- [ ] Task: Update validate.ts for group validation
  - Detail: Add validation rules:
    - Group face exists and has exactly 4 entries
    - Group items array is not empty
    - Group items do not have face property defined
    - Group weight is valid number
  - File: `IsoGame/wcBuilding2/editor/validate.ts`

- [ ] Task: Update extraction engine pass-through
  - Detail: Ensure groups are preserved during extraction round-trip
  - File: `IsoGame/wcBuilding2/editor/extractionEngine.ts`