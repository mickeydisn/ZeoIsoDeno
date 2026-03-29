# ARD: Building Configuration Tool — Algorithm Review & Demonstrator Plan

> **Action Request Document**  
> Focus: Algorithm review of `IsoGame/wcBuilding2` building generator + plan for a standalone config/test demonstrator  
> No code, no integration — pure algorithm description and tool story

---

## 1. Introduction

The **WcBuilding2** module is a **procedural building generator** for an isometric tile-based game. It uses a **constraint propagation algorithm** inspired by Wave Function Collapse (WFC) to procedurally generate buildings (houses, manors, graves, labs, etc.) on a 2D grid.

### Core Idea

Each tile on the grid has 4 sides (NW, NE, SE, SW). Each side has a **face key** — a string label like `"F_out"`, `"WH_in"`, `"X"`, or `null`. A **building configuration** defines:
- A set of possible tile types (each with a specific 4-face signature)
- A linking graph describing which face keys can connect to which
- Weighted probabilities for tile selection

The generator starts from a seed tile, then **grows outward** by selecting compatible tile types for neighboring cells, using constraint propagation to ensure global consistency.

### Key Properties

| Property | Description |
|---|---|
| **Algorithm Family** | Constraint Propagation (WFC-inspired) |
| **Grid Type** | 2D Orthogonal (4-connected neighbors) |
| **Tile Signature** | `[NW_face, NE_face, SE_face, SW_face]` |
| **Face Compatibility** | Bidirectional link graph with weighted edges |
| **Growth Strategy** | Priority-based (forced → open → close) |
| **Rollback** | Per-attempt propagation with undo on failure |

---

## 2. Core Concepts & Data Model

### 2.1 Face System (`wcBuildFace.ts`)

The fundamental abstraction is the **Face** — a string label representing the "type" of a tile edge.

```
WcKeyFace  = string | null          // A single face key, e.g. "F_out", "WH_in", null
WcFace     = [WcKeyFace, WcKeyFace, WcKeyFace, WcKeyFace]  // 4 sides: [NW, NE, SE, SW]
WcKeyTileFace = string              // Serialized face, e.g. "F_out|null|WH_in|F_l"
```

**Special face keys:**
- `null` — open/unconnected side (wildcard for growth)
- `"X"` — boundary/external edge (no connection possible)
- Named keys like `"F_out"`, `"WH_in"`, `"E_l"` — typed connections

**Face Linking:** Two tiles can be neighbors on axis `i` if `tileA.face[i]` links to `tileB.face[(i+2) % 4]`. The link graph defines which keys connect.

### 2.2 Tile Configuration (`wcAbstractBuildConf.ts`)

Each building type is defined by a `WcAbstractBuildConf` subclass that provides:

#### Face Link Graph
```typescript
faceLinks: [string, string][]       // Bidirectional pairs: ["F_in", "FP_out"]
faceLinkWeight: Record<string, number>  // Weight per face key (higher = more likely)
```

#### Tile Options
```typescript
startTileOptions: WcConfTile[]      // Possible seed tiles (placed first)
listTileOptions: WcConfTile[]       // All possible tiles for growth phase
indexTileOptions_KeyFaceKey: Record<WcKeyTileFace, WcConfTile[]>  // Lookup by face signature
```

#### WcConfTile Structure
```typescript
interface WcConfTile {
  face: WcFace;                     // [NW, NE, SE, SW] face keys
  weight: number;                   // Selection probability weight
  assets?: WcConfTileAsset[];       // Visual assets to place
  functions?: WcConfTileFunction[]; // Post-placement actions (terrain smoothing, etc.)
  color?: [number, number, number]; // Tile color
  allowMove?: boolean;              // Is this tile walkable?
  isFrise?: boolean;                // Is this a floor/frieze tile?
  empty?: boolean;                  // Clear existing items?
  h?: number;                       // Height offset
  lvl?: number;                     // Level/z-layer
}
```

### 2.3 Tile Rotation (`wcUtils.ts`)

Each `WcConfTile` definition is **automatically rotated 4 times** (0°, 90°, 180°, 270°) during initialization:
- The face array is cyclically shifted
- Asset keys get directional suffixes (`_NW`, `_NE`, `_SE`, `_SW`)
- Key rotation (`keyR`) adjusts the suffix offset

