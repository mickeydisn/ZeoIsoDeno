import { World } from "../word.ts";
import { FactoryMap } from "../map/factory/factoryMap.ts";
import { Tile } from "../map/object/tile.ts";
import { TilesActions, TypeTileActionConfig } from "../map/tileActions.ts";
import { CityPathParamSection } from "./pathConfig.ts";

export function actionDrawPathAndPlatform(
  tileList: Tile[],
  param: CityPathParamSection,
): TypeTileActionConfig[] {
  return [
    ...actionDrawPath_Smooth_Large(tileList, param),
    ...actionDrawPath_Smooth_Close(tileList, param),
    ...actionDrawPath_EndPlatform(tileList, param),
    ...actionDrawPath_FrisePath(tileList, param),
  ];
}

export function actionDrawPath(
  tileList: Tile[],
  param: CityPathParamSection,
): TypeTileActionConfig[] {
  return [
    ...actionDrawPath_Smooth_Large(tileList, param),
    ...actionDrawPath_Smooth_Close(tileList, param),
    ...actionDrawPath_FrisePath(tileList, param),
  ];
}

export function actionDrawPath_Smooth_Large(
  tileList: Tile[],
  param: CityPathParamSection,
): TypeTileActionConfig[] {
  return [
    {
      func: "lvlAvgSquare",
      x: tileList[0].x,
      y: tileList[0].y,
      size: 14,
    },
    ...tileList.map((tile) => {
      return [
        { func: "clearItemSquare", x: tile.x, y: tile.y, size: 3 },
        {
          func: "lvlAvgSquare",
          x: tileList[0].x,
          y: tileList[0].y,
          size: 14,
        },
        {
          func: "colorSquare",
          x: tile.x,
          y: tile.y,
          size: 3,
          color: param.color,
        },
      ];
    }).flat(),
  ];
}

export function actionDrawPath_Smooth_Close(
  tileList: Tile[],
  param: CityPathParamSection,
): TypeTileActionConfig[] {
  return [
    ...tileList.map((tile) => {
      return [
        {
          func: "lvlFlatSquare",
          // func: "lvlAvgSquare",
          x: tile.x,
          y: tile.y,
          size: 3,
        },
        {
          func: "lvlAvgSquare",
          x: tile.x,
          y: tile.y,
          size: 5,
        },
        {
          func: "colorSquare",
          x: tile.x,
          y: tile.y,
          size: 1,
          color: param.color2,
        },
      ];
    }).flat(),
  ];
}

export function actionDrawPath_EndPlatform(
  tileList: Tile[],
  param: CityPathParamSection,
): TypeTileActionConfig[] {
  return [
    {
      func: "colorSquare",
      x: tileList[tileList.length - 1].x,
      y: tileList[tileList.length - 1].y,
      size: 5,
      color: param.color2,
    },
    {
      func: "lvlFlatSquare",
      x: tileList[tileList.length - 1].x,
      y: tileList[tileList.length - 1].y,
      size: 3,
    },
    {
      func: "setFriseSquare",
      x: tileList[tileList.length - 1].x,
      y: tileList[tileList.length - 1].y,
      size: 3,
    },
    {
      func: "lvlFAvgSquare",
      x: tileList[tileList.length - 1].x,
      y: tileList[tileList.length - 1].y,
      size: 5,
    },
  ];
}

export function actionDrawPath_FrisePath(
  tileList: Tile[],
  param: CityPathParamSection,
): TypeTileActionConfig[] {
  return [
    ...tileList.map((tile) => {
      return [
        {
          func: "setFriseSquare",
          x: tile.x,
          y: tile.y,
          size: 3,
          isFrise: true,
        },
      ];
    }).flat(),
  ];
}

export type PathFactoryConfig = {
  maxLvlDiff: number;
  propagateLimit: number;
  colapseLimit: number;
  axeCount: number;
};

