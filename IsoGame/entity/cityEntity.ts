// import { PathFactory } from "../path.js";
import { PathFactory } from "../city/pathFactory.ts";
import { FactoryMap } from "../map/factory/factoryMap.ts";
import { Tile } from "../map/object/tile.ts";
import { World } from "../word.ts";
import { CITIZEN_NAME } from "./CitizenTrais.ts";
import { EntityBehavior, EntityGoal } from "./typeEntityBehavior.ts";

export class CityEntity {
  world: World;
  fm: FactoryMap;

  lvl: number;
  assetkey: string;
  assetFilter: string;
  offset: { x: number; y: number };
  tile: Tile;

  speed: number;
  directionCooldown: number;
  direction: string;

  name: string;

  waitingTickCount: number;
  currentGoal: EntityGoal | null;
  nextGoalList: EntityGoal[] = [];

  constructor(world: World, _conf = {}) {
    this.world = world;
    this.world.entities.push(this);

    this.fm = FactoryMap.getInstance();

    this.tile = FactoryMap.getInstance().getTile(0, 0);

    this.lvl = 0;
    this.assetkey = `ghost`;
    const randomHue = (Math.floor(Math.random() * 16)) * 16;
    this.assetFilter = `#_H${randomHue}_C165_S225`;
    this.offset = { x: 0, y: 0 };

    this.speed = .015;
    this.directionCooldown = 0;
    this.direction = "S";

    // ---
    this.name = CITIZEN_NAME.rand();
    // object that stor the current step data

    this.waitingTickCount = 0;
    this.currentGoal = null;
    this.nextGoalList = [
      { id: "randomMove", waitCount: 20 * 4 },
    ];
  }

  get items() {
    return {
      t: "Svg",
      key: this.assetkey + "_" + this.direction + this.assetFilter,
      lvl: this.lvl,
      off: { x: this.offset.x, y: this.offset.y },
      z: 1000,
    };
  }
  // --------------------------------
  teleport(tile: Tile) {
    this.tile.removeEntity(this);
    this.tile = tile;
    this.tile.addEntity(this);
  }
  kill() {
    this.tile.removeEntity(this);

    this.world.entities.slice();
    const index = this.world.entities.indexOf(this);
    if (index > -1) {
      this.world.entities.splice(index, 1);
    }
  }

  clearGoal() {
    this.waitingTickCount = 0;
    this.currentGoal = null;
  }

  // --------------------------------

  _moveAjustement(dx: number, dy: number) {
    return dx == 0 && dy == 1
      ? [0, 1]
      : dx == 1 && dy == 1
      ? [1.25, 1.25]
      : dx == 1 && dy == 0
      ? [1, 0]
      : dx == 1 && dy == -1
      ? [.75, -.75]
      : dx == 0 && dy == -1
      ? [0, -1]
      : dx == -1 && dy == -1
      ? [-1.25, -1.25]
      : dx == -1 && dy == 0
      ? [-1, 0]
      : dx == -1 && dy == 1
      ? [-.75, .75]
      : [0, 0];
  }

  _directionOfMove(dx: number, dy: number) {
    const direction = dx == 0 && dy > 0
      ? "NW"
      : dx > 0 && dy > 0
      ? "N"
      : dx > 0 && dy == 0
      ? "NE"
      : dx > 0 && dy < 0
      ? "E"
      : dx == 0 && dy < 0
      ? "SE"
      : dx < 0 && dy < 0
      ? "S"
      : dx < 0 && dy == 0
      ? "SW"
      : dx < 0 && dy > 0
      ? "W"
      : this.direction;

    this.direction = direction;
  }

  moveOffet(dx: number, dy: number, dh: number) {
    // Tile not Change .

    const dox = dx != 0
      ? dx
      : -(this.offset.x > 0 ? 1 : this.offset.x < 0 ? -1 : 0);
    const doy = dy != 0
      ? dy
      : -(this.offset.y > 0 ? 1 : this.offset.y < 0 ? -1 : 0);

    this._directionOfMove(dox, doy);
    const [ox, oy] = this._moveAjustement(dox, doy);

    this.offset.x += ox * this.speed;
    this.offset.y += oy * this.speed;

    this.offset.x = Math.abs(this.offset.x) < this.speed / 2
      ? 0
      : this.offset.x;
    this.offset.y = Math.abs(this.offset.y) < this.speed / 2
      ? 0
      : this.offset.y;

    let xx = 0;
    let yy = 0;
    if (this.offset.x > .5) {
      this.offset.x -= 1;
      xx += 1;
    } else if (this.offset.x < -.5) {
      this.offset.x += 1;
      xx -= 1;
    }
    if (this.offset.y > .5) {
      this.offset.y -= 1;
      yy += 1;
    } else if (this.offset.y < -.5) {
      this.offset.y += 1;
      yy -= 1;
    }

    if (xx != 0 || yy != 0) {
      this.tile.removeEntity(this);
      this.tile = this.fm.getTile(this.tile.x + xx, this.tile.y + yy);
      this.tile.addEntity(this);
      return true;
    }
    return false;
  }

