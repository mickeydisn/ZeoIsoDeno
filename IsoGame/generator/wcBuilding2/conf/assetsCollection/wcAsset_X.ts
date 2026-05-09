import { WcConfTile } from "../../wcAbstractBuildConf.ts";
import { WcFace } from "../../wcBuildFace.ts";
import { actionsEmpty, applyGroup } from "./wcUtils.ts";

export class wcAsset_X {
  tag: string = "X_";

  constructor() {
  }

  // ==========================================================================

  faceLinkWeight() {
    return {
      "X": 0,
    };
  }

  getFaceLinks(links: {
    in: string[];
  }): [string, string][] {
    return [
      ...links.in.map((k: string): [string, string] => ["X", k]),
      ["X", "X"],
    ];
  }

  groupAsset(): WcConfTile[] {
    return [
      ...applyGroup([
        { face: ["X", null, null, null] },
        { face: ["X", "X", null, null] },
        { face: ["X", null, "X", null] },
        { face: ["X", "X", "X", null] },
        { face: ["X", "X", "X", "X"] },
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty,
      }),
    ];
  }

  // ==========================================================================
}