export class PathFactory {
  world: World;
  fm: FactoryMap;
  ta: TilesActions;
  maxLvlDiff: number;
  propagateLimit: number;
  colapseLimit: number;
  axeCount: number;
  private tileStart?: Tile;
  private tileEnd?: Tile;
  private allList: Tile[] = [];
  private openList: { score: number; tile: Tile }[] = [];
  private parentIndex: Record<string, Tile> = {};

  constructor(
    world: World,
  ) {
    this.world = world;
    this.fm = FactoryMap.getInstance();
    this.ta = TilesActions.getInstance();

    this.maxLvlDiff = 2;
    this.propagateLimit = 2000;
    this.colapseLimit = 500;
    this.axeCount = 8;
  }

  private isValideTile(tile: Tile): boolean {
    const isVal = (tile: Tile) => !tile.wcBuild || !tile.isBlock;
    return isVal(tile) && tile.nearTiles.filter(isVal).length === 4;
  }

  private score(t1: Tile, t2: Tile): number {
    const dist = PathFactory.tilesMoveCount(t1, t2);
    const distFactor = t1.wcBuild ? 100 : 0;
    return dist - distFactor;
  }

  static tilesDistance(t1: Tile, t2: Tile): number {
    const xd = Math.abs(Math.abs(t1.x) - Math.abs(t2.x));
    const yd = Math.abs(Math.abs(t1.y) - Math.abs(t2.y));
    return Math.sqrt(xd * xd + yd * yd);
  }

  static tilesMoveCount(t1: Tile, t2: Tile): number {
    const xd = Math.abs(Math.abs(t1.x) - Math.abs(t2.x));
    const yd = Math.abs(Math.abs(t1.y) - Math.abs(t2.y));

    const diag = Math.abs(xd - yd);
    const line = Math.max(xd, yd) - diag;
    return line + diag;
  }

  createPath(
    pStart: { x: number; y: number },
    pEnd: { x: number; y: number },
  ): Tile[] | null {
    this.tileStart = this.fm.getTile(pStart.x, pStart.y);
    this.tileEnd = this.fm.getTile(pEnd.x, pEnd.y);

    this.allList = [this.tileStart];
    this.openList = [{
      score: this.score(this.tileStart, this.tileEnd),
      tile: this.tileStart,
    }];
    this.parentIndex = {};
    let i = 0;
    while (
      this.openList.length && i++ < this.propagateLimit &&
      !this.allList.includes(this.tileEnd)
    ) {
      this.propagate();
    }

    if (this.allList.includes(this.tileEnd)) {
      const tileList: Tile[] = [];
      let current = this.tileEnd;
      i = 0;
      while (current && i++ < this.colapseLimit) {
        tileList.push(current);
        current = this.parentIndex[`${current.x}_${current.y}`];
      }
      return tileList.reverse();
    }
    return null;
  }
  /*
  createWcPath(
    pStart: { x: number; y: number },
    pEnd: { x: number; y: number },
  ): any | null {
    const tileList = this.createPath(pStart, pEnd);
    return tileList ? new WcPath(this.world, tileList) : null;
  }
  */
  private propagate(): void {
    this.openList.sort((a, b) => a.score - b.score);
    const bestTileConf = this.openList.shift();
    if (!bestTileConf) return;
    const bestTile = bestTileConf.tile;
    const nears = this.axeCount === 4
      ? bestTile.nearTiles
      : bestTile.nearSquareTiles;
    const nearsNew = nears.filter((n: Tile) => {
      return PathFactory.canMove(bestTile, n) && !this.allList.includes(n) &&
        this.isValideTile(n);
    });

    nearsNew.forEach((nearTile: Tile) => {
      this.allList.push(nearTile);
      this.parentIndex[`${nearTile.x}_${nearTile.y}`] = bestTile;
      this.openList.push({
        score: this.score(nearTile, this.tileEnd!),
        tile: nearTile,
      });
    });
  }

  static canMove(t1: Tile, t2: Tile): boolean {
    return !(t2.isBlock || Math.abs(t1.lvl - t2.lvl) > 2);
  }
}
