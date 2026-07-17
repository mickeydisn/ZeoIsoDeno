// Main thread (e.g., main.ts)

import { MenuTab } from "../headMenu.ts";

export const viewMenuTab = (gameWorker: Worker) => {
  // Current state (initial defaults match DEFAULT_ISO_CONFIG)
  let showIsFrise = true;
  let showIsBlock = true;
  let showTileBox = true;
  let showIsBuilding = true;

  return {
    id: "view",
    icon: "👁️",
    sub: [
      {
        id: "frise",
        icon: showIsFrise ? "🧱" : "⬜",
        callback_select: () => {
          showIsFrise = !showIsFrise;
          gameWorker.postMessage({
            action: "setIsoConfigLayer",
            showIsFrise: showIsFrise,
          });
          // Update the icon to reflect state
          // (the menu re-renders on next select)
        },
      },
      {
        id: "block",
        icon: showIsBlock ? "🚧" : "⬜",
        callback_select: () => {
          showIsBlock = !showIsBlock;
          gameWorker.postMessage({
            action: "setIsoConfigLayer",
            showIsBlock: showIsBlock,
          });
        },
      },
      {
        id: "tilebox",
        icon: showIsBlock ? "🔲" : "⬜",
        callback_select: () => {
          showTileBox = !showTileBox;
          gameWorker.postMessage({
            action: "setIsoConfigLayer",
            showTileBox: showTileBox,
          });
        },
      },
      {
        id: "isbuilding",
        icon: showIsBuilding ? "🏠" : "⬜",
        callback_select: () => {
          showIsBuilding = !showIsBuilding;
          gameWorker.postMessage({
            action: "setIsoConfigLayer",
            showIsBuilding: showIsBuilding,
          });
        },
      },
    ],
  } as MenuTab;
};
