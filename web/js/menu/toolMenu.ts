// Tool Menu UI - Main thread
// Following the flyMenu.ts pattern

interface MapToolInfo {
  id: string;
  name: string;
  icon: string;
  category: string;
}

const categories = ["terrain", "color", "asset", "structure", "inspect"] as const;
const brushSizes = [1, 3, 5, 9] as const;

let activeCategory: string = "terrain";
let activeToolId: string | null = null;
let activeBrushSize: number = 1;
let activeColor: string = "#808080"; // Default gray
let toolsByCategory: Map<string, MapToolInfo[]> = new Map();
let assetGroups: Array<{ group: string; images: string[] }> = [];
let activeAssetId: string | null = null;
let selectedAssetGroup: string | null = null;
let activeAssetSuffix: string = "_NE"; // Default direction suffix

// Color filter state variables
let activeHue: number = 0;
let activeContrast: number = 100;
let activeSaturation: number = 100;
let activeBrightness: number = 100;

// Building configuration state
interface BuildingConfigInfo {
  id: string;
  name: string;
  description: string;
  defaultGrowLoop: number;
  defaultEndLoop: number;
}
let buildingConfigs: BuildingConfigInfo[] = [];
let activeBuildingConfigId: string = "grave_a";
let buildingGrowLoop: number = 20;
let buildingEndLoop: number = 100;

export const initToolMenu = (gameWorker: Worker) => {
  const toolMenuEl = document.getElementById("toolMenu") as HTMLElement;
  if (!toolMenuEl) return;

  renderToolMenu(toolMenuEl, gameWorker);
};

const assetSuffixes = ["_NE", "_NW", "_SW", "_SE"] as const;

