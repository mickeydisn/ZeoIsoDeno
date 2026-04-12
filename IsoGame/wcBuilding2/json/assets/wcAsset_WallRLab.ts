const jo = {
  WALL_SUFFIX:"#H210_C115_S35_B120",
  ROOF_SUFFIX:"#H0_S1_C128_B64",
  ROOF_PREFIX: "",
  WALL_PREFIX: "Lab5_",
  tag: "WR_",
  assets: { 


  // ["Wr", "Wl", "Wout", "Wout"]
"Corner": { 
      label: "Corner",
      face: ["r", "l", "out", "out"],
      assets: [
        { h: 0, key: "corridor_corner", keyR: 3, sufix: "" },
        { h: .8, key: "corridor_corner", keyR: 3, sufix: "" },
      ],
    },

  // --------------------------------------

  // ["Wr", "Wl", "Wout", "Wout"]
"Corner_Round": { 
      label: "Corner_Round",
      face: ["r", "l", "out", "out"],
      assets: [
        { h: 0, key: "platform_center", keyR: 0, sufix: "" },
        { h: 0, key: "corridor_cornerRound", keyR: 3, sufix: "" },
        { h: .8, key: "corridor_cornerRound", keyR: 3, sufix: "" },
      ],
    },

  // ----------------
  //  ["Wr", "Win", "Wl", "Wout"],
"Wall_Open": { 
      label: "Wall_Open",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: 0, key: "structure_closed", keyR: 2, sufix: "" },
        { h: .8, key: "corridor_split", // IN
          keyR: 0, sufix: "" },
      ],
    },
  //  ["Wr", "Win", "Wl", "Wout"],
"Wall": { 
      label: "Wall",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: 0, key: "corridor_", keyR: 2, sufix: "" },
        { h: .8, key: "corridor_split", keyR: 0, sufix: "" },
      ],
    },
  // ["Wr", "Win", "Wl", "Wout"],
"Wall_DS": { 
      label: "Wall_DS",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: 0, key: "corridor_detailed", keyR: 2, sufix: "" },
        { h: .8, key: "corridor_split", keyR: 0, sufix: "" },
      ],
    },

  // ["Wr", "Win", "Wl", "Wout"],
"Wall_WS": { 
      label: "Wall_WS",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: 0, key: "corridor_window", keyR: 2, sufix: "" },
        { h: .8, key: "corridor_split", keyR: 0, sufix: "" },
      ],
    },

  // ----------------

  // --------------------------------------

  // ["Win2", "Win2", "Wl2", "Wr2"]
"InnerCorner": { 
      label: "InnerCorner",
      face: ["in", "in", "l", "r"],
      assets: [
        { h: .8, key: "corridor_cross", keyR: 3, sufix: "" },
      ],
    },

  //  ["Ai", "Ai", "Ai", "Ai"],
"Inside_Full": { 
      label: "Inside_Full",
      face: ["in", "in", "in", "in"],
      assets: [
        { h: .8, key: "platform_center", keyR: 2, sufix: "" },
      ],
    },

  // ==========================================================================

  // ----------------
  //  ["Wr", "Win", "Wl", "WoutD"],
"Wall_ToCorridor": { 
      label: "Wall_ToCorridor",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: .8, key: "corridor_split", keyR: 0, sufix: "" },
        { h: 0, key: "corridor_cross", keyR: 1, sufix: "" },
      ],
    },

  //  ["Cin", "Wout", "Cin", "Wout"],
"Corridor_DD": { 
      label: "Corridor_DD",
      face: ["in", "out", "in", "out"],
      assets: [
        { h: 0, key: "corridor_detailed", keyR: 2, sufix: "" },
        { h: .8, key: "corridor_detailed", keyR: 2, sufix: "" },
      ],
    },

  // ==========================================================================

  // =========================================
  // =========================================
  // =========================================
  // =========================================

  // ==========================================================================
}
}
