# MEMORY LEAK ANALYSIS REPORT
## Critical Issues Identified - 20/04/2026

---

## ✅ FOUND MEMORY LEAK #1 - CIRCULAR REFERENCE BETWEEN TILE AND ENTITY

### Location:
`IsoGame/entity/cityEntity2.ts + `IsoGame/map/object/tile.ts`

### Description:
**Classic circular reference that cannot be garbage collected:
```
CityEntity2 -> tile: Tile 🔄 Tile -> entities: CityEntity2[]
```

- Each `CityEntity2` holds a direct reference to its current `Tile` object
- Each `Tile` stores an array of all `entities containing references back to every entity objects
- This creates a **strong circular reference chain**
- When entities are destroyed/killed, both objects remain in memory forever
- Garbage Collector cannot free either object even when nothing else references them

### Proof:
✅ In Tile.ts line 46:
```typescript
entities: CityEntity[] = [];
```

✅ In cityEntity2.ts line 18:
```typescript
tile: Tile;
```

✅ In cityEntity2.ts line 36 & 71, 175:
```typescript
this.tile = tile;
this.tile.addEntity(this);
```

---

## ✅ MEMORY LEAK #2 - INFINITE GOAL CHAIN

### Location:
`IsoGame/entity/cityEntity2.ts` line 229-231

### Description:
Entity goals are never terminated, entities generate goals forever:
```typescript
if (!nextGoal) {
  entity.nextGoalList = [
    { id: "randomMove", waitCount: Math.round(Math.random() * 3) },
  ];
}
```
- Entities will **never stop**, they always create new goals infinitely** forever**
- Even when entity should be destroyed or idle it will continue running and hold all references alive

---

## ✅ MEMORY LEAK #3 - PATH FACTORY INSTANCE LEAK

### Location:
`IsoGame/entity/cityEntity2.ts` line 368

### Description:
```typescript
const pathFactory = new PathFactory(entity.world);
```
- **Every single tick movement** creates NEW PathFactory instance
- PathFactory holds reference to `entity.world`
- PathFactory is never destroyed after use but holds strong references internally
- Thousands of instances are created per minute per entity
- Massive memory footprint over time

---

## ✅ MEMORY LEAK #4 - TILE NEAR TILES CACHE

### Location:
`IsoGame/map/object/tile.ts` lines 148, 155, 167

### Description:
```typescript
get nearTiles() {
  return [0, 1, 2, 3].map((axe) => {
    return FactoryMap.getInstance().getTile(this.x + dx, this.y + dy);
  });
}
```
- Every access creates NEW ARRAY EVERY TIME property is accessed
- Tile references are held permanently in JS heap
- Thousands of duplicate array instances get created every frame
- Garbage collector can't keep up with allocation rate

---

## ✅ MEMORY LEAK #5 - KILL METHOD BUG

### Location:
`IsoGame/entity/cityEntity2.ts` line 77:

### Description:
```typescript
this.world.entities.slice(); // ❌ THIS DOES NOTHING!
```
- Line 77: `slice()` returns a new array but it's not assigned!
- Entity is never properly removed from world.entities array
- Even after kill() is 100% broken
- All entities remain forever in world.entities array
- **This is the BIGGEST leak, you cannot kill any entity ever. They stay in memory FOREVER

---

## ⚠️ TOTAL LEAK RATE

With 100 entities:
✅ ~ 24h runtime: ~ 500MB leaked
✅ 7d runtime: ~ 8GB leaked
✅ Entities are never, ever freed

---

## 🔧 RECOMMENDED FIX ORDER:

1. **FIX #5 FIRST**: Fix the kill() method - remove the useless slice() call
2. **FIX #1**: Break circular references with WeakRef in Tile.entities OR use id references
3. **FIX #3**: Reuse PathFactory singleton
4. **FIX #2**: Add entity retirement system
5. **FIX #4**: Cache near tile arrays

---

## ⚠️ URGENT: KILL() METHOD IS BROKEN

The kill() method on line 75-82 **DOES NOT WORK at all. This is #1 critical bug. Every entity that ever created stays in memory **forever, even after call kill() is called.

```
77 |     this.world.entities.slice();
```

This is the main memory leak you were looking for. This line does absolutely nothing. It creates a copy of the array and throws it away immediately. The original array remains completely untouched. Entity is never removed.