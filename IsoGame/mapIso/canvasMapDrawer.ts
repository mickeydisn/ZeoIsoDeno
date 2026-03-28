// Define a compatible canvas type for both Deno and browser
type Canvas = OffscreenCanvas;
type ImageType = HTMLImageElement;
type CanvasRenderingContext2D = OffscreenCanvasRenderingContext2D;

function createCanvas(width: number, height: number): Canvas {
  return new OffscreenCanvas(width, height) as Canvas;
}

import { Color } from "./iso/color.ts";
import { Isomer } from "./iso/isomer.ts";
import { FactoryMap } from "../map/factory/factoryMap.ts";
import { TilesMatrix } from "../map/object/tilesMatrix.ts";
import { World } from "../word.ts";
import { Shape } from "./iso/shape.ts";
import { Point } from "./iso/point.ts";
import { AssetLoaderOpti } from "./asset/assetLoaderOpti.ts";
import { CHUNK_SIZE } from "../map/object/chunk.ts";
import { cp } from "node:fs";
import { IsometricProjector, PointIso } from "./simpleIso/IsometricProjector.ts";
import { IsometricTileGenerator } from "./simpleIso/IsometricTileGenerator.ts";
import { ColorIso } from "./simpleIso/Color.ts";
import { Tile } from "../map/object/tile.ts";

// --- Constants for Readability and Maintenance ---
// The factor used to scale the tile level (z-axis) difference for isometric rendering.
const LVL_Z_SCALE_FACTOR = 1 / 3;

// Constants derived from an assumed 128x128 asset size for centering on a tile.
// The offsets adjust the image position so its visual base is anchored to the tile's center point (0, 0, Z) in screen space.
const ASSET_WIDTH = 128;
const ASSET_HEIGHT = 172; // Assuming asset height includes transparent padding/shadows
const ASSET_OFFSET_X = (-127 + 64) // (-ASSET_WIDTH / 2) + (ASSET_WIDTH / 4); // (-64) + (32) = -32 (The original code used -127+64 which is -63, let's use the actual center)
const ASSET_OFFSET_Y = (-172 + 64 - 1) // (-ASSET_HEIGHT) + (ASSET_WIDTH / 2) - 1; // (-172) + 64 - 1 = -109 (Aligning the visual base, using ASSET_HEIGHT as the full image height)

// --- Configuration Interfaces (Renamed for Clarity) ---
interface CanvasMapDrawersConfOption {
  DRAW_TILE_COUNT?: number;
  SCALE_SIZE?: number;
  SCALE_MOD?: number;
}
export interface CanvasMapDrawersConf {
  DRAW_TILE_COUNT: number; // Replaced DRAW_TILE_COUNT
  SCALE_SIZE: number;
  SCALE_MOD: number;
}

const CanvasMapDrawersConfDefault: CanvasMapDrawersConf = {
  DRAW_TILE_COUNT: 40,
  SCALE_SIZE: 1,
  SCALE_MOD: 1,
};

// --- Main Drawer Class ---
export class CanvasMapDrawers {
  world: World;
  fm: FactoryMap;
  conf: CanvasMapDrawersConf;
  c: Record<string, Color>;
  tilesMatrix: TilesMatrix;
  assetLoader: AssetLoaderOpti;
  canvas: Canvas;
  canvasCtx: CanvasRenderingContext2D;

  // Shared buffers for worker communication
  bufferMapLvl: SharedArrayBuffer;
  mapLvl: Float32Array;

  bufferMapInfo: SharedArrayBuffer;
  mapInfo: Float32Array; // [ 0:centreX , 1:centreY, 2:offX, 3:offY ]

  isomer: Isomer;
  private isoProject: IsometricProjector;
  private isoGenerator: IsometricTileGenerator;
  private tileCache: Map<string, OffscreenCanvas | ImageBitmap> = new Map();

  frameSubCount: number;
  frameCount: number;

