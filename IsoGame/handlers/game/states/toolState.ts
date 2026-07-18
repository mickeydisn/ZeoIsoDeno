import { AnyToolAction } from "@iso-game/tools/type.ts";
import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";
import { TOOL_ACTION_REGISTRY } from "@iso-game/tools/register.ts";

export class ToolState {
  tileStates!: ToolStateTile;
  assetStates!: ToolStateAsset;
  potionStates!: ToolStatePotion;
  buildingStates!: ToolStateBuilding;

  constructor(TOOL_ACTION_REGISTRY: AnyToolAction[]) {
    this.initRegistry(TOOL_ACTION_REGISTRY);

    this.tileStates = new ToolStateTile();
    this.assetStates = new ToolStateAsset();
    this.potionStates = new ToolStatePotion();
    this.buildingStates = new ToolStateBuilding();
  }

  private index: Map<string, AnyToolAction> = new Map();
  private activeTool: AnyToolAction | null = null;

  initRegistry(TOOL_ACTION_REGISTRY: AnyToolAction[]) {
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
    }
  }

  getActive(): AnyToolAction | null {
    return this.activeTool;
  }

  // ----------------------------------------------
  getActiveId(): string | null {
    return this.activeTool?.key ?? null;
  }

  executeAt(
    x: number,
    y: number,
    _ctx: TGameHandlerContext,
  ): Record<string, unknown> | void {
    console.log(
      `Executing tool at (${x}, ${y}) `,
    );
    if (this.activeTool) {
      return this.activeTool.execute({ x: x, y: y }, _ctx);
    }
  }
}

export class ToolStateTile {
  private brushSize: number = 1;
  private activeColor: [number, number, number] = [128, 128, 128]; // Default gray

  setBrushSize(size: number): void {
    this.brushSize = size;
  }

  getBrushSize(): number {
    return this.brushSize;
  }

  setActiveColor(r: number, g: number, b: number): void {
    this.activeColor = [r, g, b];
  }

  getActiveColor(): [number, number, number] {
    return this.activeColor;
  }
}

export class ToolStateAsset {
  private activeAssetId: string | null = null;

  setActiveAssetId(assetId: string): void {
    this.activeAssetId = assetId;
  }

  getActiveAssetId(): string | null {
    return this.activeAssetId;
  }
}

export class ToolStatePotion {
  private activePotionId: string | null = null;

  setActivePotionId(potionId: string | null): void {
    this.activePotionId = potionId;
  }

  getActivePotionId(): string | null {
    return this.activePotionId;
  }
}

export class ToolStateBuilding {
  private activeBuildingConfigId: string = "WcBuildConf_LabPipeA";
  private buildingGrowLoop: number = 20;

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
