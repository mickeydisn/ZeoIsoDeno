import { World } from "../../word.ts";
import { CityEntity } from "./cityEntity.ts";
import { goHome, randomMove, visitLocations, wait } from "./goals/goals.ts";

// ─────────────────────────────────────────────────────────────
//  1. Basic wanderer — nothing special, all defaults
// ─────────────────────────────────────────────────────────────

export function spawnWanderer(world: World) {
  return new CityEntity(world);
}

// ─────────────────────────────────────────────────────────────
//  2. Worker — goes to work, waits, goes home, loops
// ─────────────────────────────────────────────────────────────

export function spawnWorker(world: World) {
  return new CityEntity(world, {
    name:  "Jules",
    hue:   64,
    speed: 0.02,
    memory: {
      home: { label: "home", x: 5, y: 5 },
      locations: [
        { label: "workshop", x: 20, y: 12 },
      ],
    },
    script: {
      mode: "loop",
      entries: [
        { factory: visitLocations, waitAfter: 0 },  // walk to workshop
        { factory: wait(200),      waitAfter: 0 },  // work for 200 ticks
        { factory: goHome,         waitAfter: 60 }, // return home, rest 60 ticks
      ],
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  3. Patrol guard — visits checkpoints in a loop, never rests
// ─────────────────────────────────────────────────────────────

export function spawnGuard(world: World) {
  return new CityEntity(world, {
    assetKey: "guard",
    hue:      200,
    speed:    0.025,
    memory: {
      locations: [
        { label: "gate",    x: 0,  y: 0  },
        { label: "tower-A", x: 30, y: 0  },
        { label: "tower-B", x: 30, y: 30 },
        { label: "gate",    x: 0,  y: 30 },
      ],
    },
    script: {
      mode: "loop",
      entries: [
        { factory: visitLocations, waitAfter: 10 },
      ],
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  4. Philosopher — wanders, sits, wanders again. Slow.
// ─────────────────────────────────────────────────────────────

export function spawnPhilosopher(world: World) {
  return new CityEntity(world, {
    speed: 0.008,
    hue:   160,
    memory: { mood: 0.5 },
    script: {
      mode: "loop",
      entries: [
        { factory: randomMove,  waitAfter: 0   },
        { factory: wait(300),   waitAfter: 0   }, // sit and think
        { factory: randomMove,  waitAfter: 0   },
        { factory: wait(100),   waitAfter: 0   },
      ],
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  5. Dynamic script swap — react to an event at runtime
// ─────────────────────────────────────────────────────────────

export function onFireAlert(entity: CityEntity) {
  entity.setScript({
    mode: "once",
    entries: [
      { factory: goHome, waitAfter: 0 },
      { factory: wait(500), waitAfter: 0 },
    ],
  });
}
