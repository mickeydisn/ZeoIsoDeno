// Tool Menu Render Module
// Extracted from toolMenu.ts - handles all HTML template rendering

import {
  categories,
  brushSizes,
  assetSuffixes,
  getActiveCategory,
  getActiveToolId,
  getActiveBrushSize,
  getActiveColor,
  getToolsByCategory,
  getAssetGroups,
  getActiveAssetId,
  getSelectedAssetGroup,
  getActiveAssetSuffix,
  getColorFilterState,
  getBuildingGrowLoop,
  getBuildingEndLoop,
  getActiveBuildingDescription,
  buildFilterSuffix,
  getBuildingConfigs,
  getActiveBuildingConfigId,
} from './toolMenuState.ts';

// ============================================================================
// Main Render Function
// ============================================================================

export function renderToolMenu(container: HTMLElement): void {
  container.innerHTML = `
    ${renderHeader()}
    ${renderCategoryTabs()}
    ${renderActiveDisplay()}
    <div id="toolList"></div>
    ${renderBrushSelector()}
    ${renderColorPanel()}
    ${renderAssetPanel()}
    ${renderBuildingPanel()}
  `;
}

// ============================================================================
// Sub-Render Functions
// ============================================================================

function renderHeader(): string {
  return `
    <div id="toolMenuHeader">
      <span id="toolMenuTitle">Tools</span>
    </div>
  `;
}

export function renderCategoryTabs(): string {
  const activeCategory = getActiveCategory();
  return `
    <div id="toolCategoryTabs">
      ${categories.map(cat => `
        <button class="category-tab ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">
          ${capitalizeFirst(cat)}
        </button>
      `).join('')}
    </div>
  `;
}

function renderActiveDisplay(): string {
  const activeToolId = getActiveToolId();
  const activeBrushSize = getActiveBrushSize();
  const toolsByCategory = getToolsByCategory();

  let labelText = 'No tool selected';
  if (activeToolId) {
    const allTools = Array.from(toolsByCategory.values()).flat();
    const tool = allTools.find(t => t.id === activeToolId);
    if (tool) {
      labelText = `${tool.icon} ${tool.name} (${activeBrushSize}×${activeBrushSize})`;
    }
  }

  return `
    <div id="toolActiveDisplay">
      <span id="activeToolLabel">${labelText}</span>
    </div>
  `;
}

export function renderToolList(): string {
  const activeCategory = getActiveCategory();
  const activeToolId = getActiveToolId();
  const toolsByCategory = getToolsByCategory();
  const tools = toolsByCategory.get(activeCategory) || [];

  if (tools.length === 0) {
    return `<div class="tool-empty">No tools in this category</div>`;
  }

  return tools.map(tool => `
    <button class="tool-btn ${tool.id === activeToolId ? 'active' : ''}" data-tool-id="${tool.id}">
      <span class="tool-icon">${tool.icon}</span>
      <span class="tool-name">${tool.name}</span>
    </button>
  `).join('');
}

export function renderBrushSelector(): string {
  const activeBrushSize = getActiveBrushSize();
  return `
    <div id="toolBrushSize">
      <span>Brush:</span>
      ${brushSizes.map(size => `
        <button class="brush-btn ${size === activeBrushSize ? 'active' : ''}" data-size="${size}">
          ${size}×${size}
        </button>
      `).join('')}
    </div>
  `;
}

export function renderColorPanel(): string {
  const activeCategory = getActiveCategory();
  const activeColor = getActiveColor();
  const display = activeCategory === 'color' ? 'flex' : 'none';

  return `
    <div id="toolColorPicker" style="display: ${display}">
      <span>Color:</span>
      <input type="color" id="colorPickerInput" value="${activeColor}">
      <span id="colorHex">${activeColor}</span>
    </div>
  `;
}

export function renderAssetPanel(): string {
  const activeCategory = getActiveCategory();
  const activeAssetId = getActiveAssetId();
  const activeAssetSuffix = getActiveAssetSuffix();
  const filterState = getColorFilterState();
  const display = activeCategory === 'asset' ? 'block' : 'none';

  return `
    <div id="assetBrowser" style="display: ${display}">
      ${renderSuffixSelector(activeAssetSuffix)}
      ${renderFilterControls(filterState)}
      ${renderSelectedAssetCard(activeAssetId, activeAssetSuffix)}
      <div id="assetImageList"></div>
      ${renderAssetGroupList()}
    </div>
  `;
}

function renderSuffixSelector(activeSuffix: string): string {
  return `
    <div id="suffixSelector">
      <span>Direction:</span>
      ${assetSuffixes.map(suffix => `
        <button class="suffix-btn ${suffix === activeSuffix ? 'active' : ''}" data-suffix="${suffix}">
          ${suffix.replace('_', '')}
        </button>
      `).join('')}
    </div>
  `;
}

