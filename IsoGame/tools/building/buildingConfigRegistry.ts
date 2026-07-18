import { WcAbstractBuildConf } from "@iso-game/map/generator/wcBuilding2/wcAbstractBuildConf.ts";
import { WcBuildConf_GraveA } from "@iso-game/map/generator/wcBuilding2/conf/buildConf_GraveA.ts";
import { WcBuildConf_HouseA } from "@iso-game/map/generator/wcBuilding2/conf/buildConf_HouseA.ts";
import { WcBuildConf_ManorA } from "@iso-game/map/generator/wcBuilding2/conf/buildConf_ManorA.ts";
import { WcBuildConf_LabBorderA } from "@iso-game/map/generator/wcBuilding2/conf/buildConf_LabBorderA.ts";
import { WcBuildConf_LabPipeA } from "@iso-game/map/generator/wcBuilding2/conf/buildConf_LabPipeA.ts";
import { WcBuildConf_RLabA } from "@iso-game/map/generator/wcBuilding2/conf/buildConf_RLabA.ts";

export interface BuildingConfigEntry {
  id: string;
  name: string;
  description: string;
  defaultGrowLoop: number;
  defaultEndLoop: number;
  createConfig(
    options: { growLoopCount: number; endLoopMax: number },
  ): WcAbstractBuildConf;
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
  description:
    "A fenced graveyard with tombstones, bones, and an altar. Features organic growth patterns with fence segments and inner grave areas.",
  defaultGrowLoop: 20,
  defaultEndLoop: 100,
  createConfig: (options) => new WcBuildConf_GraveA(options),
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

  // Validate and clamp growLoopCount (5-100)
  let growLoopCount = options.growLoopCount;
  if (growLoopCount < 5) {
    console.warn(
      `growLoopCount ${growLoopCount} below minimum (5), clamping to 5`,
    );
    growLoopCount = 5;
  } else if (growLoopCount > 300) {
    console.warn(
      `growLoopCount ${growLoopCount} above maximum (100), clamping to 100`,
    );
    growLoopCount = 100;
  }

  // Validate and clamp endLoopMax (50-1000)
  let endLoopMax = options.endLoopMax;
  if (endLoopMax < 50) {
    console.warn(`endLoopMax ${endLoopMax} below minimum (50), clamping to 50`);
    endLoopMax = 50;
  } else if (endLoopMax > 1000) {
    console.warn(
      `endLoopMax ${endLoopMax} above maximum (1000), clamping to 1000`,
    );
    endLoopMax = 1000;
  }

  return entry.createConfig({ growLoopCount, endLoopMax });
}

/**
 * Get a building config entry by ID
 * @param id The building config ID
 * @returns The building config entry, or undefined if not found
 */
export function getBuildingConfigEntry(
  id: string,
): BuildingConfigEntry | undefined {
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
