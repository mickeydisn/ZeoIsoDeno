# Architectural Patterns — Configuration Reference

## Pattern Overview

The building generator uses a layered approach to create architectural structures. Each layer defines a specific architectural component with its own face keys, weights, and visual assets.

---

## Fence Patterns

### Basic Fence Structure

```
Exterior → [X] → [F_out] → [F_in] → Interior
```

The fence creates a perimeter boundary around the building.

#### Face Keys

| Key | Direction | Meaning |
|-----|-----------|---------|
| `F_out` | Outward | Exterior side of fence |
| `F_in` | Inward | Interior side of fence |
| `F_l` | Left | Left side (for corners) |
| `F_r` | Right | Right side (for corners) |

#### Weight Distribution

```javascript
faceLinkWeight = {
  "F_out": 0,    // Never expand outward (boundary)
  "F_l": 5,      // Corner pieces (rare)
  "F_r": 5,      // Corner pieces (rare)
  "F_in": 10,    // Interior side (common)
}
```

#### Configuration Types

**Flat Segment**
```
Face: [F_in, F_l, F_out, F_r]
Purpose: Straight fence section
```

**Corner**
```
Face: [F_out, F_out, F_r, F_l]
Purpose: 90-degree turn
```

**Inner Corner**
```
Face: [F_in, F_in, F_l, F_r]
Purpose: Interior corner (concave)
```

### Fence Collapse Prevention

To prevent two corners from forming an unwanted square:

**NoSquare Mode**
```
Adds #X suffix to corner face keys:
- F_l#X
- F_r#X

These keys can only connect to non-X variants.
```

**Exclude Mode**
```
Adds #Xc and #Xi suffixes:
- F_l#Xc (corner variant)
- F_r#Xc (corner variant)
- F_l#Xi (inner variant)
- F_r#Xi (inner variant)

Complex linking rules prevent specific corner combinations.
```

---

## Fence Platform Patterns

### Purpose

The fence platform is a transition zone between the outer fence and the inner wall. It provides visual depth and architectural interest.

### Structure

```
Fence → [FP_out] → [FP_in] → Wall
```

#### Face Keys

| Key | Meaning |
|-----|---------|
| `FP_out` | Exterior (connects to fence interior) |
| `FP_in` | Interior (connects to wall exterior) |
| `FP_l` | Left side |
| `FP_r` | Right side |

#### Weight Distribution

```javascript
faceLinkWeight = {
  "FP_out": 0,   // Connects to fence
  "FP_r": 15,    // Right side (medium)
  "FP_l": 15,    // Left side (medium)
  "FP_in": 20,   // Interior (common)
}
```

---

## Wall Patterns (House Style)

### Layered Structure

Walls consist of multiple visual layers:

```
Layer 0 (h=0): Wall base
Layer 1 (h=1): Roof
Layer 2 (h=2): Roof peak (optional)
```

### Face Keys

| Key | Meaning |
|-----|---------|
| `WH_out` | Exterior wall |
| `WH_outD` | Exterior wall with door |
| `WH_in` | Interior wall |
| `WH_l` | Left side |
| `WH_r` | Right side |
| `WH_lX` | Left with X-connection |
| `WH_rX` | Right with X-connection |

### Configuration Types

**Wall Segment**
```javascript
{
  face: ["WH_r", "WH_in", "WH_l", "WH_out"],
  assets: [
    { key: "wall", h: 0, keyR: 1 },
    { key: "roof", h: 1, keyR: 3 }
  ]
}
```

**Wall with Door**
```javascript
{
  face: ["WH_r", "WH_in", "WH_l", "WH_outD"],
  assets: [
    { key: "wallDoor", h: 0, keyR: 1 },
    { key: "roof", h: 1, keyR: 3 }
  ]
}
```

**Corner**
```javascript
{
  face: ["WH_r", "WH_l", "WH_out", "WH_out"],
  assets: [
    { key: "wallCorner", h: 0, keyR: 2 },
    { key: "roofCorner", h: 1, keyR: 3 }
  ]
}
```

**Inner Corner**
```javascript
{
  face: ["WH_in", "WH_in", "WH_l", "WH_r"],
  assets: [
    { key: "roofCornerInner", h: 1, keyR: 3 }
  ]
}
```

**Full Interior**
```javascript
{
  face: ["WH_in", "WH_in", "WH_in", "WH_in"],
  assets: [
    { key: "wallBlock", h: 1, keyR: 0 },
    { key: "roofPoint", h: 2, keyR: 3 }
  ]
}
```

### Interior Corner X-Variant

For buildings with complex shapes:

```javascript
{
  face: ["WH_in", "WH_in", "WH_lX", "WH_rX"],
  assets: [
    { key: "roofCornerInner", h: 1, keyR: 3 }
  ]
}
```

The `lX` and `rX` variants allow corners to connect to boundary tiles without creating conflicts.

---

## Corridor Patterns

### Purpose

Corridors create narrow passages between rooms or connect different building sections.

### Face Keys

| Key | Meaning |
|-----|---------|
| `CL_out` | Exterior corridor end |
| `CL_outD` | Exterior with door |
| `CL_in` | Interior corridor |

### Configuration Types

**Straight Corridor**
```javascript
{
  face: ["CL_in", "CL_out", "CL_in", "CL_out"],
  assets: [{ key: "corridor_", h: 0 }]
}
```

