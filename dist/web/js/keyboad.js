// web/js/keyboad.ts
var keyCheck = {};
var keyBind = {
  up: ["ArrowUp", "z"],
  down: ["ArrowDown", "s"],
  left: ["ArrowLeft", "q"],
  right: ["ArrowRight", "d"]
};
var initKeyBoard = (gameWorker) => {
  window.addEventListener("keydown", (event) => {
    keyCheck[event.key] = true;
  });
  window.addEventListener("keyup", (event) => {
    keyCheck[event.key] = false;
  });
  function updatePlayerPosition() {
    const playerMovement = {
      up: keyBind.up.map((k) => keyCheck[k]).includes(true),
      down: keyBind.down.map((k) => keyCheck[k]).includes(true),
      left: keyBind.left.map((k) => keyCheck[k]).includes(true),
      right: keyBind.right.map((k) => keyCheck[k]).includes(true)
    };
    gameWorker.postMessage({ action: "updatePlayerMovement", playerMovement });
  }
  setInterval(updatePlayerPosition, 16);
};
export {
  initKeyBoard
};
