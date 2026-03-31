/// ---------------------------------------------------------------------
/// ---------------------------------------------------------------------
/// ---------------------------------------------------------------------
const MAP_WIDTH = 1600;
const MAP_HEIGHT = 800;
const globalScale = 2;
/// ---------------------------------------------------------------------

export class GridMapDrawers {
  gameWorker: Worker;
  bufferMapLvl: SharedArrayBuffer;
  bufferMapInfo: SharedArrayBuffer;
  mapLvl: Float32Array;
  mapInfo: Float32Array;

  mapSize: number;
  gridSize: number;
  mod: number;
  _mapGrid: any[];
  _heightScall: number;

  divTableGrid?: HTMLElement;

  constructor(
    gameWorker: Worker,
    bufferMapLvl: SharedArrayBuffer,
    bufferMapInfo: SharedArrayBuffer,
  ) {
    this.gameWorker = gameWorker;
    this.bufferMapLvl = bufferMapLvl;
    this.bufferMapInfo = bufferMapInfo;
    this.mapLvl = new Float32Array(this.bufferMapLvl);
    this.mapInfo = new Float32Array(this.bufferMapInfo);

    this.mapSize = 40;
    this.gridSize = 40;
    this.mod = 1;
    this._heightScall = 55;

    this._mapGrid = [...Array(this.gridSize)].map((x) =>
      Array(this.gridSize).fill(null)
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
        ["overflow", "hidden"],
      ].map((s) => `${s[0]}:${s[1]}`).join(";");
    }
    // Div for grid
    const size = (globalScale * 30.20) * (30 / this.gridSize) * this.gridSize;
    const topPos = -455 * (globalScale - 0.885); // -52;
    // -142.4

    const divMapGrid = document.getElementById("mapGrid");
    if (!divMapGrid) return;
    divMapGrid.innerHTML = "";
    divMapGrid.style.cssText = [
      ["width", size + "px"],
      ["height", size + "px"],
      ["left", -size / 2 + "px"],
      ["top", Math.round(topPos) + "px"],
      [
        "grid-template-columns",
        `repeat(${this.gridSize}, ${100 / this.gridSize}%)`,
      ],
    ].map((s) => `${s[0]}:${s[1]}`).join(";");

    this.divTableGrid = divMapGrid;
  }

  /// -----------------------------
  // Add a Div - Iso Grid on top of the IsoCanvaMap .
  _init_gridMatrix() {
    if (!this.divTableGrid) return;
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
            // cell.style.backgroundColor = "#00F3";
            cell.classList.add("tileCenter");
          }

        }
        

          cell.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (!target) return;
            // const i = Number(target.getAttribute("i")) || 0;
            // const j = Number(target.getAttribute("j")) || 0;
            const clickX = this.mod * (-i + this.gridSize / 2);
            const clickY = this.mod * (-j + this.gridSize / 2);

            // updateXY(clickX + GlobalState.x, clickY + GlobalState.y);
            console.log("click :", this.mod, clickX, clickY);

            // Send info query
            this.gameWorker.postMessage({
              action: "query_infoCell",
              gridX: clickX,
              gridY: clickY,
            });

            // Send tool click
            this.gameWorker.postMessage({
              action: "toolClick",
              gridX: clickX,
              gridY: clickY,
            });
          });

      }
    }
  }

  updateGrid = () => {
    // Aline Grid with a player offset
    const divMapGrid = document.getElementById("mapGrid");
    if (divMapGrid == null) return;
    const size = (globalScale * 30.20) * (30 / this.gridSize);
    const offX = this.mapInfo[2] * size;
    const offY = this.mapInfo[3] * size;
    divMapGrid.style.transform =
      `rotateX(60deg) rotateY(0deg) rotateZ(45deg) translate(${offY}px, ${offX}px)`;

    // Aline the grid with the lvl of the each Cell
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const x = (this.gridSize - 1 - i) * this.mod;
        const y = (this.gridSize - 1 - j) * this.mod;
        const tileLvl = this.mapLvl[x * this.gridSize * this.mod + y];
        // console.log(tileLvl , gcm._heightScall)
        const topAline = Math.round(-(tileLvl * this._heightScall));
        const leftAline = Math.round(-(tileLvl * this._heightScall));
        // this._mapGrid[i][j].style.top = topAline + "px";
        // this._mapGrid[i][j].style.left = leftAline + "px";
        this._mapGrid[i][j].style.transform = `translate(${topAline}px, ${leftAline}px)`;

      }
    }
  };
}

/*
/// -----------------------------
// Set the size of the Grid.
export const initMapGridSize = () => {
  const gcm = GlobalConf.mapGrid;
  const gjm = GlobalState.map;

  // Update Div Grid if definition size change .
  const mapSize = gjm.definition;
  if (mapSize != gcm.mapSize) {
    gcm.mapSize = mapSize;
    gcm.gridSize = mapSize;
    while (gcm.gridSize > 40) gcm.gridSize /= 2;
    gcm.mod = gcm.mapSize / gcm.gridSize;
    gcm._mapGrid = [...Array(gcm.gridSize)].map((x) =>
      Array(gcm.gridSize).fill(null)
    );
    init_gridMatrix();
  }
  // Update the Height Scale of the Cell ( Def * ScaleMod )
  const tileScaleMod = gjm.tileScaleMod / 8 >= 1 ? gjm.tileScaleMod / 8 : 1;
  console.log("TILE SCALE MOD ", tileScaleMod);
  gcm._heightScall = (globalScale * 12.20) *
    (30 / (gjm.definition * tileScaleMod)); //  * GlobalConf.mapGrid.mod ;
};
*/
