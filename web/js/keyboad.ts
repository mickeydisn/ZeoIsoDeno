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
  window.addEventListener("keydown", (event) => {
    keyCheck[event.key] = true;
  });

  window.addEventListener("keyup", (event) => {
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
