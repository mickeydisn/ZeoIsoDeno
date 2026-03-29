# Growth Graph — Technical Reference

## Graph Structure

The growth graph replaces sequential tile processing with a frontier-based expansion system.

### Node Properties

Each node represents a tile position:

- **Position**: x, y coordinates
- **Level**: Height level (0 = ground, 1 = upper, 2 = roof)
- **Possible Faces**: List of valid face configurations
- **Configured Face**: Applied face, if resolved
- **Neighbors**: Links to adjacent nodes in four directions
- **Entropy**: Count of remaining options
- **Distance From Seed**: Steps from the starting tile

### Edge Properties

Edges connect adjacent nodes:

- **Source and Target**: Connected nodes
- **Direction**: Cardinal direction of the connection
- **Required Face Key**: What the source requires on this edge

---

## Frontier Management

The frontier is the set of unconfigured nodes adjacent to configured nodes.

### Operations

- **Add**: When a node is configured, its unconfigured neighbors join the frontier
- **Remove**: Configured nodes leave the frontier
- **Score**: Each frontier node receives a composite score

### Composite Scoring

Each frontier node is scored using four factors:

**Shape Alignment (0-1000)**
How well the position matches the target shape. Circle shapes favor consistent radius. Rectangle shapes favor cardinal alignment. Cross shapes favor axial positions.

**Constraint Pressure (0-500)**
Nodes with fewer valid options score higher. This ensures constrained nodes resolve before contradictions emerge.

**Neighbor Influence (0-300)**
High-weight neighbors boost the score. This encourages compatible growth patterns.

**Entropy Bonus (0-100)**
Lower entropy (fewer options) receives higher priority. This is the core constraint-propagation principle.

---

## Shape Budget

Shape budgets guide growth toward predictable forms.

### Properties

- **Shape Type**: Circle, rectangle, cross, or organic
- **Target Radius**: Desired distance from seed to edge
- **Target Area**: Desired total tile count
- **Aspect Ratio**: Width-to-height ratio for rectangles
- **Symmetry**: None, mirror, or rotational
- **Level Budgets**: Min, max, and target tile counts per level

### Shape Types

**Circle**: Tiles at consistent distance from seed score highest. Deviations reduce score.

**Rectangle**: Tiles aligned to cardinal directions score higher. Diagonal positions receive penalties.

**Cross**: Tiles along primary axes score highest. Interior corners receive bonuses.

**Organic**: No shape constraints. Growth follows only constraint propagation and weights.

### Symmetry

When enabled, each node checks for a mirrored counterpart. Matching configurations receive a bonus, creating balanced buildings.

---

## Growth Algorithm

### Initialization

1. Create seed node at starting position
2. Apply starting tile configuration
3. Create edges to four neighbors
4. Add unconfigured neighbors to frontier

### Growth Phase

1. Score all frontier nodes
2. Select highest-scored node
3. Attempt configuration using weighted random selection
4. If successful:
   - Add new neighbors to frontier
   - Propagate constraints
   - Re-score affected nodes
5. If unsuccessful:
   - Mark as problematic
   - Continue with next node
6. Repeat until target area reached or frontier empty

### Closure Phase

1. Process remaining frontier with low-weight preferences
2. Fill gaps with boundary configurations
3. Clean up unconfigured tiles

---

## Constraint Propagation

When a node is configured:

1. Save current state of affected nodes
2. Apply new configuration
3. For each neighbor:
   - Recompute valid faces
   - If changed, continue propagation
4. If any node has zero valid faces:
   - Rollback all changes
   - Configuration fails
5. If all nodes have valid faces:
   - Commit changes
   - Clear saved states

Propagation is limited to 200 iterations to prevent infinite loops.

---

## Performance

- **Graph construction**: O(n)
- **Frontier scoring**: O(f) where f is frontier size
- **Propagation**: O(p × d) where p is depth, d is degree
- **Overall**: O(n log n) for typical buildings