// --- Imports ---
import { iterateSquare } from "../../../map/action/TileUtil.ts";
import { FactoryMap } from "../../../map/factory/factoryMap.ts";
import { Tile } from "../../../map/object/tile.ts";
import { 
    ILocatedComMessage,
    ICommandStatic,
    TComMessageParams,
    BaseCommand
} from "../../shared/actions/TypeCommand.ts";


// ----------------------------------------------------------------------
/** Assumed structure for an item record, derived from tileActions.ts and tile.ts */
type RecordRawItem = {
    t: "Asset" | string;
    key: string;
    lvl: number;
    off?: { x: number; y: number };
};

// ----------------------------------------------------------------------
// Action Config Definitions (for CommandImp Context)
// ----------------------------------------------------------------------
export interface IItemKeyConfig extends ILocatedComMessage {
    func: 'itemForceKey' | 'itemAddKey' | 'temporatyItemsForceKey';
    assetKey: string;
    h?: number; // Height/level for item placement
    off?: { x: number; y: number };
}


// ----------------------------------------------------------------------
// 4. Item CommandImps
// ----------------------------------------------------------------------

export class ItemAddKeyCommand extends BaseCommand<IItemKeyConfig> {
    static readonly func = 'itemAddKey';
    static readonly group = 'Items';
    static readonly label = 'Add Item Asset';
    static readonly params: TComMessageParams = [
        { key: 'assetKey', label: 'Asset Key', type: 'string' },
        { key: 'h', label: 'Level/Height', type: 'number', min: 0, step: 1 },
        // off is implicitly added to the base config but not user configurable via params
    ];
    static readonly defaults = { assetKey: 'default_item', h: 0 };

    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        const newItem: RecordRawItem = { t: "Asset", key: this.conf.assetKey, lvl: this.conf.h || 0, off: this.conf.off };
        // tile.addItem(newItem); 
        // dispatcher.listTilesUpdated.add(tile);
    }
}


export class ItemForceKeyCommand extends BaseCommand<IItemKeyConfig> {
    static readonly func = 'itemForceKey';
    static readonly group = 'Items';
    static readonly label = 'Force Item Asset';
    static readonly params: TComMessageParams = [
        { key: 'assetKey', label: 'Asset Key', type: 'string' },
        { key: 'h', label: 'Level/Height', type: 'number', min: 0, step: 1 },
    ];
    static readonly defaults = { assetKey: 'default_item', h: 0 };

    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        const newItem: RecordRawItem = { t: "Asset", key: this.conf.assetKey, lvl: this.conf.h || 0, off: this.conf.off };
        tile.clearItem(); 
        // tile.addItem(newItem); 
        // dispatcher.listTilesUpdated.add(tile);
    }
}


export class TemporatyItemsForceKeyCommand extends BaseCommand<IItemKeyConfig> {
    static readonly func = 'temporatyItemsForceKey';
    static readonly group = 'Items';
    static readonly label = 'Set Temporary Item';
    static readonly params: TComMessageParams = [
        { key: 'assetKey', label: 'Asset Key', type: 'string' },
        { key: 'h', label: 'Level/Height', type: 'number', min: 0, step: 1 },
    ];
    static readonly defaults = { assetKey: 'temp_item', h: 0 };

    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        const newItem: RecordRawItem = { t: "Asset", key: this.conf.assetKey, lvl: this.conf.h || 0, off: this.conf.off };
        // tile.setTemporatyItem(newItem); // Assuming setTemporatyItem exists
        // dispatcher.listTilesWithTempItems.push(tile); // Track for global clear
        // dispatcher.listTilesUpdated.add(tile);
    }
}

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


