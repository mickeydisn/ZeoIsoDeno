import { Biome } from "./object/biomes.ts";
import { Chunk } from "./object/chunk.ts";
import { Tile } from "./object/tile.ts";
import { RawTile } from "./object/tileRaw.ts";
// Assuming external dependencies/stubs

// --- 1. World and Utility Interfaces ---

// Placeholder for the central World object, acting as a service locator
export interface IWorld {
  seed: string;
  factoryGenerator: IFactoryGenerator;
  factoryMap: IFactoryMap;
  factoryTileRawGenerator: IFactoryTileRawGenerator;
  // Add other world properties as needed
}

// Interface for the base Biome configuration data (from data/biomes.ts)
export interface IGameBiomesType {
  id: string;
  name: string;
  rgb: string[]; // String representations of color functions (e.g., "lvl * 1")
  lvlType: string;
}

// Interface for Flora item configuration data (from data/items.ts)
export interface IGameFloreItem {
  key: string;
  b: number[]; // Array of biome IDs this item can appear in
  flore: {
    mod: number;
    eq: number;
    min: number;
    max: number;
  };
  l: {
    min: number;
    max: number;
  };
}

// Interface for the noise frequency configuration (from factoryTileRawGenerator.ts)
export interface IFrequencyConf {
  f: number; // Frequency
  a: number; // Amplitude
  t?: number; // TimeDiff (optional)
}

// Interface for items on a tile (from tile.ts/tileRaw.ts)
export interface IRecordRawItem {
  name: string;
  count: number;
}

// Interface for Tile data used in save/load operations
export interface ITileInfo {
  x: number;
  y: number;
  currentLvl: number;
  currentColor: [number, number, number];
  isBlock: boolean;
  isFrise: boolean;
  wcBuildTile: any | null; // Assuming a type for WcBuildTileInfo
  // cityNode: any | null; // Assuming a type for cityNode
  // items: IRecordRawItem[];
}

// --- 2. Data/Entity Interfaces ---

export interface IBiome {
  name: string;
  id: string;
  rgb: string[];
  lvlType: string;
  // Dynamic functions created via eval
  color: (lvl: number, flore: number) => number[];
  flore: (lvl: number, flore: number) => string;

  // Methods
  appendFloreCondition(condition: string): void;
}

export interface IRawTile {
  world: IWorld;
  fm: IFactoryMap;
  x: number;
  y: number;

  // Raw Noise Values (Inputs)
  rLvl: number;
  r2Lvl: number;
  rPeak: number;
  rErosion: number;
  rFlore: number;
  rBuildTile: number;

  // Processed Feature Values
  fHydro: number;
  fTemp: number;
  fLvl: number;
  fDensity: number;

  // Final/Selected Data
  peakValue: number;
  peakType: string;
  rawBiome: IBiome;
  genLvl: number;
  genLvl2: number;
  genLvlWater: number;
  genColor: Uint8Array;
  genItems: Array<IRecordRawItem>;
}

export interface ITile extends IRawTile {
  // Coordinates
  cx: number;
  cy: number;

  // Game State
  _currentLvl: number;
  _currentColor: Uint8Array;
  isBlock: boolean;
  isFrise: boolean;

  // Caches and references
  _nearTiles: Tile[];
  _nearTilesCross: Tile[];
  items: IRecordRawItem[];
  entities: any[]; // Assuming CityEntity is defined externally
  temporatyItems: any[];

  // Getters/Setters
  lvl: number;
  color: number[];

  // Methods
  clearTemporary(): void;
  checkDirty(): boolean;
  toDeltaJson(): any;
  applyDelta(delta: any): void;
  toJsonSave(): any;
  fromJsonSave(data: any): void;
}

export interface IChunk {
  world: IWorld;
  fm: IFactoryMap;
  size: number;
  cx: number;
  cy: number;
  x: number;
  y: number;
  sizeBorder: number;
  sizeFull: number;
  matrixGen: Tile[][] | null; // Can be nullified after init
  matrix: Tile[][];

  // Methods
  get(x: number, y: number): Tile;
  getDeltas(): any[];
  applyDeltas(deltas: any[]): void;
  initGenMatrix(): void;
  smoothMatrix(): void;
  copyMatrix(): void;
}


// --- 3. Factory Interfaces ---

export interface IFactoryBiomes {
  biomes: Record<string, Biome>;
  // Methods
  addFloreCondition(floreItemsConf: IGameFloreItem): void;
}

export interface IFactoryGenerator {
  world: IWorld;
  biomes: Record<string, Biome>;
  biomeMatrix: string[];
  seed: string;
  waterLvl: number;
  mountLvl: number;
  simplex: any; // Assuming SimplexNoise

  // Methods
  getLvl(x: number, y: number, zoom?: number, grain?: number): number;
  getBiome(x: number, y: number, lvl?: number, zoom?: number): Biome;
  getTemperature(x: number, y: number, zoom?: number, grain?: number): number;
  getHydro(x: number, y: number, zoom?: number, grain?: number): number;
  getBiomeColor(x: number, y: number, lvl?: number, zoom?: number): number[];
}

export interface IFactoryMap {
  world: IWorld;
  fg: IFactoryGenerator;
  chunkIndex: Map<number, Map<number, Chunk>>;

  // Methods
  getExistingChunk(cx: number, cy: number): Chunk | null;
  getChunk(cx: number, cy: number): Chunk;
  chunkPoint(x: number, y: number): [number, number, number, number];
  getRoundTile(x: number, y: number): Tile;
  getTile(x: number, y: number): Tile;
  getTileNoGen(x: number, y: number): RawTile;
}

export interface IFactoryTileRawGenerator {
  world: IWorld;
  seed: string;
  simplex: any; // Assuming SimplexNoise

  // Methods
  getRawLvl(x: number, y: number): number;
  getRawPeak(x: number, y: number): number;
  getRawErosion(x: number, y: number): number;
  getRawFlore(x: number, y: number, t?: number): number;
  getRawDensity(x: number, y: number): number;
  getRawBuildTile(x: number, y: number, t?: number): number;
}

// --- 3. Persistence Interfaces ---

export interface IMapPersistence {
  saveChunkDeltas(cx: number, cy: number, deltas: any[]): Promise<void>;
  loadChunkDeltas(cx: number, cy: number): Promise<any[]>;
}
