import type { Goal, GoalStatus } from "../goal.ts";
import type { CityEntity } from "../cityEntity.ts";
import type { EntityMemory } from "../entityMemory.ts";
import type { Tile } from "../../../map/object/tile.ts";
import { PathFactory } from "../../../generator/city/pathFactory.ts";

// ─────────────────────────────────────────────────────────────
//  walkTo — private navigation function, used directly by goals
//  that need to move. No class, no wrapper. Just a function.
// ─────────────────────────────────────────────────────────────

function walkTo(
  entity: CityEntity,
  path: { current: Tile[] | null },
  tx: number,
  ty: number,
): boolean {
  if (entity.tile.x === tx && entity.tile.y === ty) return true;

  if (!path.current || path.current.length === 0) {
    const result = new PathFactory(entity.world).createPath(
      { x: entity.tile.x, y: entity.tile.y },
      { x: tx, y: ty },
    );
    if (!result) return true; // unreachable — resolve as done
    path.current = result;
  }

  const next = path.current[0];
  entity.moveToward(next);
  if (next.x === entity.tile.x && next.y === entity.tile.y) {
    path.current.shift();
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
//  randomMove — wander to a random nearby tile
// ─────────────────────────────────────────────────────────────

class RandomMoveGoal implements Goal {
  readonly id = "randomMove";
  private path:   { current: Tile[] | null } = { current: null };
  private target: { x: number; y: number }  | null = null;

  run(entity: CityEntity): GoalStatus {
    if (!this.target) {
      this.target = {
        x: entity.tile.x + Math.round(Math.random() * 40 - 20),
        y: entity.tile.y + Math.round(Math.random() * 40 - 20),
      };
    }
    if (walkTo(entity, this.path, this.target.x, this.target.y)) {
      entity.snapToTile();
      return "done";
    }
    return "running";
  }
}

export const randomMove = (): Goal => new RandomMoveGoal();

// ─────────────────────────────────────────────────────────────
//  goHome — walk to mem.home; skip if home is not set
// ─────────────────────────────────────────────────────────────

class GoHomeGoal implements Goal {
  readonly id = "goHome";
  private path: { current: Tile[] | null } = { current: null };

  run(entity: CityEntity, mem: EntityMemory): GoalStatus {
    if (!mem.home) return "done";
    if (walkTo(entity, this.path, mem.home.x, mem.home.y)) {
      entity.snapToTile();
      return "done";
    }
    return "running";
  }
}

export const goHome = (): Goal => new GoHomeGoal();

// ─────────────────────────────────────────────────────────────
//  visitLocations — visit every location in mem.locations in order
// ─────────────────────────────────────────────────────────────

class VisitLocationsGoal implements Goal {
  readonly id    = "visitLocations";
  private path:  { current: Tile[] | null } = { current: null };
  private index  = 0;

  run(entity: CityEntity, mem: EntityMemory): GoalStatus {
    const list = mem.locations;
    if (!list?.length || this.index >= list.length) return "done";

    const target = list[this.index];
    if (walkTo(entity, this.path, target.x, target.y)) {
      entity.snapToTile();
      this.path.current = null; // reset path for next location
      this.index++;
    }
    return this.index >= list.length ? "done" : "running";
  }
}

export const visitLocations = (): Goal => new VisitLocationsGoal();

// ─────────────────────────────────────────────────────────────
//  wait
// ─────────────────────────────────────────────────────────────

class WaitGoal implements Goal {
  readonly id = "wait";
  constructor(private ticks: number) {}

  run(): GoalStatus {
    return this.ticks-- > 0 ? "running" : "done";
  }
}

export const wait = (duration: number) => (): Goal => new WaitGoal(duration);
