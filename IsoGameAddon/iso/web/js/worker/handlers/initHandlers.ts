import { GameHandlerData, GameWorker } from "../../gameWorker.ts";
import { AssetLoaderOpti } from "../../../../../../IsoGame/mapIso/asset/assetLoaderOpti.ts";
import { terrainTools } from "../../../../../../IsoGame/tools/terrainTools.ts";
import { toolRegistry } from "../../../../../../IsoGame/tools/toolRegistry.ts";
import { colorTools } from "../../../../../../IsoGame/tools/colorTools.ts";
import { assetTools } from "../../../../../../IsoGame/tools/assetTools.ts";
import { structureTools } from "../../../../../../IsoGame/tools/structureTools.ts";
import { mapState } from "../../../../../../IsoGame/mapIso/mapState.ts";
import { CityEntity } from "../../../../../../IsoGame/entity/cityEntity.ts";
import { CityEntity2 } from "../../../../../../IsoGame/entity/cityEntity2.ts";
import { CanvasMapDrawers, CanvasMapDrawersConf } from "../../../../../../IsoGame/mapIso/canvasMapDrawer.ts";

export const createInitHandlers = (worker: GameWorker) => {
  return {
    initWorker: async (_data: GameHandlerData) => {
      console.log("=== InitGameWorker");

      console.log("== Load Asset");
      (worker as any).assetLoader = await AssetLoaderOpti.create();

      console.log("== Load Word");
      (worker as any).world.init();

      console.log("== Register Tools");
      terrainTools.forEach((tool) => toolRegistry.register(tool));
      colorTools.forEach((tool) => toolRegistry.register(tool));
      assetTools.forEach((tool) => toolRegistry.register(tool));
      structureTools.forEach((tool) => toolRegistry.register(tool));

      // Send asset groups to main thread for asset browser
      const assetGroups = worker.assetLoader.assetList.map((g: any) => ({
        group: g.group,
        images: g.images.map((i: any) => i.label),
      }));
      worker.handler.send({
        action: "assetGroups",
        groups: assetGroups,
      });

      const range = (start: number, end: number, step = 1): number[] => {
        return Array.from(
          { length: (end - start) / step + 1 },
          (_, i) => start + i * step,
        );
      }

      if (true) {
        mapState.setCenter(0, 0)

        // ENTITY 
        range(0, 20).forEach(() => {
          const entity = new CityEntity(worker.world);
          worker.world.entities.push(entity);
        })
        range(0, 50).forEach(() => {
          const entity = new CityEntity2(worker.world, {
            x: 0 + Math.round(Math.random() * 20) - 20,
            y: 0 + Math.round(Math.random() * 20) - 20,
          });
          worker.world.entities.push(entity);
        })
      }

      return true
    },

    setOffScreenCanvas: (data: GameHandlerData) => {
      const canvas = data.canvas as OffscreenCanvas;
      (worker as any).canvasMap = canvas;
    },

    initCanvasMap: (data: GameHandlerData) => {
      console.log("=== Init Render Worker");

      const isoConf = data.mapConf as CanvasMapDrawersConf || {
        DRAW_TILE_COUNT: 40,
        SCALE_SIZE: 1.2,
        SCALE_MOD: 1,
      }

      worker.canvasMapDrawer = new CanvasMapDrawers(
        (worker as any).world,
        data.width | 1600,
        data.height | 800,
        isoConf,
        (worker as any).assetLoader,
        (worker as any).canvasMap,
      );

      mapState.setIsoConf({
        mapSize: isoConf.DRAW_TILE_COUNT,
        tileScaleSize: isoConf.SCALE_SIZE,
        tileScaleMod: isoConf.SCALE_MOD,
      })
      mapState._isoProject = worker.canvasMapDrawer.isoProject
      mapState._tilesMatrix = worker.canvasMapDrawer.tilesMatrix
    }
  };
};
