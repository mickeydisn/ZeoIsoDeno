import { City } from "../../../../IsoGame/city/city.ts";
import { FactoryMap } from "../../../../IsoGame/map/factory/factoryMap.ts";
import { TilesActions } from "../../../../IsoGame/map/tileActions.ts";
import { AssetLoaderOpti } from "../../../../IsoGame/mapIso/asset/assetLoaderOpti.ts";
import {
  CanvasMapDrawers,
  CanvasMapDrawersConf,
} from "../../../../IsoGame/mapIso/canvasMapDrawer.ts";
import { toolRegistry } from "../../../../IsoGame/tools/toolRegistry.ts";
import { terrainTools } from "../../../../IsoGame/tools/terrainTools.ts";
import { colorTools } from "../../../../IsoGame/tools/colorTools.ts";
import { assetTools } from "../../../../IsoGame/tools/assetTools.ts";
import { structureTools } from "../../../../IsoGame/tools/structureTools.ts";
import { getBuildingConfigList } from "../../../../IsoGame/tools/buildingConfigRegistry.ts";
import { World } from "../../../../IsoGame/word.ts";
import { MessageHandler } from "./worker/messageHandler.ts";
import { updatePlayerMovement } from "./worker/player.ts";

export type GameHandlerData = any;

export class GameWorker {
  private world = new World();

  public handler: MessageHandler;
  x: number = 0;
  y: number = 0;
  xf: number = 0;
  yf: number = 0;
  direction: string = "NE";

  private assetLoader!: AssetLoaderOpti;
  private canvasMap!: OffscreenCanvas;
  public canvasMapDrawer!: CanvasMapDrawers;
  private sharedMapLvl!: Float32Array;
  /*
  private sharedMapInfo!: Float32Array;
  */
  framId: number = 0;
  private _shouldRun = false;

  constructor() {
    this.handler = new MessageHandler(self);
    // self.onmessage = (e) => this.handlers.get(e.data.action)?.(e.data);
    self.onmessage = (e) => this.handler.handleIncoming(e.data);

    this.handler.append(Array.from(this.handlers.entries()));

  }

  // ============================================================================
  // INIT
  // ============================================================================

  private initWorker = async (_data: GameHandlerData) => {
    console.log("=== InitGameWorker");

    console.log("== Load Asset");
    this.assetLoader = await AssetLoaderOpti.create();

    console.log("== Load Word");
    this.world.init();

    console.log("== Register Tools");
    terrainTools.forEach((tool) => toolRegistry.register(tool));
    colorTools.forEach((tool) => toolRegistry.register(tool));
    assetTools.forEach((tool) => toolRegistry.register(tool));
    structureTools.forEach((tool) => toolRegistry.register(tool));

    /*
    // Send tool list to main thread for UI rendering
    this.handler.send({
      action: "toolList",
      tools: toolRegistry.getToolInfoList(),
    });

    // Send building config list to main thread for building UI
    this.handler.send({
      action: "buildingConfigList",
      configs: getBuildingConfigList(),
    });
    */
    // Send asset groups to main thread for asset browser
    const assetGroups = this.assetLoader.assetList.map((g) => ({
      group: g.group,
      images: g.images.map((i) => i.label),
    }));
    this.handler.send({
      action: "assetGroups",
      groups: assetGroups,
    });

    this.handler.send({ action: "callback_initWorker" });
  };

  // ============================================================================
  // SET SHARED
  // ============================================================================

  private setCanvasMap = (data: GameHandlerData) => {
    const canvas = data.canvas as OffscreenCanvas;
    this.canvasMap = canvas;
  };

  private setMapLvl = (data: GameHandlerData) => {
    const buffer = data.buffer as SharedArrayBuffer;
    this.sharedMapLvl = new Float32Array(buffer);
  };

