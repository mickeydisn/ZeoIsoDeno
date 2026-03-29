# Advanced Configuration — Technical Reference

## Link Types

Face links have different connection strengths beyond simple compatible/incompatible.

### Link Strength Categories

**Strong Link**: Both faces must match exactly. Failure to match prevents configuration.

**Weak Link**: Faces should match but can be overridden if no other option exists. Useful for preferred connections that aren't mandatory.

**Optional Link**: Faces may match but don't need to. Useful for decorative elements that connect to multiple things.

**Negative Link**: Faces must NOT match. Prevents unwanted adjacencies (e.g., two doors next to each other).

### Link Priority

When multiple links apply to the same connection, priority determines which takes effect:

1. Negative links (highest priority - prevent bad patterns)
2. Strong links (enforce required connections)
3. Weak links (preferred but not required)
4. Optional links (lowest priority)

---

## Contextual Weights

Face weights can change based on local context rather than being static.

### Weight Modifiers

**Distance Modifier**: Weight changes based on distance from seed or edge. Interior faces get bonus near center, exterior faces get bonus near edge.

**Neighbor Modifier**: Weight changes based on what's already configured nearby. If three neighbors are walls, the fourth wall gets a bonus.

**Type Modifier**: Weight changes based on tile type. Floor tiles expand easily, wall tiles create boundaries.

**Density Modifier**: Weight changes based on how full the current level is. Early growth favors expansion, late growth favors closure.

### Weight Calculation

Final weight equals:
```
base_weight 
× distance_modifier 
× neighbor_modifier 
× type_modifier 
× density_modifier
```

---

## Configuration Templates

Reusable building blocks that compose into larger configurations.

### Template Structure

A template defines:
- **Name**: Identifier for reference
- **Base Configuration**: Starting face patterns
- **Variations**: Alternative patterns for the same template
- **Constraints**: Rules that apply when template is active

### Template Inheritance

Configurations can inherit from parent templates:
- Child inherits all faces from parent
- Child can override specific faces
- Child can add new faces not in parent
- Multiple inheritance merges faces from all parents

### Template Composition

Multiple templates can be combined:
- Union: All faces from all templates
- Intersection: Only faces common to all templates
- Priority: Higher-priority template faces override lower-priority

---

## Conditional Configuration

Faces can be selected based on conditions rather than always being available.

### Condition Types

**Neighbor Condition**: Face is valid only if specific neighbor configuration exists.

**Count Condition**: Face is valid only if a certain number of similar faces exist nearby.

**Distance Condition**: Face is valid only at certain distances from seed or edge.

**Type Condition**: Face is valid only for specific tile types.

**Random Condition**: Face has a probability of being valid (for organic variation).

### Condition Evaluation

Conditions are evaluated when computing possible faces:
1. Check all conditions for each face
2. If any condition fails, remove face from possibilities
3. If all conditions pass, face remains available

---

## Feature Placement Rules

Specific rules for placing doors, windows, and other features.

### Door Rules

- Minimum distance between doors: 2 tiles
- Doors only on exterior walls
- Doors prefer corners of buildings
- Doors cannot face each other across narrow spaces

### Window Rules

- Windows only on exterior walls
- Windows prefer walls with good exterior view
- Minimum spacing between windows: 1 tile
- Windows cannot be directly above/below doors (structural weakness)

### Corner Rules

- Corners connect two wall segments
- Corner pieces have left/right variants
- Inner corners connect interior walls
- Corner weight affects building shape (low weight = more organic)

---

## Tile Type Dependencies

Explicit dependencies between tile types in the building.

### Dependency Types

**Must Exist**: Certain tiles require other tiles to exist nearby.

**Must Not Exist**: Certain tiles cannot coexist with other tiles.

**Should Exist**: Preferred but not required tile relationships.

### Dependency Examples

- House tiles prefer adjacent floor tiles
- Doors require wall tiles on adjacent sides
- Corners connect two wall segments
- Fences mark building perimeter

---

## Seed Determinism

Same seed always produces same building.

### Seed Propagation

- Each tile gets a deterministic random value from seed
- Tile random value = hash(seed + position)
- Weighted selection uses tile's random value
- Same seed + position = same tile selection

### Variation Control

- Different seeds produce different buildings
- Same seed produces identical buildings
- Small seed changes (seed+1) produce noticeably different results
- Useful for reproducible procedural generation

---

## Building Clusters

Multiple buildings that relate to each other.

### Cluster Properties

- **Shared Paths**: Buildings connected by walkways
- **Courtyards**: Open spaces between buildings
- **Alignment**: Buildings aligned to common grid or axis
- **Spacing**: Minimum distance between buildings

### Cluster Generation

1. Place first building using standard algorithm
2. Identify cluster expansion directions
3. Place subsequent buildings with spacing constraints
4. Generate paths between buildings
5. Fill courtyards with appropriate tiles

---

## Terrain Adaptation

Building generation adapts to underlying terrain.

### Terrain Properties

- **Height**: Ground elevation at each position
- **Slope**: Angle of terrain
- **Material**: Ground type (grass, stone, water)

### Adaptation Rules

- Buildings prefer flat terrain
- Steep slopes prevent building placement
- Water tiles require special foundation
- Terrain height affects building height offset

---

## Dynamic Link Resolution

Links can be resolved at generation time based on context.

### Link Templates

Links can reference templates that expand based on context:
- `{type}_out` resolves to `F_out` for fences, `WH_out` for walls
- Links adapt to whatever component is being placed

### Link Inheritance

Links defined at component level inherit to all tiles:
- Fence component defines `F_out → X`
- All fence tiles automatically get this link
- Individual tiles can override inherited links

---

## Configuration Validation

Automatic checks ensure configuration correctness.

### Validation Rules

- All faces must have at least one compatible neighbor face
- No circular dependencies in face links
- Start tiles must be compatible with at least one expansion tile
- Weight values must be non-negative
- Tile type constraints must be achievable

### Validation Output

- List of unconnected faces
- List of impossible configurations
- Warnings for suboptimal weights
- Suggestions for improvement