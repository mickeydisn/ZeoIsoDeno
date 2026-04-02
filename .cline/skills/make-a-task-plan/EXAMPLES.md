# Plan Examples (Illustrative - adapt format to your project)

The examples below demonstrate the output format. Replace project-specific references with your actual codebase structure.

## Example 1: Feature Implementation

### PLAN-SUMMARY.md

```md
# Plan: [Your Feature Name]

[Replace with your 200-token context covering: problem being solved, current codebase state, proposed technical approach, key design decisions, scope assumptions, and major risks with mitigations. Be specific to your project's architecture and tech stack.]

## Phases

- [ ] Phase 1: Foundation - Core types, interfaces, and utilities
- [ ] Phase 2: Core Logic - Service layer and business rules
- [ ] Phase 3: Data Layer - Persistence and storage integration
- [ ] Phase 4: Integration - Connect to existing systems and APIs
- [ ] Phase 5: Polish - Testing, optimization, and documentation
```

### PLAN-PHASE-1.md

```md
# Phase 1: Foundation

**Goal:** Establish core types, interfaces, and utility modules needed for the feature
**Dependencies:** None

## Tasks

- [ ] Define domain types and interfaces
  - Create file: `src/types/[DomainName].ts` (adjust path to your project)
  - Include JSDoc comments for each exported type
  - Export from barrel file `src/types/index.ts`

- [ ] Create utility module for shared logic
  - File: `src/utils/[FeatureName].ts`
  - Extract any reusable functions that don't depend on feature state
  - Write unit tests alongside implementation

- [ ] Update project configuration if needed
  - Add new dependencies to package manager or import map
  - Configure environment variables or settings files
```

### PLAN-PHASE-2.md

```md
# Phase 2: Core Logic

**Goal:** Implement the service layer and business rules
**Dependencies:** Phase 1 completed

## Tasks

- [ ] Create main service class
  - File: `src/services/[ServiceName].ts`
  - Constructor accepts dependencies via dependency injection
  - Implement core business logic methods one at a time

- [ ] Implement validation layer
  - File: `src/validators/[ValidatorName].ts`
  - Define validation schemas or rules for all input data
  - Include error messages and edge case handling
```

### PLAN-PHASE-3.md

```md
# Phase 3: Data Layer

**Goal:** Add persistence, caching, and data access patterns
**Dependencies:** Phase 2 core service interfaces defined

## Tasks

- [ ] Define repository interface
  - File: `src/repositories/[EntityName]Repository.ts`
  - Methods: findById, findAll, save, delete - match your use cases

- [ ] Implement repository with actual storage
  - Use your project's database, ORM, or file system
  - Handle connection pooling or resource management

- [ ] Add caching layer if needed
  - File: `src/cache/[CacheName].ts`
  - Define TTL, invalidation strategy, and cache key format
```
