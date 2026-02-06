import { FactoryGenerator } from "../map/factory/factoryGenerator.ts";
import { FactoryMap } from "../map/factory/factoryMap.ts";
import { scaleLinear } from "../map/factory/factoryTileGenerator.ts";
import { RawTile } from "../map/object/tileRaw.ts";
import { World } from "../word.ts";

export type CanvasMiniMapConf = {
  CHUNK_SIZE: number;
  MAP_DEFINITION: number;
  SHOW_BIOME_COLOR: boolean;
  SHOW_LVL: boolean;
  SHOW_LVLBIOME: boolean;
  SHOW_TEMP: boolean;
  SHOW_HIDRYO: boolean;
};

const CanvasMiniMapConfDefault: CanvasMiniMapConf = {
  CHUNK_SIZE: 1,
  MAP_DEFINITION: 1,
  SHOW_BIOME_COLOR: true,
  SHOW_LVL: false,
  SHOW_LVLBIOME: false,
  SHOW_TEMP: false,
  SHOW_HIDRYO: false,
};

// Helper function to scale genLvl2 value (moved outside class)
const scaleGenLvl = scaleLinear([-144, 512], [0, 255]);
const getGenLvlScaled = (atile: RawTile): number => {
  const genLvl = scaleGenLvl(atile.genLvl2);
  // Original logic: round down to nearest 10
  return genLvl - (genLvl % 10);
};

export class CanvasMiniMap {
  world: World;
  fg: FactoryGenerator;
  fm: FactoryMap;
  sizeW: number;
  sizeH: number;
  canvas: OffscreenCanvas;
  canvasCtx: OffscreenCanvasRenderingContext2D | null;
  conf: CanvasMiniMapConf;
  
  // Optimization 1: ImageData Buffer for fast drawing
  private imageData: ImageData | null = null;
  private data: Uint8ClampedArray | null = null;
  
  // Optimization 2: Local Cache for expensive RawTile generation
  private tileCache: Map<string, RawTile> = new Map();

  constructor(
    world: World,
    width: number,
    height: number,
    canvas: OffscreenCanvas,
    conf: CanvasMiniMapConf = CanvasMiniMapConfDefault,
  ) {
    this.conf = conf;
    this.world = world;
    this.fg = FactoryGenerator.getInstance();
    this.fm = FactoryMap.getInstance();
    this.sizeW = width;
    this.sizeH = height;

    console.log("=== MiniMap - Init");
    this.canvas = canvas;
    this.canvasCtx = this.canvas.getContext("2d");

    if (this.canvasCtx == null) return;
    this.canvasCtx.imageSmoothingEnabled = false;

    // Initialize ImageData once
    this.imageData = this.canvasCtx.createImageData(this.sizeW, this.sizeH);
    this.data = this.imageData.data;
  }
  
  /**
   * Optimization: Cached wrapper for the expensive fm.getTileNoGen call.
   * If the tile exists in the cache, returns it immediately. Otherwise, generates and caches it.
   */
  private _getTileNoGenCached(x: number, y: number): RawTile {
      const key = `${x}:${y}`;
      
      if (this.tileCache.has(key)) {
          // Type assertion is safe here as we control what goes into the Map
          return this.tileCache.get(key) as RawTile; 
      }

      // Costly map generation call
      const tile: RawTile = this.fm.getTileNoGen(x, y); 
      this.tileCache.set(key, tile);
      
      return tile;
  }
  
  /**
   * Memory Optimization: Cleans the cache by removing tiles far outside the current view.
   * Uses a margin of 2x the current visible extent.
   */
  private _cleanCache(centreX: number, centreY: number) {
    // Calculate the map's current visible radius in world units
    const tilesPerDimensionW = this.sizeW / this.conf.MAP_DEFINITION;
    const tilesPerDimensionH = this.sizeH / this.conf.MAP_DEFINITION;

    const worldViewWidth = tilesPerDimensionW * this.conf.CHUNK_SIZE;
    const worldViewHeight = tilesPerDimensionH * this.conf.CHUNK_SIZE;
    
    // Define an aggressive margin (2x view extent)
    const KEEP_MARGIN_X = worldViewWidth * 2;
    const KEEP_MARGIN_Y = worldViewHeight * 2;

    const xMin = centreX - KEEP_MARGIN_X;
    const xMax = centreX + KEEP_MARGIN_X;
    const yMin = centreY - KEEP_MARGIN_Y;
    const yMax = centreY + KEEP_MARGIN_Y;
    
    // Iterate and delete out-of-bounds tiles (key format is "x:y")
    for (const key of this.tileCache.keys()) {
        const parts = key.split(':');
        const x = parseInt(parts[0], 10);
        const y = parseInt(parts[1], 10);
        
        if (x < xMin || x > xMax || y < yMin || y > yMax) {
            this.tileCache.delete(key);
        }
    }
  }


