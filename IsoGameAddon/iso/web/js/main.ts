import { flyMenuTab } from "./menu/sections/flyMenu.ts";
import { initHeadMenu } from "./menu/headMenu.ts";

import { initCanvas, initKeyBoard } from "./main/keyboad.ts";
import { MenuTab } from "./menu/headMenu.ts";
import { terrainMenuTab } from "./menu/sections/terrainMenu.ts";
import { assetMenuTab } from "./menu/sections/assetMenu.ts";
import { colorMenuTab } from "./menu/sections/colorMenu.ts";
import { buildingMenuTab } from "./menu/sections/buildingMenu.ts";
import { potionMenuTab } from "./menu/sections/potionMenu.ts";
import { viewMenuTab } from "./menu/sections/viewMenu.ts";
import {
  indexScreenHandler,
  ScreenMessageHandler,
} from "../../../../IsoGame/handlers/handlers.ts";

// ============================================================================
// CREATE WORKER
// ============================================================================

const gameWorker = new Worker(
  new URL("./gameWorker.ts", import.meta.url).href,
  { type: "module" },
);
const handler = new ScreenMessageHandler({
  tag: "screen",
  worker: gameWorker,
}, indexScreenHandler);

initKeyBoard(gameWorker);
initCanvas(handler);

// ============================================================================
// == INIT
// ============================================================================

// After The Game worker Initialiser . we cant send Shared Array
const callback_initWorker = (_data: any) => {
  console.log("✅ Game Worker initialized!");

  handler.sendMessageWithResponse({
    action: "initCanvasMap",
    mapConf: {
      mapGridSize: 30,
      mapGridTileScale: 1.5,
      mapGridMod: 1,
    },
  });
  // CITY
  // 1200, 500
  /*
  handlers.send({
    action: "gridClick",
    x: 120,
    y: 50,
  });
  */
};

// ============================================================================
// ============================================================================
// == Menu
// ============================================================================

const config_tag: MenuTab[] = [
  flyMenuTab(gameWorker),
  {
    id: "inspect",
    icon: "👀",
    params: [
      {
        id: "inspectInfo",
        type: "div",
        mount: (container) => {
          container.innerHTML = `
              <div id="infoCell">  
                <div class="inspect-empty">Hover over the map to see cell info...</div>
              </div>
            `;
        },
      },
    ],
  },
  terrainMenuTab(gameWorker),
  colorMenuTab(gameWorker),
  assetMenuTab(gameWorker, handler),
  buildingMenuTab(gameWorker, handler),
  potionMenuTab(gameWorker),
  viewMenuTab(gameWorker),
];

const menu = initHeadMenu(gameWorker, { tabs: config_tag, defaultIndex: 1 });

// Hide terrain, disable inspect, hide terrain's "smooth" sub
menu.updateDisplay([
  {
    id: "terrain",
    display: "visible",
    sub: [
      { id: "raise_terrain", display: "visible" },
      { id: "lower_terrain", display: "visible" },
      { id: "flatten", display: "visible" },
      { id: "smooth", display: "visible" },
      { id: "plateau", display: "hidden" },
    ],
  },
  {
    id: "color",
    sub: [
      { id: "random", display: "disabled" },
    ],
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
    handler.send({ action: "startRender" });
    startLoop();
  } else {
    handler.send({ action: "stopRender" });
    stopLoop();
  }
});

// ============================================================================
// ============================================================================
// ============================================================================
// == Start Drawing and Worker Loop
// ============================================================================
await handler.sendMessageWithResponse({ action: "initWorker" });
await callback_initWorker("");
handler.send({ action: "startRender" });

startLoop();