This means defining one tile variant automatically creates all 4 rotations.

### 2.4 Tile State (`wcBuildTile.ts`)

Each cell in the grid is represented by a `WcBuildTile` with:

```typescript
possibleFace: WcFace[]              // Currently possible face configurations
isFaceConfigured: boolean           // Has this tile been finalized?
configuredFace: WcFace              // The chosen face (once configured)
```

The tile maintains its own constraint state and can compute/reduce its possibilities based on neighbors.

---

## 3. Algorithm: Building Generation Process

### 3.1 Phase 1: Initialization

```
1. Pick a starting position (x, y)
2. Call configuration.init():
   - Convert raw tile groups into flat tile lists
   - Generate 4 rotations for each tile
   - Build index: face_signature → [WcConfTile[]]
   - Build list of all possible face keys
3. Place the seed tile:
   - Select from TILE_START_OPTIONS (weighted random)
   - Apply face configuration via tryApplyFace()
   - Mark as configured
```

### 3.2 Phase 2: Growth Loop

The growth uses a **priority queue** approach:

```
For each iteration (up to growLoopCount):
  
  1. FORCED TILES — process tiles with exactly 1 possible face
     - These must be configured (no choice)
     - Process immediately
  
  2. OPEN TILES — process tiles with expansion possibilities
     - Sort by score (higher = more constrained = higher priority)
     - Score = 1000000 - depth + max_face_weight
     - Pick highest score, select from its possibilities (weighted random)
  
  3. If neither list has tiles, growth is complete
```

### 3.3 Phase 3: Closing Loop

After growth, remaining unconfigured tiles are closed:

```
For each iteration (up to endLoopMax):
  
  1. FORCED TILES — same as growth phase
  
  2. CLOSE TILES — tiles with closing possibilities
     - Uses closePossibleFace: sorts by face link weight (ascending)
     - Prefers low-weight faces (boundaries, edges)
     - Forces a single face selection
  
  3. If no more tiles to close, done
```

### 3.4 Constraint Propagation (`tryApplyFace`)

This is the **critical algorithm** — when a face is applied to a tile, constraints propagate to neighbors:

```
tryApplyFace(face):
  1. Apply face to current tile, mark as configured
  2. Initialize propagation frontier with active neighbors
     - Active = neighbors that have NO null faces on the connecting side
  
  3. BFS propagation loop:
     a. Pop next node from frontier
     b. Compute new possible faces from neighbors (computePosibleFace)
     c. If no possibilities → INVALID, rollback all changes
     d. If possibilities changed:
        - Apply new possibilities
        - Add new active neighbors to frontier
     e. Continue until frontier empty or invalid
  
  4. If valid: clear save states, return true
  5. If invalid: undo all changes, return false
```

### 3.5 Face Reduction (`computePosibleFace`)

When computing possible faces for a tile:

```
computePosibleFace:
  1. Start with ALL possible faces from configuration
  2. For each axis (0-3):
     a. Get neighbor's possible faces
     b. Extract the face key on the connecting side (axis + 2) % 4
     c. Get all linked face keys via configuration.linkedFaceKey()
     d. Filter current possibilities to only those matching linked keys
  3. Return filtered list
```

---

## 4. Building Configurations (Examples)

### 4.1 HouseA (`buildConf_HouseA.ts`)

A house with layered structure:
- **X** — External boundary
- **E_** — Entrance (door tiles)
- **F_** — Fence (simple fence border)
- **FP_** — Fence Platform (raised platform layer)
- **0** — Interior floor
- **WH_** — Wall House (walls, corners, windows, doors)

**Layer structure (inside → outside):**
```
WH_in → WH_out → FP_in → FP_out → F_in → F_out → X
```

### 4.2 GraveA (`buildConf_GraveA.ts`)

A graveyard with:
- **X** — External boundary
- **E_** — Entrance
- **FG_** — Fence Grave (iron fence border)
- **FI_** — Fence Interior (bones, altars, interior decorations)
- **0** — Ground

### 4.3 ManorA (`buildConf_ManorA.ts`)

