import { Biome } from "./biomes.ts";
import { FactoryTileGenerator, RecordRawItem } from "../factory/factoryTileGenerator.ts";
import { FactoryTileRawGenerator } from "../factory/factoryTileRawGenerator.ts";


export class RawTile {
  x: number;
  y: number;

  rLvl: number;
  rLvl2: number;
  rPeak: number;
  rErosion: number;
  rFlore: number;
  rBuildTile: number;

  fHydro: number;
  fTemp: number;
  fLvl: number;
  fDensity: number;

  peakValue: number = 0;
  peakType: string = "";
  rawBiome: Biome;

  genLvl: number;
  genLvl2: number;
  genLvlWater: number;
  genColor: Uint8Array;
  genItems: Array<RecordRawItem>;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    const ftrg = FactoryTileRawGenerator.getInstance();
    this.rLvl = ftrg.getRawLvl(x, y);
    this.rLvl2 = ftrg.getRawLvl2(x, y);
    this.rPeak = ftrg.getRawPeak(x, y);
    this.rErosion = ftrg.getRawErosion(x, y);
    this.rFlore = ftrg.getRawFlore(x, y);
    this.rBuildTile = ftrg.getRawBuildTile(x, y);

    this.fHydro = ftrg.getFuncHydro(x, y);
    this.fTemp = ftrg.getFuncTemperature(x, y);
    this.fLvl = ftrg.getFuncLvl(x, y);
    this.fDensity = ftrg.getFuncDensity(x, y);

    //
    const ftg = FactoryTileGenerator.getInstance();

    [this.peakType, this.peakValue] = ftg.genTilePeak(this);
    this.rawBiome = ftg.genRawBiome(this);
    [this.genLvl, this.genLvlWater] = ftg.genLvl(this);
    this.genLvl2 = ftg.genLvlScale(this);
    this.genColor = ftg.genColor(this);
    this.genItems = ftg.genItems(this);
  }
}
