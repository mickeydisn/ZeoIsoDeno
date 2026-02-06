/// ---------------------------------------------------------------------
/// ---------------------------------------------------------------------
export type GlobalConfType = {
  mapGrid: {
    mapSize: number;
    gridSize: number;
    mod: number;
    _mapGrid: any[];
    _heightScall: number;
  };
};

export const GlobalConf: GlobalConfType = {
  mapGrid: {
    mapSize: 0,
    gridSize: 0,
    mod: 1,
    _mapGrid: [],
    _heightScall: 0,
  },
};

export type MiniMapConfType = {
  definition: number;
  zoom: number;
  ShowB: boolean;
  ShowL: boolean;
  ShowLB: boolean;
  ShowT: boolean;
  ShowH: boolean;
};

export type MapConfType = {
  definition: number;
  tileScaleMod: number;
};
export interface GlobalStateConfType {
  mode: string;
  x: number;
  y: number;
  miniMap: MiniMapConfType;
  map: MapConfType;
}

export class GlobalStateClass implements GlobalStateConfType {
  mode: string = "MiniMap";
  x: number = 100;
  y: number = 400;
  miniMap: MiniMapConfType = {
    definition: 4,
    zoom: 32,
    ShowB: true,
    ShowL: false,
    ShowLB: false,
    ShowT: false,
    ShowH: false,
  };
  map: MapConfType = {
    definition: 30,
    tileScaleMod: 3 / 2,
  };
  constructor() {
  }
  update(conf: GlobalStateConfType) {
    this.x = conf.x;
    this.y = conf.y;
    this.mode = conf.mode;
    this.miniMap = conf.miniMap;
    this.map = conf.map;
  }
}

/// ---------------------------------------------------------------------
/// ---------------------------------------------------------------------

export const GlobalState: GlobalStateClass = new GlobalStateClass();

/// ---------------------------------------------------------------------
/// ---------------------------------------------------------------------

function getElementInputValue(selector: string, defaultValue: string = "") {
  return (document.querySelector(selector) as HTMLInputElement)?.value ||
    defaultValue;
}
function setElementInputValue(selector: string, value: string = "") {
  const elm = document.querySelector(selector) as HTMLInputElement;
  if (elm) {
    elm.value = value;
  }
}

function getElementCheckBoxValue(
  selector: string,
  defaultValue: boolean = false,
) {
  return (document.querySelector(selector) as HTMLInputElement)?.checked ||
    defaultValue;
}

export function getGlobalJSON() {
  const mode = getElementInputValue('input[name="mode"]:checked', "");
  const x = getElementInputValue("#xInput", "0");
  const y = getElementInputValue("#yInput", "0");

  return {
    mode: mode,
    x: Number(x),
    y: Number(y),
    miniMap: {
      definition: Number(getElementInputValue("#miniMap-definition", "1")),
      zoom: Number(getElementInputValue("#miniMap-zoomSelect", "1")),
      ShowB: getElementCheckBoxValue("#miniMap-ShowB"),
      ShowL: getElementCheckBoxValue("#miniMap-ShowL"),
      ShowLB: getElementCheckBoxValue("#miniMap-ShowLB"),
      ShowT: getElementCheckBoxValue("#miniMap-ShowT"),
      ShowH: getElementCheckBoxValue("#miniMap-ShowH"),
    },
    map: {
      definition: Number(getElementInputValue("#map-definition", "1")),
      tileScaleMod: Number(getElementInputValue("#map-scale-mod", "1")),
    },
  };
}

export function updateXY(x: number, y: number) {
  GlobalState.x = x;
  GlobalState.y = y;
  setElementInputValue("#xInput", String(x));
  setElementInputValue("#yInput", String(y));
}

export function updatGlobalJSON(data: GlobalStateConfType) {
  console.log("updatGlobalJSON", data);
  GlobalState.update(data);
  const dataString = JSON.stringify(data, null, 2);
  setElementInputValue("#GlobalJson", dataString);

  if (data.mode) {
    const modeInput = document.querySelector(
      `input[name="mode"][value="${data.mode}"]`,
    ) as HTMLInputElement;
    if (modeInput) modeInput.checked = true;
  }

  if (typeof data.x !== "undefined") {
    setElementInputValue("#xInput", String(data.x));
  }

  if (typeof data.y !== "undefined") {
    setElementInputValue("#yInput", String(data.y));
  }
  // miniMap
  if (typeof data.miniMap.zoom !== "undefined") {
    setElementInputValue("#miniMap-zoomSelect", String(data.miniMap.zoom));
  }
  if (typeof data.miniMap.definition !== "undefined") {
    setElementInputValue(
      "#miniMap-definition",
      String(data.miniMap.definition),
    );
  }
  // map
  if (typeof data.map.definition !== "undefined") {
    setElementInputValue("#map-definition", String(data.map.definition));
  }
  if (typeof data.map.tileScaleMod !== "undefined") {
    setElementInputValue("#map-scale-mod", String(data.map.tileScaleMod));
  }
}

/// ---------------------------------------------------------------------
/// ---------------------------------------------------------------------

function toggelDisplayMode(actifElmId: string, elmClass: string) {
  console.log("toggelDisplayMode", actifElmId, elmClass);

  const actifElm = document.getElementById(actifElmId);
  if (!actifElm) return;

  const divMiniMap = document.getElementById(actifElmId);
  Array.from(document.getElementsByClassName(elmClass)).filter((elm) =>
    elm !== divMiniMap
  ).forEach((elm) => (elm as HTMLElement).style.display = "none");

  actifElm.style.display = "flex";
}

function updatFormEvent() {
  const getState = getGlobalJSON();
  console.log("updatFormEvent", getState);
  GlobalState.update(getState);
  const dataString = JSON.stringify(GlobalState, null, 2);
  const elm = document.getElementById("GlobalJson") as HTMLInputElement;
  if (elm) elm.value = dataString;

  if (GlobalState.mode == "MiniMap") {
    toggelDisplayMode("paramsMiniMap", "paramsOption");
    toggelDisplayMode("displayMiniMap", "displayOption");
    // callMiniMap();
  }

  if (GlobalState.mode == "Map") {
    toggelDisplayMode("paramsMap", "paramsOption");
    toggelDisplayMode("displayMap", "displayOption");

    // setMapGridSize(GlobalState.map.definition);
    // callMap();
  }
}

/// ---------------------------------------------------------------------
/// ---------------------------------------------------------------------

export function initMenu() {
  const form = /*html*/ `
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
  `;

  const elm = document.getElementById("menuMapFrom");
  if (elm) {
    elm.innerHTML = form;

    elm.addEventListener("input", updatFormEvent);
  }
}

/// ---------------------------------------------------------------------
/// ---------------------------------------------------------------------
