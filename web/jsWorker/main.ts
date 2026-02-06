import { GridMapDrawers } from "../../IsoGame/mapIso/grid.ts";
import { GlobalState, initMenu, updatGlobalJSON } from "../js/gobalState.ts";
import { MenuIconModule } from "../jsP/pallet/MenuIconModule.ts";




// initMenu();
// updatGlobalJSON(GlobalState);

// ----------------------------------------------------------------------------
// Init Header Menu
// ----------------------------------------------------------------------------
const editorMenu = new MenuIconModule({
  divId: "menu-icon-container"
});
editorMenu.addIcon('I', 'isogame-module', 'main-content');
editorMenu.addIcon('T', 'isometric-grid-container', 'main-content');
editorMenu.addIcon('S', 'sheet-editor-module', 'main-content');

editorMenu.addIcon('M', 'menu2', 'action-content');



// ============================================================================
// CREATE WORKER
// ============================================================================

const gameWorker = new Worker(
    new URL("./mainWorker.ts", import.meta.url).href,
    {
      type: "module",
    },
  );


// ============================================================================
// CREATE SHARE ELEMENT
// ============================================================================

// Canvas For display Map
const canvasImageMap = document.getElementById(
  "map-image",
) as HTMLCanvasElement;

let gridMapDrawer: GridMapDrawers | null = null;


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

/*
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
*/

// ============================================================================
// == Start Drawing and Worker Loop
// ============================================================================

startLoop();




// ============================================================================
// == Event Handeler
// ============================================================================

/*
MessageHandler.initialize(gameWorker)
  .registerCommands(AllCommandClasses);
*/
// Later, anywhere in your code:
// const handler = MessageHandler.getInstance();
// handler.send({ func: "myFunction", id: "tile-1", value: 42 });




// ============================================================================
// == Interface Responce Handlers.
// ============================================================================

/*
handlers.append([
  ["FPS", (data) => {
    const fpsDisplay = document.getElementById("fps")!;
    fpsDisplay.textContent = `FPS: ${data.fps}`;
  }],
  ["infoCell", (data) => {
    updateInfoCell(data);
  }],
]);
*/



/*
initKeyBoard(gameWorker);
initFlyMenu(gameWorker);
infoMenu(gameWorker);
*/
