// import { PathFactory } from "../path.js";
import { PathFactory } from "../city/pathFactory.ts";
import { FactoryMap } from "../map/factory/factoryMap.ts";
import { Tile } from "../map/object/tile.ts";
import { TilesActions } from "../map/action2/tilesActions.ts";
import { World } from "../word.ts";
import { CITIZEN_NAME } from "./CitizenTrais.ts";
import { EntityBehavior, EntityGoal } from "./typeEntityBehavior.ts";
import { cmd } from "../map/action2/builder/cmd.ts";

export class CityEntity2 {
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

  constructor(world: World, _conf = {x:0, y:0}) {
    this.world = world;
    this.world.entities.push(this);

    this.fm = FactoryMap.getInstance();

    this.tile = FactoryMap.getInstance().getTile(_conf.x, _conf.y);

    this.lvl = 0;
    this.assetkey = `digger`;
    const randomHue = (Math.floor(Math.random() * 16)) * 16;
    this.assetFilter = `#_H${randomHue}_C165_S225`;
    this.offset = { x: 0, y: 0 };

    this.speed = .05;
    this.directionCooldown = 0;
    this.direction = "S";

    // ---
    this.name = CITIZEN_NAME.rand();
    // object that stor the current step data

    this.waitingTickCount = 0;
    this.currentGoal = null;
    this.nextGoalList = [
      { id: "randomMove", waitCount: 1 },
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

  tickLife = 0
  doTick() {
    this.tickLife += 1;
    const LIFE_LIME = 100000;
    if (this.tickLife > LIFE_LIME) {
      this.tile.removeEntity(this)
      this.world.removeEntity(this)
    }
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
  isValidate: (entity: CityEntity2) => {
    return entity.currentGoal == null;
  },
  do: (entity: CityEntity2) => {
    const nextGoal = entity.nextGoalList.shift();
    if (!nextGoal) {
      entity.nextGoalList = [
        { id: "randomMove", waitCount: Math.round(Math.random() * 3) },
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
  isValidate: (entity: CityEntity2) => {
    return !entity.sData;
  },

  do: (entity: CityEntity2) => {
    entity.sData = {
      moveGoal: null,
      moveTilesPath: null,
    };
  },
};
*/

const behaviorMove_getRandomGoal = {
  name: "behaviorMove_getRandomGoal",
  isValidate: (entity: CityEntity2) =>
    entity.currentGoal?.id.localeCompare("randomMove") == 0 &&
    !entity.currentGoal?.sData?.moveGoal,
  do: (entity: CityEntity2) => {
    const currentTile = entity.fm.getTile(entity.tile.x, entity.tile.y)

    const lowerTile : Tile | undefined = currentTile.nearTilesAxe()
        // .filter((t) => {
        //   return ! (t.color[0] == 0 &&  t.color[1] == 0 &&  t.color[2] == 50)
        // })
        .sort(( a, b ) => a.lvl - b.lvl)[0]


    const dx = lowerTile ? lowerTile.x : entity.tile.x + 3 - Math.round(Math.random() * 6);
    const dy = lowerTile ? lowerTile.y : entity.tile.y + 3 - Math.round(Math.random() * 6);
    /*
    const goalTile = entity.fm.getTile(entity.tile.x + dx, entity.tile.y + dy)
    if (entity.tile.lvl >= goalTile.lvl) {
      dx = entity.tile.x + 3 - Math.round(Math.random() * 6);
      dy = entity.tile.y + 3 - Math.round(Math.random() * 6);
      lowerTile = undefined;
    }
    */
    const currentGoal = entity.currentGoal as EntityGoal;
    TilesActions.getInstance().doAction(cmd.lvlAvgSquare({
      x: entity.tile.x,
      y: entity.tile.y,
      size: Math.round(Math.random() * 4),
    }));
    TilesActions.getInstance().doAction(cmd.clearItemSquare({
      x: entity.tile.x,
      y: entity.tile.y,
      size: 3,
    }));

    TilesActions.getInstance().doAction(cmd.lvlUp({
      x: entity.tile.x,
      y: entity.tile.y,
      lvl: (Math.random() - .5) * 1,
    }));

    if (lowerTile) {
      TilesActions.getInstance().doAction(cmd.colorSquare({
        x: entity.tile.x,
        y: entity.tile.y,
        size: 1,
        color: [0, 0, 50],
      }));
      currentGoal.sData = {
        moveGoal: {
          x: dx,
          y: dy,
        },
      };
      currentGoal.sData.moveTilesPath = [entity.fm.getTile( dx, dy)]
    } else {
      TilesActions.getInstance().doAction(cmd.colorSquare({
        x: entity.tile.x,
        y: entity.tile.y,
        size: 1,
        color: [0, 50, 50],
      }));
      currentGoal.sData = {
        moveGoal: {
          x: dx,
          y: dy,
        },
      };
    }
  },
};

const behaviorMove_GoalIN = {
  name: "behaviorMove_GoalIN",
  isValidate: (entity: CityEntity2) =>
    entity.currentGoal &&
    entity.currentGoal.sData &&
    entity.currentGoal.sData.moveGoal &&
    (entity.currentGoal.sData.moveGoal.x == entity.tile.x &&
      entity.currentGoal.sData.moveGoal.y == entity.tile.y),

  do: (entity: CityEntity2) => {
    entity.offset.x = 0;
    entity.offset.y = 0;
    // entity.direction = "S";
    entity.clearGoal();
  },
};

// -------------

const behaviorMove_getPath = {
  name: "getPath",
  isValidate: (entity: CityEntity2) => {
    return entity.currentGoal &&
      entity.currentGoal.sData.moveGoal &&
      (entity.currentGoal.sData.moveGoal.x != entity.tile.x ||
        entity.currentGoal.sData.moveGoal.y != entity.tile.y) &&
      (!entity.currentGoal.sData.moveTilesPath ||
        entity.currentGoal.sData.moveTilesPath.length == 0);
  },

  do: (entity: CityEntity2) => {
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
  isValidate: (entity: CityEntity2) => {
    return entity.currentGoal &&
      entity.currentGoal.sData.moveGoal &&
      (entity.currentGoal.sData.moveGoal.x != entity.tile.x ||
        entity.currentGoal.sData.moveGoal.y != entity.tile.y) &&
      entity.currentGoal.sData.moveTilesPath &&
      entity.currentGoal.sData.moveTilesPath.length > 0;
  },

  do: (entity: CityEntity2) => {
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
