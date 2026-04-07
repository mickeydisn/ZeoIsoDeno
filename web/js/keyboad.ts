import { MessageHandler } from "./worker/messageHandler.ts";

const keyCheck: Record<string, boolean> = {};
const keyBind = {
  up: ["ArrowUp", "z"],
  down: ["ArrowDown", "s"],
  left: ["ArrowLeft", "q"],
  right: ["ArrowRight", "d"],
};

// Main thread (e.g., main.ts)
export const initKeyBoard = (gameWorker: Worker) => {
  // Listen to keyboard input
  globalThis.addEventListener("keydown", (event) => {
    keyCheck[event.key] = true;
  });

  globalThis.addEventListener("keyup", (event) => {
    keyCheck[event.key] = false;
  });

  // Update player position based on input
  function updatePlayerPosition() {
    const playerMovement = {
      up: keyBind.up.map((k) => keyCheck[k]).includes(true),
      down: keyBind.down.map((k) => keyCheck[k]).includes(true),
      left: keyBind.left.map((k) => keyCheck[k]).includes(true),
      right: keyBind.right.map((k) => keyCheck[k]).includes(true),
    };

    // Send the updated player position to the worker (GameWorker)
    gameWorker.postMessage({ action: "updatePlayerMovement", playerMovement });
  }

  // Call the update loop
  setInterval(updatePlayerPosition, 16); // Update at ~60 FPS
};


/* */
// ============================================================================
// CREATE SHARE ELEMENT
// ============================================================================
// Main thread (e.g., main.ts)
export const initCanvaMouse = (handlers: MessageHandler,  gameWorker: Worker) => {

  
  // Canvas For display Map
  const canvasImageMap = document.getElementById(
    "map-image",
  ) as HTMLCanvasElement;


  // Mouse tracking - send raw coordinates to worker
  canvasImageMap.addEventListener('mousemove', (e) => {
    const rect = canvasImageMap.getBoundingClientRect();
    handlers.send({
      action: "mouseMove",
      x: Math.floor(e.clientX - rect.left),
      y: Math.floor(e.clientY - rect.top)
    });
  });

  // Mouse tracking - send raw coordinates to worker
  canvasImageMap.addEventListener('click', (e) => {
    const rect = canvasImageMap.getBoundingClientRect();
    console.log("Mouse Click");
    handlers.send({
      action: "mouseClick",
      x: Math.floor(e.clientX - rect.left),
      y: Math.floor(e.clientY - rect.top)
    });
  });

  const offscreen = canvasImageMap.transferControlToOffscreen();

  handlers.sendDataSync({
    action: "setCanvasMap",
    canvas: offscreen,
  }, [
    offscreen,
  ]);


};
