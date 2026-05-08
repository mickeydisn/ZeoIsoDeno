import { defineTool, ToolConfigBrush, ToolContext } from "./type.ts";
import { toolRegistry } from "./toolRegistry.ts";
import { WcBuildActions } from "../wcBuilding2/wcBuildAction.ts";

/**
 * Place Building Tool
 * Generates a building structure at the clicked position using the active building configuration.
 * Building type and parameters can be configured via the building config registry and tool registry.
 */
export const placeBuildingTool = defineTool<"place_building", ToolConfigBrush>(
  "place_building",
  "Place Building",
  "🏠",
  "structure",
  (conf: ToolConfigBrush, _ctx: ToolContext) => {
    // Get current building configuration from tool registry
    const configId = toolRegistry.getBuildingConfigId();
    const params = toolRegistry.getBuildingParams();

    console.log(
      `Place Building: config=${configId}, growLoop=${params.growLoop}, pos=(${conf.x}, ${conf.y})`,
    );

    WcBuildActions.getInstance().doAction({
      func: "createBuilding",
      x: conf.x,
      y: conf.y,
      buildingType: configId,
      growLoopCount: params.growLoop ? params.growLoop : 50,
      endLoopMax: 2000,
    });

  },
);

/**
 * Export all structure tools for registration
 */
export const structureTools = [
  placeBuildingTool,
];