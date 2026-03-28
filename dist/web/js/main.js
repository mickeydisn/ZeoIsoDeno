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

// web/js/menu/toolMenu.ts
var categories = ["terrain", "color", "asset", "structure", "inspect"];
var brushSizes = [1, 3, 5, 9];
var activeCategory = "terrain";
var activeToolId = null;
var activeBrushSize = 1;
var activeColor = "#808080";
var toolsByCategory = /* @__PURE__ */ new Map();
var assetGroups = [];
var activeAssetId = null;
var selectedAssetGroup = null;
var activeAssetSuffix = "_NE";
var initToolMenu = (gameWorker2) => {
  const toolMenuEl = document.getElementById("toolMenu");
  if (!toolMenuEl)
    return;
  renderToolMenu(toolMenuEl, gameWorker2);
};
var assetSuffixes = ["_NE", "_NW", "_SW", "_SE"];
function renderToolMenu(container, gameWorker2) {
  container.innerHTML = `
    <div id="toolMenuHeader">
      <span id="toolMenuTitle">Tools</span>
    </div>
    <div id="toolCategoryTabs">
      ${categories.map((cat) => `
        <button class="category-tab ${cat === activeCategory ? "active" : ""}" data-category="${cat}">
          ${capitalizeFirst(cat)}
        </button>
      `).join("")}
    </div>
    <div id="toolActiveDisplay">
      <span id="activeToolLabel">No tool selected</span>
    </div>
    <div id="toolList"></div>
    <div id="toolBrushSize">
      <span>Brush:</span>
      ${brushSizes.map((size) => `
        <button class="brush-btn ${size === activeBrushSize ? "active" : ""}" data-size="${size}">
          ${size}\xD7${size}
        </button>
      `).join("")}
    </div>
    <div id="toolColorPicker" style="display: ${activeCategory === "color" ? "flex" : "none"}">
      <span>Color:</span>
      <input type="color" id="colorPickerInput" value="${activeColor}">
      <span id="colorHex">${activeColor}</span>
    </div>
    <div id="assetBrowser" style="display: ${activeCategory === "asset" ? "block" : "none"}">
      <div id="suffixSelector">
        <span>Direction:</span>
        ${assetSuffixes.map((suffix) => `
          <button class="suffix-btn ${suffix === activeAssetSuffix ? "active" : ""}" data-suffix="${suffix}">
            ${suffix.replace("_", "")}
          </button>
        `).join("")}
      </div>
      <div id="selectedAssetCard" style="display: ${activeAssetId ? "block" : "none"}">
        <div id="selectedAssetPreview"></div>
        <span id="selectedAssetLabel">${activeAssetId || "No asset selected"}</span>
      </div>
      <div id="assetImageList"></div>
      <div id="assetGroupList"></div>
    </div>
  `;
  container.querySelectorAll(".category-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const category = tab.dataset.category;
      setActiveCategory(category, container, gameWorker2);
    });
  });
  const colorPickerInput = container.querySelector("#colorPickerInput");
  if (colorPickerInput) {
    colorPickerInput.addEventListener("input", (e) => {
      const color = e.target.value;
      setActiveColor(color, container, gameWorker2);
    });
  }
  container.querySelectorAll(".brush-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = parseInt(btn.dataset.size);
      setActiveBrushSize(size, container, gameWorker2);
    });
  });
  container.querySelectorAll(".suffix-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const suffix = btn.dataset.suffix;
      setActiveAssetSuffix(suffix, container, gameWorker2);
    });
  });
}
function setActiveCategory(category, container, gameWorker2) {
  activeCategory = category;
  container.querySelectorAll(".category-tab").forEach((tab) => {
    const tabCat = tab.dataset.category;
    tab.classList.toggle("active", tabCat === category);
  });
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
  renderToolList(container, gameWorker2);
  if (category === "asset") {
    renderAssetBrowser(container, gameWorker2);
  }
}
function setActiveColor(color, container, gameWorker2) {
  activeColor = color;
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
function setActiveBrushSize(size, container, gameWorker2) {
  activeBrushSize = size;
  container.querySelectorAll(".brush-btn").forEach((btn) => {
    const btnSize = parseInt(btn.dataset.size);
    btn.classList.toggle("active", btnSize === size);
  });
  gameWorker2.postMessage({
    action: "setBrushSize",
    size
  });
}
function setActiveAssetSuffix(suffix, container, gameWorker2) {
  activeAssetSuffix = suffix;
  container.querySelectorAll(".suffix-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.suffix === suffix);
  });
  updateAssetPreview(container);
  if (activeAssetId) {
    gameWorker2.postMessage({
      action: "setActiveAsset",
      assetId: activeAssetId + activeAssetSuffix
    });
  }
}
function renderToolList(container, gameWorker2) {
  const toolListEl = container.querySelector("#toolList");
  if (!toolListEl)
    return;
  const tools = toolsByCategory.get(activeCategory) || [];
  if (tools.length === 0) {
    toolListEl.innerHTML = `<div class="tool-empty">No tools in this category</div>`;
    return;
  }
  toolListEl.innerHTML = tools.map((tool) => `
    <button class="tool-btn ${tool.id === activeToolId ? "active" : ""}" data-tool-id="${tool.id}">
      <span class="tool-icon">${tool.icon}</span>
      <span class="tool-name">${tool.name}</span>
    </button>
  `).join("");
  toolListEl.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const toolId = btn.dataset.toolId;
      setActiveTool(toolId, container, gameWorker2);
    });
  });
}
function setActiveTool(toolId, container, gameWorker2) {
  activeToolId = toolId;
  container.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.toolId === toolId);
  });
  gameWorker2.postMessage({
    action: "setActiveTool",
    toolId
  });
  updateActiveToolDisplay(container);
}
function updateActiveToolDisplay(container) {
  const labelEl = container.querySelector("#activeToolLabel");
  if (!labelEl)
    return;
  if (!activeToolId) {
    labelEl.textContent = "No tool selected";
    return;
  }
  const allTools = Array.from(toolsByCategory.values()).flat();
  const tool = allTools.find((t) => t.id === activeToolId);
  if (tool) {
    labelEl.textContent = `${tool.icon} ${tool.name} (${activeBrushSize}\xD7${activeBrushSize})`;
  }
}
function handleToolList(tools, container) {
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
  const toolMenuEl = container || document.getElementById("toolMenu");
  if (toolMenuEl) {
    renderToolList(toolMenuEl, self);
  }
}
function handleToolExecuted(toolId, success) {
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
  activeColor = hex;
}
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function renderAssetBrowser(container, gameWorker2) {
  const assetGroupListEl = container.querySelector("#assetGroupList");
  const assetImageListEl = container.querySelector("#assetImageList");
  if (!assetGroupListEl || !assetImageListEl)
    return;
  if (assetGroups.length === 0) {
    assetGroupListEl.innerHTML = '<div class="asset-empty">Loading assets...</div>';
    assetImageListEl.innerHTML = "";
    return;
  }
  assetGroupListEl.innerHTML = `
    <div class="asset-group-header">Asset Groups</div>
    ${assetGroups.map((group) => `
      <button class="asset-group-btn ${group.group === selectedAssetGroup ? "active" : ""}" data-group="${group.group}">
        ${group.group} (${group.images.length})
      </button>
    `).join("")}
  `;
  assetGroupListEl.querySelectorAll(".asset-group-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.group;
      selectedAssetGroup = group;
      renderAssetBrowser(container, gameWorker2);
    });
  });
  if (selectedAssetGroup) {
    const group = assetGroups.find((g) => g.group === selectedAssetGroup);
    if (group) {
      assetImageListEl.innerHTML = `
        <div class="asset-image-header">${group.group}</div>
        <div class="asset-image-grid">
          ${group.images.map((image) => `
            <button class="asset-image-btn ${image === activeAssetId ? "active" : ""}" data-asset="${image}">
              ${image}
            </button>
          `).join("")}
        </div>
      `;
      assetImageListEl.querySelectorAll(".asset-image-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const assetId = btn.dataset.asset;
          setActiveAsset(assetId, container, gameWorker2);
        });
      });
    }
  } else {
    assetImageListEl.innerHTML = '<div class="asset-empty">Select a group</div>';
  }
}
function setActiveAsset(assetId, container, gameWorker2) {
  activeAssetId = assetId;
  const selectedAssetCardEl = container.querySelector("#selectedAssetCard");
  const selectedAssetLabelEl = container.querySelector("#selectedAssetLabel");
  if (selectedAssetCardEl && selectedAssetLabelEl) {
    selectedAssetCardEl.style.display = "block";
    selectedAssetLabelEl.textContent = assetId;
  }
  updateAssetPreview(container);
  container.querySelectorAll(".asset-image-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.asset === assetId);
  });
  gameWorker2.postMessage({
    action: "setActiveAsset",
    assetId: assetId + activeAssetSuffix
  });
}
function updateAssetPreview(container) {
  const previewEl = container.querySelector("#selectedAssetPreview");
  if (!previewEl || !activeAssetId) {
    if (previewEl)
      previewEl.innerHTML = "";
    return;
  }
  const fullAssetKey = activeAssetId + activeAssetSuffix;
  const assetGroup = getAssetGroup(activeAssetId);
  const assetIndex = getAssetIndex(activeAssetId);
  const topOffset = assetIndex * 224;
  const columnOffset = getColumnOffset(activeAssetSuffix);
  previewEl.innerHTML = `
    <div class="asset-preview-sprite" 
         style="background-image: url('/img/asset_opti/${assetGroup}.png'); 
                background-position: -${columnOffset}px -${topOffset}px;"
         title="${fullAssetKey}">
    </div>
  `;
}
function getColumnOffset(suffix) {
  const columns = {
    "_NE": 0,
    "_NW": 64,
    "_SW": 128,
    "_SE": 192
  };
  return columns[suffix] || 0;
}
function getAssetIndex(assetId) {
  for (const group of assetGroups) {
    const index = group.images.indexOf(assetId);
    if (index !== -1) {
      return index;
    }
  }
  return 0;
}
function getAssetGroup(assetId) {
  for (const group of assetGroups) {
    if (group.images.includes(assetId)) {
      return group.group;
    }
  }
  return "Unknown";
}
function handleAssetGroups(groups, container) {
  assetGroups = groups;
  if (groups.length > 0 && !selectedAssetGroup) {
    selectedAssetGroup = groups[0].group;
  }
  const toolMenuEl = container || document.getElementById("toolMenu");
  if (toolMenuEl && activeCategory === "asset") {
    renderAssetBrowser(toolMenuEl, self);
  }
}

