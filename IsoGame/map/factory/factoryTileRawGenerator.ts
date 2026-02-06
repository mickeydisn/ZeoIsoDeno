import { World } from "../../word.ts";
import { SimplexNoise } from "./scripts/simplex-noise.ts";

// Global Scale nose frequency Scale.
// const F = 4.2;
const F = 5.2;

type frequencyConf = {
  f: number; // Frequency
  a: number; // Amplitude
  t?: number; // TimeDiff
};

export class FactoryTileRawGenerator {
  private static instance: FactoryTileRawGenerator;
  public static getInstance(): FactoryTileRawGenerator {
    return FactoryTileRawGenerator.instance ??= new FactoryTileRawGenerator();
  }
  // --------------------------------------------------------------------------
  seed: string = World.getInstance().seed
  simplex: SimplexNoise = new SimplexNoise(this.seed);

  constructor() {
    console.log("== Init Factory Tile Raw Generator ==");
  }
  // --------------------------------------------------------------------------

  // Pretty configured noise function.
  _noise(x: number, y: number): number {
    const f0 = 1 / 4 / 16;
    return (this.simplex.noise2D(f0 * x, f0 * y) + 1) / 2;
  }

  _factalNoise(x: number, y: number, frequencies: frequencyConf[]) {
    const sum: number = frequencies.reduce((acc, v) => acc + v.a, 0);

    let lvl: number = 0;

    for (const frequency of frequencies) {
      const f: number = F * frequency.f;
      const amplitude: number = frequency.a;
      const t: number = frequency.t || 0;
      lvl += this._noise(f * x + t, f * y + t) * amplitude;
    }
    lvl /= sum;
    return lvl;
  }

  getRawTemperature(x: number, y: number): number {
    const frequencies = [
      { a: 15, f: 1 / 264, t: 42 },
      { a: 25, f: 1 / 54, t: 42 },
      { a: 10, f: 1 / 43, t: 42 },
      { a: 2, f: 1 / 6, t: 0 },
      { a: .5, f: 25, t: 0 },
    ];
    let lvl = this._factalNoise(x, y, frequencies);

    const t2: number = 1042;
    const fBig = F * 1 / 500;
    lvl = lvl + (this._noise(fBig * x + t2, fBig * y + t2) * 2 - 1) * .1;

    return lvl;
  }

  getRawHydro(x: number, y: number): number {
    const frequencies = [
      { a: 20, f: 1 / 47.5, t: -150 },
      { a: 25, f: 1 / 17.5, t: -150 },
      { a: 15, f: 1 / 7.5, t: -150 },
      { a: 3, f: 1 / .75, t: -150 },
      { a: .5, f: 35, t: 0 },
    ];
    let lvl = this._factalNoise(x, y, frequencies);

    const t2: number = -10042;
    const fBig = F * 1 / 387;
    lvl = lvl + (this._noise(fBig * x + t2, fBig * y + t2) * 2 - 1) * .3;

    return lvl;
  }

  /* --- */

  getRawLvl(x: number, y: number = 1) {
    const frequencies = [
      { a: 32, f: 1 / 140 },
      { a: 20, f: 1 / 60 },
      { a: 10, f: 1 / 25 },
      { a: 2, f: 1 / 10 },
      { a: .5, f: 2 / 3 },
    ];
    let lvl = this._factalNoise(x, y, frequencies);

    const fBig = F * 1 / 432;
    lvl = lvl + (this._noise(fBig * x, fBig * y) * 2 - 1) * .1;
    return lvl;
  }

  getRawLvl2(x: number, y: number = 1) {
    const frequencies = [
      { a: 5, f: 1 / 25 },
      { a: 20, f: 1 / 10 },
      { a: 10, f: 2 / 3 },
      { a: 5, f: 1 },
      { a: 20, f: 16 },
      { a: 20, f: 22 },
    ];
    const lvl = this._factalNoise(x, y, frequencies);

    // const fw = F * 1 / 100;
    // lvl *= this._noise(fw * x, fw * y);
    return lvl;
  }

  getRawPeak(x: number, y: number = 1) {
    const frequencies = [
      { a: 1, f: 1 / 17 },
      { a: 1 / 2, f: 2 / 17 },
      { a: 1 / 4, f: 3 / 17 },
    ];
    let lvl = this._factalNoise(x, y, frequencies);

    // Change Orientation
    lvl = (lvl - .5) * 2;
    lvl = lvl > 0 ? lvl : -lvl;
    return lvl;
  }

  getRawErosion(x: number, y: number = 1) {
    const frequencies = [
      { a: 1, f: 1 / 100 },
      { a: 1 / 8, f: 1 / 50 },
      { a: 1 / 16, f: 1 / 25 },
    ];
    const lvl = this._factalNoise(x, y, frequencies);
    return lvl;
  }

  /* --- */

  getRawFlore(x: number, y: number, _: number = 0): number {
    const frequencies = [
      { a: 4, f: 1 / 15 },
      { a: 1, f: .75 },
    ];
    const lvl = this._factalNoise(x, y, frequencies);
    return lvl;
  }

  getRawDensity(x: number, y: number): number {
    const frequencies = [
      { a: 16, f: 1 / 40 },
      { a: 8, f: 1 / 40 },
      { a: 1, f: 1 / 2 },
    ];
    let lvl = this._factalNoise(x, y, frequencies);
    if (lvl < 0.5) {
      lvl = 1 - lvl;
    }
    return lvl;
  }

  getRawBuildTile(x: number, y: number, _: number = 0) {
    const frequencies = [
      { a: 1, f: 42 },
    ];
    const lvl = this._factalNoise(x, y, frequencies);
    return lvl;
  }

  /* */

  getFuncLvl(x: number, y: number): number {
    const lvl = this.getRawLvl(x, y);
    return lvl * 256 & 0xFF;
  }
  getFuncLvl2(x: number, y: number): number {
    const lvl = this.getRawLvl2(x, y);
    return lvl * 256 & 0xFF;
  }

  getFuncTemperature(x: number, y: number): number {
    const lvl = this.getRawTemperature(x, y);
    return lvl * 256 & 0xFF;
  }
  getFuncHydro(x: number, y: number): number {
    const lvl = this.getRawHydro(x, y);
    return lvl * 256 & 0xFF;
  }

  getFuncDensity(x: number, y: number): number {
    const dencity = this.getRawDensity(x, y);
    return dencity * 255 & 0xFF;
  }
}
