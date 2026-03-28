// Tool Menu State Management
// Extracted from toolMenu.ts for better separation of concerns

// ============================================================================
// Interfaces
// ============================================================================

export interface MapToolInfo {
  id: string;
  name: string;
  icon: string;
  category: string;
}

export interface BuildingConfigInfo {
  id: string;
  name: string;
  description: string;
  defaultGrowLoop: number;
  defaultEndLoop: number;
}

// ============================================================================
// Constants
// ============================================================================

export const categories = ["terrain", "color", "asset", "structure", "inspect"] as const;
export const brushSizes = [1, 3, 5, 9] as const;
export const assetSuffixes = ["_NE", "_NW", "_SW", "_SE"] as const;

// ============================================================================
// State Variables
// ============================================================================

// Tool state
let activeCategory: string = "terrain";
let activeToolId: string | null = null;
let activeBrushSize: number = 1;
let activeColor: string = "#808080"; // Default gray
let toolsByCategory: Map<string, MapToolInfo[]> = new Map();

// Asset state
let assetGroups: Array<{ group: string; images: string[] }> = [];
let activeAssetId: string | null = null;
let selectedAssetGroup: string | null = null;
let activeAssetSuffix: string = "_NE"; // Default direction suffix

// Color filter state
let activeHue: number = 0;
let activeContrast: number = 100;
let activeSaturation: number = 100;
let activeBrightness: number = 100;

// Building configuration state
let buildingConfigs: BuildingConfigInfo[] = [];
let activeBuildingConfigId: string = "grave_a";
let buildingGrowLoop: number = 20;
let buildingEndLoop: number = 100;

// ============================================================================
// Tool State Getters/Setters
// ============================================================================

export function getActiveCategory(): string {
  return activeCategory;
}

export function setActiveCategory(category: string): void {
  activeCategory = category;
}

export function getActiveToolId(): string | null {
  return activeToolId;
}

export function setActiveToolId(toolId: string | null): void {
  activeToolId = toolId;
}

export function getActiveBrushSize(): number {
  return activeBrushSize;
}

export function setActiveBrushSize(size: number): void {
  activeBrushSize = size;
}

export function getActiveColor(): string {
  return activeColor;
}

export function setActiveColor(color: string): void {
  activeColor = color;
}

export function getToolsByCategory(): Map<string, MapToolInfo[]> {
  return toolsByCategory;
}

export function setToolsByCategory(tools: Map<string, MapToolInfo[]>): void {
  toolsByCategory = tools;
}

export function clearToolsByCategory(): void {
  toolsByCategory.clear();
}

// ============================================================================
// Asset State Getters/Setters
// ============================================================================

export function getAssetGroups(): Array<{ group: string; images: string[] }> {
  return assetGroups;
}

export function setAssetGroups(groups: Array<{ group: string; images: string[] }>): void {
  assetGroups = groups;
}

export function getActiveAssetId(): string | null {
  return activeAssetId;
}

export function setActiveAssetId(assetId: string | null): void {
  activeAssetId = assetId;
}

export function getSelectedAssetGroup(): string | null {
  return selectedAssetGroup;
}

export function setSelectedAssetGroup(group: string | null): void {
  selectedAssetGroup = group;
}

export function getActiveAssetSuffix(): string {
  return activeAssetSuffix;
}

export function setActiveAssetSuffix(suffix: string): void {
  activeAssetSuffix = suffix;
}

// ============================================================================
// Color Filter State Getters/Setters
// ============================================================================

export function getActiveHue(): number {
  return activeHue;
}

export function setActiveHue(hue: number): void {
  activeHue = hue;
}

export function getActiveContrast(): number {
  return activeContrast;
}

export function setActiveContrast(contrast: number): void {
  activeContrast = contrast;
}

export function getActiveSaturation(): number {
  return activeSaturation;
}

export function setActiveSaturation(saturation: number): void {
  activeSaturation = saturation;
}

export function getActiveBrightness(): number {
  return activeBrightness;
}

export function setActiveBrightness(brightness: number): void {
  activeBrightness = brightness;
}

export function resetColorFilters(): void {
  activeHue = 0;
  activeContrast = 100;
  activeSaturation = 100;
  activeBrightness = 100;
}

export function getColorFilterState(): { hue: number; contrast: number; saturation: number; brightness: number } {
  return {
    hue: activeHue,
    contrast: activeContrast,
    saturation: activeSaturation,
    brightness: activeBrightness,
  };
}

export function areColorFiltersDefault(): boolean {
  return activeHue === 0 && activeContrast === 100 && activeSaturation === 100 && activeBrightness === 100;
}

// ============================================================================
// Building Configuration State Getters/Setters
// ============================================================================

export function getBuildingConfigs(): BuildingConfigInfo[] {
  return buildingConfigs;
}

export function setBuildingConfigs(configs: BuildingConfigInfo[]): void {
  buildingConfigs = configs;
}

export function getActiveBuildingConfigId(): string {
  return activeBuildingConfigId;
}

export function setActiveBuildingConfigId(configId: string): void {
  activeBuildingConfigId = configId;
}

export function getBuildingGrowLoop(): number {
  return buildingGrowLoop;
}

export function setBuildingGrowLoop(value: number): void {
  buildingGrowLoop = value;
}

export function getBuildingEndLoop(): number {
  return buildingEndLoop;
}

export function setBuildingEndLoop(value: number): void {
  buildingEndLoop = value;
}

export function setBuildingParams(growLoop: number, endLoop: number): void {
  buildingGrowLoop = growLoop;
  buildingEndLoop = endLoop;
}

export function getActiveBuildingDescription(): string {
  const config = buildingConfigs.find(c => c.id === activeBuildingConfigId);
  return config?.description || 'Select a building configuration';
}

export function getActiveBuildingConfig(): BuildingConfigInfo | undefined {
  return buildingConfigs.find(c => c.id === activeBuildingConfigId);
}

// ============================================================================
// Reset Functions
// ============================================================================

export function resetAssetState(): void {
  activeAssetId = null;
  selectedAssetGroup = null;
  activeAssetSuffix = "_NE";
  resetColorFilters();
}

export function resetBuildingState(): void {
  activeBuildingConfigId = "grave_a";
  buildingGrowLoop = 20;
  buildingEndLoop = 100;
}

export function resetAllState(): void {
  activeCategory = "terrain";
  activeToolId = null;
  activeBrushSize = 1;
  activeColor = "#808080";
  toolsByCategory.clear();
  resetAssetState();
  resetBuildingState();
}

// ============================================================================
// Utility Functions
// ============================================================================

export function buildFilterSuffix(): string {
  if (areColorFiltersDefault()) {
    return '';
  }
  return `#H${activeHue}_C${activeContrast}_S${activeSaturation}_B${activeBrightness}`;
}

export function buildFullAssetKey(assetId: string): string {
  return assetId + activeAssetSuffix + buildFilterSuffix();
}