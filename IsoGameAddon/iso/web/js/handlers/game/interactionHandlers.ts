import { mapState } from "@iso-game/mapIso/mapState.ts";
import { TypeKeysActionUpdate } from "@iso-web/js/main/keyboad.ts";
import { toolRegistry } from "@iso-game/tools/toolRegistry.ts";
import { City } from "@iso-game/city/city.ts";
import { TBaseMessage} from "@iso-game/handlers/types/type.ts";
import { gameAction, TGameHandlerAction, TGameHandlerContext } from "@iso-web/js/handlers/contexts.ts";





// -------------------------------------

export interface EventGridClick extends TBaseMessage<"gridClick"> {
  x: number;
  y: number;
}
const gridClick: TGameHandlerAction<EventGridClick> = 
  gameAction<EventGridClick>("gridClick", 
   (data: EventGridClick, _ctx: TGameHandlerContext) => {
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
  }
}
const updateKeyboard: TGameHandlerAction<EventUpdateKeyboard> = 
  gameAction<EventUpdateKeyboard>("updateKeyboard", 
   (data: EventUpdateKeyboard, _ctx: TGameHandlerContext) => {
    mapState.tickUpdateKeyboard(data.keys as TypeKeysActionUpdate);
});

// -------------------------------------

export interface EventMouseScreen extends TBaseMessage<"mouseMove"> {
  x: number;
  y: number;
}
const mouseMove: TGameHandlerAction<EventMouseScreen> = 
  gameAction<EventMouseScreen>("mouseMove", 
   (data: EventMouseScreen, _ctx: TGameHandlerContext) => {
  mapState.setMouseScreen(data.x as number, data.y as number);
});

// -------------------------------------


export interface EventMouseClick extends TBaseMessage<"mouseClick"> {
  x: number;
  y: number;
}
const mouseClick: TGameHandlerAction<EventMouseClick> = 
  gameAction<EventMouseClick>("mouseClick", 
   (data: EventMouseClick, _ctx: TGameHandlerContext) => {
  mapState.setMouseScreen(data.x as number, data.y as number);
  const x = mapState.mouseWorldX + mapState.x - mapState.tilesMatrix().size / 2;
  const y = mapState.mouseWorldY + mapState.y - mapState.tilesMatrix().size / 2;

  console.log("Mouse Click Worker x:", x, "y:", y);
  const _result = toolRegistry.executeAt(x, y);

  _ctx.handler.send({
    action: "toolExecuted",
    toolId: toolRegistry.getActiveId(),
    success: true,
  });
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
