import { FactoryMap } from "../../../../map/factory/factoryMap.ts";
import { toolRegistry } from "../toolRegistry.ts";

import { cmd } from "@iso-game/map/action/builder/cmd.ts";
import { TilesActions } from "@iso-game/map/action/tilesActions.ts";
import { defineTool, ToolConfigBrush } from "../type.ts";
import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";
const tilesActions = TilesActions.getInstance();

export const paintColorTool = defineTool<"paint_color", ToolConfigBrush>(
  "paint_color",
  "Paint Color",
  "🖌️",
  "color",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    const color = toolRegistry.getActiveColor();
    if (conf.brushSize <= 1) {
      tilesActions.doAction(cmd.color({ x: conf.x, y: conf.y, color: color }));
    } else {
      tilesActions.doAction(
        cmd.colorSquare({
          x: conf.x,
          y: conf.y,
          size: conf.brushSize,
          color: color,
        }),
      );
    }
  },
);

export const clearColorTool = defineTool<"clear_color", ToolConfigBrush>(
  "clear_color",
  "Clear Color",
  "🪣",
  "color",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    if (conf.brushSize <= 1) {
      tilesActions.doAction(cmd.clearColor({ x: conf.x, y: conf.y }));
    } else {
      tilesActions.doAction(
        cmd.clearColorSquare({ x: conf.x, y: conf.y, size: conf.brushSize }),
      );
    }
  },
);

export const smoothColorTool = defineTool<"smooth_color", ToolConfigBrush>(
  "smooth_color",
  "Smooth Color",
  "🌀",
  "color",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    if (conf.brushSize <= 1) {
      tilesActions.doAction(
        cmd.colorSmoothShape({ x: conf.x, y: conf.y, size: 1 }),
      );
    } else {
      tilesActions.doAction(
        cmd.colorSmoothShape({ x: conf.x, y: conf.y, size: conf.brushSize }),
      );
    }
  },
);

export const randomShadeTool = defineTool<"random_shade", ToolConfigBrush>(
  "random_shade",
  "Random Shade",
  "🎲",
  "color",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    const baseColor = toolRegistry.getActiveColor();
    // Apply random variation to the active color
    const variedColor = baseColor.map((c) =>
      Math.max(0, Math.min(255, Math.round(c + (Math.random() - 0.5) * 60)))
    ) as [number, number, number];

    if (conf.brushSize <= 1) {
      tilesActions.doAction(
        cmd.color({ x: conf.x, y: conf.y, color: variedColor }),
      );
    } else {
      tilesActions.doAction(
        cmd.colorSquare({
          x: conf.x,
          y: conf.y,
          size: conf.brushSize,
          color: variedColor,
        }),
      );
    }
  },
);

export const colorPickerTool = defineTool<"color_picker", ToolConfigBrush>(
  "color_picker",
  "Color Picker",
  "🎨",
  "color",
  (_conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    // Color picker doesn't execute on click - it uses the active color from registry
    // The actual painting is done by paintColorTool
    console.log(
      `Color Picker active with color: ${
        toolRegistry.getActiveColor().join(", ")
      }`,
    );
  },
);

export const eyedropperTool = defineTool<"eyedropper", ToolConfigBrush>(
  "eyedropper",
  "Eyedropper",
  "💉",
  "color",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    const color = FactoryMap.getInstance().getTileColor(conf.x, conf.y);
    if (color) {
      const [r, g, b] = color;
      toolRegistry.setActiveColor(r, g, b);
      return { pickedColor: [r, g, b] };
    }
  },
);

export const colorTools = [
  paintColorTool,
  clearColorTool,
  smoothColorTool,
  randomShadeTool,
  colorPickerTool,
  eyedropperTool,
];
