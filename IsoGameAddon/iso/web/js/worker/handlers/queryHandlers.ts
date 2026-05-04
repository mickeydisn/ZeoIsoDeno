import { GameHandlerData, GameWorker } from "../../gameWorker.ts";
import { FactoryMap } from "../../../../../../IsoGame/map/factory/factoryMap.ts";
import { mapState } from "../../../../../../IsoGame/mapIso/mapState.ts";

export const createQueryHandlers = (worker: GameWorker) => {
  return {
    query_infoCell: (data: GameHandlerData) => {
      const x = data.x !== undefined ? data.x : mapState.x;
      const y = data.y !== undefined ? data.y : mapState.y;
      const tile = FactoryMap.getInstance().getTile(x, y);
      return tile.toJsonInfo();
    },
  };
};
