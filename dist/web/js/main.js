// web/js/menu/flyMenu.ts
var initFlyMenu = (gameWorker2) => {
  document.getElementById("mapflyMenu").innerHTML = `
      <button id="mapflyMenu_Ground">Ground</button>
      <button id="mapflyMenu_Fly">Fly</button>
      <button id="mapflyMenu_Height">Height</button>
      <button id="mapflyMenu_Space">Space</button>
    `;
  document.getElementById("mapflyMenu_Ground").addEventListener("click", () => {
    gameWorker2.postMessage({
      action: "initCanvasMap",
      mapConf: {
        DRAW_TILE_COUNT: 40,
        SCALE_SIZE: 0.85,
        SCALE_MOD: 1
      }
    });
  });
  document.getElementById("mapflyMenu_Fly").addEventListener("click", () => {
    gameWorker2.postMessage({
      action: "initCanvasMap",
      mapConf: {
        DRAW_TILE_COUNT: 80,
        SCALE_SIZE: 1 / 2,
        SCALE_MOD: 1
      }
    });
  });
  document.getElementById("mapflyMenu_Height").addEventListener("click", () => {
    gameWorker2.postMessage({
      action: "initCanvasMap",
      mapConf: {
        DRAW_TILE_COUNT: 100,
        SCALE_SIZE: 0.35,
        SCALE_MOD: 16
      }
    });
  });
  document.getElementById("mapflyMenu_Space").addEventListener("click", () => {
    gameWorker2.postMessage({
      action: "initCanvasMap",
      mapConf: {
        DRAW_TILE_COUNT: 100,
        SCALE_SIZE: 0.35,
        SCALE_MOD: 64
      }
    });
  });
};

// web/js/menu/toolMenuState.ts
var categories = ["terrain", "color", "asset", "structure", "inspect"];
var brushSizes = [1, 3, 5, 9];
var assetSuffixes = ["_NE", "_NW", "_SW", "_SE"];
var activeCategory = "terrain";
var activeToolId = null;
var activeBrushSize = 1;
var activeColor = "#808080";
var toolsByCategory = /* @__PURE__ */ new Map();
var assetGroups = [];
var activeAssetId = null;
var selectedAssetGroup = null;
var activeAssetSuffix = "_NE";
var activeHue = 0;
var activeContrast = 100;
var activeSaturation = 100;
var activeBrightness = 100;
var buildingConfigs = [];
var activeBuildingConfigId = "grave_a";
var buildingGrowLoop = 20;
var buildingEndLoop = 100;
function getActiveCategory() {
  return activeCategory;
}
function setActiveCategory(category) {
  activeCategory = category;
}
function getActiveToolId() {
  return activeToolId;
}
function setActiveToolId(toolId) {
  activeToolId = toolId;
}
function getActiveBrushSize() {
  return activeBrushSize;
}
function setActiveBrushSize(size) {
  activeBrushSize = size;
}
function getActiveColor() {
  return activeColor;
}
function setActiveColor(color) {
  activeColor = color;
}
function getToolsByCategory() {
  return toolsByCategory;
}
function setToolsByCategory(tools) {
  toolsByCategory = tools;
}
function clearToolsByCategory() {
  toolsByCategory.clear();
}
function getAssetGroups() {
  return assetGroups;
}
function setAssetGroups(groups) {
  assetGroups = groups;
}
function getActiveAssetId() {
  return activeAssetId;
}
function setActiveAssetId(assetId) {
  activeAssetId = assetId;
}
function getSelectedAssetGroup() {
  return selectedAssetGroup;
}
function setSelectedAssetGroup(group) {
  selectedAssetGroup = group;
}
function getActiveAssetSuffix() {
  return activeAssetSuffix;
}
function setActiveAssetSuffix(suffix) {
  activeAssetSuffix = suffix;
}
function setActiveHue(hue) {
  activeHue = hue;
}
function setActiveContrast(contrast) {
  activeContrast = contrast;
}
function setActiveSaturation(saturation) {
  activeSaturation = saturation;
}
function setActiveBrightness(brightness) {
  activeBrightness = brightness;
}
function resetColorFilters() {
  activeHue = 0;
  activeContrast = 100;
  activeSaturation = 100;
  activeBrightness = 100;
}
function getColorFilterState() {
  return {
    hue: activeHue,
    contrast: activeContrast,
    saturation: activeSaturation,
    brightness: activeBrightness
  };
}
function areColorFiltersDefault() {
  return activeHue === 0 && activeContrast === 100 && activeSaturation === 100 && activeBrightness === 100;
}
function getBuildingConfigs() {
  return buildingConfigs;
}
function setBuildingConfigs(configs) {
  buildingConfigs = configs;
}
function getActiveBuildingConfigId() {
  return activeBuildingConfigId;
}
function setActiveBuildingConfigId(configId) {
  activeBuildingConfigId = configId;
}
function getBuildingGrowLoop() {
  return buildingGrowLoop;
}
function getBuildingEndLoop() {
  return buildingEndLoop;
}
function setBuildingParams(growLoop, endLoop) {
  buildingGrowLoop = growLoop;
  buildingEndLoop = endLoop;
}
function getActiveBuildingDescription() {
  const config = buildingConfigs.find((c) => c.id === activeBuildingConfigId);
  return config?.description || "Select a building configuration";
}
function buildFilterSuffix() {
  if (areColorFiltersDefault()) {
    return "";
  }
  return `#H${activeHue}_C${activeContrast}_S${activeSaturation}_B${activeBrightness}`;
}
function buildFullAssetKey(assetId) {
  return assetId + activeAssetSuffix + buildFilterSuffix();
}

