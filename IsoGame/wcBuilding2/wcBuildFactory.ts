/*
key : 'name of asset in loader '
near : open position in near tile[ NW, NE , SE , SW ]
*/
/*
import { WcBuildConf_Base3 } from "./buildConf_base3";
import { WcBuildConf_BaseBorder3 } from "./buildConf_baseBorder3";
import { WcBuildConf_House3 } from "./buildConf_house3";
import { WcBuildConf_House3a } from "./buildConf_house3a";
import { WcBuildConf_House3b } from "./buildConf_house3b";
import { WcBuildConf_House4D } from "./buildConf_house4D";
import { WcBuildConf_House4a } from "./buildConf_house4a";
import { WcBuildConf_House4b } from "./buildConf_house4b";
import { WcBuildConf_House4c } from "./buildConf_house4c";
import { WcBuildConf_House5 } from "./buildConf_house5";
import { WcBuildConf_House6a } from "./buildConf_house6a";
import { WcBuildConf_Place3 } from "./buildConf_place3";
*/
import { FactoryMap } from "../map/factory/factoryMap.ts";
import { World } from "../word.ts";
import { WcAbstractBuildConf, WcConfTile } from "./wcAbstractBuildConf.ts";
import { WcBuildTile } from "./wcBuildTile.ts";
// ====================================================
// ====================================================
// ====================================================

export abstract class WcBuildFactory {
  public configuration: WcAbstractBuildConf;
  public x: number = 0;
  public y: number = 0;

  protected world: World;
  protected fm: FactoryMap;
  public allTiles: WcBuildTile[];

  constructor(world: World, conf: WcAbstractBuildConf) {
    this.world = world;
    this.fm = FactoryMap.getInstance();
    this.configuration = conf;

    this.allTiles = [];
  }

  toJson() {
    return {
      x: this.x,
      y: this.y,
      config: this.configuration,
    };
  }
  // -------------------------------

  public addTileNeighbours(tile: WcBuildTile): void {
    tile.nearExistingWcTiles.forEach((nearTiles) => {
      if (nearTiles == null) return;
      if (this.allTiles.includes(nearTiles)) return;
      this.allTiles.push(nearTiles);
    });
  }

  // -------------------------------

  public getWcTile(x: number, y: number): WcBuildTile {
    const wcBuildOnTile = FactoryMap.getInstance().getTile(x, y).wcBuild;
    if (wcBuildOnTile) {
      return wcBuildOnTile as WcBuildTile;
    }
    return new WcBuildTile(this.world, this, x, y);
  }

  // -------------------------------

  get notConfiguredList(): WcBuildTile[] {
    return this.allTiles.filter((tileBuild) => {
      return !tileBuild.isFaceConfigured;
    });
  }

  get forcedList(): WcBuildTile[] {
    return this.allTiles.filter((tileBuild) => {
      return !tileBuild.isFaceConfigured &&
        tileBuild.possibleFace.length == 1;
    });
  }

  get openList(): WcBuildTile[] {
    return this.allTiles
      .filter((tileBuild) => {
        return !tileBuild.isFaceConfigured &&
          tileBuild.expendPossibleFace.length > 0 &&
          tileBuild.score > 0;
      }).sort((a, b) => b.score - a.score);
  }

  get closeList(): WcBuildTile[] {
    return this.allTiles
      .filter((tileBuild) => {
        return !tileBuild.isFaceConfigured &&
          tileBuild.closePossibleFace.length > 0;
      }); // .sort((a, b) => b.score - a.score);
  }
}

// ====================================================
// ====================================================
// ====================================================

export class WcBuildFactoryGenarator extends WcBuildFactory {
  protected mainTile!: WcBuildTile;
  protected mainLvl!: number;

  constructor(world: World, conf: WcAbstractBuildConf) {
    super(world, conf);
  }

  // =============================================

  protected initBuilding() {
    this.mainTile = this.getWcTile(this.x, this.y) as WcBuildTile;
    const canProcess = this.mainTile.processFaceConfiguration(
      this.configuration.TILE_START_OPTIONS,
    );
    if (canProcess) {
      this.addTileNeighbours(this.mainTile);
      return true;
    }
    return false;
  }

