// Tool Menu UI - Main thread
// Following the flyMenu.ts pattern

// Import state management
import {
  setActiveCategory as setCategoryState,
  setActiveToolId,
  setActiveBrushSize as setBrushSizeState,
  setActiveColor as setColorState,
  setActiveAssetId,
  setSelectedAssetGroup,
  setActiveAssetSuffix as setSuffixState,
  setActiveHue,
  setActiveContrast,
  setActiveSaturation,
  setActiveBrightness,
  resetColorFilters,
  getActiveAssetId,
  getActiveAssetSuffix,
  getBuildingConfigs,
  setActiveBuildingConfigId,
  setBuildingParams,
  getBuildingGrowLoop,
  getBuildingEndLoop,
  getActiveBuildingDescription,
  buildFullAssetKey,
} from './toolMenuState.ts';

// Import render functions
import {
  renderToolMenu,
  renderToolList,
  renderBuildingConfigSelector,
} from './toolMenuRender.ts';
import { renderAssetGroupList, renderAssetImageList } from "./assetMenu.ts";

// Import handlers
export {
  // handleToolList,
  handleToolExecuted,
  handlePickedColor,
  handleAssetPreview,
  handleBuildingConfigList,
} from './toolMenuHandlers.ts';
// ============================================================================
// Initialization
// ============================================================================

export const initToolMenu = (gameWorker: Worker) => {
  const toolMenuEl = document.getElementById("toolMenu") as HTMLElement;
  if (!toolMenuEl) return;

  renderToolMenu(toolMenuEl);
  wireEventHandlers(toolMenuEl, gameWorker);
};

// ============================================================================
// Event Handler Wiring
// ============================================================================

function wireEventHandlers(container: HTMLElement, gameWorker: Worker): void {
  // Category tab click handlers
  container.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const category = (tab as HTMLElement).dataset.category!;
      handleCategoryChange(category, container, gameWorker);
    });
  });

  // Color picker handler
  const colorPickerInput = container.querySelector('#colorPickerInput') as HTMLInputElement;
  if (colorPickerInput) {
    colorPickerInput.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      handleColorChange(color, container, gameWorker);
    });
  }

  // Brush size click handlers
  container.querySelectorAll('.brush-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = parseInt((btn as HTMLElement).dataset.size!);
      handleBrushSizeChange(size, container, gameWorker);
    });
  });

  // Suffix button click handlers
  container.querySelectorAll('.suffix-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const suffix = (btn as HTMLElement).dataset.suffix!;
      handleSuffixChange(suffix, container, gameWorker);
    });
  });

  // Filter slider event handlers
  container.querySelectorAll('.filter-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      handleFilterChange(input, container, gameWorker);
    });
  });

  // Reset filters button handler
  const resetFiltersBtn = container.querySelector('#resetFiltersBtn') as HTMLButtonElement;
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      handleFilterReset(container, gameWorker);
    });
  }

  // Use event delegation for tool buttons so handlers survive DOM updates
  // (handleToolList replaces #toolList innerHTML, destroying previously attached listeners)
  const toolListEl = container.querySelector('#toolList') as HTMLElement;
  if (toolListEl) {
    toolListEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.tool-btn') as HTMLElement;
      if (btn && btn.dataset.toolId) {
        handleToolSelect(btn.dataset.toolId, container, gameWorker);
      }
    });
  }

  // Use event delegation for asset group buttons
  const assetGroupListEl = container.querySelector('#assetGroupList') as HTMLElement;
  if (assetGroupListEl) {
    assetGroupListEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.asset-group-btn') as HTMLElement;
      if (btn && btn.dataset.group) {
        setSelectedAssetGroup(btn.dataset.group);
        renderAssetBrowserDOM(container, gameWorker);
      }
    });
  }

  // Use event delegation for asset image buttons
  const assetImageListEl = container.querySelector('#assetImageList') as HTMLElement;
  if (assetImageListEl) {
    assetImageListEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.asset-image-btn') as HTMLElement;
      if (btn && btn.dataset.asset) {
        handleAssetSelect(btn.dataset.asset, container, gameWorker);
      }
    });
  }

  // Use event delegation for building config buttons
  const buildingConfigSelector = container.querySelector('#buildingConfigSelector') as HTMLElement;
  if (buildingConfigSelector) {
    buildingConfigSelector.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.tool-btn') as HTMLElement;
      if (btn && btn.dataset.configId) {
        handleBuildingConfigSelect(btn.dataset.configId, container, gameWorker);
      }
    });
  }

  // Building config grow loop slider - use event delegation on buildingConfigPanel
  const buildingConfigPanel = container.querySelector('#buildingConfigPanel') as HTMLElement;
  if (buildingConfigPanel) {
    buildingConfigPanel.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'growLoopSlider') {
        const value = parseInt((target as HTMLInputElement).value);
        handleBuildingParamChange('growLoop', value, container, gameWorker);
      } else if (target.id === 'endLoopSlider') {
        const value = parseInt((target as HTMLInputElement).value);
        handleBuildingParamChange('endLoop', value, container, gameWorker);
      }
    });
  }

  // Initialize tool list and asset browser for default category
  renderToolListDOM(container, gameWorker);
  renderAssetBrowserDOM(container, gameWorker);
  renderBuildingConfigSelectorDOM(container, gameWorker);
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleCategoryChange(category: string, container: HTMLElement, gameWorker: Worker): void {
  setCategoryState(category);

  // Update tab active state
  container.querySelectorAll('.category-tab').forEach(tab => {
    const tabCat = (tab as HTMLElement).dataset.category;
    tab.classList.toggle('active', tabCat === category);
  });

  // Show/hide panels
  updatePanelVisibility(container, category);

  // Re-render tool list
  renderToolListDOM(container, gameWorker);

  // Render asset browser if in asset category
  if (category === 'asset') {
    renderAssetBrowserDOM(container, gameWorker);
  }

}