// web/js/menu/toolMenuRender.ts
function renderToolMenu(container) {
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
function renderHeader() {
  return `
    <div id="toolMenuHeader">
      <span id="toolMenuTitle">Tools</span>
    </div>
  `;
}
function renderCategoryTabs() {
  const activeCategory2 = getActiveCategory();
  return `
    <div id="toolCategoryTabs">
      ${categories.map((cat) => `
        <button class="category-tab ${cat === activeCategory2 ? "active" : ""}" data-category="${cat}">
          ${capitalizeFirst(cat)}
        </button>
      `).join("")}
    </div>
  `;
}
function renderActiveDisplay() {
  const activeToolId2 = getActiveToolId();
  const activeBrushSize2 = getActiveBrushSize();
  const toolsByCategory2 = getToolsByCategory();
  let labelText = "No tool selected";
  if (activeToolId2) {
    const allTools = Array.from(toolsByCategory2.values()).flat();
    const tool = allTools.find((t) => t.id === activeToolId2);
    if (tool) {
      labelText = `${tool.icon} ${tool.name} (${activeBrushSize2}\xD7${activeBrushSize2})`;
    }
  }
  return `
    <div id="toolActiveDisplay">
      <span id="activeToolLabel">${labelText}</span>
    </div>
  `;
}
function renderToolList() {
  const activeCategory2 = getActiveCategory();
  const activeToolId2 = getActiveToolId();
  const toolsByCategory2 = getToolsByCategory();
  const tools = toolsByCategory2.get(activeCategory2) || [];
  if (tools.length === 0) {
    return `<div class="tool-empty">No tools in this category</div>`;
  }
  return tools.map((tool) => `
    <button class="tool-btn ${tool.id === activeToolId2 ? "active" : ""}" data-tool-id="${tool.id}">
      <span class="tool-icon">${tool.icon}</span>
      <span class="tool-name">${tool.name}</span>
    </button>
  `).join("");
}
function renderBrushSelector() {
  const activeBrushSize2 = getActiveBrushSize();
  return `
    <div id="toolBrushSize">
      <span>Brush:</span>
      ${brushSizes.map((size) => `
        <button class="brush-btn ${size === activeBrushSize2 ? "active" : ""}" data-size="${size}">
          ${size}\xD7${size}
        </button>
      `).join("")}
    </div>
  `;
}
function renderColorPanel() {
  const activeCategory2 = getActiveCategory();
  const activeColor2 = getActiveColor();
  const display = activeCategory2 === "color" ? "flex" : "none";
  return `
    <div id="toolColorPicker" style="display: ${display}">
      <span>Color:</span>
      <input type="color" id="colorPickerInput" value="${activeColor2}">
      <span id="colorHex">${activeColor2}</span>
    </div>
  `;
}
function renderAssetPanel() {
  const activeCategory2 = getActiveCategory();
  const activeAssetId2 = getActiveAssetId();
  const activeAssetSuffix2 = getActiveAssetSuffix();
  const filterState = getColorFilterState();
  const display = activeCategory2 === "asset" ? "block" : "none";
  return `
    <div id="assetBrowser" style="display: ${display}">
      ${renderSuffixSelector(activeAssetSuffix2)}
      ${renderFilterControls(filterState)}
      ${renderSelectedAssetCard(activeAssetId2, activeAssetSuffix2)}
      <div id="assetImageList"></div>
      ${renderAssetGroupList()}
    </div>
  `;
}
function renderSuffixSelector(activeSuffix) {
  return `
    <div id="suffixSelector">
      <span>Direction:</span>
      ${assetSuffixes.map((suffix) => `
        <button class="suffix-btn ${suffix === activeSuffix ? "active" : ""}" data-suffix="${suffix}">
          ${suffix.replace("_", "")}
        </button>
      `).join("")}
    </div>
  `;
}
function renderFilterControls(filterState) {
  return `
    <div id="assetFilterControls">
      <div class="filter-row">
        <span>Hue:</span>
        <input type="range" min="0" max="360" value="${filterState.hue}" class="filter-slider" data-filter="hue">
        <span class="filter-value">${filterState.hue}\xB0</span>
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
function renderSelectedAssetCard(activeAssetId2, activeAssetSuffix2) {
  const display = activeAssetId2 ? "block" : "none";
  const label = activeAssetId2 ? activeAssetId2 + activeAssetSuffix2 + buildFilterSuffix() : "No asset selected";
  return `
    <div id="selectedAssetCard" style="display: ${display}">
      <div id="selectedAssetPreview"></div>
      <span id="selectedAssetLabel">${label}</span>
    </div>
  `;
}
function renderAssetGroupList() {
  const assetGroups2 = getAssetGroups();
  const selectedAssetGroup2 = getSelectedAssetGroup();
  if (assetGroups2.length === 0) {
    return '<div class="asset-empty">Loading assets...</div>';
  }
  return `
    <div id="assetGroupList">
      <div class="asset-group-header">Asset Groups</div>
      ${assetGroups2.map((group) => `
        <button class="asset-group-btn ${group.group === selectedAssetGroup2 ? "active" : ""}" data-group="${group.group}">
          ${group.group} (${group.images.length})
        </button>
      `).join("")}
    </div>
  `;
}
function renderAssetImageList() {
  const assetGroups2 = getAssetGroups();
  const selectedAssetGroup2 = getSelectedAssetGroup();
  const activeAssetId2 = getActiveAssetId();
  if (!selectedAssetGroup2) {
    return '<div class="asset-empty">Select a group</div>';
  }
  const group = assetGroups2.find((g) => g.group === selectedAssetGroup2);
  if (!group) {
    return '<div class="asset-empty">Select a group</div>';
  }
  return `
    <div class="asset-image-header">${group.group}</div>
    <div class="asset-image-grid">
      ${group.images.map((image) => `
        <button class="asset-image-btn ${image === activeAssetId2 ? "active" : ""}" data-asset="${image}">
          ${image}
        </button>
      `).join("")}
    </div>
  `;
}
function renderBuildingPanel() {
  const activeCategory2 = getActiveCategory();
  const buildingGrowLoop2 = getBuildingGrowLoop();
  const buildingEndLoop2 = getBuildingEndLoop();
  const description = getActiveBuildingDescription();
  const display = activeCategory2 === "structure" ? "block" : "none";
  return `
    <div id="buildingConfigPanel" style="display: ${display}">
      <div id="buildingConfigHeader">
        <span id="buildingConfigTitle">Building Config</span>
      </div>
      <div id="buildingConfigSelector"></div>
      ${renderBuildingParams(buildingGrowLoop2, buildingEndLoop2)}
      <div id="buildingDescription">${description}</div>
    </div>
  `;
}
function renderBuildingParams(growLoop, endLoop) {
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
function renderBuildingConfigSelector() {
  const buildingConfigs2 = getBuildingConfigs();
  const activeBuildingConfigId2 = getActiveBuildingConfigId();
  if (buildingConfigs2.length === 0) {
    return '<div class="building-empty">Loading building configs...</div>';
  }
  return buildingConfigs2.map((config) => `
    <button class="tool-btn ${config.id === activeBuildingConfigId2 ? "active" : ""}" data-config-id="${config.id}">
      <span class="tool-name">${config.name}</span>
    </button>
  `).join("");
}
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// web/js/menu/toolMenuHandlers.ts
function handleToolList(tools, container) {
  clearToolsByCategory();
  const toolsByCategory2 = /* @__PURE__ */ new Map();
  for (const cat of ["terrain", "color", "asset", "structure", "inspect"]) {
    toolsByCategory2.set(cat, []);
  }
  for (const tool of tools) {
    const catTools = toolsByCategory2.get(tool.category);
    if (catTools) {
      catTools.push(tool);
    }
  }
  setToolsByCategory(toolsByCategory2);
  const toolMenuEl = container || document.getElementById("toolMenu");
  if (toolMenuEl) {
    updateToolListDOM(toolMenuEl);
  }
}
function handleToolExecuted(toolId, _success) {
  const toolMenuEl = document.getElementById("toolMenu");
  if (!toolMenuEl)
    return;
  const activeBtn = toolMenuEl.querySelector(`.tool-btn[data-tool-id="${toolId}"]`);
  if (activeBtn) {
    activeBtn.classList.add("executed");
    setTimeout(() => activeBtn.classList.remove("executed"), 200);
  }
}
function handlePickedColor(r, g, b) {
  const toolMenuEl = document.getElementById("toolMenu");
  if (!toolMenuEl)
    return;
  const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  const colorPickerInput = toolMenuEl.querySelector("#colorPickerInput");
  if (colorPickerInput) {
    colorPickerInput.value = hex;
  }
  const colorHexEl = toolMenuEl.querySelector("#colorHex");
  if (colorHexEl) {
    colorHexEl.textContent = hex;
  }
  setActiveColor(hex);
}
function handleAssetPreview(blobUrl) {
  const previewEl = document.getElementById("selectedAssetPreview");
  if (!previewEl)
    return;
  const oldImg = previewEl.querySelector("img");
  if (oldImg && oldImg.src.startsWith("blob:")) {
    URL.revokeObjectURL(oldImg.src);
  }
  previewEl.innerHTML = `<img src="${blobUrl}" class="asset-preview-img" alt="Asset Preview">`;
}
function handleAssetGroups(groups, container) {
  setAssetGroups(groups);
  if (groups.length > 0) {
    setSelectedAssetGroup(groups[0].group);
  }
  const toolMenuEl = container || document.getElementById("toolMenu");
  if (toolMenuEl && getActiveCategory() === "asset") {
    updateAssetBrowserDOM(toolMenuEl);
  }
}
function handleBuildingConfigList(configs, container) {
  setBuildingConfigs(configs);
  if (configs.length > 0) {
    setActiveBuildingConfigId(configs[0].id);
    setBuildingParams(configs[0].defaultGrowLoop, configs[0].defaultEndLoop);
  }
  const toolMenuEl = container || document.getElementById("toolMenu");
  if (toolMenuEl) {
    updateBuildingConfigDOM(toolMenuEl);
  }
}
function updateToolListDOM(container) {
  const toolListEl = container.querySelector("#toolList");
  if (!toolListEl)
    return;
  toolListEl.innerHTML = renderToolList();
}
function updateAssetBrowserDOM(container) {
  const assetGroupListEl = container.querySelector("#assetGroupList");
  const assetImageListEl = container.querySelector("#assetImageList");
  if (assetGroupListEl) {
    assetGroupListEl.innerHTML = renderAssetGroupList();
  }
  if (assetImageListEl) {
    assetImageListEl.innerHTML = renderAssetImageList();
  }
}
function updateBuildingConfigDOM(container) {
  const selectorEl = container.querySelector("#buildingConfigSelector");
  if (!selectorEl)
    return;
  selectorEl.innerHTML = renderBuildingConfigSelector();
}

// web/js/menu/toolMenu.ts
var initToolMenu = (gameWorker2) => {
  const toolMenuEl = document.getElementById("toolMenu");
  if (!toolMenuEl)
    return;
  renderToolMenu(toolMenuEl);
  wireEventHandlers(toolMenuEl, gameWorker2);
};
function wireEventHandlers(container, gameWorker2) {
  container.querySelectorAll(".category-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const category = tab.dataset.category;
      handleCategoryChange(category, container, gameWorker2);
    });
  });
  const colorPickerInput = container.querySelector("#colorPickerInput");
  if (colorPickerInput) {
    colorPickerInput.addEventListener("input", (e) => {
      const color = e.target.value;
      handleColorChange(color, container, gameWorker2);
    });
  }
  container.querySelectorAll(".brush-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = parseInt(btn.dataset.size);
      handleBrushSizeChange(size, container, gameWorker2);
    });
  });
  container.querySelectorAll(".suffix-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const suffix = btn.dataset.suffix;
      handleSuffixChange(suffix, container, gameWorker2);
    });
  });
  container.querySelectorAll(".filter-slider").forEach((slider) => {
    slider.addEventListener("input", (e) => {
      const input = e.target;
      handleFilterChange(input, container, gameWorker2);
    });
  });
  const resetFiltersBtn = container.querySelector("#resetFiltersBtn");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      handleFilterReset(container, gameWorker2);
    });
  }
  renderToolListDOM(container, gameWorker2);
}
function handleCategoryChange(category, container, gameWorker2) {
  setActiveCategory(category);
  container.querySelectorAll(".category-tab").forEach((tab) => {
    const tabCat = tab.dataset.category;
    tab.classList.toggle("active", tabCat === category);
  });
  updatePanelVisibility(container, category);
  renderToolListDOM(container, gameWorker2);
  if (category === "asset") {
    renderAssetBrowserDOM(container, gameWorker2);
  }
  if (category === "structure") {
    initBuildingConfigHandlers(container, gameWorker2);
  }
}
function handleColorChange(color, container, gameWorker2) {
  setActiveColor(color);
  const colorHexEl = container.querySelector("#colorHex");
  if (colorHexEl) {
    colorHexEl.textContent = color;
  }
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  gameWorker2.postMessage({
    action: "setColor",
    r,
    g,
    b
  });
}
function handleBrushSizeChange(size, container, gameWorker2) {
  setActiveBrushSize(size);
  container.querySelectorAll(".brush-btn").forEach((btn) => {
    const btnSize = parseInt(btn.dataset.size);
    btn.classList.toggle("active", btnSize === size);
  });
  gameWorker2.postMessage({
    action: "setBrushSize",
    size
  });
}
function handleSuffixChange(suffix, container, gameWorker2) {
  setActiveAssetSuffix(suffix);
  container.querySelectorAll(".suffix-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.suffix === suffix);
  });
  const activeAssetId2 = getActiveAssetId();
  if (activeAssetId2) {
    const fullKey = buildFullAssetKey(activeAssetId2);
    gameWorker2.postMessage({
      action: "setActiveAsset",
      assetId: fullKey
    });
  }
}
function handleFilterChange(input, _container, gameWorker2) {
  const filter = input.dataset.filter;
  const value = parseInt(input.value);
  switch (filter) {
    case "hue":
      setActiveHue(value);
      break;
    case "saturation":
      setActiveSaturation(value);
      break;
    case "contrast":
      setActiveContrast(value);
      break;
    case "brightness":
      setActiveBrightness(value);
      break;
  }
  const valueEl = input.nextElementSibling;
  if (valueEl) {
    valueEl.textContent = filter === "hue" ? `${value}\xB0` : `${value}`;
  }
  const activeAssetId2 = getActiveAssetId();
  if (activeAssetId2) {
    const fullKey = buildFullAssetKey(activeAssetId2);
    gameWorker2.postMessage({
      action: "setActiveAsset",
      assetId: fullKey
    });
  }
}
function handleFilterReset(container, gameWorker2) {
  resetColorFilters();
  const hueSlider = container.querySelector('[data-filter="hue"]');
  const satSlider = container.querySelector('[data-filter="saturation"]');
  const conSlider = container.querySelector('[data-filter="contrast"]');
  const brtSlider = container.querySelector('[data-filter="brightness"]');
  if (hueSlider)
    hueSlider.value = "0";
  if (satSlider)
    satSlider.value = "100";
  if (conSlider)
    conSlider.value = "100";
  if (brtSlider)
    brtSlider.value = "100";
  const hueValue = hueSlider?.nextElementSibling;
  const satValue = satSlider?.nextElementSibling;
  const conValue = conSlider?.nextElementSibling;
  const brtValue = brtSlider?.nextElementSibling;
  if (hueValue)
    hueValue.textContent = "0\xB0";
  if (satValue)
    satValue.textContent = "100";
  if (conValue)
    conValue.textContent = "100";
  if (brtValue)
    brtValue.textContent = "100";
  const activeAssetId2 = getActiveAssetId();
  if (activeAssetId2) {
    gameWorker2.postMessage({
      action: "setActiveAsset",
      assetId: activeAssetId2 + getActiveAssetSuffix()
    });
  }
}
function updatePanelVisibility(container, category) {
  const colorPickerEl = container.querySelector("#toolColorPicker");
  if (colorPickerEl) {
    colorPickerEl.style.display = category === "color" ? "flex" : "none";
  }
  const assetBrowserEl = container.querySelector("#assetBrowser");
  if (assetBrowserEl) {
    assetBrowserEl.style.display = category === "asset" ? "block" : "none";
  }
  const suffixSelectorEl = container.querySelector("#suffixSelector");
  if (suffixSelectorEl) {
    suffixSelectorEl.style.display = category === "asset" ? "flex" : "none";
  }
  const buildingConfigEl = container.querySelector("#buildingConfigPanel");
  if (buildingConfigEl) {
    buildingConfigEl.style.display = category === "structure" ? "block" : "none";
  }
}
function renderToolListDOM(container, gameWorker2) {
  const toolListEl = container.querySelector("#toolList");
  if (!toolListEl)
    return;
  toolListEl.innerHTML = renderToolList();
  toolListEl.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const toolId = btn.dataset.toolId;
      handleToolSelect(toolId, container, gameWorker2);
    });
  });
}
function handleToolSelect(toolId, container, gameWorker2) {
  setActiveToolId(toolId);
  container.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.toolId === toolId);
  });
  gameWorker2.postMessage({
    action: "setActiveTool",
    toolId
  });
}
function renderAssetBrowserDOM(container, gameWorker2) {
  const assetGroupListEl = container.querySelector("#assetGroupList");
  const assetImageListEl = container.querySelector("#assetImageList");
  if (!assetGroupListEl || !assetImageListEl)
    return;
  assetGroupListEl.innerHTML = renderAssetGroupList();
  assetGroupListEl.querySelectorAll(".asset-group-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.group;
      setSelectedAssetGroup(group);
      renderAssetBrowserDOM(container, gameWorker2);
    });
  });
  assetImageListEl.innerHTML = renderAssetImageList();
  assetImageListEl.querySelectorAll(".asset-image-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const assetId = btn.dataset.asset;
      handleAssetSelect(assetId, container, gameWorker2);
    });
  });
}
function handleAssetSelect(assetId, container, gameWorker2) {
  setActiveAssetId(assetId);
  const selectedAssetCardEl = container.querySelector("#selectedAssetCard");
  const selectedAssetLabelEl = container.querySelector("#selectedAssetLabel");
  if (selectedAssetCardEl && selectedAssetLabelEl) {
    selectedAssetCardEl.style.display = "block";
    const fullKey2 = buildFullAssetKey(assetId);
    selectedAssetLabelEl.textContent = fullKey2;
  }
  container.querySelectorAll(".asset-image-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.asset === assetId);
  });
  const fullKey = buildFullAssetKey(assetId);
  gameWorker2.postMessage({
    action: "setActiveAsset",
    assetId: fullKey
  });
}
function initBuildingConfigHandlers(container, gameWorker2) {
  renderBuildingConfigSelectorDOM(container, gameWorker2);
  const growLoopSlider = container.querySelector("#growLoopSlider");
  if (growLoopSlider) {
    growLoopSlider.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      handleBuildingParamChange("growLoop", value, container, gameWorker2);
    });
  }
  const endLoopSlider = container.querySelector("#endLoopSlider");
  if (endLoopSlider) {
    endLoopSlider.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      handleBuildingParamChange("endLoop", value, container, gameWorker2);
    });
  }
}
function renderBuildingConfigSelectorDOM(container, gameWorker2) {
  const selectorEl = container.querySelector("#buildingConfigSelector");
  if (!selectorEl)
    return;
  selectorEl.innerHTML = renderBuildingConfigSelector();
  selectorEl.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const configId = btn.dataset.configId;
      handleBuildingConfigSelect(configId, container, gameWorker2);
    });
  });
}
function handleBuildingConfigSelect(configId, container, gameWorker2) {
  setActiveBuildingConfigId(configId);
  const configs = getBuildingConfigs();
  const config = configs.find((c) => c.id === configId);
  if (config) {
    setBuildingParams(config.defaultGrowLoop, config.defaultEndLoop);
    const growLoopSlider = container.querySelector("#growLoopSlider");
    const endLoopSlider = container.querySelector("#endLoopSlider");
    const growLoopValue = container.querySelector("#growLoopValue");
    const endLoopValue = container.querySelector("#endLoopValue");
    if (growLoopSlider)
      growLoopSlider.value = String(config.defaultGrowLoop);
    if (endLoopSlider)
      endLoopSlider.value = String(config.defaultEndLoop);
    if (growLoopValue)
      growLoopValue.textContent = String(config.defaultGrowLoop);
    if (endLoopValue)
      endLoopValue.textContent = String(config.defaultEndLoop);
  }
  gameWorker2.postMessage({
    action: "setBuildingConfig",
    configId
  });
  container.querySelectorAll("#buildingConfigSelector .tool-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.configId === configId);
  });
  const descriptionEl = container.querySelector("#buildingDescription");
  if (descriptionEl) {
    descriptionEl.textContent = getActiveBuildingDescription();
  }
}
function handleBuildingParamChange(param, value, container, gameWorker2) {
  const growLoop = param === "growLoop" ? value : getBuildingGrowLoop();
  const endLoop = param === "endLoop" ? value : getBuildingEndLoop();
  setBuildingParams(growLoop, endLoop);
  const valueEl = container.querySelector(`#${param === "growLoop" ? "growLoopValue" : "endLoopValue"}`);
  if (valueEl)
    valueEl.textContent = String(value);
  gameWorker2.postMessage({
    action: "setBuildingParams",
    growLoop,
    endLoop
  });
}

// web/js/menu/InfoMenu.ts
var infoMenu = (_gameWorker) => {
  document.getElementById("infoMenu").innerHTML = `
      <div id="infoCell"></div>
    `;
};
var updateInfoCell = (message) => {
  const tileInfo = message.data;
  const s = `

  <div># ----- [ ${tileInfo.x} | ${tileInfo.y} ] </div>
  ${updateInfoWcBuildTile(tileInfo.wcBuildTile)}

  `;
  document.getElementById("infoCell").innerHTML = s;
};
var updateInfoWcBuildTile = (infoWcBuild) => {
  if (!infoWcBuild) {
    return "";
  }
  const pFaces = infoWcBuild.possibleFace;
  const table = pFaces === void 0 ? "" : `
  <div class="gridFaces">
    ${pFaces.map(
    (face) => face.map((axe) => `<div>${axe}</div>`).join("")
  ).join("")}
  </div>
  `;
  const cFaces = infoWcBuild.computePosibleFace;
  const ctable = cFaces === void 0 ? "" : `
  <div class="gridFaces">
    ${cFaces.map(
    (face) => face.map((axe) => `<div>${axe}</div>`).join("")
  ).join("")}
  </div>
  `;
  const s = `
  <div># isConfigured: ${infoWcBuild.isFaceConfigured} </div>

  <div># confType: ${infoWcBuild.isFaceConfiguredType} </div>

  <hr>
  <div># Possible Face: </div>
  ${table}

  <hr>
  <div># ComputedFace: </div>
  ${ctable}
  `;
  return s;
};

// web/js/gobalState.ts
var GlobalStateClass = class {
  mode = "MiniMap";
  x = 100;
  y = 400;
  miniMap = {
    definition: 4,
    zoom: 32,
    ShowB: true,
    ShowL: false,
    ShowLB: false,
    ShowT: false,
    ShowH: false
  };
  map = {
    definition: 30,
    tileScaleMod: 3 / 2
  };
  constructor() {
  }
  update(conf) {
    this.x = conf.x;
    this.y = conf.y;
    this.mode = conf.mode;
    this.miniMap = conf.miniMap;
    this.map = conf.map;
  }
};
var GlobalState = new GlobalStateClass();
function getElementInputValue(selector, defaultValue = "") {
  return document.querySelector(selector)?.value || defaultValue;
}
function setElementInputValue(selector, value = "") {
  const elm = document.querySelector(selector);
  if (elm) {
    elm.value = value;
  }
}
function getElementCheckBoxValue(selector, defaultValue = false) {
  return document.querySelector(selector)?.checked || defaultValue;
}
function getGlobalJSON() {
  const mode = getElementInputValue('input[name="mode"]:checked', "");
  const x = getElementInputValue("#xInput", "0");
  const y = getElementInputValue("#yInput", "0");
  return {
    mode,
    x: Number(x),
    y: Number(y),
    miniMap: {
      definition: Number(getElementInputValue("#miniMap-definition", "1")),
      zoom: Number(getElementInputValue("#miniMap-zoomSelect", "1")),
      ShowB: getElementCheckBoxValue("#miniMap-ShowB"),
      ShowL: getElementCheckBoxValue("#miniMap-ShowL"),
      ShowLB: getElementCheckBoxValue("#miniMap-ShowLB"),
      ShowT: getElementCheckBoxValue("#miniMap-ShowT"),
      ShowH: getElementCheckBoxValue("#miniMap-ShowH")
    },
    map: {
      definition: Number(getElementInputValue("#map-definition", "1")),
      tileScaleMod: Number(getElementInputValue("#map-scale-mod", "1"))
    }
  };
}
function updatGlobalJSON(data) {
  console.log("updatGlobalJSON", data);
  GlobalState.update(data);
  const dataString = JSON.stringify(data, null, 2);
  setElementInputValue("#GlobalJson", dataString);
  if (data.mode) {
    const modeInput = document.querySelector(
      `input[name="mode"][value="${data.mode}"]`
    );
    if (modeInput)
      modeInput.checked = true;
  }
  if (typeof data.x !== "undefined") {
    setElementInputValue("#xInput", String(data.x));
  }
  if (typeof data.y !== "undefined") {
    setElementInputValue("#yInput", String(data.y));
  }
  if (typeof data.miniMap.zoom !== "undefined") {
    setElementInputValue("#miniMap-zoomSelect", String(data.miniMap.zoom));
  }
  if (typeof data.miniMap.definition !== "undefined") {
    setElementInputValue(
      "#miniMap-definition",
      String(data.miniMap.definition)
    );
  }
  if (typeof data.map.definition !== "undefined") {
    setElementInputValue("#map-definition", String(data.map.definition));
  }
  if (typeof data.map.tileScaleMod !== "undefined") {
    setElementInputValue("#map-scale-mod", String(data.map.tileScaleMod));
  }
}
function toggelDisplayMode(actifElmId, elmClass) {
  console.log("toggelDisplayMode", actifElmId, elmClass);
  const actifElm = document.getElementById(actifElmId);
  if (!actifElm)
    return;
  const divMiniMap = document.getElementById(actifElmId);
  Array.from(document.getElementsByClassName(elmClass)).filter(
    (elm) => elm !== divMiniMap
  ).forEach((elm) => elm.style.display = "none");
  actifElm.style.display = "flex";
}
function updatFormEvent() {
  const getState = getGlobalJSON();
  console.log("updatFormEvent", getState);
  GlobalState.update(getState);
  const dataString = JSON.stringify(GlobalState, null, 2);
  const elm = document.getElementById("GlobalJson");
  if (elm)
    elm.value = dataString;
  if (GlobalState.mode == "MiniMap") {
    toggelDisplayMode("paramsMiniMap", "paramsOption");
    toggelDisplayMode("displayMiniMap", "displayOption");
  }
  if (GlobalState.mode == "Map") {
    toggelDisplayMode("paramsMap", "paramsOption");
    toggelDisplayMode("displayMap", "displayOption");
  }
}
function initMenu() {
  const form = (
    /*html*/
    `
    <form>

    <!-- X and Y Input -->
    <div>           
      <label>X: <input type="number" id="xInput" value="0"></label>
    </div>
    <div>           
      <label>Y: <input type="number" id="yInput" value="200"></label>
    </div>
    <hr>

    <!-- Radio buttons for mode selection -->
    <div>           
      <label>
        <input type="radio" name="mode" value="MiniMap" checked> MiniMap
      </label>
      <label>
        <input type="radio" name="mode" value="Map"> Map
      </label>
    </div>
    <hr>

    <!-- ===MiniMap -->
    <div id="paramsMiniMap" class="paramsOption" style="flex-direction: column;text-align: left;">

      <!-- Definition -->
      <div>           
        <label>Definition:
          <select id="miniMap-definition">
            <option value="1">1px</option>
            <option value="2">2px</option>
            <option value="4" selected>4px</option>
            <option value="8">8px</option>
          </select>
        </label>
      </div>

      <!-- Zoom Select -->
      <div>           
        <label>Zoom:
          <select id="miniMap-zoomSelect">
            <option value="1">1 Tile</option>
            <option value="4">4 Tile</option>
            <option value="8">8 Tile</option>
            <option value="16">16 Tile</option>
            <option value="32" selected>32 Tile (1-Chuck)</option>
            <option value="64">2 Chuck</option>
            <option value="128">4 Chuck</option>
            <option value="256">8 Chuck</option>
          </select>
        </label>
      </div>
      <h5>SHOW:</h5>
      <div>           
        <label>
          <input type="checkbox" id="miniMap-ShowB" value="true" checked> Show Biome
        </label>
        <label>
          <input type="checkbox" id="miniMap-ShowL" value="true"> Show LVL
        </label>
        <label>
          <input type="checkbox" id="miniMap-ShowLB" value="true"> Show LVL Biome
        </label>
        <label>
          <input type="checkbox" id="miniMap-ShowT" value="true"> Show Temperature
        </label>
        <label>
          <input type="checkbox" id="miniMap-ShowH" value="true"> Show Hidromety
        </label>
      </div>

      
  </div> <!-- MiniMap Param -->
  <!-- === Map -->
  <div id="paramsMap"  class="paramsOption"style="display:none; flex-direction: column;text-align: left;">
      <!-- Definition -->
      <div>           
        <label>Definition:
          <select id="map-definition">
            <option value="20">20 Tiles</option>
            <option value="30" selected>30 Tiles</option>
            <option value="40" >40 Tiles</option>
            <option value="80">80 Tiles</option>
            <option value="160">160 Tiles</option>
          </select>
        </label>
      </div>
    
      <!-- Definition -->
      <div>           
        <label>Tile Scale Mod:
          <select id="map-scale-mod">
            <option value="1" selected >No Zoom</option>
            <option value="4" > % 4 Tiles</option>
            <option value="16" >% 16 Tiles</option>
            <option value="32"> % 32 Tiles</option>
            <option value="64"> % 64 Tiles</option>
            <option value="128"> % 128 Tiles</option>
          </select>
        </label>
      </div>
  </div> <!-- Map Param -->

  </form>
  `
  );
  const elm = document.getElementById("menuMapFrom");
  if (elm) {
    elm.innerHTML = form;
    elm.addEventListener("input", updatFormEvent);
  }
}

// IsoGame/mapIso/simpleIso/IsometricProjector.ts
var ISO_LVL_SCALE = 39;
var LVL_Z_SCALE_FACTOR = 1 / 3;
var PointIso = class _PointIso {
  x;
  y;
  z;
  static ORIGIN = new _PointIso(0, 0, 0);
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  /** Translate a point from a given dx, dy, and dz */
  translate(dx = 0, dy = 0, dz = 0) {
    return new _PointIso(this.x + dx, this.y + dy, this.z + dz);
  }
  // NOTE: Other Point methods (scale, rotateX/Y/Z, depth) are omitted for simplicity 
  // as they were not directly used in the projection logic, but can be added back if needed.
  depth() {
    return this.x + this.y - 2 * this.z;
  }
};
var IsometricConfDefaults = {
  SCALE_SIZE: 1,
  // Base scale for 1x1 tile size
  SCALE_MOD: 1,
  // Scale modifier (often unused in projection)
  ISO_LVL_SCALE: 39,
  // Z-axis scale factor (from original isomer.ts)
  originX: 0,
  // X-offset for the map origin
  originY: 660,
  // Fixed Y-offset for the map origin (from original isomer.ts)
  offsetX: 0,
  // Panning offset X
  offsetY: 0
  // Panning offset Y
};
var IsometricProjector = class {
  conf;
  transformation;
  /**
   * Initializes the projector.
   * @param overrides Optional partial configuration to override defaults.
   */
  constructor(overrides = {}) {
    this.conf = { ...IsometricConfDefaults, ...overrides };
    this.updateConf();
  }
  updateConf(overrides = {}) {
    this.conf = { ...this.conf, ...overrides };
    this.transformation = [
      [32 * this.conf.SCALE_SIZE, 16 * this.conf.SCALE_SIZE],
      // ISOSCALE * Math.cos(this.angle), ISOSCALE * Math.sin(this.angle)
      [-32 * this.conf.SCALE_SIZE, 16 * this.conf.SCALE_SIZE]
      // ISOSCALE * Math.cos(Math.PI - this.angle), ISOSCALE * Math.sin(Math.PI - this.angle)
    ];
  }
  /**
   * Projects a 3D Point to 2D screen coordinates.
   * This is the core 3D -> 2D isometric translation function.
   * * @param point The 3D Point object to translate.
   * @returns An object containing the projected screen coordinates { x: number, y: number }.
   */
  /**
   * Translates a 3D point to a 2D isometric projection.
   */
  translatePoint(_point) {
    const point = _point.translate(-this.conf.offsetX, -this.conf.offsetY, 0);
    const xMap = new PointIso(
      point.x * this.transformation[0][0],
      point.x * this.transformation[0][1]
    );
    const yMap = new PointIso(
      point.y * this.transformation[1][0],
      point.y * this.transformation[1][1]
    );
    const x = this.conf.originX + xMap.x + yMap.x;
    const y = this.conf.originY - xMap.y - yMap.y - point.z * ISO_LVL_SCALE / this.conf.SCALE_MOD;
    return new PointIso(x, y);
  }
  /**
   * Converts tile coordinates to screen coordinates.
   * Wrapper around translatePoint for clarity in hover rendering and edge detection.
   * @param tileX The tile X coordinate.
   * @param tileY The tile Y coordinate.
   * @param tileZ The tile Z (height) coordinate. Defaults to 0.
   * @returns Screen coordinates as { x: number, y: number }.
   */
  tileToScreen(isoPoint) {
    const point = this.translatePoint(isoPoint);
    return { x: point.x, y: point.y };
  }
  /**
   * Converts 2D screen coordinates back to 3D tile coordinates (inverse projection).
   * @param screenX The screen X coordinate.
   * @param screenY The screen Y coordinate.
   * @param tileZ The known tile Z (height) coordinate. Defaults to 0.
   * @returns The tile coordinates as a PointIso, or null if computation fails.
   */
  screenToTile(screenX, screenY, tileZ = 0) {
    const { originX, originY, offsetX, offsetY, SCALE_SIZE, SCALE_MOD } = this.conf;
    const sx = 32 * SCALE_SIZE;
    const sy = 16 * SCALE_SIZE;
    const adjustedDx = screenX - originX;
    const adjustedDy = originY - screenY - tileZ * ISO_LVL_SCALE / SCALE_MOD;
    const tileXRaw = (adjustedDx / sx + adjustedDy / sy) / 2;
    const tileYRaw = (adjustedDy / sy - adjustedDx / sx) / 2;
    const tileX = Math.floor(tileXRaw + offsetX);
    const tileY = Math.floor(tileYRaw + offsetY);
    return new PointIso(tileX, tileY, tileZ);
  }
  /**
   * Pour un tile candidat, retourne le screenY le plus haut
   * sur le bord du losange à un screenX précis.
   * Utile pour savoir si la souris est "au-dessus" du tile à cet X.
   */
  _getTileTopScreenYAtX(tile, screenX) {
    const { x: tx, y: ty, z } = tile;
    const top = this.translatePoint(new PointIso(tx, ty, z));
    const right = this.translatePoint(new PointIso(tx + 1, ty, z));
    const left = this.translatePoint(new PointIso(tx, ty + 1, z));
    const interpY = (ax, ay, bx, by) => {
      const dx = bx - ax;
      if (Math.abs(dx) < 1e-3)
        return null;
      const t = (screenX - ax) / dx;
      if (t < 0 || t > 1)
        return null;
      return ay + t * (by - ay);
    };
    const y1 = interpY(top.x, top.y, right.x, right.y);
    const y2 = interpY(top.x, top.y, left.x, left.y);
    const candidates = [y1, y2].filter((y) => y !== null);
    if (candidates.length === 0)
      return null;
    return Math.min(...candidates);
  }
  screenToTileWithHeight2(screenX, screenY, mapLvl, mapSize, mapInfo) {
    const { originX, originY, offsetX, offsetY, SCALE_SIZE, SCALE_MOD } = this.conf;
    const sx = 32 * SCALE_SIZE;
    const sy = 16 * SCALE_SIZE;
    const avgLvl = mapInfo[8];
    console.log(avgLvl);
    const candidates = [];
    const ratio = ISO_LVL_SCALE / SCALE_MOD / (2 * sy);
    for (let ty = 0; ty < mapSize; ty++) {
      for (let tx = 0; tx < mapSize; tx++) {
        const z = mapLvl[ty * mapSize + tx];
        const LVL_DISPLAY_SCALE = LVL_Z_SCALE_FACTOR * this.conf.SCALE_SIZE / this.conf.SCALE_MOD;
        const currentlvl = (z - avgLvl) * LVL_DISPLAY_SCALE;
        const cx = originX + sx * (tx - offsetX - (ty - offsetY));
        if (Math.abs(screenX - cx) > sx)
          continue;
        candidates.push(new PointIso(tx, ty, z));
      }
    }
    candidates.sort((a, b) => {
      const da = a.x + a.y - 2 * a.z * ratio;
      const db = b.x + b.y - 2 * b.z * ratio;
      return da - db;
    });
    const project = (px, py, z) => {
      const p = this.translatePoint(new PointIso(px, py, z));
      return { x: p.x, y: p.y };
    };
    for (const tile of candidates) {
      const topY = this._getTileTopScreenYAtX(tile, screenX);
      if (topY !== null && screenY >= topY) {
        console.log(`Tile (${tile.x}, ${tile.y}, z=${tile.z}) has topY at screenX=${screenY}: ${topY}`);
        return tile;
      }
    }
    return null;
  }
  _isPointInTileFace(tile, screenX, screenY) {
    const { x: tx, y: ty, z } = tile;
    const top = this.translatePoint(new PointIso(tx, ty, z));
    const right = this.translatePoint(new PointIso(tx + 1, ty, z));
    const bottom = this.translatePoint(new PointIso(tx + 1, ty + 1, z));
    const left = this.translatePoint(new PointIso(tx, ty + 1, z));
    const cx = (top.x + bottom.x) / 2;
    const topY = top.y;
    const botY = bottom.y;
    const halfW = (right.x - left.x) / 2;
    const cy = (topY + botY) / 2;
    const halfH = (botY - topY) / 2;
    const u = (screenX - cx) / halfW;
    const v = (screenY - cy) / halfH;
    if (Math.abs(u) + Math.abs(v) <= 1)
      return true;
    const wallHeight = halfH;
    if (Math.abs(u) <= 1 && v > 1 && v <= 1 + wallHeight / halfH)
      return true;
    return false;
  }
  screenToTileWithHeight(screenX, screenY, mapLvl, mapSize, mapInfo) {
    const { originX, offsetX, offsetY, SCALE_SIZE, SCALE_MOD } = this.conf;
    const sx = 32 * SCALE_SIZE;
    const avgLvl = mapInfo[8];
    const ratio = ISO_LVL_SCALE / SCALE_MOD / (2 * 16 * SCALE_SIZE);
    const candidates = [];
    for (let ty = 0; ty < mapSize; ty++) {
      for (let tx = 0; tx < mapSize; tx++) {
        const z = mapLvl[tx * mapSize + ty];
        const cx = originX + sx * (tx - offsetX - (ty - offsetY));
        if (Math.abs(screenX - cx) > sx)
          continue;
        candidates.push(new PointIso(tx, ty, z));
      }
    }
    candidates.sort((a, b) => {
      const da = a.x + a.y - 2 * a.z * ratio;
      const db = b.x + b.y - 2 * b.z * ratio;
      return db - da;
    });
    for (const tile of candidates) {
      if (this._isPointInTileFace(tile, screenX, screenY)) {
        return tile;
      }
    }
    return null;
  }
  /**
   * Gets the list of tile coordinates along a NE-SW diagonal (x - y = constant) 
   * passing through a given mouse position.
   * @param screenX The screen X coordinate of the mouse.
   * @param screenY The screen Y coordinate of the mouse.
   * @param mapSize The size of the map grid (width and height).
   * @returns An array of PointIso objects representing the tile coordinates along the diagonal.
   */
  getNESWDiagonalCoords(screenX, screenY, mapSize) {
    const coords = [];
    const tile = this.screenToTile(screenX, screenY, 0);
    if (!tile)
      return coords;
    const xx = Math.round(tile.x);
    const yy = Math.round(tile.y);
    const diagConstant = xx - yy;
    const maxDx = mapSize - 1 - xx;
    const minDx = -xx;
    const minDxGy = -yy;
    const maxDxGy = mapSize - 1 - yy;
    const finalMinDx = Math.max(minDx, minDxGy);
    const finalMaxDx = Math.min(maxDx, maxDxGy);
    for (let dx = finalMinDx + 1; dx < finalMaxDx; dx++) {
      const gx = xx + dx;
      const gy = yy + dx;
      coords.push(new PointIso(gx, gy));
    }
    return coords;
  }
};

// IsoGame/mapIso/canvasClickHandler.ts
var CanvasClickHandler = class {
  // Dependencies
  canvas;
  mapLvl;
  mapInfo;
  gameWorker;
  // Inverse projection
  projector;
  mapSize;
  // Hover state
  lastHoveredTile = null;
  lastHoveredGridTile = null;
  hoverCallback;
  // Bound event handlers for cleanup
  boundClickHandler;
  boundMouseMoveHandler;
  boundMouseLeaveHandler;
  constructor(deps) {
    this.canvas = deps.canvas;
    this.mapLvl = deps.mapLvl;
    this.mapInfo = deps.mapInfo;
    this.gameWorker = deps.gameWorker;
    this.mapSize = deps.conf.DRAW_TILE_COUNT;
    this.projector = new IsometricProjector({
      originX: this.canvas.width / 2,
      originY: this.canvas.height / 2 + this.mapSize * 16 * deps.conf.SCALE_SIZE,
      SCALE_SIZE: deps.conf.SCALE_SIZE,
      SCALE_MOD: deps.conf.SCALE_MOD
    });
    this.boundClickHandler = this.handleClick.bind(this);
    this.boundMouseMoveHandler = this.handleMouseMove.bind(this);
    this.boundMouseLeaveHandler = this.handleMouseLeave.bind(this);
    this.setupEventListeners();
    console.log("[CanvasClickHandler] Initialized with config:", deps.conf);
  }
  // ============================================================================
  // Event Listener Setup
  // ============================================================================
  setupEventListeners() {
    this.canvas.addEventListener("click", this.boundClickHandler);
    this.canvas.addEventListener("mousemove", this.boundMouseMoveHandler);
    this.canvas.addEventListener("mouseleave", this.boundMouseLeaveHandler);
    this.canvas.style.cursor = "pointer";
    console.log("[CanvasClickHandler] Event listeners attached");
  }
  // ============================================================================
  // Coordinate Conversion
  // ============================================================================
  /**
   * Converts mouse event coordinates to canvas-relative screen coordinates.
   * Accounts for CSS scaling of the canvas element.
   */
  eventToScreenCoords(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const screenX = (event.clientX - rect.left) * scaleX;
    const screenY = (event.clientY - rect.top) * scaleY;
    return { screenX, screenY };
  }
  /**
   * Converts screen coordinates to tile coordinates using inverse projection.
   * Uses the shared mapLvl buffer to look up tile heights.
   */
  screenToTile(screenX, screenY) {
    const result = this.projector.screenToTileWithHeight(
      screenX,
      screenY,
      this.mapLvl,
      this.mapSize,
      this.mapInfo
    );
    if (result === null) {
      return null;
    }
    return result;
  }
  // ============================================================================
  // Event Handlers
  // ============================================================================
  handleClick(event) {
    const { screenX, screenY } = this.eventToScreenCoords(event);
    const tile = this.screenToTile(screenX, screenY);
    if (!tile) {
      console.log("[CanvasClickHandler] Click outside map bounds");
      return;
    }
    const gridX = Math.round(tile.x);
    const gridY = Math.round(tile.y);
    console.log(`[CanvasClickHandler] Click at tile (${gridX}, ${gridY}), height: ${tile.z}`);
    this.gameWorker.postMessage({
      action: "query_infoCell",
      gridX,
      gridY
    });
    this.gameWorker.postMessage({
      action: "toolClick",
      gridX,
      gridY
    });
  }
  handleMouseMove(event) {
    const { screenX, screenY } = this.eventToScreenCoords(event);
    const tile = this.screenToTile(screenX, screenY);
    if (tile) {
      if (this.hasTileChanged(tile)) {
        this.lastHoveredTile = tile;
        if (this.hoverCallback) {
          this.hoverCallback(tile);
        }
        console.log(`[CanvasClickHandler] Hovering tile (${tile.x.toFixed(2)}, ${tile.y.toFixed(2)}), height: ${tile.z.toFixed(2)})`);
      }
    }
  }
  handleMouseLeave() {
    if (this.lastHoveredTile !== null) {
      this.lastHoveredTile = null;
      if (this.hoverCallback) {
        this.hoverCallback(null);
      }
      console.log("[CanvasClickHandler] Mouse left canvas");
    }
  }
  // ============================================================================
  // Helper Methods
  // ============================================================================
  /**
   * Compares two tile coordinates to detect changes.
   * Returns true if tiles are different.
   */
  hasTileChanged(newTile) {
    if (this.lastHoveredTile === null && newTile === null) {
      return false;
    }
    if (this.lastHoveredTile === null || newTile === null) {
      return true;
    }
    const lastX = Math.round(this.lastHoveredTile.x);
    const lastY = Math.round(this.lastHoveredTile.y);
    const newX = Math.round(newTile.x);
    const newY = Math.round(newTile.y);
    return lastX !== newX || lastY !== newY;
  }
  // ============================================================================
  // Public API
  // ============================================================================
  /**
   * Sets a callback function to be called when the hovered tile changes.
   * @param callback Function that receives the new tile or null if no tile is hovered.
   */
  setHoverCallback(callback) {
    this.hoverCallback = callback;
  }
  /**
   * Updates the shared buffer references.
   * Call this if the buffers are recreated or swapped.
   */
  updateMapData(mapLvl, mapInfo) {
    this.mapLvl = mapLvl;
    this.mapInfo = mapInfo;
  }
  /**
   * Updates the projector configuration.
   * Call this if SCALE_SIZE or SCALE_MOD changes.
   */
  updateConfig(conf) {
    this.mapSize = conf.DRAW_TILE_COUNT;
    this.projector.updateConf({
      originX: this.canvas.width / 2,
      originY: this.canvas.height / 2 + this.mapSize * 16 * conf.SCALE_SIZE,
      SCALE_SIZE: conf.SCALE_SIZE,
      SCALE_MOD: conf.SCALE_MOD
    });
  }
  /**
   * Returns the current hovered tile coordinates.
   */
  getLastHoveredTile() {
    return this.lastHoveredTile;
  }
  /**
   * Removes all event listeners and cleans up resources.
   * Call this before destroying the handler.
   */
  destroy() {
    this.canvas.removeEventListener("click", this.boundClickHandler);
    this.canvas.removeEventListener("mousemove", this.boundMouseMoveHandler);
    this.canvas.removeEventListener("mouseleave", this.boundMouseLeaveHandler);
    this.canvas.style.cursor = "";
    this.hoverCallback = void 0;
    this.lastHoveredTile = null;
  }
};

// IsoGame/mapIso/grid.ts
var GridMapDrawers = class {
  // Dependencies
  gameWorker;
  bufferMapLvl;
  bufferMapInfo;
  mapLvl;
  mapInfo;
  // Configuration
  mapSize;
  gridSize;
  mod;
  // Canvas click handler (created when canvas is available)
  clickHandler = null;
  canvas = null;
  conf = null;
  constructor(gameWorker2, bufferMapLvl, bufferMapInfo) {
    this.gameWorker = gameWorker2;
    this.bufferMapLvl = bufferMapLvl;
    this.bufferMapInfo = bufferMapInfo;
    this.mapLvl = new Float32Array(this.bufferMapLvl);
    this.mapInfo = new Float32Array(this.bufferMapInfo);
    this.mapSize = 40;
    this.gridSize = 40;
    this.mod = 1;
  }
  /**
   * Sets the canvas element and configuration for click handling.
   * This should be called after construction when the canvas is available.
   * 
   * @param canvas The canvas element to attach click handlers to
   * @param conf Configuration for the click handler
   */
  setCanvas(canvas, conf) {
    this.canvas = canvas;
    this.conf = conf;
    this.initClickHandler();
  }
  /**
   * Initializes the click handler if all dependencies are available.
   */
  initClickHandler() {
    if (!this.canvas || !this.conf) {
      return;
    }
    if (this.clickHandler) {
      this.clickHandler.destroy();
    }
    const deps = {
      canvas: this.canvas,
      mapLvl: this.mapLvl,
      mapInfo: this.mapInfo,
      gameWorker: this.gameWorker,
      conf: this.conf
    };
    this.clickHandler = new CanvasClickHandler(deps);
    this.clickHandler.setHoverCallback((tile) => {
      if (tile) {
        this.mapInfo[4] = tile.x;
        this.mapInfo[5] = tile.y;
        this.mapInfo[6] = tile.z;
        this.mapInfo[7] = 1;
      } else {
        this.mapInfo[7] = 0;
      }
    });
    console.log("[GridMapDrawers] CanvasClickHandler initialized with hover callback");
  }
  /**
   * Sets a callback function to be called when the hovered tile changes.
   * Delegates to the internal CanvasClickHandler.
   */
  setHoverCallback(callback) {
    if (this.clickHandler) {
      this.clickHandler.setHoverCallback(callback);
    }
  }
  /**
   * Updates the grid state.
   * With the new canvas-based approach, this only updates the shared buffer references.
   * No DOM manipulation is needed.
   */
  updateGrid = () => {
    this.mapLvl = new Float32Array(this.bufferMapLvl);
    this.mapInfo = new Float32Array(this.bufferMapInfo);
    if (this.clickHandler) {
      this.clickHandler.updateMapData(this.mapLvl, this.mapInfo);
    }
  };
  /**
   * Updates the click handler configuration.
   * Call this if SCALE_SIZE or SCALE_MOD changes.
   */
  updateConfig(conf) {
    this.conf = conf;
    if (this.clickHandler) {
      this.clickHandler.updateConfig(conf);
    }
  }
  /**
   * Returns the current hovered tile coordinates.
   */
  getLastHoveredTile() {
    return this.clickHandler?.getLastHoveredTile() ?? null;
  }
  /**
   * Cleans up resources and removes event listeners.
   */
  destroy() {
    if (this.clickHandler) {
      this.clickHandler.destroy();
      this.clickHandler = null;
    }
    this.canvas = null;
    this.conf = null;
  }
};

// web/js/keyboad.ts
var keyCheck = {};
var keyBind = {
  up: ["ArrowUp", "z"],
  down: ["ArrowDown", "s"],
  left: ["ArrowLeft", "q"],
  right: ["ArrowRight", "d"]
};
var initKeyBoard = (gameWorker2) => {
  window.addEventListener("keydown", (event) => {
    keyCheck[event.key] = true;
  });
  window.addEventListener("keyup", (event) => {
    keyCheck[event.key] = false;
  });
  function updatePlayerPosition() {
    const playerMovement = {
      up: keyBind.up.map((k) => keyCheck[k]).includes(true),
      down: keyBind.down.map((k) => keyCheck[k]).includes(true),
      left: keyBind.left.map((k) => keyCheck[k]).includes(true),
      right: keyBind.right.map((k) => keyCheck[k]).includes(true)
    };
    gameWorker2.postMessage({ action: "updatePlayerMovement", playerMovement });
  }
  setInterval(updatePlayerPosition, 16);
};

// web/js/worker/messageHandler.ts
var HandelersMap = class extends Map {
  append(handler) {
    handler.forEach(([k, f]) => {
      this.set(k, f);
    });
  }
};
var MessageHandler = class {
  worker;
  pendingResponses = /* @__PURE__ */ new Map();
  handlers = new HandelersMap([]);
  constructor(worker) {
    this.worker = worker;
    this.worker.onmessage = (event) => {
      this.handleIncoming(event.data);
    };
  }
  sendDataSync(payload, data, id = crypto.randomUUID()) {
    const message = { ...payload, id };
    this.worker.postMessage(message, data);
    return id;
  }
  send(payload, id = crypto.randomUUID()) {
    const message = { ...payload, id };
    this.worker.postMessage(message);
    return id;
  }
  sendMessageWithResponse(payload) {
    return new Promise((resolve) => {
      const id = this.send(payload);
      this.pendingResponses.set(id, resolve);
    });
  }
  async handleIncoming(message) {
    const { action, id } = message;
    if (id && this.pendingResponses.has(id)) {
      this.pendingResponses.get(id)?.(message);
      this.pendingResponses.delete(id);
      return;
    }
    const handler = this.handlers.get(action);
    if (handler) {
      const result = await handler(message);
      if (id) {
        this.worker.postMessage({ type: "response", id, result });
      }
    } else {
      console.warn(`[MessageHandler] No handler for type "${action}"`);
    }
  }
  append(handler) {
    handler.forEach(([k, f]) => {
      this.handlers.set(k, f);
    });
  }
};

// web/js/main.ts
initMenu();
updatGlobalJSON(GlobalState);
var gameWorker = new Worker(
  new URL("./gameWorker.ts", import.meta.url).href,
  {
    type: "module"
  }
);
initKeyBoard(gameWorker);
initFlyMenu(gameWorker);
initToolMenu(gameWorker);
infoMenu(gameWorker);
var handlers = new MessageHandler(gameWorker);
var canvasImageMap = document.getElementById(
  "map-image"
);
var gridMapDrawer = null;
var DEFAULT_MAP_CONF = {
  DRAW_TILE_COUNT: 40,
  SCALE_SIZE: 1,
  SCALE_MOD: 1
};
var callback_initWorker = (_data) => {
  console.log("\u2705 Game Worker initialized!");
  if (gridMapDrawer) {
    gridMapDrawer.setCanvas(canvasImageMap, DEFAULT_MAP_CONF);
    console.log("[main] Canvas click handler attached before offscreen transfer");
  }
  const offscreen = canvasImageMap.transferControlToOffscreen();
  handlers.sendDataSync({
    action: "setCanvasMap",
    canvas: offscreen
  }, [
    offscreen
  ]);
  handlers.send({
    action: "initCanvasMap",
    mapConf: DEFAULT_MAP_CONF
  });
  handlers.send({ action: "startRender" });
};
var callback_initCanvasMap = (data) => {
  const mapconf = data.mapConf;
  const bufferMapLvl = data.mapLvlBuffer;
  const bufferMapInfo = data.mapInfoBuffer;
  console.log("===== Call BackRender");
  gridMapDrawer = new GridMapDrawers(gameWorker, bufferMapLvl, bufferMapInfo);
  gridMapDrawer.mod = mapconf.DRAW_TILE_COUNT / 40;
  gridMapDrawer.setCanvas(canvasImageMap, {
    DRAW_TILE_COUNT: mapconf.DRAW_TILE_COUNT,
    SCALE_SIZE: mapconf.SCALE_SIZE,
    SCALE_MOD: mapconf.SCALE_MOD
  });
};
handlers.append([
  ["callback_initWorker", callback_initWorker],
  ["callback_initCanvasMap", callback_initCanvasMap]
]);
handlers.send({ action: "initWorker" });
var iFrame = 0;
var _shouldRun = true;
function frameTick() {
  if (gridMapDrawer) {
    gridMapDrawer.updateGrid();
  }
}
function updateFrame() {
  iFrame = (iFrame + 1) % 1028;
  if (iFrame % 4 == 0) {
    frameTick();
  }
  requestAnimationFrame(updateFrame);
}
function startLoop() {
  console.log("GameWorker: # START #");
  _shouldRun = true;
  updateFrame();
}
function stopLoop() {
  console.log("GameWorker: # STOP #");
  _shouldRun = false;
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    handlers.send({ action: "startRender" });
    startLoop();
  } else {
    handlers.send({ action: "stopRender" });
    stopLoop();
  }
});
handlers.append([
  ["FPS", (data) => {
    const fpsDisplay = document.getElementById("fps");
    fpsDisplay.textContent = `FPS: ${data.fps}`;
  }],
  ["infoCell", (data) => {
    updateInfoCell(data);
  }],
  ["toolList", (data) => {
    handleToolList(data.tools);
  }],
  ["toolExecuted", (data) => {
    handleToolExecuted(data.toolId, data.success);
  }],
  ["pickedColor", (data) => {
    handlePickedColor(data.r, data.g, data.b);
  }],
  ["assetGroups", (data) => {
    handleAssetGroups(data.groups);
  }],
  ["assetPreview", (data) => {
    handleAssetPreview(data.blobUrl);
  }],
  ["buildingConfigList", (data) => {
    handleBuildingConfigList(data.configs);
  }]
]);
startLoop();