function renderFilterControls(filterState: { hue: number; contrast: number; saturation: number; brightness: number }): string {
  return `
    <div id="assetFilterControls">
      <div class="filter-row">
        <span>Hue:</span>
        <input type="range" min="0" max="360" value="${filterState.hue}" class="filter-slider" data-filter="hue">
        <span class="filter-value">${filterState.hue}°</span>
      </div>
      <div class="filter-row">
        <span>Sat:</span>
        <input type="range" min="5" max="250" value="${filterState.saturation}" class="filter-slider" data-filter="saturation">
        <span class="filter-value">${filterState.saturation}</span>
      </div>
      <div class="filter-row">
        <span>Con:</span>
        <input type="range" min="5" max="250" value="${filterState.contrast}" class="filter-slider" data-filter="contrast">
        <span class="filter-value">${filterState.contrast}</span>
      </div>
      <div class="filter-row">
        <span>Brt:</span>
        <input type="range" min="5" max="250" value="${filterState.brightness}" class="filter-slider" data-filter="brightness">
        <span class="filter-value">${filterState.brightness}</span>
      </div>
      <button id="resetFiltersBtn" class="filter-reset-btn">Reset Filters</button>
    </div>
  `;
}

function renderSelectedAssetCard(activeAssetId: string | null, activeAssetSuffix: string): string {
  const display = activeAssetId ? 'block' : 'none';
  const label = activeAssetId ? activeAssetId + activeAssetSuffix + buildFilterSuffix() : 'No asset selected';

  return `
    <div id="selectedAssetCard" style="display: ${display}">
      <div id="selectedAssetPreview"></div>
      <span id="selectedAssetLabel">${label}</span>
    </div>
  `;
}

export function renderAssetGroupList(): string {
  const assetGroups = getAssetGroups();
  const selectedAssetGroup = getSelectedAssetGroup();

  if (assetGroups.length === 0) {
    return '<div class="asset-empty">Loading assets...</div>';
  }

  return `
    <div id="assetGroupList">
      <div class="asset-group-header">Asset Groups</div>
      ${assetGroups.map(group => `
        <button class="asset-group-btn ${group.group === selectedAssetGroup ? 'active' : ''}" data-group="${group.group}">
          ${group.group} (${group.images.length})
        </button>
      `).join('')}
    </div>
  `;
}

export function renderAssetImageList(): string {
  const assetGroups = getAssetGroups();
  const selectedAssetGroup = getSelectedAssetGroup();
  const activeAssetId = getActiveAssetId();

  if (!selectedAssetGroup) {
    return '<div class="asset-empty">Select a group</div>';
  }

  const group = assetGroups.find(g => g.group === selectedAssetGroup);
  if (!group) {
    return '<div class="asset-empty">Select a group</div>';
  }

  return `
    <div class="asset-image-header">${group.group}</div>
    <div class="asset-image-grid">
      ${group.images.map(image => `
        <button class="asset-image-btn ${image === activeAssetId ? 'active' : ''}" data-asset="${image}">
          ${image}
        </button>
      `).join('')}
    </div>
  `;
}

export function renderBuildingPanel(): string {
  const activeCategory = getActiveCategory();
  const buildingGrowLoop = getBuildingGrowLoop();
  const buildingEndLoop = getBuildingEndLoop();
  const description = getActiveBuildingDescription();
  const display = activeCategory === 'structure' ? 'block' : 'none';

  return `
    <div id="buildingConfigPanel" style="display: ${display}">
      <div id="buildingConfigHeader">
        <span id="buildingConfigTitle">Building Config</span>
      </div>
      <div id="buildingConfigSelector"></div>
      ${renderBuildingParams(buildingGrowLoop, buildingEndLoop)}
      <div id="buildingDescription">${description}</div>
    </div>
  `;
}

function renderBuildingParams(growLoop: number, endLoop: number): string {
  return `
    <div id="buildingParams">
      <div class="param-row">
        <span>Grow Loop:</span>
        <input type="range" min="5" max="100" value="${growLoop}" id="growLoopSlider">
        <span id="growLoopValue">${growLoop}</span>
      </div>
      <div class="param-row">
        <span>End Loop Max:</span>
        <input type="range" min="50" max="1000" value="${endLoop}" id="endLoopSlider">
        <span id="endLoopValue">${endLoop}</span>
      </div>
    </div>
  `;
}

export function renderBuildingConfigSelector(): string {
  const buildingConfigs = getBuildingConfigs();
  const activeBuildingConfigId = getActiveBuildingConfigId();

  if (buildingConfigs.length === 0) {
    return '<div class="building-empty">Loading building configs...</div>';
  }

  return buildingConfigs.map(config => `
    <button class="tool-btn ${config.id === activeBuildingConfigId ? 'active' : ''}" data-config-id="${config.id}">
      <span class="tool-name">${config.name}</span>
    </button>
  `).join('');
}

export function renderInspectPanel(): string {
  // Placeholder for future inspect panel
  return '';
}

// ============================================================================
// Utility Functions
// ============================================================================

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}