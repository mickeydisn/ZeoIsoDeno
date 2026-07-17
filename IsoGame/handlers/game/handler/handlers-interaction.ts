import { TypeKeysActionUpdate } from "@iso-web/js/main/keyboad.ts";
import { toolRegistry } from "@iso-game/tools/com/toolRegistry.ts";

import { City } from "../../../map/generator/city/city.ts";
import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";
import {
  gobalGameState,
  tickUpdateKeyboard,
} from "@iso-game/states/game/gameState.ts";

// -------------------------------------

export interface EventGridClick extends TBaseMessage<"gridClick"> {
  x: number;
  y: number;
}
const gridClick: TGameHandlerAction<EventGridClick> = gameAction<
  EventGridClick
>("gridClick", (data: EventGridClick, _ctx: TGameHandlerContext) => {
  const x = data.x as number;
  const y = data.y as number;
  console.log("####################### gridClick CITY ");
  console.log(data);
  const _city = new City(_ctx.world, x, y);
});

// -------------------------------------
export interface EventUpdateKeyboard extends TBaseMessage<"updateKeyboard"> {
  keys: {
    up?: number | undefined;
    down?: number | undefined;
    left?: number | undefined;
    right?: number | undefined;
  };
}
const updateKeyboard: TGameHandlerAction<EventUpdateKeyboard> = gameAction<
  EventUpdateKeyboard
>("updateKeyboard", (data: EventUpdateKeyboard, _ctx: TGameHandlerContext) => {
  tickUpdateKeyboard(gobalGameState, data.keys as TypeKeysActionUpdate);
});

// -------------------------------------

export interface EventMouseScreen extends TBaseMessage<"mouseMove"> {
  x: number;
  y: number;
}
const mouseMove: TGameHandlerAction<EventMouseScreen> = gameAction<
  EventMouseScreen
>("mouseMove", (data: EventMouseScreen, _ctx: TGameHandlerContext) => {
  gobalGameState.setMouseScreen(
    _ctx.gameloop.canvasMapDrawer._drawCtx,
    data.x as number,
    data.y as number,
  );
});

// -------------------------------------

export interface EventMouseClick extends TBaseMessage<"mouseClick"> {
  x: number;
  y: number;
}
const mouseClick: TGameHandlerAction<EventMouseClick> = gameAction<
  EventMouseClick
>("mouseClick", (
  data: EventMouseClick,
  _ctx: TGameHandlerContext,
) => {
  const tilesMatrix = _ctx.gameloop.canvasMapDrawer._drawCtx.tilesMatrix;
  gobalGameState.setMouseScreen(
    _ctx.gameloop.canvasMapDrawer._drawCtx,
    data.x as number,
    data.y as number,
  );
  const x = gobalGameState.mouseWorldX + gobalGameState.x -
    tilesMatrix.size / 2;
  const y = gobalGameState.mouseWorldY + gobalGameState.y -
    tilesMatrix.size / 2;

  console.log("Mouse Click Worker x:", x, "y:", y);

  const result = toolRegistry.executeAt(x, y, _ctx);

  // Forward result data for persistence (potion data, etc.)
  const response: Record<string, unknown> = {
    action: "toolExecuted",
    toolId: toolRegistry.getActiveId(),
    success: true,
  };
  if (result && typeof result === "object" && "potionId" in result) {
    response.potionResult = result;
  }
  _ctx.handler.send(response);
});

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const interactionHandlers = [
  gridClick,
  updateKeyboard,
  mouseMove,
  mouseClick,
] as const;