  private initCanvasMap = (data: GameHandlerData) => {
    console.log("=== Init Render Worker");
    this.canvasMapDrawer = new CanvasMapDrawers(
      this.world,
      data.width | 1600,
      data.height | 800,
      data.mapConf as CanvasMapDrawersConf || {
        DRAW_TILE_COUNT: 40,
        SCALE_SIZE: 1.2, // 2 / 3,
        SCALE_MOD: 1,
      },
      this.assetLoader,
      this.canvasMap,
    );
    /*
    this.handler.send(
      {
        action: "callback_initCanvasMap",
        mapConf: data.mapConf,
        mapLvlBuffer: this.canvasMapDrawer.bufferMapLvl,
        mapInfoBuffer: this.canvasMapDrawer.bufferMapInfo,
      },
    );
    */
  };

  // ============================================================================
  // == MESSAGE
  // ============================================================================

  private handlers = new Map<string, (_data: GameHandlerData) => void>([
    ["initWorker", this.initWorker.bind(this)],
    ["initCanvasMap", this.initCanvasMap.bind(this)],

    ["setCanvasMap", this.setCanvasMap.bind(this)],
    ["setMapLvl", this.setMapLvl.bind(this)],

    ["startRender", (_data) => this.startLoop()],
    ["stopRender", (_data) => this.stopLoop()],
    // ----
    [
      "setCenter",
      (data) => {
        this.x = data.x;
        this.y = data.y;
        this.xf = data.x;
        this.yf = data.y;
      },
    ],

    [ "updatePlayerMovement", updatePlayerMovement(this) ],
    /*
    ["gridClick", (data: GameHandlerData) => {
      const x = (data as Record<string, unknown>).x as number;
      const y = (data as Record<string, unknown>).y as number;
      console.log("####################### gridClick CITY ");
      console.log(data);

      const _city = new City(this.world, x, y);
    }],
    [
      "init_test",
      (data) => {
        TilesActions.getInstance().doActions([{
          func: "lvlFlatSquare",
          x: data.x,
          y: data.y,
          size: 80,
        }, {
          func: "clearItemSquare",
          x: data.x,
          y: data.y,
          size: 80,
        }]);
      },
    ],
    */

    [
      "query_infoCell",
      (data) => {
        const x = data.x !== undefined
          ? data.x
          : data.gridX !== undefined
          ? data.gridX + this.x - 1
          : this.x;
        const y = data.y !== undefined
          ? data.y
          : data.gridY !== undefined
          ? data.gridY + this.y - 1
          : this.y;

        const tile = FactoryMap.getInstance().getTile(x, y);
        this.handler.send(
          {
            action: "infoCell",
            data: tile.toJsonInfo(),
          },
        );
      },
    ],

    // Tool System Handlers
    [
      "setBuildingConfig",
      (data: GameHandlerData) => {
        console.log("setBuildingConfig received:", data.configId);
        toolRegistry.setBuildingConfig(data.configId);
      },
    ],
    [
      "setBuildingParams",
      (data: GameHandlerData) => {
        console.log("setBuildingParams received:", data.growLoop, data.endLoop);
        toolRegistry.setBuildingParams(data.growLoop, data.endLoop);
      },
    ],
    [
      "setActiveTool",
      (data: GameHandlerData) => {
        toolRegistry.setActive(data.toolId);
      },
    ],
    [
      "setBrushSize",
      (data: GameHandlerData) => {
        toolRegistry.setBrushSize(data.size);
      },
    ],
    [
      "setColor",
      (data: GameHandlerData) => {
        toolRegistry.setActiveColor(data.r, data.g, data.b);
      },
    ],
    [
      "setActiveAsset",
      async (data: GameHandlerData) => {
        console.log("setActiveAsset received:", data.assetId);
        toolRegistry.setActiveAssetId(data.assetId);
        console.log("Active asset set to:", toolRegistry.getActiveAssetId());
        console.log("this.assetLoader:", this.assetLoader);
        // Generate asset preview using AssetLoaderOpti
        if (this.assetLoader && data.assetId) {
          try {
            const canvas = this.assetLoader.getAsset(data.assetId);
            if (canvas) {
              // Convert canvas to blob URL
              const blob = await canvas.convertToBlob();
              const blobUrl = URL.createObjectURL(blob);
              
              // Send preview to main thread
              this.handler.send({
                action: "assetPreview",
                blobUrl: blobUrl,
              });
              console.log("Asset preview sent for:", data.assetId);
            } else {
              console.warn("Asset not found:", data.assetId);
            }
          } catch (error) {
            console.error("Error generating asset preview:", error);
          }
        }
      },
    ],
    [
      "getAsset",
      async (data: GameHandlerData) => {
        toolRegistry.setActiveAssetId(data.assetId);
        console.log("====this.assetLoader:", this.assetLoader);
        console.log("====setActiveAsset received:", data.assetId);
        // Generate asset preview using AssetLoaderOpti
        if (this.assetLoader && data.assetId) {
          console.log("A")
          try {
            const canvas = this.assetLoader.getAsset(data.assetId);
            console.log(canvas)
            if (canvas) {
              // Convert canvas to blob URL
              const blob = await canvas.convertToBlob();
              const blobUrl = URL.createObjectURL(blob);
              // Send preview to main thread
              console.log("== Resutn Blog")
              return {blobUrl:blobUrl}             
            } else {
              console.log("== Asset not found:", data.assetId);
            }
          } catch (error) {
            console.log("== Error generating asset preview:", error);
          }
        }
      },
    ],
    [
      "toolClick",
      (data: GameHandlerData) => {
        const x = data.gridX !== undefined
          ? data.gridX + this.x - 1
          : data.x !== undefined
          ? data.x
          : this.x;
        const y = data.gridY !== undefined
          ? data.gridY + this.y - 1
          : data.y !== undefined
          ? data.y
          : this.y;

        const result = toolRegistry.executeAt(x, y, this.world);

        this.handler.send({
          action: "toolExecuted",
          toolId: toolRegistry.getActiveId(),
          success: true,
        });

      },
    ],

    [
      "mouseMove",
      (data: GameHandlerData) => {
        if (!this.canvasMapDrawer) {
          return;
        }
        this.canvasMapDrawer.setMouseScreen(data.x as number, data.y as number);
      }
    ],
    [
      "mouseClick",
      (data: GameHandlerData) => {
        if (!this.canvasMapDrawer) {
          return;
        }
        this.canvasMapDrawer.setMouseScreen(data.x as number, data.y as number);
        const x = this.canvasMapDrawer.mouseWorldX + this.x - this.canvasMapDrawer.tilesMatrix.size / 2;
        const y = this.canvasMapDrawer.mouseWorldY + this.y - this.canvasMapDrawer.tilesMatrix.size / 2;
        console.log("Mouse Click Worker x:", x, "y:", y);
        const result = toolRegistry.executeAt(x, y, this.world);

        this.handler.send({
          action: "toolExecuted",
          toolId: toolRegistry.getActiveId(),
          success: true,
        });


      }
    ],
  ]);

