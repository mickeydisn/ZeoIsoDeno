# Building Generator Algorithm — Complete Reference Document

## Introduction

This document describes a **procedural building generation algorithm** designed for isometric tile-based game environments. The system generates complex architectural structures—houses, laboratories, graveyards, manors—using a **constraint-based propagation system** combined with **weighted random selection**.

The core philosophy is simple yet powerful: each tile in the grid is assigned a **face configuration** that describes its connectivity on all four cardinal directions. The algorithm grows outward from a seed tile, ensuring that neighboring tiles maintain valid connections through a propagation mechanism. The result is organic, coherent building layouts that respect architectural rules while introducing variety through controlled randomness.

The generator excels at producing:
- **Perimeter structures**: Fences, walls, and barriers that define building boundaries
- **Interior spaces**: Rooms, corridors, and open areas within structures
- **Transition zones**: Entrances, doors, and passages between different architectural zones
- **Decorative elements**: Corners, inner corners, and special architectural features

---

## Core Concepts

### 1. The Face System

The fundamental data structure is the **Face**—a 4-element tuple representing the connections on each side of a tile:

```
Face = [NorthWest, NorthEast, SouthEast, SouthWest]
```

Each element in the face is a **Face Key**—a string identifier that describes the type of connection. Examples include:
- `"X"`: Boundary or exterior edge (no connection beyond)
- `"F_out"`: Fence exterior side
- `"WH_in"`: Wall house interior side
- `"0"`: Open space
- `null`: Undefined or any connection

The face key `"X"` is special—it represents the edge of the building, meaning no further expansion is possible in that direction.

### 2. Face Links — The Connection Rules

**Face Links** define which face keys can connect to each other. They are bidirectional pairing rules:

```
FaceLinks = [
  ["F_out", "X"],      // Fence outside connects to boundary
  ["F_in", "FP_out"],  // Fence inside connects to fence platform outside
  ["WH_l", "WH_r"],    // Wall house left connects to wall house right
  ...
]
```

When the algorithm needs to determine what configurations are valid for a tile, it checks each neighbor's face key and looks up which keys are compatible via the face links.

### 3. Face Weights — Controlling Density and Style

Each face key has an associated **weight** that influences how often that configuration appears:

```javascript
faceLinkWeight = {
  "F_out": 0,    // Fence outside (low = rare expansion)
  "F_in": 10,    // Fence inside (medium)
  "WH_in": 30,   // Wall house interior (high = common)
  "X": 0,        // Boundary (never chosen as expansion)
}
```

Higher weights mean:
- The configuration is more likely to be selected randomly
- The configuration is preferred during "close" operations (filling gaps)
- Interior spaces (high weight) naturally expand more than exterior edges (low weight)

### 4. Tile Configurations

A **Tile Configuration** defines:
- **Face**: The 4-element face tuple
- **Assets**: Visual elements to render (3D models, sprites)
- **Weight**: Selection probability
- **Flags**: Special behaviors (allow movement, is boundary frise, etc.)

```javascript
{
  face: ["WH_r", "WH_l", "WH_out", "WH_out"],
  weight: 30,
  assets: [
    { key: "wallCorner", h: 0 },
    { key: "roofCorner", h: 1 }
  ],
  allowMove: false,
  isFrise: true
}
```

---

## The Generation Algorithm

### Phase 1: Initialization

1. **Set Starting Position**: Choose coordinates (x, y) as the building's seed
2. **Load Configuration**: Initialize the building configuration, which prepares:
   - Start tile options (typically entrance configurations)
   - List of all possible tile configurations
   - Face link rules
   - Face weight values
3. **Create First Tile**: Apply a random start configuration to the seed tile
4. **Add Neighbors**: Register the four neighboring tiles for processing

### Phase 2: Growth Loop

The growth phase expands the building outward. Each iteration:

1. **Process Forced Tiles**: Tiles with exactly ONE possible face configuration are immediately assigned that configuration. These are "forced" because there's no choice—the constraints dictate the only valid option.

2. **Process Open Tiles**: Tiles with multiple possible configurations are prioritized by **score**:
   - Score is calculated based on:
     - **Depth**: Tiles closer to the seed have higher priority (1000000 - depth)
     - **Face Weights**: The maximum weight among configured neighbors' face keys
   - The highest-scored tile is selected
   - A configuration is chosen using **weighted random selection**
   - The configuration is applied with **constraint propagation**

3. **Repeat**: Continue until the growth loop count is exhausted or no more open tiles exist

### Phase 3: Closure Loop

After growth, the algorithm fills remaining gaps:

1. **Process Forced Tiles**: Same as growth phase
2. **Process Close Tiles**: Tiles with possible faces containing `null` values are processed:
   - The configuration with the LOWEST weight sum is chosen
   - This ensures that "closing" configurations (boundaries, edges) are preferred
   - The goal is to create clean building edges

### Phase 4: Cleanup

Any remaining unconfigured tiles that have faces with `null` values are set to `["X", "X", "X", "X"]`—the universal boundary configuration.

---

## Constraint Propagation

The heart of the algorithm is **constraint propagation**. When a tile's face is set, the system:

1. **Saves State**: Stores the current possible faces for all affected tiles
2. **Applies Configuration**: Sets the face on the target tile
3. **Propagates Outward**: For each neighbor:
   - Compute new possible faces based on the updated neighbor
   - Filter out incompatible configurations
   - If the possible faces change, continue propagation to that neighbor's neighbors
