import { GameHandlerData, GameWorker } from "../../gameWorker.ts";
import { mapState } from "../../../../../../IsoGame/mapIso/mapState.ts";

export const createRenderHandlers = (worker: GameWorker) => {
  return {
    startRender: (_data: GameHandlerData) => worker.startLoop(),
    stopRender: (_data: GameHandlerData) => worker.stopLoop(),
    setCenter: (data: GameHandlerData) => {
      mapState.setCenter(data.x, data.y);
    },
  };
};
