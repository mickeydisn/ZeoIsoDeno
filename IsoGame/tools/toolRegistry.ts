import { World } from "../word.ts";
import { terrainTools } from "./tiles/terrainTools.ts";
import { colorTools } from "./tiles/colorTools.ts";
import { assetTools } from "./tiles/assetTools.ts";
import { structureTools } from "./structureTools.ts";
import { potionTools } from "./tiles/potionTool.ts";
import { AnyToolAction, ToolContext } from "./type.ts";
import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";

export const TOOL_ACTION_REGISTRY = [
  ...terrainTools,
  ...colorTools,
  ...assetTools,
  ...structureTools,
  ...potionTools,
] as const;

export type RegistryToolAction = typeof TOOL_ACTION_REGISTRY[number];

export class ToolRegistry {
  private static instance: ToolRegistry;

  private ctx: ToolContext = {
    world: World.getInstance(),
  };

  /** Dispatch table built once from the registry */
  private index: Map<string, AnyToolAction> = new Map();

  private activeTool: AnyToolAction | null = null;
  private brushSize: number = 1;
  private activeColor: [number, number, number] = [128, 128, 128]; // Default gray
  private activeAssetId: string | null = null;

  // Potion state
  private activePotionId: string | null = null;

  // Building configuration state
  // private activeBuildingConfigId: string = "WcBuildConf_GraveA";
  private activeBuildingConfigId: string = "WcBuildConf_LabPipeA";
  // private activeBuildingConfigId: string = "WcBuildConf_GraveA";
  // private activeBuildingConfigId: string = "WcBuildConf_HouseA";

  private buildingGrowLoop: number = 20;

  public static getInstance(): ToolRegistry {
    return ToolRegistry.instance ??= new ToolRegistry();
  }

  initRegistry() {
    TOOL_ACTION_REGISTRY.forEach((tool) => {
      this.index.set(tool.key, tool as AnyToolAction);
    });
  }

  setActive(toolId: string): void {
    const tool = this.index.get(toolId);
    if (!tool) {
      this.activeTool = null;
    } else {
      this.activeTool = tool;
      this.brushSize = 1;
    }
  }

  getActive(): AnyToolAction | null {
    return this.activeTool;
  }

  // ----------------------------------------------

  getActiveId(): string | null {
    return this.activeTool?.key ?? null;
  }

  setBrushSize(size: number): void {
    this.brushSize = size;
  }

  getBrushSize(): number {
    return this.brushSize;
  }

  // ----------------------------------------------
  // ----------------------------------------------

  executeAt(
    x: number,
    y: number,
    _ctx: TGameHandlerContext,
  ): Record<string, unknown> | void {
    console.log(
      `Executing tool at (${x}, ${y}) with brush size ${this.brushSize}`,
    );
    if (this.activeTool) {
      return this.activeTool.execute(
        { x: x, y: y, brushSize: this.brushSize },
        _ctx,
      );
    }
  }
  // ----------------------------------------------

  setActiveColor(r: number, g: number, b: number): void {
    this.activeColor = [r, g, b];
  }

  getActiveColor(): [number, number, number] {
    return this.activeColor;
  }

  setActiveAssetId(assetId: string): void {
    this.activeAssetId = assetId;
  }

  getActiveAssetId(): string | null {
    return this.activeAssetId;
  }

  // ----------------------------------------------

  // Potion state methods
  setActivePotionId(potionId: string | null): void {
    this.activePotionId = potionId;
  }

  getActivePotionId(): string | null {
    return this.activePotionId;
  }

  // ----------------------------------------------

  // Building configuration methods
  setBuildingConfig(id: string): void {
    this.activeBuildingConfigId = id;
  }

  getBuildingConfigId(): string {
    return this.activeBuildingConfigId;
  }

  setBuildingParams(growLoop: number): void {
    this.buildingGrowLoop = growLoop;
  }

  getBuildingParams(): { growLoop: number } {
    return {
      growLoop: this.buildingGrowLoop,
    };
  }
}

export const toolRegistry = ToolRegistry.getInstance();