**Corridor with Door**
```javascript
{
  face: ["CL_in", "CL_out", "CL_outD", "CL_out"],
  assets: [
    { key: "platform_center", h: 0 },
    { key: "corridor_end", h: 0, keyR: 2 }
  ]
}
```

**Corner Corridor**
```javascript
{
  face: ["CL_in", "CL_in", "CL_out", "CL_out"],
  assets: [{ key: "corridor_corner", h: 0, keyR: 3 }]
}
```

**T-Junction**
```javascript
{
  face: ["CL_in", "CL_in", "CL_in", "CL_out"],
  assets: [{ key: "corridor_split", h: 0 }]
}
```

**Cross-Junction**
```javascript
{
  face: ["CL_in", "CL_in", "CL_in", "CL_in"],
  assets: [{ key: "corridor_cross", h: 0 }]
}
```

---

## Entrance Patterns

### Purpose

Entrances provide the starting point for building generation and define how the building connects to the exterior.

### Simple Entrance

```javascript
{
  face: ["E_Door", "E_l", "E_out", "E_r"],
  color: [12, 12, 16],
  empty: true
}
```

### Open Entrance

```javascript
{
  face: ["E#Open", "E#Open", "E#Door", "E#Open"],
  color: [12, 12, 16],
  empty: true
}
```

### Face Keys

| Key | Meaning |
|-----|---------|
| `E_out` | Exterior side |
| `E_l` | Left side |
| `E_r` | Right side |
| `E_Door` | Door opening |
| `E#Open` | Open variant |
| `E#Door` | Door variant |

---

## Boundary Patterns

### Purpose

Boundary tiles mark the edge of the building where no further expansion occurs.

### Universal Boundary

```javascript
{
  face: ["X", "X", "X", "X"],
  empty: true,
  color: [64, 64, 64]
}
```

### Partial Boundaries

```javascript
{ face: ["X", null, null, null] }
{ face: ["X", "X", null, null] }
{ face: ["X", null, "X", null] }
{ face: ["X", "X", "X", null] }
```

These represent tiles at the building's edge where only some sides are bounded.

---

## Open Space Patterns

### Purpose

Open spaces represent interior empty areas that are walkable.

### Configuration

```javascript
{
  face: ["0", "0", "0", "0"],
  empty: true,
  color: [128, 128, 128],
  allowMove: true,
  isFrise: true
}
```

### Mixed Open Space

```javascript
{
  face: ["0in", "0", "0", "0"],
  empty: true,
  allowMove: true,
  isFrise: true
}
```

The `0in` variant connects to wall interiors.

---

## Configuration Composition

### The applyGroup Pattern

The `applyGroup` utility applies common properties to multiple configurations:

```javascript
applyGroup([
  { face: ["WH_r", "WH_in", "WH_l", "WH_out"], weight: 30 },
  { face: ["WH_r", "WH_in", "WH_l", "WH_outD"], weight: 30 },
  { face: ["WH_r", "WH_l", "WH_out", "WH_out"], weight: 10 },
], {
  allowMove: false,
  isFrise: true,
  functions: actionsEmpty
})
```

This avoids repetition and ensures consistency.

### The tagFaces Pattern

The `tagFaces` utility adds suffixes to specific face keys:

```javascript
tagFaces(config, [["r", "#X"], ["l", "#X"]])
```

This transforms:
- `F_r` → `F_r#X`
- `F_l` → `F_l#X`

Used for creating NoSquare variants.

---

## Color System

### Color Suffix Format

Visual assets use color suffixes for tinting:

```
#H{hue}_S{saturation}_C{contrast}_B{brightness}
```

Example: `#H200_S20_C135_B105`

- **H**: Hue (0-360)
- **S**: Saturation (0-100)
- **C**: Contrast (128 = normal)
- **B**: Brightness (128 = normal)

### Random Color Generation

Each building gets a unique color scheme:

```javascript
const rand = Math.floor(Math.random() * 255);

colorConf = {
  FENCE_SUFFIX: `#H${rand + 10}_S50_C150_B115`,
  WALL_SUFFIX: `#H${rand}_S20_C150_B115`
}
```

This ensures visual variety while maintaining coherence within a building.

---

## Weight Strategy

### Interior vs Exterior

| Zone | Weight Range | Purpose |
|------|--------------|---------|
| Interior (in) | 20-50 | Common, fills space |
| Sides (l, r) | 5-20 | Medium, connects pieces |
| Exterior (out) | 0-5 | Rare, creates boundaries |

### Growth vs Closure

During **growth phase**:
- Higher weights expand more
- Interior spaces dominate

During **closure phase**:
- Lower weights are preferred
- Boundaries and edges fill gaps

### Special Weights

| Weight | Meaning |
|--------|---------|
| 0 | Never selected randomly |
| 0.01 | Minimum (default) |
| 1-5 | Rare features |
| 10-20 | Common features |
| 30+ | Very common |

---

## Building Type Comparison

| Type | Layers | Style | Complexity |
|------|--------|-------|------------|
| House | Fence → Platform → Wall | Compact | Low |
| Manor | Fence → Platform → Wall (thick) | Expansive | Medium |
| Lab | Fence → Platform → Corridor → Wall | Linear | High |
| Grave | Iron Fence → Grave → Altar | Open | Medium |

Each type uses the same core algorithm but different configuration data, demonstrating the system's flexibility.