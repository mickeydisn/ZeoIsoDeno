import { World } from "../../word.ts";
import { FactoryMap } from "../factory/factoryMap.ts";
import { Tile } from "./tile.ts";

export class TilesMatrixSelected {
  world: World;
  fm: FactoryMap;
  sizeX: number;
  sizeY: number;
  rangeX: number[];
  rangeY: number[];
  tiles: Tile[][];
  avgLvl: number;

  constructor(
    x1: number = 0,
    y1: number = 0,
    x2: number = 0,
    y2: number = 0,
  ) {
    this.world = World.getInstance();
    this.fm = FactoryMap.getInstance();

    const p1 = { x: Math.min(x1, x2), y: Math.min(y1, y2) };
    const p2 = { x: Math.max(x1, x2), y: Math.max(y1, y2) };

    this.sizeX = p2.x - p1.x + 1;
    this.sizeY = p2.y - p1.y + 1;
    this.rangeX = Array.from(
      { length: this.sizeX },
      (_, index) => index + p1.x,
    );
    this.rangeY = Array.from(
      { length: this.sizeY },
      (_, index) => index + p1.y,
    );

    this.tiles = Array.from(
      { length: this.sizeX },
      () =>
        Array.from(
          { length: this.sizeY },
          () => new Tile(0, 0, 0, 0),
        ),
    );

    this.avgLvl = 0;
    this.rangeX.forEach((x, idx) => {
      this.rangeY.forEach((y, idy) => {
        const tile = this.fm.getTile(x, y);
        this.tiles[idx][idy] = tile;
        this.avgLvl += tile.lvl;
      });
    });

    this.avgLvl /= this.sizeX * this.sizeY;
  }

  toJson(): { x: number; y: number; lvl: number }[] {
    const baseLvl = this.tiles[0][0].lvl;
    return this.rangeX
      .map((_, idx) =>
        this.rangeY.map((_, idy) => {
          const tile = this.tiles[idx][idy];
          return {
            ...tile.toJson(),
            x: idx,
            y: idy,
            lvl: tile.lvl - baseLvl,
          };
        })
      )
      .flat();
  }
}
export class TilesMatrix {
  world: World;
  fm: FactoryMap;
  size: number;
  tiles: Tile[][];
  avgLvl: number;
  x: number = 0;
  y: number = 0;
  tileScaleMod: number;
  rangeX: number[] = [];
  rangeY: number[] = [];

  constructor(
    size: number = 20,
    x: number = 0,
    y: number = 0,
    tileScaleMod: number = 1,
  ) {
    this.world = World.getInstance();
    this.fm = FactoryMap.getInstance();
    this.size = size;
    const tile = new Tile(0, 0, 0, 0);
    this.tiles = Array.from(
      { length: this.size },
      () =>
        Array.from(
          { length: this.size },
          () => tile,
        ),
    );

    this.tileScaleMod = tileScaleMod;
    this.avgLvl = 0;
    this.setCenter(x, y);
    this.update();
  }

  getPos(): [number, number] {
    return [this.x, this.y];
  }

  move(diffx: number, diffy: number): void {
    this.setCenter(this.x + diffx, this.y + diffy);
  }

  setCenter(x: number, y: number): void {
    this.x = x - x % this.tileScaleMod;
    this.y = y - y % this.tileScaleMod;
    this.rangeX = Array.from(
      { length: this.size },
      (_, index) =>
        (this.tileScaleMod * index) -
        (this.tileScaleMod * Math.floor(this.size / 2)) + this.x,
    );
    this.rangeY = Array.from(
      { length: this.size },
      (_, index) =>
        (this.tileScaleMod * index) -
        (this.tileScaleMod * Math.floor(this.size / 2)) + this.y,
    );
    this.update(this.tileScaleMod == 1);
  }

  update(generateChunk: boolean = false): void {
    this.avgLvl = 0;
    this.rangeX.forEach((x, idx) => {
      this.rangeY.forEach((y, idy) => {
        const tile = generateChunk
          ? this.fm.getTile(x, y)
          : this.fm.getTileNoGen(x, y);
        if (!tile) {
          console.error("---ERROR", x, y, tile, this);
        } else {
          this.tiles[idx][idy] = tile;
          this.avgLvl += tile.lvl;
        }
      });
    });
    this.avgLvl /= this.size * this.size;
  }
}
