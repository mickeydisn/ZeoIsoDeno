import { Biome } from "../object/biomes.ts";
import { GAME_BIOMES_MATRIS } from "./data/biomes.ts";
import { RawTile } from "../object/tileRaw.ts";
import { FactoryBiomes } from "./factoryBiomes.ts";
import { hslToRgb, rgbToHsl } from "@iso-game/etc/utils/color.ts";

export type RecordRawItem = {
  t: string; // type of the item
  key: string; // key of the item
  lvl: number; // The lvl is a string
  off?: { x: number; y: number };
};

export class FactoryTileGenerator {
  private static instance: FactoryTileGenerator;
  public static getInstance(): FactoryTileGenerator {
    return FactoryTileGenerator.instance ??= new FactoryTileGenerator();
  }
  // --------------------------------------------------------------------------


  biomes: Record<string, Biome> = FactoryBiomes.getInstance().biomes;
  biomeMatrix: string[] = GAME_BIOMES_MATRIS;

  waterLvl: number = 64;
  mountLvl: number = 196;
  LvlX: Record<string, number>;
  Lvl2: Record<string, number>;
  scale: Record<string, Record<string, (value: number) => number>>;

  constructor() {
    this.LvlX = {
      Z: 0,
      W1: 32,
      W2: 64,
      P0: 64,
      P1: 96,
      P2: 160,
      M1: this.mountLvl,
      M2: 224,
      T: 500,
    };
    this.Lvl2 = {
      Z: -144,
      W1: -32,
      W2: 79,
      P0: 80,
      P1: 96,
      P2: 128,
      M1: this.mountLvl,
      M2: this.mountLvl + 128,
      T: this.mountLvl + 256 * 5, // 288 + 64
    };
    const LvlX = this.LvlX;
    const Lvl2 = this.Lvl2;

    //  .w. -- . -- . -- .m.

    const scale_Base = {
      Z_W1: scalePow([LvlX.Z, LvlX.W1], [Lvl2.Z, Lvl2.W1], 4),
      W1_W2: scalePow([LvlX.W1, LvlX.W2], [Lvl2.W1, Lvl2.W2], -2),

      P0_P1: scaleLinear([LvlX.P0, LvlX.P1], [Lvl2.P0, Lvl2.P1]),
      P1_P2: scaleLinear([LvlX.P1, LvlX.P2], [Lvl2.P1, Lvl2.P2]),
      P2_M1: scaleLinear([LvlX.P2, LvlX.M1], [Lvl2.P2, Lvl2.M1]),

      M1_M2: scalePow([LvlX.M1, LvlX.M2], [Lvl2.M1, Lvl2.M2], 3),
      M2_T: scalePow([LvlX.M2, LvlX.T], [Lvl2.M2, Lvl2.T], 3),
    };

    const fRiverScale = scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], 10);

    this.scale = {
      //  .w. /¯¯ . *¯¯ . *¯¯ .m.   ==> Hill
      Hill: {
        ...scale_Base,
        P0_P1: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], -.2),
        P1_P2: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], -.2),
        P2_M1: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], -.2),
      },

      //  .w. /¯¯ . *¯¯ . _/ .m.  ===> Plateau
      Plat: {
        ...scale_Base,
        P0_P1: scalePow([LvlX.P0, LvlX.P2], [Lvl2.P0, Lvl2.P2], -.2),
        P1_P2: scalePow([LvlX.P0, LvlX.P2], [Lvl2.P0, Lvl2.P2], -.2),
        P2_M1: scalePow([LvlX.P2, LvlX.M1], [Lvl2.P2, Lvl2.M1], 3),
      },

      //  .w. -- . __/ . /¯¯ .m. ===> Coline
      Coli: {
        ...scale_Base,
        P0_P1: scaleLinear([LvlX.P0, LvlX.P1], [Lvl2.P0, Lvl2.P1]),
        P1_P2: scalePow([LvlX.P1, LvlX.P2], [Lvl2.P1, Lvl2.P2], 3),
        P2_M1: scalePow([LvlX.P2, LvlX.M1], [Lvl2.P2, Lvl2.M1], -.2),
      },

      //  .w. __/ . *__/ . *__/ .m. ===> Plane
      Plan: {
        ...scale_Base,
        P0_P1: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], 3),
        P1_P2: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], 3),
        P2_M1: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], 3),
      },

      //  .w. __/ . *__/ . *__/ .m. ===> Plane
      River: {
        ...scale_Base,
        P0_P1: (lvl: number) => fRiverScale(lvl) - 5,
        P1_P2: (lvl: number) => fRiverScale(lvl) - 5,
        P2_M1: (lvl: number) => fRiverScale(lvl) - 5,
      },
    };
  }

  genTilePeak(tile: RawTile): [string, number] {
    const eroLvl = tile.rErosion;
    const peakLvl = tile.rPeak;
    const peakLocal: number = (1 - eroLvl) * peakLvl;
    // RIVER
    if (peakLocal < .003 && eroLvl > .55) { // river
      const factor = 1 - peakLocal * (1 / .003);
      return ["river", -(3 * factor + 1)];
    }
    // TALUS
    if (peakLocal < .04 && eroLvl < .55) {
      const factor = 1 - peakLocal * (1 / .04);
      tile.peakType = "talus";
      tile.peakValue = 10 * factor;
      return ["talus", 10 * factor];
    }
    // HILL
    if (peakLocal > .4) {
      let factor = (peakLocal - .4) * (1 / (1 - .4));
      factor = 1 - Math.pow(1 - factor, 6);
      return ["hill", 40 * factor + 2];
    }
    return ["", 0];
  }

  genRawBiome(tile: RawTile): Biome {
    const lvl = Math.floor(tile.fLvl);

    const mod = 32;
    const temp = (tile.fTemp - tile.fTemp % mod) / mod;
    const hydro = (tile.fHydro - tile.fHydro % mod) / mod;
    let biome = this.biomes[this.biomeMatrix[temp * 8 + hydro]];

    if (lvl < this.waterLvl) {
      biome = this.biomes["ocean"];
    } else if (lvl > this.mountLvl) {
      biome = this.biomes["mont1"];
    } else if (lvl == this.waterLvl || lvl == this.waterLvl + 1) {
      biome = this.biomes["beach"];
    } else if (lvl == this.mountLvl) {
      biome = this.biomes["mountL"];
    } else if (tile.peakValue < 0) {
      biome = this.biomes["river"];
    }
    tile.rawBiome = biome;
    return biome;
  }

  genLvl(tile: RawTile): [number, number] {
    const rawLvl = tile.rLvl * 256;
    const rawLvlMod = tile.fLvl;

    // Ajuste Lvl to be more natural ( less liear )
    let lvl = 0;
    if (rawLvlMod < 80) {
      lvl = 0.0008 * Math.pow(rawLvl - 80, 3) + 70; // 0.001 => Deep Sea, 0.0001 => Flat Sea
    } else {
      lvl = 0.05 * Math.pow(rawLvl - 80, 2) + 70; // 0.01 => Flat Montagne , 0.05 => Hight montagne
    }

    // Creta a gap on the water lvl
    if (rawLvlMod < this.waterLvl) {
      lvl -= 1 / 3;
      return [lvl, this.waterLvl];
    }

    // Apply Erotion & PeakValet
    if (rawLvlMod > this.waterLvl) {
      const lvlPeak = tile.peakValue;
      if (tile.peakType == "river") {
        return [lvl - 1 / 3 + lvlPeak, lvl - 1 / 3];
      }
      lvl += lvlPeak;
      return [lvl, lvl];
    }

    return [lvl, lvl];
  }

  genLvlScale(tile: RawTile) {
    const rawLvl = tile.rLvl * 255;
    const fLvl = tile.fLvl;
    const rLvl2 = 0.5 - (tile.rLvl2 < .5 ? tile.rLvl2 : 1 - tile.rLvl2);
    const scale = this.scale[tile.rawBiome.lvlType];
    // const scale = this.scale["Plan"]

    let lvl = 0;

    const LvlX = this.LvlX;
    const Lvl2 = this.Lvl2;

    if (fLvl < LvlX.W1) {
      lvl = scale.Z_W1(rawLvl);
    } else if (fLvl < LvlX.W2) {
      lvl = scale.W1_W2(rawLvl);
    } else if (fLvl == LvlX.W2) {
      lvl = Lvl2.P0;
    } else if (fLvl < LvlX.P1) {
      lvl = scale.P0_P1(rawLvl);
    } else if (fLvl < LvlX.P2) {
      lvl = scale.P1_P2(rawLvl);
    } else if (fLvl < LvlX.M1) {
      lvl = scale.P2_M1(rawLvl);
    } else if (fLvl == LvlX.M1) {
      lvl = Lvl2.M1;
    } else if (fLvl < LvlX.M2) {
      lvl = scale.M1_M2(rawLvl);
      lvl += rLvl2 * 200;
    } else {
      lvl = scale.M2_T(rawLvl);
      lvl += rLvl2 * 200;
    }

    lvl += rLvl2 * 50;
    // lvl += tile.fLvl2 * .05; // Accidented terrain ( .05 smoth , 2 very accidented)
    lvl = lvl * 1.1 //  Main hieh differenace .  
    return lvl;
  }

  /* ----------- */

  genColor(tile: RawTile): Uint8Array {
    // const lvl: number = tile.fLvl - tile.fLvl % 4;
    const c = new Uint8Array(tile.rawBiome.color(tile.fLvl, 0));
    const hsl = rgbToHsl(c[0], c[1], c[2]);
    c.set(hslToRgb(hsl[0], hsl[1] * 0.3, hsl[2]));
    return c;
  }

  genItems(tile: RawTile): RecordRawItem[] {
    const biome = tile.rawBiome;
    const lvl = tile.fLvl;
    const f = tile.rFlore * 255;
    const itemskey = biome.flore(lvl, f);
    if (itemskey == null) {
      return [];
    }
    return [{ t: "Svg", key: itemskey, lvl: 0 } as RecordRawItem];
  }
}

/** ----------------------------------------------------- */
/** ----------------------------------------------------- */

export function scalePow(
  domain: [number, number],
  range: [number, number],
  _: number,
) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;

  return (value: number) => {
    // Normalize value to [0, 1] based on domain
    const normalizedValue = (value - domainMin) / (domainMax - domainMin);

    // Map the normalized value to the range
    return rangeMin + (rangeMax - rangeMin) * normalizedValue;
  };

}

export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;

  return (value: number) => {
    // Normalize value to [0, 1] based on domain
    const normalizedValue = (value - domainMin) / (domainMax - domainMin);

    // Map the normalized value to the range
    return rangeMin + (rangeMax - rangeMin) * normalizedValue;
  };
}

/** ----------------------------------------------------- */
/** ----------------------------------------------------- */
