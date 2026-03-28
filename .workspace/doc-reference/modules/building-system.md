# Building System

> Files: `IsoGame/wcBuilding2/`

## Purpose

Cellular automaton-based procedural building generation with configurable growth patterns.

## Core Classes

### WcBuildingFactoryGenarator

```ts
class WcBuildingFactoryGenarator {
  world: World
  conf: AbstractBuildConf
}
```

#### `start2(x, y)`

Launches building generation at the given coordinates:
1. Creates initial `WcBuildTile` at position
2. Runs growth loop based on configuration
3. Places tiles and updates map

### AbstractBuildConf

Base configuration class for building behavior:

```ts
interface AbstractBuildConf {
  growLoopCount: number    // Growth iterations per step
  endLoopMax: number       // Maximum total iterations
  faceConf: FaceConfig     // Visual configuration
}
```

### WcBuildConf_GraveA

Preset configuration for graveyard-style buildings:
- Grow loops: 20
- End loop max: 100
- Dark stone aesthetic

## WcBuildTile

Represents a single building tile:

```ts
class WcBuildTile {
  x: number
  y: number
  level: number
  face: WcBuildFace
}
```

## WcBuildFace

Visual representation of a building face:

```ts
class WcBuildFace {
  north: FaceStyle
  east: FaceStyle
  top: FaceStyle
}
```

Each face has style properties for color, texture, and shading.

## Growth Algorithm

The building grows using cellular automaton rules:

1. **Seed**: Place initial tile
2. **Grow**: Each iteration, check neighboring tiles
3. **Expand**: Place new tiles based on rules:
   - Adjacent to existing tiles
   - Within configured bounds
   - Random chance based on configuration
4. **Terminate**: Stop when `endLoopMax` reached or no valid placements

## WcBuildTileDrawer

Renders building tiles onto the isometric canvas with proper face visibility and shading.

## WcUtils

Shared utilities for building calculations:
- Neighbor detection
- Boundary checking
- Random value generation