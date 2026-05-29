import { Isomer } from "@iso-game/mapIso/utils/iso/isomer.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { IsometricProjector } from "@iso-game/mapIso/utils/simpleIso/IsometricProjector.ts";
import { TilesMatrixAvg } from "@iso-game/map/object/tilesMatrix.ts";
import { MessageHandler } from "@iso-game/etc/handlers/messageHandler.ts";
import { MapState } from "@iso-game/handlers/game/mapState.ts";

// Canvas Context ( Shared beetween worker and screen render)
type CanvasRenderingContext2D = OffscreenCanvasRenderingContext2D;

// --- Constants for Readability and Maintenance ---
// The factor used to scale the tile level (z-axis) difference for isometric rendering.
export const LVL_Z_SCALE_FACTOR = 1 / 3;

// --
export type DrawContext = {
  handler: MessageHandler<any, any, any>;

  isomer: Isomer;
  isoProject: IsometricProjector;

  assetLoader?: AssetLoaderOpti;
  canvasCtx: CanvasRenderingContext2D;

  conf: CanvasMapDrawersConf;
  mapState: MapState;
  tilesMatrix: TilesMatrixAvg;

  frameCount: number;
  currentDiplayBox: {
    cardId: string;
    x: number;
    y: number;
    distance: number;
  }[];
};

// ---

// --- Configuration Interfaces (Renamed for Clarity) ---
export interface CanvasMapDrawersConfOption {
  DRAW_TILE_COUNT?: number;
  SCALE_SIZE?: number;
  SCALE_MOD?: number;
}
export interface CanvasMapDrawersConf {
  DRAW_TILE_COUNT: number; // Replaced DRAW_TILE_COUNT
  SCALE_SIZE: number;
  SCALE_MOD: number;
}

export const CanvasMapDrawersConfDefault: CanvasMapDrawersConf = {
  DRAW_TILE_COUNT: 40,
  SCALE_SIZE: 1,
  SCALE_MOD: 1,
};
