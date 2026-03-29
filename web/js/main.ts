import { CanvasMapDrawersConf } from "../../IsoGame/mapIso/canvasMapDrawer.ts";
import { initFlyMenu } from "./menu/flyMenu.ts";
import { initToolMenu, handleToolList, handleToolExecuted, handlePickedColor, handleAssetGroups, handleAssetPreview, handleBuildingConfigList } from "./menu/toolMenu.ts";
import { infoMenu, updateInfoCell } from "./menu/InfoMenu.ts";
import { GameHandlerData } from "./gameWorker.ts";
import { GlobalState, initMenu, updatGlobalJSON } from "./gobalState.ts";
import { GridMapDrawers } from "../../IsoGame/mapIso/grid.ts";
import { initKeyBoard } from "./keyboad.ts";
import { MessageHandler } from "./worker/messageHandler.ts";

// ============================================================================
// CREATE WORKER
// ============================================================================


initMenu();
updatGlobalJSON(GlobalState);

// ============================================================================
// CREATE WORKER
// ============================================================================

const gameWorker = new Worker(
  new URL("./gameWorker.ts", import.meta.url).href,
  {
    type: "module",
  },
);

initKeyBoard(gameWorker);
initFlyMenu(gameWorker);
initToolMenu(gameWorker);
infoMenu(gameWorker);

// ============================================================================
// == Event Handeler
// ============================================================================
const handlers = new MessageHandler(gameWorker);

/* */
// ============================================================================
// CREATE SHARE ELEMENT
// ============================================================================

// Canvas For display Map
const canvasImageMap = document.getElementById(
  "map-image",
) as HTMLCanvasElement;

let gridMapDrawer: GridMapDrawers | null = null;

// ============================================================================
// == INIT
// ============================================================================

// Default map configuration (matches what's sent to worker)
const DEFAULT_MAP_CONF = {
  DRAW_TILE_COUNT: 40,
  SCALE_SIZE: 1,
  SCALE_MOD: 1,
};

// After The Game worker Initialiser . we cant send Shared Array
const callback_initWorker = (_data: GameHandlerData): void => {
  console.log("✅ Game Worker initialized!");
  
  // IMPORTANT: Attach click handlers to the original canvas BEFORE transferring control
  // This ensures click events work after the canvas is transferred to offscreen
  if (gridMapDrawer) {
    gridMapDrawer.setCanvas(canvasImageMap, DEFAULT_MAP_CONF);
    console.log("[main] Canvas click handler attached before offscreen transfer");
  }
  
  const offscreen = canvasImageMap.transferControlToOffscreen();

  handlers.sendDataSync({
    action: "setCanvasMap",
    canvas: offscreen,
  }, [
    offscreen,
  ]);

  handlers.send({
    action: "initCanvasMap",
    mapConf: DEFAULT_MAP_CONF,
  });
  /* 
  handlers.send({
    action: "gridClick",
    x: -19,
    y: 70,
  });
  /**/
  handlers.send({ action: "startRender" });
};

// ----------------------------------------------------------------------------
const callback_initCanvasMap = (data: GameHandlerData): void => {
  const mapconf = data.mapConf as CanvasMapDrawersConf;
  const bufferMapLvl = data.mapLvlBuffer;
  const bufferMapInfo = data.mapInfoBuffer;
  console.log("===== Call BackRender");

  gridMapDrawer = new GridMapDrawers(gameWorker, bufferMapLvl, bufferMapInfo);
  gridMapDrawer.mod = mapconf.DRAW_TILE_COUNT / 40;
  
  // If worker was already initialized, set canvas now
  // (This handles the case where initCanvasMap comes after initWorker)
  gridMapDrawer.setCanvas(canvasImageMap, {
    DRAW_TILE_COUNT: mapconf.DRAW_TILE_COUNT,
    SCALE_SIZE: mapconf.SCALE_SIZE,
    SCALE_MOD: mapconf.SCALE_MOD,
  });
};

// ============================================================================
// == Interface Responce Handlers.
// ============================================================================

handlers.append([
  ["callback_initWorker", callback_initWorker],
  ["callback_initCanvasMap", callback_initCanvasMap],
]);
handlers.send({ action: "initWorker" });
// handlers.send({ action: "initWorker" });

// ============================================================================
// == LOOP
// ============================================================================

let iFrame = 0;
let _shouldRun = true;

function frameTick() {
  if (gridMapDrawer) {
    gridMapDrawer.updateGrid();
  }
}

// 🌟 Read Matrix & Update Grid Efficiently
function updateFrame() {
  iFrame = (iFrame + 1) % 1028;
  if (iFrame % 4 == 0) {
    frameTick();
  }
  requestAnimationFrame(updateFrame);
  // setTimeout(updateFrame, 1)
}

// ---------------------------------------------------------------------------

function startLoop() {
  console.log("GameWorker: # START #");
  _shouldRun = true;
  updateFrame();
}

function stopLoop() {
  console.log("GameWorker: # STOP #");
  _shouldRun = false;
}

// Attach Active Page listeners
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    handlers.send({ action: "startRender" });
    startLoop();
  } else {
    handlers.send({ action: "stopRender" });
    stopLoop();
  }
});

// ============================================================================
// == Interface Responce Handlers.
// ============================================================================

handlers.append([
  ["FPS", (data) => {
    const fpsDisplay = document.getElementById("fps")!;
    fpsDisplay.textContent = `FPS: ${data.fps}`;
  }],
  ["infoCell", (data) => {
    updateInfoCell(data);
  }],
  ["toolList", (data) => {
    handleToolList(data.tools);
  }],
  ["toolExecuted", (data) => {
    handleToolExecuted(data.toolId, data.success);
  }],
  ["pickedColor", (data) => {
    handlePickedColor(data.r, data.g, data.b);
  }],
  ["assetGroups", (data) => {
    handleAssetGroups(data.groups);
  }],
  ["assetPreview", (data) => {
    handleAssetPreview(data.blobUrl);
  }],
  ["buildingConfigList", (data) => {
    handleBuildingConfigList(data.configs);
  }],
]);

// ============================================================================
// == Start Drawing and Worker Loop
// ============================================================================

startLoop();
