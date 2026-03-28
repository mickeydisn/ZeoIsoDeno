# World Manager

> File: `IsoGame/word.ts`

## Purpose

Singleton managing global game state and entity lifecycle.

## World Class

```ts
class World {
  seed: number
  cityEntity: CityEntity[]
}
```

### Properties

| Property | Type | Purpose |
|----------|------|---------|
| `seed` | `number` | Random seed for procedural generation |
| `cityEntity` | `CityEntity[]` | List of active city entities |

### Key Methods

#### `init()`
Initializes the world with a random seed. Called during worker initialization.

#### `tick()`
Called every game frame. Iterates through all `cityEntity` objects and calls their `doTick()` method, advancing AI simulation and entity behaviors.

## Usage Pattern

The World instance is created in `GameWorker` and passed to:
- `CanvasMapDrawers` — For rendering context
- `City` — For city generation
- `WcBuildingFactory` — For building placement

## Singleton Access

Used as a regular instance rather than a static singleton. The `GameWorker` holds the single World reference and passes it to subsystems as needed.