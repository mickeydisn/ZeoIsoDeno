import { TileInfo } from "../../../IsoGame/map/object/tile.ts";
import { WcBuildTileInfo } from "../../../IsoGame/wcBuilding2/wcBuildTile.ts";

// Main thread (e.g., main.ts)
export const infoMenu = (gameWorker: Worker) => {
  (document.getElementById("infoMenu") as HTMLElement)
    .innerHTML = `
      <div id="infoCell"></div>
    `;
};

export const updateInfoCell = (message: any) => {
  const tileInfo: TileInfo = message.data;

  const s = `

  <div># ----- [ ${tileInfo.x} | ${tileInfo.y} ] </div>
  ${updateInfoWcBuildTile(tileInfo.wcBuildTile)}

  `;

  (document.getElementById("infoCell") as HTMLElement).innerHTML = s;
};

export const updateInfoWcBuildTile = (infoWcBuild: WcBuildTileInfo | null) => {
  if (!infoWcBuild) {
    return "";
  }

  const pFaces = infoWcBuild.possibleFace;
  const table = pFaces === undefined ? "" : `
  <div class="gridFaces">
    ${
    pFaces.map((face: any) =>
      face.map((axe: any) => `<div>${axe}</div>`).join("")
    ).join("")
  }
  </div>
  `;

  const cFaces = infoWcBuild.computePosibleFace;

  const ctable = cFaces === undefined ? "" : `
  <div class="gridFaces">
    ${
    cFaces.map((face: any) =>
      face.map((axe: any) => `<div>${axe}</div>`).join("")
    ).join("")
  }
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
