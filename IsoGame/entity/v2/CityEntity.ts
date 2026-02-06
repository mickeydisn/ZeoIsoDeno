// cityEntity.ts

// import { PathFactory } from "../path.js";
import { FactoryMap } from "../../map/f../../map/object/tile.ts.ts";
import { Tile } from "../../map/object/tile.ts";
import { World } from "../../word.ts";
import { CITIZEN_NAME } from "../CitizenTrais.ts";
// import { EntityBehavior, EntityGoal } from "./typeEntityBehavior.ts"; // No longer needed
import { EntityAI } from "./EntityAI.ts"; // <--- New Import

/**
 * CityEntity represents the physical state and display properties of an entity.
 * It delegates all behavior logic and related state to its EntityAI instance.
 */
export class CityEntity {
  world: World;
  fm: FactoryMap;
  ai: EntityAI; // <--- The AI component

  lvl: number;
  assetkey: string;
  assetFilter: string;
  offset: { x: number; y: number };
  tile: Tile;

  speed: number;
  directionCooldown: number;
  direction: string;

  name: string;
  
  // AI STATE VARIABLES (waitingTickCount, currentGoal, nextGoalList) ARE REMOVED

  constructor(world: World, _conf = {}) {
    this.world = world;
    this.world.entities.push(this);
    this.fm = FactoryMap.getInstance();
    
    // Initialize AI component
    this.ai = new EntityAI(this); 

    this.tile = this.fm.getTile(0, 0);

    this.lvl = 0;
    this.assetkey = `ghost`;
    const randomHue = (Math.floor(Math.random() * 16)) * 16;
    this.assetFilter = `#_H${randomHue}_C165_S225`;
    this.offset = { x: 0, y: 0 };

    this.speed = .04;
    this.directionCooldown = 0;
    this.direction = "S";

    this.name = CITIZEN_NAME.rand();
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
    this.clearGoal(); 
  }
  kill() {
    this.tile.removeEntity(this);
    const index = this.world.entities.indexOf(this);
    if (index > -1) {
      this.world.entities.splice(index, 1);
    }
  }

  // Delegates clearing state to the AI component
  clearGoal() {
    this.ai.clearGoal();
  }

  // --------------------------------

  // Movement utility methods remain here as they manipulate the entity's physical state
  _moveAjustement(dx: number, dy: number) {
    // ... same as before
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
    // ... same as before
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
    // ... same as before, manipulates tile and offset
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
    this.ai.tick(); // <--- Delegation to the AI component
  }
}