function renderToolMenu(container: HTMLElement, gameWorker: Worker) {
  container.innerHTML = `
    <div id="toolMenuHeader">
      <span id="toolMenuTitle">Tools</span>
    </div>
    <div id="toolCategoryTabs">
      ${categories.map(cat => `
        <button class="category-tab ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">
          ${capitalizeFirst(cat)}
        </button>
      `).join('')}
    </div>
    <div id="toolActiveDisplay">
      <span id="activeToolLabel">No tool selected</span>
    </div>
    <div id="toolList"></div>
    <div id="toolBrushSize">
      <span>Brush:</span>
      ${brushSizes.map(size => `
        <button class="brush-btn ${size === activeBrushSize ? 'active' : ''}" data-size="${size}">
          ${size}×${size}
        </button>
      `).join('')}
    </div>
    <div id="toolColorPicker" style="display: ${activeCategory === 'color' ? 'flex' : 'none'}">
      <span>Color:</span>
      <input type="color" id="colorPickerInput" value="${activeColor}">
      <span id="colorHex">${activeColor}</span>
    </div>
    <div id="assetBrowser" style="display: ${activeCategory === 'asset' ? 'block' : 'none'}">
      <div id="suffixSelector">
        <span>Direction:</span>
        ${assetSuffixes.map(suffix => `
          <button class="suffix-btn ${suffix === activeAssetSuffix ? 'active' : ''}" data-suffix="${suffix}">
            ${suffix.replace('_', '')}
          </button>
        `).join('')}
      </div>
      <div id="assetFilterControls">
        <div class="filter-row">
          <span>Hue:</span>
          <input type="range" min="0" max="360" value="${activeHue}" class="filter-slider" data-filter="hue">
          <span class="filter-value">${activeHue}°</span>
        </div>
        <div class="filter-row">
          <span>Sat:</span>
          <input type="range" min="5" max="250" value="${activeSaturation}" class="filter-slider" data-filter="saturation">
          <span class="filter-value">${activeSaturation}</span>
        </div>
        <div class="filter-row">
          <span>Con:</span>
          <input type="range" min="5" max="250" value="${activeContrast}" class="filter-slider" data-filter="contrast">
          <span class="filter-value">${activeContrast}</span>
        </div>
        <div class="filter-row">
          <span>Brt:</span>
          <input type="range" min="5" max="250" value="${activeBrightness}" class="filter-slider" data-filter="brightness">
          <span class="filter-value">${activeBrightness}</span>
        </div>
        <button id="resetFiltersBtn" class="filter-reset-btn">Reset Filters</button>
      </div>
      <div id="selectedAssetCard" style="display: ${activeAssetId ? 'block' : 'none'}">
        <div id="selectedAssetPreview"></div>
        <span id="selectedAssetLabel">${activeAssetId || 'No asset selected'}</span>
      </div>
      <div id="assetImageList"></div>
      <div id="assetGroupList"></div>
    </div>
    <div id="buildingConfigPanel" style="display: ${activeCategory === 'structure' ? 'block' : 'none'}">
      <div id="buildingConfigHeader">
        <span id="buildingConfigTitle">Building Config</span>
      </div>
      <div id="buildingConfigSelector"></div>
      <div id="buildingParams">
        <div class="param-row">
          <span>Grow Loop:</span>
          <input type="range" min="5" max="100" value="${buildingGrowLoop}" id="growLoopSlider">
          <span id="growLoopValue">${buildingGrowLoop}</span>
        </div>
        <div class="param-row">
          <span>End Loop Max:</span>
          <input type="range" min="50" max="1000" value="${buildingEndLoop}" id="endLoopSlider">
          <span id="endLoopValue">${buildingEndLoop}</span>
        </div>
      </div>
      <div id="buildingDescription">${getActiveBuildingDescription()}</div>
    </div>
  `;

  // Category tab click handlers
  container.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const category = (tab as HTMLElement).dataset.category!;
      setActiveCategory(category, container, gameWorker);
    });
  });

  // Color picker handler
  const colorPickerInput = container.querySelector('#colorPickerInput') as HTMLInputElement;
  if (colorPickerInput) {
    colorPickerInput.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      setActiveColor(color, container, gameWorker);
    });
  }

  // Brush size click handlers
  container.querySelectorAll('.brush-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = parseInt((btn as HTMLElement).dataset.size!);
      setActiveBrushSize(size, container, gameWorker);
    });
  });

  // Suffix button click handlers
  container.querySelectorAll('.suffix-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const suffix = (btn as HTMLElement).dataset.suffix!;
      setActiveAssetSuffix(suffix, container, gameWorker);
    });
  });

  // Filter slider event handlers
  container.querySelectorAll('.filter-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      const filter = input.dataset.filter!;
      const value = parseInt(input.value);
      
      // Update state based on filter type
      switch (filter) {
        case 'hue':
          activeHue = value;
          break;
        case 'saturation':
          activeSaturation = value;
          break;
        case 'contrast':
          activeContrast = value;
          break;
        case 'brightness':
          activeBrightness = value;
          break;
      }
      
      // Update the value display
      const valueEl = input.nextElementSibling as HTMLElement;
      if (valueEl) {
        valueEl.textContent = filter === 'hue' ? `${value}°` : `${value}`;
      }
      
      // Trigger preview update if an asset is selected
      if (activeAssetId) {
        const fullKey = activeAssetId + activeAssetSuffix + buildFilterSuffix();
        gameWorker.postMessage({
          action: "setActiveAsset",
          assetId: fullKey,
        });
      }
    });
  });

  // Reset filters button handler
  const resetFiltersBtn = container.querySelector('#resetFiltersBtn') as HTMLButtonElement;
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      // Reset filter state
      activeHue = 0;
      activeContrast = 100;
      activeSaturation = 100;
      activeBrightness = 100;
      
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
      if (activeAssetId) {
        gameWorker.postMessage({
          action: "setActiveAsset",
          assetId: activeAssetId + activeAssetSuffix,
        });
      }
    });
  }
}

function setActiveCategory(category: string, container: HTMLElement, gameWorker: Worker) {
  activeCategory = category;

  // Update tab active state
  container.querySelectorAll('.category-tab').forEach(tab => {
    const tabCat = (tab as HTMLElement).dataset.category;
    tab.classList.toggle('active', tabCat === category);
  });

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

  // Re-render tool list for this category
  renderToolList(container, gameWorker);

  // Render asset browser if in asset category
  if (category === 'asset') {
    renderAssetBrowser(container, gameWorker);
  }

  // Initialize building config handlers if in structure category
  if (category === 'structure') {
    initBuildingConfigHandlers(container, gameWorker);
  }
}

