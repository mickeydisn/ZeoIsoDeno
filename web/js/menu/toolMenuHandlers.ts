// Tool Menu Handlers Module
// Extracted from toolMenu.ts - handles worker message responses

import {

  BuildingConfigInfo,
  setActiveColor as setColorState,

  setBuildingConfigs,
  setActiveBuildingConfigId,
  setBuildingParams,
} from './toolMenuState.ts';

import {
  renderToolList,
  renderBuildingConfigSelector,
} from './toolMenuRender.ts';

// ============================================================================
// Worker Message Handlers
// ============================================================================
/*
export function handleToolList(tools: MapToolInfo[], container?: HTMLElement): void {
  // Organize tools by category
  clearToolsByCategory();
  const toolsByCategory = new Map<string, MapToolInfo[]>();

  for (const cat of ["terrain", "color", "asset", "structure", "inspect"]) {
    toolsByCategory.set(cat, []);
  }

  for (const tool of tools) {
    const catTools = toolsByCategory.get(tool.category);
    if (catTools) {
      catTools.push(tool);
    }
  }

  setToolsByCategory(toolsByCategory);

  // Re-render if container is available
  const toolMenuEl = container || document.getElementById('toolMenu');
  if (toolMenuEl) {
    updateToolListDOM(toolMenuEl as HTMLElement);
  }
}
*/
export function handleToolExecuted(toolId: string, _success: boolean): void {
  const toolMenuEl = document.getElementById('toolMenu');
  if (!toolMenuEl) return;

  // Flash the active tool button
  const activeBtn = toolMenuEl.querySelector(`.tool-btn[data-tool-id="${toolId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('executed');
    setTimeout(() => activeBtn.classList.remove('executed'), 200);
  }
}

export function handlePickedColor(r: number, g: number, b: number): void {
  const toolMenuEl = document.getElementById('toolMenu');
  if (!toolMenuEl) return;

  // Convert RGB to hex
  const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');

  // Update the color picker input
  const colorPickerInput = toolMenuEl.querySelector('#colorPickerInput') as HTMLInputElement;
  if (colorPickerInput) {
    colorPickerInput.value = hex;
  }

  // Update the hex display
  const colorHexEl = toolMenuEl.querySelector('#colorHex') as HTMLElement;
  if (colorHexEl) {
    colorHexEl.textContent = hex;
  }

  // Update active color state
  setColorState(hex);
}

export function handleAssetPreview(blobUrl: string): void {
  const previewEl = document.getElementById('selectedAssetPreview');
  if (!previewEl) return;

  // Revoke old blob URL to prevent memory leaks
  const oldImg = previewEl.querySelector('img');
  if (oldImg && oldImg.src.startsWith('blob:')) {
    URL.revokeObjectURL(oldImg.src);
  }

  // Update preview with new image
  previewEl.innerHTML = `<img src="${blobUrl}" class="asset-preview-img" alt="Asset Preview">`;
}
/*
export function handleAssetGroups(groups: Array<{ group: string; images: string[] }>, container?: HTMLElement): void {
  setAssetGroups(groups);

  // Select first group by default
  if (groups.length > 0) {
    setSelectedAssetGroup(groups[0].group);
  }

  // Always re-render asset browser DOM so assets are visible when switching to asset category
  const toolMenuEl = container || document.getElementById('section-Struct');
  if (toolMenuEl) {
    updateAssetBrowserDOM(toolMenuEl as HTMLElement);
  }
}
*/
export function handleBuildingConfigList(configs: BuildingConfigInfo[], container?: HTMLElement): void {
  setBuildingConfigs(configs);

  // Select first config by default if none selected
  if (configs.length > 0) {
    setActiveBuildingConfigId(configs[0].id);
    setBuildingParams(configs[0].defaultGrowLoop, configs[0].defaultEndLoop);
  }

  // Re-render building config selector if in structure category
  const toolMenuEl = container || document.getElementById('toolMenu');
  if (toolMenuEl) {
    updateBuildingConfigDOM(toolMenuEl as HTMLElement);
  }
}
// ============================================================================
// DOM Update Helpers (for handlers)
// ============================================================================

function updateToolListDOM(container: HTMLElement): void {
  const toolListEl = container.querySelector('#toolList') as HTMLElement;
  if (!toolListEl) return;

  toolListEl.innerHTML = renderToolList();

  // Note: Click handlers need to be re-wired by the main module
  // This is handled by the event delegation in toolMenu.ts
}


function updateBuildingConfigDOM(container: HTMLElement): void {
  const selectorEl = container.querySelector('#buildingConfigSelector') as HTMLElement;
  if (!selectorEl) return;

  selectorEl.innerHTML = renderBuildingConfigSelector();
}
