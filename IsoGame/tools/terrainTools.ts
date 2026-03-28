import { TilesActions } from "../map/tileActions.ts";
import { FactoryMap } from "../map/factory/factoryMap.ts";
import { MapTool } from "./toolRegistry.ts";
import { World } from "../word.ts";

const tilesActions = TilesActions.getInstance();

export const raiseTerrainTool: MapTool = {
  id: "raise_terrain",
  name: "Raise Terrain",
  icon: "⬆️",
  category: "terrain",
  execute(x: number, y: number, brushSize: number, _world: World) {
    if (brushSize <= 1) {
      tilesActions.doAction({
        func: "lvlUp",
        x,
        y,
        lvl: 1,
      });
    } else {
      tilesActions.doAction({
        func: "lvlUpSquare",
        x,
        y,
        size: brushSize,
        lvl: 1,
      });
    }
  },
};

export const lowerTerrainTool: MapTool = {
  id: "lower_terrain",
  name: "Lower Terrain",
  icon: "⬇️",
  category: "terrain",
  execute(x: number, y: number, brushSize: number, _world: World) {
    if (brushSize <= 1) {
      tilesActions.doAction({
        func: "lvlUp",
        x,
        y,
        lvl: -1,
      });
    } else {
      tilesActions.doAction({
        func: "lvlUpSquare",
        x,
        y,
        size: brushSize,
        lvl: -1,
      });
    }
  },
};

export const flattenTool: MapTool = {
  id: "flatten",
  name: "Flatten",
  icon: "⏹️",
  category: "terrain",
  execute(x: number, y: number, brushSize: number, _world: World) {
    tilesActions.doAction({
      func: "lvlFlatSquare",
      x,
      y,
      size: brushSize,
    });
  },
};

export const smoothTool: MapTool = {
  id: "smooth",
  name: "Smooth",
  icon: "〰️",
  category: "terrain",
  execute(x: number, y: number, brushSize: number, _world: World) {
    tilesActions.doAction({
      func: "lvlAvgSquare",
      x,
      y,
      size: brushSize,
    });
  },
};

// Plateau tool uses two-click interaction
let plateauTargetLevel: number | null = null;
let plateauStartPos: { x: number; y: number } | null = null;

export const plateauTool: MapTool = {
  id: "plateau",
  name: "Plateau",
  icon: "🏔️",
  category: "terrain",
  execute(x: number, y: number, brushSize: number, _world: World) {
    const fm = FactoryMap.getInstance();
    if (plateauTargetLevel === null) {
      // First click: store target level
      const tile = fm.getTile(x, y);
      plateauTargetLevel = tile.lvl;
      plateauStartPos = { x, y };
      console.log(`Plateau: Target level set to ${plateauTargetLevel}`);
    } else {
      // Second click: flatten to target level
      tilesActions.doAction({
        func: "lvlFlatSquare",
        x,
        y,
        size: brushSize,
      });
      // Then set all tiles in area to target level
      tilesActions.doAction({
        func: "lvlUpSquare",
        x,
        y,
        size: brushSize,
        lvl: plateauTargetLevel - fm.getTile(x, y).lvl,
      });
      console.log(`Plateau: Flattened to level ${plateauTargetLevel}`);
      // Reset state
      plateauTargetLevel = null;
      plateauStartPos = null;
    }
  },
};

export function resetPlateauState() {
  plateauTargetLevel = null;
  plateauStartPos = null;
}

export const terrainTools: MapTool[] = [
  raiseTerrainTool,
  lowerTerrainTool,
  flattenTool,
  smoothTool,
  plateauTool,
];