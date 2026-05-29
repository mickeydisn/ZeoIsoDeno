import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { toolRegistry } from "../tools/toolRegistry.ts";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  gobalMapState,
} from "@iso-game/handlers/game/mapState.ts";
import { CityEntity } from "@iso-game/entity/cityEntity.ts";
import { CityEntity2 } from "@iso-game/entity/cityEntity2.ts";
import { CanvasMapDrawers } from "@iso-game/mapIso/canvasMapDrawer.ts";
import { FactoryMap } from "@iso-game/map/factory/factoryMap.ts";
import { mapWebPersistence } from "../../../map/persistence/map/mapWebPersistence.ts";
import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";
import { CanvasMapDrawersConf } from "@iso-game/mapIso/render/type.ts";

// -------------------------------------

export interface EventInitWorker extends TBaseMessage<"initWorker"> {}

const initWorker: TGameHandlerAction<EventInitWorker> = gameAction<
  EventInitWorker
>("initWorker", async (_data: EventInitWorker, _ctx: TGameHandlerContext) => {
  console.log("=== InitGameWorker");

  console.log("== Load Asset");
  _ctx.gameloop.assetLoader = await AssetLoaderOpti.create();

  console.log("== Load Word", _ctx);
  _ctx.world.init();

  console.log("== Init Persistence");
  await mapWebPersistence.init();
  FactoryMap.getInstance().setPersistence(mapWebPersistence);

  console.log("== Register Tools");
  toolRegistry.initRegistry();

  // Send asset groups to main thread for asset browser
  // deno-lint-ignore no-explicit-any
  const assetGroups = _ctx.gameloop.assetLoader.assetList.map((g: any) => ({
    group: g.group,
    // deno-lint-ignore no-explicit-any
    images: g.images.map((i: any) => i.label),
  }));
  _ctx.handler.send({
    action: "assetGroups",
    groups: assetGroups,
  });

  const range = (start: number, end: number, step = 1): number[] => {
    return Array.from(
      { length: (end - start) / step + 1 },
      (_, i) => start + i * step,
    );
  };

  // deno-lint-ignore no-constant-condition
  if (true) {
    gobalMapState.setCenter(0, 0);

    // ENTITY
    range(0, 20).forEach(() => {
      const entity = new CityEntity(_ctx.world, {
        x: 0 + Math.round(Math.random() * 20) - 20,
        y: 0 + Math.round(Math.random() * 20) - 20,
      });
      _ctx.world.entities.push(entity);
    });
    /*
    range(0, 50).forEach(() => {
      const entity = new CityEntity2(_ctx.world, {
        x: 0 + Math.round(Math.random() * 20) - 20,
        y: 0 + Math.round(Math.random() * 20) - 20,
      });
      _ctx.world.entities.push(entity);
    });
    */
  }

  return true;
});

// -------------------------------------

export interface EventSetCanvasMap extends TBaseMessage<"setOffScreenCanvas"> {
  canvas: OffscreenCanvas;
}

const setOffScreenCanvas: TGameHandlerAction<EventSetCanvasMap> = gameAction<
  EventSetCanvasMap
>(
  "setOffScreenCanvas",
  (data: EventSetCanvasMap, _ctx: TGameHandlerContext) => {
    const canvas = data.canvas as OffscreenCanvas;
    _ctx.gameloop.canvasMap = canvas;
  },
);

// -------------------------------------

export interface EventInitCanvasMap extends TBaseMessage<"initCanvasMap"> {
  mapConf: {
    DRAW_TILE_COUNT: number;
    SCALE_SIZE: number;
    SCALE_MOD: number;
  };
  width?: number;
  height?: number;
}

const initCanvasMap: TGameHandlerAction<EventInitCanvasMap> = gameAction<
  EventInitCanvasMap
>("initCanvasMap", (data: EventInitCanvasMap, _ctx: TGameHandlerContext) => {
  console.log("=== Init Render Worker");

  const isoConf = data.mapConf as CanvasMapDrawersConf || {
    DRAW_TILE_COUNT: 40,
    SCALE_SIZE: 1.2,
    SCALE_MOD: 1,
  };

  _ctx.gameloop.canvasMapDrawer = new CanvasMapDrawers(
    _ctx,
    data.width ? data.width : CANVAS_WIDTH,
    data.height ? data.height : CANVAS_HEIGHT,
    isoConf,
    _ctx.gameloop.assetLoader,
    _ctx.gameloop.canvasMap,
  );

  gobalMapState.setIsoConf({
    mapSize: isoConf.DRAW_TILE_COUNT,
    tileScaleSize: isoConf.SCALE_SIZE,
    tileScaleMod: isoConf.SCALE_MOD,
  });
  // gobalMapState._isoProject = _ctx.gameloop.canvasMapDrawer.isoProject
  // gobalMapState._tilesMatrix = _ctx.gameloop.canvasMapDrawer.tilesMatrix
});

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const initHandlers = [
  initWorker,
  setOffScreenCanvas,
  initCanvasMap,
] as const;
