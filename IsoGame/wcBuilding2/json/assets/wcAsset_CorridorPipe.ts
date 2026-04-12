const jo = {
  WALL_SUFFIX:"#H170_S120_C70_B115",
  PREFIX: "Lab5_",
  tag: "CL_",
assets: {
      // ["A", "Wout", "WoutD", "Wout"],
    "Door2": { 
          label: "Door2",
          face: ["in", "out", "outD", "out"],
          assets: [
            { h: .2, key: "pipe_end", keyR: 2, sufix: "" },
          ],
        },
      // ["A", "Wout", "WoutD", "Wout"],
    "Door": { 
          label: "Door",
          face: ["in", "out", "outD", "out"],
          assets: [
            { h: .2, key: "pipe_entrance", keyR: 2, sufix: "" },
          ],
        },

      // ----------------

      //  ["A", "Wout", "A", "Wout"]
    "Flat": { 
          label: "Flat",
          face: ["in", "out", "in", "out"],
          assets: [
            { h: 0, key: "pipe_supportLow", keyR: 0, sufix: "" },
            { h: .2, key: "pipe_straight", keyR: 0, sufix: "" },
          ],
        },

      //  ["A", "Wout", "A", "Wout"]
    "Flat_NoSupport": { 
          label: "Flat_NoSupport",
          face: ["in", "out", "in", "out"],
          assets: [
            { h: .2, key: "pipe_straight", keyR: 0, sufix: "" },
          ],
        },

      // ["A", "Wout", "A", "Wout"]
    "Flat_Open": { 
          label: "Flat_Open",
          face: ["in", "out", "in", "out"],
          assets: [
            { h: .2, key: "pipe_open", keyR: 0, sufix: "" },
          ],
        },

      // ["A", "Wout", "A", "Wout"]
    "Flat_Ring": { 
          label: "Flat_Ring",
          face: ["in", "out", "in", "out"],
          assets: [
            { h: 0, key: "pipe_supportLow", keyR: 0, sufix: "" },
            { h: .2, key: "pipe_ring", keyR: 0, sufix: "" },
          ],
        },

      // ----------------

      //["A", "A", "Wout", "Wout"],
    "Corner": { 
          label: "Corner",
          face: ["in", "in", "out", "out"],
          assets: [
            { h: .2, key: "pipe_corner", keyR: 3, sufix: "" },
          ],
        },
      //["A", "A", "Wout", "Wout"],
    "Corner_Round": { 
          label: "Corner_Round",
          face: ["in", "in", "out", "out"],
          assets: [
            { h: .2, key: "pipe_cornerRound", keyR: 3, sufix: "" },
          ],
        },
      // pipe_cornerDiagonal
      // ----------------

      //["A", "A", "A", "Wout"],
    "TJoin": { 
          label: "TJoin",
          face: ["in", "in", "in", "out"],
          assets: [
            { h: 0, key: "pipe_supportLow", keyR: 0, sufix: "" },
            { h: .2, key: "pipe_split", keyR: 3, sufix: "" },
          ],
        },
      // ["A", "A", "A", "A"]
    "CrossJoin": { 
          label: "CrossJoin",
          face: ["in", "in", "in", "in"],
          assets: [
            { h: 0, key: "pipe_supportLow", keyR: 0, sufix: "" },
            { h: .2, key: "pipe_cross", keyR: 0, sufix: "" },
          ],
        },

    "Silo": { 
          label: "Silo",
          face: ["silo", "silo", "silo", "silo"],
          assets: [
            { h: 0, key: "rocket_fuelB", keyR: 0, sufix: "" },
            { h: .2, key: "rocket_finsA", keyR: 0, sufix: "" },
          ],
        },

      // ==========================================================================
    }

}