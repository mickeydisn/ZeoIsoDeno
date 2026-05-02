import { flyMenuTab } from "./menu/sections/flyMenu.ts";
import { initHeadMenu } from "./menu/headMenu.ts";

/*
import { 
  initToolMenu, 
  handleToolExecuted,
  handlePickedColor,
  handleBuildingConfigList,
} from "./menu/toolMenu.ts";

import { infoMenu, updateInfoCell } from "./menu/InfoMenu.ts";
*/
import { GameHandlerData } from "./gameWorker.ts";
// import { GlobalState, initMenu, updatGlobalJSON } from "./gobalState.ts";
import { initCanvas, initKeyBoard } from "./main/keyboad.ts";
import { MessageHandler } from "./worker/messageHandler.ts";
import { MenuTab } from "./menu/headMenu.ts";
import { terrainMenuTab } from "./menu/sections/terrainMenu.ts";
import { assetMenuTab, handleAssetGroups, handleAssetPreview, initAssetGroups } from "./menu/sections/assetMenu.ts";
import { colorMenuTab } from "./menu/sections/colorMenu.ts";
import { buildingMenuTab } from "./menu/sections/buildingMenu.ts";
 
// ============================================================================
// CREATE WORKER
// ============================================================================

const gameWorker = new Worker(
  new URL("./gameWorker.ts", import.meta.url).href,
  { type: "module" } 
);
const handlers = new MessageHandler(gameWorker);

initKeyBoard(gameWorker);
initCanvas(handlers);

// ============================================================================
// == INIT
// ============================================================================

// After The Game worker Initialiser . we cant send Shared Array
const callback_initWorker = async (_data: GameHandlerData): Promise<void> => {
  console.log("✅ Game Worker initialized!");

  handlers.sendMessageWithResponse({
    action: "initCanvasMap",
    mapConf: {
      DRAW_TILE_COUNT: 10,
      SCALE_SIZE: 2,
      SCALE_MOD: 1,
    },
  });
  // CITY
  // 1200, 500
  
  handlers.send({
    action: "gridClick",
    x: 120,
    y: 50,
  });
  return ;
};



// ============================================================================
// ============================================================================
// == Menu
// ============================================================================


const config_tag : MenuTab[] = [
    flyMenuTab(gameWorker),
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
    colorMenuTab(gameWorker),
    assetMenuTab(gameWorker, handlers),
    buildingMenuTab(gameWorker),
  ]


const menu = initHeadMenu({ tabs: config_tag, defaultIndex: 1 });

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




// ============================================================================
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
// ============================================================================
// == Interface Responce Handlers.
// ============================================================================

handlers.append([
  ["FPS", (data) => {
    const fpsDisplay = document.getElementById("fps")!;
    fpsDisplay.textContent = `FPS: ${data.fps}`;
  }],
  ["infoCell", (data) => {
    // updateInfoCell(data);
  }],
  ["assetGroups", (data) => {
    initAssetGroups(gameWorker, handlers);
    handleAssetGroups(data.groups);
  }],
  ["assetPreview", (data) => {
    handleAssetPreview(data.blobUrl);
  }],
]);



// ============================================================================
// ============================================================================
// ============================================================================
// == Start Drawing and Worker Loop
// ============================================================================
await handlers.sendMessageWithResponse({ action: "initWorker" })
await callback_initWorker("")
handlers.send({ action: "startRender" });



startLoop();
