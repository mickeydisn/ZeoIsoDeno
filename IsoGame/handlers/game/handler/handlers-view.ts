import { TBaseMessage } from "@iso-game/etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "@iso-game/handlers/game/contexts.ts";
import { gobalGameState } from "@iso-game/states/game/gameState.ts";

// -------------------------------------
export interface EventSetViewLayer extends TBaseMessage<"setIsoConfigLayer"> {
  showIsFrise?: boolean;
  showIsBlock?: boolean;
  showTileBox?: boolean;
  showIsBuilding?: boolean;
}

export const setIsoConfigLayer: TGameHandlerAction<EventSetViewLayer> =
  gameAction<
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
      if (data.showTileBox !== undefined) {
        gobalGameState.isoConf.showTileBox = data.showTileBox;
      }
      if (data.showIsBuilding !== undefined) {
        gobalGameState.isoConf.showIsBuilding = data.showIsBuilding;
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
        if (data.showTileBox !== undefined) {
          drawCtx.conf.showTileBox = data.showTileBox;
        }
        if (data.showIsBuilding !== undefined) {
          drawCtx.conf.showIsBuilding = data.showIsBuilding;
        }
      }
    },
  );

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const viewHandlers = [
  setIsoConfigLayer,
] as const;