  addHandels(key: string, func: (_data: GameHandlerData) => void) {
    this.handlers.set(key, func);
  }

  // ============================================================================
  // == LOOP
  // ============================================================================

  // ----------------------------------------------------------------------------
  // FPS
  lastFrameTime = performance.now();
  frameTimes: number[] = [];

  updateFPS() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > 60) this.frameTimes.shift(); // Keep last 60 frames

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) /
      this.frameTimes.length;
    const fps = Math.round(1000 / avgFrameTime);
    this.handler.send({ action: "FPS", fps: fps });
  }

  startLoop() {
    console.log("GameWorker: # START #");
    this._shouldRun = true;
    this.updateFram();
  }

  stopLoop() {
    console.log("GameWorker: # STOP #");
    this._shouldRun = false;
  }

  // 🌟 Read Matrix & Update Grid Efficiently
  updateFram() {
    if (!this._shouldRun) {
      return;
    }
    this.framId = (this.framId + 1) % 1024;
    if (this.framId % 4 == 0) {
      this.updateFPS();
      console.log("Draw");

      this.world.tick();
      this.canvasMapDrawer.direction = this.direction;
      this.canvasMapDrawer.drawUpdate(
        this.x,
        this.y,
        this.xf - this.x,
        this.yf - this.y,
      );
    }
    requestAnimationFrame(this.updateFram.bind(this));
    // setTimeout(this.updateFram.bind(this), 1);
  }
}

// ============================================================================
// ============================================================================

new GameWorker();

// ============================================================================
// ============================================================================
