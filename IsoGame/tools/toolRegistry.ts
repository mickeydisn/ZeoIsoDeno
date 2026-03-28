import { World } from "../word.ts";

export interface MapTool {
  id: string;
  name: string;
  icon: string;
  category: "terrain" | "color" | "asset" | "structure" | "inspect";
  execute(x: number, y: number, brushSize: number, world: World): void;
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  
  private tools: Map<string, MapTool> = new Map();
  private activeTool: MapTool | null = null;
  private brushSize: number = 1;
  private activeColor: [number, number, number] = [128, 128, 128]; // Default gray

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

  executeAt(x: number, y: number, world: World): void {
    if (this.activeTool) {
      this.activeTool.execute(x, y, this.brushSize, world);
    }
  }

  setActiveColor(r: number, g: number, b: number): void {
    this.activeColor = [r, g, b];
  }

  getActiveColor(): [number, number, number] {
    return this.activeColor;
  }
}

export const toolRegistry = ToolRegistry.getInstance();