function handleColorChange(color: string, container: HTMLElement, gameWorker: Worker): void {
  setColorState(color);

  // Update color hex display
  const colorHexEl = container.querySelector('#colorHex') as HTMLElement;
  if (colorHexEl) {
    colorHexEl.textContent = color;
  }

  // Convert hex to RGB and send to worker
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  gameWorker.postMessage({
    action: "setColor",
    r: r,
    g: g,
    b: b,
  });
}

function handleBrushSizeChange(size: number, container: HTMLElement, gameWorker: Worker): void {
  setBrushSizeState(size);

  // Update brush button active state
  container.querySelectorAll('.brush-btn').forEach(btn => {
    const btnSize = parseInt((btn as HTMLElement).dataset.size!);
    btn.classList.toggle('active', btnSize === size);
  });

  // Send to worker
  gameWorker.postMessage({
    action: "setBrushSize",
    size: size,
  });
}

function handleSuffixChange(suffix: string, container: HTMLElement, gameWorker: Worker): void {
  setSuffixState(suffix);

  // Update suffix button active state
  container.querySelectorAll('.suffix-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.suffix === suffix);
  });

  // Send updated asset to worker if an asset is selected
  const activeAssetId = getActiveAssetId();
  if (activeAssetId) {
    const fullKey = buildFullAssetKey(activeAssetId);
    gameWorker.postMessage({
      action: "setActiveAsset",
      assetId: fullKey,
    });
  }
}

function handleFilterChange(input: HTMLInputElement, _container: HTMLElement, gameWorker: Worker): void {
  const filter = input.dataset.filter!;
  const value = parseInt(input.value);

  // Update state based on filter type
  switch (filter) {
    case 'hue':
      setActiveHue(value);
      break;
    case 'saturation':
      setActiveSaturation(value);
      break;
    case 'contrast':
      setActiveContrast(value);
      break;
    case 'brightness':
      setActiveBrightness(value);
      break;
  }

  // Update the value display
  const valueEl = input.nextElementSibling as HTMLElement;
  if (valueEl) {
    valueEl.textContent = filter === 'hue' ? `${value}°` : `${value}`;
  }

  // Trigger preview update if an asset is selected
  const activeAssetId = getActiveAssetId();
  if (activeAssetId) {
    const fullKey = buildFullAssetKey(activeAssetId);
    gameWorker.postMessage({
      action: "setActiveAsset",
      assetId: fullKey,
    });
  }
}

