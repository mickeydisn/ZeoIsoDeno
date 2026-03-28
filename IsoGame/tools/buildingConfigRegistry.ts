import { WcAbstractBuildConf } from "../wcBuilding2/wcAbstractBuildConf.ts";
import { WcBuildConf_GraveA } from "../wcBuilding2/conf/buildConf_GraveA.ts";
import { WcBuildConf_HouseA } from "../wcBuilding2/conf/buildConf_HouseA.ts";
import { WcBuildConf_ManorA } from "../wcBuilding2/conf/buildConf_ManorA.ts";
import { WcBuildConf_LabBorderA } from "../wcBuilding2/conf/buildConf_LabBorderA.ts";
import { WcBuildConf_LabPipeA } from "../wcBuilding2/conf/buildConf_LabPipeA.ts";
import { WcBuildConf_RLabA } from "../wcBuilding2/conf/buildConf_RLabA.ts";

export interface BuildingConfigEntry {
  id: string;
  name: string;
  description: string;
  defaultGrowLoop: number;
  defaultEndLoop: number;
  createConfig(options: { growLoopCount: number; endLoopMax: number }): WcAbstractBuildConf;
}

export interface BuildingConfigInfo {
  id: string;
  name: string;
  description: string;
  defaultGrowLoop: number;
  defaultEndLoop: number;
}

const buildingConfigRegistry: Map<string, BuildingConfigEntry> = new Map();

// Register all building configurations
buildingConfigRegistry.set("grave_a", {
  id: "grave_a",
  name: "Graveyard",
  description: "A fenced graveyard with tombstones, bones, and an altar. Features organic growth patterns with fence segments and inner grave areas.",
  defaultGrowLoop: 20,
  defaultEndLoop: 100,
  createConfig: (options) => new WcBuildConf_GraveA(options),
});

buildingConfigRegistry.set("house_a", {
  id: "house_a",
  name: "House",
  description: "A simple house structure with walls, roof, windows, and a door. Features fence perimeter and platform areas.",
  defaultGrowLoop: 20,
  defaultEndLoop: 100,
  createConfig: (options) => new WcBuildConf_HouseA(options),
});

buildingConfigRegistry.set("manor_a", {
  id: "manor_a",
  name: "Manor",
  description: "An elegant manor building with multiple rooms and decorative elements. Larger and more complex than a standard house.",
  defaultGrowLoop: 30,
  defaultEndLoop: 150,
  createConfig: (options) => new WcBuildConf_ManorA(options),
});

buildingConfigRegistry.set("lab_border_a", {
  id: "lab_border_a",
  name: "Lab Border",
  description: "A laboratory border structure with walls and entrances. Used to define laboratory perimeters.",
  defaultGrowLoop: 15,
  defaultEndLoop: 80,
  createConfig: (options) => new WcBuildConf_LabBorderA(options),
});

buildingConfigRegistry.set("lab_pipe_a", {
  id: "lab_pipe_a",
  name: "Lab Pipe",
  description: "A laboratory pipe structure with connections and junctions. Used for creating pipe networks within laboratories.",
  defaultGrowLoop: 25,
  defaultEndLoop: 120,
  createConfig: (options) => new WcBuildConf_LabPipeA(options),
});

buildingConfigRegistry.set("r_lab_a", {
  id: "r_lab_a",
  name: "Research Lab",
  description: "A research laboratory with equipment areas and specialized rooms. Advanced structure for scientific facilities.",
  defaultGrowLoop: 35,
  defaultEndLoop: 200,
  createConfig: (options) => new WcBuildConf_RLabA(options),
});

/**
 * Get list of all available building configurations
 * @returns Array of building config info (id, name, description, defaults)
 */
export function getBuildingConfigList(): BuildingConfigInfo[] {
  return Array.from(buildingConfigRegistry.values()).map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    defaultGrowLoop: entry.defaultGrowLoop,
    defaultEndLoop: entry.defaultEndLoop,
  }));
}

/**
 * Create a building configuration instance by ID
 * @param id The building config ID
 * @param options Configuration options (growLoopCount, endLoopMax)
 * @returns The building configuration instance, or null if not found
 */
export function createBuildingConfig(
  id: string,
  options: { growLoopCount: number; endLoopMax: number },
): WcAbstractBuildConf | null {
  const entry = buildingConfigRegistry.get(id);
  if (!entry) {
    console.error(`Building config not found: ${id}`);
    return null;
  }
  return entry.createConfig(options);
}

/**
 * Get a building config entry by ID
 * @param id The building config ID
 * @returns The building config entry, or undefined if not found
 */
export function getBuildingConfigEntry(id: string): BuildingConfigEntry | undefined {
  return buildingConfigRegistry.get(id);
}

/**
 * Check if a building config ID exists
 * @param id The building config ID
 * @returns True if the config exists
 */
export function hasBuildingConfig(id: string): boolean {
  return buildingConfigRegistry.has(id);
}