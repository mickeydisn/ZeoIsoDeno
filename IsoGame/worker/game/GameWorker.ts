import {
  CanvasMapDrawers,
  CanvasMapDrawersConf,
} from "../../mapIso/canvasMapDrawer.ts";
import { AssetLoaderOpti } from "../../mapIso/asset/assetLoaderOpti.ts";
import { World } from "../../word.ts";

// Import all command classes and the factory map logic
import { 
  ICommandStatic,
} from "../shared/actions/TypeCommand.ts";
import { AllGameWorkerCommands } from "./commands/CommandsWorker.ts";


// export type GameHandlerData = WorkerInitMessage; // Use the precise type

// A map for command lookup (like the one in InterfaceModule.ts)
type CommandStaticMap = Map<string, ICommandStatic>;
const CommandFactoryMap: CommandStaticMap = new Map();
[
    ...AllGameWorkerCommands,
].forEach(Cmd => {
    CommandFactoryMap.set(Cmd.func, Cmd);
});

export class GameWorkerState {
  x: number = 0;
  y: number = 0;
  xf: number = 0;
  yf: number = 0;
}

export class GameWorker {
  private world = new World();

  private handler: any; // MessageHandler;
  state: GameWorkerState = new GameWorkerState()

  private assetLoader!: AssetLoaderOpti;
  private canvasMap!: OffscreenCanvas;
  private canvasMapDrawer!: CanvasMapDrawers;
  private sharedMapLvl!: Float32Array;

  framId: number = 0;
  private _shouldRun = false;

  constructor() {
    // this.handler = new MessageHandler(self);
    // Setup message handlers using the new appendHandlers method
    // this.handler.appendHandlers(this.getGameWorkerHandlers());
  }

  // Context passed to commands that need access to GameWorker state
  // private getCommandContext(): IGameWorkerContext {
  // }

  // ============================================================================
  // INIT
  // ============================================================================

  private initWorker = async () => {
    console.log("=== InitGameWorker");

    console.log("== Load Asset");
    this.assetLoader = await AssetLoaderOpti.create();

    console.log("== Load Word");
    this.world.init();

    
    this.handler.send({func: "callback_initWorker" });
  };

  // ============================================================================
  // SET SHARED / INIT RENDER
  // ============================================================================

  private setCanvasMap = (data: any) => {
    // Check for correct message type if necessary, here we assume it's setCanvasMap
    const canvas = (data as any).canvas as OffscreenCanvas;
    this.canvasMap = canvas;
  };

  private initCanvasMap = (data: any) => {
    const config = data as any;
    console.log("=== Init Render Worker");
    this.canvasMapDrawer = new CanvasMapDrawers(
      this.world,
      config.width || 1600,
      config.height || 800,
      config.mapConf as CanvasMapDrawersConf || {
        DRAW_TILE_COUNT: 40,
        SCALE_SIZE: 1, 
        SCALE_MOD: 1,
      },
      this.assetLoader,
      this.canvasMap,
    );

    this.handler.send(
      {
        func: "callback_initCanvasMap",
        mapconf: config.mapConf,
        mapLvlBuffer: this.canvasMapDrawer.bufferMapLvl,
        mapInfoBuffer: this.canvasMapDrawer.bufferMapInfo,
      },
    );
  };
  
