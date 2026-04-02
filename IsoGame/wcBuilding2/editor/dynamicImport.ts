/**
 * Dynamic Import Utilities
 *
 * Provides helpers for dynamically importing building config classes by name.
 * Extracted from loader.ts to support standalone module map management and
 * potential future generation from the registry.
 */

// Type for building config class constructor
type BuildConfCtor = new (params: { growLoopCount: number; endLoopMax: number }) => import("../wcAbstractBuildConf.ts").WcAbstractBuildConf;

// Module map — maps class names to relative import paths
// TODO: Consider generating this from the registry to avoid maintenance drift
const moduleMap: Record<string, string> = {
  "WcBuildConf_HouseA": "../conf/buildConf_HouseA.ts",
  "WcBuildConf_GraveA": "../conf/buildConf_GraveA.ts",
  "WcBuildConf_ManorA": "../conf/buildConf_ManorA.ts",
  "WcBuildConf_LabBorderA": "../conf/buildConf_LabBorderA.ts",
  "WcBuildConf_LabPipeA": "../conf/buildConf_LabPipeA.ts",
  "WcBuildConf_RLabA": "../conf/buildConf_RLabA.ts",
};

/**
 * Attempt to dynamically import a building config class by name.
 * This is used as a fallback when JSON and registry lookups fail.
 *
 * @param className — Full class name (e.g., "WcBuildConf_HouseA")
 * @returns The class constructor, or null if not found
 */
export async function tryImportClass(className: string): Promise<BuildConfCtor | null> {
  const modulePath = moduleMap[className];
  if (!modulePath) return null;

  try {
    const mod = await import(modulePath);
    const cls: BuildConfCtor | undefined = mod[className];
    if (!cls) return null;
    return cls;
  } catch (_e) {
    return null;
  }
}

/**
 * Register a new class-to-module mapping at runtime.
 * Useful for plugins or dynamically added configs.
 *
 * @param className — Full class name
 * @param modulePath — Relative import path
 */
export function registerModuleMapping(className: string, modulePath: string): void {
  moduleMap[className] = modulePath;
}

/**
 * Get all registered class names in the module map.
 */
export function getModuleMap(): Readonly<Record<string, string>> {
  return { ...moduleMap };
}