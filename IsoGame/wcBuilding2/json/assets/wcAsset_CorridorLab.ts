
const jo = {
  WALL_SUFFIX:"#H170_S120_C70_B115",
  PREFIX: "Lab5_",
  tag: "CL_",
  assets: {
    "Door": {
      label: "Door",
      face: ["in", "out", "outD", "out"],
      assets: [
        { h: 0, key: "platform_center", keyR: 0, sufix: ""},
        { h: 0, key: "corridor_end", keyR: 2, sufix: "" },
      ],
    }, 
    "Flat" : {
      label : "Flat",
      face: ["in", "out", "in", "out"],
      assets: [
        { h: 0, key: "corridor_", keyR: 0, sufix: "", },
      ],
    }, 
    "Flat_Detail" : {
      label : "Flat_Detail",
      face: ["in", "out", "in", "out"],
      assets: [
        { h: 0, key: "corridor_detailed", keyR: 0, sufix: "", },
      ],   
    },    
    "Flat_Window" : {
      label : "Flat_Window",
      face: ["in", "out", "in", "out"],
      assets: [
        {  h: 0, key: "corridor_window", keyR: 0, sufix: "" },
      ],
    },    
    "Corner" : {
      label : "Flat_Detail",
      face: ["in", "in", "out", "out"],
      assets: [
        { h: 0, key: "corridor_corner", keyR: 3, sufix: "" },
      ],
    },    
    "Corner_Round" : {
      label : "Corner_Round",
      face: ["in", "in", "out", "out"],
      assets: [
        { h: 0, key:  "platform_center", keyR: 0, sufix: "" },
        { h: 0, key: "corridor_cornerRound", keyR: 3, sufix: "" },
      ],

    },    
    "TJoin" : {
      label : "TJoin",
      face: ["in", "in", "in", "out"],
      assets: [
        { h: 0, key: "corridor_split", keyR: 0, sufix: "" },
      ],

    },    
    "CrossJoin" : {
      face: ["in", "in", "in", "in"],
      assets: [
        { h: 0, key: "corridor_cross", keyR: 0, sufix: "" },
      ],
    },    
  }
};

/*
corridor_cross
corridor_split

corridor_cornerRound
platform_center

corridor_corner
corridor_window
corridor_detailed
corridor_
*/