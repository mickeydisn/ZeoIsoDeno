# Face System — Technical Reference

## Face Structure Deep Dive

### The 4-Direction Model

The face system uses a 4-element array representing the four cardinal directions of an isometric tile:

```
Index 0: NorthWest (NW)
Index 1: NorthEast (NE)  
Index 2: SouthEast (SE)
Index 3: SouthWest (SW)
```

This ordering follows the natural flow of isometric projections where tiles are viewed from above at a 45-degree angle.

### Face Key Types

#### Special Keys

| Key | Meaning | Behavior |
|-----|---------|----------|
| `null` | Undefined | Can match any connection; used for expansion |
| `""` | Empty string | Similar to null but explicit |
| `"X"` | Boundary | Hard edge; no expansion beyond this point |
| `"0"` | Open space | Interior empty area; walkable |

#### Prefixed Keys

Face keys use a prefix-based naming convention to identify their architectural component:

```
{ComponentTag}_{Direction}{Modifiers}
```

Examples:
- `F_out`: Fence, outside direction
- `F_l`: Fence, left side
- `F_r`: Fence, right side
- `F_in`: Fence, inside direction
- `WH_out`: Wall House, outside
- `WH_outD`: Wall House, outside with Door
- `WH_lX`: Wall House, left with X-connection

#### Modifier Suffixes

Modifiers alter connection behavior:

| Suffix | Meaning | Purpose |
|--------|---------|---------|
| `#X` | X-connection variant | NoSquare prevention |
| `#Xc` | X-connection corner | Exclude mode corner |
| `#Xi` | X-connection inner | Exclude mode inner corner |
| `#Open` | Open variant | Entrance/exit |
| `#Door` | Door variant | Passable opening |
| `#CL` | Corridor link | Connects to corridor |

### Face Rotation

When a configuration is loaded, it generates 4 rotated versions:

```javascript
Original:  [A, B, C, D]
Rotate 1:  [D, A, B, C]  // Shift right by 1
Rotate 2:  [C, D, A, B]  // Shift right by 2
Rotate 3:  [B, C, D, A]  // Shift right by 3
```

This ensures that any configuration can be placed in any orientation while maintaining valid connections.

---

## Constraint Propagation Algorithm

### Step-by-Step Process

#### 1. State Preservation

Before applying any configuration, the system saves the current state:

```javascript
savePossibleFace() {
  this.savePossibleFace = this.possibleFace;
}
```

This creates a rollback point if propagation fails.

#### 2. Initial Application

The target tile's face is set:

```javascript
applyPossibleFace([face]) {
  this.possibleFace = [face];
  this.isFaceConfigured = true;
}
```

#### 3. Neighbor Discovery

The algorithm finds neighbors that need processing:

```javascript
nearActifNodeWcBuild() {
  // For each of the 4 directions
  // Check if neighbor exists and is not configured
  // Check if neighbor has any valid configurations
  // Return list of active neighbors
}
```

#### 4. Propagation Loop

The main propagation loop:

```javascript
while (currentNode && iterations < 200) {
  // Compute new possible faces for current node
  newPosibleFace = currentNode.computePosibleFace;
  
  if (newPosibleFace.length == 0) {
    // No valid configurations - propagation failed
    isValide = false;
    break;
  }
  
  if (!equalFaceList(currentNode.possibleFace, newPosibleFace)) {
    // Faces changed - apply and continue propagation
    currentNode.applyPossibleFace(newPosibleFace);
    
    // Add new neighbors to processing queue
    newNode = currentNode.nearActifNodeWcBuild;
    for (node of newNode) {
      if (!openNodeSet.has(node)) {
        openNode.push(node);
        openNodeSet.add(node);
      }
    }
  }
  
  // Move to next node
  currentNode = openNode.shift();
}
```

#### 5. Possible Face Computation

The core computation that determines valid faces for a tile:

```javascript
computePosibleFace() {
  // Start with all possible faces from configuration
  possibleFace = [...configuration.listFaceKey];
  
  for (axe = 0; axe < 4; axe++) {
    // Get neighbor's possible faces
    nearPosibleFace = neighbor[axe]?.possibleFace;
    
    if (!nearPosibleFace) continue;
    
    // Get the face key on the connecting side of neighbor
    // (axe + 2) % 4 gives the opposite direction
    nearAxeFace = Set(nearPosibleFace.map(f => f[(axe + 2) % 4]));
    
    // Get all face keys that can link to these
    nearAxeFaceLink = Set(
      nearAxeFace.map(face => 
        face === null 
          ? null 
          : configuration.linkedFaceKey(face)
      ).flat()
    );
    
    // Filter current possible faces
    possibleFace = filterAxeFacesKey(possibleFace, axe, nearAxeFaceLink);
  }
  
  return possibleFace;
}
```