A larger manor building:
- **X** — External boundary
- **F_** — Fence
- **FP_** — Fence Platform
- **0** — Interior
- **WM_** — Wall Manor (thick walls with windows)

### 4.4 Collapse Types

Fence assets support different **collapse behaviors**:

| Type | Description |
|---|---|
| `Simple` | Standard flat/corner/inner tiles |
| `NoSquare` | Adds `#X` tagged variants to prevent 2x2 squares |
| `Exclude` | Adds `#Xc` and `#Xi` variants for more granular exclusion |

---

## 5. Asset System

### 5.1 Tile Assets

Each tile configuration can include **assets** — visual elements placed on the tile:

```typescript
interface WcConfTileAsset {
  key?: string;           // Asset identifier (e.g., "hedgeCorner", "fence_simple")
  keyR?: number;          // Rotation offset
  sufix?: string;         // Color/style suffix (e.g., "#H200_S20_C135_B105")
  h?: number;             // Height offset
  off?: { x: number; y: number };  // Position offset
}
```

### 5.2 Post-Placement Functions

Tiles can trigger **functions** after placement:

```typescript
interface WcConfTileFunction {
  key?: string;           // Function name
  size?: number;          // Affect radius
  off?: { x: number; y: number };
}
```

Common functions:
- `lvlAvgSquare` — Smooth terrain height in area
- `colorSquare` — Set tile color
- `clearItem` — Remove existing items
- `setBlocked` — Mark tile as non-walkable
- `setFrise` — Mark tile as floor

### 5.3 Asset Collections (Reusable Components)

Assets are organized into **collection classes** for reuse:

| Class | Purpose |
|---|---|
| `WcAsset_Fence2` | Base fence with corner/flat/inner variants |
| `WcAsset_FenceSimple` | Simple fence (no inner corner asset) |
| `WcAsset_FencePlatform` | Platform fence (all 3 asset types) |
| `WcAsset_Enter` | Entrance/door tiles |
| `wcAsset_X` | Boundary/edge tiles |

Each collection provides:
- `faceLinkWeight()` — Face key weights
- `getFaceLinks()` — Link pairs for the face graph
- `groupAsset()` — Generated tile configurations

---

## 6. Generation Entry Point (`wcBuildAction.ts`)

The `WcBuildActions` class provides the public API:

```typescript
// Create a building at position
WcBuildActions.getInstance().doAction({
  func: "createBuilding",
  buildingType: "WcBuildConf_HouseA",
  x: 10,
  y: 10,
  growLoopCount: 50,
  endLoopMax: 200
});
```

Available building types:
- `WcBuildConf_HouseA`
- `WcBuildConf_ManorA`
- `WcBuildConf_GraveA`
- `WcBuildConf_RLabA`
- `WcBuildConf_LabBorderA`
- `WcBuildConf_LabPipeA`

---

## 7. Demonstrator Tool Plan

### 7.1 Tool Concept

A **standalone web-based visualizer** that demonstrates the building generation algorithm without game integration. Focus on:
- Visual representation of the constraint propagation
- Step-by-step generation visualization
- Interactive configuration of tile definitions
- No real game assets — use colored blocks and simple shapes

### 7.2 Feature Requirements

#### Core Visualization
- **Grid display** — 2D top-down view of the tile grid
- **Tile rendering** — Colored squares with face labels on edges
- **Face indicators** — Show face keys on each side of each tile
- **Status coloring** — Different colors for configured/unconfigured/error tiles

#### Step-by-Step Generation
- **Play/Pause** — Control generation speed
- **Step forward** — Advance one generation step
- **Step back** — Undo last step (requires state history)
- **Speed control** — Adjust animation speed
- **Phase indicators** — Show current phase (init/grow/close)

#### Constraint Visualization
- **Possible faces overlay** — Show possible face count per tile
- **Propagation highlight** — Highlight tiles being updated during propagation
- **Frontier display** — Show tiles in the propagation queue
- **Score display** — Show priority scores for open tiles

#### Configuration Editor
- **Face link graph editor** — Visual graph of face connections
- **Tile definition editor** — Define tiles with face signatures and weights
- **Weight adjuster** — Modify face link weights
- **Preset configurations** — Load example building types