function handleFilterReset(container: HTMLElement, gameWorker: Worker): void {
  // Reset filter state
  resetColorFilters();

  // Reset slider values
  const hueSlider = container.querySelector('[data-filter="hue"]') as HTMLInputElement;
  const satSlider = container.querySelector('[data-filter="saturation"]') as HTMLInputElement;
  const conSlider = container.querySelector('[data-filter="contrast"]') as HTMLInputElement;
  const brtSlider = container.querySelector('[data-filter="brightness"]') as HTMLInputElement;

  if (hueSlider) hueSlider.value = '0';
  if (satSlider) satSlider.value = '100';
  if (conSlider) conSlider.value = '100';
  if (brtSlider) brtSlider.value = '100';

  // Reset value displays
  const hueValue = hueSlider?.nextElementSibling as HTMLElement;
  const satValue = satSlider?.nextElementSibling as HTMLElement;
  const conValue = conSlider?.nextElementSibling as HTMLElement;
  const brtValue = brtSlider?.nextElementSibling as HTMLElement;

  if (hueValue) hueValue.textContent = '0°';
  if (satValue) satValue.textContent = '100';
  if (conValue) conValue.textContent = '100';
  if (brtValue) brtValue.textContent = '100';

  // Trigger preview update if an asset is selected
  const activeAssetId = getActiveAssetId();
  if (activeAssetId) {
    gameWorker.postMessage({
      action: "setActiveAsset",
      assetId: activeAssetId + getActiveAssetSuffix(),
    });
  }
}

// ============================================================================
// DOM Rendering Helpers
// ============================================================================

function updatePanelVisibility(container: HTMLElement, category: string): void {
  // Show/hide color picker
  const colorPickerEl = container.querySelector('#toolColorPicker') as HTMLElement;
  if (colorPickerEl) {
    colorPickerEl.style.display = category === 'color' ? 'flex' : 'none';
  }

  // Show/hide asset browser
  const assetBrowserEl = container.querySelector('#assetBrowser') as HTMLElement;
  if (assetBrowserEl) {
    assetBrowserEl.style.display = category === 'asset' ? 'block' : 'none';
  }

  // Show/hide suffix selector
  const suffixSelectorEl = container.querySelector('#suffixSelector') as HTMLElement;
  if (suffixSelectorEl) {
    suffixSelectorEl.style.display = category === 'asset' ? 'flex' : 'none';
  }

  // Show/hide building config panel
  const buildingConfigEl = container.querySelector('#buildingConfigPanel') as HTMLElement;
  if (buildingConfigEl) {
    buildingConfigEl.style.display = category === 'structure' ? 'block' : 'none';
  }
}

function renderToolListDOM(container: HTMLElement, gameWorker: Worker): void {
  const toolListEl = container.querySelector('#toolList') as HTMLElement;
  if (!toolListEl) return;

  toolListEl.innerHTML = renderToolList();
  // Click handlers are managed via event delegation in wireEventHandlers
}

function handleToolSelect(toolId: string, container: HTMLElement, gameWorker: Worker): void {
  setActiveToolId(toolId);

  // Update tool button active state
  container.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.toolId === toolId);
  });

  // Send to worker
  gameWorker.postMessage({
    action: "setActiveTool",
    toolId: toolId,
  });
}