  // ============================================================================
  // == COMMAND DISPATCHER
  // ============================================================================
  /*
  private async dispatchActionCommand(data: EventTileActionCommand): Promise<void> {
      const CommandClass = CommandFactoryMap.get(data.action);

      if (!CommandClass) {
          console.error(`[GameWorker] Unknown action command: ${data.action}`);
          return;
      }
      
      const config: ILocalActionConfigBase = data as any;
      
      // Special handling for commands that require the MessageHandler (like QueryInfoCell)
      const isQueryInfoCell = CommandClass.func === 'queryInfoCell';
      
      // Use the static factory method to create the command instance
      const command: ITileActionCommand = isQueryInfoCell
        // @ts-ignore - The command constructor is now expected to handle the context/handler arguments
        ? CommandClass.createFromConfig(config, this.getCommandContext(), this.handler)
        // @ts-ignore
        : CommandClass.createFromConfig(config, this.getCommandContext());

      command.execute();
  }
  */
  // ============================================================================
  // == MESSAGE HANDLERS
  // ============================================================================
  /*
  private getGameWorkerHandlers(): [string, (_data: GameHandlerData) => void][] {
      // Collect all handlers, including the new generic command dispatcher
      const handlers: [string, (_data: GameHandlerData) => void][] = [
        // Standard Init/Config Handlers
        ["initWorker", this.initWorker.bind(this)],
        ["initCanvasMap", this.initCanvasMap.bind(this)],
        ["setCanvasMap", this.setCanvasMap.bind(this)],
        // Removed setMapLvl as it's not clear where it's called from and initCanvasMap handles buffers
        
        // Loop Control
        ["startRender", (_data) => this.startLoop()],
        ["stopRender", (_data) => this.stopLoop()],
        
        // Movement/State Update
        ["setCenter", (data) => {
            this.x = (data as any).x;
            this.y = (data as any).y;
            this.xf = (data as any).x;
            this.yf = (data as any).y;
        }],
        ["updatePlayerMovement", (data: GameHandlerData) => {
            const pm = (data as any).playerMovement;
            const diffX = pm.up ? 1 : pm.down ? -1 : 0;
            const diffY = pm.left ? 1 : pm.right ? -1 : 0;
            const speed = .1;
            // if move :
            if (diffX != 0 || diffY != 0) {
              this.xf += diffY != 0 ? diffX * speed * .70 : diffX * speed;
              this.yf += diffX != 0 ? diffY * speed * .70 : diffY * speed;

              this.x = Math.floor(this.xf);
              this.y = Math.floor(this.yf);

              const tile = FactoryMap.getInstance().getTile(this.x - 1, this.y - 1);
              this.handler.send(
                {
                  action: "infoCell",
                  data: tile.toJsonInfo(),
                },
              );
            }
        }],

        // Generic Command Handler (for all TileActions, Buildings, and Tests)
        ["placeGraveA", this.dispatchActionCommand.bind(this) as any],
        ["placeCity", this.dispatchActionCommand.bind(this) as any],
        ["initTestMap", this.dispatchActionCommand.bind(this) as any],
        ["queryInfoCell", (data) => {
            // Re-implementing query_infoCell logic to calculate x/y then dispatch
            const config = data as any;
            const x = config.x !== undefined
                ? config.x
                : config.gridX !== undefined
                ? config.gridX + this.x - 1
                : this.x;
            const y = config.y !== undefined
                ? config.y
                : config.gridY !== undefined
                ? config.gridY + this.y - 1
                : this.y;
            
            // Dispatch the command with the calculated coordinates
            this.dispatchActionCommand({ action: 'queryInfoCell', x, y } as EventTileActionCommand);
        }],
        
        // Add all Leveling commands from CommandsLvl.ts
        ["clearLvl", this.dispatchActionCommand.bind(this) as any],
        ["clearLvlSquare", this.dispatchActionCommand.bind(this) as any],
        ["lvlSet", this.dispatchActionCommand.bind(this) as any],
        ["lvlUp", this.dispatchActionCommand.bind(this) as any],
        ["lvlUpSquare", this.dispatchActionCommand.bind(this) as any],
        ["lvlFlatSquare", this.dispatchActionCommand.bind(this) as any],
        ["lvlAvg", this.dispatchActionCommand.bind(this) as any],
        ["lvlAvgSquare", this.dispatchActionCommand.bind(this) as any],
        ["lvlAvgBorder", this.dispatchActionCommand.bind(this) as any],
      ];
      return handlers;
  }
  */

  // ============================================================================
  // == LOOP
  // ============================================================================

  // FPS, startLoop, stopLoop, and updateFram remain unchanged...
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
    this.handler.send({ func: "FPS", fps: fps });
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

      this.canvasMapDrawer.drawUpdate(
        this.state.x,
        this.state.y,
        this.state.xf - this.state.x,
        this.state.yf - this.state.y,
      );
    }
    requestAnimationFrame(this.updateFram.bind(this));
  }
}

// ============================================================================
// ============================================================================

new GameWorker();

// ============================================================================
// ============================================================================