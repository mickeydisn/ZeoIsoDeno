# City Generation

> Files: `IsoGame/city/city.ts`, `IsoGame/city/cityNode.ts`, `IsoGame/city/graph.ts`, `IsoGame/city/pathFactory.ts`

## Purpose

Procedural city generation using graph-based road network expansion with building placement.

## City Class

```ts
class City {
  world: World
  graph: Graph
  pathFactory: PathFactory
}
```

### Constructor

`new City(world, x, y)` initializes a city at the given coordinates:
1. Creates initial `CityNode` at center
2. Initializes `Graph` for road network
3. Runs expansion algorithm to generate roads and buildings

## CityNode

Represents a point in the city graph:

```ts
class CityNode {
  x: number
  y: number
  type: "road" | "building" | "intersection"
}
```

### Node Types

| Type | Purpose |
|------|---------|
| `road` | Path segment between intersections |
| `building` | Building placement location |
| `intersection` | Road crossing point |

## Graph

Manages the road network as a graph structure:

```ts
class Graph {
  nodes: CityNode[]
  edges: [CityNode, CityNode][]
}
```

### Evaluation Metrics

Node placement uses scoring based on:
- **Distance to center** — Prefer locations closer to city center
- **Minimum distance to existing nodes** — Avoid clustering

## PathFactory

Generates road segments between nodes:

```ts
class PathFactory {
  createPath(from: CityNode, to: CityNode): void
}
```

Uses `TileActions` to modify terrain:
- Flattens road tiles
- Sets road biome/type
- Clears items along path

## Generation Algorithm

1. Place center node at origin
2. Generate candidate positions in expanding rings
3. Score each candidate using evaluation metrics
4. Select best candidates for new nodes
5. Connect new nodes to nearest existing nodes
6. Place buildings at suitable locations
7. Repeat until target node count reached