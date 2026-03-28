# Map & Terrain System

> Files: `IsoGame/map/factory/factoryMap.ts`, `IsoGame/map/tileActions.ts`, `IsoGame/map/data/biomes.ts`, `IsoGame/map/data/items.ts`

## Purpose

Procedural terrain generation using noise functions, chunk-based tile storage, and biome classification.

## FactoryMap (Singleton)

```ts
class FactoryMap {
  chunks: Map<string, Chunk>
}
```

Manages world chunks and provides tile access.

### Chunk

- Size: 128×128 tiles
- Stored with key `"x,y"` (chunk coordinates)
- Contains 2D array of `Tile` objects

### Tile Structure

```ts
class Tile extends RawTile {
  x: number
  y: number
  level: number        // Elevation
  color: RGB
  entities: Entity[]
  items: Item[]
  building: Building | null
  biome: BiomeType
  temperature: number
  hydrometry: number
}
```

### RawTile

Base class with noise-derived values:
- `rawLevel` — Raw elevation from noise
- `rawColor` — Base color from noise
- `rawBiome` — Biome classification

## TileActions

Singleton for batch terrain modifications:

| Function | Purpose |
|----------|---------|
| `lvlFlatSquare` | Flatten terrain in a square area |
| `clearItemSquare` | Remove items from a square area |
| `setBiomeSquare` | Set biome type in area |

## Biomes

Defined in `IsoGame/map/data/biomes.ts`:

| Biome | Characteristics |
|-------|-----------------|
| Ocean | Low elevation, blue |
| Beach | Coastal, sand-colored |
| Grassland | Flat, green |
| Forest | Elevated, dark green |
| Mountain | High elevation, gray |
| Desert | Low moisture, sand-colored |
| Tundra | Low temperature, white |

## Items

Defined in `IsoGame/map/data/items.ts`:

Trees, rocks, flowers, and other environmental objects placed based on biome and noise values.

## Tile Access

```ts
FactoryMap.getInstance().getTile(x, y)
```

Returns the tile at world coordinates, loading/generating the chunk if needed.