function setActiveColor(color: string, container: HTMLElement, gameWorker: Worker) {
  activeColor = color;

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

function setActiveBrushSize(size: number, container: HTMLElement, gameWorker: Worker) {
  activeBrushSize = size;

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

function setActiveAssetSuffix(suffix: string, container: HTMLElement, gameWorker: Worker) {
  activeAssetSuffix = suffix;

  // Update suffix button active state
  container.querySelectorAll('.suffix-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.suffix === suffix);
  });

  // Send updated asset to worker if an asset is selected
  // Worker will respond with assetPreview message
  if (activeAssetId) {
    const fullKey = activeAssetId + activeAssetSuffix + buildFilterSuffix();
    gameWorker.postMessage({
      action: "setActiveAsset",
      assetId: fullKey,
    });
  }
}

function renderToolList(container: HTMLElement, gameWorker: Worker) {
  const toolListEl = container.querySelector('#toolList') as HTMLElement;
  if (!toolListEl) return;

  const tools = toolsByCategory.get(activeCategory) || [];

  if (tools.length === 0) {
    toolListEl.innerHTML = `<div class="tool-empty">No tools in this category</div>`;
    return;
  }

  toolListEl.innerHTML = tools.map(tool => `
    <button class="tool-btn ${tool.id === activeToolId ? 'active' : ''}" data-tool-id="${tool.id}">
      <span class="tool-icon">${tool.icon}</span>
      <span class="tool-name">${tool.name}</span>
    </button>
  `).join('');

  // Tool button click handlers
  toolListEl.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = (btn as HTMLElement).dataset.toolId!;
      setActiveTool(toolId, container, gameWorker);
    });
  });
}

function setActiveTool(toolId: string, container: HTMLElement, gameWorker: Worker) {
  activeToolId = toolId;

  // Update tool button active state
  container.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.toolId === toolId);
  });

  // Send to worker
  gameWorker.postMessage({
    action: "setActiveTool",
    toolId: toolId,
  });

  // Update active tool display
  updateActiveToolDisplay(container);
}

function updateActiveToolDisplay(container: HTMLElement) {
  const labelEl = container.querySelector('#activeToolLabel') as HTMLElement;
  if (!labelEl) return;

  if (!activeToolId) {
    labelEl.textContent = 'No tool selected';
    return;
  }

  const allTools = Array.from(toolsByCategory.values()).flat();
  const tool = allTools.find(t => t.id === activeToolId);

  if (tool) {
    labelEl.textContent = `${tool.icon} ${tool.name} (${activeBrushSize}×${activeBrushSize})`;
  }
}

// Called when worker sends tool list
export function handleToolList(tools: MapToolInfo[], container?: HTMLElement) {
  // Organize tools by category
  toolsByCategory.clear();
  for (const cat of categories) {
    toolsByCategory.set(cat, []);
  }

  for (const tool of tools) {
    const catTools = toolsByCategory.get(tool.category);
    if (catTools) {
      catTools.push(tool);
    }
  }

  // Re-render if container is available
  const toolMenuEl = container || document.getElementById('toolMenu');
  if (toolMenuEl) {
    renderToolList(toolMenuEl as HTMLElement, self as any);
  }
}

