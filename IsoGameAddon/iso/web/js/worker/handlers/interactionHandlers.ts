import { GameHandlerData, GameWorker } from "../../gameWorker.ts";
import { mapState } from "../../../../../../IsoGame/mapIso/mapState.ts";
import { TypeKeysActionUpdate } from "../../main/keyboad.ts";
import { toolRegistry } from "../../../../../../IsoGame/tools/toolRegistry.ts";
import { City } from "../../../../../../IsoGame/city/city.ts";

export const createInteractionHandlers = (worker: GameWorker) => {
  return {
    gridClick: (data: GameHandlerData) => {
      const x = (data as Record<string, unknown>).x as number;
      const y = (data as Record<string, unknown>).y as number;
      console.log("####################### gridClick CITY ");
      console.log(data);
      const _city = new City((worker as any).world, x, y);
    },

    updateKeyboard: (data: GameHandlerData) => {
      mapState.tickUpdateKeyboard(data.keyboardAction as TypeKeysActionUpdate);
    },

    mouseMove: (data: GameHandlerData) => {
      mapState.setMouseScreen(data.x as number, data.y as number);
    },

    mouseClick: (data: GameHandlerData) => {
      mapState.setMouseScreen(data.x as number, data.y as number);
      const x = mapState.mouseWorldX + mapState.x - mapState.tilesMatrix().size / 2;
      const y = mapState.mouseWorldY + mapState.y - mapState.tilesMatrix().size / 2;

      console.log("Mouse Click Worker x:", x, "y:", y);
      const result = toolRegistry.executeAt(x, y, (worker as any).world);

      worker.handler.send({
        action: "toolExecuted",
        toolId: toolRegistry.getActiveId(),
        success: true,
      });
    }
  };
};
