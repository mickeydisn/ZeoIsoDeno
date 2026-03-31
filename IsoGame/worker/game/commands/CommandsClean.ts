// --- Imports ---
import { iterateSquare } from "../../../map/action/TileUtil.ts";
import { FactoryMap } from "../../../map/factory/factoryMap.ts";
import { Tile } from "../../../map/object/tile.ts";
import { 
    IComMessage,
   ../../../../IsoGame/map/tileActions.tsommandStatic,
    TComMessageParams,
    BaseCommand
} from "../../shared/actions/TypeCommand.ts";


// ----------------------------------------------------------------------
// Action Config Definitions (for CommandImp Context)
// ----------------------------------------------------------------------
export interface IClearItemConfig extends ILocatedComMessage {
    func: 'clearItem' | 'clearItemSquare';
    size?: number;
}

export class ClearItemCommand extends BaseCommand<IClearItemConfig> {
    static readonly func = 'clearItem';
    static readonly group = 'Items';
    static readonly label = 'Clear Item (Single)';
    static readonly params: TComMessageParams = [];
    static readonly defaults = {};


    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        tile.clearItem();
        // dispatcher.listTilesUpdated.add(tile);
    }
}


export class ClearItemSquareCommand extends BaseCommand<IClearItemConfig> {
    static readonly func = 'clearItemSquare';
    static readonly group = 'Items';
    static readonly label = 'Clear Item (Square)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 1, step: 2 }
    ];
    static readonly defaults = { size: 3 };

    execute(): void {
        iterateSquare(this.conf.x, this.conf.y, this.conf.size || 1, (tile: Tile) => {
            tile.clearItem();
            // dispatcher.listTilesUpdated.add(tile);
        });
    }
}



// ----------------------------------------------------------------------
// 5. Global/Cleanup CommandImps
// ----------------------------------------------------------------------
// --- 5. Global/No-Parameter Actions ---
export interface INoParamsConfig extends ILocatedComMessage {
    // Note: Removed 'clearAllTemporatyItems' as it doesn't take coordinates (x, y)
    func: 'clearAll' | 'clearAllSquare';
    size?: number;
}

export interface IClearAllConfig extends IComMessage{
    func: 'clearAllTemporatyItems';
    // No x, y, size needed for this global action
}
// ----------------------------------------------------------------------

export class ClearAllCommand extends BaseCommand<INoParamsConfig> {
    static readonly func = 'clearAll';
    static readonly group = 'Clear';
    static readonly label = 'Clear All (Single)';
    static readonly params: TComMessageParams = [];
    static readonly defaults = {};

    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        // tile.clearAll(); // Assuming a clearAll method exists
        // dispatcher.listTilesUpdated.add(tile);
    }
}


export class ClearAllSquareCommand extends BaseCommand<INoParamsConfig> {
    static readonly func = 'clearAllSquare';
    static readonly group = 'Clear';
    static readonly label = 'Clear All (Square)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 1, step: 2 }
    ];
    static readonly defaults = { size: 5 };

    execute(): void {
        iterateSquare(this.conf.x, this.conf.y, this.conf.size || 1, (tile: Tile) => {
            // tile.clearAll();
            // dispatcher.listTilesUpdated.add(tile);
        });
    }
}


export class ClearAllTemporatyItemsCommand extends BaseCommand<IClearAllConfig> {
    // This command does not require coordinates
    static readonly func = 'clearAllTemporatyItems';
    static readonly group = 'Clear';
    static readonly label = 'Clear All Temporary Items (Global)';
    static readonly params: TComMessageParams = []; 
    static readonly defaults = {};

    execute(): void {
        // Logic is typically delegated to the dispatcher/TilesActions for global state management
        // dispatcher.clearAllTemporatyItems(); 
    }
}


