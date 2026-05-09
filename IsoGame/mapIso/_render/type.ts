import { Isomer } from "@iso-game/mapIso/iso/isomer.ts";
import { CanvasMapDrawersConf } from "@iso-game/mapIso/canvasMapDrawer.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { IsometricProjector } from "@iso-game/mapIso/simpleIso/IsometricProjector.ts";
import { TilesMatrixAvg } from "@iso-game/map/object/tilesMatrix.ts";

type CanvasRenderingContext2D = OffscreenCanvasRenderingContext2D;

// --- Constants for Readability and Maintenance ---
// The factor used to scale the tile level (z-axis) difference for isometric rendering.
export const LVL_Z_SCALE_FACTOR = 1 / 3;


export type DrawContext = {
    isomer: Isomer,
    isoProject: IsometricProjector,

    assetLoader: AssetLoaderOpti,
    canvasCtx: CanvasRenderingContext2D,

    conf: CanvasMapDrawersConf,
    tilesMatrix: TilesMatrixAvg,

    frameCount: number,  
    direction: string;

}
