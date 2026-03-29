# Phase 9: Distance Measurement

## Context

Users need to measure the distance between two tiles for planning movement, construction, or understanding spatial relationships. The measurement tool uses two clicks: first click sets start point, second click sets end point. The distance is calculated in tile space and displayed visually.

## Objective

Implement a distance measurement tool that calculates and displays the Euclidean distance between two clicked tiles.

## Tasks

### Task 9.1: Create `DistanceMeasurer` class

- [ ] Create new file `IsoGame/mapIso/distanceMeasurer.ts`
- [ ] Track state: `startPoint: PointIso | null`, `endPoint: PointIso | null`, `isMeasuring: boolean`
- [ ] Store reference to canvas and projector

### Task 9.2: Implement measurement start

- [ ] Add `startMeasurement(tile: PointIso)` method
- [ ] Set `startPoint` to provided tile
- [ ] Set `isMeasuring = true`
- [ ] Clear any previous measurement

### Task 9.3: Implement measurement update

- [ ] Add `updateMeasurement(tile: PointIso)` method
- [ ] Update `endPoint` while measuring
- [ ] Redraw measurement line on canvas

### Task 9.4: Implement measurement end

- [ ] Add `endMeasurement(): { distance: number, dx: number, dy: number, dz: number } | null` method
- [ ] Calculate Euclidean distance: `sqrt(dx*dx + dy*dy + dz*dz)`
- [ ] Return distance and component deltas
- [ ] Reset measuring state

### Task 9.5: Implement measurement rendering

- [ ] Create measurement line overlay element
- [ ] Draw line between start and end screen positions
- [ ] Display distance value near the line midpoint
- [ ] Use dashed line style for visual distinction
- [ ] Hide overlay when measurement is cancelled

### Task 9.6: Implement measurement cancellation

- [ ] Add `cancelMeasurement()` method
- [ ] Clear start and end points
- [ ] Hide measurement overlay
- [ ] Listen for Escape key to cancel

### Task 9.7: Add measurement mode integration

- [ ] Add `isActive(): boolean` method
- [ ] Integrate with click handler for measurement mode
- [ ] First click: start measurement
- [ ] Second click: end measurement and show result
- [ ] Support keyboard shortcut to enter measurement mode

## Files Modified

- `IsoGame/mapIso/distanceMeasurer.ts` (new file)

## Dependencies

- Phase 1 complete (inverse projection)

## Verification

1. Click two tiles and verify distance is calculated correctly
2. Verify measurement line renders between the two points
3. Verify distance value displays near the line
4. Press Escape to cancel and verify measurement clears
5. Verify measurement works with tiles at different heights
6. Verify distance formula matches Euclidean distance in tile space