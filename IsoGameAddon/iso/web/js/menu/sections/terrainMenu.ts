// Main thread (e.g., main.ts)

import { MenuTab } from "../headMenu.ts";

export const terrainMenuTab = (gameWorker: Worker) => {
  return {
    id: "terrain",
    icon: "⛰️",
    sub: [
      {
        id: "raise_terrain",
        icon: "⬆️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "setActiveTool",
            toolId: "raise_terrain",
          });
        },
      },
      {
        id: "lower_terrain",
        icon: "⬇️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "setActiveTool",
            toolId: "lower_terrain",
          });
        },
      },

      {
        id: "byStep",
        icon: "📶",
        callback_select: () => {
          gameWorker.postMessage({
            action: "setActiveTool",
            toolId: "lvlByStep",
          });
        },
      },
      {
        id: "flatten",
        icon: "⏹️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "setActiveTool",
            toolId: "flatten",
          });
        },
      },
      {
        id: "smooth",
        icon: "↔️",
        callback_select: () => {
          gameWorker.postMessage({ action: "setActiveTool", toolId: "smooth" });
        },
      },
      {
        id: "plateau",
        icon: "↕️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "setActiveTool",
            toolId: "plateau",
          });
        },
      },
      {
        id: "frise_layer",
        icon: "❄️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "setActiveTool",
            toolId: "frise_layer",
          });
        },
      },
      {
        id: "unfrise_layer",
        icon: "☀️",
        callback_select: () => {
          gameWorker.postMessage({
            action: "setActiveTool",
            toolId: "unfrise_layer",
          });
        },
      },

      {
        id: "block_layer",
        icon: "❌",
        callback_select: () => {
          gameWorker.postMessage({
            action: "setActiveTool",
            toolId: "block_layer",
          });
        },
      },
      {
        id: "unblock_layer",
        icon: "❎",
        callback_select: () => {
          gameWorker.postMessage({
            action: "setActiveTool",
            toolId: "unblock_layer",
          });
        },
      },
    ],
    params: [
      {
        id: "brushSize",
        type: "range",
        min: 1,
        max: 21,
        step: 1,
        default: 1,
        callback_change: (value) => {
          gameWorker.postMessage({
            action: "setBrushSize",
            size: value,
          });
        },
      },
    ],
  } as MenuTab;
};

/*
raise_terrain
lower_terrain
flatten
smooth
plateau
*/
