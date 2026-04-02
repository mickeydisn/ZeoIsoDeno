# Phase 3: Tile Group Compression

**Goal:** Implement logic to detect tile groups when extracting existing configs
**Dependencies:** Phase 2

## Tasks

- [x] Task: Implement tile group detection algorithm
  - Detail: Create function that detects tiles sharing identical face property
  - File: `IsoGame/wcBuilding2/editor/extractionEngine.ts`
  - Logic: Group tiles by face signature, check for rotation symmetry

- [x] Task: Implement rotation group detection
  - Detail: Detect sets of 4 tiles that are exact rotation variants of each other
  - File: `IsoGame/wcBuilding2/editor/extractionEngine.ts`

- [x] Task: Implement configurable compression thresholds
  - Detail: Minimum number of tiles required to form a group
  - File: `IsoGame/wcBuilding2/editor/extractionEngine.ts`

- [x] Task: Preserve source traceability
  - Detail: Maintain sourceGetter and sourceCollection fields in compressed groups
  - File: `IsoGame/wcBuilding2/editor/extractionEngine.ts`

- [ ] Task: Preserve source traceability
  - Detail: Maintain sourceGetter and sourceCollection fields in compressed groups
  - File: `IsoGame/wcBuilding2/editor/extractionEngine.ts`