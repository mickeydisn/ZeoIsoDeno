// Main thread (e.g., main.ts)
export const initFlyMenu = (gameWorker: Worker) => {
  (document.getElementById("mapflyMenu") as HTMLElement)
    .innerHTML = `
      <button id="mapflyMenu_Player">Player</button>
      <button id="mapflyMenu_Ground">Ground</button>
      <button id="mapflyMenu_Fly">Fly</button>
      <button id="mapflyMenu_Height">Height</button>
      <button id="mapflyMenu_Space">Space</button>
    `;

  (document.getElementById("mapflyMenu_Player") as HTMLElement)
    .addEventListener("click", () => {
      gameWorker.postMessage({
        action: "initCanvasMap",
        mapConf: {
          DRAW_TILE_COUNT: 40,
          SCALE_SIZE: 1.5,
          SCALE_MOD: 1,
        },
      });
    });

    (document.getElementById("mapflyMenu_Ground") as HTMLElement)
    .addEventListener("click", () => {
      gameWorker.postMessage({
        action: "initCanvasMap",
        mapConf: {
          DRAW_TILE_COUNT: 40,
          SCALE_SIZE: 1,
          SCALE_MOD: 1,
        },
      });
    });

  (document.getElementById("mapflyMenu_Fly") as HTMLElement)
    .addEventListener("click", () => {
      gameWorker.postMessage({
        action: "initCanvasMap",
        mapConf: {
          DRAW_TILE_COUNT: 80,
          SCALE_SIZE: 1 / 2,
          SCALE_MOD: 1,
        },
      });
    });

  (document.getElementById("mapflyMenu_Height") as HTMLElement)
    .addEventListener("click", () => {
      gameWorker.postMessage({
        action: "initCanvasMap",
        mapConf: {
          DRAW_TILE_COUNT: 100,
          SCALE_SIZE: .35,
          SCALE_MOD: 16,
        },
      });
    });
  (document.getElementById("mapflyMenu_Space") as HTMLElement)
    .addEventListener("click", () => {
      gameWorker.postMessage({
        action: "initCanvasMap",
        mapConf: {
          DRAW_TILE_COUNT: 100,
          SCALE_SIZE: .35,
          SCALE_MOD: 64,
        },
      });
    });
};
