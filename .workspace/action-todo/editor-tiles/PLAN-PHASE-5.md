# Phase 5: Validation & Migration

**Goal:** Final validation, schema migration and documentation
**Dependencies:** All previous phases

## Tasks

- [ ] Task: Implement schema migration from 1.0 to 1.1
  - Detail: Add migration logic that automatically updates old configs
  - File: `IsoGame/wcBuilding2/editor/migration.ts`
  - Note: Migration is optional, old configs work without modification

- [ ] Task: Update all validation tests
  - Detail: Add group test cases to test_extraction.ts
  - File: `IsoGame/wcBuilding2/editor/test_extraction.ts`

- [ ] Task: Add group API endpoints
  - Detail: Update preview and validation routes to handle groups
  - File: `IsoGame/wcBuilding2/editor/routes/preview.ts`
  - File: `IsoGame/wcBuilding2/editor/routes/validation.ts`

- [ ] Task: Update documentation
  - Detail: Add group format documentation in editor README.md
  - File: `IsoGame/wcBuilding2/editor/README.md`

- [ ] Task: Full integration testing
  - Detail: Test complete flow:
    - Create group in editor
    - Save config
    - Load config
    - Validate expansion works correctly
    - Round-trip edit cycle preserves groups

- [ ] Task: Performance testing
  - Detail: Verify group expansion does not impact load times for large configs