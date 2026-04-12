// Main thread (e.g., main.ts)

import { MenuTab } from "../headMenu.ts";

export const flyMenuTab = (gameWorker: Worker) => {
  return {   
    id: "fly",
    icon: "🗺️",
      sub: [
        { 
        id: "player", 
        icon: "🧍", 
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: ""});
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              DRAW_TILE_COUNT: 40,
              SCALE_SIZE: 1.2,
              SCALE_MOD: 1,
            },
          });
        } 
      },
      { 
        id: "ground",
        icon: "🧚🏻‍♀️",
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: ""});
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              DRAW_TILE_COUNT: 40,
              SCALE_SIZE: .9,
              SCALE_MOD: 1,
            },
          });
        }
      },
      { 
        id: "ground",
        icon: "🧚🏻‍♀️",
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: ""});
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              DRAW_TILE_COUNT: 80,
              SCALE_SIZE: .5,
              SCALE_MOD: 1,
            },
          });
        }
      },
      { 
        id: "fly",
        icon: "✈️",
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: ""});
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              DRAW_TILE_COUNT: 100,
              SCALE_SIZE: .35,
              SCALE_MOD: 16,
            },
          });
        }
      },
      { 
        id: "space",
        icon: "🚀",
        callback_select: () => {
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              DRAW_TILE_COUNT: 100,
              SCALE_SIZE: .35,
              SCALE_MOD: 64,
            },
          });
        }
      },
    ],
  } as MenuTab};
