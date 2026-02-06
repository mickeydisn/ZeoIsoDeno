// --- Imports ---
import { iterateSquare } from "../../../map/action/TileUtil.ts";
import { FactoryMap } from "../../../map/factory/factoryMap.ts";
import { Tile } from "../../../map/object/tile.ts";
import { 
    IComMessage,
    ILocatedComMessage,
    ICommand,
    ICommandStatic,
    TComMessageParams,
    BaseCommand
} from "../../shared/actions/TypeCommand.ts";

// ----------------------------------------------------------------------
// Action Config Definitions (for Command Context)
// ----------------------------------------------------------------------


// ----------------------------------------------------------------------
// 2. Level (Lvl) Commands
// ----------------------------------------------------------------------
export interface IClearLvlConfig extends ILocatedComMessage {
    func: 'clearLvl' | 'clearLvlSquare';
    size?: number;
}

export class ClearLvlCommand extends BaseCommand<IClearLvlConfig> {
    static readonly func = 'clearLvl';
    static readonly group = 'Leveling';
    static readonly label = 'Clear Level (Single)';
    static readonly params: TComMessageParams = [];
    static readonly defaults = {};

    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        tile.lvl = 0;
        // dispatcher.listTilesUpdated.add(tile);
    }
}


export class ClearLvlSquareCommand extends BaseCommand<IClearLvlConfig> {
    static readonly func = 'clearLvlSquare';
    static readonly group = 'Leveling';
    static readonly label = 'Clear Level (Square)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 1, step: 2 }
    ];
    static readonly defaults = { size: 3 };


    execute(): void {
        iterateSquare( this.conf.x, this.conf.y, this.conf.size || 1, (tile: Tile) => {
            tile.lvl = 0;
            // dispatcher.listTilesUpdated.add(tile);
        });
    }
}


// ----------------------------------------------------------------------
// 2. Level (Lvl) Commands
// ----------------------------------------------------------------------

export interface ILvlChangeConfig extends ILocatedComMessage {
    func: 'lvlSet' | 'lvlUp';
    lvl: number;
}


export class LvlSetCommand extends BaseCommand<ILvlChangeConfig> {
    static readonly func = 'lvlSet';
    static readonly group = 'Leveling';
    static readonly label = 'Set Level (Single)';
    static readonly params: TComMessageParams = [
        { key: 'lvl', label: 'New Level', type: 'number', min: 0 }
    ];
    static readonly defaults = { lvl: 10 };

    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        tile.lvl = this.conf.lvl;
        // dispatcher.listTilesUpdated.add(tile);
    }
}


export class LvlUpCommand extends BaseCommand<ILvlChangeConfig> {
    static readonly func = 'lvlUp';
    static readonly group = 'Leveling';
    static readonly label = 'Raise Level (Single)';
    static readonly params: TComMessageParams = [
        { key: 'lvl', label: 'Level Increase', type: 'number', min: 1 }
    ];
    static readonly defaults = { lvl: 1 };


    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        tile.lvl += this.conf.lvl;
        // dispatcher.listTilesUpdated.add(tile);
    }
}


// ----------------------------------------------------------------------
// 2. Level (Lvl) Commands
// ----------------------------------------------------------------------

export interface ILvlSquareChangeConfig extends ILocatedComMessage {
    func: 'lvlUpSquare'; // Specific to changing Lvl over a square
    size: number;
    lvl: number;
}

export class LvlUpSquareCommand extends BaseCommand<ILvlSquareChangeConfig> {
    static readonly func = 'lvlUpSquare';
    static readonly group = 'Leveling';
    static readonly label = 'Raise Level (Square)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 1, step: 2 },
        { key: 'lvl', label: 'Level Increase', type: 'number', min: 1 }
    ];
    static readonly defaults = { size: 5, lvl: 1 };

    execute(): void {
        iterateSquare(this.conf.x, this.conf.y, this.conf.size, (tile: Tile) => {
            tile.lvl += this.conf.lvl;
            // dispatcher.listTilesUpdated.add(tile);
        });
    }
}


// NOTE: LvlFlatSquareCommand, LvlAvgCommand, LvlAvgSquareCommand, LvlAvgBorderCommand 
// are complex and require more specific logic than can be inferred, 
// so basic constructors are provided here, assuming logic is in 'execute'.
// ----------------------------------------------------------------------
// 2. Level (Lvl) Commands
// ----------------------------------------------------------------------
export interface ILvlFlatConfig extends ILocatedComMessage {
    func: 'lvlFlatSquare';
    size: number;
}

export class LvlFlatSquareCommand extends BaseCommand<ILvlFlatConfig> {
    static readonly func = 'lvlFlatSquare';
    static readonly group = 'Leveling';
    static readonly label = 'Flatten Level (Square)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 1, step: 2 }
    ];
    static readonly defaults = { size: 3 };


    execute(): void {
        // Implementation for flattening logic goes here
        console.warn(`LvlFlatSquareCommand executed at (${this.conf.x}, ${this.conf.y}) with size ${this.conf.size}.`);
    }
}


// ----------------------------------------------------------------------
// 2. Level (Lvl) Commands
// ----------------------------------------------------------------------

export interface ILvlAvgConfig extends ILocatedComMessage {
    func: 'lvlAvg';
    size: number; // Size for the neighborhood check (default 3)
}


export class LvlAvgCommand extends BaseCommand<ILvlAvgConfig> {
    static readonly func = 'lvlAvg';
    static readonly group = 'Leveling';
    static readonly label = 'Average Level (Area)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Neighborhood Size', type: 'number', min: 3, step: 2 }
    ];
    static readonly defaults = { size: 3 };

    execute(): void {
        // Implementation for averaging logic goes here
        console.warn(`LvlAvgCommand executed at (${this.conf.x}, ${this.conf.y}) with size ${this.conf.size}.`);
    }
}


// ----------------------------------------------------------------------
// 2. Level (Lvl) Commands
// ----------------------------------------------------------------------
export interface ILvlAvgSquareBorderConfig extends ILocatedComMessage {
    func: 'lvlAvgSquare' | 'lvlAvgBorder';
    size: number;
}


export class LvlAvgSquareCommand extends BaseCommand<ILvlAvgSquareBorderConfig> {
    static readonly func = 'lvlAvgSquare';
    static readonly group = 'Leveling';
    static readonly label = 'Average Level (Square)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 3, step: 2 }
    ];
    static readonly defaults = { size: 5 };


    execute(): void {
        // Implementation for averaging over a square goes here
        console.warn(`LvlAvgSquareCommand executed at (${this.conf.x}, ${this.conf.y}) with size ${this.conf.size}.`);
    }
}


export class LvlAvgBorderCommand extends BaseCommand<ILvlAvgSquareBorderConfig> {
    static readonly func = 'lvlAvgBorder';
    static readonly group = 'Leveling';
    static readonly label = 'Average Level (Border)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 3, step: 2 }
    ];
    static readonly defaults = { size: 5 };

    execute(): void {
        // Implementation for averaging border logic goes here
        console.warn(`LvlAvgBorderCommand executed at (${this.conf.x}, ${this.conf.y}) with size ${this.conf.size}.`);
    }
}

