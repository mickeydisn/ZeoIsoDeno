import { World } from "../word.ts";

export interface MapTool {
  id: string;
  name: string;
  icon: string;
  category: "terrain" | "color" | "asset" | "structure" | "inspect";
  execute(x: number, y: number, brushSize: number, world: World): Record<string, unknown> | void;
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  
  private tools: Map<string, MapTool> = new Map();
  private activeTool: MapTool | null = null;
  private brushSize: number = 1;
  private activeColor: [number, number, number] = [128, 128, 128]; // Default gray
  private activeAssetId: string | null = null;

  public static getInstance(): ToolRegistry {
    return ToolRegistry.instance ??= new ToolRegistry();
  }

  register(tool: MapTool): void {
    this.tools.set(tool.id, tool);
  }

  setActive(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (tool) {
      this.activeTool = tool;
    }
  }

  getActive(): MapTool | null {
    return this.activeTool;
  }

  getActiveId(): string | null {
    return this.activeTool?.id ?? null;
  }

  setBrushSize(size: number): void {
    this.brushSize = size;
  }

  getBrushSize(): number {
    return this.brushSize;
  }

  getToolsByCategory(category: string): MapTool[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  getAllTools(): MapTool[] {
    return Array.from(this.tools.values());
  }

  getToolInfoList(): Array<{id: string; name: string; icon: string; category: string}> {
    return Array.from(this.tools.values()).map(tool => ({
      id: tool.id,
      name: tool.name,
      icon: tool.icon,
      category: tool.category,
    }));
  }

  executeAt(x: number, y: number, world: World): Record<string, unknown> | void {
    if (this.activeTool) {
      return this.activeTool.execute(x, y, this.brushSize, world);
    }
  }

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
}

export const toolRegistry = ToolRegistry.getInstance();