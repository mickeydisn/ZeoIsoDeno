# Plan: Tile Group Support for Building Editor

## Context
The `confsGroup_to_confsTile()` function in wcUtils.ts automatically expands compact tile groups into full rotated tile variations, but the editor currently only supports manually defining every single tile. This causes massive duplication: users must manually duplicate face properties and create all 4 rotation variants for every tile.

This plan implements full native support for tile groups in the editor while maintaining 100% backward compatibility.

### Key Decisions:
✅ Backward compatible: existing configs work unchanged
✅ Mixed mode: both tiles and groups can coexist in same config
✅ Round-trip safe: groups remain groups through edit/save cycle
✅ Automatic expansion happens only at load time

### Scope:
- Type definitions
- Loader expansion logic
- Validation & sanitization
- Editor UI components
- Migration path

### Risks:
- Low risk: all changes are additive
- Expansion logic is already battle tested in production code
- Full validation coverage prevents invalid groups

## Phases

- [x] Phase 1: Type System Foundation - Add group interfaces and schema updates
- [x] Phase 2: Core Logic - Loader expansion, sanitizer, validator
- [x] Phase 3: Extraction Support - Compression from tiles to groups
- [x] Phase 4: Editor UI Integration - Group editing components
- [ ] Phase 5: Validation & Migration - Schema version upgrade
