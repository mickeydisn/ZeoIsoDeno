import { CanvasMapDrawersConf } from "../../IsoGame/mapIso/canvasMapDrawer.ts";
import { flyMenuTab } from "./menu/flyMenu.ts";
import { initHeadMenu } from "./menu/headMenu.ts";

import { 
  initToolMenu, 
  handleToolExecuted,
  handlePickedColor,
  handleBuildingConfigList,
} from "./menu/toolMenu.ts";

import { infoMenu, updateInfoCell } from "./menu/InfoMenu.ts";
import { GameHandlerData } from "./gameWorker.ts";
// import { GlobalState, initMenu, updatGlobalJSON } from "./gobalState.ts";
import { GridMapDrawers } from "../../IsoGame/mapIso/grid.ts";
import { initCanvaMouse, initKeyBoard } from "./keyboad.ts";
import { MessageHandler } from "./worker/messageHandler.ts";
import { MenuTab } from "./menu/headMenu.ts";
import { terrainMenuTab } from "./menu/terrainMenu.ts";
import { assetMenuTab, handleAssetGroups, handleAssetPreview, initAssetGroups } from "./menu/assetMenu.ts";
 
// ============================================================================
// CREATE WORKER
// ============================================================================


// initMenu();
// updatGlobalJSON(GlobalState);

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

const config_tag : MenuTab[] = [
    { id: "inspect",  icon: "👀", 
      params: [
        { id: "inspectInfo", type: "div", mount: (container) => {
            container.innerHTML = `
              <div id="infoCell">  
                <div class="inspect-empty">Hover over the map to see cell info...</div>
              </div>
            `; 
          }
        },
      ],

    },
    terrainMenuTab(gameWorker),
    { id: "color",  icon: "🎨",
        sub: [
        { id: "paint", icon: "🫟" ,
          params: [
            { id: "colorPicker", type: "color", default: "#ff0000" , 
              callback_change: (value) => {
                console.log("Color picker changed:", value);
                const [r, g, b] = (value as string).match(/\w\w/g)?.map(c => parseInt(c, 16)) || [255, 0, 0];
                gameWorker.postMessage({
                  action: "setColor",
                  r: r,g: g, b: b,
                });
              }
            }
          ],
          callback_select: () => {
            gameWorker.postMessage({action: "setActiveTool",toolId: "paint_color"});
          } },
        { id: "random", icon: "🎲" , 
          params: [
            { id: "brushStrength", type: "range", min: 0, max: 1, step: 0.01, default: 0.5, callback_change: () => {} },
          ],
          callback_select: () => {
            gameWorker.postMessage({action: "setActiveTool",toolId: "random_shade"});
          } },
      ],
      params: [
        { id: "brushSize", type: "range", min: 1, max: 10, default: 1, callback_change: (value) => {
            gameWorker.postMessage({
              action: "setBrushSize",
              size: value,
            });
          }
        },
      ]
     },
    flyMenuTab(gameWorker),
    assetMenuTab(gameWorker),
  ]


const menu = initHeadMenu({ tabs: config_tag, defaultIndex: 0 });

// Hide terrain, disable inspect, hide terrain's "smooth" sub
menu.updateDisplay([
  { 
    id: "terrain", display: "visible",
    sub: [
      { id: "raise_terrain", display: "visible" },
      { id: "lower_terrain", display: "visible" },
      { id: "flatten", display: "visible" },
      { id: "smooth", display: "visible" },
      { id: "plateau", display: "hidden" },
    ]
  },
  { 
    id: "color",
    sub: [
      { id: "random", display: "disabled" }
    ]
  },
  { id: "fly", display: "visible" },
]);

// Reset to defaults — call with empty array or re-pass full state
// menu.updateDisplay([]);

// Panels become: #section-tools, #section-layers, #section-paint

// initFlyMenu(gameWorker);
// initTerrainMenu(gameWorker);
// initToolMenu(gameWorker);
// infoMenu(gameWorker);

// ============================================================================
// == Event Handeler
// ============================================================================
const handlers = new MessageHandler(gameWorker);



// ============================================================================
// == INIT
// ============================================================================

// After The Game worker Initialiser . we cant send Shared Array
const callback_initWorker = (_data: GameHandlerData): void => {
  console.log("✅ Game Worker initialized!");
  initCanvaMouse(handlers, gameWorker);

  handlers.send({
    action: "initCanvasMap",
    mapConf: {
      DRAW_TILE_COUNT: 40,
      SCALE_SIZE: 1,
      SCALE_MOD: 1,
    },
  });
  /* CITY
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

  // gridMapDrawer = new GridMapDrawers(gameWorker, bufferMapLvl, bufferMapInfo);
  // gridMapDrawer.mod = mapconf.DRAW_TILE_COUNT / 40;
};


// ============================================================================
// == Interface Responce Handlers.
// ============================================================================

handlers.append([
  ["callback_initWorker", callback_initWorker],
  // ["callback_initCanvasMap", callback_initCanvasMap],
]);
handlers.send({ action: "initWorker" });
// handlers.send({ action: "initWorker" });

// ============================================================================
// == LOOP
// ============================================================================

let iFrame = 0;
let _shouldRun = true;

function frameTick() {
  /*
  if (gridMapDrawer) {
    gridMapDrawer.updateGrid();
  }
  */
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
  ["toolExecuted", (data) => {
    handleToolExecuted(data.toolId, data.success);
  }],
  ["pickedColor", (data) => {
    handlePickedColor(data.r, data.g, data.b);
  }],
  ["assetGroups", (data) => {
    initAssetGroups(gameWorker);
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
