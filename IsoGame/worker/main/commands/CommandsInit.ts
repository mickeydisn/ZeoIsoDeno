import { BaseCommand, IComMessage, TComMessageParams } from "../../shared/actions/TypeCommand.ts";

// ----------------------------------------------------------------------
// NEW: System Control Command Implementations (ITileActionCommand)
// ----------------------------------------------------------------------


export interface ICallbackInitWorkerConfig extends IComMessage {
    func: 'callback_initWorker';
    canvas:any;
}
export class CallbackInitWorker_Command extends BaseCommand<ICallbackInitWorkerConfig> {
    static readonly func = 'callback_initWorker';
    static readonly group = 'System';
    static readonly label = 'callback_initWorker';
    static readonly params: TComMessageParams = []; // Parameters are handled directly by the config
    static readonly defaults = {};


    execute(): void {
    /*
        // After The Game worker Initialiser . we cant send Shared Array
        const callback_initWorker = (_data: GameHandlerData): void => {
        console.log("✅ Game Worker initialized!");
        const offscreen = canvasImageMap.transferControlToOffscreen();

        handlers.sendDataSync({
            action: "setCanvasMap",
            canvas: offscreen,
        }, [
            offscreen,
        ]);

        handlers.send({
            action: "initCanvasMap",
            mapConf: {
            DRAW_TILE_COUNT: 40,
            SCALE_SIZE: 1,
            SCALE_MOD: 1,
            },
        });

        handlers.send({
            action: "gridClick",
            x: -19,
            y: 70,
        });
        handlers.send({ action: "startRender" });
        };
        /*
        this.worker.x = this.x;
        this.worker.y = this.y;
        this.worker.xf = this.x;
        this.worker.yf = this.y;
        */
    }
}


  
  
  // ----------------------------------------------------------------------
  // NEW: System Control Command Implementations (ITileActionCommand)
  // ----------------------------------------------------------------------
  
export interface ICallbackInitCanvasMapConfig extends IComMessage {
    func: 'callback_initCanvasMap';
    canvas:any;
}
export class CallbackInitCanvasMap_Command extends BaseCommand<ICallbackInitCanvasMapConfig> {
    static readonly func = 'callback_initCanvasMap';
    static readonly group = 'System';
    static readonly label = 'callback_initCanvasMap';
    static readonly params: TComMessageParams = []; // Parameters are handled directly by the config
    static readonly defaults = {};
  
    execute(): void {
    /*
      const callback_initCanvasMap = (data: GameHandlerData): void => {
        const mapconf = data.mapConf as CanvasMapDrawersConf;
        const bufferMapLvl = data.mapLvlBuffer;
        const bufferMapInfo = data.mapInfoBuffer;
        console.log("===== Call BackRender");
      
        gridMapDrawer = new GridMapDrawers(gameWorker, bufferMapLvl, bufferMapInfo);
        gridMapDrawer.mod = mapconf.DRAW_TILE_COUNT / 40;
      };
    */
    }
}