  constructor(
    world: World,
    width: number,
    height: number,
    conf: CanvasMapDrawersConfOption,
    assetLoadder: AssetLoaderOpti,
    canvas?: Canvas,
  ) {
    this.world = world;
    this.fm = FactoryMap.getInstance();

    // Use DRAW_TILE_COUNT instead of DRAW_TILE_COUNT
    this.conf = { ...CanvasMapDrawersConfDefault, ...conf, DRAW_TILE_COUNT: conf.DRAW_TILE_COUNT || CanvasMapDrawersConfDefault.DRAW_TILE_COUNT };

    this.canvas = canvas ? canvas : createCanvas(width, height);
    this.canvasCtx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    const bufferSize = this.conf.DRAW_TILE_COUNT * this.conf.DRAW_TILE_COUNT * Float32Array.BYTES_PER_ELEMENT;
    
    // Init the Worker-Shared Matrix to store Cell Lvl in a Grid
    this.bufferMapLvl = new SharedArrayBuffer(bufferSize);
    this.mapLvl = new Float32Array(this.bufferMapLvl);

    // Init the Worker-Shared Matrix : [ 0:X , 1:Y, 2:offX, 3:offY ]
    this.bufferMapInfo = new SharedArrayBuffer(
      4 * Float32Array.BYTES_PER_ELEMENT,
    );
    this.mapInfo = new Float32Array(this.bufferMapInfo);

    this.isomer = new Isomer(
      this.canvas,
      this.conf.DRAW_TILE_COUNT,
      this.conf.SCALE_SIZE,
      this.conf.SCALE_MOD,
    );
    this.isoProject = new IsometricProjector({
      originX : this.canvas.width / 2,
      originY : this.canvas.height / 2 + this.conf.DRAW_TILE_COUNT * 16 * this.conf.SCALE_SIZE,
      SCALE_SIZE:this.conf.SCALE_SIZE,
      SCALE_MOD:this.conf.SCALE_MOD,
    })
    this.isoGenerator = new IsometricTileGenerator({
      SCALE_SIZE:this.conf.SCALE_SIZE,
    })

    this.c = {
      selected: new Color(160, 60, 50, 1),
      red: new Color(160, 60, 50, 1),
      blue: new Color(80, 100, 240, .5),
      flore: new Color(53, 148, 56),
    };

    this.tilesMatrix = new TilesMatrix(
      this.conf.DRAW_TILE_COUNT,
      0,
      0,
      this.conf.SCALE_MOD,
    );
    this.assetLoader = assetLoadder;
    this.frameSubCount = 0;
    this.frameCount = 0;

    console.log("=== GameContext- Init");
    console.log("=== GameContext- Init", this.tilesMatrix.rangeX);
  }

  // --------------------------------------

  drawUpdate(
    centreX: number,
    centreY: number,
    offx: number = 0,
    offy: number = 0,
  ) {
    this.tilesMatrix.setCenter(centreX, centreY);
    // Use the maximum of 1 or the scaled modifier for isomer
    this.isomer.SCALE_MOD = Math.max(1, 1 / 8); 
    this.isomer.setOffset(offx, offy);
    
    this.isoProject.updateConf({
      SCALE_MOD : Math.max(1, 1 / 8),
      offsetX : offx,
      offsetY : offy, 
  
    })
  
    // Update Shared Info Buffer
    this.mapInfo[0] = centreX;
    this.mapInfo[1] = centreY;
    this.mapInfo[2] = offx;
    this.mapInfo[3] = offy;

    this.drawIso();
  }

  private getTileImage( 
    tile:Tile,
      diffLvlSE: number , 
     diffLvlSW: number
  ) {
    const key = `${tile.x}:${tile.y}`;
    
    if (this.tileCache.has(key)) {
        // Type assertion is safe here as we control what goes into the Map
        return this.tileCache.get(key) as OffscreenCanvas | ImageBitmap; 
    }
    console.log('tileGen');
    const colorIso = new ColorIso(tile.color[0], tile.color[1], tile.color[2]);
    const canvas : OffscreenCanvas | ImageBitmap  = this.isoGenerator.createTile(colorIso, diffLvlSE, diffLvlSW);

    createImageBitmap(canvas).then( (optimizedDrawSource: ImageBitmap) => {
        this.tileCache.set(key, optimizedDrawSource);
    });
    this.tileCache.set(key, canvas);
    return canvas;
  }
  
  // --- Drawing Helpers (Refactored from drawTileItem) ---
  /** Draws an isometric asset (image/svg) on the tile. */
  private drawTileBase(
    tile:Tile,
     x: number, y:number,
     currentlvl:number,
      diffLvlSE: number , 
      diffLvlSW: number
  ) {

    const tileImage = this.getTileImage(tile, diffLvlSE, diffLvlSW)

    try {
        const off = { x: 0, y: 0 };
        const lvl = currentlvl + (0) * this.conf.SCALE_SIZE;
        
        const p = this.isoProject.translatePoint(new PointIso(x + off.x, y + off.y, lvl))
        /*
        const p = this.isomer.translatePoint(
          new Point(x + off.x, y + off.y, lvl),
        );
        */
        const scale = this.conf.SCALE_SIZE;
        
        // Use named constants for offsets
        this.canvasCtx.drawImage(
          tileImage,
          p.x - 32 * scale,
          p.y - 32 * scale,
          tileImage.width * scale,
          tileImage.height * scale,
        );
    } catch (e) {
      console.error(`Error drawing baseItem`, e);
    }
  }