#### Debug Tools
- **Logging panel** — Step-by-step algorithm logs
- **State inspector** — Click tile to see its current state
- **Rollback visualization** — Show tiles being rolled back on failure
- **Statistics** — Generation time, tile counts, propagation steps

### 7.3 Story Plan

#### Story 1: Basic Grid & Tile Rendering
- Create canvas-based 2D grid renderer
- Implement tile drawing with colored squares
- Draw face labels on tile edges (NW/NE/SE/SW)
- Add grid coordinates display
- **Deliverable:** Empty grid with coordinate system

#### Story 2: Face System Implementation
- Implement face data structures (WcFace, WcKeyFace)
- Create face link graph data structure
- Implement `linkedFaceKey()` lookup
- Implement `computePosibleFace()` algorithm
- **Deliverable:** Face constraint engine working in isolation

#### Story 3: Tile Configuration System
- Implement WcConfTile structure
- Implement tile rotation (4 rotations per definition)
- Implement weighted random selection
- Create face signature indexing
- **Deliverable:** Can define and index tile configurations

#### Story 4: Seed Placement & TryApplyFace
- Implement seed tile placement
- Implement `tryApplyFace()` with propagation
- Implement rollback mechanism
- Visualize propagation in real-time
- **Deliverable:** Single tile placement with visible propagation

#### Story 5: Growth Loop
- Implement forced/open/close priority queues
- Implement scoring system
- Implement full growth loop
- Add step-by-step visualization
- **Deliverable:** Complete building generation with visualization

#### Story 6: Configuration Editor
- Build face link graph editor (drag & drop nodes)
- Build tile definition editor (face selector + weight input)
- Implement preset loader (HouseA, GraveA patterns)
- Add export/import for configurations
- **Deliverable:** Users can define custom building types

#### Story 7: Debug & Analysis Tools
- Add logging panel with filterable logs
- Add state inspector (click tile → see possibleFace list)
- Add propagation statistics
- Add generation replay (step back)
- **Deliverable:** Full debugging toolkit

### 7.4 Technical Approach

#### Technology Stack
- **HTML Canvas** or **SVG** for rendering
- **Vanilla JS/TS** — no framework needed
- **CSS** for UI panels
- Single HTML file or minimal build setup

#### Data Structures (Simplified)
```
FaceKey      = string | null
Face         = [FaceKey, FaceKey, FaceKey, FaceKey]  // [NW, NE, SE, SW]
FaceLink     = [FaceKey, FaceKey]                     // Bidirectional link
TileConfig   = { face: Face, weight: number, color: RGB }
GridCell     = { x, y, possibleFaces: Face[], configured: boolean, face?: Face }
```

#### Rendering Approach
- Grid: NxN cells, each cell is a square
- Face labels: Text on each edge (rotated to match direction)
- Colors: Configured tiles use config color; unconfigured use gray/blue/red by state
- Overlay: Semi-transparent highlight for propagation/frontier

### 7.5 Success Criteria

- [ ] Can visualize a complete building generation from seed to completion
- [ ] Can step through generation one step at a time
- [ ] Can see constraint propagation happening in real-time
- [ ] Can define custom tile configurations and see them generate
- [ ] Can inspect any tile's possible faces and state
- [ ] Rollback is visible when propagation fails
- [ ] Performance: 20x20 grid generates in < 1 second

---

## 8. Appendix: Key File Reference

| File | Purpose |
|---|---|
| `wcAbstractBuildConf.ts` | Base configuration class, data types |
| `wcBuildFace.ts` | Face types and comparison utilities |
| `wcBuildTile.ts` | Per-tile state, constraint propagation core |
| `wcBuildFactory.ts` | Generation orchestrator (init/grow/close) |
| `wcBuildTileDrawer.ts` | Visual application of tile configs |
| `wcBuildAction.ts` | Public API and building type registry |
| `wcUtils.ts` | Rotation, weighted selection utilities |
| `conf/buildConf_*.ts` | Building type definitions |
| `conf/assetsCollection/wcAsset_*.ts` | Reusable asset components |

---

*Document created: 2026-03-29*  
*Source: IsoGame/wcBuilding2 module review*