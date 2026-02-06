
// import { MessageHandler } from "./worker/messageHandler.ts"; // Need handler type
import { // Note: Assuming the other commands (PlaceGraveA, QueryInfoCell) are defined here
    TComMessageParams,
    IComMessage,
    BaseCommand,
} from "../../shared/actions/TypeCommand.ts"; 
// Assuming all commands from CommandsLvl.ts are imported here for the final export


// ----------------------------------------------------------------------
// NEW: System Control Command Configs (Used by Main thread to send messages)
// ----------------------------------------------------------------------

export interface ISetCenterConfig extends IComMessage {
    func: 'setCenter';
    x: number;
    y: number;
}

export interface IUpdatePlayerMovementConfig extends IComMessage {
    func: 'updatePlayerMovement';
    playerMovement: any; // Corresponds to the input data for up/down/left/right state
}

export interface IRenderControlConfig extends IComMessage {
    func: 'startRender' | 'stopRender';
}



// ----------------------------------------------------------------------
// NEW: System Control Command Implementations (ITileActionCommand)
// ----------------------------------------------------------------------

export class SetCenterCommand extends BaseCommand<ISetCenterConfig> {
    static readonly func = 'setCenter';
    static readonly group = 'System';
    static readonly label = 'Set View Center';
    static readonly params: TComMessageParams = []; // Parameters are handled directly by the config
    static readonly defaults = {};

    execute(): void {
        /*
        this.worker.x = this.x;
        this.worker.y = this.y;
        this.worker.xf = this.x;
        this.worker.yf = this.y;
        */
    }
}


export class UpdatePlayerMovementCommand extends BaseCommand<IUpdatePlayerMovementConfig> {
    static readonly func = 'updatePlayerMovement';
    static readonly group = 'System';
    static readonly label = 'Update Player Movement';
    static readonly params: TComMessageParams = [];
    static readonly defaults = {};


    execute(): void {
        const diffX = this.pm.up ? 1 : this.pm.down ? -1 : 0;
        const diffY = this.pm.left ? 1 : this.pm.right ? -1 : 0;
        const speed = .1;
        
        if (diffX != 0 || diffY != 0) {
            /*
            this.worker.xf += diffY != 0 ? diffX * speed * .70 : diffX * speed;
            this.worker.yf += diffX != 0 ? diffY * speed * .70 : diffY * speed;

            this.worker.x = Math.floor(this.worker.xf);
            this.worker.y = Math.floor(this.worker.yf);

            // Send infoCell message back to main thread (System callback)
            const tile = FactoryMap.getInstance().getTile(this.worker.x - 1, this.worker.y - 1);
            this.handler.send({
                action: "infoCell", // System message
                data: tile.toJsonInfo(),
            });
            */
        }
    }
}


export class StartRenderCommand extends BaseCommand<IRenderControlConfig> {
    static readonly func = 'startRender';
    static readonly group = 'System';
    static readonly label = 'Start Render Loop';
    static readonly params: TComMessageParams = [];
    static readonly defaults = {};

    execute(): void {
        // this.worker.startLoop();
    }
}


export class StopRenderCommand extends BaseCommand<IRenderControlConfig> {
    static readonly func = 'stopRender';
    static readonly group = 'System';
    static readonly label = 'Stop Render Loop';
    static readonly params: TComMessageParams = [];
    static readonly defaults = {};

    execute(): void {
        // this.worker.stopLoop();
    }
}


// ... (Existing commands like PlaceGraveACommand, QueryInfoCellCommand, etc. would follow here) ...

// ----------------------------------------------------------------------
// Export All Commands
// ----------------------------------------------------------------------

export const AllGameWorkerCommands = [
    // ... Existing Commands (e.g., PlaceGraveACommand, InitTestMapCommand)
    // ... Commands from CommandsLvl.ts
    // NEW System Commands:
    SetCenterCommand,
    UpdatePlayerMovementCommand,
    StartRenderCommand,
    StopRenderCommand,
];