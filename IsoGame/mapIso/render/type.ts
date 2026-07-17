import { Isomer } from "@iso-game/mapIso/utils/iso/isomer.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { IsometricProjector } from "@iso-game/mapIso/utils/simpleIso/IsometricProjector.ts";
import { TilesMatrixAvg } from "@iso-game/map/object/tilesMatrix.ts";
import { MessageHandler } from "@iso-game/etc/handlers/messageHandler.ts";
import { GameState } from "@iso-game/states/game/gameState.ts";

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

  conf: IsoConfig;
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

// --- Configuration Interfaces ---

/**
 * Canonical isometric configuration type used throughout the codebase.
 * All isometric rendering parameters are defined here in one place.
 */
export interface IsoConfig {
  mapGridSize: number;
  mapGridTileScale: number;
  mapGridMod: number;

  showTileBox: boolean;
  showIsFrise: boolean;
  showIsBlock: boolean;
  showIsBuilding: boolean;
}

/** @deprecated Use `IsoConfig` instead */
export type MapGridLaout = IsoConfig;

/** @deprecated Use `IsoConfig` with partial fields instead */
export type MapGridLaoutOption = Partial<IsoConfig>;

export const DEFAULT_ISO_CONFIG: IsoConfig = {
  mapGridSize: 40,
  mapGridTileScale: 1.4,
  mapGridMod: 1,
  showTileBox: false,
  showIsFrise: true,
  showIsBlock: true,
  showIsBuilding: true,
};

/** @deprecated Use `DEFAULT_ISO_CONFIG` instead */
export const MapGridLaoutDefault = DEFAULT_ISO_CONFIG;
