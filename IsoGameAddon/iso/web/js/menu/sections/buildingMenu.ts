// Main thread (e.g., main.ts)

import { MenuTab } from "../headMenu.ts";

// ============================================================================
// GLOBAL
let growSizeValue: number = 20;
let gameWorker: Worker;


export const buildingMenuTab = (gameWorker: Worker) => {
  return { 
    id: "building",  
    icon: "🏡",
    sub: [
      { 
        id: "create", icon: "🏡" ,
        params: [
          { 
            id: "growSize", type: "range", min: 20, max: 1000, step: 10, default: growSizeValue, 
            callback_change: (value) => {
              growSizeValue = Number(value)
              gameWorker.postMessage({action: "setBuildingParams", growLoop: growSizeValue});
            }
          },
        ],
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: "place_building"});
        } 
      },
    ]
  } as MenuTab};


/*
raise_terrain
lower_terrain
flatten   
smooth
plateau
*/