  /**
   * Code Clarity Refactor: Encapsulates all color and border calculation logic.
   * Returns [r, g, b, a, borderR, borderG, borderB, borderA, drawBorderFlag]
   */
  private _calculatePixelData(
      tile: RawTile,
      tile2: RawTile,
      tile3: RawTile,
      conf: CanvasMiniMapConf,
  ): [number, number, number, number, number, number, number, number, boolean] {
      let r = 0, g = 0, b = 0, a = 255;
      let br = 0, bg = 0, bb = 0, ba = 0;
      let drawBorder = false;

      if (conf.SHOW_BIOME_COLOR) {
          // Use genColor (Uint8Array) as 'color' property doesn't exist on RawTile
          const c = tile.genColor; 
          r = c[0]; g = c[1]; b = c[2]; a = 255;
          
          if (tile.rawBiome.name != tile2.rawBiome.name || tile.rawBiome.name != tile3.rawBiome.name) {
              drawBorder = true;
              br = 0; bg = 0; bb = 0; ba = Math.floor(255 * 0.5);
          }
      }
      else if (conf.SHOW_LVL) {
          const cLvl = tile.fLvl - (tile.fLvl % 16);
          r = cLvl; g = 0; b = cLvl; a = Math.floor(255 * 0.2);
          
          const cLvl2 = tile2.fLvl - (tile2.fLvl % 16);
          const cLvl3 = tile3.fLvl - (tile3.fLvl % 16);
          
          if (cLvl != cLvl2 || cLvl != cLvl3) {
              drawBorder = true;
              br = cLvl; bg = cLvl; bb = cLvl; ba = Math.floor(255 * 0.8);
          }
      }
      else if (conf.SHOW_LVLBIOME) {
          const cLvl = getGenLvlScaled(tile);
          r = cLvl; g = cLvl; b = cLvl; a = Math.floor(255 * 0.2);
          
          const cLvl2 = getGenLvlScaled(tile2);
          const cLvl3 = getGenLvlScaled(tile3);
          
          if (cLvl != cLvl2 || cLvl != cLvl3) {
              drawBorder = true;
              br = cLvl; bg = cLvl; bb = cLvl; ba = Math.floor(255 * 0.8);
          }
      }
      else if (conf.SHOW_TEMP) {
          const temp = tile.fTemp - (tile.fTemp % 32);
          const cTemp = temp + Math.floor((255 - temp) / 2);
          r = cTemp; g = Math.floor((255 - temp) / 2); b = 255 - temp; a = Math.floor(255 * 0.2);
          
          const temp2 = tile2.fTemp - (tile2.fTemp % 32);
          const temp3 = tile3.fTemp - (tile3.fTemp % 32);
          
          if (temp != temp2 || temp != temp3) {
              drawBorder = true;
              br = cTemp; bg = Math.floor((255 - temp) / 2); bb = 255 - temp; ba = Math.floor(255 * 0.7);
          }
      }
      else if (conf.SHOW_HIDRYO) {
          const hydro = tile.fHydro - (tile.fHydro % 32);
          r = 255 - hydro; g = 255; b = hydro; a = Math.floor(255 * 0.2);
          
          const hydro2 = tile2.fHydro - (tile2.fHydro % 32);
          const hydro3 = tile3.fHydro - (tile3.fHydro % 32);
          
          if (hydro != hydro2 || hydro != hydro3) {
              drawBorder = true;
              br = 255 - hydro; bg = 255; bb = hydro; ba = Math.floor(255 * 0.7);
          }
      }

      return [r, g, b, a, br, bg, bb, ba, drawBorder];
  }

