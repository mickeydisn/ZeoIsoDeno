// --- Imports ---
import { iterateSquare } from "../../../map/action/TileUtil.ts";
import { FactoryMap } from "../../../map/factory/factoryMap.ts";
import { Tile } from "../../../map/object/tile.ts";
import { TilesMatrix } from "../../../map/object/tilesMatrix.ts";
import { 
    ILocatedComMessage,
    ICommandStatic,
    TComMessageParams,
    BaseCommand
} from "../../shared/actions/TypeCommand.ts";

// ----------------------------------------------------------------------
// Action Config Definitions (for Command Context)
// ----------------------------------------------------------------------

export interface IColorConfig extends ILocatedComMessage {
    func: 'color';
    color: number[];
}
export interface IColorSquareConfig extends ILocatedComMessage {
    func: 'colorSquare';
    color: number[];
    size: number;
}
export interface IClearSquareConfig extends ILocatedComMessage {
    func: 'clearColor' | 'clearColorSquare';
    size?: number;
}

// ----------------------------------------------------------------------
// 3. Color Commands
// ----------------------------------------------------------------------

export class ClearColorCommand extends BaseCommand<IClearSquareConfig> {
    static readonly func = 'clearColor';
    static readonly group = 'Color';
    static readonly label = 'Clear Color (Single)';
    static readonly params: TComMessageParams = [];
    static readonly defaults = {};

    execute(): void {
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        tile.color = [255, 255, 255, 255]; // Assuming default color
        // dispatcher.listTilesUpdated.add(tile);
    }
}

// ----------------------------------------------------------------------
// 3. Color Commands
// ----------------------------------------------------------------------

export class ClearColorSquareCommand extends BaseCommand<IClearSquareConfig> {
    static readonly func = 'clearColorSquare';
    static readonly group = 'Color';
    static readonly label = 'Clear Color (Square)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 1, step: 2 }
    ];
    static readonly defaults = { size: 3 };

    execute(): void {
        iterateSquare(this.conf.x, this.conf.y, this.conf.size || 1, (tile: Tile) => {
            tile.color = [255, 255, 255, 255]; // Assuming default color
            //dispatcher.listTilesUpdated.add(tile);
        });
    }
}

// ----------------------------------------------------------------------
// 3. Color Commands
// ----------------------------------------------------------------------

export class ColorCommand extends BaseCommand<IColorConfig> {
    static readonly func = 'color';
    static readonly group = 'Color';
    static readonly label = 'Set Color (Single)';
    static readonly params: TComMessageParams = [
        { key: 'color', label: 'Color (RGB/A)', type: 'colorArray' }
    ];
    static readonly defaults = { color: [100, 100, 255, 255] };

    execute(): void {
        const finalColor = this.conf.color.length === 3 ? [...this.conf.color, 255] : this.conf.color;
        const tile = FactoryMap.getInstance().getTile(this.conf.x, this.conf.y);
        tile.color = finalColor;
        // dispatcher.listTilesUpdated.add(tile);
    }
}

// ----------------------------------------------------------------------
// 3. Color Commands
// ----------------------------------------------------------------------

export class ColorSquareCommand extends BaseCommand<IColorSquareConfig> {
    static readonly func = 'colorSquare';
    static readonly group = 'Color';
    static readonly label = 'Set Color (Square)';
    static readonly params: TComMessageParams = [
        { key: 'size', label: 'Size', type: 'number', min: 1, step: 2 },
        { key: 'color', label: 'Color (RGB/A)', type: 'colorArray' }
    ];
    static readonly defaults = { size: 5, color: [100, 100, 255, 255] };

    execute(): void {
        const box = new TilesMatrix(this.conf.size, this.conf.x, this.conf.y);
        const finalColor = this.conf.color.length === 3 ? [...this.conf.color, 255] : this.conf.color;
        
        box.tiles.forEach((row: any[]) => {
            row.forEach((cellTile: any) => {
                cellTile.color = finalColor;
                // dispatcher.listTilesUpdated.add(cellTile);
            });
        });
    }
}
