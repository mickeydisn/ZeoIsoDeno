# Entity System

> Files: `IsoGame/entity/`, `IsoGame/entity/v2/`

## Purpose

Manages game entities (citizens, creatures) with AI behaviors and trait-based personalities.

## Entity Types

### CityEntity

Represents a citizen or NPC in the world:

```ts
class CityEntity {
  x: number
  y: number
  behavior: TypeEntityBehavior
  traits: CitizenTraits
}
```

### `doTick()`

Called each frame by `World.tick()`. Executes the entity's current behavior, updating position and state.

## TypeEntityBehavior

Defines entity behavior patterns:

```ts
class TypeEntityBehavior {
  type: string
  priority: number
  execute(entity: CityEntity, world: World): void
}
```

### Behavior Types

| Behavior | Description |
|----------|-------------|
| `wander` | Random movement within area |
| `work` | Move to workplace, perform tasks |
| `sleep` | Return home, rest |
| `social` | Interact with nearby entities |

## CitizenTraits

Personality attributes affecting behavior choices:

```ts
interface CitizenTraits {
  industriousness: number  // Work preference
  sociability: number      // Social interaction preference
  energy: number           // Current energy level
  happiness: number        // Satisfaction level
}
```

## Entity AI (v2)

Updated AI system in `IsoGame/entity/v2/`:

### EntityAI

```ts
class EntityAI {
  entity: CityEntity
  currentBehavior: TypeEntityBehavior
  behaviorQueue: TypeEntityBehavior[]
}
```

### Behavior Selection

1. Evaluate current context (time, location, energy)
2. Score available behaviors based on traits
3. Select highest priority valid behavior
4. Execute behavior until completion or interruption
5. Re-evaluate and select next behavior

## Integration

Entities interact with:
- **Map System**: Navigate terrain, respect biome restrictions
- **City System**: Use roads, enter buildings
- **World Manager**: Register in `cityEntity` list for tick updates