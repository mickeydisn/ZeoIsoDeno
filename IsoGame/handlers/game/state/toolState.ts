import { AnyToolAction } from "@iso-game/handlers/game/tools/type.ts";

// ----------------------------------------------------------------------------
export class ToolState {
  private static instance: ToolState;
  public static getInstance(): ToolState {
    return ToolState.instance ??= new ToolState();
  }
  constructor() {}

  username: string = "mickey-test";

  /** Dispatch table built once from the registry */
  index: Map<string, AnyToolAction> = new Map();

  activeTool: AnyToolAction | null = null;

  brushSize: number = 1;
  activeColor: [number, number, number] = [128, 128, 128]; // Default gray
  activeAssetId: string | null = null;

  // Potion state
  activePotionId: string | null = null;

  // Building configuration state
  // activeBuildingConfigId: string = "WcBuildConf_GraveA";
  activeBuildingConfigId: string = "WcBuildConf_LabPipeA";
  // activeBuildingConfigId: string = "WcBuildConf_GraveA";
  // activeBuildingConfigId: string = "WcBuildConf_HouseA";

  buildingGrowLoop: number = 20;
}

export const toolState = ToolState.getInstance();
