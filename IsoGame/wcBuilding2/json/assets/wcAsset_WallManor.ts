
const jo = {
  WALL_SUFFIX:"#H210_C115_S35_B120",
  ROOF_SUFFIX:"#H0_S1_C128_B64",
  ROOF_PREFIX: "roofHigh",
  WALL_PREFIX: "wall",
  tag: "WM_",
  assets: { 
  // ==========================================================================
  // ["Wr", "Wl", "Wout", "Wout"],
"Corner_X": { 
      label: "Corner_X",
      face: ["rX", "lX", "out", "out"],
      assets: [
        { h: 2, key: "Corner", keyR: 3, sufix: "" },
        { h: 1, key: "Corner", keyR: 2, sufix: "" },
        { h: 0, key: "Corner", keyR: 2, sufix: "" },
      ],
    },
  // ["Wr", "Wl", "Wout", "Wout"],
"Corner": { 
      label: "Corner",
      face: ["r", "l", "out", "out"],
      assets: [
        { h: 2, key: "Corner", keyR: 3, sufix: "" },
        { h: 1, key: "Corner", keyR: 2, sufix: "" },
        { h: 0, key: "Corner", keyR: 2, sufix: "" },
      ],
    },

  // ["Wr", "Wl", "Wout", "Wout"],
"Corner_B": { 
      label: "Corner_B",
      face: ["r", "l", "out", "out"],
      assets: [
        { h: 2, key: "CornerRound", keyR: 3, sufix: "" },
        { h: 1, key: "CornerDiagonal", keyR: 2, sufix: "" },
        { h: 0, key: "CornerDiagonal", keyR: 2, sufix: "" },
      ],
    },

  // ----------------

  //  ["Wr", "Win", "Wl", "Wout"],
"Door": { 
      label: "Door",
      face: ["r", "in", "l", "outD"],
      assets: [
        { h: 2, key: "", keyR: 3, sufix: "" },
        { h: 1, key: "WindowGlass", keyR: 1, sufix: "" },
        { h: 0, key: "Door", keyR: 1, sufix: "" },
      ],
    },

  // ["Wr", "Win", "Wl", "Wout"],
"Wall": { 
      label: "Wall",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: 2, key: "", keyR: 3, sufix: "" },
        { h: 1, key: "WindowGlass", keyR: 1, sufix: "" },
        { h: 0, key: "WindowGlass", keyR: 1, sufix: "" },
      ],
    },

  //  ["Wr", "Win", "Wl", "Wout"],
"Wall_Windows": { 
      label: "Wall_Windows",
      face: ["r", "in", "l", "out"],
      assets: [
        { h: 2, key: "Window", keyR: 3, sufix: "" },
        { h: 1, key: "WindowGlass", keyR: 1, sufix: "" },
        { h: 0, key: "WindowGlass", keyR: 1, sufix: "" },
      ],
    },

  // ----------------

  // ["Win", "Win", "Wl", "Wr"],
"InnerCorner": { 
      label: "InnerCorner",
      face: ["in", "in", "l", "r"],
      assets: [
        { h: 2, key: "CornerInner", keyR: 3, sufix: "" },
      ],
    },

  // ==========================================================================
  //  ["A", "A", "A", "A"]
"Inside_Full": { 
      label: "Inside_Full",
      face: ["in", "in", "in", "in"],
      assets: [
        { h: 3, key: "Point", keyR: 3, sufix: "" },
        { h: 2, key: "Block", keyR: 0, sufix: "" },
      ],
    },

  // =========================================
  // =========================================
  // =========================================
  // =========================================

  // ==========================================================================
}
}