# Building Generator — Enhanced Algorithm Proposal

## Core Principle

Buildings grow from a seed tile outward on a 2D grid using constraint propagation and weighted selection. Each tile has a visual representation (floor, wall, fence, house, etc.) but the algorithm operates purely on 2D face connections.

---

## Growth Graph

Replace sequential tile processing with a frontier-based growth graph.

### Graph Structure

Each tile position is a **node** with:
- Position (x, y)
- Possible face configurations
- Configured face (if resolved)
- Neighbor links in four directions
- Entropy (count of remaining options)
- Distance from seed

The **frontier** contains all unconfigured nodes adjacent to configured nodes.

### Composite Scoring

Frontier nodes are prioritized by composite score:

- **Shape Alignment**: How well the position fits the target shape
- **Constraint Pressure**: Fewer valid options = higher priority
- **Neighbor Influence**: High-weight neighbors boost score
- **Entropy Bonus**: Most constrained nodes resolve first

---

## Shape Budgets

Each building type declares a shape budget guiding growth:

- **Shape Type**: Circle, rectangle, cross, organic
- **Target Radius**: Desired distance from seed to edge
- **Target Area**: Desired total tile count
- **Symmetry**: None, mirror, or rotational
- **Aspect Ratio**: Width-to-height ratio for rectangular shapes

The generator actively steers toward predicted shapes rather than filling arbitrarily.

---

## Tile Types

Tiles are 2D grid cells with different visual representations:

- **Floor**: Empty space, walkable
- **Fence**: Wall only, no roof
- **House**: Wall with roof on top
- **House Level 2**: Two walls with roof on top (taller)
- **Wall**: Solid vertical barrier
- **Door**: Passable opening in wall
- **Corner**: 90-degree turn piece
- **Boundary**: Building edge

All tiles use the same 2D face connection rules regardless of visual height.

---

## Semantic Faces

Replace complex prefixed keys with semantic categories and attributes.

### Categories

- **Empty**: Open air, walkable space
- **Wall**: Solid vertical barrier
- **Fence**: Semi-transparent barrier
- **Door**: Passable opening
- **Corner**: 90-degree turn piece
- **Boundary**: Building edge
- **Floor**: Walkable surface

### Attributes

- **Interior / Exterior**: Location context
- **Left / Right**: Directional orientation
- **Connectable**: Can connect to similar faces
- **Exclusive**: Must connect to specific complementary face

### Compatibility Rules

Explicit rules replace implicit naming conventions:
- Boundary connects to boundary or fence exterior
- Fence interior connects to fence exterior or floor
- Wall exterior connects to wall interior
- Door exterior connects to door interior

---

## Emergence Patterns

Borrow from Wave Function Collapse for pattern prediction.

### Pattern Templates

Each building type declares:
- **Shape Patterns**: Expected form, density, edge type
- **Growth Direction**: Outward, inward, or layered
- **Required Features**: Entrance, interior spaces

### Entropy-Based Prioritization

Nodes with fewer valid options resolve first, preventing contradictions before they occur.

---

## Implementation

### Phase 1: Graph Foundation
Core data structures and frontier management.

### Phase 2: Shape Prediction
Budget system and scoring functions.

### Phase 3: Semantic Faces
Simplified face model and compatibility rules.

### Phase 4: Pattern Templates
Emergence prediction and validation.

---

## References

- **ARD-REVIEW-REF-graph-growth.md** — Growth graph and scoring
- **ARD-REVIEW-REF-semantic-faces.md** — Face categories and rules
- **ARD-REVIEW-REF-advanced-config.md** — Link types, contextual weights, templates, conditions
- **ARD-REVIEW-generic-config.md** — Layer-based configuration, composition patterns
- **ARD-REVIEW-generic-config-v2.md** — Group-based system, connection propagation
