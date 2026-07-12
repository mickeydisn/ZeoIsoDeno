import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";
import { gobalGameState } from "../gameState.ts";

// -------------------------------------
export interface EventSetViewLayer extends TBaseMessage<"setIsoConfigLayer"> {
  showIsFrise?: boolean;
  showIsBlock?: boolean;
}

export const setIsoConfigLayer: TGameHandlerAction<EventSetViewLayer> = gameAction<
  EventSetViewLayer
>(
  "setIsoConfigLayer",
  (data: EventSetViewLayer, _ctx: TGameHandlerContext) => {
    console.log("setIsoConfigLayer received:", data);

    // Update game state
    if (data.showIsFrise !== undefined) {
      gobalGameState.isoConf.showIsFrise = data.showIsFrise;
    }
    if (data.showIsBlock !== undefined) {
      gobalGameState.isoConf.showIsBlock = data.showIsBlock;
    }

    // Update draw context conf (used immediately by render pipeline)
    const drawCtx = _ctx.gameloop.canvasMapDrawer?._drawCtx;
    if (drawCtx) {
      if (data.showIsFrise !== undefined) {
        drawCtx.conf.showIsFrise = data.showIsFrise;
      }
      if (data.showIsBlock !== undefined) {
        drawCtx.conf.showIsBlock = data.showIsBlock;
      }
    }
  },
);