4. **Validates**: If any tile ends up with zero possible configurations, the propagation fails
5. **Commits or Rollsback**: 
   - If valid: Clear saved states (commit)
   - If invalid: Restore all tiles to their saved states (rollback)

This ensures that **no invalid configuration can ever persist** in the building.

### Propagation Example

```
Tile A is set to face ["F_out", "F_out", "F_r", "F_l"]
  → Neighbor to the right must have "F_l" on its left side
    → Neighbor's possible faces are filtered to only those with "F_l" at position [3]
      → This neighbor's right side must connect to something compatible
        → Propagation continues...
```

---

## Weighted Random Selection

When multiple configurations are valid, the algorithm uses weighted random selection:

1. Calculate total weight of all valid configurations
2. Generate a random number between 0 and total weight
3. Accumulate weights until the random threshold is exceeded
4. Return the configuration that crossed the threshold

This ensures:
- High-weight configurations appear frequently (common building patterns)
- Low-weight configurations appear rarely (special features)
- Zero-weight configurations are never randomly selected (only forced)

---

## Architectural Patterns

### Fences and Perimeters

Fences define building boundaries using a three-layer system:
- **Outer Fence** (`F_out`): The exterior edge, connects to boundary (`X`)
- **Fence Platform** (`FP_out`): A transition zone between fence and wall
- **Inner Space** (`0`): Open area or wall interior

The algorithm creates fences by:
1. Starting with an entrance configuration
2. Expanding fence segments along the perimeter
3. Using corner and inner-corner pieces for turns
4. Closing with boundary tiles when expansion ends

### Walls and Rooms

Walls define interior spaces with:
- **Wall segments**: Flat wall pieces (`WH_out`, `WH_in`, `WH_r`, `WH_l`)
- **Corners**: Where two walls meet (`WH_r`, `WH_l` on adjacent sides)
- **Doors**: Special wall pieces with door openings (`WH_outD`)
- **Inner corners**: Where walls turn inward (`WH_in`, `WH_in`)

### Corridors

Corridors are narrow passages using:
- **Flat segments**: Straight corridor pieces
- **Turns**: Corner corridor pieces
- **T-junctions**: Where corridors split
- **Cross-junctions**: Where corridors intersect
- **Ends**: Dead ends or doorways

### Collapse Prevention

The algorithm includes mechanisms to prevent unwanted square formations:

1. **NoSquare Mode**: Adds special face keys (`#X` suffix) to corner pieces, preventing two corners from forming a square
2. **Exclude Mode**: More aggressive prevention using `#Xc` and `#Xi` suffixes to exclude specific corner combinations

---

## Configuration Variants

### House Configuration
- **Layers**: Outer fence → Fence platform → Wall → Interior
- **Features**: Doors, windows, roof variations
- **Style**: Compact, enclosed spaces

### Laboratory Configuration
- **Layers**: Fence → Platform → Corridor network → Wall
- **Features**: Long corridors, T-junctions, cross-junctions
- **Style**: Linear, connected spaces

### Graveyard Configuration
- **Layers**: Iron fence → Grave plots → Altar area
- **Features**: Bone decorations, altar pieces, grave markers
- **Style**: Open, sparse layout

### Manor Configuration
- **Layers**: Ornate fence → Platform → Multiple wall layers
- **Features**: Large rooms, decorative corners
- **Style**: Expansive, elegant

---

## Asset Assignment

When a tile configuration is applied, visual assets are assigned:

1. **Height Layers**: Assets can be stacked at different heights (h=0, h=1, h=2)
2. **Rotation**: Assets are rotated to match the face orientation using `keyR` (0-3)
3. **Color Tinting**: A suffix string applies color transformations
4. **Offset**: Fine-tuning position adjustments

Example:
```javascript
assets: [
  { key: "wallCorner", h: 0, keyR: 2, sufix: "#H200_S20_C135_B105" },
  { key: "roofCorner", h: 1, keyR: 3, sufix: "#H0_S1_C128_B64" }
]
```

---

## Performance Characteristics

- **Time Complexity**: O(n × p) where n is tile count and p is propagation depth
- **Space Complexity**: O(n) for tile storage, O(n × f) for face possibilities
- **Typical Generation**: 50-200 tiles in under 100ms
- **Propagation Limit**: 200 iterations per tile to prevent infinite loops

---

## Summary

The building generator is a constraint-satisfaction system that:

1. **Represents** architectural rules as face compatibility graphs
2. **Grows** structures outward from a seed point
3. **Propagates** constraints to ensure global consistency
4. **Selects** configurations using weighted randomness
5. **Fills** gaps with low-weight closure patterns
6. **Renders** 3D assets based on final configurations

The result is a flexible, extensible system that can generate diverse architectural styles from a single algorithmic core, controlled entirely through configuration data rather than hard-coded logic.

---

## Bonus Features and Extensions

### 6. Dynamic Destruction
Track structural dependencies. Removing a supporting tile causes cascading collapse of dependent tiles above.

### 9. Building Clusters
Generate multiple buildings simultaneously, ensuring they don't overlap and share common courtyards or pathways.

### 11. Door and Window Placement Rules
Add constraints for:
- Minimum distance between doors
- Window placement only on exterior walls
- Emergency exit requirements for large buildings

### 12. Roof Generation
Separate roof generation from wall generation, allowing complex roof shapes (gabled, hipped, flat) based on building footprint.

### 14. Historical Progression
Generate buildings in stages, simulating construction over time. Older sections use different materials than newer additions.