  processFacePossible(popBuildTile: WcBuildTile) {
    const testedFace = popBuildTile.computePosibleFace;

    const confTile: WcConfTile[] = testedFace.map((face) => {
      const fkey = face.map((k) => k === null ? "null" : k).join("|");
      return this.configuration.indexTileOptions_KeyFaceKey[fkey];
    }).flat();

    const canProcess = popBuildTile.processFaceConfiguration(
      confTile,
    );
    if (!canProcess) {
      return false;
    }
    this.addTileNeighbours(popBuildTile);
    return true;
  }

  public start2(x: number, y: number): boolean {
    // =============================================
    // =============================================
    // Create the first building Tile:
    this.x = x;
    this.y = y;
    this.mainLvl = this.fm.getTile(x, y).lvl;
    this.configuration.mainLvl = this.mainLvl;
    this.configuration.init();

    // =============================================
    // INIT
    // =============================================
    console.debug(
      "== Init Building ============================================",
      this.x,
      this.y,
    );

    if (!this.initBuilding()) {
      console.error(
        "== CAN NOT PROCESS INIT ============================================",
      );
      return false;
    }

    // =============================================
    // GROW
    // =============================================
    console.debug(
      "== Start Building ===========================================",
      this.configuration.growLoopCount,
    );

    for (let it = 0; it < this.configuration.growLoopCount; it++) {
      // -- FORCED
      const forcedList = this.forcedList;
      if (forcedList.length > 0) {
        const popBuildTile = forcedList.shift()!;

        const canProcess = this.processFacePossible(popBuildTile);
        if (!canProcess) {
          console.error("# CANT PROCESS FORCE");
          continue;
        }
        this.addTileNeighbours(popBuildTile);
        popBuildTile.isFaceConfiguredType = "Open-Forced";

        continue;
      }
      // -- OPEN
      const openList = this.openList;
      if (openList.length > 0) {
        const popBuildTile = openList.shift()!;

        const canProcess = this.processFacePossible(popBuildTile);
        if (!canProcess) {
          console.error("# CANT PROCESS OPEN ");
          continue;
        }
        this.addTileNeighbours(popBuildTile);
        popBuildTile.isFaceConfiguredType = "Open-Select";
        continue;
      }
      break;
    }

    // =============================================
    // Close
    // =============================================
    console.debug(
      "== Start Close Building ===========================================",
      this.configuration.growLoopCount,
    );

    for (let it = 0; it < this.configuration.endLoopMax; it++) {
      // -- FORCED
      const forcedList = this.forcedList;
      if (forcedList.length > 0) {
        const popBuildTile = forcedList.shift()!;
        const canProcess = this.processFacePossible(popBuildTile);
        if (!canProcess) {
          console.error("# CANT PROCESS FORCE");
          continue;
        }
        this.addTileNeighbours(popBuildTile);
        popBuildTile.isFaceConfiguredType = "Close-Forced";
        continue;
      }
      // -- CLOSE
      const openList = this.closeList;
      if (openList.length > 0) {
        const popBuildTile = openList.shift()!;
        const confTile: WcConfTile[] = [popBuildTile.closePossibleFace[0]].map(
          (face) => {
            // const fkey = face.join("|");
            const fkey = face.map((k) => k === null ? "null" : k).join("|");
            return this.configuration.indexTileOptions_KeyFaceKey[fkey];
          },
        ).flat();
        const canProcess = popBuildTile.processFaceConfiguration(
          confTile,
        );

        if (!canProcess) {
          console.error("# CANT PROCESS CLOSE");
          break;
        }
        this.addTileNeighbours(popBuildTile);
        popBuildTile.isFaceConfiguredType = "Close-Select";
        continue;
      }
      break;
    }
    const openList = this.closeList;
    if (openList.length > 0) {
      const popBuildTile = openList.shift()!;
      popBuildTile.applyBuildError([255, 255, 0]);
      console.log(
        "popBuildTile.possibleFace[0]",
        popBuildTile.closePossibleFace,
      );
    }

    // =============================================
    // Clean Not Configured Build .

    // =============================================
    this.cleanTileCity();
    // =============================================
    // =============================================

    return true;
  }

  cleanTileCity() {
    this.allTiles
      .forEach((wcTile: WcBuildTile) => {
        if (
          wcTile.isFaceConfigured &&
          wcTile.possibleFace[0].includes(null)
        ) {
          wcTile.possibleFace = [["X", "X", "X", "X"]];
        }
      });
  }
}