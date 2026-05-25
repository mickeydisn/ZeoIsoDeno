import { gobalMapState } from "@iso-game/mapIso/mapState.ts";
import { TypeKeysActionUpdate } from "@iso-web/js/main/keyboad.ts";
import { toolRegistry } from "@iso-game/tools/toolRegistry.ts";
import { City } from "../../../generator/city/city.ts";
import { TilesActions } from "../../../map/action2/tilesActions.ts";
import { TBaseMessage} from "../../../etc/handlers/types/type.ts";
import { gameAction, TGameHandlerAction , TGameHandlerContext } from "../contexts.ts";





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
    gobalMapState.tickUpdateKeyboard(data.keys as TypeKeysActionUpdate);
});

// -------------------------------------

export interface EventMouseScreen extends TBaseMessage<"mouseMove"> {
  x: number;
  y: number;
}
const mouseMove: TGameHandlerAction<EventMouseScreen> = 
  gameAction<EventMouseScreen>("mouseMove", 
   (data: EventMouseScreen, _ctx: TGameHandlerContext) => {
  gobalMapState.setMouseScreen(
    _ctx.gameloop.canvasMapDrawer._drawCtx, 
    data.x as number, 
    data.y as number
  );
});

// -------------------------------------


export interface EventMouseClick extends TBaseMessage<"mouseClick"> {
  x: number;
  y: number;
}
const mouseClick: TGameHandlerAction<EventMouseClick> = 
gameAction<EventMouseClick>("mouseClick", (
    data: EventMouseClick, _ctx: TGameHandlerContext
  ) => {
    
    const tilesMatrix = _ctx.gameloop.canvasMapDrawer._drawCtx.tilesMatrix;
    gobalMapState.setMouseScreen(
      _ctx.gameloop.canvasMapDrawer._drawCtx, 
      data.x as number, 
      data.y as number
    );
    const x = gobalMapState.mouseWorldX + gobalMapState.x - tilesMatrix.size / 2;
    const y = gobalMapState.mouseWorldY + gobalMapState.y - tilesMatrix.size / 2;

    console.log("Mouse Click Worker x:", x, "y:", y);

    // Check if a potion is active — intercept the click
    const activePotionId = gobalMapState.playerState.activePotionId;
    if (activePotionId) {
      const potion = gobalMapState.playerState.inventory.find(p => p.id === activePotionId);
      if (!potion || potion.remainingUses <= 0) {
        gobalMapState.playerState.activePotionId = null;
        _ctx.handler.send({
          action: "potionUsed",
          potionId: activePotionId,
          remainingUses: 0,
          success: false,
          reason: "Potion not found or no uses remaining",
        });
        return;
      }

      // Decrement uses
      potion.remainingUses -= 1;

      // Build action configs injecting x,y
      const confs = potion.actions.map(entry => ({
        func: entry.func,
        x,
        y,
        ...entry.config,
      }));

      // Execute all actions
      TilesActions.getInstance().doActions(confs);

      // Remove potion if 0 uses left
      if (potion.remainingUses <= 0) {
        const idx = gobalMapState.playerState.inventory.indexOf(potion);
        if (idx !== -1) gobalMapState.playerState.inventory.splice(idx, 1);
      }

      // Reset active potion
      gobalMapState.playerState.activePotionId = null;

      // Notify main thread to persist
      _ctx.handler.send({
        action: "potionUsed",
        potionId: potion.id,
        remainingUses: potion.remainingUses,
        success: true,
      });
      return;
    }

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