  drawUpdate(centreX: number, centreY: number, conf?: CanvasMiniMapConf) {
    if (this.canvasCtx == null || this.data == null || this.imageData == null) return;

    // Memory Eviction: Prune the cache based on the current center
    this._cleanCache(centreX, centreY);

    this.conf = conf ? conf : CanvasMiniMapConfDefault;
    const ctx = this.canvasCtx;
    const data = this.data;

    // Center the map on a CHUNK_SIZE boundary
    const xOffset = centreX - (centreX % this.conf.CHUNK_SIZE);
    const yOffset = centreY - (centreY % this.conf.CHUNK_SIZE);

    // Pre-calculate fixed matrix sizes
    const matrixSizeW = Math.floor(this.sizeW / this.conf.MAP_DEFINITION);
    const matrixSizeH = Math.floor(this.sizeH / this.conf.MAP_DEFINITION);
    
    const halfMatrixW_ChunkSteps = Math.floor(matrixSizeW / 2);
    const halfMatrixH_ChunkSteps = Math.floor(matrixSizeH / 2);

    const step = this.conf.MAP_DEFINITION;
    const chunkSize = this.conf.CHUNK_SIZE;

    // MICRO-OPTIMIZATION: Pre-calculate the constant part of the world coordinate offsets
    // This reduces arithmetic operations inside the inner loop from 4/5 down to 2 per coordinate.
    // X coordinate: xOffset + chunkSize * col - chunkSize * halfMatrixH_ChunkSteps
    const X_BASE_WORLD = xOffset  - chunkSize * halfMatrixH_ChunkSteps;
    // Y coordinate: yOffset + chunkSize * matrixSizeH - chunkSize * row - chunkSize * halfMatrixW_ChunkSteps
    const Y_BASE_WORLD = yOffset + chunkSize * matrixSizeH - chunkSize * halfMatrixW_ChunkSteps;


    // Use ImageData array for fast, single-pass rendering
    for (let row = 0; row < matrixSizeH; row++) {
      for (let col = 0; col < matrixSizeW; col++) {
        
        // Optimized Coordinate calculation:
        const xx = X_BASE_WORLD + chunkSize * col;
        const yy = Y_BASE_WORLD - chunkSize * row; // Subtraction due to inverted Y axis logic
        if (row == matrixSizeH / 2 && col == matrixSizeW / 2) {
          console.log("------------------------ minimap center", centreX, centreY, xx, yy)
        }
        const startY = row * step;
        const startX = col * step;
        
        let r = 0, g = 0, b = 0, a = 255;
        let br = 0, bg = 0, bb = 0, ba = 0;
        let drawBorder = false;

        // Player position indicator (Red pixel block)
        if (
          Math.abs(row - halfMatrixH_ChunkSteps) <= 1 &&
          Math.abs(col - halfMatrixW_ChunkSteps) <= 1
        ) {
          r = 255; g = 0; b = 0; a = 255; 
        } else {
          // Optimized tile retrieval using the cache
          const tile: RawTile = this._getTileNoGenCached(xx, yy);
          const tile2: RawTile = this._getTileNoGenCached(xx, yy + chunkSize);
          const tile3: RawTile = this._getTileNoGenCached(xx + chunkSize, yy + chunkSize);

          // Call refactored helper for calculation
          [r, g, b, a, br, bg, bb, ba, drawBorder] = this._calculatePixelData(
              tile, tile2, tile3, this.conf,
          );
        }
          
        // --- Write to ImageData array (fast rendering) ---
        for (let yPixel = 0; yPixel < step; yPixel++) {
          for (let xPixel = 0; xPixel < step; xPixel++) {
            const arrayIndex = ((startY + yPixel) * this.sizeW + (startX + xPixel)) * 4;
            
            // Apply border to the top row
            if (drawBorder && yPixel === 0) {
              data[arrayIndex + 0] = br;
              data[arrayIndex + 1] = bg;
              data[arrayIndex + 2] = bb;
              data[arrayIndex + 3] = ba;
            } else {
              // Apply base color
              data[arrayIndex + 0] = r;
              data[arrayIndex + 1] = g;
              data[arrayIndex + 2] = b;
              data[arrayIndex + 3] = a;
            }
          }
        }
      }
    }

    // Final draw call
    ctx.putImageData(this.imageData, 0, 0);
  }
}