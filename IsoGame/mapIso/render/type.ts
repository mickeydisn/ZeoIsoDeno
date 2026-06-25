import { Isomer } from "@iso-game/mapIso/utils/iso/isomer.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { IsometricProjector } from "@iso-game/mapIso/utils/simpleIso/IsometricProjector.ts";
import { TilesMatrixAvg } from "@iso-game/map/object/tilesMatrix.ts";
import { MessageHandler } from "@iso-game/etc/handlers/messageHandler.ts";
import { GameState } from "../../handlers/game/gameState.ts";

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

  conf: MapGridLaout;
  gameState: GameState;
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

export interface MapGridLaout {
  mapGridSize: number; // Replaced mapGridSize
  mapGridTileScale: number; // Replaced mapGridTileScale
  mapGridMod: number; // Replaced mapGridMod

  showTileBox: boolean;
  showIsFrise: boolean;
  showIsBlock: boolean;
}

export interface MapGridLaoutOption {
  mapGridSize?: number;
  mapGridTileScale?: number;
  mapGridMod?: number;
}

export const MapGridLaoutDefault: MapGridLaout = {
  mapGridSize: 40,
  mapGridTileScale: 1.4,
  mapGridMod: 1,
  showTileBox: false,
  showIsFrise: false,
  showIsBlock: false,
};
