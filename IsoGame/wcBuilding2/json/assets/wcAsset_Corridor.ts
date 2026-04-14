
const jo = {
  WALL_SUFFIX:"#H170_S120_C70_B115",
  PREFIX: "Lab5_",
  tag: "CL_",
  assets: {
    "Door": {
      label: "Door",
      face: ["in", "out", "outD", "out"],
      assets: [
        { h: 0, key: "platform_center", keyR: 0},
        { h: 0, key: "corridor_end", keyR: 2 },
      ],
    }, 
    "Flat" : {
      label : "Flat",
      face: ["in", "out", "in", "out"],
      assets: [
        { h: 0, key: "corridor_", keyR: 0, },
      ],
    }, 
    "Flat_Detail" : {
      label : "Flat_Detail",
      face: ["in", "out", "in", "out"],
      assets: [
        { h: 0, key: "corridor_detailed", keyR: 0, },
      ],   
    },    
    "Flat_Window" : {
      label : "Flat_Window",
      face: ["in", "out", "in", "out"],
      assets: [
        {  h: 0, key: "corridor_window", keyR: 0 },
      ],
    },    
    "Corner" : {
      label : "Flat_Detail",
      face: ["in", "in", "out", "out"],
      assets: [
        { h: 0, key: "corridor_corner", keyR: 3 },
      ],
    },    
    "Corner_Round" : {
      label : "Corner_Round",
      face: ["in", "in", "out", "out"],
      assets: [
        { h: 0, key:  "platform_center", keyR: 0 },
        { h: 0, key: "corridor_cornerRound", keyR: 3 },
      ],

    },    
    "TJoin" : {
      label : "TJoin",
      face: ["in", "in", "in", "out"],
      assets: [
        { h: 0, key: "corridor_split", keyR: 0 },
      ],

    },    
    "CrossJoin" : {
      face: ["in", "in", "in", "in"],
      assets: [
        { h: 0, key: "corridor_cross", keyR: 0 },
      ],
    },    
  }
};
