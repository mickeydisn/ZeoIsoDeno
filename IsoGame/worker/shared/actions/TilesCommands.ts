import { IComMessage } from "./TypeCommand.ts";
import { CommandFactoryWorker } from "../CommandFactory.ts";
import { Tile } from "../../../map/object/tile.ts";

export class TilesActions {
    factory: CommandFactoryWorker;

    // Trackers for system state
    listTilesUpdated: Set<Tile>; // Actual Tile type
    listTilesWithTempItems: Tile[]; // Actual Tile type

    // Utilities bundle for Commands to access helpers without deep imports
    // This resolves circular dependencies or complex imports for the Command classes
    __utils? = undefined;

    constructor() {
        this.listTilesUpdated = new Set();
        this.listTilesWithTempItems = [];
        this.factory = CommandFactoryWorker.getInstance();
        
    }

    /**
     * Converts a generic config to a command and executes it.
     */
    doAction(conf: IComMessage) {
        const command = this.factory.createCommand(conf);
        if (command) {
            command.execute(); 
        }
    }

    doActions(confs: IComMessage[]) {
        for (const conf of confs) {
            this.doAction(conf);
        }
    }

    /**
     * Global cleanup action remains in the dispatcher.
     */
    clearAllTemporatyItems() {
        this.listTilesWithTempItems.forEach((tile) => {
            tile.clearTemporatyItem();
        });
        this.listTilesWithTempItems = [];
    }
}