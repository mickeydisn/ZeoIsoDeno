import { WcConfTile } from "../../AbstractBuildConf.ts";
import { WcFace } from "../../wcBuildFace.ts";
import { actionsEmpty, applyGroup } from "./wcUtils.ts";

export class wcAsset_Enter {
  tag: string = "E_";

  constructor() {
  }

  // ==========================================================================

  faceLinkWeight() {
    return {
      "E_in#Open": 1,
      "E_l#Open": 1,
      "E_r#Open": 1,
      "E#Open": 1,
      "E#Door": 1,
    };
  }

  getFaceLinks(links: {
    out: string[];
    l: string[];
    r: string[];
    door: string[];
  }): [string, string][] {
    return [
      ...links.out.map((k: string): [string, string] => ["E_out", k]),
      ...links.l.map((k: string): [string, string] => ["E_l", k]),
      ...links.r.map((k: string): [string, string] => ["E_r", k]),
      ["E_l#Open#X", "E_r#Open"],
      ["E_l#Open", "E_r#Open#X"],
      ["E#Open", "E_in#Open"],
      ...links.door.map((k: string): [string, string] => ["E#Door", k]),
    ];
  }

  groupInit(): WcConfTile[] {
    return [
      {
        face: ["E#Open", "E#Open", "E#Door", "E#Open"],
        color: [12, 12, 16],
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
      },
    ];
  }

  groupAsset(): WcConfTile[] {
    return [
      ...applyGroup([
        //in#Open Connect to 0#Open .
        // Flat
        {
          face: ["in#Open", "l#Open", "out", "r#Open"]
            .map((p) => ("E_" + p)) as WcFace,
        },
        // Corner
        {
          face: ["out", "out", "r#Open#X", "l#Open#X"]
            .map((p) => ("E_" + p)) as WcFace,
        },
        // Flat linked
        {
          face: ["in#Open", "l#Open", "out", "r"]
            .map((p) => ("E_" + p)) as WcFace,
        },
        {
          face: ["in#Open", "l", "out", "r#Open"]
            .map((p) => ("E_" + p)) as WcFace,
        },
        // { face: ["in", "in", "l", "r"].map((p) => ("F2_" + p)) as WcFace },
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty,
        color: [28, 28, 32],
      }),
    ];
  }

  // ==========================================================================
}

export class wcAsset_EnterSimple {
  tag: string = "E_";

  constructor() {
  }

  // ==========================================================================

  faceLinkWeight() {
    return {
      "E_in": 1,
      "E_l": 1,
      "E_r": 1,
      "E_Door": 1,
    };
  }

  getFaceLinks(links: {
    out: string[];
    l: string[];
    r: string[];
    door: string[];
  }): [string, string][] {
    return [
      ...links.out.map((k: string): [string, string] => ["E_out", k]),
      ...links.l.map((k: string): [string, string] => ["E_l", k]),
      ...links.r.map((k: string): [string, string] => ["E_r", k]),
      ...links.door.map((k: string): [string, string] => ["E_Door", k]),
      // ["E_l#Open#X", "E_r#Open"],
      // ["E_l#Open", "E_r#Open#X"],
      // ["E#Open", "E_in#Open"],
    ];
  }

  groupInit(): WcConfTile[] {
    return [
      {
        face: ["E_Door", "E_l", "E_out", "E_r"],
        color: [12, 12, 16],
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
      },
    ];
  }

  groupAsset(): WcConfTile[] {
    return [
      ...applyGroup([
        //in#Open Connect to 0#Open .
        // Flat
        {
          face: ["in#Open", "l#Open", "out", "r#Open"]
            .map((p) => ("E_" + p)) as WcFace,
        },
        // Corner
        {
          face: ["out", "out", "r#Open#X", "l#Open#X"]
            .map((p) => ("E_" + p)) as WcFace,
        },
        // Flat linked
        {
          face: ["in#Open", "l#Open", "out", "r"]
            .map((p) => ("E_" + p)) as WcFace,
        },
        {
          face: ["in#Open", "l", "out", "r#Open"]
            .map((p) => ("E_" + p)) as WcFace,
        },
        // { face: ["in", "in", "l", "r"].map((p) => ("F2_" + p)) as WcFace },
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty,
        color: [28, 28, 32],
      }),
    ];
  }

  // ==========================================================================
}
