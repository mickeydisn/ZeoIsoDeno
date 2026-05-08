import { Tile } from "../map/object/tile.ts";
import { AXE_DIRECTION } from "../map/object/const.ts";
import { World } from "../word.ts";
import { WcConfTile } from "./wcAbstractBuildConf.ts";
import {
  equalFaceList,
  filterAxeFacesKey,
  WcFace
} from "./wcBuildFace.ts";
import { WcBuildFactory } from "./wcBuildFactory.ts";
import { WcBuildTileDrawer } from "./wcBuildTileDrawer.ts";
import { pickRandomWeightedObject } from "./wcUtils.ts";

export type WcBuildTileInfo = {
  possibleFace: WcFace[];
  isFaceConfigured: boolean;
  isFaceConfiguredType: string;
  computePosibleFace: WcFace[];
  score: number;
  building: any;
};

export class WcBuildTile extends WcBuildTileDrawer {
  public buildFactory: WcBuildFactory;
  public tile: Tile;

  public possibleFace: WcFace[];

  public isFaceConfigured: boolean = false;
  public isFaceConfiguredType: string = "";
  public configuredFace: WcFace = [null, null, null, null];
  protected _depth: number;

  public savePossibleFace: WcFace[];

  constructor(
    world: World,
    buildFactory: WcBuildFactory,
    x: number,
    y: number,
    _depth: number = 0,
  ) {
    super(world, x, y);
    this.tile = this.fm.getTile(this.x, this.y);
    this.tile.wcBuild = this;
    this._depth = _depth;

    this.buildFactory = buildFactory;
    this.possibleFace = [
      ...(this.buildFactory.configuration.listFaceKey || []),
    ];

    this.savePossibleFace = [];
  }
  toJsonInfo(): WcBuildTileInfo {
    return {
      possibleFace: this.possibleFace,
      isFaceConfigured: this.isFaceConfigured,
      isFaceConfiguredType: this.isFaceConfiguredType,
      computePosibleFace: this.computePosibleFace,
      score: this.score,
      building: this.buildFactory.toJson(),
    };
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  get nearExistingWcTiles(): (WcBuildTile | null)[] {
    return this.tile.nearTiles.map((tile: Tile) => {
      return tile.wcBuild ? tile.wcBuild : null;
    });
  }

  getNeighborAtAxe(axe: number): WcBuildTile {
    if (this.nearExistingWcTiles[axe] != null) {
      return this.nearExistingWcTiles[axe];
    }

    const [dx, dy] = AXE_DIRECTION[axe];
    const wcTile = this.buildFactory.getWcTile(
      this.x + dx,
      this.y + dy,
    );
    this.nearExistingWcTiles[axe] = wcTile;

    // Path Compatibility for Now
    if (wcTile.tile.isFrise) {
      wcTile.configuredFace = ["X", "X", "X", "X"];
      wcTile.possibleFace = [wcTile.configuredFace];
      wcTile.isFaceConfigured = true;
      wcTile.isFaceConfiguredType = "Path_compatibility";
    }
    return wcTile;
  }
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  get computePosibleFace(): WcFace[] {
    if (this.isFaceConfigured) {
      return this.possibleFace;
    }
    // Init with all the possible Face in the configuration
    let possibleFace = [...this.buildFactory.configuration.listFaceKey];

    for (let axe = 0; axe < 4; axe++) {
      // Get the possible face of the  near Tile on axe
      const nearPosibleFace = this.nearExistingWcTiles[axe]?.possibleFace;
      if (!nearPosibleFace) {
        continue;
      }
      // Get all the possible AxeFace of this near Tile - with the Linked Axe = axe % 2
      const nearAxeFace = [
        ...new Set(
          nearPosibleFace.map((f) => f[(axe + 2) % 4]),
        ),
      ];
      // Map all this Possible Face with the linkedFace index.
      const nearAxeFaceLink = [
        ...new Set(
          nearAxeFace.map((face) =>
            face === null // Manage Null Face
              ? null
              : this.buildFactory.configuration.linkedFaceKey(face)
          )
            .flat(),
        ),
      ];
      // Filter the current possible Face with the linked AxeFace Selected
      possibleFace = filterAxeFacesKey(possibleFace, axe, nearAxeFaceLink);
    }
    return possibleFace;
  }

  // --------------------------------------------------------------------------
  get expendPossibleFace(): WcFace[] {
    return this.possibleFace.filter((face: WcFace) =>
      !face.includes(null) && !face.includes("") && !face.includes("X")
    );
  }

  // --------------------------------------------------------------------------
  get closePossibleFace(): WcFace[] {
    const indexFaceKeyWeight: Record<string, number> =
      this.buildFactory.configuration.faceLinkWeight;

    const sortedList = this.possibleFace
      .map((face) => {
        const scoreFace = face
          .map((faceKey) =>
            Object.keys(indexFaceKeyWeight).includes(faceKey as string)
              ? indexFaceKeyWeight[faceKey as string]
              : 0
          )
          .reduce((acc, v) => acc + v, 0);
        return [face, scoreFace] as [WcFace, number];
      })
      .sort((a, b) => a[1] - b[1])
      .map((x) => x[0]);
    return sortedList.length ? [sortedList[0]] : [];
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  get score(): number {
    const faceWeightIndex = this.buildFactory.configuration.faceLinkWeight;
    const scoreWeigthFace = this.possibleFace
      .map((face) => {
        return [0, 1, 2, 3]
          .filter((axe) =>
            this.nearExistingWcTiles[axe] != null &&
            this.nearExistingWcTiles[axe].isFaceConfigured
          )
          .map((axe) =>
            Object.keys(faceWeightIndex).includes(face[axe] as string)
              ? faceWeightIndex[face[axe] as string]
              : 0
          );
      })
      .flat();
    const maxScoreFoce = scoreWeigthFace.reduce(
      (acc, v) => Math.max(acc, v),
      0,
    );
    return 1000000 - this._depth + maxScoreFoce;
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------

  get nearActifNodeWcBuild(): WcBuildTile[] {
    return [0, 1, 2, 3]
      .filter((axe) => {
        const faceEmpty = filterAxeFacesKey(
          this.possibleFace,
          axe,
          [
            null,
            // "",
            // "null",
            // "X",
          ],
        );
        return faceEmpty.length == 0;
      })
      .map((axe) => {
        return this.getNeighborAtAxe(axe) as WcBuildTile;
      })
      .filter((wcTile) => {
        return wcTile && !wcTile.isFaceConfigured;
      });
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------

  applyPossibleFace(possibleFace: WcFace[]) {
    this.savePossibleFace = this.savePossibleFace.length == 0
      ? this.possibleFace
      : this.savePossibleFace;
    this.possibleFace = possibleFace;
  }
  undoPossibleFace() {
    this.possibleFace = this.savePossibleFace;
    this.savePossibleFace = [];
  }
  clearSavePossibleFace() {
    this.savePossibleFace = [];
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Attempts to apply a valid face configuration from a list of options to the current tile.
   * @param tileConfigurations - Array of possible tile configurations to try.
   * @param randomWeight - If true, picks configurations based on weight; otherwise, tries sequentially.
   * @param iter - If true, performs a secondary search if no valid config is found in the first pass.
   * @returns True if a configuration was successfully applied; false otherwise.
   */
  processFaceConfiguration(
    tileConfigurations: WcConfTile[],
    randomWeight = true,
    iter = false,
  ): boolean {
    // Make a copy of the configurations list to work on
    let listList = [...tileConfigurations];

    let isConfig = false;

    // Try to apply one of the provided configurations
    while (isConfig == false && listList.length > 0) {
      // Pick a configuration either randomly (weighted) or just take the first one
      const pickTileConf = randomWeight
        ? pickRandomWeightedObject(listList, this.tile.rBuildTile)
        : listList[0];

      if (!pickTileConf) return false;

      const face = pickTileConf.face;
      // Try applying the face configuration to the tile
      isConfig = this.tryApplyFace(face);
      if (isConfig) {
        // If successful, apply full build configuration and return success
        this.applyBuild(pickTileConf);
        return true;
      } else {
        // If failed, remove that configuration from the list and try another
        listList = listList.filter((i) => i !== pickTileConf);
      }
    }

    // If no valid configuration found, log error
    console.error("Note Fine Condifuration", this.tile.x, this.tile.y);
    // If we're not allowed to iterate further, return false
    if (!iter) {
      return false;
    }

    console.debug(tileConfigurations.map((conf) => conf.face));

    // Highlight build failure visually
    // this.applyBuildError([255, 255, 0]);

    // If secondary attempt is enabled, you could retry with nearby-based options
    /*
  const tryOther = this.processFaceConfiguration(
    ConfPossible,
    randomWeight,
    false,
  );
  console.debug("tryOther", tryOther);
  */

    return false;
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  tryApplyFace(face: WcFace): boolean {
    // === Step 1: Initialize
    const allNode: Set<WcBuildTile> = new Set(); // All nodes that get modified during propagation

    // Apply the face to the current tile
    this.applyPossibleFace([face]);
    this.isFaceConfigured = true;
    allNode.add(this); // Track this tile as modified

    // === Step 2: Initialize propagation frontier
    const openNode: WcBuildTile[] = this.nearActifNodeWcBuild; // Immediate neighbors to process
    const openNodeSet: Set<WcBuildTile> = new Set(openNode); // Quick lookup to avoid duplicates

    // === Step 3: Assume valid unless proven otherwise
    let isValide = true;

    // === Step 4: Start propagation loop
    let canCurrentNode: WcBuildTile | undefined = openNode.shift();
    if (canCurrentNode === undefined) {
      // No neighbors to process, consider valid
      return true;
    }
    let currentNode: WcBuildTile = canCurrentNode;
    openNodeSet.delete(currentNode);

    let i = 0; // Safety counter to prevent infinite loops
    while (currentNode && i++ < 200) {
      // Get all valid face configurations for this node
      // console.log(currentNode.x, currentNode.y, currentNode.possibleFace);

      const newPosibleFace: WcFace[] = currentNode.computePosibleFace;
      if (newPosibleFace.length == 0) {
        /*
        console.debug(
          " No valid configuration  ",
          currentNode.x,
          currentNode.y,
        );
        */
        // No valid configuration found — break propagation
        // currentNode.applyBuildError([64, 0, 0]); // Optional: mark as updated
        isValide = false;
        break;
      }

      // If the face set changes, apply the update and continue propagation
      if (!equalFaceList(currentNode.possibleFace, newPosibleFace)) {
        currentNode.applyPossibleFace(newPosibleFace); // Update face
        allNode.add(currentNode); // Track change
        // currentNode.applyBuildError([0, 0, 64]); // Optional: mark as updated

        // Expand search with new neighbors
        const newNode = currentNode.nearActifNodeWcBuild;

        /*
        if (newNode.length == 0) {
          currentNode.applyBuildError([0, 255, 0]); // Optional: mark as dead end
        }
        */

        for (const node of newNode) {
          if (!openNodeSet.has(node)) {
            openNode.push(node); // Add to processing queue
            openNodeSet.add(node); // Track as already queued
          }
        }
      }

      // Move to next node in the queue
      canCurrentNode = openNode.shift();
      if (canCurrentNode === undefined) {
        // No more nodes — success path
        for (const tile of [...allNode]) {
          tile.clearSavePossibleFace(); // Finalize applied face
        }
        return true;
      }
      currentNode = canCurrentNode;
      openNodeSet.delete(currentNode);
    }

    // === Step 5: If invalid, rollback changes
    if (!isValide) {
      for (const tile of [...allNode]) {
        tile.undoPossibleFace(); // Revert face
        tile.isFaceConfigured = false; // Reset config state
      }
    }

    // === Step 6: Return result
    return isValide;
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
}
