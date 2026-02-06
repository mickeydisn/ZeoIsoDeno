import { SimplexNoise } from "./scripts/simplex-noise.ts";
import { GAME_BIOMES_MATRIS } from "../data/biomes.ts";
import { World } from "../../word.ts";
import { FactoryBiomes } from "./factoryBiomes.ts";
import { Biome } from "../object/biomes.ts";

export class FactoryGenerator {
  private static instance: FactoryGenerator;
  public static getInstance(): FactoryGenerator {
    return FactoryGenerator.instance ??= new FactoryGenerator();
  }

  biomes: Record<string, Biome>;
  biomeMatrix: string[];
  seed: string;
  waterLvl: number = 64;
  mountLvl: number = 196;
  simplex: SimplexNoise;

  constructor() {
    console.log("== Init Factory Generator ==");
    this.biomes = FactoryBiomes.getInstance().biomes;
    this.biomeMatrix = GAME_BIOMES_MATRIS;
    this.seed = World.getInstance().seed;
    this.simplex = new SimplexNoise(this.seed);
  }

  private _noise(x: number, y: number): number {
    const f0 = 1 / 4 / 16;
    return (this.simplex.noise2D(f0 * x, f0 * y) + 1) / 2;
  }

  private _zoom_and_grain(
    x: number,
    y: number,
    zoom: number,
    grain: number,
  ): [number, number] {
    x = zoom * x;
    y = zoom * y;
    x -= x > 0 ? (x % grain - grain / 2) : (x % grain + grain / 2);
    y -= y > 0 ? (y % grain - grain / 2) : (y % grain + grain / 2);
    return [x, y];
  }

  getRawLvl(x: number, y: number, zoom = 1, grain = 1): number {
    let lvl = 0;
    [x, y] = this._zoom_and_grain(x, y, zoom, grain);

    lvl += this._noise((1 / 200) * x, (1 / 200) * y) * 8;
    lvl += this._noise((1 / 20) * x, (1 / 20) * y) * 4;
    lvl += this._noise((1 / 8) * x, (1 / 8) * y) * 1;
    lvl += this._noise((2 / 3) * x, (2 / 3) * y) * (1 / 4);

    return lvl / (8 + 4 + 1 + 1 / 4);
  }

  getLvl(x: number, y: number, zoom = 1, grain = 1): number {
    return (this.getRawLvl(x, y, zoom, grain) * 256) & 0xff;
  }

  getBiome(x: number, y: number, zoom: number = 1): Biome {
    const lvl = Math.floor(this.getLvl(x, y, zoom));
    if (lvl < this.waterLvl) return this.biomes["ocean"];
    if (lvl > this.mountLvl) return this.biomes["mont1"];
    if (lvl === this.waterLvl || lvl === this.waterLvl + 1) {
      return this.biomes["beach"];
    }
    if (lvl === this.mountLvl) return this.biomes["mountL"];

    const temp = Math.floor(this.getTemperature(x, y, zoom) / 32);
    const hydro = Math.floor(this.getHydro(x, y, zoom) / 32);
    return this.biomes[this.biomeMatrix[temp * 8 + hydro]];
  }

  getTemperature(x: number, y: number, zoom = 1, grain = 1): number {
    let lvl = 0;
    [x, y] = this._zoom_and_grain(x, y, zoom, grain);
    lvl += this._noise((1 / 40) * x, (1 / 40) * y);
    lvl /= 1;
    return (lvl * 256) & 0xff;
  }

  getHydro(x: number, y: number, zoom = 1, grain = 1): number {
    let lvl = 0;
    [x, y] = this._zoom_and_grain(x, y, zoom, grain);
    lvl += this._noise((1 / 20) * x, (1 / 20) * y);
    lvl /= 1;
    return (lvl * 256) & 0xff;
  }

  getBiomeColor(x: number, y: number, lvl = 0, zoom = 1): number[] {
    return this.getBiome(x, y, zoom).color(lvl, 0);
  }
}

export function hslToRgb(h: number, s: number, l: number): number[] {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
