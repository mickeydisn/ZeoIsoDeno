import { AbstractWcBuildConf } from "../wcBuilding2/AbstractBuildConf.ts";
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
  createConfig(options: { growLoopCount: number; endLoopMax: number }): AbstractWcBuildConf;
}

const buildingConfigRegistry: Map<string, BuildingConfigEntry> = new Map();

// Grave A
buildingConfigRegistry.set("grave_a", {
  id: "grave_a",
  name: "Grave",
  description: "A graveyard with fences, graves, and an altar. Features random color variations.",
  defaultGrowLoop: 20,
  defaultEndLoop: 100,
  createConfig: (options) => new WcBuildConf_GraveA(options),
});

// House A
buildingConfigRegistry.set("house_a", {
  id: "house_a",
  name: "House",
  description: "A simple house with walls, roof windows, and a door entrance.",
  defaultGrowLoop: 20,
  defaultEndLoop: 100,
  createConfig: (options) => new WcBuildConf_HouseA(options),
});

// Manor A
buildingConfigRegistry.set("manor_a", {
  id: "manor_a",
  name: "Manor",
  description: "A large manor building with complex interior and exterior features.",
  defaultGrowLoop: 30,
  defaultEndLoop: 200,
  createConfig: (options) => new WcBuildConf_ManorA(options),
});

// Lab Border A
buildingConfigRegistry.set("lab_border_a", {
  id: "lab_border_a",
  name: "Lab Border",
  description: "A laboratory border structure with technical wall panels.",
  defaultGrowLoop: 15,
  defaultEndLoop: 100,
  createConfig: (options) => new WcBuildConf_LabBorderA(options),
});

// Lab Pipe A
buildingConfigRegistry.set("lab_pipe_a", {
  id: "lab_pipe_a",
  name: "Lab Pipe",
  description: "A laboratory pipe network structure.",
  defaultGrowLoop: 25,
  defaultEndLoop: 150,
  createConfig: (options) => new WcBuildConf_LabPipeA(options),
});

// R Lab A
buildingConfigRegistry.set("r_lab_a", {
  id: "r_lab_a",
  name: "Research Lab",
  description: "A research laboratory with advanced technical features.",
  defaultGrowLoop: 25,
  defaultEndLoop: 150,
  createConfig: (options) => new WcBuildConf_RLabA(options),
});

/**
 * Returns a list of all available building configurations.
 */
export function getBuildingConfigList(): Array<{
  id: string;
  name: string;
  description: string;
  defaultGrowLoop: number;
  defaultEndLoop: number;
}> {
  return Array.from(buildingConfigRegistry.values()).map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    defaultGrowLoop: entry.defaultGrowLoop,
    defaultEndLoop: entry.defaultEndLoop,
  }));
}

/**
 * Creates a building configuration instance by id.
 * @param id The building config id
 * @param options Configuration options (growLoopCount, endLoopMax)
 * @returns The created AbstractWcBuildConf instance
 * @throws Error if config id not found
 */
export function createBuildingConfig(
  id: string,
  options: { growLoopCount: number; endLoopMax: number },
): AbstractWcBuildConf {
  const entry = buildingConfigRegistry.get(id);
  if (!entry) {
    throw new Error(`Building config not found: ${id}`);
  }
  return entry.createConfig(options);
}

/**
 * Gets a building config entry by id.
 * @param id The building config id
 * @returns The config entry or undefined if not found
 */
export function getBuildingConfigEntry(id: string): BuildingConfigEntry | undefined {
  return buildingConfigRegistry.get(id);
}