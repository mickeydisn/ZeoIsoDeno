type CanvasRenderingContext2D = OffscreenCanvasRenderingContext2D;

import {
  ExtractAction,
  TBaseMessage,
  THandlerAction,
  THandlerContext,
} from "@iso-game/etc/handlers/types/type.ts";

import { Isomer } from "@iso-game/mapIso/utils/iso/isomer.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { IsometricProjector } from "@iso-game/mapIso/utils/simpleIso/IsometricProjector.ts";
import { TilesMatrixAvg } from "@iso-game/map/object/tilesMatrix.ts";
import { GameState } from "../game/gameState.ts";
import { RenderState } from "./state/renderState.ts";
import { MapGridLaout } from "@iso-game/mapIso/render/type.ts";

// ────────────────────────────────────────────
// CONTEXT
// ────────────────────────────────────────────
export type TRenderHandlerContext = THandlerContext & {
  worker: Window & typeof globalThis;
  tag: "render";

  conf: MapGridLaout;
  isomer: Isomer;
  isoProject: IsometricProjector;

  assetLoader?: AssetLoaderOpti;
  canvasMap?: OffscreenCanvas;
  canvasCtx: CanvasRenderingContext2D;

  frameCount: number;
  gameState: GameState;
  renderState: RenderState;
  tilesMatrix: TilesMatrixAvg;
  tileCache: Map<string, OffscreenCanvas | ImageBitmap>;
};

// ────────────────────────────────────────────
// HELPER
// ────────────────────────────────────────────

// ────────────────────────────────────────────
// type of handler function for game messages in game worker context
export type TRenderHandlerAction<TMsg extends TBaseMessage<string>> =
  THandlerAction<TMsg, TRenderHandlerContext>;

// ────────────────────────────────────────────
// helper to create game handler in the context of the game worker.
export function renderAction<TMsg extends TBaseMessage<string>>(
  action: ExtractAction<TMsg>,
  handler: TRenderHandlerAction<TMsg>,
): TRenderHandlerAction<TMsg> & { _action: typeof action } {
  return Object.assign(handler, { _action: action });
}
