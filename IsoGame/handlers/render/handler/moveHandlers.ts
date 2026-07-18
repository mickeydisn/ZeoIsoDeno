import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  renderAction,
  TRenderHandlerAction,
  TRenderHandlerContext,
} from "../contexts.ts";
import {
  setRenderPosition,
  tickRenderKeyboard,
} from "../states/renderStateUtils.ts";
import { TypeKeysActionUpdate } from "../states/renderStateType.ts";

// -------------------------------------
export interface EventUpdateCenter extends TBaseMessage<"updateCenter"> {
  xf: number;
  yf: number;
}
const updateCenter: TRenderHandlerAction<EventUpdateCenter> = renderAction<
  EventUpdateCenter
>(
  "updateCenter",
  (_data: EventUpdateCenter, _ctx: TRenderHandlerContext) => {
    setRenderPosition(_ctx.renderState, _data.xf, _data.yf);
  },
);
// -------------------------------------

// -------------------------------------
export interface EventUpdateKeyboard extends TBaseMessage<"updateKeyboard"> {
  keys: {
    up?: number | undefined;
    down?: number | undefined;
    left?: number | undefined;
    right?: number | undefined;
  };
}
const updateKeyboard: TRenderHandlerAction<EventUpdateKeyboard> = renderAction<
  EventUpdateKeyboard
>(
  "updateKeyboard",
  (_data: EventUpdateKeyboard, _ctx: TRenderHandlerContext) => {
    tickRenderKeyboard(_ctx.renderState, _data.keys as TypeKeysActionUpdate);
  },
);
// -------------------------------------

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const moveHandlers = [
  updateCenter,
  updateKeyboard,
] as const;
