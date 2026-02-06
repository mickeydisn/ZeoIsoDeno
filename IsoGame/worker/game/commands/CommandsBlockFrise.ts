// --- Imports ---
import { iterateSquare } from "../../../map/action/TileUtil.ts";
import { FactoryMap } from "../../../map/factory/factoryMap.ts";
import { Tile } from "../../../map/object/tile.ts";
import { ILocatedComMessage, ICommand, ICommandStatic, TComMessageParams, BaseCommand } from "../../shared/actions/TypeCommand.ts";

// ----------------------------------------------------------------------
// Action Config Definitions (for Command Context)
// ----------------------------------------------------------------------

export interface ISetBlockFriseConfig extends ILocatedComMessage {
    func: 'setBlocked' | 'setFrise';
    x: number;
    y: number;
    isBlock?: boolean;
    isFrise?: boolean;
}

export interface ISetBlockFriseSquareConfig extends ILocatedComMessage {
    func: 'setBlocked' | 'setFrise';
    x: number;
    y: number;
    isBlock?: boolean;
    isFrise?: boolean;
    size?: number;
}

// ----------------------------------------------------------------------
// Block and Frise Commands
// ----------------------------------------------------------------------

class SetBlockedCommand extends BaseCommand<ISetBlockFriseConfig> {
    static readonly func: string = 'setBlocked';
    static readonly group: string = 'BlockFrise';
    static readonly label = 'Set Block/Unblock (Single)';
    static readonly params: TComMessageParams = [
        { key: 'isBlock', label: 'Is Blocked?', type: 'boolean' }
    ];
    static readonly defaults = { isBlock: true };

    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        tile.isBlock = this.conf.isBlock || false;
        // dispatcher.listTilesUpdated.add(tile);
    }
}


// ----------------------------------------------------------------------
// 1. Block and Frise Commands
// ----------------------------------------------------------------------

export class SetBlockedSquareCommand extends BaseCommand<ISetBlockFriseSquareConfig> {
    static readonly func = 'setBlockedSquare';
    static readonly label = 'Set Block/Unblock (Square)';
    static readonly group: string = 'BlockFrise';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 1, step: 2 },
        { key: 'isBlock', label: 'Is Blocked?', type: 'boolean' }
    ];
    static readonly defaults = { size: 3, isBlock: true };
    
    execute(): void {
        iterateSquare(this.conf.x, this.conf.y, this.conf.size ?? 1, (tile: Tile) => {
            tile.isBlock = this.conf.isBlock ?? false;
            // dispatcher.listTilesUpdated.add(tile);
        });
    }
}


// ----------------------------------------------------------------------
// 1. Block and Frise Commands
// ----------------------------------------------------------------------
export class SetFriseCommand extends BaseCommand<ISetBlockFriseConfig> {
    static readonly func = 'setFrise';
    static readonly label = 'Set Frise/Unfrise (Single)';
    static readonly group: string = 'BlockFrise';
    static readonly params: TComMessageParams = [
        { key: 'isFrise', label: 'Is Frise?', type: 'boolean' }
    ];
    static readonly defaults = { isFrise: true };
    
    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        tile.isFrise = this.conf.isFrise ?? false;
        // dispatcher.listTilesUpdated.add(tile);
    }
}


// ----------------------------------------------------------------------
// 1. Block and Frise Commands
// ----------------------------------------------------------------------
export class SetFriseSquareCommand extends BaseCommand<ISetBlockFriseSquareConfig> {
    static readonly func = 'setFriseSquare';
    static readonly label = 'Set Frise/Unfrise (Square)';
    static readonly group: string = 'BlockFrise';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 1, step: 2 },
        { key: 'isFrise', label: 'Is Frise?', type: 'boolean' }
    ];
    static readonly defaults = { size: 3, isFrise: true };

    
    execute(): void {
        iterateSquare(this.conf.x, this.conf.y, this.conf.size ?? 1, (tile: Tile) => {
            tile.isFrise = this.conf.isFrise ?? false;
            // dispatcher.listTilesUpdated.add(tile);
        });
    }
}
