import { MapTool, toolRegistry } from "./toolRegistry.ts";
import { World } from "../word.ts";
import { createBuildingConfig } from "./buildingConfigRegistry.ts";
import { WcBuildFactoryGenarator } from "../wcBuilding2/wcBuildFactory.ts";
import { WcBuildActions } from "../wcBuilding2/wcBuildAction.ts";
import { createTool } from "./toolBuilder.ts";

/**
 * Place Building Tool
 * Generates a building structure at the clicked position using the active building configuration.
 * Building type and parameters can be configured via the building config registry and tool registry.
 */
export const placeBuildingTool = createTool({
  id: "place_building",
  name: "Place Building",
  icon: "🏠",
  category: "structure",
  execute(x: number, y: number, _brushSize: number, world: World) {
    // Get current building configuration from tool registry
    const configId = toolRegistry.getBuildingConfigId();
    const params = toolRegistry.getBuildingParams();

    console.log(
      `Place Building: config=${configId}, growLoop=${params.growLoop}, endLoop=${params.endLoop}, pos=(${x}, ${y})`,
    );

    WcBuildActions.getInstance().doAction({
      func: "createBuilding",
      x: x,
      y: y,
      buildingType: configId,
      growLoopCount: params.growLoop ? params.growLoop : 50,
      endLoopMax: params.endLoop ? params.endLoop : 2000,
    });

    /*

    // Create building configuration using registry
    const buildingConf = createBuildingConfig(configId, {
      growLoopCount: params.growLoop,
      endLoopMax: params.endLoop,
    });


    if (!buildingConf) {
      console.error(`Failed to create building config: ${configId}`);
      return;
    }

    // Create and start building generator
    const generator = new WcBuildFactoryGenarator(world, buildingConf);
    const success = generator.start2(x, y);

    if (success) {
      console.log(`Building placed successfully at (${x}, ${y})`);
    } else {
      console.error(`Failed to place building at (${x}, ${y})`);
    }
    return { success, configId, x, y };
    */

  },
});

/**
 * Export all structure tools for registration
 */
export const structureTools: MapTool[] = [
  placeBuildingTool,
];