# Plan: Building Editor Module Refactoring

The `IsoGame/wcBuilding2/editor` module and its frontend counterpart `IsoGame/wcBuilding2/editor/web/js/` provide a config extraction, validation, migration, and HTTP API system for an isometric building editor. A code review identified structural issues primarily around file size, code duplication, and type safety gaps. The largest files are `server.ts` (1564 lines), `tile.ts` (975 lines), `extractor.ts` (725 lines), `validation.ts` (618 lines), `migration.ts` (444 lines), and `api.ts` (463 lines). The approach is to split these into domain-focused modules under 350 lines each, extract shared logic into helpers, and improve TypeScript type safety throughout. No behavioral changes are expected — this is pure refactoring with improved maintainability. Key risks include breaking import paths and ensuring the HTTP API remains compatible with the frontend. Testing will be done by verifying each endpoint still works after refactoring.

## Phases

- [ ] Phase 1: Infrastructure — Centralized paths, shared types, and utility modules (3/4 tasks done)
- [ ] Phase 2: Server Refactoring — Split server.ts into domain-based route modules
- [ ] Phase 3: Backend Module Splitting — Split extractor.ts, validation.ts, migration.ts
- [ ] Phase 4: Frontend Refactoring — Split tile.ts panel and api.ts service
- [ ] Phase 5: Type Safety & Cleanup — Fix `any` casts, serializable types, and polish