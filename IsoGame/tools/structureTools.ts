import { MapTool, toolRegistry } from "./toolRegistry.ts";
import { createBuildingConfig } from "./buildingConfigRegistry.ts";
import { WcBuildingFactoryGenarator } from "../wcBuilding2/wcBuildingFactory.ts";
import { World } from "../word.ts";

export const placeBuildingTool: MapTool = {
  id: "place_building",
  name: "Place Building",
  icon: "🏠",
  category: "structure",
  execute(x: number, y: number, _brushSize: number, world: World) {
    // Get current building config and params from registry
    const configId = toolRegistry.getBuildingConfigId();
    const params = toolRegistry.getBuildingParams();

    console.log(
      `Place Building: config=${configId}, growLoop=${params.growLoop}, endLoop=${params.endLoop}, pos=(${x}, ${y})`
    );

    // Create building configuration
    const buildingConf = createBuildingConfig(configId, {
      growLoopCount: params.growLoop,
      endLoopMax: params.endLoop,
    });

    if (!buildingConf) {
      console.error(`Failed to create building config: ${configId}`);
      return;
    }

    // Create and start building factory
    const buildingFactory = new WcBuildingFactoryGenarator(world, buildingConf);
    const success = buildingFactory.start2(x, y);

    if (success) {
      console.log(`Building placed successfully at (${x}, ${y})`);
    } else {
      console.error(`Failed to place building at (${x}, ${y})`);
    }

    return { success, configId, x, y };
  },
};

export const structureTools: MapTool[] = [
  placeBuildingTool,
];