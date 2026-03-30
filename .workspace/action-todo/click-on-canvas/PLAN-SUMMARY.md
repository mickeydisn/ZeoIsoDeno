# Plan Summary: Canvas Click-to-Tile Detection

## Context

The current implementation uses a CSS-transformed div grid overlay (`IsoGame/mapIso/grid.ts`) to handle click interactions on the isometric canvas. This approach has critical issues:

- **Misalignment**: CSS 3D transforms (`rotateX(60deg) rotateZ(45deg)`) don't precisely match the mathematical isometric projection used by `IsometricProjector`
- **Zoom Issues**: The div grid doesn't properly scale with zoom levels
- **Mode Changes**: Grid alignment breaks when switching modes
- **Performance**: Maintaining a parallel DOM structure alongside canvas rendering is inefficient

## Objective

Replace the CSS-based grid overlay with a mathematically precise **inverse projection** system that converts screen coordinates directly to tile coordinates. This eliminates DOM manipulation for click detection and provides pixel-perfect accuracy at any zoom level.

## Global Plan Architecture

The plan is divided into **12 phases**, each building upon the previous:

| Phase | File | Description | Status |
|-------|------|-------------|--------|
| 1 | `PLAN-PHASE-01-inverse-projection.md` | Add inverse projection methods to `IsometricProjector` | ✓ Completed |
| 2 | `PLAN-PHASE-02-canvas-click-handler.md` | Create `CanvasClickHandler` class for click/mouse events | ✓ Completed |
| 3 | `PLAN-PHASE-03-integration-grid-replacement.md` | Integrate with canvas renderer and replace grid system | ✓ Completed |
| 4 | `PLAN-PHASE-04-hover-visual-feedback.md` | Add hover highlighting and coordinate tooltip | ✓ Completed |
| 4b | `PLAN-PHASE-04b-height-aware-overlay.md` | Height-aware overlay with diagonal search | ✓ Completed |
| 4c | `PLAN-PHASE-04c-height-aware-overlay-final.md` | Simplified height-aware overlay with direct tile lookup | ✓ Completed |
| 5 | `PLAN-PHASE-05-edge-detection.md` | Detect clicks near tile edges for precise placement | Pending |
| 6 | `PLAN-PHASE-06-multi-tile-selection.md` | Drag-to-select multiple tiles with Shift key | Pending |
| 7 | `PLAN-PHASE-07-context-menu.md` | Right-click context menu with tile actions | Pending |
| 8 | `PLAN-PHASE-08-keyboard-modifiers.md` | Keyboard modifiers for different click actions | Pending |
| 9 | `PLAN-PHASE-09-distance-measurement.md` | Measure distance between two tiles | Pending |
| 10 | `PLAN-PHASE-10-path-visualization.md` | Draw path lines connecting tile waypoints | Pending |
| 11 | `PLAN-PHASE-11-tile-history-undo-redo.md` | Undo/redo system for tile changes | Pending |
| 12 | `PLAN-PHASE-12-performance-optimizations.md` | Spatial indexing and rendering optimizations | Pending |

## Key Technical Decisions

1. **Inverse Projection Mathematics**: Solve the system of equations from the forward projection to convert `(screenX, screenY)` to `(tileX, tileY, tileZ)`
2. **Worker Architecture Preservation**: Maintain the existing `SharedArrayBuffer` pattern for worker communication; click detection happens on the main thread using shared map data
3. **Incremental Migration**: Phase 3 allows gradual replacement of grid system while maintaining backward compatibility
4. **Canvas-Only Approach**: All interactions handled through canvas events, no DOM overlay required

## Files Modified

- `IsoGame/mapIso/simpleIso/IsometricProjector.ts` - Add inverse projection
- `IsoGame/mapIso/canvasClickHandler.ts` - New file (Phase 2)
- `IsoGame/mapIso/canvasMapDrawer.ts` - Add hover support (Phase 4)
- `IsoGame/mapIso/grid.ts` - Simplify to wrapper (Phase 3)
- `web/js/main.ts` - Update initialization (Phase 3)

## Success Criteria

- Click detection accuracy matches mathematical projection (pixel-perfect)
- Works correctly at all zoom levels (`SCALE_SIZE` variations)
- Works with varying tile heights (`mapLvl` data)
- No DOM overlay required for click detection
- Hover feedback renders on canvas
- Existing game worker communication preserved