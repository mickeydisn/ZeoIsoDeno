import { TilesActions } from "../map/action/tileActions.ts";
import { FactoryMap } from "../map/factory/factoryMap.ts";
import { MapTool, toolRegistry } from "./toolRegistry.ts";
import { World } from "../word.ts";
import { createTool } from "./toolBuilder.ts";

const tilesActions = TilesActions.getInstance();

export const colorPickerTool = createTool({
  id: "color_picker",
  name: "Color Picker",
  icon: "🎨",
  category: "color",
  execute(_x: number, _y: number, _brushSize: number, _world: World) {
    // Color picker doesn't execute on click - it uses the active color from registry
    // The actual painting is done by paintColorTool
    console.log(`Color Picker active with color: ${toolRegistry.getActiveColor().join(", ")}`);
  },
});

export const paintColorTool = createTool({
  id: "paint_color",
  name: "Paint Color",
  icon: "🖌️",
  category: "color",
  execute(x: number, y: number, brushSize: number, _world: World) {
    const color = toolRegistry.getActiveColor();
    tilesActions.doAction({
      func: "colorSquare",
      x,
      y,
      size: brushSize,
      color: color,
    });
  },
});

export const eyedropperTool = createTool({
  id: "eyedropper",
  name: "Eyedropper",
  icon: "💉",
  category: "color",
  execute(x: number, y: number, _brushSize: number, _world: World) {
    const color = FactoryMap.getInstance().getTileColor(x, y);
    if (color) {
      const [r, g, b] = color;
      toolRegistry.setActiveColor(r, g, b);
      return { pickedColor: [r, g, b] };
    }
  },
});

export const randomShadeTool = createTool({
  id: "random_shade",
  name: "Random Shade",
  icon: "🎲",
  category: "color",
  execute(x: number, y: number, brushSize: number, _world: World) {
    const baseColor = toolRegistry.getActiveColor();
    // Apply random variation to the active color
    const variedColor = baseColor.map(c => 
      Math.max(0, Math.min(255, Math.round(c + (Math.random() - 0.5) * 60)))
    ) as [number, number, number];
    
    tilesActions.doAction({
      func: "colorSquare",
      x,
      y,
      size: brushSize,
      color: variedColor,
    });
  },
});

export const colorTools: MapTool[] = [
  colorPickerTool,
  paintColorTool,
  eyedropperTool,
  randomShadeTool,
];