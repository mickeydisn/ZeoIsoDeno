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
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 30,
              mapGridTileScale: 1.6,
              mapGridMod: 1,
            },
          });
        },
      },
      {
        id: "ground",
        icon: "🧚🏻‍♀️",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 30,
              mapGridTileScale: 1.2,
              mapGridMod: 1,
            },
          });
        },
      },
      {
        id: "ground",
        icon: "🧚🏻‍♀️",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 40,
              mapGridTileScale: .9,
              mapGridMod: 1,
            },
          });
        },
      },
      {
        id: "ground",
        icon: "🧚🏻‍♀️",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 50,
              mapGridTileScale: .7,
              mapGridMod: 1,
            },
          });
        },
      },
      {
        id: "fly",
        icon: "✈️",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 60,
              mapGridTileScale: .6,
              mapGridMod: 1,
            },
          });
        },
      },
      {
        id: "fly",
        icon: "✈️",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 80,
              mapGridTileScale: .5,
              mapGridMod: 1,
            },
          });
        },
      },
      {
        id: "fly",
        icon: "✈️",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 100,
              mapGridTileScale: .3,
              mapGridMod: 1,
            },
          });
        },
      },
      {
        id: "fly",
        icon: "🚀",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 100,
              mapGridTileScale: .35,
              mapGridMod: 2,
            },
          });
        },
      },
      {
        id: "fly",
        icon: "🚀",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 100,
              mapGridTileScale: .35,
              mapGridMod: 4,
            },
          });
        },
      },
      {
        id: "fly",
        icon: "🚀",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 100,
              mapGridTileScale: .35,
              mapGridMod: 8,
            },
          });
        },
      },
      {
        id: "fly",
        icon: "🚀",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "" });
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 100,
              mapGridTileScale: .35,
              mapGridMod: 16,
            },
          });
        },
      },
      {
        id: "space",
        icon: "🛰️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 100,
              mapGridTileScale: .35,
              mapGridMod: 32,
            },
          });
        },
      },
      {
        id: "space",
        icon: "🛰️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 100,
              mapGridTileScale: .35,
              mapGridMod: 48,
            },
          });
        },
      },
      {
        id: "space",
        icon: "🛰️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 100,
              mapGridTileScale: .35,
              mapGridMod: 64,
            },
          });
        },
      },
      {
        id: "space",
        icon: "🛰️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "initCanvasMap",
            mapConf: {
              mapGridSize: 100,
              mapGridTileScale: .35,
              mapGridMod: 128,
            },
          });
        },
      },
    ],
  } as MenuTab;
};
