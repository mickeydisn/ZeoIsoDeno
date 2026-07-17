import { gobalGameState } from "@iso-game/states/game/gameState.ts";

import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";

// -------------------------------------

export interface EventStartRender extends TBaseMessage<"startRender"> {}
const startRender: TGameHandlerAction<EventStartRender> = gameAction<
  EventStartRender
>(
  "startRender",
  (_data: EventStartRender, _ctx: TGameHandlerContext) =>
    _ctx.gameloop.startLoop(),
);

// -------------------------------------

export interface EventStopRender extends TBaseMessage<"stopRender"> {}
const stopRender: TGameHandlerAction<EventStopRender> = gameAction<
  EventStopRender
>(
  "stopRender",
  (_data: EventStopRender, _ctx: TGameHandlerContext) =>
    _ctx.gameloop.stopLoop(),
);

// -------------------------------------

export interface EventSetCenter extends TBaseMessage<"setCenter"> {
  x: number;
  y: number;
}
const setCenter: TGameHandlerAction<EventSetCenter> = gameAction<
  EventSetCenter
>("setCenter", (data: EventSetCenter, _ctx: TGameHandlerContext) => {
  gobalGameState.setCenter(data.x, data.y);
});

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const renderHandlers = [
  startRender,
  stopRender,
  setCenter,
] as const;
