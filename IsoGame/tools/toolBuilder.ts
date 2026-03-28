import { MapTool } from "./toolRegistry.ts";
import { World } from "../word.ts";

interface ToolConfig {
  id: string;
  name: string;
  icon: string;
  category: MapTool["category"];
  execute: (x: number, y: number, brushSize: number, world: World) => Record<string, unknown> | void;
}

/**
 * Creates a MapTool from a configuration object.
 * Reduces boilerplate in tool definition files.
 */
export function createTool(config: ToolConfig): MapTool {
  return {
    id: config.id,
    name: config.name,
    icon: config.icon,
    category: config.category,
    execute: config.execute,
  };
}

/**
 * Creates an array of MapTools from multiple configurations.
 * Provides cleaner syntax for exporting tool arrays.
 */
export function createToolArray(...tools: MapTool[]): MapTool[] {
  return tools;
}