function renderAssetBrowserDOM(container: HTMLElement, gameWorker: Worker): void {
  const assetGroupListEl = container.querySelector('#assetGroupList') as HTMLElement;
  const assetImageListEl = container.querySelector('#assetImageList') as HTMLElement;

  if (!assetGroupListEl || !assetImageListEl) return;

  // Render group list
  assetGroupListEl.innerHTML = renderAssetGroupList();

  // Render images for selected group
  // assetImageListEl.innerHTML = renderAssetImageList();

  // Click handlers are managed via event delegation in wireEventHandlers
}

function handleAssetSelect(assetId: string, container: HTMLElement, gameWorker: Worker): void {
  setActiveAssetId(assetId);

  // Update selected asset card display
  const selectedAssetCardEl = container.querySelector('#selectedAssetCard') as HTMLElement;
  const selectedAssetLabelEl = container.querySelector('#selectedAssetLabel') as HTMLElement;
  if (selectedAssetCardEl && selectedAssetLabelEl) {
    selectedAssetCardEl.style.display = 'block';
    const fullKey = buildFullAssetKey(assetId);
    selectedAssetLabelEl.textContent = fullKey;
  }

  // Update asset image button active state
  container.querySelectorAll('.asset-image-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.asset === assetId);
  });

  // Send to worker with suffix and filter
  const fullKey = buildFullAssetKey(assetId);
  gameWorker.postMessage({
    action: "setActiveAsset",
    assetId: fullKey,
  });
}

// ============================================================================
// Building Configuration Handlers
// ============================================================================

function renderBuildingConfigSelectorDOM(container: HTMLElement, gameWorker: Worker): void {
  const selectorEl = container.querySelector('#buildingConfigSelector') as HTMLElement;
  if (!selectorEl) return;

  selectorEl.innerHTML = renderBuildingConfigSelector();
  // Click handlers are managed via event delegation in wireEventHandlers
}

function handleBuildingConfigSelect(configId: string, container: HTMLElement, gameWorker: Worker): void {
  setActiveBuildingConfigId(configId);

  // Find the config to get default values and update params
  const configs = getBuildingConfigs();
  const config = configs.find(c => c.id === configId);
  if (config) {
    setBuildingParams(config.defaultGrowLoop, config.defaultEndLoop);

    // Update slider values
    const growLoopSlider = container.querySelector('#growLoopSlider') as HTMLInputElement;
    const endLoopSlider = container.querySelector('#endLoopSlider') as HTMLInputElement;
    const growLoopValue = container.querySelector('#growLoopValue') as HTMLElement;
    const endLoopValue = container.querySelector('#endLoopValue') as HTMLElement;

    if (growLoopSlider) growLoopSlider.value = String(config.defaultGrowLoop);
    if (endLoopSlider) endLoopSlider.value = String(config.defaultEndLoop);
    if (growLoopValue) growLoopValue.textContent = String(config.defaultGrowLoop);
    if (endLoopValue) endLoopValue.textContent = String(config.defaultEndLoop);
  }

  // Send to worker
  gameWorker.postMessage({
    action: "setBuildingConfig",
    configId: configId,
  });

  // Update button active state
  container.querySelectorAll('#buildingConfigSelector .tool-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.configId === configId);
  });

  // Update description
  const descriptionEl = container.querySelector('#buildingDescription') as HTMLElement;
  if (descriptionEl) {
    descriptionEl.textContent = getActiveBuildingDescription();
  }
}

function handleBuildingParamChange(param: 'growLoop' | 'endLoop', value: number, container: HTMLElement, gameWorker: Worker): void {
  const growLoop = param === 'growLoop' ? value : getBuildingGrowLoop();
  const endLoop = param === 'endLoop' ? value : getBuildingEndLoop();

  setBuildingParams(growLoop, endLoop);

  // Update value display
  const valueEl = container.querySelector(`#${param === 'growLoop' ? 'growLoopValue' : 'endLoopValue'}`) as HTMLElement;
  if (valueEl) valueEl.textContent = String(value);

  gameWorker.postMessage({
    action: "setBuildingParams",
    growLoop: growLoop,
    endLoop: endLoop,
  });
}