#### 6. Rollback on Failure

If propagation fails:

```javascript
if (!isValide) {
  for (tile of allNode) {
    tile.undoPossibleFace();  // Restore saved state
    tile.isFaceConfigured = false;
  }
}
```

---

## Face Link Resolution

### The Linking Process

When checking if two face keys can connect:

1. **Direct Match**: Both sides have the same key (e.g., `"X"` connects to `"X"`)
2. **Link Lookup**: The configuration's `faceLinks` array contains pairs
3. **Bidirectional**: Links are automatically made bidirectional during initialization

### Link Initialization

```javascript
// Original links
faceLinks = [
  ["F_out", "X"],
  ["F_in", "FP_out"],
]

// After initialization (bidirectional)
faceLinks = [
  ["F_out", "X"],
  ["X", "F_out"],
  ["F_in", "FP_out"],
  ["FP_out", "F_in"],
]
```

### Link Query

```javascript
linkedFaceKey(face) {
  // Find all links where face is the source
  filterLink = faceLinks.filter(link => 
    face === null 
      ? link[0] === null 
      : link[0] === face
  );
  
  // Return the target face keys
  return filterLink.map(link => link[1]);
}
```

---

## Scoring System

### Score Calculation

Each tile's score determines its priority during growth:

```javascript
score() {
  // Base score from depth (closer to seed = higher)
  baseScore = 1000000 - this.depth;
  
  // Additional score from configured neighbors' face weights
  neighborScores = [];
  for (axe = 0; axe < 4; axe++) {
    if (neighbor[axe]?.isFaceConfigured) {
      weight = faceLinkWeight[face[axe]] || 0;
      neighborScores.push(weight);
    }
  }
  
  maxNeighborScore = Math.max(...neighborScores, 0);
  
  return baseScore + maxNeighborScore;
}
```

### Score Interpretation

- **1000000+**: Very high priority (near seed, high-weight neighbors)
- **100-1000**: Medium priority (mid-distance, moderate weights)
- **0-100**: Low priority (far from seed, low-weight neighbors)
- **0**: Zero priority (no valid configurations or score)

---

## Weighted Random Selection

### Algorithm

```javascript
pickRandomWeightedObject(array, rand) {
  // Calculate total weight
  totalWeight = array.reduce((acc, obj) => acc + (obj.weight || 0.01), 0);
  
  // Generate random threshold
  randomWeight = (rand || Math.random()) * totalWeight;
  
  // Accumulate until threshold exceeded
  accumulatedWeight = 0;
  for (obj of array) {
    accumulatedWeight += (obj.weight || 0.01);
    if (accumulatedWeight >= randomWeight) {
      return obj;
    }
  }
  
  return null; // Should not happen
}
```

### Weight Behavior

- **weight = 0**: Never selected randomly (only forced)
- **weight = 0.01**: Minimum weight (default for unweighted)
- **weight = 1-10**: Low probability
- **weight = 10-50**: Medium probability
- **weight = 50+**: High probability

### Deterministic Mode

When a `rand` parameter is provided (e.g., from tile's random seed), the selection becomes deterministic for that tile, ensuring the same building always generates the same way from the same seed.

---

## Edge Cases and Special Handling

### Null Face Handling

Null faces represent "don't care" conditions:

```javascript
// Null can link to anything
if (face === null) {
  return null; // Matches any face key
}
```

### Empty Configuration Lists

If a tile has no valid configurations:
- During growth: The tile is skipped
- During closure: The tile gets `["X", "X", "X", "X"]` boundary
- During propagation: The entire propagation path is rolled back

### Path Compatibility

Tiles marked as path/frise get special handling:

```javascript
if (tile.isFrise) {
  configuredFace = ["X", "X", "X", "X"];
  possibleFace = [configuredFace];
  isFaceConfigured = true;
  isFaceConfiguredType = "Path_compatibility";
}
```

This ensures paths don't interfere with building generation.

---

## Performance Optimization

### Indexing

The configuration pre-builds an index for fast face key lookups:

```javascript
indexTileOptions_KeyFaceKey = {
  "X|X|X|X": [config1, config2, ...],
  "F_out|F_out|F_r|F_l": [config3, ...],
  // ...
}
```

### Set Operations

Using JavaScript Sets for deduplication:

```javascript
nearAxeFace = [...new Set(nearPosibleFace.map(f => f[(axe + 2) % 4]))];
```

### Early Termination

The propagation loop terminates early when:
- No more nodes to process (success)
- A tile has zero valid configurations (failure)
- Iteration limit reached (failure with timeout)