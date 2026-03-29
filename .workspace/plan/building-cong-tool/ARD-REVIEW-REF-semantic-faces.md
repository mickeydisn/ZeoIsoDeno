# Semantic Face Model — Technical Reference

## Overview

The semantic face model replaces complex prefixed keys with a cleaner system based on categories and attributes. This makes configurations more readable and compatibility rules more explicit.

---

## Face Categories

Each face key belongs to one of these categories:

### Empty
Represents open air or walkable space. No physical structure exists at this face.

### Wall
A solid vertical barrier. Walls define room boundaries and provide structural support.

### Fence
A barrier that is not fully solid. Fences define property boundaries but allow visibility and air flow.

### Door
A passable opening in a wall. Doors allow movement between interior spaces.

### Corner
A piece that turns the building facade. Corners connect two wall or fence segments at right angles.

### Boundary
The edge of the building where no further expansion occurs. Represents the absolute limit of the structure.

### Floor
A horizontal surface that can be walked on. Floors define the ground level of interior spaces.

### Roof
The upper exterior surface of the building. Roofs protect interior spaces from weather.

---

## Face Attributes

Attributes modify the base category to provide additional semantic meaning:

### Location Attributes

**Interior**: This face is inside the building. Interior faces connect to other interior elements.

**Exterior**: This face is outside the building. Exterior faces connect to boundaries or outdoor elements.

### Direction Attributes

**Left**: This face is on the left side of the component when facing outward.

**Right**: This face is on the right side of the component when facing outward.

### Connection Attributes

**Connectable**: This face can connect to other faces of the same category.

**Exclusive**: This face must connect to a specific complementary face, not just any face of the same category.

### Weight Attributes

**Weight High**: This face is preferred during expansion. The algorithm will favor configurations using this face.

**Weight Low**: This face is avoided during expansion. Only used when no other options exist.

---

## Semantic Face Structure

A semantic face combines a category with a set of attributes:

```
SemanticFace {
  category: FaceCategory
  attributes: Set<FaceAttribute>
}
```

Examples:
- Wall interior right: `{ category: WALL, attributes: {INTERIOR, RIGHT} }`
- Fence exterior left: `{ category: FENCE, attributes: {EXTERIOR, LEFT} }`
- Door exterior: `{ category: DOOR, attributes: {EXTERIOR} }`
- Floor interior: `{ category: FLOOR, attributes: {INTERIOR} }`

---

## Compatibility Rules

Instead of implicit compatibility through naming conventions, the semantic model uses explicit rules.

### Rule Structure

Each rule defines which faces can connect:

```
CompatibilityRule {
  source: [FaceCategory, ...attributes]
  target: [FaceCategory, ...attributes]
}
```

### Standard Rules

**Boundary Rules**:
- Boundary connects to boundary
- Boundary connects to fence exterior

**Fence Rules**:
- Fence interior connects to fence exterior
- Fence interior connects to floor interior

**Wall Rules**:
- Wall exterior connects to wall interior
- Wall interior connects to floor interior

**Corner Rules**:
- Corner left connects to corner right
- Corner left connects to wall interior

**Door Rules**:
- Door exterior connects to door interior
- Door interior connects to floor interior

### Rule Evaluation

To check if two faces are compatible:

1. Find all rules where the source matches the first face
2. Check if the target matches the second face
3. If any rule matches, the faces are compatible
4. If no rules match, the faces cannot connect

### Wildcard Matching

Attributes can be omitted from rules to create wildcards:

- `[WALL]` matches any wall face regardless of attributes
- `[FENCE, EXTERIOR]` matches only fence faces with the exterior attribute

---

## Configuration Mapping

### From Legacy to Semantic

Complex prefixed keys map to semantic faces:

| Legacy Key | Semantic Face |
|------------|---------------|
| `WH_out` | Wall exterior |
| `WH_in` | Wall interior |
| `WH_l` | Wall left |
| `WH_r` | Wall right |
| `WH_outD` | Door exterior |
| `F_out` | Fence exterior |
| `F_in` | Fence interior |
| `F_l` | Fence left |
| `F_r` | Fence right |
| `FP_out` | Fence exterior (platform variant) |
| `FP_in` | Fence interior (platform variant) |
| `0` | Floor interior |
| `X` | Boundary |

### Modifier Suffixes

Legacy modifier suffixes become attributes:

| Suffix | Attribute |
|--------|-----------|
| `#X` | Exclusive |
| `#Xc` | Exclusive, Corner |
| `#Xi` | Exclusive, Interior |
| `#Open` | Connectable |
| `#Door` | Door category |

---

## Weight System

### Category Weights

Each category has a base weight that influences expansion:

| Category | Base Weight | Expansion Preference |
|----------|-------------|---------------------|
| Floor | 30 | High (fills interior) |
| Wall Interior | 25 | High (defines rooms) |
| Wall Exterior | 5 | Low (creates boundaries) |
| Fence Interior | 10 | Medium (transition zone) |
| Fence Exterior | 0 | None (hard boundary) |
| Door | 15 | Medium (creates openings) |
| Corner | 5 | Low (creates turns) |
| Boundary | 0 | None (never expanded) |
| Roof | 10 | Medium (covers top) |

### Attribute Modifiers

Attributes modify the base weight:

- **Interior**: +5 (prefer interior expansion)
- **Exterior**: -5 (discourage exterior expansion)
- **Connectable**: +10 (prefer expandable faces)
- **Exclusive**: -10 (avoid restrictive faces)
- **Weight High**: +20 (strongly prefer)
- **Weight Low**: -20 (strongly avoid)

### Final Weight Calculation

Final weight equals base weight plus all attribute modifiers, clamped to minimum 0.

---

## Transition Detection

### From-to Transitions

The semantic model enables clean transition detection:

- **Fence to Wall**: Fence interior → Wall exterior
- **Wall to Interior**: Wall interior → Floor interior
- **Door Connection**: Door exterior → Door interior
- **Corner Turn**: Wall left → Corner → Wall right

### Layer Transitions

Vertical transitions between levels:

- **Floor to Ceiling**: Floor interior at level N → Floor interior at level N+1
- **Wall to Roof**: Wall exterior at top level → Roof at level above
- **Stair Connection**: Floor interior → Stair → Floor interior at next level

---

## Configuration Benefits

### Readability

Semantic faces are immediately understandable:
- `Wall interior` is clearer than `WH_in`
- `Fence exterior left` is clearer than `F_out_l`

### Maintainability

Adding new building types requires only new category combinations, not new naming conventions.

### Extensibility

New categories and attributes can be added without breaking existing configurations.

### Validation

The rule system enables automatic validation:
- Check that all faces have compatible neighbors
- Detect impossible configurations before generation
- Suggest corrections for invalid setups