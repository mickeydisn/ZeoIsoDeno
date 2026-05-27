import { gobalMapState } from "@iso-game/mapIso/mapState.ts";
import { TypeKeysActionUpdate } from "@iso-web/js/main/keyboad.ts";
import { toolRegistry } from "@iso-game/tools/toolRegistry.ts";
import { City } from "../../../generator/city/city.ts";
import { TilesActions } from "../../../map/action2/tilesActions.ts";
import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";

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
  gobalMapState.tickUpdateKeyboard(data.keys as TypeKeysActionUpdate);
});

// -------------------------------------

export interface EventMouseScreen extends TBaseMessage<"mouseMove"> {
  x: number;
  y: number;
}
const mouseMove: TGameHandlerAction<EventMouseScreen> = gameAction<
  EventMouseScreen
>("mouseMove", (data: EventMouseScreen, _ctx: TGameHandlerContext) => {
  gobalMapState.setMouseScreen(
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
  gobalMapState.setMouseScreen(
    _ctx.gameloop.canvasMapDrawer._drawCtx,
    data.x as number,
    data.y as number,
  );
  const x = gobalMapState.mouseWorldX + gobalMapState.x - tilesMatrix.size / 2;
  const y = gobalMapState.mouseWorldY + gobalMapState.y - tilesMatrix.size / 2;

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