// Called when tool execution completes
export function handleToolExecuted(toolId: string, success: boolean) {
  const toolMenuEl = document.getElementById('toolMenu');
  if (!toolMenuEl) return;

  // Flash the active tool button
  const activeBtn = toolMenuEl.querySelector(`.tool-btn[data-tool-id="${toolId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('executed');
    setTimeout(() => activeBtn.classList.remove('executed'), 200);
  }
}

// Called when eyedropper picks a color from the map
export function handlePickedColor(r: number, g: number, b: number) {
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
  activeColor = hex;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Build filter suffix from current filter state
function buildFilterSuffix(): string {
  if (activeHue === 0 && activeContrast === 100 && activeSaturation === 100 && activeBrightness === 100) {
    return '';
  }
  return `#H${activeHue}_C${activeContrast}_S${activeSaturation}_B${activeBrightness}`;
}

// Render asset browser with tree of asset groups
function renderAssetBrowser(container: HTMLElement, gameWorker: Worker) {
  const assetGroupListEl = container.querySelector('#assetGroupList') as HTMLElement;
  const assetImageListEl = container.querySelector('#assetImageList') as HTMLElement;
  
  if (!assetGroupListEl || !assetImageListEl) return;

  if (assetGroups.length === 0) {
    assetGroupListEl.innerHTML = '<div class="asset-empty">Loading assets...</div>';
    assetImageListEl.innerHTML = '';
    return;
  }

  // Render group list
  assetGroupListEl.innerHTML = `
    <div class="asset-group-header">Asset Groups</div>
    ${assetGroups.map(group => `
      <button class="asset-group-btn ${group.group === selectedAssetGroup ? 'active' : ''}" data-group="${group.group}">
        ${group.group} (${group.images.length})
      </button>
    `).join('')}
  `;

  // Group button click handlers
  assetGroupListEl.querySelectorAll('.asset-group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = (btn as HTMLElement).dataset.group!;
      selectedAssetGroup = group;
      renderAssetBrowser(container, gameWorker);
    });
  });

  // Render images for selected group
  if (selectedAssetGroup) {
    const group = assetGroups.find(g => g.group === selectedAssetGroup);
    if (group) {
      assetImageListEl.innerHTML = `
        <div class="asset-image-header">${group.group}</div>
        <div class="asset-image-grid">
          ${group.images.map(image => `
            <button class="asset-image-btn ${image === activeAssetId ? 'active' : ''}" data-asset="${image}">
              ${image}
            </button>
          `).join('')}
        </div>
      `;

      // Image button click handlers
      assetImageListEl.querySelectorAll('.asset-image-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const assetId = (btn as HTMLElement).dataset.asset!;
          setActiveAsset(assetId, container, gameWorker);
        });
      });
    }
  } else {
    assetImageListEl.innerHTML = '<div class="asset-empty">Select a group</div>';
  }
}

// Set active asset
function setActiveAsset(assetId: string, container: HTMLElement, gameWorker: Worker) {
  activeAssetId = assetId;

  // Update selected asset card display
  const selectedAssetCardEl = container.querySelector('#selectedAssetCard') as HTMLElement;
  const selectedAssetLabelEl = container.querySelector('#selectedAssetLabel') as HTMLElement;
  if (selectedAssetCardEl && selectedAssetLabelEl) {
    selectedAssetCardEl.style.display = 'block';
    const fullKey = assetId + activeAssetSuffix + buildFilterSuffix();
    selectedAssetLabelEl.textContent = fullKey;
  }

  // Update asset image button active state
  container.querySelectorAll('.asset-image-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.asset === assetId);
  });

  // Send to worker with suffix and filter - worker will respond with assetPreview
  const fullKey = assetId + activeAssetSuffix + buildFilterSuffix();
  gameWorker.postMessage({
    action: "setActiveAsset",
    assetId: fullKey,
  });
}

// Exported function called when worker sends asset preview blob URL
export function handleAssetPreview(blobUrl: string) {
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

// Called when worker sends asset groups
export function handleAssetGroups(groups: Array<{ group: string; images: string[] }>, container?: HTMLElement) {
  assetGroups = groups;
  
  // Select first group by default
  if (groups.length > 0 && !selectedAssetGroup) {
    selectedAssetGroup = groups[0].group;
  }

  // Re-render asset browser if in asset category
  const toolMenuEl = container || document.getElementById('toolMenu');
  if (toolMenuEl && activeCategory === 'asset') {
    renderAssetBrowser(toolMenuEl as HTMLElement, self as any);
  }
}

// Get active building description
function getActiveBuildingDescription(): string {
  const config = buildingConfigs.find(c => c.id === activeBuildingConfigId);
  return config?.description || 'Select a building configuration';
}

// Render building config selector
function renderBuildingConfigSelector(container: HTMLElement, gameWorker: Worker) {
  const selectorEl = container.querySelector('#buildingConfigSelector') as HTMLElement;
  if (!selectorEl) return;

  if (buildingConfigs.length === 0) {
    selectorEl.innerHTML = '<div class="building-empty">Loading building configs...</div>';
    return;
  }

  selectorEl.innerHTML = buildingConfigs.map(config => `
    <button class="tool-btn ${config.id === activeBuildingConfigId ? 'active' : ''}" data-config-id="${config.id}">
      <span class="tool-name">${config.name}</span>
    </button>
  `).join('');

  // Config button click handlers
  selectorEl.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const configId = (btn as HTMLElement).dataset.configId!;
      setActiveBuildingConfig(configId, container, gameWorker);
    });
  });
}

