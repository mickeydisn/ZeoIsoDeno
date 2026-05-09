// Main thread (e.g., main.ts)

import { MenuTab } from "../headMenu.ts";

export const colorMenuTab = (gameWorker: Worker) => {
  return { 
    id: "color",  
    icon: "🎨",
    sub: [
      { 
        id: "paint", icon: "🫟" ,
        params: [
          { id: "colorPicker", type: "color", default: "#ff0000" , 
            callback_change: (value) => {
              console.log("Color picker changed:", value);
              const [r, g, b] = (value as string).match(/\w\w/g)?.map(c => parseInt(c, 16)) || [255, 0, 0];
              gameWorker.postMessage({
                action: "setColor",
                r: r,g: g, b: b,
              });
            }
          }
        ],
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: "paint_color"});
        } 
      },
      { 
        id: "paintClear", icon: "🪣" ,
        params: [],
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool", toolId: "clear_color"});
        } 
      },
      { 
        id: "ColorSmooth", icon: "🌀" ,
        params: [],
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool", toolId: "smooth_color"});
        } 
      },
      { 
        id: "ColorRandom", icon: "🎲" , 
        params: [
          { id: "brushStrength", type: "range", min: 0, max: 1, step: 0.01, default: 0.5, callback_change: () => {} },
        ],
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: "random_shade"});
        } },
      ],
      params: [
        { id: "brushSize", type: "range", min: 1, max: 10, default: 1, callback_change: (value) => {
            gameWorker.postMessage({
              action: "setBrushSize",
              size: value,
            });
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