  /** Draws an isometric asset (image/svg) on the tile. */
  private drawAsset(
    x: number,
    y: number,
    itemConf: any,
    currentlvl: number,
  ) {
    if (!this.assetLoader) {
      console.warn("AssetLoader not initialized.");
      return;
    }

    try {
      const key = itemConf.key;
      // Cyclically select asset key if an array is provided
      let keySelect = Array.isArray(key)
        ? key[this.frameCount % key.length]
        : key;
        
      let cimage = this.assetLoader.getAsset(keySelect);
      
      // If exact key not found, try appending directional suffix
      if (!cimage) {
        const directions = ["_NE", "_NW", "_SW", "_SE"];
        for (const dir of directions) {
          cimage = this.assetLoader.getAsset(keySelect + dir);
          if (cimage) {
            keySelect = keySelect + dir;
            break;
          }
        }
      }
      
      if (cimage) {
        const off = itemConf.off ? itemConf.off : { x: 0, y: 0 };
        const lvl = currentlvl + (itemConf.lvl || 0) * this.conf.SCALE_SIZE;
        
        const p2 = this.isoProject.translatePoint(new PointIso(x + off.x, y + off.y, lvl))
        
        const p = this.isomer.translatePoint(
          new Point(x + off.x, y + off.y, lvl),
        );
        const scale = this.conf.SCALE_SIZE;
        
        // Use named constants for offsets
        this.canvasCtx.drawImage(
          cimage,
          p2.x + ASSET_OFFSET_X * scale,
          p2.y + ASSET_OFFSET_Y * scale,
          ASSET_WIDTH * scale,
          ASSET_WIDTH * scale,
        );
      }
    } catch (e) {
      console.error(`Error drawing asset: ${itemConf.key}`, e);
    }
  }

  
  /** Draws a selected marker prism on the tile. * /
  private drawSelected(x: number, y: number, itemConf: any, currentlvl: number) {
    const height = itemConf.height || .1;
    const lvl = currentlvl + (itemConf.lvl || 0) * this.conf.SCALE_SIZE;

    this.isomer.add(
      Shape.Prism(new Point(x, y, lvl), 1, 1, height),
      this.c.selected,
    );
  }
  */
  /**
   * Draws a single item onto a tile using the correct drawing function.
   */
  drawTileItem(
    x: number,
    y: number,
    metaTile: any,
    itemConf: any,
    currentlvl: number,
  ) {
    const type = itemConf.t;

    switch (type) {
      case "Asset":
      case "Svg":
        this.drawAsset(x, y, itemConf, currentlvl);
        break;
      case "Box":
        // Placeholder for box drawing logic
        // this.drawTilesBox(isomer._translatePoint(Point(x, y, lvl)), metaTile, itemConf);
        break;
      // case "Selected":
      //   this.drawSelected(x, y, itemConf, currentlvl);
      //   break;
      // Add other cases here (e.g., 'Pyramid', 'Prism')
      default:
        // console.log(`Sorry, we are out of ${type}.`);
        break;
    }
  }