// Set active building config
function setActiveBuildingConfig(configId: string, container: HTMLElement, gameWorker: Worker) {
  activeBuildingConfigId = configId;

  // Find the config to get default values
  const config = buildingConfigs.find(c => c.id === configId);
  if (config) {
    buildingGrowLoop = config.defaultGrowLoop;
    buildingEndLoop = config.defaultEndLoop;
  }

  // Update UI
  const growLoopSlider = container.querySelector('#growLoopSlider') as HTMLInputElement;
  const endLoopSlider = container.querySelector('#endLoopSlider') as HTMLInputElement;
  const growLoopValue = container.querySelector('#growLoopValue') as HTMLElement;
  const endLoopValue = container.querySelector('#endLoopValue') as HTMLElement;
  const descriptionEl = container.querySelector('#buildingDescription') as HTMLElement;

  if (growLoopSlider) growLoopSlider.value = String(buildingGrowLoop);
  if (endLoopSlider) endLoopSlider.value = String(buildingEndLoop);
  if (growLoopValue) growLoopValue.textContent = String(buildingGrowLoop);
  if (endLoopValue) endLoopValue.textContent = String(buildingEndLoop);
  if (descriptionEl) descriptionEl.textContent = getActiveBuildingDescription();

  // Update button active state
  container.querySelectorAll('#buildingConfigSelector .tool-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.configId === configId);
  });

  // Send to worker
  gameWorker.postMessage({
    action: "setBuildingConfig",
    configId: configId,
  });
  gameWorker.postMessage({
    action: "setBuildingParams",
    growLoop: buildingGrowLoop,
    endLoop: buildingEndLoop,
  });
}

// Initialize building config event handlers
function initBuildingConfigHandlers(container: HTMLElement, gameWorker: Worker) {
  // Render building config selector
  renderBuildingConfigSelector(container, gameWorker);

  // Grow loop slider handler
  const growLoopSlider = container.querySelector('#growLoopSlider') as HTMLInputElement;
  if (growLoopSlider) {
    growLoopSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      buildingGrowLoop = value;
      
      const valueEl = container.querySelector('#growLoopValue') as HTMLElement;
      if (valueEl) valueEl.textContent = String(value);

      gameWorker.postMessage({
        action: "setBuildingParams",
        growLoop: buildingGrowLoop,
        endLoop: buildingEndLoop,
      });
    });
  }

  // End loop slider handler
  const endLoopSlider = container.querySelector('#endLoopSlider') as HTMLInputElement;
  if (endLoopSlider) {
    endLoopSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      buildingEndLoop = value;
      
      const valueEl = container.querySelector('#endLoopValue') as HTMLElement;
      if (valueEl) valueEl.textContent = String(value);

      gameWorker.postMessage({
        action: "setBuildingParams",
        growLoop: buildingGrowLoop,
        endLoop: buildingEndLoop,
      });
    });
  }
}

// Called when worker sends building config list
export function handleBuildingConfigList(configs: BuildingConfigInfo[], container?: HTMLElement) {
  buildingConfigs = configs;

  // Select first config by default if none selected
  if (configs.length > 0 && !activeBuildingConfigId) {
    activeBuildingConfigId = configs[0].id;
    buildingGrowLoop = configs[0].defaultGrowLoop;
    buildingEndLoop = configs[0].defaultEndLoop;
  }

  // Re-render building config selector if in structure category
  const toolMenuEl = container || document.getElementById('toolMenu');
  if (toolMenuEl) {
    const gameWorker = (self as any).__gameWorker as Worker;
    if (gameWorker) {
      renderBuildingConfigSelector(toolMenuEl as HTMLElement, gameWorker);
      initBuildingConfigHandlers(toolMenuEl as HTMLElement, gameWorker);
    }
  }
}