  doTick() {
    if (this.waitingTickCount > 0) {
      this.waitingTickCount -= 1;
      return;
    }
    this.waitingTickCount = 0;
    const chain = [
      behavior_noGoal,
      // behaviorMove_start,

      behaviorMove_getRandomGoal,

      behaviorMove_GoalIN,
      behaviorMove_getPath,
      behaviorMove_nextPossition,
    ];
    for (const step of chain) {
      if (step.isValidate(this)) {
        step.do(this);
        break;
      }
    }
    // chain.forEach(step => {
    // });
  }

  behaviorList: EntityBehavior[] = [];

  registerBehavior(behavior: EntityBehavior) {
    this.behaviorList.push(behavior);
  }
}

const behavior_noGoal = {
  name: "behavior_noGoal",
  isValidate: (entity: CityEntity) => {
    return entity.currentGoal == null;
  },
  do: (entity: CityEntity) => {
    const nextGoal = entity.nextGoalList.shift();
    if (!nextGoal) {
      entity.nextGoalList = [
        { id: "randomMove", waitCount: 20 * 4 },
      ];
      return;
    }

    if (nextGoal.waitCount) {
      entity.waitingTickCount = nextGoal.waitCount;
    }
    entity.currentGoal = nextGoal;
  },
};

/*
const behaviorMove_start = {
  name: "start",
  isValidate: (entity: CityEntity) => {
    return !entity.sData;
  },

  do: (entity: CityEntity) => {
    entity.sData = {
      moveGoal: null,
      moveTilesPath: null,
    };
  },
};
*/

const behaviorMove_getRandomGoal = {
  name: "behaviorMove_getRandomGoal",
  isValidate: (entity: CityEntity) =>
    entity.currentGoal?.id.localeCompare("randomMove") == 0 &&
    !entity.currentGoal?.sData?.moveGoal,
  do: (entity: CityEntity) => {
    const currentGoal = entity.currentGoal as EntityGoal;
    const randomX = Math.round(Math.random() * 40 - 20);
    const randomY = Math.round(Math.random() * 40 - 20);
    currentGoal.sData = {
      moveGoal: {
        x: entity.tile.x + randomX,
        y: entity.tile.y + randomY,
      },
    };
  },
};

const behaviorMove_GoalIN = {
  name: "behaviorMove_GoalIN",
  isValidate: (entity: CityEntity) =>
    entity.currentGoal &&
    entity.currentGoal.sData &&
    entity.currentGoal.sData.moveGoal &&
    (entity.currentGoal.sData.moveGoal.x == entity.tile.x &&
      entity.currentGoal.sData.moveGoal.y == entity.tile.y),

  do: (entity: CityEntity) => {
    entity.offset.x = 0;
    entity.offset.y = 0;
    entity.direction = "S";
    entity.clearGoal();
  },
};

// -------------

const behaviorMove_getPath = {
  name: "getPath",
  isValidate: (entity: CityEntity) => {
    return entity.currentGoal &&
      entity.currentGoal.sData.moveGoal &&
      (entity.currentGoal.sData.moveGoal.x != entity.tile.x ||
        entity.currentGoal.sData.moveGoal.y != entity.tile.y) &&
      (!entity.currentGoal.sData.moveTilesPath ||
        entity.currentGoal.sData.moveTilesPath.length == 0);
  },

  do: (entity: CityEntity) => {
    const pathFactory = new PathFactory(entity.world);
    // pathFactory.isValideTile = (tile: Tile) => true;
    const currentGoal = entity.currentGoal as EntityGoal;
    const moveTilesPath = pathFactory.createPath(
      { x: entity.tile.x, y: entity.tile.y },
      { x: currentGoal.sData.moveGoal.x, y: currentGoal.sData.moveGoal.y },
    );
    if (!moveTilesPath) {
      currentGoal.sData.moveGoal = null;
    }
    currentGoal.sData.moveTilesPath = moveTilesPath;
  },
};

const behaviorMove_nextPossition = {
  name: "nextPossition",
  isValidate: (entity: CityEntity) => {
    return entity.currentGoal &&
      entity.currentGoal.sData.moveGoal &&
      (entity.currentGoal.sData.moveGoal.x != entity.tile.x ||
        entity.currentGoal.sData.moveGoal.y != entity.tile.y) &&
      entity.currentGoal.sData.moveTilesPath &&
      entity.currentGoal.sData.moveTilesPath.length > 0;
  },

  do: (entity: CityEntity) => {
    const currentGoal = entity.currentGoal as EntityGoal;

    const nextPos = currentGoal.sData.moveTilesPath[0];
    const dx = nextPos.x - entity.tile.x;
    const dy = nextPos.y - entity.tile.y;
    const dh = nextPos.lvl - entity.tile.lvl;
    entity.moveOffet(dx, dy, dh);
    if (nextPos.x == entity.tile.x && nextPos.y == entity.tile.y) {
      currentGoal.sData.moveTilesPath.shift();
    }
  },
};