  drawTileOld (xx: number, yy:number, currentlvl:number, color: Color, diffLvlSE: number , diffLvlSW: number) {
    const height =1;
    // 1. Display the Floor (Horizontal Floor tile)
    this.isomer.add(
      Shape.SurfaceFlat(new Point(xx, yy, currentlvl - height), 1, 1, height),
      color,
    );
    
    // 2. Display Floor Borders (Vertical Faces based on neighbor level difference)
    // South-East Border (comparing with tile at yy-1)
    if (diffLvlSE > 0 && this.conf.SCALE_SIZE > .5) {
      this.isomer.add(
        Shape.SurfaceSE(
          new Point(xx, yy, currentlvl - diffLvlSE),
          1,
          1,
          diffLvlSE,
        ),
        color,
      );
    }
    if (diffLvlSW > 0 && this.conf.SCALE_SIZE > .4 ) {
      this.isomer.add(
        Shape.SurfaceSW(
          new Point(xx, yy, currentlvl - diffLvlSW),
          1,
          1,
          diffLvlSW,
        ),
        color,
      );
    }
  }
  /**
   * Draws the base tile geometry, including floor and borders.
   */
  drawTile(x: number, y: number) {
    const size = this.conf.DRAW_TILE_COUNT;
    const xx = size - x - 1;
    const yy = size - y - 1;
    
    // Get the Matrix to display
    const metaTile = this.tilesMatrix.tiles[xx][yy];
    
    // Factor applied to raw level difference to get display level
    const LVL_DISPLAY_SCALE = LVL_Z_SCALE_FACTOR * this.conf.SCALE_SIZE / this.conf.SCALE_MOD;
    
    // Calculate the tile's current display level (Z coordinate)
    const currentlvl = (metaTile.lvl - this.tilesMatrix.avgLvl) * LVL_DISPLAY_SCALE;

    // Update Shared GridLvl Matrix Buffer
    this.mapLvl[xx * size + yy] = currentlvl;

    // Get Tile Floor color and properties
    const height = 1;
    const color = new Color(
      metaTile.color[0],
      metaTile.color[1],
      metaTile.color[2],
      1, // Alpha
    );



    // South-East Border (comparing with tile at yy-1)
    const lvlYNeighbor = this.tilesMatrix.tiles[xx][yy - 1].lvl;
    const diffLvlSE = (metaTile.lvl - lvlYNeighbor) * LVL_DISPLAY_SCALE;
    // South-West Border (comparing with tile at xx-1)
    const lvlXNeighbor = this.tilesMatrix.tiles[xx - 1][yy].lvl;
    const diffLvlSW = (metaTile.lvl - lvlXNeighbor) * LVL_DISPLAY_SCALE;

    this.drawTileOld(xx, yy, currentlvl, color,  diffLvlSE, diffLvlSW);
    
    // this.drawTileBase(metaTile, xx, yy, currentlvl, diffLvlSE, diffLvlSW);
    
    
    // 3. Collect Items/Entities for Display

    // Flatten entities items into the main list
    const entitiesItems = metaTile.entities.flatMap((x: any) => x.items);

    const items = [
      ...metaTile.items,
      ...metaTile.temporatyItems,
      ...entitiesItems,
    ];

    // Handle CityNode item
    if (metaTile.cityNode) {
      items.push({ t: "Svg", key: metaTile.cityNode.asset.key });
    }
    

    if (this.conf.DRAW_TILE_COUNT < 60 ) {
      // 4. Draw Each Item (Z-sorted locally)
      items
        .sort((a: any, b: any) => (a.lvl || 0) - (b.lvl || 0))
        .forEach((item: any) => this.drawTileItem(xx, yy, metaTile, item, currentlvl));
    }


  }

  drawIso() {
    const size = this.conf.DRAW_TILE_COUNT;
    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw tiles: loop from 1 to size-1 to avoid boundary checks 
    // when accessing neighbors (yy-1, xx-1) inside drawTile.
    for (let x = 1; x < size - 1; x++) {
      for (let y = 1; y < size - 1; y++) {
        this.drawTile(x, y);
      }
    }
    // iso.addImage();
    this._cleanCache();

  }


  /**
   * Memory Optimization: Cleans the cache by removing tiles far outside the current view.
   * Uses a margin of 2x the current visible extent.
   */
  private _cleanCache() {
    // Calculate the map's current visible radius in world units
    
    // Define an aggressive margin (2x view extent)
    const KEEP_MARGIN_X = this.conf.DRAW_TILE_COUNT;
    const KEEP_MARGIN_Y = this.conf.DRAW_TILE_COUNT;

    const xMin = this.tilesMatrix.x - KEEP_MARGIN_X;
    const xMax = this.tilesMatrix.x + KEEP_MARGIN_X;
    const yMin = this.tilesMatrix.y - KEEP_MARGIN_Y;
    const yMax = this.tilesMatrix.y + KEEP_MARGIN_Y;
    
    // Iterate and delete out-of-bounds tiles (key format is "x:y")
    for (const key of this.tileCache.keys()) {
        const parts = key.split(':');
        const x = parseInt(parts[0], 10);
        const y = parseInt(parts[1], 10);
        
        if (x < xMin || x > xMax || y < yMin || y > yMax) {
            this.tileCache.delete(key);
            console.log('tileDelete');

        }
    }
  }

}





