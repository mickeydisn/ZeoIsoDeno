import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  renderAction,
  TRenderHandlerAction,
  TRenderHandlerContext,
} from "../contexts.ts";

// -------------------------------------
export interface EventUpdateDrawConfigLayout
  extends TBaseMessage<"updateDrawConfigLayout"> {
  mapGridSize: number;
  mapGridMod: number;
  mapGridTileScale: number;
}

const updateDrawConfigLayout: TRenderHandlerAction<
  EventUpdateDrawConfigLayout
> = renderAction<
  EventUpdateDrawConfigLayout
>(
  "updateDrawConfigLayout",
  (_data: EventUpdateDrawConfigLayout, _ctx: TRenderHandlerContext) => {
    _ctx.renderState.mapGridSize = _data.mapGridSize;
    _ctx.renderState.mapGridTileScale = _data.mapGridTileScale;
    _ctx.renderState.mapGridMod = _data.mapGridMod;
  },
);
// -------------------------------------

// -------------------------------------
export interface EventUpdateDrawConfigLayer
  extends TBaseMessage<"updateDrawConfigLayer"> {
  showTileBox: boolean;
  showIsFrise: boolean;
  showIsBlock: boolean;
}

const updateDrawConfigLayer: TRenderHandlerAction<EventUpdateDrawConfigLayer> =
  renderAction<
    EventUpdateDrawConfigLayer
  >(
    "updateDrawConfigLayer",
    (_data: EventUpdateDrawConfigLayer, _ctx: TRenderHandlerContext) => {
      _ctx.renderState.showTileBox = _data.showTileBox;
      _ctx.renderState.showIsFrise = _data.showIsFrise;
      _ctx.renderState.showIsBlock = _data.showIsBlock;
    },
  );
// -------------------------------------

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const initRenderHandlers = [
  updateDrawConfigLayout,
  updateDrawConfigLayer,
] as const;
