 const jo = {
  WALL_SUFFIX:"#H210_C115_S35_B120",
  ROOF_SUFFIX:"#H0_S1_C128_B64",
  ROOF_PREFIX: "roof",
  WALL_PREFIX: "wall",
  tag: "WH_",
  assets: { 

  // ----------------
  // ==========================================================================

  // ["Wr", "Wl", "Wout", "Wout"],
"Corner": { 
      label: "Corner",
      face: ["r", "l", "out", "out"],
      assets: [
        { h: 1, key: "Corner", keyR: 3 },
        { h: 0, key: "Corner", keyR: 2 },
      ],
    },

  // ["Wr", "Wl", "Wout", "Wout"],
"Corner_B": { 
      label: "Corner_B",
      face: ["r", "l", "out", "out"],
      assets: [
        { h: 1, key: "CornerRound", keyR: 3 },
        { h: 0, key: "CornerDiagonal", keyR: 2 },
      ],
    },

  // ----------------
  //  ["Wr", "A", "Wl", "Wout"]
"Wall_Door": { 
      label: "Wall_Door",
      face: ["r", "in", "l", "outD"],
      assets: [
        { h: 1, key: "", keyR: 3 },
        { h: 0, key: "Door", keyR: 1 },
      ],
    },
  //  ["Wr", "A", "Wl", "Wout"]
"Wall": { 
      label: "Wall",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: 1, key: "", keyR: 3 },
        { h: 0, key: "", keyR: 1 },
      ],
    },
  //  ["Wr", "A", "Wl", "Wout"]
"Wall_RoofWindows": { 
      label: "Wall_RoofWindows",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: 1, key: "", keyR: 3 },
        { h: 0, key: "WindowGlass", keyR: 1 },
      ],
    },
  //  ["Wr", "A", "Wl", "Wout"]
"Wall_Windows": { 
      label: "Wall_Windows",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: 1, key: "Window", keyR: 3 },
        { h: 0, key: "WindowGlass", keyR: 1 },
      ],
    },
  // ----------------
  // ["A", "A", "Wl", "Wr"]
"InnerCorner": { 
      label: "InnerCorner",
      face: ["in", "in", "l", "r"],
      assets: [
        { h: 1, key: "CornerInner", keyR: 3 },
      ],
    },
  // ----------------
  // ["A", "A", "Wl", "Wr"]
"InnerCorner_X": { 
      label: "InnerCorner_X",
      face: ["in", "in", "lX", "rX"],
      assets: [
        { h: 1, key: "CornerInner", keyR: 3 },
      ],
    },

  // ----------------
  // ["A", "A", "A", "A"]
"Inside_Full": { 
      label: "Inside_Full",
      face: ["in", "in", "in", "in"],
      assets: [
        { h: 2, key: "Point", keyR: 3 },
        { h: 1, key: "Block", keyR: 0 },
      ],
    },
  // =========================================
  // =========================================

  // ==========================================================================
}
}