// web/js/menu/InfoMenu.ts
var infoMenu = (gameWorker2) => {
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

// IsoGame/mapIso/grid.ts
var MAP_WIDTH = 1600;
var MAP_HEIGHT = 800;
var globalScale = 2;
var GridMapDrawers = class {
  gameWorker;
  bufferMapLvl;
  bufferMapInfo;
  mapLvl;
  mapInfo;
  mapSize;
  gridSize;
  mod;
  _mapGrid;
  _heightScall;
  divTableGrid;
  constructor(gameWorker2, bufferMapLvl, bufferMapInfo) {
    this.gameWorker = gameWorker2;
    this.bufferMapLvl = bufferMapLvl;
    this.bufferMapInfo = bufferMapInfo;
    this.mapLvl = new Float32Array(this.bufferMapLvl);
    this.mapInfo = new Float32Array(this.bufferMapInfo);
    this.mapSize = 40;
    this.gridSize = 40;
    this.mod = 1;
    this._heightScall = 55;
    this._mapGrid = [...Array(this.gridSize)].map(
      (x) => Array(this.gridSize).fill(null)
    );
    this._init_grid_contener();
    this._init_gridMatrix();
  }
  _init_grid_contener() {
    const mapRelative = document.getElementById("mapRelative");
    if (mapRelative) {
      mapRelative.style.cssText = [
        ["width", MAP_WIDTH + "px"],
        ["height", MAP_HEIGHT + "px"],
        ["display", "flex"],
        ["justify-content", "center"],
        ["align-items", "top"],
        ["position", "relative"],
        ["overflow", "hidden"]
      ].map((s) => `${s[0]}:${s[1]}`).join(";");
    }
    const size = globalScale * 30.2 * (30 / this.gridSize) * this.gridSize;
    const topPos = -455 * (globalScale - 0.885);
    const divMapGrid = document.getElementById("mapGrid");
    if (!divMapGrid)
      return;
    divMapGrid.innerHTML = "";
    divMapGrid.style.cssText = [
      ["width", size + "px"],
      ["height", size + "px"],
      ["left", -size / 2 + "px"],
      ["top", Math.round(topPos) + "px"],
      [
        "grid-template-columns",
        `repeat(${this.gridSize}, ${100 / this.gridSize}%)`
      ]
    ].map((s) => `${s[0]}:${s[1]}`).join(";");
    this.divTableGrid = divMapGrid;
  }
  /// -----------------------------
  // Add a Div - Iso Grid on top of the IsoCanvaMap .
  _init_gridMatrix() {
    if (!this.divTableGrid)
      return;
    this.divTableGrid.innerHTML = "";
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cell = document.createElement("div");
        cell.classList.add("tileActionBase");
        this.divTableGrid.appendChild(cell);
        this._mapGrid[i][j] = cell;
        if (i > 0 && i < this.gridSize - 1 && j > 0 && j < this.gridSize - 1) {
          const hitcell = document.createElement("div");
          hitcell.classList.add("hit");
          cell.appendChild(hitcell);
          if (i == this.gridSize / 2 && j == this.gridSize / 2) {
            cell.classList.add("tileCenter");
          }
        }
        cell.addEventListener("click", (event) => {
          const target = event.target;
          if (!target)
            return;
          console.log(target);
          const clickX = this.mod * (-i + this.gridSize / 2);
          const clickY = this.mod * (-j + this.gridSize / 2);
          console.log("click :", this.mod, clickX, clickY);
          this.gameWorker.postMessage({
            action: "query_infoCell",
            gridX: clickX,
            gridY: clickY
          });
          this.gameWorker.postMessage({
            action: "toolClick",
            gridX: clickX,
            gridY: clickY
          });
        });
      }
    }
  }
  updateGrid = () => {
    const divMapGrid = document.getElementById("mapGrid");
    if (divMapGrid == null)
      return;
    const size = globalScale * 30.2 * (30 / this.gridSize);
    const offX = this.mapInfo[2] * size;
    const offY = this.mapInfo[3] * size;
    divMapGrid.style.transform = `rotateX(60deg) rotateY(0deg) rotateZ(45deg) translate(${offY}px, ${offX}px)`;
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const x = (this.gridSize - 1 - i) * this.mod;
        const y = (this.gridSize - 1 - j) * this.mod;
        const tileLvl = this.mapLvl[x * this.gridSize * this.mod + y];
        const topAline = Math.round(-(tileLvl * this._heightScall));
        const leftAline = Math.round(-(tileLvl * this._heightScall));
        this._mapGrid[i][j].style.transform = `translate(${topAline}px, ${leftAline}px)`;
      }
    }
  };
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
var callback_initWorker = (_data) => {
  console.log("\u2705 Game Worker initialized!");
  const offscreen = canvasImageMap.transferControlToOffscreen();
  handlers.sendDataSync({
    action: "setCanvasMap",
    canvas: offscreen
  }, [
    offscreen
  ]);
  handlers.send({
    action: "initCanvasMap",
    mapConf: {
      DRAW_TILE_COUNT: 40,
      SCALE_SIZE: 1,
      SCALE_MOD: 1
    }
  });
  handlers.send({
    action: "gridClick",
    x: -19,
    y: 70
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
  }]
]);
startLoop();
