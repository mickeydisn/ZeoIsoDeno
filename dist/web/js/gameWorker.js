// IsoGame/map/data/biomes.ts
var GAME_BIOMES_MATRIS = [
  "-9",
  "-9",
  "-9",
  "-7",
  "-8",
  "-10",
  "-10",
  "-10",
  "-9",
  "-9",
  "-7",
  "-7",
  "-8",
  "-8",
  "-10",
  "-10",
  "-3",
  "-5",
  "-5",
  "-5",
  "-6",
  "-6",
  "-6",
  "-4",
  "-3",
  "-3",
  "-3",
  "-1",
  "-2",
  "-4",
  "-4",
  "-4",
  "3",
  "3",
  "3",
  "1",
  "2",
  "4",
  "4",
  "4",
  "3",
  "5",
  "5",
  "5",
  "6",
  "6",
  "6",
  "4",
  "9",
  "9",
  "7",
  "7",
  "8",
  "8",
  "10",
  "10",
  "9",
  "9",
  "9",
  "7",
  "8",
  "10",
  "10",
  "10"
];
var GAME_BIOMES = [
  {
    id: "10",
    name: "Volcanic",
    lvlType: "Hill",
    rgb: ["192 - lvl / 3", "0", "128 - lvl / 4"]
  },
  {
    id: "9",
    name: "Sand Desert",
    lvlType: "Plan",
    rgb: ["192 - lvl / 3", "64 - lvl * 0.65", "0"]
  },
  {
    id: "8",
    name: "Tropical Jungle",
    lvlType: "Plat",
    rgb: ["192 - lvl / 3", "128 - lvl * 0.65", "0"]
  },
  {
    id: "7",
    name: "Fertile Steppe",
    lvlType: "Hill",
    rgb: ["192 - lvl / 3", "176 - lvl * 0.65", "0"]
  },
  {
    id: "6",
    name: "Rainforest",
    lvlType: "Coli",
    rgb: ["255 - lvl / 2", "192 - lvl * 0.70", "0"]
  },
  {
    id: "5",
    name: "Plateau",
    lvlType: "Plat",
    rgb: ["255 - lvl / 2", "224 - lvl * 0.75", "0"]
  },
  {
    id: "4",
    name: "Swamp",
    lvlType: "Plan",
    rgb: ["255 - lvl / 2", " 256 - lvl * 0.75", "0"]
  },
  {
    id: "3",
    name: "Savannah",
    lvlType: "Coli",
    rgb: ["192 - lvl / 3", " 256 - lvl * 0.75", "0"]
  },
  {
    id: "2",
    name: "Deciduous Forest",
    lvlType: "Coli",
    rgb: ["128 - lvl / 4", " 256 - lvl * 0.75", "0"]
  },
  {
    id: "1",
    name: "Grassland",
    lvlType: "Plan",
    rgb: ["96 - lvl / 8", " 256 - lvl * 0.75", "0"]
  },
  {
    id: "-1",
    name: "Steppe",
    lvlType: "Coli",
    rgb: ["0", " 256 - lvl * 0.75", "0"]
  },
  {
    id: "-2",
    name: "Prairie",
    lvlType: "Plan",
    rgb: ["0", " 256 - lvl * 0.75", "32 - lvl / 10"]
  },
  {
    id: "-3",
    name: "Tundra",
    lvlType: "Plan",
    rgb: ["0", " 256 - lvl * 0.75", "64 - lvl / 8"]
  },
  {
    id: "-4",
    name: "Coniferous Forest",
    lvlType: "Coli",
    rgb: ["0", " 256 - lvl * 0.75", "96 - lvl / 6"]
  },
  {
    id: "-5",
    name: "Alpine Tundra",
    lvlType: "Hill",
    rgb: ["0", " 256 - lvl * 0.75", "128 - lvl / 4"]
  },
  {
    id: "-6",
    name: "Temperate Forest",
    lvlType: "Plat",
    rgb: ["0", " 256 - lvl * 0.75", "192 - lvl / 3"]
  },
  {
    id: "-7",
    name: "Frozen Desert",
    lvlType: "Plat",
    rgb: ["0", " 256 - lvl * 0.75", "255 - lvl / 2"]
  },
  {
    id: "-8",
    name: "Ice Taiga",
    lvlType: "Hill",
    rgb: ["128 - lvl * .65", " 256 - lvl * 0.75", "255 - lvl / 2"]
  },
  {
    id: "-9",
    name: "Ashen Desert",
    lvlType: "Coli",
    rgb: ["176 - lvl * .65", " 256 - lvl * 0.75", "255 - lvl / 2"]
  },
  {
    id: "-10",
    name: "Ice Desert",
    lvlType: "Plan",
    rgb: ["224 - lvl * .75", " 256 - lvl * 0.75", "255 - lvl / 2"]
  },
  // {id:"river", name:"River",    rgb:[             "32",          "64 + lvl", "64 + lvl * 3"]},
  {
    id: "ocean",
    name: "Ocean",
    lvlType: "Coli",
    rgb: ["32", "64 + lvl", "64 + lvl * 3"]
  },
  {
    id: "mont1",
    name: "Montagne",
    lvlType: "Coli",
    rgb: [
      "(lvl - 192) * 2 + 64",
      "(lvl - 192) * 2 + 64",
      "(lvl - 192) * 2 + 64"
    ]
  },
  { id: "beach", name: "Beach", lvlType: "Coli", rgb: ["192", "192", "32"] },
  { id: "mountL", name: "Mont", lvlType: "Coli", rgb: ["64", "64", "64"] },
  { id: "river", name: "River", lvlType: "River", rgb: ["0", "0", "0"] }
];

// IsoGame/map/object/biomes.ts
var Biome = class {
  name;
  id;
  rgb;
  lvlType;
  color;
  flore;
  floreCondition = ["null"];
  constructor(biomeConf) {
    this.name = biomeConf.name;
    this.id = biomeConf.id;
    this.rgb = biomeConf.rgb;
    this.lvlType = biomeConf.lvlType;
    this.color = this.initColor();
    this.flore = this.initFlore();
  }
  initColor() {
    const rgbFunc = this.rgb.map((x) => `(${x}) & 0xFF`);
    return eval(`(lvl, flore) => [${rgbFunc.join(",")}, 255]`);
  }
  initFlore() {
    return eval(
      `(lvl, flore) => ${this.floreCondition.join(":")}`
    );
  }
  appendFloreCondition(condition) {
    this.floreCondition.unshift(condition);
    this.flore = this.initFlore();
  }
};

// IsoGame/map/data/items.ts
var GAME_FLORE_ITEMS = [
  // ---------------------------------------
  // Ice Desert (-10)
  // ---------------------------------------
  ...[
    // Stone
    { cFilter: "C110_B110", key: "rockLarge" },
    { cFilter: "C110_B110", key: "rocks" },
    { cFilter: "C110_B110", key: "rockSmall" },
    { cFilter: "H15_C120_S120", key: "stone_tallA" },
    { cFilter: "H15_C120_S120", key: "stone_tallB" },
    { cFilter: "H15_C120_S120", key: "stone_tallE" },
    { cFilter: "H15_C120_S120", key: "stone_tallF" },
    { cFilter: "H15_C120_S120", key: "stone_tallH" },
    { cFilter: "H15_C120_S120", key: "stone_tallJ" }
  ].map((x, idx) => {
    return {
      b: [-10],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Ashen Desert (-9)
  // ---------------------------------------
  ...[
    // Plante
    { cFilter: "H225_C90_S110_B110_I1", key: "plant_bushDetailed" },
    { cFilter: "H225_C90_S110_B110_I1", key: "plant_flatShort" },
    { cFilter: "H270_C90_S110_B110_I1", key: "plant_bushDetailed" },
    { cFilter: "H270_C90_S110_B110_I1", key: "plant_flatShort" },
    { cFilter: "H255_C90_S110_B110_I1", key: "plant_bushDetailed" },
    { cFilter: "H255_C90_S110_B110_I1", key: "plant_flatShort" },
    // Stone
    { cFilter: "H90_C90_S10_B80_I1", key: "stone_smallI" },
    { cFilter: "H90_C90_S10_B80_I1", key: "stone_smallH" },
    { cFilter: "H90_C90_S10_B80_I1", key: "stone_smallTopB" },
    { cFilter: "H90_C90_S10_B80_I1", key: "stone_smallTopA" }
  ].map((x, idx) => {
    return {
      b: [-9],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Taiga (-8)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H30_S40_B140", key: "tree_pineRoundA" },
    { cFilter: "H30_S40_B140", key: "tree_pineRoundB" },
    { cFilter: "H30_S40_B140", key: "tree_pineRoundC" },
    { cFilter: "H20_S40_B140", key: "tree_pineRoundA" },
    { cFilter: "H20_S40_B140", key: "tree_pineRoundB" },
    { cFilter: "H20_S40_B140", key: "tree_pineRoundC" },
    { cFilter: "H40_S40_B140", key: "tree_pineRoundA" },
    { cFilter: "H40_S40_B140", key: "tree_pineRoundB" },
    { cFilter: "H40_S40_B140", key: "tree_pineRoundC" },
    // Stone
    { cFilter: "H0", key: "rocks" },
    { cFilter: "H0", key: "rocksTall" }
  ].map((x, idx) => {
    return {
      b: [-8],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Frozen Desert (-7)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H10_S10_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H10_S30_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H10_S50_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H10_S60_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H0_S10_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H0_S30_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H0_S50_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H0_S60_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H20_S10_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H20_S30_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H20_S50_C140_B160", key: "tree_pineSmallB" },
    { cFilter: "H20_S60_C140_B160", key: "tree_pineSmallB" },
    // STONE
    { cFilter: "H15_S110", key: "stone_largeC" },
    { cFilter: "H15_S110", key: "stone_smallI" },
    { cFilter: "H15_S110", key: "stone_smallG" },
    { cFilter: "H15_S110", key: "stone_smallC" }
  ].map((x, idx) => {
    return {
      b: [-7],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Temperate Forest (-6)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H345_S15_C160_B100", key: "tree_detailed" },
    { cFilter: "H345_S15_C160_B100", key: "tree_default" },
    { cFilter: "H345_S15_C160_B100", key: "tree_fat" },
    { cFilter: "H345_S15_C160_B100", key: "tree_small" },
    { cFilter: "H325_S15_C160_B100", key: "tree_detailed" },
    { cFilter: "H325_S15_C160_B100", key: "tree_default" },
    { cFilter: "H325_S15_C160_B100", key: "tree_fat" },
    { cFilter: "H325_S15_C160_B100", key: "tree_small" },
    { cFilter: "H295_S10_C130_B100", key: "tree_detailed" },
    { cFilter: "H295_S10_C130_B100", key: "tree_default" },
    { cFilter: "H295_S10_C130_B100", key: "tree_fat" },
    { cFilter: "H295_S10_C130_B100", key: "tree_small" }
  ].map((x, idx) => {
    return {
      b: [-6],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Alpine Tundra (-5)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H315_S120_C130_B160", key: "tree_pineRoundA" },
    { cFilter: "H315_S120_C130_B160", key: "tree_pineRoundB" },
    { cFilter: "H315_S120_C130_B160", key: "tree_pineRoundC" },
    { cFilter: "H305_S120_C130_B160", key: "tree_pineRoundA" },
    { cFilter: "H305_S120_C130_B160", key: "tree_pineRoundB" },
    { cFilter: "H305_S120_C130_B160", key: "tree_pineRoundC" },
    { cFilter: "H325_S120_C130_B160", key: "tree_pineRoundA" },
    { cFilter: "H325_S120_C130_B160", key: "tree_pineRoundB" },
    { cFilter: "H325_S120_C130_B160", key: "tree_pineRoundC" },
    // Plante
    { cFilter: "H15_C120_S10_B130", key: "grass" },
    { cFilter: "H15_C120_S10_B130", key: "plant_flatTall" }
  ].map((x, idx) => {
    return {
      b: [-5],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Coniferous Forest (-4)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H295_C200_B120", key: "tree_pineGroundA" },
    { cFilter: "H295_C200_B120", key: "tree_pineRoundC" },
    { cFilter: "H295_C200_B120", key: "tree_pineRoundD" },
    { cFilter: "H295_C200_B120", key: "tree_pineRoundE" },
    { cFilter: "H275_C180_B120", key: "tree_pineGroundA" },
    { cFilter: "H275_C180_B120", key: "tree_pineRoundC" },
    { cFilter: "H275_C180_B120", key: "tree_pineRoundD" },
    { cFilter: "H275_C180_B120", key: "tree_pineRoundE" },
    { cFilter: "H255_C160_B120", key: "tree_pineGroundA" },
    { cFilter: "H255_C160_B120", key: "tree_pineRoundC" },
    { cFilter: "H255_C160_B120", key: "tree_pineRoundD" },
    { cFilter: "H255_C160_B120", key: "tree_pineRoundE" },
    { cFilter: "H255_C160_B120", key: "flower_purpleA" },
    { cFilter: "H275_C160_B120", key: "flower_purpleB" },
    { cFilter: "H295_C160_B120", key: "flower_purpleC" },
    { cFilter: "H295_C160_B120", key: "plant_bushDetailed" },
    { cFilter: "H295_C160_B120", key: "plant_bushLarge" },
    { cFilter: "H295_C160_B120", key: "plant_bushLargeTriangle" },
    { cFilter: "H295_C160_B120", key: "plant_bushTriangle" },
    { cFilter: "H295_C160_B120", key: "plant_bushSmall" }
  ].map((x, idx) => {
    return {
      b: [-4],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Tundra (-3)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H300_S80_B120", key: "tree_pineSmallB" },
    { cFilter: "H300_S80_B120", key: "tree_pineSmallA" },
    { cFilter: "H300_S80_B120", key: "tree_pineGroundA" },
    { cFilter: "H310_S80_B120", key: "tree_pineSmallB" },
    { cFilter: "H310_S80_B120", key: "tree_pineSmallA" },
    { cFilter: "H310_S80_B120", key: "tree_pineGroundA" },
    { cFilter: "H290_S80_B120", key: "tree_pineSmallB" },
    { cFilter: "H290_S80_B120", key: "tree_pineSmallA" },
    { cFilter: "H290_S80_B120", key: "tree_pineGroundA" },
    // plante
    { cFilter: "H255_S110_B90", key: "grass" },
    { cFilter: "H255_S110_B90", key: "plant_flatTall" }
  ].map((x, idx) => {
    return {
      b: [-3],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Prairie (-2)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H0_B100", key: "tree_oak" },
    { cFilter: "H5_B100", key: "tree_oak" },
    { cFilter: "H355_B100", key: "tree_oak" },
    // Plante
    { cFilter: "H345_C120_S120", key: "plant_bush" },
    { cFilter: "H345_C120_S120", key: "plant_bushLargeTriangle" },
    { cFilter: "H345_C120_S120", key: "plant_bushSmall" },
    { cFilter: "H345_C180_S150_B90", key: "flower_purpleA" },
    { cFilter: "H345_C180_S150_B90", key: "flower_purpleB" },
    { cFilter: "H345_C180_S150_B90", key: "flower_purpleC" },
    { cFilter: "H0_C180_S150_B90", key: "flower_purpleA" },
    { cFilter: "H0_C180_S150_B90", key: "flower_purpleB" },
    { cFilter: "H0_C180_S150_B90", key: "flower_purpleC" },
    { cFilter: "H30_C180_S150_B90", key: "flower_purpleA" },
    { cFilter: "H30_C180_S150_B90", key: "flower_purpleB" },
    { cFilter: "H30_C180_S150_B90", key: "flower_purpleC" }
  ].map((x, idx) => {
    return {
      b: [-2],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Steppe (-1)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H0_B100", key: "tree_simple_dark" },
    { cFilter: "H0_B100", key: "tree_tall_dark" },
    { cFilter: "H0_B100", key: "tree_pineTallB" },
    { cFilter: "H0_B100", key: "tree_pineTallD" },
    { cFilter: "H10_B100", key: "tree_simple_dark" },
    { cFilter: "H10_B100", key: "tree_tall_dark" },
    { cFilter: "H10_B100", key: "tree_pineTallB" },
    { cFilter: "H10_B100", key: "tree_pineTallD" },
    { cFilter: "H350_B100", key: "tree_simple_dark" },
    { cFilter: "H350_B100", key: "tree_tall_dark" },
    { cFilter: "H350_B100", key: "tree_pineTallB" },
    { cFilter: "H350_B100", key: "tree_pineTallD" }
  ].map((x, idx) => {
    return {
      b: [-1],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Grassland (1)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H0_B100", key: "tree_oak" },
    { cFilter: "H0_B100", key: "tree_fat" },
    { cFilter: "H10_B100", key: "tree_oak" },
    { cFilter: "H10_B100", key: "tree_fat" },
    // Plante
    { cFilter: "H285", key: "grass_large" },
    { cFilter: "H285", key: "grass_leafs" },
    { cFilter: "H285", key: "grass_leafsLarge" },
    { cFilter: "H285", key: "grass" },
    { cFilter: "H285", key: "crops_wheatStageA" },
    { cFilter: "H295", key: "grass_large" },
    { cFilter: "H295", key: "grass_leafs" },
    { cFilter: "H295", key: "grass_leafsLarge" },
    { cFilter: "H295", key: "grass" },
    { cFilter: "H295", key: "crops_wheatStageA" }
  ].map((x, idx) => {
    return {
      b: [1],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Deciduous Forest (2)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H0_B100", key: "tree_cone" },
    { cFilter: "H0_B100", key: "tree_detailed" },
    { cFilter: "H0_B100", key: "tree_blocks" },
    { cFilter: "H0_B100", key: "tree_thin" },
    { cFilter: "H10_B100", key: "tree_cone" },
    { cFilter: "H10_B100", key: "tree_detailed" },
    { cFilter: "H10_B100", key: "tree_blocks" },
    { cFilter: "H10_B100", key: "tree_thin" },
    { cFilter: "H350_B100", key: "tree_cone" },
    { cFilter: "H350_B100", key: "tree_detailed" },
    { cFilter: "H350_B100", key: "tree_blocks" },
    { cFilter: "H350_B100", key: "tree_thin" }
  ].map((x, idx) => {
    return {
      b: [2],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Savannah (3)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H240_S70_C140_B90", key: "tree_plateau" },
    { cFilter: "H240_S70_C140_B90", key: "tree_small" },
    { cFilter: "H250_S70_C140_B90", key: "tree_plateau" },
    { cFilter: "H250_S70_C140_B90", key: "tree_small" },
    // Plante
    { cFilter: "H240_C90_S70_B110", key: "crops_bambooStageA" },
    { cFilter: "H240_C90_S70_B110", key: "crops_bambooStageB" },
    { cFilter: "H240_C90_S70_B110", key: "crops_wheatStageA" }
  ].map((x, idx) => {
    return {
      b: [3],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Swamp (4)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H270_S70_C140_B90", key: "tree_fat" },
    { cFilter: "H260_S70_C140_B90", key: "tree_fat" },
    { cFilter: "H280_S70_C140_B90", key: "tree_fat" },
    // Plante
    { cFilter: "H0", key: "mushroom_red" },
    { cFilter: "H0", key: "mushroom_redGroup" },
    { cFilter: "H0", key: "mushroom_redTall" },
    { cFilter: "H30", key: "mushroom_red" },
    { cFilter: "H30", key: "mushroom_redGroup" },
    { cFilter: "H30", key: "mushroom_redTall" },
    { cFilter: "H60", key: "mushroom_red" },
    { cFilter: "H60", key: "mushroom_redGroup" },
    { cFilter: "H60", key: "mushroom_redTall" },
    { cFilter: "H0", key: "crops_wheatStageB" },
    { cFilter: "H30", key: "crops_wheatStageB" },
    { cFilter: "H60", key: "crops_wheatStageB" }
  ].map((x, idx) => {
    return {
      b: [4],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Plateau (5)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H315_C160_S60_B60", key: "tree_detailed" },
    { cFilter: "H315_C160_S60_B60", key: "tree_oak" },
    { cFilter: "H315_C160_S60_B60", key: "tree_small" },
    { cFilter: "H325_C160_S60_B60", key: "tree_detailed" },
    { cFilter: "H325_C160_S60_B60", key: "tree_oak" },
    { cFilter: "H325_C160_S60_B60", key: "tree_small" },
    { cFilter: "H305_C160_S60_B60", key: "tree_detailed" },
    { cFilter: "H305_C160_S60_B60", key: "tree_oak" },
    { cFilter: "H305_C160_S60_B60", key: "tree_small" },
    // Plante
    { cFilter: "H0", key: "flower_redA" },
    { cFilter: "H0", key: "flower_redB" },
    { cFilter: "H0", key: "flower_redC" }
  ].map((x, idx) => {
    return {
      b: [5],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Rainforest (6)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "C120_B90", key: "tree_detailed_dark" },
    { cFilter: "C120_B90", key: "tree_default_dark" },
    { cFilter: "C120_B90", key: "tree_fat_darkh" },
    { cFilter: "C120_B90", key: "tree_small_dark" },
    { cFilter: "H5_C120_B90", key: "tree_detailed_dark" },
    { cFilter: "H5_C120_B90", key: "tree_default_dark" },
    { cFilter: "H5_C120_B90", key: "tree_fat_darkh" },
    { cFilter: "H5_C120_B90", key: "tree_small_dark" },
    { cFilter: "H355_C120_B90", key: "tree_detailed_dark" },
    { cFilter: "H355_C120_B90", key: "tree_default_dark" },
    { cFilter: "H355_C120_B90", key: "tree_fat_darkh" },
    { cFilter: "H355_C120_B90", key: "tree_small_dark" },
    // Plante
    { cFilter: "H30_C120_B90", key: "mushroom_red" },
    { cFilter: "H30_C120_B90", key: "mushroom_redGroup" }
  ].map((x, idx) => {
    return {
      b: [6],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Fertile Steppe (7)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H15_C120_B90", key: "tree_simple_dark" },
    { cFilter: "H15_C120_B90", key: "tree_tall_dark" },
    { cFilter: "H15_C120_B90", key: "tree_pineTallB" },
    { cFilter: "H15_C120_B90", key: "tree_pineTallD" },
    { cFilter: "H10_C120_B90", key: "tree_simple_dark" },
    { cFilter: "H10_C120_B90", key: "tree_tall_dark" },
    { cFilter: "H10_C120_B90", key: "tree_pineTallB" },
    { cFilter: "H10_C120_B90", key: "tree_pineTallD" },
    { cFilter: "H20_C120_B90", key: "tree_simple_dark" },
    { cFilter: "H20_C120_B90", key: "tree_tall_dark" },
    { cFilter: "H20_C120_B90", key: "tree_pineTallB" },
    { cFilter: "H20_C120_B90", key: "tree_pineTallD" },
    // Plante
    { cFilter: "H30_C120_B90", key: "plant_bushDetailed" },
    { cFilter: "H30_C120_B90", key: "plant_bushLarge" }
  ].map((x, idx) => {
    return {
      b: [7],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Tropical Jungle (8)
  // ---------------------------------------
  ...[
    // Tree
    { Filter: "H330_C110_S90_B90", key: "tree_default" },
    { Filter: "H330_C110_S90_B90", key: "tree_palmDetailedTall" },
    { Filter: "H330_C110_S90_B90", key: "tree_palmTall" },
    { Filter: "H330_C110_S90_B90", key: "tree_plateau" },
    { Filter: "H330_C110_S90_B90", key: "tree_simple" },
    { Filter: "H340_C110_S90_B90", key: "tree_default" },
    { Filter: "H340_C110_S90_B90", key: "tree_palmDetailedTall" },
    { Filter: "H340_C110_S90_B90", key: "tree_palmTall" },
    { Filter: "H340_C110_S90_B90", key: "tree_plateau" },
    { Filter: "H340_C110_S90_B90", key: "tree_simple" },
    { cFilter: "H320_C110_S90_B90", key: "tree_default" },
    { cFilter: "H320_C110_S90_B90", key: "tree_palmDetailedTall" },
    { cFilter: "H320_C110_S90_B90", key: "tree_palmTall" },
    { cFilter: "H320_C110_S90_B90", key: "tree_plateau" },
    { cFilter: "H320_C110_S90_B90", key: "tree_simple" },
    //Plante
    { cFilter: "H330_C130_B90", key: "crops_bambooStageA" },
    { cFilter: "H330_C130_B90", key: "crops_bambooStageB" }
  ].map((x, idx) => {
    return {
      b: [8],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Sand Desert (9)
  // ---------------------------------------
  ...[
    // Tree
    { cFilter: "H0_B100", key: "cactus_short" },
    { cFilter: "H0_B100", key: "cactus_tall" },
    { cFilter: "H15_B100", key: "cactus_short" },
    { cFilter: "H15_B100", key: "cactus_tall" },
    // Plante
    { cFilter: "H0_B100", key: "flower_yellowA" },
    { cFilter: "H0_B100", key: "crops_bambooStageA" },
    { cFilter: "H0_B100", key: "crops_bambooStageB" }
  ].map((x, idx) => {
    return {
      b: [9],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  }),
  // ---------------------------------------
  // Volcanic (10)
  // ---------------------------------------
  ...[
    // Stone
    { cFilter: "H180_C110_S120_B80_I1", key: "stone_tallA" },
    { cFilter: "H180_C110_S120_B80_I1", key: "stone_tallB" },
    { cFilter: "H180_C110_S120_B80_I1", key: "stone_tallE" },
    { cFilter: "H180_C110_S120_B80_I1", key: "stone_tallF" },
    { cFilter: "H180_C110_S120_B80_I1", key: "stone_tallH" },
    { cFilter: "H180_C110_S120_B80_I1", key: "stone_tallJ" },
    { cFilter: "H180_C110_S120_B80_I1", key: "stone_largeD" },
    { cFilter: "H180_C110_S120_B80_I1", key: "stone_largeF" }
  ].map((x, idx) => {
    return {
      b: [10],
      l: { min: 0, max: 255 },
      flore: { mod: 32, eq: idx, min: 0, max: 255 },
      ...x
    };
  })
  // ---------------------------------------
  // ---------------------------------------
].map((x) => {
  return ["_NE", "_SE", "_SW", "_NW"].map((d, idx) => {
    const f = x.flore;
    const key = x.key + d + "#" + x.cFilter;
    return {
      b: x.b,
      l: x.l,
      cFilter: x.cFilter,
      flore: { mod: f.mod * 4, eq: f.eq * 4 + idx, min: f.min, max: f.max },
      key
    };
  });
}).flat();

// IsoGame/map/factory/factoryBiomes.ts
var FactoryBiomes = class _FactoryBiomes {
  static instance;
  static getInstance() {
    return _FactoryBiomes.instance ??= new _FactoryBiomes();
  }
  biomes = {};
  constructor() {
    GAME_BIOMES.forEach((biomeConf) => {
      if (!(biomeConf.id in this.biomes)) {
        this.biomes[biomeConf.id] = new Biome(biomeConf);
      }
    });
    GAME_FLORE_ITEMS.forEach((floreItemsConf) => {
      this.addFloreCondition(floreItemsConf);
    });
  }
  addFloreCondition(floreItemsConf) {
    const f = floreItemsConf;
    const func = `((flore * 1024 | 0) % ${f.flore.mod} == ${f.flore.eq} && flore >= ${f.flore.min} && flore < ${f.flore.max} && lvl >= ${f.l.min} && lvl < ${f.l.max}) ? '${f.key}' `;
    floreItemsConf.b.forEach((bid) => {
      const biomeKey = String(bid);
      this.biomes[biomeKey].appendFloreCondition(func);
    });
  }
};

// IsoGame/map/factory/factoryTileGenerator.ts
var FactoryTileGenerator = class _FactoryTileGenerator {
  static instance;
  static getInstance() {
    return _FactoryTileGenerator.instance ??= new _FactoryTileGenerator();
  }
  // --------------------------------------------------------------------------
  biomes = FactoryBiomes.getInstance().biomes;
  biomeMatrix = GAME_BIOMES_MATRIS;
  waterLvl = 64;
  mountLvl = 196;
  LvlX;
  Lvl2;
  scale;
  constructor() {
    this.LvlX = {
      Z: 0,
      W1: 32,
      W2: 64,
      P0: 64,
      P1: 96,
      P2: 160,
      M1: this.mountLvl,
      M2: 224,
      T: 500
    };
    this.Lvl2 = {
      Z: -144,
      W1: -32,
      W2: 79,
      P0: 80,
      P1: 96,
      P2: 128,
      M1: this.mountLvl,
      M2: this.mountLvl + 128,
      T: this.mountLvl + 256 * 5
      // 288 + 64
    };
    const LvlX = this.LvlX;
    const Lvl2 = this.Lvl2;
    const scale_Base = {
      Z_W1: scalePow([LvlX.Z, LvlX.W1], [Lvl2.Z, Lvl2.W1], 4),
      W1_W2: scalePow([LvlX.W1, LvlX.W2], [Lvl2.W1, Lvl2.W2], -2),
      P0_P1: scaleLinear([LvlX.P0, LvlX.P1], [Lvl2.P0, Lvl2.P1]),
      P1_P2: scaleLinear([LvlX.P1, LvlX.P2], [Lvl2.P1, Lvl2.P2]),
      P2_M1: scaleLinear([LvlX.P2, LvlX.M1], [Lvl2.P2, Lvl2.M1]),
      M1_M2: scalePow([LvlX.M1, LvlX.M2], [Lvl2.M1, Lvl2.M2], 3),
      M2_T: scalePow([LvlX.M2, LvlX.T], [Lvl2.M2, Lvl2.T], 3)
    };
    const fRiverScale = scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], 10);
    this.scale = {
      //  .w. /¯¯ . *¯¯ . *¯¯ .m.   ==> Hill
      Hill: {
        ...scale_Base,
        P0_P1: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], -0.2),
        P1_P2: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], -0.2),
        P2_M1: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], -0.2)
      },
      //  .w. /¯¯ . *¯¯ . _/ .m.  ===> Plateau
      Plat: {
        ...scale_Base,
        P0_P1: scalePow([LvlX.P0, LvlX.P2], [Lvl2.P0, Lvl2.P2], -0.2),
        P1_P2: scalePow([LvlX.P0, LvlX.P2], [Lvl2.P0, Lvl2.P2], -0.2),
        P2_M1: scalePow([LvlX.P2, LvlX.M1], [Lvl2.P2, Lvl2.M1], 3)
      },
      //  .w. -- . __/ . /¯¯ .m. ===> Coline
      Coli: {
        ...scale_Base,
        P0_P1: scaleLinear([LvlX.P0, LvlX.P1], [Lvl2.P0, Lvl2.P1]),
        P1_P2: scalePow([LvlX.P1, LvlX.P2], [Lvl2.P1, Lvl2.P2], 3),
        P2_M1: scalePow([LvlX.P2, LvlX.M1], [Lvl2.P2, Lvl2.M1], -0.2)
      },
      //  .w. __/ . *__/ . *__/ .m. ===> Plane
      Plan: {
        ...scale_Base,
        P0_P1: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], 3),
        P1_P2: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], 3),
        P2_M1: scalePow([LvlX.P0, LvlX.M1], [Lvl2.P0, Lvl2.M1], 3)
      },
      //  .w. __/ . *__/ . *__/ .m. ===> Plane
      River: {
        ...scale_Base,
        P0_P1: (lvl) => fRiverScale(lvl) - 5,
        P1_P2: (lvl) => fRiverScale(lvl) - 5,
        P2_M1: (lvl) => fRiverScale(lvl) - 5
      }
    };
  }
  genTilePeak(tile) {
    const eroLvl = tile.rErosion;
    const peakLvl = tile.rPeak;
    const peakLocal = (1 - eroLvl) * peakLvl;
    if (peakLocal < 3e-3 && eroLvl > 0.55) {
      const factor = 1 - peakLocal * (1 / 3e-3);
      return ["river", -(3 * factor + 1)];
    }
    if (peakLocal < 0.04 && eroLvl < 0.55) {
      const factor = 1 - peakLocal * (1 / 0.04);
      tile.peakType = "talus";
      tile.peakValue = 10 * factor;
      return ["talus", 10 * factor];
    }
    if (peakLocal > 0.4) {
      let factor = (peakLocal - 0.4) * (1 / (1 - 0.4));
      factor = 1 - Math.pow(1 - factor, 6);
      return ["hill", 40 * factor + 2];
    }
    return ["", 0];
  }
  genRawBiome(tile) {
    const lvl = Math.floor(tile.fLvl);
    const mod = 32;
    const temp = (tile.fTemp - tile.fTemp % mod) / mod;
    const hydro = (tile.fHydro - tile.fHydro % mod) / mod;
    let biome = this.biomes[this.biomeMatrix[temp * 8 + hydro]];
    if (lvl < this.waterLvl) {
      biome = this.biomes["ocean"];
    } else if (lvl > this.mountLvl) {
      biome = this.biomes["mont1"];
    } else if (lvl == this.waterLvl || lvl == this.waterLvl + 1) {
      biome = this.biomes["beach"];
    } else if (lvl == this.mountLvl) {
      biome = this.biomes["mountL"];
    } else if (tile.peakValue < 0) {
      biome = this.biomes["river"];
    }
    tile.rawBiome = biome;
    return biome;
  }
  genLvl(tile) {
    const rawLvl = tile.rLvl * 256;
    const rawLvlMod = tile.fLvl;
    let lvl = 0;
    if (rawLvlMod < 80) {
      lvl = 8e-4 * Math.pow(rawLvl - 80, 3) + 70;
    } else {
      lvl = 0.05 * Math.pow(rawLvl - 80, 2) + 70;
    }
    if (rawLvlMod < this.waterLvl) {
      lvl -= 1 / 3;
      return [lvl, this.waterLvl];
    }
    if (rawLvlMod > this.waterLvl) {
      const lvlPeak = tile.peakValue;
      if (tile.peakType == "river") {
        return [lvl - 1 / 3 + lvlPeak, lvl - 1 / 3];
      }
      lvl += lvlPeak;
      return [lvl, lvl];
    }
    return [lvl, lvl];
  }
  genLvlScale(tile) {
    const rawLvl = tile.rLvl * 255;
    const fLvl = tile.fLvl;
    const rLvl2 = 0.5 - (tile.rLvl2 < 0.5 ? tile.rLvl2 : 1 - tile.rLvl2);
    const scale = this.scale[tile.rawBiome.lvlType];
    let lvl = 0;
    const LvlX = this.LvlX;
    const Lvl2 = this.Lvl2;
    if (fLvl < LvlX.W1) {
      lvl = scale.Z_W1(rawLvl);
    } else if (fLvl < LvlX.W2) {
      lvl = scale.W1_W2(rawLvl);
    } else if (fLvl == LvlX.W2) {
      lvl = Lvl2.P0;
    } else if (fLvl < LvlX.P1) {
      lvl = scale.P0_P1(rawLvl);
    } else if (fLvl < LvlX.P2) {
      lvl = scale.P1_P2(rawLvl);
    } else if (fLvl < LvlX.M1) {
      lvl = scale.P2_M1(rawLvl);
    } else if (fLvl == LvlX.M1) {
      lvl = Lvl2.M1;
    } else if (fLvl < LvlX.M2) {
      lvl = scale.M1_M2(rawLvl);
      lvl += rLvl2 * 200;
    } else {
      lvl = scale.M2_T(rawLvl);
      lvl += rLvl2 * 200;
    }
    lvl += rLvl2 * 50;
    lvl = lvl * 1.1;
    return lvl;
  }
  /* ----------- */
  genColor(tile) {
    const c = new Uint8Array(tile.rawBiome.color(tile.fLvl, 0));
    const hsl = rgbToHsl(c[0], c[1], c[2]);
    c.set(hslToRgb(hsl[0], hsl[1] * 0.3, hsl[2]));
    return c;
  }
  genItems(tile) {
    const biome = tile.rawBiome;
    const lvl = tile.fLvl;
    const f = tile.rFlore * 255;
    const itemskey = biome.flore(lvl, f);
    if (itemskey == null) {
      return [];
    }
    return [{ t: "Svg", key: itemskey, lvl: 0 }];
  }
};
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p2, q2, t) => {
      if (t < 0)
        t += 1;
      if (t > 1)
        t -= 1;
      if (t < 1 / 6)
        return p2 + (q2 - p2) * 6 * t;
      if (t < 1 / 2)
        return q2;
      if (t < 2 / 3)
        return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      return p2;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = (max + min) / 2;
  let s = (max + min) / 2;
  const l = (max + min) / 2;
  if (max == min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = (max + min) / 2;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}
function scalePow(domain, range, _) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  return (value) => {
    const normalizedValue = (value - domainMin) / (domainMax - domainMin);
    return rangeMin + (rangeMax - rangeMin) * normalizedValue;
  };
}
function scaleLinear(domain, range) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  return (value) => {
    const normalizedValue = (value - domainMin) / (domainMax - domainMin);
    return rangeMin + (rangeMax - rangeMin) * normalizedValue;
  };
}

// IsoGame/word.ts
var World = class _World {
  static instance;
  static getInstance() {
    return _World.instance ??= new _World();
  }
  seed = "mickey";
  entities = [];
  // player: Player;
  constructor() {
    this.entities = [];
  }
  tick() {
    for (const e of this.entities) {
      e.doTick();
    }
  }
  init() {
  }
};

// IsoGame/map/factory/scripts/simplex-noise.ts
var SimplexNoise = class _SimplexNoise {
  perm;
  permMod12;
  static F2 = 0.5 * (Math.sqrt(3) - 1);
  static G2 = (3 - Math.sqrt(3)) / 6;
  static F3 = 1 / 3;
  static G3 = 1 / 6;
  static F4 = (Math.sqrt(5) - 1) / 4;
  static G4 = (5 - Math.sqrt(5)) / 20;
  static grad3 = new Float32Array([
    1,
    1,
    0,
    -1,
    1,
    0,
    1,
    -1,
    0,
    -1,
    -1,
    0,
    1,
    0,
    1,
    -1,
    0,
    1,
    1,
    0,
    -1,
    -1,
    0,
    -1,
    0,
    1,
    1,
    0,
    -1,
    1,
    0,
    1,
    -1,
    0,
    -1,
    -1
  ]);
  constructor(randomOrSeed) {
    let random;
    if (typeof randomOrSeed === "function") {
      random = randomOrSeed;
    } else if (randomOrSeed) {
      random = _SimplexNoise.alea(randomOrSeed);
    } else {
      random = Math.random;
    }
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    const p = _SimplexNoise.buildPermutationTable(random);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }
  noise2D(xin, yin) {
    const permMod12 = this.permMod12;
    const perm = this.perm;
    const grad3 = _SimplexNoise.grad3;
    let n0 = 0, n1 = 0, n2 = 0;
    const s = (xin + yin) * _SimplexNoise.F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * _SimplexNoise.G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + _SimplexNoise.G2;
    const y1 = y0 - j1 + _SimplexNoise.G2;
    const x2 = x0 - 1 + 2 * _SimplexNoise.G2;
    const y2 = y0 - 1 + 2 * _SimplexNoise.G2;
    const ii = i & 255;
    const jj = j & 255;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = permMod12[ii + perm[jj]] * 3;
      t0 *= t0;
      n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
      t1 *= t1;
      n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
      t2 *= t2;
      n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
    }
    return 70 * (n0 + n1 + n2);
  }
  static buildPermutationTable(random) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (let i = 0; i < 255; i++) {
      const r = i + ~~(random() * (256 - i));
      [p[i], p[r]] = [p[r], p[i]];
    }
    return p;
  }
  static alea(seed) {
    let s0 = 0, s1 = 0, s2 = 0, c = 1;
    const mash = _SimplexNoise.masher();
    s0 = mash(" ");
    s1 = mash(" ");
    s2 = mash(" ");
    for (const char of seed) {
      s0 -= mash(char);
      s1 -= mash(char);
      s2 -= mash(char);
      if (s0 < 0) {
        s0 += 1;
      }
      if (s1 < 0) {
        s1 += 1;
      }
      if (s2 < 0) {
        s2 += 1;
      }
    }
    return function() {
      const t = 2091639 * s0 + c * 23283064365386963e-26;
      s0 = s1;
      s1 = s2;
      s2 = t - (c = t | 0);
      return s2;
    };
  }
  static masher() {
    let n = 4022871197;
    return function(data) {
      for (let i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        let h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 4294967296;
      }
      return (n >>> 0) * 23283064365386963e-26;
    };
  }
};

// IsoGame/map/factory/factoryTileRawGenerator.ts
var F = 5.2;
var FactoryTileRawGenerator = class _FactoryTileRawGenerator {
  static instance;
  static getInstance() {
    return _FactoryTileRawGenerator.instance ??= new _FactoryTileRawGenerator();
  }
  // --------------------------------------------------------------------------
  seed = World.getInstance().seed;
  simplex = new SimplexNoise(this.seed);
  constructor() {
    console.log("== Init Factory Tile Raw Generator ==");
  }
  // --------------------------------------------------------------------------
  // Pretty configured noise function.
  _noise(x, y) {
    const f0 = 1 / 4 / 16;
    return (this.simplex.noise2D(f0 * x, f0 * y) + 1) / 2;
  }
  _factalNoise(x, y, frequencies) {
    const sum = frequencies.reduce((acc, v) => acc + v.a, 0);
    let lvl = 0;
    for (const frequency of frequencies) {
      const f = F * frequency.f;
      const amplitude = frequency.a;
      const t = frequency.t || 0;
      lvl += this._noise(f * x + t, f * y + t) * amplitude;
    }
    lvl /= sum;
    return lvl;
  }
  getRawTemperature(x, y) {
    const frequencies = [
      { a: 15, f: 1 / 264, t: 42 },
      { a: 25, f: 1 / 54, t: 42 },
      { a: 10, f: 1 / 43, t: 42 },
      { a: 2, f: 1 / 6, t: 0 },
      { a: 0.5, f: 25, t: 0 }
    ];
    let lvl = this._factalNoise(x, y, frequencies);
    const t2 = 1042;
    const fBig = F * 1 / 500;
    lvl = lvl + (this._noise(fBig * x + t2, fBig * y + t2) * 2 - 1) * 0.1;
    return lvl;
  }
  getRawHydro(x, y) {
    const frequencies = [
      { a: 20, f: 1 / 47.5, t: -150 },
      { a: 25, f: 1 / 17.5, t: -150 },
      { a: 15, f: 1 / 7.5, t: -150 },
      { a: 3, f: 1 / 0.75, t: -150 },
      { a: 0.5, f: 35, t: 0 }
    ];
    let lvl = this._factalNoise(x, y, frequencies);
    const t2 = -10042;
    const fBig = F * 1 / 387;
    lvl = lvl + (this._noise(fBig * x + t2, fBig * y + t2) * 2 - 1) * 0.3;
    return lvl;
  }
  /* --- */
  getRawLvl(x, y = 1) {
    const frequencies = [
      { a: 32, f: 1 / 140 },
      { a: 20, f: 1 / 60 },
      { a: 10, f: 1 / 25 },
      { a: 2, f: 1 / 10 },
      { a: 0.5, f: 2 / 3 }
    ];
    let lvl = this._factalNoise(x, y, frequencies);
    const fBig = F * 1 / 432;
    lvl = lvl + (this._noise(fBig * x, fBig * y) * 2 - 1) * 0.1;
    return lvl;
  }
  getRawLvl2(x, y = 1) {
    const frequencies = [
      { a: 5, f: 1 / 25 },
      { a: 20, f: 1 / 10 },
      { a: 10, f: 2 / 3 },
      { a: 5, f: 1 },
      { a: 20, f: 16 },
      { a: 20, f: 22 }
    ];
    const lvl = this._factalNoise(x, y, frequencies);
    return lvl;
  }
  getRawPeak(x, y = 1) {
    const frequencies = [
      { a: 1, f: 1 / 17 },
      { a: 1 / 2, f: 2 / 17 },
      { a: 1 / 4, f: 3 / 17 }
    ];
    let lvl = this._factalNoise(x, y, frequencies);
    lvl = (lvl - 0.5) * 2;
    lvl = lvl > 0 ? lvl : -lvl;
    return lvl;
  }
  getRawErosion(x, y = 1) {
    const frequencies = [
      { a: 1, f: 1 / 100 },
      { a: 1 / 8, f: 1 / 50 },
      { a: 1 / 16, f: 1 / 25 }
    ];
    const lvl = this._factalNoise(x, y, frequencies);
    return lvl;
  }
  /* --- */
  getRawFlore(x, y, _ = 0) {
    const frequencies = [
      { a: 4, f: 1 / 15 },
      { a: 1, f: 0.75 }
    ];
    const lvl = this._factalNoise(x, y, frequencies);
    return lvl;
  }
  getRawDensity(x, y) {
    const frequencies = [
      { a: 16, f: 1 / 40 },
      { a: 8, f: 1 / 40 },
      { a: 1, f: 1 / 2 }
    ];
    let lvl = this._factalNoise(x, y, frequencies);
    if (lvl < 0.5) {
      lvl = 1 - lvl;
    }
    return lvl;
  }
  getRawBuildTile(x, y, _ = 0) {
    const frequencies = [
      { a: 1, f: 42 }
    ];
    const lvl = this._factalNoise(x, y, frequencies);
    return lvl;
  }
  /* */
  getFuncLvl(x, y) {
    const lvl = this.getRawLvl(x, y);
    return lvl * 256 & 255;
  }
  getFuncLvl2(x, y) {
    const lvl = this.getRawLvl2(x, y);
    return lvl * 256 & 255;
  }
  getFuncTemperature(x, y) {
    const lvl = this.getRawTemperature(x, y);
    return lvl * 256 & 255;
  }
  getFuncHydro(x, y) {
    const lvl = this.getRawHydro(x, y);
    return lvl * 256 & 255;
  }
  getFuncDensity(x, y) {
    const dencity = this.getRawDensity(x, y);
    return dencity * 255 & 255;
  }
};

// IsoGame/map/object/tileRaw.ts
var AXE_DIRECTION = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0]
];
var RawTile = class {
  x;
  y;
  rLvl;
  rLvl2;
  rPeak;
  rErosion;
  rFlore;
  rBuildTile;
  fHydro;
  fTemp;
  fLvl;
  fDensity;
  peakValue = 0;
  peakType = "";
  rawBiome;
  genLvl;
  genLvl2;
  genLvlWater;
  genColor;
  genItems;
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const ftrg = FactoryTileRawGenerator.getInstance();
    this.rLvl = ftrg.getRawLvl(x, y);
    this.rLvl2 = ftrg.getRawLvl2(x, y);
    this.rPeak = ftrg.getRawPeak(x, y);
    this.rErosion = ftrg.getRawErosion(x, y);
    this.rFlore = ftrg.getRawFlore(x, y);
    this.rBuildTile = ftrg.getRawBuildTile(x, y);
    this.fHydro = ftrg.getFuncHydro(x, y);
    this.fTemp = ftrg.getFuncTemperature(x, y);
    this.fLvl = ftrg.getFuncLvl(x, y);
    this.fDensity = ftrg.getFuncDensity(x, y);
    const ftg = FactoryTileGenerator.getInstance();
    [this.peakType, this.peakValue] = ftg.genTilePeak(this);
    this.rawBiome = ftg.genRawBiome(this);
    [this.genLvl, this.genLvlWater] = ftg.genLvl(this);
    this.genLvl2 = ftg.genLvlScale(this);
    this.genColor = ftg.genColor(this);
    this.genItems = ftg.genItems(this);
  }
};

// IsoGame/map/object/tile.ts
var AXE_DIRECTION2 = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0]
];
var AXE_DIRECTION22 = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1]
];
var Tile = class extends RawTile {
  cx;
  cy;
  _currentLvl;
  _currentColor;
  isBlock = false;
  isFrise = false;
  _nearTiles = [];
  _nearTilesCross = [];
  items = [];
  entities = [];
  temporatyItems = [];
  cityNode;
  wcBuild;
  constructor(x, y, cx, cy) {
    super(x, y);
    this.cx = cx;
    this.cy = cy;
    this._currentLvl = this.genLvl2;
    this._currentColor = this.genColor;
    this.items = this.genItems;
  }
  toJsonInfo() {
    return {
      x: this.x,
      y: this.y,
      currentLvl: this._currentLvl,
      currentColor: [...this._currentColor],
      isBlock: this.isBlock,
      isFrise: this.isFrise,
      wcBuildTile: this.wcBuild?.toJsonInfo() ?? null
      // cityNode: this.cityNode?.toJson() ?? null,
      // items: this.items,
    };
  }
  // ---
  get lvl() {
    return this._currentLvl;
  }
  set lvl(lvl) {
    if (this.isFrise)
      return;
    this._currentLvl = lvl;
  }
  clearLvl() {
    if (this.isFrise)
      return;
    this._currentLvl = this.genLvl2;
  }
  get color() {
    return [...this._currentColor];
  }
  set color([r, g, b, a]) {
    if (this.isFrise)
      return;
    this._currentColor = new Uint8Array([r, g, b, a]);
  }
  clearColor() {
    if (this.isFrise)
      return;
    this._currentColor = this.genColor;
  }
  // ==============================
  addEntity(entity) {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
  }
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }
  // ==============================
  clearItem() {
    if (this.isFrise)
      return;
    if (!this.isFrise)
      this.items.splice(0, this.items.length);
  }
  clearTemporatyItem() {
    this.temporatyItems.splice(0, this.temporatyItems.length);
  }
  toJsonSave() {
    return {
      id: `${this.x}_${this.y}`,
      x: this.x,
      y: this.y,
      chunkId: `${this.cx}_${this.cy}`,
      cx: this.cx,
      cy: this.cy,
      currentLvl: this._currentLvl,
      currentColor: [...this._currentColor],
      isBlock: this.isBlock,
      isFrise: this.isFrise,
      items: this.items ?? []
    };
  }
  fromJsonSave(data) {
    this.color = data.currentColor;
    this.lvl = data.currentLvl;
    this.isBlock = data.isBlock;
    this.isFrise = data.isFrise;
    this.items = data.items ?? [];
  }
  get nearTiles() {
    if (this._nearTiles.length == 0) {
      this._nearTiles = [0, 1, 2, 3].map((axe) => {
        const [dx, dy] = AXE_DIRECTION2[axe];
        return FactoryMap.getInstance().getTile(this.x + dx, this.y + dy);
      });
    }
    return this._nearTiles;
  }
  get nearCrossTiles() {
    if (this._nearTiles.length == 0) {
      this._nearTilesCross = [0, 1, 2, 3].map((axe) => {
        const [dx, dy] = AXE_DIRECTION22[axe];
        return FactoryMap.getInstance().getTile(this.x + dx, this.y + dy);
      });
    }
    return this._nearTilesCross;
  }
  nearTilesAxe(size = 1) {
    return [0, 1, 2, 3].map((axe) => {
      const [dx, dy] = AXE_DIRECTION2[axe];
      return FactoryMap.getInstance().getTile(this.x + dx * size, this.y + dy * size);
    });
  }
  get nearSquareTiles() {
    return [...this.nearTiles, ...this.nearCrossTiles];
  }
};

// IsoGame/map/object/chunk.ts
var CHUNK_SIZE = 32;
var Chunk = class {
  size = CHUNK_SIZE;
  cx;
  cy;
  x;
  y;
  sizeBorder = 2;
  sizeFull;
  matrixGen;
  matrix;
  constructor(cx, cy) {
    this.cx = cx;
    this.cy = cy;
    this.x = cx * this.size;
    this.y = cy * this.size;
    this.sizeFull = this.size + 2 * this.sizeBorder;
    this.matrixGen = Array.from(
      { length: this.sizeFull },
      () => Array(this.sizeFull).fill(null)
    );
    this.matrix = Array.from(
      { length: this.size },
      () => Array(this.size).fill(null)
    );
    this.initGenMatrix();
    this.smoothMatrix();
    this.smoothMatrix();
    this.copyMatrix();
    this.matrixGen = null;
  }
  get(x, y) {
    return this.matrix[x][y];
  }
  initGenMatrix() {
    for (let i = 0; i < this.sizeFull; i++) {
      for (let j = 0; j < this.sizeFull; j++) {
        this.matrixGen[i][j] = new Tile(
          this.x + i - this.sizeBorder,
          this.y + j - this.sizeBorder,
          this.cx,
          this.cy
        );
      }
    }
  }
  copyMatrix() {
    const k = this.sizeBorder;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        this.matrix[i][j] = this.matrixGen[i + k][j + k];
      }
    }
  }
  smoothMatrix() {
    for (let i = 1; i < this.sizeFull - 1; i++) {
      for (let j = 1; j < this.sizeFull - 1; j++) {
        const sum = [
          // this.matrixGen[i][j].lvl,
          this.matrixGen[i + 1][j].lvl,
          this.matrixGen[i - 1][j].lvl,
          this.matrixGen[i][j + 1].lvl,
          this.matrixGen[i][j - 1].lvl,
          this.matrixGen[i + 1][j + 1].lvl,
          this.matrixGen[i - 1][j - 1].lvl,
          this.matrixGen[i - 1][j + 1].lvl,
          this.matrixGen[i + 1][j - 1].lvl
        ].reduce((a, b) => a + (b || 0), 0);
        this.matrixGen[i][j].lvl = sum / 8;
      }
    }
  }
  /*
    async load(): Promise<boolean> {
      const chunkId = `${this.cx}_${this.cy}`;
      const loadDataTiles = await db.MapTiles.where({ chunkId }).toArray();
      if (loadDataTiles.length === this.size * this.size) {
        loadDataTiles.forEach((tileData) => {
          const xx = tileData.x >= 0
            ? tileData.x % this.size
            : this.size + (tileData.x % this.size) - 1;
          const yy = tileData.y >= 0
            ? tileData.y % this.size
            : this.size + (tileData.y % this.size) - 1;
          if (this.matrix[xx] && this.matrix[xx][yy]) {
            this.matrix[xx][yy]!.fromJsonSave(tileData);
          }
        });
        return true;
      }
      return false;
    }
  
    async save() {
      const chunkId = `${this.cx}_${this.cy}`;
      const tileSaveList = [];
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          tileSaveList.push(this.matrix[i][j]!.toJsonSave());
        }
      }
  
      try {
        await window.db.MapTiles.bulkPut(tileSaveList);
      } catch (e) {
        console.error("DB Put Not OK", e);
      }
  
      try {
        await window.db.MapChunks.bulkPut([{
          id: chunkId,
          cx: this.cx,
          cy: this.cy,
        }]);
      } catch (e) {
        console.error("DB Put Not OK", e);
      }
    }
    */
};

// IsoGame/map/factory/factoryMap.ts
var FactoryMap = class _FactoryMap {
  static instance;
  static getInstance() {
    return _FactoryMap.instance ??= new _FactoryMap();
  }
  chunkIndex = /* @__PURE__ */ new Map();
  constructor() {
    this.getChunk(0, 0);
  }
  getExistingChunk(cx, cy) {
    return this.chunkIndex.get(cx)?.get(cy) ?? null;
  }
  getChunk(cx, cy) {
    if (!this.chunkIndex.has(cx)) {
      this.chunkIndex.set(cx, /* @__PURE__ */ new Map());
    }
    const chunkRow = this.chunkIndex.get(cx);
    if (!chunkRow.has(cy)) {
      chunkRow.set(cy, new Chunk(cx, cy));
    }
    return chunkRow.get(cy);
  }
  chunkPoint(x, y) {
    const modx = (CHUNK_SIZE + x % CHUNK_SIZE) % CHUNK_SIZE;
    const mody = (CHUNK_SIZE + y % CHUNK_SIZE) % CHUNK_SIZE;
    const xx = x - modx;
    const yy = y - mody;
    return [
      Math.floor(xx / CHUNK_SIZE),
      Math.floor(yy / CHUNK_SIZE),
      modx,
      mody
    ];
  }
  getRoundTile(x, y) {
    return this.getTile(Math.round(x), Math.round(y));
  }
  getTile(x, y) {
    const [cx, cy, modx, mody] = this.chunkPoint(x, y);
    return this.getChunk(cx, cy).get(modx, mody);
  }
  getTileNoGen(x, y) {
    const [cx, cy, modx, mody] = this.chunkPoint(x, y);
    const chunk = this.getExistingChunk(cx, cy);
    return chunk ? chunk.get(modx, mody) : new Tile(x, y, cx, cy);
  }
  getTileColor(x, y) {
    const [cx, cy, modx, mody] = this.chunkPoint(x, y);
    const chunk = this.getExistingChunk(cx, cy);
    return chunk ? chunk.get(modx, mody)?.color : new RawTile(x, y).genColor;
  }
  getTileLvl(x, y) {
    const [cx, cy, modx, mody] = this.chunkPoint(x, y);
    const chunk = this.getExistingChunk(cx, cy);
    return chunk ? chunk.get(modx, mody)?.lvl : new RawTile(x, y).genLvl2;
  }
};

// IsoGame/map/object/tilesMatrix.ts
var TilesMatrix = class {
  world;
  fm;
  size;
  tiles;
  avgLvl;
  x = 0;
  y = 0;
  tileScaleMod;
  rangeX = [];
  rangeY = [];
  constructor(size = 20, x = 0, y = 0, tileScaleMod = 1) {
    this.world = World.getInstance();
    this.fm = FactoryMap.getInstance();
    this.size = size;
    const tile = new Tile(0, 0, 0, 0);
    this.tiles = Array.from(
      { length: this.size },
      () => Array.from(
        { length: this.size },
        () => tile
      )
    );
    this.tileScaleMod = tileScaleMod;
    this.avgLvl = 0;
    this.setCenter(x, y);
    this.update();
  }
  getPos() {
    return [this.x, this.y];
  }
  move(diffx, diffy) {
    this.setCenter(this.x + diffx, this.y + diffy);
  }
  setCenter(x, y) {
    this.x = x - x % this.tileScaleMod;
    this.y = y - y % this.tileScaleMod;
    this.rangeX = Array.from(
      { length: this.size },
      (_, index) => this.tileScaleMod * index - this.tileScaleMod * Math.floor(this.size / 2) + this.x
    );
    this.rangeY = Array.from(
      { length: this.size },
      (_, index) => this.tileScaleMod * index - this.tileScaleMod * Math.floor(this.size / 2) + this.y
    );
    this.update(this.tileScaleMod == 1);
  }
  update(generateChunk = false) {
    this.avgLvl = 0;
    this.rangeX.forEach((x, idx) => {
      this.rangeY.forEach((y, idy) => {
        const tile = generateChunk ? this.fm.getTile(x, y) : this.fm.getTileNoGen(x, y);
        if (!tile) {
          console.error("---ERROR", x, y, tile, this);
        } else {
          this.tiles[idx][idy] = tile;
          this.avgLvl += tile.lvl;
        }
      });
    });
    this.avgLvl /= this.size * this.size;
  }
};

// IsoGame/map/tileActions.ts
var TilesActions = class _TilesActions {
  static instance;
  static getInstance() {
    return _TilesActions.instance ??= new _TilesActions();
  }
  world;
  fm;
  index;
  listTilesUpdated;
  listTilesWithTempItems;
  constructor() {
    this.world = World.getInstance();
    this.fm = FactoryMap.getInstance();
    this.listTilesWithTempItems = [];
    this.listTilesUpdated = /* @__PURE__ */ new Set();
    this.index = {
      // doFunction: this.doFunction.bind(this),
      setBlocked: this.setBlocked.bind(this),
      setBlockedSquare: this.setBlockedSquare.bind(this),
      setFrise: this.setFrise.bind(this),
      setFriseSquare: this.setFriseSquare.bind(this),
      itemForceKey: this.itemForceKey.bind(this),
      itemAddKey: this.itemAddKey.bind(this),
      clearItem: this.clearItem.bind(this),
      clearItemSquare: this.clearItemSquare.bind(this),
      clearColor: this.clearColor.bind(this),
      clearColorSquare: this.clearColorSquare.bind(this),
      clearLvl: this.clearLvl.bind(this),
      clearLvlSquare: this.clearLvlSquare.bind(this),
      clearAll: this.clearAll.bind(this),
      clearAllSquare: this.clearAllSquare.bind(this),
      lvlSet: this.lvlSet.bind(this),
      lvlUp: this.lvlUp.bind(this),
      lvlUpSquare: this.lvlUpSquare.bind(this),
      lvlFlatSquare: this.lvlFlatSquare.bind(this),
      lvlAvgSquare: this.lvlAvgSquare.bind(this),
      lvlAvgBorder: this.lvlAvgBorder.bind(this),
      colorSquare: this.colorSquare.bind(this),
      temporatyItemsForceKey: this.temporatyItemsForceKey.bind(this)
      // clearAllTemporatyItems: this.clearAllTemporatyItems.bind(this),
    };
  }
  //--------------------
  doAction(conf) {
    if (conf.func && this.index[conf.func]) {
      this.index[conf.func](conf);
    }
  }
  doActions(confs) {
    for (const conf of confs) {
      if (conf.func && this.index[conf.func]) {
        this.index[conf.func](conf);
      }
    }
  }
  // ---------------------
  // Add item to a Tiles
  // ---------------------
  setBlocked(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.isBlock = conf.isBlock || false;
    this.listTilesUpdated.add(tile);
  }
  setBlockedSquare(conf) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.isBlock = conf.isBlock || false;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }
  setFrise(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.isFrise = conf.isFrise || false;
    this.listTilesUpdated.add(tile);
  }
  setFriseSquare(conf) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.isFrise = conf.isFrise || false;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }
  clearAllTile(tile) {
    tile.isBlock = false;
    tile.isFrise = false;
    tile.clearColor();
    tile.clearItem();
    this.listTilesUpdated.add(tile);
  }
  clearAll(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    this.clearAllTile(tile);
  }
  clearAllSquare(conf) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        this.clearAllTile(cellTile);
      });
    });
  }
  // ---------------------
  // Add item to a Tiles
  // ---------------------
  itemAddKey(conf) {
    if (!conf.assetKey)
      return;
    const tile = this.fm.getTile(conf.x, conf.y);
    const h = conf.h ? conf.h : 0;
    tile.items.push({
      t: "Asset",
      key: conf.assetKey,
      lvl: h,
      off: conf.off
    });
    this.listTilesUpdated.add(tile);
  }
  itemForceKey(conf) {
    if (!conf.assetKey)
      return;
    const tile = this.fm.getTile(conf.x, conf.y);
    const h = conf.h ? conf.h : 0;
    tile.clearItem();
    tile.items.push({ t: "Asset", key: conf.assetKey, lvl: h, off: conf.off });
    this.listTilesUpdated.add(tile);
  }
  clearItem(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.clearItem();
    this.listTilesUpdated.add(tile);
  }
  // Temporaty
  _tileTemporatyItemsForceKey(tile, conf) {
    tile.temporatyItems.splice(0, tile.temporatyItems.length);
    tile.temporatyItems.push(conf);
    this.listTilesWithTempItems.push(tile);
  }
  //assetKey
  temporatyItemsForceKey(conf) {
    if (!conf.assetKey)
      return;
    const tile = this.fm.getTile(conf.x, conf.y);
    const h = conf.h ? conf.h : 0;
    this._tileTemporatyItemsForceKey(tile, {
      t: "Asset",
      key: conf.assetKey,
      lvl: h
    });
  }
  clearAllTemporatyItems(_conf) {
    this.listTilesWithTempItems.forEach((tile) => {
      tile.clearTemporatyItem();
    });
    this.listTilesWithTempItems = [];
  }
  clearItemSquare(conf) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.clearItem();
        this.listTilesUpdated.add(cellTile);
      });
    });
  }
  // ---------------------
  // Lvl of Tiles
  // ---------------------
  clearLvl(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.clearLvl();
    this.listTilesUpdated.add(tile);
  }
  clearLvlSquare(conf) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.clearLvl();
        this.listTilesUpdated.add(cellTile);
      });
    });
  }
  // -------------------
  lvlSet(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.lvl = conf.lvl || tile.lvl;
    this.listTilesUpdated.add(tile);
  }
  lvlUp(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.lvl += conf.lvl || 0;
    this.listTilesUpdated.add(tile);
  }
  lvlUpSquare(conf) {
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.lvl += conf.lvl || 0;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }
  lvlFlatSquare(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.lvl = tile.lvl;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }
  lvlAvg(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    let sumLvl = 0;
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        sumLvl += cellTile.lvl;
        this.listTilesUpdated.add(cellTile);
      });
    });
    const size = conf.size || 1;
    const avgLvl = sumLvl / (size * size);
    tile.lvl = avgLvl;
  }
  lvlAvgSquare(conf) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        this.lvlAvg({ x: cellTile.x, y: cellTile.y, size: 3 });
      });
    });
  }
  lvlAvgBorder(conf) {
    const x = conf.x;
    const y = conf.y;
    const size = conf.size || 1;
    const fCenter = Math.floor(size / 2);
    const rangeX = Array.from(
      { length: size },
      (_, index) => index - fCenter + x
    );
    const rangeY = Array.from(
      { length: size },
      (_, index) => index - fCenter + y
    );
    rangeX.forEach((xx) => {
      this.lvlAvg({ x: xx, y: y - fCenter - 1, size: 3 });
      this.lvlAvg({ x: xx, y: y + (size - fCenter), size: 3 });
    });
    rangeY.forEach((yy) => {
      this.lvlAvg({ x: x - fCenter - 1, y: yy, size: 3 });
      this.lvlAvg({ x: x + (size - fCenter), y: yy, size: 3 });
    });
  }
  // ---------------------
  // Color of Tiles
  // ---------------------
  clearColor(conf) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.clearColor();
    this.listTilesUpdated.add(tile);
  }
  clearColorSquare(conf) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.clearColor();
        this.listTilesUpdated.add(cellTile);
      });
    });
  }
  color(conf) {
    const confColor = conf.color || [0, 0, 0, 1];
    if (confColor.length == 3)
      confColor.push(255);
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.color = confColor;
    this.listTilesUpdated.add(tile);
  }
  colorSquare(conf) {
    const confColor = conf.color || [0, 0, 0, 255];
    if (confColor.length == 3)
      confColor.push(255);
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.color = confColor;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }
};

// IsoGame/wcBuilding2/wcUtils.ts
var confsGroup_to_confsTile = (confs) => {
  const flatConfs = confs.map(
    (conf) => conf.items.map((i) => ({ ...i, face: conf.face }))
  ).flat();
  return flatConfs.map((conf) => confRawTile_to_confsTile(conf)).flat();
};
var confsRawTile_to_confsTile = (confs) => {
  return confs.flatMap((conf) => confRawTile_to_confsTile(conf));
};
var confRawTile_to_confsTile = (conf) => {
  const DIRECTIONS = ["_NW", "_NE", "_SE", "_SW"];
  const shiftArrayByOne = (arr) => {
    if (arr.length <= 1)
      return [...arr];
    return [arr[arr.length - 1], ...arr.slice(0, arr.length - 1)];
  };
  const appendDirectionKey = (obj, axeIndex) => {
    if (!obj.key)
      return;
    const rotation = obj.keyR || 0;
    const dirIndex = (axeIndex + 4 - rotation) % 4;
    const suffix = obj.sufix || "";
    obj.key = obj.key + DIRECTIONS[dirIndex] + suffix;
    if (obj.off) {
      console.log("---------------------------------------------- CONF OG ");
      obj.off = {
        x: dirIndex < 2 ? obj.off.x : -obj.off.x,
        y: dirIndex == 0 || dirIndex == 3 ? obj.off.y : -obj.off.y
      };
    }
  };
  const processCollection = (collection, axeIndex) => {
    if (!collection)
      return void 0;
    return collection.map((item) => {
      const itemCopy = { ...item };
      appendDirectionKey(itemCopy, axeIndex);
      return itemCopy;
    });
  };
  let currentFace = [...conf.face];
  return [0, 1, 2, 3].map((axeIndex) => {
    const result = { ...conf };
    appendDirectionKey(result, axeIndex);
    result.assets = processCollection(result.assets, axeIndex);
    result.face = [...currentFace];
    currentFace = shiftArrayByOne(currentFace);
    return result;
  });
};
function pickRandomWeightedObject(array, rand = null) {
  if (array.length === 0)
    return null;
  const mrand = rand !== null ? rand : Math.random();
  const totalWeight = array.reduce((acc, obj) => acc + (obj?.weight || 0.01), 0);
  const randomWeight = mrand * totalWeight;
  let accumulatedWeight = 0;
  for (const obj of array) {
    accumulatedWeight += obj?.weight || 0.01;
    if (accumulatedWeight >= randomWeight) {
      return obj;
    }
  }
  return null;
}

// IsoGame/wcBuilding2/AbstractBuildConf.ts
var AbstractWcBuildConf = class {
  growLoopCount;
  endLoopMax;
  faceLinkWeight;
  faceLinks;
  listTileOptions;
  indexTileOptions_KeyFaceKey;
  listFaceKey;
  startTileOptions;
  mainLvl;
  constructor(conf) {
    this.growLoopCount = conf.growLoopCount || conf.growLoopCount === 0 ? conf.growLoopCount : 10;
    this.endLoopMax = conf.endLoopMax || conf.endLoopMax === 0 ? conf.endLoopMax : 2e3;
    this.faceLinkWeight = {};
    this.faceLinks = [];
    this.startTileOptions = [];
    this.listTileOptions = [];
    this.indexTileOptions_KeyFaceKey = {};
    this.listFaceKey = [];
    this.preInit();
  }
  preInit() {
  }
  init() {
    if (this.__TILE_START.length > 0) {
      this.startTileOptions = confsGroup_to_confsTile(this.__TILE_START).map(
        (conf) => {
          conf.lvl = this.mainLvl;
          return conf;
        }
      );
    } else {
      this.startTileOptions = confsRawTile_to_confsTile(this.__TILE_START_RAW).map(
        (conf) => {
          conf.lvl = this.mainLvl;
          return conf;
        }
      );
    }
    if (this.__TILE_LIST.length > 0) {
      this.listTileOptions = confsGroup_to_confsTile(this.__TILE_LIST).map(
        (conf) => {
          conf.lvl = this.mainLvl;
          return conf;
        }
      );
    } else {
      this.listTileOptions = confsRawTile_to_confsTile(this.__TILE_LIST_RAW).map(
        (conf) => {
          conf.lvl = this.mainLvl;
          return conf;
        }
      );
    }
    this.faceLinks = this.faceLinks.map((link) => [
      [link[0], link[1]],
      [link[1], link[0]]
    ]).flat();
    const keyFaceKeyEntrie = this.listTileOptions.map(
      (tileOpt) => [
        tileOpt.face.map((k) => k === null ? "null" : k).join("|"),
        tileOpt
      ]
    );
    this.indexTileOptions_KeyFaceKey = keyFaceKeyEntrie.reduce(
      (acc, v) => {
        if (!acc[v[0]])
          acc[v[0]] = [];
        acc[v[0]].push(v[1]);
        return acc;
      },
      {}
    );
    this.listFaceKey = Object.entries(this.indexTileOptions_KeyFaceKey).map(([key, _]) => {
      const face = key.split("|").map((key2) => "null".localeCompare(key2) === 0 ? null : key2);
      return face;
    });
  }
  get __TILE_START_RAW() {
    return [];
  }
  get __TILE_LIST_RAW() {
    return [];
  }
  get __TILE_START() {
    return [];
  }
  get __TILE_LIST() {
    return [];
  }
  get TILE_START_OPTIONS() {
    return this.startTileOptions;
  }
  get TILE_START() {
    return pickRandomWeightedObject(this.startTileOptions);
  }
  /**
   * Get a List a FaceKey that can be linked to the Original Face
   * @param face Original FaceKey
   * @returns
   */
  linkedFaceKey(face) {
    const filterLink = this.faceLinks.filter(
      (x) => face === null ? x[0] === null : x[0].localeCompare(face) === 0
    );
    return filterLink.length ? filterLink.map((l) => l[1]) : [];
  }
};

// IsoGame/wcBuilding2/conf/assetsCollection/wcUtils.ts
var actionsEmpty = [
  { func: "lvlAvgSquare", size: 5 },
  { func: "lvlAvgSquare", size: 7 }
];
var applyGroup = (wcConfs, group) => {
  return wcConfs.map((it) => {
    return {
      ...it,
      ...group
    };
  });
};
function tagFaces(conf, tags) {
  const face = conf.face.map((f) => {
    for (const tag of tags) {
      if (f != null && f.endsWith(tag[0])) {
        return f + tag[1];
      }
    }
    return f;
  });
  return {
    ...conf,
    face
  };
}

// IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_Entrer.ts
var wcAsset_Enter = class {
  tag = "E_";
  constructor() {
  }
  // ==========================================================================
  faceLinkWeight() {
    return {
      "E_in#Open": 1,
      "E_l#Open": 1,
      "E_r#Open": 1,
      "E#Open": 1,
      "E#Door": 1
    };
  }
  getFaceLinks(links) {
    return [
      ...links.out.map((k) => ["E_out", k]),
      ...links.l.map((k) => ["E_l", k]),
      ...links.r.map((k) => ["E_r", k]),
      ["E_l#Open#X", "E_r#Open"],
      ["E_l#Open", "E_r#Open#X"],
      ["E#Open", "E_in#Open"],
      ...links.door.map((k) => ["E#Door", k])
    ];
  }
  groupInit() {
    return [
      {
        face: ["E#Open", "E#Open", "E#Door", "E#Open"],
        color: [12, 12, 16],
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true
      }
    ];
  }
  groupAsset() {
    return [
      ...applyGroup([
        //in#Open Connect to 0#Open .
        // Flat
        {
          face: ["in#Open", "l#Open", "out", "r#Open"].map((p) => "E_" + p)
        },
        // Corner
        {
          face: ["out", "out", "r#Open#X", "l#Open#X"].map((p) => "E_" + p)
        },
        // Flat linked
        {
          face: ["in#Open", "l#Open", "out", "r"].map((p) => "E_" + p)
        },
        {
          face: ["in#Open", "l", "out", "r#Open"].map((p) => "E_" + p)
        }
        // { face: ["in", "in", "l", "r"].map((p) => ("F2_" + p)) as WcFace },
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty,
        color: [28, 28, 32]
      })
    ];
  }
  // ==========================================================================
};
var wcAsset_EnterSimple = class {
  tag = "E_";
  constructor() {
  }
  // ==========================================================================
  faceLinkWeight() {
    return {
      "E_in": 1,
      "E_l": 1,
      "E_r": 1,
      "E_Door": 1
    };
  }
  getFaceLinks(links) {
    return [
      ...links.out.map((k) => ["E_out", k]),
      ...links.l.map((k) => ["E_l", k]),
      ...links.r.map((k) => ["E_r", k]),
      ...links.door.map((k) => ["E_Door", k])
      // ["E_l#Open#X", "E_r#Open"],
      // ["E_l#Open", "E_r#Open#X"],
      // ["E#Open", "E_in#Open"],
    ];
  }
  groupInit() {
    return [
      {
        face: ["E_Door", "E_l", "E_out", "E_r"],
        color: [12, 12, 16],
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true
      }
    ];
  }
  groupAsset() {
    return [
      ...applyGroup([
        //in#Open Connect to 0#Open .
        // Flat
        {
          face: ["in#Open", "l#Open", "out", "r#Open"].map((p) => "E_" + p)
        },
        // Corner
        {
          face: ["out", "out", "r#Open#X", "l#Open#X"].map((p) => "E_" + p)
        },
        // Flat linked
        {
          face: ["in#Open", "l#Open", "out", "r"].map((p) => "E_" + p)
        },
        {
          face: ["in#Open", "l", "out", "r#Open"].map((p) => "E_" + p)
        }
        // { face: ["in", "in", "l", "r"].map((p) => ("F2_" + p)) as WcFace },
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty,
        color: [28, 28, 32]
      })
    ];
  }
  // ==========================================================================
};

// IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_Fence2.ts
var WcAsset_Fence2 = class {
  WALL_SUFFIX;
  // '#H200_S20_C135_B105'
  collapseType;
  tag;
  color = [92, 92, 92];
  defaultConf = {
    tag: "DEFAULT",
    suffix: "#H200_S20_C135_B105",
    collapseType: 0 /* Simple */
  };
  assetKey = {
    corner: { k: "hedgeCorner", r: 0 },
    flat: { k: "hedge", r: 2 },
    inner: null
  };
  constructor(conf) {
    this.tag = conf.tag || this.defaultConf.tag;
    this.WALL_SUFFIX = conf.suffix || this.defaultConf.suffix;
    this.collapseType = conf.collapseType || this.defaultConf.collapseType;
  }
  faceLinkWeight(fout = 1, fside = 1, fin = 1) {
    const linkWeith = this.faceLinkWeightSimple(fout, fside, fin);
    if (this.collapseType == 1 /* NoSquare */) {
      return {
        ...linkWeith,
        ...this.faceLinkWeightNoSquare(fside)
      };
    }
    if (this.collapseType == 2 /* Exclude */) {
      return {
        ...linkWeith,
        ...this.faceLinkWeightExclude(fside)
      };
    }
    return linkWeith;
  }
  faceLinkWeightSimple(fout = 1, fside = 1, fin = 1) {
    return Object.fromEntries([
      [this.tag + "out", fout],
      [this.tag + "l", fside],
      [this.tag + "r", fside],
      [this.tag + "in", fin]
    ]);
  }
  faceLinkWeightNoSquare(fside = 1) {
    return Object.fromEntries([
      [this.tag + "l#X", fside],
      [this.tag + "r#X", fside]
    ]);
  }
  faceLinkWeightExclude(fside = 1) {
    return Object.fromEntries([
      [this.tag + "l#Xi", fside],
      [this.tag + "r#Xi", fside],
      [this.tag + "l#Xc", fside],
      [this.tag + "r#Xc", fside]
    ]);
  }
  // ==================================================
  getFaceLinks(links) {
    const base = this.getFaceLinksBase(links);
    switch (this.collapseType) {
      case 0 /* Simple */:
        return base;
      case 1 /* NoSquare */:
        return [...base, ...this.getFaceLinksNoSquare()];
      case 2 /* Exclude */:
        return [...base, ...this.getFaceLinksExclude()];
    }
  }
  getFaceLinksSide(links) {
    return [
      ...links.l.map((k) => [this.tag + "l", k]),
      ...links.r.map((k) => [this.tag + "r", k])
    ];
  }
  // ------------------------------------
  getFaceLinksBase(links) {
    return [
      ...links.in.map((k) => [this.tag + "in", k]),
      ...links.out.map((k) => [this.tag + "out", k]),
      [this.tag + "r", this.tag + "l"]
    ];
  }
  getFaceLinksNoSquare() {
    return [
      [this.tag + "r", this.tag + "l"],
      [this.tag + "l#X", this.tag + "r"],
      [this.tag + "l", this.tag + "r#X"]
    ];
  }
  getFaceLinksExclude() {
    return [
      [this.tag + "r", this.tag + "l"],
      [this.tag + "l#X", this.tag + "r"],
      [this.tag + "l", this.tag + "r#X"],
      [this.tag + "l", this.tag + "r#Xc"],
      [this.tag + "l", this.tag + "r#Xi"],
      [this.tag + "r", this.tag + "l#Xc"],
      [this.tag + "r", this.tag + "l#Xi"],
      [this.tag + "l#Xi", this.tag + "r#Xc"],
      [this.tag + "l#Xc", this.tag + "r#Xi"]
    ];
  }
  // -----------------------
  groupAsset(conf) {
    switch (this.collapseType) {
      case 0 /* Simple */:
        return this.groupAssetBase(conf);
      case 1 /* NoSquare */:
        return this.groupAssetNoSquare(conf);
      case 2 /* Exclude */:
        return this.groupAssetExclude(conf);
    }
  }
  groupAssetBase(conf) {
    return [
      ...applyGroup([
        { ...this.Corner, weight: conf.cornerW || 0 },
        { ...this.Flat, weight: conf.flatW || 0 },
        { ...this.InnerCorner, weight: conf.innerW || 0 }
      ], {
        allowMove: true,
        isFrise: conf.isFrise || false,
        functions: actionsEmpty,
        color: this.color
      })
    ];
  }
  // -----------------------
  groupAssetNoSquare(conf) {
    return [
      ...applyGroup([
        {
          ...tagFaces(this.Corner, [["r", "#X"], ["l", "#X"]]),
          weight: conf.cornerW || 0
        },
        { ...this.Flat, weight: conf.flatW || 0 },
        { ...this.InnerCorner, weight: conf.innerW || 0 }
      ], {
        allowMove: true,
        isFrise: conf.isFrise || false,
        functions: actionsEmpty,
        color: this.color
      })
    ];
  }
  // -----------------------
  groupAssetExclude(conf) {
    return [
      ...applyGroup([
        {
          ...tagFaces(this.Corner, [["r", "#Xc"], ["l", "#Xc"]]),
          weight: conf.cornerW || 0
        },
        { ...this.Flat, weight: conf.flatW || 0 },
        {
          ...tagFaces(this.InnerCorner, [["r", "#Xi"], ["l", "#Xi"]]),
          weight: conf.innerW || 0
        }
      ], {
        allowMove: true,
        isFrise: conf.isFrise || false,
        functions: actionsEmpty,
        color: this.color
      })
    ];
  }
  // ==========================================================================
  get Corner() {
    return {
      face: ["out", "out", "r", "l"].map((p) => this.tag + p),
      weight: 0,
      assets: !this.assetKey.corner ? [] : [
        {
          h: 0,
          key: this.assetKey.corner.k,
          keyR: this.assetKey.corner.r,
          off: this.assetKey.corner.off,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  get Flat() {
    return {
      face: ["in", "l", "out", "r"].map((p) => this.tag + p),
      weight: 0,
      assets: !this.assetKey.flat ? [] : [
        {
          h: 0,
          key: this.assetKey.flat.k,
          keyR: this.assetKey.flat.r,
          off: this.assetKey.flat.off,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  get InnerCorner() {
    return {
      face: ["in", "in", "l", "r"].map((p) => this.tag + p),
      weight: 0,
      assets: this.assetKey.inner === null ? [] : [
        {
          h: 0,
          key: this.assetKey.inner.k,
          keyR: this.assetKey.inner.r,
          off: this.assetKey.inner.off,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ==========================================================================
};
var WcAsset_FenceSimple = class extends WcAsset_Fence2 {
  assetKey = {
    corner: { k: "fence_corner", r: 0 },
    flat: { k: "fence_simple", r: 2 },
    inner: null
  };
};
var WcAsset_FencePlatform = class extends WcAsset_Fence2 {
  assetKey = {
    corner: { k: "platform_cornerOpen", r: 1 },
    flat: { k: "platform_side", r: 0 },
    inner: { k: "platform_cornerDot", r: 1 }
  };
};
var WcAsset_FenceGrave = class extends WcAsset_Fence2 {
  assetKey = {
    corner: {
      off: { x: 0.5, y: 0.5 },
      k: "pillarSquare",
      r: 2
    },
    flat: { k: "ironFenceBorder", r: 2 },
    inner: { k: "ironFenceBorderCurve", r: 3 }
  };
};
var WcAsset_FenceEnter = class extends WcAsset_Fence2 {
  color = [32, 32, 32];
  assetKey = {
    corner: null,
    flat: null,
    inner: null
  };
};
var WcAsset_FGraveIn = class extends WcAsset_Fence2 {
  color = [32, 32, 32];
  assetKey = {
    corner: null,
    flat: null,
    inner: null
  };
};
var WcAsset_FGraveBone = class extends WcAsset_Fence2 {
  color = [38, 32, 32];
  assetKey = {
    corner: { k: "bones", r: 2 },
    flat: { k: "bones", r: 2 },
    inner: { k: "bones", r: 2 }
  };
};
var WcAsset_FGraveAltar = class extends WcAsset_Fence2 {
  color = [42, 32, 32];
  assetKey = {
    corner: null,
    flat: { k: "altarWood", r: 2 },
    inner: null
  };
};

// IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_WallHouse.ts
var WcAsset_WallHouse = class {
  tag = "WH_";
  ROOF_PREFIX = "roof";
  // ROOF_PREFIX = "roofHigh";
  WALL_PREFIX = "wall";
  // WALL_PREFIX = "wallWood";
  WALL_SUFFIX;
  // '#H200_S20_C135_B105'
  ROOF_SUFFIX;
  // '#H200_S20_C135_B105'
  constructor(WALL_SUFFIX = "#H210_C115_S35_B120", ROOF_SUFFIX = "#H0_S1_C128_B64") {
    this.WALL_SUFFIX = WALL_SUFFIX;
    this.ROOF_SUFFIX = ROOF_SUFFIX;
  }
  // =========================================
  // =========================================
  // roof
  // roofCorner
  // roofCornerRound
  // roofWindow
  // roofCornerInner
  // roofPoint
  // wall
  // wallCorner
  // wallCornerDiagonal
  // wallDoor
  // wallWindowGlass
  // wallBlock
  // wall
  // wall
  // wall
  // ----------------
  // ["Wr", "Wl", "Wout", "Wout"],
  get Corner() {
    return {
      face: ["r", "l", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 1,
          key: this.ROOF_PREFIX + "Corner",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "Corner",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ["Wr", "Wl", "Wout", "Wout"],
  get Corner_B() {
    return {
      face: ["r", "l", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 1,
          key: this.ROOF_PREFIX + "CornerRound",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "CornerDiagonal",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ----------------
  //  ["Wr", "A", "Wl", "Wout"]
  get Wall_Door() {
    return {
      face: ["r", "in", "l", "outD"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 1,
          key: this.ROOF_PREFIX + "",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "Door",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  //  ["Wr", "A", "Wl", "Wout"]
  get Wall() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 1,
          key: this.ROOF_PREFIX + "",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  //  ["Wr", "A", "Wl", "Wout"]
  get Wall_RoofWindows() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 1,
          key: this.ROOF_PREFIX + "",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "WindowGlass",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  //  ["Wr", "A", "Wl", "Wout"]
  get Wall_Windows() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 1,
          key: this.ROOF_PREFIX + "Window",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "WindowGlass",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ----------------
  // ["A", "A", "Wl", "Wr"]
  get InnerCorner() {
    return {
      face: ["in", "in", "l", "r"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 1,
          key: this.ROOF_PREFIX + "CornerInner",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        }
      ]
    };
  }
  // ----------------
  // ["A", "A", "Wl", "Wr"]
  get InnerCorner_X() {
    return {
      face: ["in", "in", "lX", "rX"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 1,
          key: this.ROOF_PREFIX + "CornerInner",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        }
      ]
    };
  }
  // ----------------
  // ["A", "A", "A", "A"]
  get Inside_Full() {
    return {
      face: ["in", "in", "in", "in"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 2,
          key: this.ROOF_PREFIX + "Point",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 1,
          key: this.WALL_PREFIX + "Block",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // =========================================
  // =========================================
  // ==========================================================================
};

// IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_X.ts
var wcAsset_X = class {
  tag = "X_";
  constructor() {
  }
  // ==========================================================================
  faceLinkWeight() {
    return {
      "X": 0
    };
  }
  getFaceLinks(links) {
    return [
      ...links.in.map((k) => ["X", k]),
      ["X", "X"]
    ];
  }
  groupAsset() {
    return [
      ...applyGroup([
        { face: ["X", null, null, null] },
        { face: ["X", "X", null, null] },
        { face: ["X", null, "X", null] },
        { face: ["X", "X", "X", null] },
        { face: ["X", "X", "X", "X"] }
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty
      })
    ];
  }
  // ==========================================================================
};

// IsoGame/wcBuilding2/conf/buildConf_HouseA.ts
var WcBuildConf_HouseA = class extends AbstractWcBuildConf {
  colorConf;
  enter;
  faceX;
  fence;
  fencePlatform;
  houseSimple;
  constructor(conf = {}) {
    super(conf);
    const rand = Math.floor(Math.random() * 255);
    this.colorConf = {
      FENCE_SUFFIX: `#H${rand + 10}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S20_C150_B115`
    };
    this.enter = new wcAsset_Enter();
    this.faceX = new wcAsset_X();
    this.fence = new WcAsset_FenceSimple({
      tag: "F_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: 2 /* Exclude */
    });
    this.fencePlatform = new WcAsset_FencePlatform({
      tag: "FP_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: 2 /* Exclude */
    });
    this.houseSimple = new WcAsset_WallHouse(this.colorConf.WALL_SUFFIX);
    this.faceLinkWeight = {
      //
      ...this.faceX.faceLinkWeight(),
      ...this.fence.faceLinkWeight(0, 5, 10),
      ...this.enter.faceLinkWeight(),
      "0": 30,
      "0in": 30,
      ...this.fencePlatform.faceLinkWeight(1, 15, 20),
      // CL
      "WH_out": 1,
      "WH_outD": 1,
      "WH_in": 30,
      "WH_r": 25,
      "WH_l": 25,
      "WH_rX": 25,
      "WH_lX": 25
    };
    this.faceLinks = [
      // X
      ...this.faceX.getFaceLinks({
        in: ["F_out"]
      }),
      // F_
      ...this.fence.getFaceLinks({
        out: ["X"],
        in: ["FP_out"]
      }),
      // E_
      ...this.enter.getFaceLinks({
        out: [
          "F_in",
          "FP_r",
          "FP_l",
          "FP_r#Xc",
          "FP_l#Xc",
          "FP_r#Xi",
          "FP_l#Xi"
        ],
        l: ["WH_out"],
        r: ["WH_out"],
        door: ["WH_outD"]
      }),
      // FP_
      ...this.fencePlatform.getFaceLinks({
        out: ["F_in"],
        in: ["WH_out"]
      }),
      ["0", "0"],
      ["0in", "WH_out"],
      ["0", "FP_in"],
      // -----
      ["0D", "WH_outD"],
      ["WH_l", "WH_r"],
      ["WH_l", "WH_rX"],
      ["WH_lX", "WH_r"],
      ["WH_in", "WH_in"]
    ];
  }
  get __TILE_START_RAW() {
    return this.enter.groupInit();
  }
  //override
  get __TILE_LIST_RAW() {
    return [
      // --------------------------------------------------
      // X
      ...this.faceX.groupAsset(),
      // --------------------------------------------------
      // E
      ...this.enter.groupAsset(),
      // --------------------------------------------------
      // F
      ...this.fence.groupAsset({
        flatW: 10,
        cornerW: 10,
        innerW: 50,
        isFrise: false
      }),
      // --------------------------------------------------
      // 0
      ...applyGroup([
        { face: ["0in", "0", "0", "0"], weight: 10 }
      ], {
        allowMove: true,
        isFrise: true,
        empty: true,
        color: [196, 196, 196],
        functions: actionsEmpty
      }),
      // --------------------------------------------------
      // FP
      ...this.fencePlatform.groupAsset({
        flatW: 100,
        cornerW: 500,
        innerW: 400,
        isFrise: true
      }),
      // --------------------------------------------------
      // WH
      ...applyGroup([
        { ...this.houseSimple.Wall_Door, weight: 30 }
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty
      }),
      ...applyGroup([
        { ...this.houseSimple.Wall, weight: 30 },
        { ...this.houseSimple.Wall_RoofWindows, weight: 0 },
        { ...this.houseSimple.Wall_Windows, weight: 0 },
        { ...this.houseSimple.Corner, weight: 10 },
        { ...this.houseSimple.Corner_B, weight: 0 },
        { ...this.houseSimple.InnerCorner_X, weight: 200 },
        { ...this.houseSimple.Inside_Full, weight: 0 }
      ], {
        allowMove: false,
        isFrise: true,
        functions: actionsEmpty
      })
      // --------------------------------------------------
    ];
  }
};

// IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_CoridorLab.ts
var wcAsset_CoridorLab = class {
  WALL_SUFFIX;
  // '#H200_S20_C135_B105'
  PREFIX = "Lab5_";
  tag = "CL_";
  constructor(WALL_SUFFIX = "#H170_S120_C70_B115") {
    this.WALL_SUFFIX = WALL_SUFFIX;
  }
  // ==========================================================================
  // ["A", "Wout", "WoutD", "Wout"],
  get Door() {
    return {
      face: ["in", "out", "outD", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: "platform_center",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        },
        { h: 0, key: this.PREFIX + "corridor_end", keyR: 2, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  //  ["A", "Wout", "A", "Wout"]
  get Flat() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ["A", "Wout", "A", "Wout"]
  get Flat_Detail() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_detailed",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  //  ["A", "Wout", "A", "Wout"]
  get Flat_Window() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_window",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ----------------
  //["A", "A", "Wout", "Wout"],
  get Corner() {
    return {
      face: ["in", "in", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_corner",
          keyR: 3,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  //["A", "A", "Wout", "Wout"],
  get Corner_Round() {
    return {
      face: ["in", "in", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: "platform_center",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0,
          key: this.PREFIX + "corridor_cornerRound",
          keyR: 3,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ----------------
  //["A", "A", "A", "Wout"],
  get TJoin() {
    return {
      face: ["in", "in", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: this.PREFIX + "corridor_split", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ["A", "A", "A", "A"]
  get CrossJoin() {
    return {
      face: ["in", "in", "in", "in"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: this.PREFIX + "corridor_cross", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ==========================================================================
};

// IsoGame/wcBuilding2/conf/buildConf_LabBorderA.ts
var WcBuildConf_LabBorderA = class extends AbstractWcBuildConf {
  colorConf;
  fence;
  fencePlatform;
  corridor;
  constructor(conf = {}) {
    super(conf);
    const rand = Math.floor(Math.random() * 255);
    this.colorConf = {
      FENCE_SUFFIX: `#H${(rand + 10) % 360}_S50_C150_B115`,
      FENCE_PLATFORM_SUFFIX: `#H${(rand + -120) % 360}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S90_C100_B115`
    };
    this.fence = new WcAsset_FenceSimple({
      tag: "F_",
      suffix: this.colorConf.FENCE_SUFFIX
    });
    this.fencePlatform = new WcAsset_FencePlatform({
      tag: "FP_",
      suffix: this.colorConf.FENCE_SUFFIX
    });
    this.corridor = new wcAsset_CoridorLab(this.colorConf.WALL_SUFFIX);
    this.faceLinkWeight = {
      //
      "X": 0,
      // F
      "F_out": 0,
      "F_l": 1,
      "F_r": 1,
      "F_in": 5,
      "0": 1,
      // FP
      "FP_out": 0,
      "FP_r": 10,
      "FP_l": 10,
      "FP_in": 15,
      // CL
      "CL_outD": 0,
      "CL_out": 0,
      "CL_r": 20,
      "CL_l": 20,
      "CL_in": 25
    };
    this.faceLinks = [
      ["X", "X"],
      ["X", "F_out"],
      ["F_l", "F_r"],
      ["F_in", "FP_out"],
      ["FP_l", "FP_r"],
      ["FP_in", "CL_out"],
      ["FP_in", "CL_outD"],
      ["CL_in", "CL_in"]
    ];
  }
  get __TILE_START_RAW() {
    return [
      {
        face: ["X", "X", "X", "X"],
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true
      }
    ];
  }
  //override
  get __TILE_LIST_RAW() {
    const actionsEmpty2 = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 }
    ];
    const applyGroup2 = (wcConfs, group) => {
      return wcConfs.map((it) => {
        return {
          ...it,
          ...group
        };
      });
    };
    return [
      // --------------------------------------------------
      // X
      ...applyGroup2([
        { face: ["X", null, null, null] },
        { face: ["X", "X", null, null] },
        { face: ["X", null, "X", null] },
        { face: ["X", "X", "X", null] },
        { face: ["X", "X", "X", "X"] }
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // F
      ...applyGroup2([
        { ...this.fence.Corner, weight: 0 },
        { ...this.fence.Flat, weight: 1 },
        { ...this.fence.InnerCorner, weight: 1 }
      ], {
        allowMove: true,
        isFrise: false,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // 0
      ...applyGroup2([
        { face: ["0", "0", "0", "0"], weight: 0 }
      ], {
        allowMove: true,
        isFrise: true,
        empty: true,
        color: [128, 128, 128],
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // FP
      ...applyGroup2([
        { ...this.fencePlatform.Corner, weight: 0 },
        { ...this.fencePlatform.Flat, weight: 4 },
        { ...this.fencePlatform.InnerCorner, weight: 5 }
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // CL
      ...applyGroup2([
        { ...this.corridor.Door, weight: 0 },
        { ...this.corridor.Flat, weight: 30 },
        { ...this.corridor.Flat_Detail, weight: 10 },
        { ...this.corridor.Flat_Window, weight: 10 },
        { ...this.corridor.Corner, weight: 10 },
        { ...this.corridor.Corner_Round, weight: 10 },
        { ...this.corridor.TJoin, weight: 100 },
        { ...this.corridor.CrossJoin, weight: 100 }
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty2
      })
      // --------------------------------------------------
    ];
  }
};

// IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_WallManor.ts
var WcAsset_WallManor = class {
  tag = "WM_";
  // ROOF_PREFIX = "roof";
  ROOF_PREFIX = "roofHigh";
  WALL_PREFIX = "wall";
  // WALL_PREFIX = "wallWood";
  WALL_SUFFIX;
  // '#H200_S20_C135_B105'
  ROOF_SUFFIX;
  // '#H200_S20_C135_B105'
  constructor(WALL_SUFFIX = "#H210_C115_S35_B120", ROOF_SUFFIX = "#H0_S1_C128_B64") {
    this.WALL_SUFFIX = WALL_SUFFIX;
    this.ROOF_SUFFIX = ROOF_SUFFIX;
  }
  // ==========================================================================
  // ["Wr", "Wl", "Wout", "Wout"],
  get Corner_X() {
    return {
      face: ["rX", "lX", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 2,
          key: this.ROOF_PREFIX + "Corner",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 1,
          key: this.WALL_PREFIX + "Corner",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "Corner",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ["Wr", "Wl", "Wout", "Wout"],
  get Corner() {
    return {
      face: ["r", "l", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 2,
          key: this.ROOF_PREFIX + "Corner",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 1,
          key: this.WALL_PREFIX + "Corner",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "Corner",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ["Wr", "Wl", "Wout", "Wout"],
  get Corner_B() {
    return {
      face: ["r", "l", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 2,
          key: this.ROOF_PREFIX + "CornerRound",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 1,
          key: this.WALL_PREFIX + "CornerDiagonal",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "CornerDiagonal",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ----------------
  //  ["Wr", "Win", "Wl", "Wout"],
  get Door() {
    return {
      face: ["r", "in", "l", "outD"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 2,
          key: this.ROOF_PREFIX + "",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 1,
          key: this.WALL_PREFIX + "WindowGlass",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "Door",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ["Wr", "Win", "Wl", "Wout"],
  get Wall() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 2,
          key: this.ROOF_PREFIX + "",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 1,
          key: this.WALL_PREFIX + "WindowGlass",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "WindowGlass",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  //  ["Wr", "Win", "Wl", "Wout"],
  get Wall_Windows() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 2,
          key: this.ROOF_PREFIX + "Window",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 1,
          key: this.WALL_PREFIX + "WindowGlass",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0,
          key: this.WALL_PREFIX + "WindowGlass",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ----------------
  // ["Win", "Win", "Wl", "Wr"],
  get InnerCorner() {
    return {
      face: ["in", "in", "l", "r"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 2,
          key: this.ROOF_PREFIX + "CornerInner",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        }
      ]
    };
  }
  // ==========================================================================
  //  ["A", "A", "A", "A"]
  get Inside_Full() {
    return {
      face: ["in", "in", "in", "in"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 3,
          key: this.ROOF_PREFIX + "Point",
          keyR: 3,
          sufix: this.ROOF_SUFFIX
        },
        {
          h: 2,
          key: this.WALL_PREFIX + "Block",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // =========================================
  // =========================================
  // =========================================
  // =========================================
  // ==========================================================================
};

// IsoGame/wcBuilding2/conf/buildConf_ManorA.ts
var WcBuildConf_ManorA = class extends AbstractWcBuildConf {
  colorConf;
  fence;
  fencePlatform;
  wallManor;
  constructor(conf = {}) {
    super(conf);
    const rand = Math.floor(Math.random() * 255);
    this.colorConf = {
      FENCE_SUFFIX: `#H${rand + 10}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S20_C150_B115`
    };
    this.fence = new WcAsset_FenceSimple({
      tag: "F_",
      suffix: this.colorConf.FENCE_SUFFIX
    });
    this.fencePlatform = new WcAsset_FencePlatform({
      tag: "FP_",
      suffix: this.colorConf.FENCE_SUFFIX
    });
    this.wallManor = new WcAsset_WallManor(this.colorConf.WALL_SUFFIX);
    this.faceLinkWeight = {
      //
      "X": 0,
      // F
      "F_out": 1,
      "F_in": 25,
      "F_l": 15,
      "F_r": 15,
      "0": 100,
      // FP
      "FP_out": 1,
      "FP_in": 10,
      "FP_r": 5,
      "FP_l": 5,
      // CL
      "WM_out": 1,
      "WM_outD": 1,
      "WM_in": 25,
      "WM_r": 15,
      "WM_l": 15
      // "WM_rX": 15,
      // "WM_lX": 15,
    };
    this.faceLinks = [
      ["X", "X"],
      ["X", "F_out"],
      ["F_l", "F_r"],
      ["F_in", "FP_out"],
      ["FP_l", "FP_r"],
      ["FP_in", "0"],
      ["0D", "WM_outD"],
      ["FP_in", "WM_out"],
      // ["WM_l", "WM_rX"],
      // ["WM_lX", "WM_r"],
      ["WM_l", "WM_r"],
      ["WM_in", "WM_in"]
    ];
  }
  get __TILE_START_RAW() {
    return [
      {
        face: ["0", "0", "0", "0D"],
        color: [0, 0, 0],
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true
      }
    ];
  }
  //override
  get __TILE_LIST_RAW() {
    const actionsEmpty2 = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 }
    ];
    const applyGroup2 = (wcConfs, group) => {
      return wcConfs.map((it) => {
        return {
          ...it,
          ...group
        };
      });
    };
    return [
      // --------------------------------------------------
      // X
      ...applyGroup2([
        { face: [null, null, null, null] },
        { face: ["X", null, null, null] },
        { face: ["X", "X", null, null] },
        { face: ["X", null, "X", null] },
        { face: ["X", "X", "X", null] },
        { face: ["X", "X", "X", "X"] }
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // F
      ...applyGroup2([
        { ...this.fence.Corner, weight: 10 },
        { ...this.fence.Flat, weight: 20 },
        { ...this.fence.InnerCorner, weight: 20 }
      ], {
        allowMove: true,
        isFrise: false,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // 0
      ...applyGroup2([
        { face: ["0", "0", "0", "0D"], weight: 1e3 }
      ], {
        allowMove: true,
        isFrise: true,
        empty: true,
        color: [128, 128, 128],
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // FP
      ...applyGroup2([
        { ...this.fencePlatform.Corner, weight: 50 },
        { ...this.fencePlatform.Flat, weight: 100 },
        { ...this.fencePlatform.InnerCorner, weight: 100 }
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // HS
      ...applyGroup2([
        { ...this.wallManor.Door, weight: 300 },
        { ...this.wallManor.Wall, weight: 300 },
        // { ...this.manorSimple.Wall_RoofWindows, weight: 0 },
        { ...this.wallManor.Wall_Windows, weight: 0 },
        { ...this.wallManor.Corner, weight: 300 },
        // { ...this.manorSimple.Corner_B, weight: 0 },
        { ...this.wallManor.InnerCorner, weight: 400 },
        { ...this.wallManor.Inside_Full, weight: 300 }
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty2
      })
      // --------------------------------------------------
    ];
  }
};

// IsoGame/wcBuilding2/wcBuildFace.ts
function equalFaceList(faceListA, faceListB) {
  if (faceListA.length != faceListB.length)
    return false;
  for (const face of faceListA) {
    if (faceListB.filter((faceB) => {
      return face[0] == faceB[0] && face[1] == faceB[1] && face[2] == faceB[2] && face[3] == faceB[3];
    }).length == 0) {
      return false;
    }
  }
  return true;
}
function filterAxeFacesKey(faceList, axe, faceKey) {
  return faceList.filter((face) => faceKey.includes(face[axe]));
}

// IsoGame/map/factory/factoryGenerator.ts
var FactoryGenerator = class _FactoryGenerator {
  static instance;
  static getInstance() {
    return _FactoryGenerator.instance ??= new _FactoryGenerator();
  }
  biomes;
  biomeMatrix;
  seed;
  waterLvl = 64;
  mountLvl = 196;
  simplex;
  constructor() {
    console.log("== Init Factory Generator ==");
    this.biomes = FactoryBiomes.getInstance().biomes;
    this.biomeMatrix = GAME_BIOMES_MATRIS;
    this.seed = World.getInstance().seed;
    this.simplex = new SimplexNoise(this.seed);
  }
  _noise(x, y) {
    const f0 = 1 / 4 / 16;
    return (this.simplex.noise2D(f0 * x, f0 * y) + 1) / 2;
  }
  _zoom_and_grain(x, y, zoom, grain) {
    x = zoom * x;
    y = zoom * y;
    x -= x > 0 ? x % grain - grain / 2 : x % grain + grain / 2;
    y -= y > 0 ? y % grain - grain / 2 : y % grain + grain / 2;
    return [x, y];
  }
  getRawLvl(x, y, zoom = 1, grain = 1) {
    let lvl = 0;
    [x, y] = this._zoom_and_grain(x, y, zoom, grain);
    lvl += this._noise(1 / 200 * x, 1 / 200 * y) * 8;
    lvl += this._noise(1 / 20 * x, 1 / 20 * y) * 4;
    lvl += this._noise(1 / 8 * x, 1 / 8 * y) * 1;
    lvl += this._noise(2 / 3 * x, 2 / 3 * y) * (1 / 4);
    return lvl / (8 + 4 + 1 + 1 / 4);
  }
  getLvl(x, y, zoom = 1, grain = 1) {
    return this.getRawLvl(x, y, zoom, grain) * 256 & 255;
  }
  getBiome(x, y, zoom = 1) {
    const lvl = Math.floor(this.getLvl(x, y, zoom));
    if (lvl < this.waterLvl)
      return this.biomes["ocean"];
    if (lvl > this.mountLvl)
      return this.biomes["mont1"];
    if (lvl === this.waterLvl || lvl === this.waterLvl + 1) {
      return this.biomes["beach"];
    }
    if (lvl === this.mountLvl)
      return this.biomes["mountL"];
    const temp = Math.floor(this.getTemperature(x, y, zoom) / 32);
    const hydro = Math.floor(this.getHydro(x, y, zoom) / 32);
    return this.biomes[this.biomeMatrix[temp * 8 + hydro]];
  }
  getTemperature(x, y, zoom = 1, grain = 1) {
    let lvl = 0;
    [x, y] = this._zoom_and_grain(x, y, zoom, grain);
    lvl += this._noise(1 / 40 * x, 1 / 40 * y);
    lvl /= 1;
    return lvl * 256 & 255;
  }
  getHydro(x, y, zoom = 1, grain = 1) {
    let lvl = 0;
    [x, y] = this._zoom_and_grain(x, y, zoom, grain);
    lvl += this._noise(1 / 20 * x, 1 / 20 * y);
    lvl /= 1;
    return lvl * 256 & 255;
  }
  getBiomeColor(x, y, lvl = 0, zoom = 1) {
    return this.getBiome(x, y, zoom).color(lvl, 0);
  }
};

// IsoGame/wcBuilding2/wcBuildTileDrawer.ts
var WcBuildTileDrawer = class {
  world;
  fm;
  fg;
  ta;
  x;
  y;
  // protected drawConf: WcConfTile;
  constructor(world, x, y) {
    this.world = world;
    this.fm = FactoryMap.getInstance();
    this.fg = FactoryGenerator.getInstance();
    this.ta = TilesActions.getInstance();
    this.x = x;
    this.y = y;
  }
  _applyBuildItemList(drawConf) {
    this.ta.clearItem({ x: this.x, y: this.y });
    (drawConf.assets || []).forEach((item) => {
      const h = item.h ? item.h : 0;
      if (item.key) {
        this.ta.itemAddKey({
          x: this.x,
          y: this.y,
          assetKey: item.key,
          h,
          off: item.off
        });
      }
    });
  }
  _applyBuildFunction(drawConf) {
    (drawConf.functions || []).forEach((conf) => {
      this.ta.doAction({ x: this.x, y: this.y, ...conf });
    });
  }
  applyBuildError(color = [128, 128, 128]) {
    this.ta.doAction({
      func: "colorSquare",
      x: this.x,
      y: this.y,
      size: 1,
      color
    });
  }
  applyBuild(drawConf) {
    if (drawConf.colorT) {
      this.ta.doAction({
        func: "colorSquare",
        x: this.x,
        y: this.y,
        size: 1,
        color: drawConf.colorT
      });
    }
    if (drawConf.color) {
      this.ta.doAction({
        func: "colorSquare",
        x: this.x,
        y: this.y,
        size: 1,
        color: drawConf.color
      });
    }
    if (drawConf.functions) {
      this._applyBuildFunction(drawConf);
    }
    if (drawConf.empty) {
      this.ta.doAction({ func: "clearItem", x: this.x, y: this.y });
    }
    if (drawConf.assets) {
      this.ta.doAction({ func: "clearItem", x: this.x, y: this.y });
      this._applyBuildItemList(drawConf);
    } else {
      if (drawConf.key) {
        this.ta.doAction({ func: "clearItem", x: this.x, y: this.y });
        const h = drawConf.h ? drawConf.h : 0;
        this.ta.doAction({
          func: "itemForceKey",
          x: this.x,
          y: this.y,
          assetKey: drawConf.key,
          h
        });
      }
    }
    if (drawConf.lvl) {
      this.ta.doAction({
        func: "lvlSet",
        x: this.x,
        y: this.y,
        lvl: drawConf.lvl
      });
    }
    if (!drawConf.allowMove) {
      this.ta.doAction({
        func: "setBlocked",
        x: this.x,
        y: this.y,
        isBlock: true
      });
    }
    if (drawConf.isFrise) {
      this.ta.doAction({
        func: "setFrise",
        x: this.x,
        y: this.y,
        isFrise: true
      });
    }
  }
};

// IsoGame/wcBuilding2/wcBuildTile.ts
var WcBuildTile = class extends WcBuildTileDrawer {
  buildFactory;
  tile;
  possibleFace;
  isFaceConfigured = false;
  isFaceConfiguredType = "";
  configuredFace = [null, null, null, null];
  _depth;
  savePossibleFace;
  constructor(world, buildFactory, x, y, _depth = 0) {
    super(world, x, y);
    this.tile = this.fm.getTile(this.x, this.y);
    this.tile.wcBuild = this;
    this._depth = _depth;
    this.buildFactory = buildFactory;
    this.possibleFace = [
      ...this.buildFactory.configuration.listFaceKey || []
    ];
    this.savePossibleFace = [];
  }
  toJsonInfo() {
    return {
      possibleFace: this.possibleFace,
      isFaceConfigured: this.isFaceConfigured,
      isFaceConfiguredType: this.isFaceConfiguredType,
      computePosibleFace: this.computePosibleFace,
      score: this.score,
      building: this.buildFactory.toJson()
    };
  }
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  get nearExistingWcTiles() {
    return this.tile.nearTiles.map((tile) => {
      return tile.wcBuild ? tile.wcBuild : null;
    });
  }
  getNeighborAtAxe(axe) {
    if (this.nearExistingWcTiles[axe] != null) {
      return this.nearExistingWcTiles[axe];
    }
    const [dx, dy] = AXE_DIRECTION[axe];
    const wcTile = this.buildFactory.getWcTile(
      this.x + dx,
      this.y + dy
    );
    this.nearExistingWcTiles[axe] = wcTile;
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
  get computePosibleFace() {
    if (this.isFaceConfigured) {
      return this.possibleFace;
    }
    let possibleFace = [...this.buildFactory.configuration.listFaceKey];
    for (let axe = 0; axe < 4; axe++) {
      const nearPosibleFace = this.nearExistingWcTiles[axe]?.possibleFace;
      if (!nearPosibleFace) {
        continue;
      }
      const nearAxeFace = [
        ...new Set(
          nearPosibleFace.map((f) => f[(axe + 2) % 4])
        )
      ];
      const nearAxeFaceLink = [
        ...new Set(
          nearAxeFace.map(
            (face) => face === null ? null : this.buildFactory.configuration.linkedFaceKey(face)
          ).flat()
        )
      ];
      possibleFace = filterAxeFacesKey(possibleFace, axe, nearAxeFaceLink);
    }
    return possibleFace;
  }
  // --------------------------------------------------------------------------
  get expendPossibleFace() {
    return this.possibleFace.filter(
      (face) => !face.includes(null) && !face.includes("") && !face.includes("X")
    );
  }
  // --------------------------------------------------------------------------
  get closePossibleFace() {
    const indexFaceKeyWeight = this.buildFactory.configuration.faceLinkWeight;
    const sortedList = this.possibleFace.map((face) => {
      const scoreFace = face.map(
        (faceKey) => Object.keys(indexFaceKeyWeight).includes(faceKey) ? indexFaceKeyWeight[faceKey] : 0
      ).reduce((acc, v) => acc + v, 0);
      return [face, scoreFace];
    }).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
    return sortedList.length ? [sortedList[0]] : [];
  }
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  get score() {
    const faceWeightIndex = this.buildFactory.configuration.faceLinkWeight;
    const scoreWeigthFace = this.possibleFace.map((face) => {
      return [0, 1, 2, 3].filter(
        (axe) => this.nearExistingWcTiles[axe] != null && this.nearExistingWcTiles[axe].isFaceConfigured
      ).map(
        (axe) => Object.keys(faceWeightIndex).includes(face[axe]) ? faceWeightIndex[face[axe]] : 0
      );
    }).flat();
    const maxScoreFoce = scoreWeigthFace.reduce(
      (acc, v) => Math.max(acc, v),
      0
    );
    return 1e6 - this._depth + maxScoreFoce;
  }
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  get nearActifNodeWcBuild() {
    return [0, 1, 2, 3].filter((axe) => {
      const faceEmpty = filterAxeFacesKey(
        this.possibleFace,
        axe,
        [
          null
          // "",
          // "null",
          // "X",
        ]
      );
      return faceEmpty.length == 0;
    }).map((axe) => {
      return this.getNeighborAtAxe(axe);
    }).filter((wcTile) => {
      return wcTile && !wcTile.isFaceConfigured;
    });
  }
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  applyPossibleFace(possibleFace) {
    this.savePossibleFace = this.savePossibleFace.length == 0 ? this.possibleFace : this.savePossibleFace;
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
  processFaceConfiguration(tileConfigurations, randomWeight = true, iter = false) {
    let listList = [...tileConfigurations];
    let isConfig = false;
    while (isConfig == false && listList.length > 0) {
      const pickTileConf = randomWeight ? pickRandomWeightedObject(listList, this.tile.rBuildTile) : listList[0];
      if (!pickTileConf)
        return false;
      const face = pickTileConf.face;
      isConfig = this.tryApplyFace(face);
      if (isConfig) {
        this.applyBuild(pickTileConf);
        return true;
      } else {
        listList = listList.filter((i) => i !== pickTileConf);
      }
    }
    console.error("Note Fine Condifuration", this.tile.x, this.tile.y);
    if (!iter) {
      return false;
    }
    console.debug(tileConfigurations.map((conf) => conf.face));
    return false;
  }
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  tryApplyFace(face) {
    const allNode = /* @__PURE__ */ new Set();
    this.applyPossibleFace([face]);
    this.isFaceConfigured = true;
    allNode.add(this);
    const openNode = this.nearActifNodeWcBuild;
    const openNodeSet = new Set(openNode);
    let isValide = true;
    let canCurrentNode = openNode.shift();
    if (canCurrentNode === void 0) {
      return true;
    }
    let currentNode = canCurrentNode;
    openNodeSet.delete(currentNode);
    let i = 0;
    while (currentNode && i++ < 200) {
      const newPosibleFace = currentNode.computePosibleFace;
      if (newPosibleFace.length == 0) {
        isValide = false;
        break;
      }
      if (!equalFaceList(currentNode.possibleFace, newPosibleFace)) {
        currentNode.applyPossibleFace(newPosibleFace);
        allNode.add(currentNode);
        const newNode = currentNode.nearActifNodeWcBuild;
        for (const node of newNode) {
          if (!openNodeSet.has(node)) {
            openNode.push(node);
            openNodeSet.add(node);
          }
        }
      }
      canCurrentNode = openNode.shift();
      if (canCurrentNode === void 0) {
        for (const tile of [...allNode]) {
          tile.clearSavePossibleFace();
        }
        return true;
      }
      currentNode = canCurrentNode;
      openNodeSet.delete(currentNode);
    }
    if (!isValide) {
      for (const tile of [...allNode]) {
        tile.undoPossibleFace();
        tile.isFaceConfigured = false;
      }
    }
    return isValide;
  }
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
};

// IsoGame/wcBuilding2/wcBuildingFactory.ts
var WcBuildingFactory = class {
  configuration;
  x = 0;
  y = 0;
  world;
  fm;
  allTiles;
  constructor(world, conf) {
    this.world = world;
    this.fm = FactoryMap.getInstance();
    this.configuration = conf;
    this.allTiles = [];
  }
  toJson() {
    return {
      x: this.x,
      y: this.y,
      config: this.configuration
    };
  }
  // -------------------------------
  addTileNeighbours(tile) {
    tile.nearExistingWcTiles.forEach((nearTiles) => {
      if (nearTiles == null)
        return;
      if (this.allTiles.includes(nearTiles))
        return;
      this.allTiles.push(nearTiles);
    });
  }
  // -------------------------------
  getWcTile(x, y) {
    const wcBuildOnTile = FactoryMap.getInstance().getTile(x, y).wcBuild;
    if (wcBuildOnTile) {
      return wcBuildOnTile;
    }
    return new WcBuildTile(this.world, this, x, y);
  }
  // -------------------------------
  get notConfiguredList() {
    return this.allTiles.filter((tileBuild) => {
      return !tileBuild.isFaceConfigured;
    });
  }
  get forcedList() {
    return this.allTiles.filter((tileBuild) => {
      return !tileBuild.isFaceConfigured && tileBuild.possibleFace.length == 1;
    });
  }
  get openList() {
    return this.allTiles.filter((tileBuild) => {
      return !tileBuild.isFaceConfigured && tileBuild.expendPossibleFace.length > 0 && tileBuild.score > 0;
    }).sort((a, b) => b.score - a.score);
  }
  get closeList() {
    return this.allTiles.filter((tileBuild) => {
      return !tileBuild.isFaceConfigured && tileBuild.closePossibleFace.length > 0;
    });
  }
};
var WcBuildingFactoryGenarator = class extends WcBuildingFactory {
  mainTile;
  mainLvl;
  constructor(world, conf) {
    super(world, conf);
  }
  // =============================================
  initBuilding() {
    this.mainTile = this.getWcTile(this.x, this.y);
    const canProcess = this.mainTile.processFaceConfiguration(
      this.configuration.TILE_START_OPTIONS
    );
    if (canProcess) {
      this.addTileNeighbours(this.mainTile);
      return true;
    }
    return false;
  }
  processFacePossible(popBuildTile) {
    const testedFace = popBuildTile.computePosibleFace;
    const confTile = testedFace.map((face) => {
      const fkey = face.map((k) => k === null ? "null" : k).join("|");
      return this.configuration.indexTileOptions_KeyFaceKey[fkey];
    }).flat();
    const canProcess = popBuildTile.processFaceConfiguration(
      confTile
    );
    if (!canProcess) {
      return false;
    }
    this.addTileNeighbours(popBuildTile);
    return true;
  }
  start2(x, y) {
    this.x = x;
    this.y = y;
    this.mainLvl = this.fm.getTile(x, y).lvl;
    this.configuration.mainLvl = this.mainLvl;
    this.configuration.init();
    console.debug(
      "== Init Building ============================================",
      this.x,
      this.y
    );
    if (!this.initBuilding()) {
      console.error(
        "== CAN NOT PROCESS INIT ============================================"
      );
      return false;
    }
    console.debug(
      "== Start Building ===========================================",
      this.configuration.growLoopCount
    );
    for (let it = 0; it < this.configuration.growLoopCount; it++) {
      const forcedList = this.forcedList;
      if (forcedList.length > 0) {
        const popBuildTile = forcedList.shift();
        const canProcess = this.processFacePossible(popBuildTile);
        if (!canProcess) {
          console.error("# CANT PROCESS FORCE");
          continue;
        }
        this.addTileNeighbours(popBuildTile);
        popBuildTile.isFaceConfiguredType = "Open-Forced";
        continue;
      }
      const openList2 = this.openList;
      if (openList2.length > 0) {
        const popBuildTile = openList2.shift();
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
    console.debug(
      "== Start Close Building ===========================================",
      this.configuration.growLoopCount
    );
    for (let it = 0; it < this.configuration.endLoopMax; it++) {
      const forcedList = this.forcedList;
      if (forcedList.length > 0) {
        const popBuildTile = forcedList.shift();
        const canProcess = this.processFacePossible(popBuildTile);
        if (!canProcess) {
          console.error("# CANT PROCESS FORCE");
          continue;
        }
        this.addTileNeighbours(popBuildTile);
        popBuildTile.isFaceConfiguredType = "Close-Forced";
        continue;
      }
      const openList2 = this.closeList;
      if (openList2.length > 0) {
        const popBuildTile = openList2.shift();
        const confTile = [popBuildTile.closePossibleFace[0]].map(
          (face) => {
            const fkey = face.map((k) => k === null ? "null" : k).join("|");
            return this.configuration.indexTileOptions_KeyFaceKey[fkey];
          }
        ).flat();
        const canProcess = popBuildTile.processFaceConfiguration(
          confTile
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
      const popBuildTile = openList.shift();
      popBuildTile.applyBuildError([255, 255, 0]);
      console.log(
        "popBuildTile.possibleFace[0]",
        popBuildTile.closePossibleFace
      );
    }
    this.cleanTileCity();
    return true;
  }
  cleanTileCity() {
    this.allTiles.forEach((wcTile) => {
      if (wcTile.isFaceConfigured && wcTile.possibleFace[0].includes(null)) {
        wcTile.possibleFace = [["X", "X", "X", "X"]];
      }
    });
  }
};

// IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_WallRLab.ts
var WcAsset_WallRLab = class {
  tag = "WR_";
  PREFIX = "Lab5_";
  WALL_SUFFIX;
  // '#H200_S20_C135_B105'
  ROOF_SUFFIX;
  // '#H200_S20_C135_B105'
  constructor(WALL_SUFFIX = "#H210_C115_S35_B120", ROOF_SUFFIX = "#H0_S1_C128_B64") {
    this.WALL_SUFFIX = WALL_SUFFIX;
    this.ROOF_SUFFIX = ROOF_SUFFIX;
  }
  // ["Wr", "Wl", "Wout", "Wout"]
  get Corner() {
    return {
      face: ["r", "l", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_corner",
          keyR: 3,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0.8,
          key: this.PREFIX + "corridor_corner",
          keyR: 3,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // --------------------------------------
  // ["Wr", "Wl", "Wout", "Wout"]
  get Corner_Round() {
    return {
      face: ["r", "l", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: "platform_center",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0,
          key: this.PREFIX + "corridor_cornerRound",
          keyR: 3,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0.8,
          key: this.PREFIX + "corridor_cornerRound",
          keyR: 3,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ----------------
  //  ["Wr", "Win", "Wl", "Wout"],
  get Wall_Open() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: "structure_closed",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0.8,
          key: this.PREFIX + "corridor_split",
          // IN
          keyR: 0,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  //  ["Wr", "Win", "Wl", "Wout"],
  get Wall() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0.8,
          key: this.PREFIX + "corridor_split",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ["Wr", "Win", "Wl", "Wout"],
  get Wall_DS() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_detailed",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0.8,
          key: this.PREFIX + "corridor_split",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ["Wr", "Win", "Wl", "Wout"],
  get Wall_WS() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_window",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0.8,
          key: this.PREFIX + "corridor_split",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ----------------
  // --------------------------------------
  // ["Win2", "Win2", "Wl2", "Wr2"]
  get InnerCorner() {
    return {
      face: ["in", "in", "l", "r"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0.8,
          key: this.PREFIX + "corridor_cross",
          keyR: 3,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  //  ["Ai", "Ai", "Ai", "Ai"],
  get Inside_Full() {
    return {
      face: ["in", "in", "in", "in"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0.8,
          key: "platform_center",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ==========================================================================
  // ----------------
  //  ["Wr", "Win", "Wl", "WoutD"],
  get Wall_ToCorridor() {
    return {
      face: ["r", "in", "l", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0.8,
          key: this.PREFIX + "corridor_split",
          keyR: 0,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0,
          key: this.PREFIX + "corridor_cross",
          keyR: 1,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  //  ["Cin", "Wout", "Cin", "Wout"],
  get Corridor_DD() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_detailed",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        },
        {
          h: 0.8,
          key: this.PREFIX + "corridor_detailed",
          keyR: 2,
          sufix: this.WALL_SUFFIX
        }
      ]
    };
  }
  // ==========================================================================
  // =========================================
  // =========================================
  // =========================================
  // =========================================
  // ==========================================================================
};

// IsoGame/wcBuilding2/conf/buildConf_RLabA.ts
var WcBuildConf_RLabA = class extends AbstractWcBuildConf {
  colorConf;
  fence;
  fencePlatform;
  wallRLab;
  corridorLab;
  constructor(conf = {}) {
    super(conf);
    const rand = Math.floor(Math.random() * 255);
    this.colorConf = {
      FENCE_SUFFIX: `#H${(rand + 10) % 360}_S50_C150_B115`,
      PLATFORM_SUFFIX: `#H${(rand + -120) % 360}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S90_C100_B115`
    };
    this.fence = new WcAsset_Fence2({
      tag: "F2_",
      suffix: this.colorConf.FENCE_SUFFIX
    });
    this.fencePlatform = new WcAsset_FencePlatform({
      tag: "FP_",
      suffix: this.colorConf.FENCE_SUFFIX
    });
    this.wallRLab = new WcAsset_WallRLab(this.colorConf.WALL_SUFFIX);
    this.corridorLab = new wcAsset_CoridorLab(this.colorConf.WALL_SUFFIX);
    this.faceLinkWeight = {
      "X": 0,
      // F
      "F_out": 0,
      "F_l": 5,
      "F_r": 5,
      "F_in": 10,
      "0": 0,
      "0D": 0,
      // FP
      "FP_out": 0,
      "FP_r": 10,
      "FP_l": 10,
      "FP_in": 20,
      // "Pin0": 1,
      // "PinD": 1,
      "WR_outD": 0,
      "WR_out": 0,
      "WR_r": 20,
      "WR_l": 20,
      "WR_in": 30,
      "WR_r#IC": 1,
      "WR_l#IC": 1,
      //----------
      "WR_out#CL": 0,
      "CL_outD": 0,
      "CL_out": 0,
      "CL_in": 20
      // WR
      // "WR_rX": 15,
      // "WR_lX": 15,
    };
    this.faceLinks = [
      ["X", "X"],
      // ------
      ["X", "X"],
      ["X", "F2_out"],
      ["F2_l", "F2_r"],
      ["F2_in", "FP_out"],
      ["FP_l", "FP_r"],
      ["FP_in", "0"],
      // ["PinD", "WoutD"],
      // ["Pin0", "0"],
      ["FP_in", "0"],
      // ------
      // ------
      ["WR_out", "FP_in"],
      ["WR_out", "0"],
      ["WR_l", "WR_r"],
      ["WR_in", "WR_in"],
      // ------
      ["WR_l#IC", "WR_r"],
      ["WR_l", "WR_r#IC"],
      // ------
      // ------
      ["CL_out", "0"],
      ["CL_outD", "0D"],
      ["CL_out", "FP_in"],
      ["CL_outD", "FP_in"],
      ["CL_in", "WR_out#CL"]
      // ["CL_in", "CL_in"],
      // -------------------------------
    ];
  }
  get __TILE_START_RAW() {
    return [
      {
        face: ["0", "0", "0", "0D"],
        color: [0, 0, 0],
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true
      }
    ];
  }
  //override
  get __TILE_LIST_RAW() {
    const actionsEmpty2 = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 }
    ];
    const applyGroup2 = (wcConfs, group) => {
      return wcConfs.map((it) => {
        return {
          ...it,
          ...group
        };
      });
    };
    return [
      // --------------------------------------------------
      // X
      ...applyGroup2([
        { face: [null, null, null, null] },
        { face: ["X", null, null, null] },
        { face: ["X", "X", null, null] },
        { face: ["X", null, "X", null] },
        { face: ["X", "X", "X", null] },
        { face: ["X", "X", "X", "X"] }
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // F
      ...applyGroup2([
        { ...this.fence.Corner, weight: 0 },
        { ...this.fence.Flat, weight: 0 },
        { ...this.fence.InnerCorner, weight: 0 }
      ], {
        allowMove: true,
        isFrise: false,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // FP
      ...applyGroup2([
        { ...this.fencePlatform.Corner, weight: 0 },
        { ...this.fencePlatform.Flat, weight: 0 },
        { ...this.fencePlatform.InnerCorner, weight: 0 }
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // 0
      ...applyGroup2([
        { face: ["0", "0", "0", "0"], weight: 0 }
      ], {
        allowMove: true,
        isFrise: true,
        empty: true,
        color: [128, 128, 128],
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // WR
      ...applyGroup2([
        { ...this.wallRLab.Corner_Round, weight: 0 },
        { ...this.wallRLab.Wall, weight: 1 },
        {
          ...this.wallRLab.Wall,
          face: ["r", "in", "l", "out#CL"].map((p) => "WR_" + p),
          weight: 1
        },
        {
          ...this.wallRLab.InnerCorner,
          face: ["in", "in", "l#C", "r#C"].map((p) => "WR_" + p),
          weight: 3
        }
        //{ ...this.wallRLab.Inside_Full, weight: 300 },
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty2
      }),
      // --------------------------------------------------
      // WR
      ...applyGroup2([
        // { ...this.corridorLab.Flat, weight: 3 },
        { ...this.corridorLab.Door, weight: 3 }
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty2
      })
      // --------------------------------------------------
    ];
  }
};

// IsoGame/wcBuilding2/conf/buildConf_GraveA.ts
var WcBuildConf_GraveA = class extends AbstractWcBuildConf {
  colorConf;
  enter;
  fenceEnter;
  faceX;
  fenceGrave;
  fGraveIn;
  fGraveBone;
  fGraveAltar;
  constructor(conf = {}) {
    super(conf);
    const rand = Math.floor(Math.random() * 255);
    this.colorConf = {
      FENCE_SUFFIX: `#H${rand + 10}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S50_C150_B115`
    };
    this.enter = new wcAsset_EnterSimple();
    this.faceX = new wcAsset_X();
    this.fenceEnter = new WcAsset_FenceEnter({
      tag: "FE_",
      suffix: this.colorConf.FENCE_SUFFIX
    });
    this.fenceGrave = new WcAsset_FenceGrave({
      tag: "FG_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: 2 /* Exclude */
    });
    this.fGraveIn = new WcAsset_FGraveIn({
      tag: "FI_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: 2 /* Exclude */
    });
    this.fGraveBone = new WcAsset_FGraveBone({
      tag: "FI_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: 2 /* Exclude */
    });
    this.fGraveAltar = new WcAsset_FGraveAltar({
      tag: "FI2_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: 1 /* NoSquare */
    });
    this.faceLinkWeight = {
      //
      ...this.faceX.faceLinkWeight(),
      ...this.enter.faceLinkWeight(),
      ...this.fenceGrave.faceLinkWeight(0, 1, 1),
      ...this.fGraveIn.faceLinkWeight(0, 20, 15),
      ...this.fGraveAltar.faceLinkWeight(0, 20, 15),
      "0": 30
    };
    this.faceLinks = [
      /// ---------------------
      // X
      ...this.faceX.getFaceLinks({
        in: ["FG_out", "FE_out"]
      }),
      /// ==============================
      ...this.enter.getFaceLinks({
        out: ["X"],
        l: ["FG_r", "FG_r#Xc", "FG_r#Xi"],
        r: ["FG_l", "FG_l#Xc", "FG_l#Xi"],
        door: ["FI_out"]
      }),
      /// ---------------------
      // FG_
      ...this.fenceGrave.getFaceLinks({
        out: ["X"],
        in: ["FP_out", "FI_out"]
      }),
      /// ==============================
      /// ---------------------
      // FI_
      ...this.fGraveIn.getFaceLinks({
        out: ["FG_in"],
        in: ["0"]
      }),
      /// ---------------------
      // FI2_
      ...this.fGraveAltar.getFaceLinks({
        out: ["FG_in"],
        in: ["0"]
      }),
      ...this.fGraveAltar.getFaceLinksSide({
        l: ["FI_r", "FI_r#Xc", "FI_r#Xi"],
        r: ["FI_l", "FI_l#Xc", "FI_l#Xi"]
      }),
      /// ==============================
      // 0
      ["0", "0"]
      // -----
    ];
  }
  get __TILE_START_RAW() {
    return this.enter.groupInit();
  }
  //override
  get __TILE_LIST_RAW() {
    return [
      // --------------------------------------------------
      // X
      ...this.faceX.groupAsset(),
      // --------------------------------------------------
      // E
      ...this.enter.groupAsset(),
      /// ==============================
      // --------------------------------------------------
      // FG_
      ...this.fenceGrave.groupAsset({
        flatW: 10,
        cornerW: 0,
        innerW: 13,
        isFrise: true
      }),
      /// ==============================
      // FI_
      ...this.fGraveIn.groupAsset({
        flatW: 6,
        cornerW: 0,
        innerW: 12,
        isFrise: true
      }),
      ...this.fGraveBone.groupAsset({
        flatW: 0,
        cornerW: 0,
        innerW: 12,
        isFrise: true
      }),
      // FI2_
      ...this.fGraveAltar.groupAsset({
        flatW: 4,
        cornerW: 0,
        innerW: 0,
        isFrise: true
      }),
      // --------------------------------------------------
      // 0
      ...applyGroup([
        { face: ["0", "0", "0", "0"], weight: 5 }
      ], {
        allowMove: true,
        isFrise: true,
        empty: true,
        color: [64, 64, 64],
        functions: actionsEmpty
      })
      // --------------------------------------------------
    ];
  }
};

// IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_CoridorPipe.ts
var wcAsset_CoridorPipe = class {
  WALL_SUFFIX;
  // '#H200_S20_C135_B105'
  tag = "CP_";
  constructor(WALL_SUFFIX = "#H170_S120_C70_B115") {
    this.WALL_SUFFIX = WALL_SUFFIX;
  }
  groupAsset() {
    return [];
  }
  // ==========================================================================
  // ["A", "Wout", "WoutD", "Wout"],
  get Door2() {
    return {
      face: ["in", "out", "outD", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0.2, key: "pipe_end", keyR: 2, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ["A", "Wout", "WoutD", "Wout"],
  get Door() {
    return {
      face: ["in", "out", "outD", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0.2, key: "pipe_entrance", keyR: 2, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ----------------
  //  ["A", "Wout", "A", "Wout"]
  get Flat() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportLow", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 0.2, key: "pipe_straight", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  //  ["A", "Wout", "A", "Wout"]
  get Flat_NoSupport() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0.2, key: "pipe_straight", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ["A", "Wout", "A", "Wout"]
  get Flat_Open() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0.2, key: "pipe_open", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ["A", "Wout", "A", "Wout"]
  get Flat_Ring() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportLow", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 0.2, key: "pipe_ring", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ----------------
  //["A", "A", "Wout", "Wout"],
  get Corner() {
    return {
      face: ["in", "in", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0.2, key: "pipe_corner", keyR: 3, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  //["A", "A", "Wout", "Wout"],
  get Corner_Round() {
    return {
      face: ["in", "in", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0.2, key: "pipe_cornerRound", keyR: 3, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // pipe_cornerDiagonal
  // ----------------
  //["A", "A", "A", "Wout"],
  get TJoin() {
    return {
      face: ["in", "in", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportLow", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 0.2, key: "pipe_split", keyR: 3, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ["A", "A", "A", "A"]
  get CrossJoin() {
    return {
      face: ["in", "in", "in", "in"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportLow", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 0.2, key: "pipe_cross", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  get Silo() {
    return {
      face: ["silo", "silo", "silo", "silo"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "rocket_fuelB", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 0.2, key: "rocket_finsA", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ==========================================================================
};

// IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_CoridorPipe2.ts
var wcAsset_CoridorPipe2 = class {
  WALL_SUFFIX;
  // '#H200_S20_C135_B105'
  tag = "CP2_";
  constructor(WALL_SUFFIX = "#H170_S120_C70_B115") {
    this.WALL_SUFFIX = WALL_SUFFIX;
  }
  // ==========================================================================
  // ["A", "Wout", "WoutD", "Wout"],
  get Door2() {
    return {
      face: ["in", "out", "outD", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 1, key: "pipe_end", keyR: 2, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ["A", "Wout", "WoutD", "Wout"],
  get Door() {
    return {
      face: ["in", "out", "outD", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 1, key: "pipe_entrance", keyR: 2, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ----------------
  //  ["A", "Wout", "A", "Wout"]
  get Flat() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportHigh", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "pipe_straight", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  //  ["A", "Wout", "A", "Wout"]
  get Flat_NoSupport() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 1, key: "pipe_straight", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ["A", "Wout", "A", "Wout"]
  get Flat_Open() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 1, key: "pipe_open", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ["A", "Wout", "A", "Wout"]
  get Flat_Ring() {
    return {
      face: ["in", "out", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportHigh", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "pipe_ring", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ----------------
  //["A", "A", "Wout", "Wout"],
  get Corner() {
    return {
      face: ["in", "in", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 1, key: "pipe_corner", keyR: 3, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  //["A", "A", "Wout", "Wout"],
  get Corner_Round() {
    return {
      face: ["in", "in", "out", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 1, key: "pipe_cornerRound", keyR: 3, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // pipe_cornerDiagonal
  // ----------------
  //["A", "A", "A", "Wout"],
  get TJoin() {
    return {
      face: ["in", "in", "in", "out"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportHigh", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "pipe_split", keyR: 3, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ["A", "A", "A", "A"]
  get CrossJoin() {
    return {
      face: ["in", "in", "in", "in"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportHigh", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "pipe_cross", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  get Silo() {
    return {
      face: ["silo", "silo", "silo", "silo"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "rocket_fuelB", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 0.8, key: "rocket_fuelB", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 0.2, key: "rocket_finsA", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "rocket_finsA", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  get SiloUP() {
    return {
      face: ["silo", "silo", "silo", "silo"].map((p) => this.tag + p),
      weight: 0,
      assets: [
        { h: 0, key: "supports_high", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 0.8, key: "rocket_fuelB", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "rocket_finsA", keyR: 0, sufix: this.WALL_SUFFIX }
      ]
    };
  }
  // ==========================================================================
};

// IsoGame/wcBuilding2/conf/buildConf_LabPipeA.ts
var WcBuildConf_LabPipeA = class extends AbstractWcBuildConf {
  colorConf;
  enter;
  faceX;
  fence;
  // private fencePlatform: WcAsset_FencePlatform;
  corridor;
  corridor2;
  constructor(conf = {}) {
    super(conf);
    const rand = Math.floor(Math.random() * 255);
    this.colorConf = {
      FENCE_SUFFIX: `#H${(rand + 10) % 360}_S50_C150_B115`,
      FENCE_PLATFORM_SUFFIX: `#H${(rand + -120) % 360}_S10_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S90_C140_B95`
    };
    this.enter = new wcAsset_Enter();
    this.faceX = new wcAsset_X();
    this.fence = new WcAsset_Fence2({
      tag: "F2_",
      suffix: this.colorConf.FENCE_PLATFORM_SUFFIX,
      collapseType: 1 /* NoSquare */
    });
    this.corridor = new wcAsset_CoridorPipe(this.colorConf.WALL_SUFFIX);
    this.corridor2 = new wcAsset_CoridorPipe2(this.colorConf.WALL_SUFFIX);
    this.faceLinkWeight = {
      //
      ...this.faceX.faceLinkWeight(),
      ...this.fence.faceLinkWeight(0, 1, 5),
      ...this.enter.faceLinkWeight(),
      "0": 1,
      /*/ FP
      "FP_out": 0,
      "FP_r": 10,
      "FP_l": 10,
      "FP_in": 15,
      */
      "CP2_outD": 0,
      "CP2_out": 0,
      "CP2_r": 20,
      "CP2_l": 20,
      "CP2_in": 25,
      // CL
      "CP_outD": 0,
      "CP_out": 0,
      "CP_r": 20,
      "CP_l": 20,
      "CP_in": 25,
      "CP_s": 0,
      "CP2_s": 0
    };
    this.faceLinks = [
      ...this.faceX.getFaceLinks({
        in: ["F2_out"]
      }),
      ...this.fence.getFaceLinks({
        out: ["X"],
        in: ["CP_out", "CP_outD"]
      }),
      ...this.enter.getFaceLinks({
        out: ["X"],
        l: ["F2_r", "F2_r#X"],
        r: ["F2_l", "F2_l#X"],
        door: ["CP_outD"]
      }),
      // -----
      ["F2_in", "0"],
      ["CP_s", "CP_in"],
      ["CP2_s", "CP2_in"],
      ["CP_in", "CP_in"],
      ["CP_in#X", "CP_in"],
      // ----
      // ----
      ["F2_in", "CP2_out"],
      ["F2_in", "CP2_outD"],
      ["CP2_in", "CP2_in"],
      ["CP2_in#X", "CP2_in"]
    ];
  }
  get __TILE_START_RAW() {
    return this.enter.groupInit();
  }
  //override
  get __TILE_LIST_RAW() {
    return [
      // --------------------------------------------------
      // X
      ...this.faceX.groupAsset(),
      // --------------------------------------------------
      // F
      ...this.fence.groupAsset({
        isFrise: true
      }),
      // --------------------------------------------------
      // E
      ...this.enter.groupAsset(),
      // --------------------------------------------------
      // 0
      ...applyGroup([
        { face: ["0", "0", "0", "0"], weight: 0 }
      ], {
        allowMove: true,
        isFrise: true,
        empty: true,
        color: [128, 128, 128],
        functions: actionsEmpty
      }),
      // --------------------------------------------------
      // CP
      ...applyGroup([
        // { ...tagFaces(this.corridor.Door, [["in", "#X"]]), weight: 0 },
        { ...tagFaces(this.corridor.Door2, [["in", "#X"]]), weight: 0 },
        { ...this.corridor.Flat, weight: 18 },
        { ...this.corridor.Flat_NoSupport, weight: 2 },
        { ...this.corridor.Flat_Ring, weight: 10 },
        { ...this.corridor.Flat_Open, weight: 10 },
        { ...tagFaces(this.corridor.Corner, [["in", "#X"]]), weight: 30 },
        { ...tagFaces(this.corridor.Corner_Round, [["in", "#X"]]), weight: 30 },
        { ...tagFaces(this.corridor.TJoin, [["in", "#X"]]), weight: 100 },
        { ...tagFaces(this.corridor.CrossJoin, [["in", "#X"]]), weight: 100 }
      ], {
        allowMove: true,
        color: [110, 110, 110],
        isFrise: true,
        functions: actionsEmpty
      }),
      ...applyGroup([
        { ...this.corridor.Silo, face: ["CP_s", "CP_s", "0", "0"] },
        { ...this.corridor.Silo, face: ["CP_s", "0", "CP_s", "0"] },
        { ...this.corridor.Silo, face: ["CP_s", "CP_s", "CP_s", "0"] },
        { ...this.corridor2.SiloUP, face: ["CP2_s", "CP2_s", "0", "0"] },
        { ...this.corridor2.SiloUP, face: ["CP2_s", "0", "CP2_s", "0"] }
      ], {
        weight: 2,
        allowMove: true,
        color: [110, 110, 110],
        isFrise: true,
        functions: actionsEmpty
      }),
      ...applyGroup([
        { ...this.corridor2.Silo, face: ["CP_s", "CP2_s", "0", "0"] },
        { ...this.corridor2.Silo, face: ["CP2_s", "CP_s", "0", "0"] },
        { ...this.corridor2.Silo, face: ["CP2_s", "0", "CP_s", "0"] },
        { ...this.corridor2.Silo, face: ["CP2_s", "CP_s", "CP_s", "0"] },
        { ...this.corridor2.Silo, face: ["CP2_s", "CP2_s", "CP_s", "0"] },
        { ...this.corridor2.Silo, face: ["CP2_s", "CP_s", "CP2_s", "0"] }
      ], {
        weight: 40,
        allowMove: true,
        color: [110, 110, 110],
        isFrise: true,
        functions: actionsEmpty
      }),
      // --------------------------------------------------
      // CP2
      ...applyGroup([
        { ...tagFaces(this.corridor2.Door, [["in", "#X"]]), weight: 0 },
        // { ...tagFaces(this.corridor2.Door2, [["in", "#X"]]), weight: 0 },
        { ...this.corridor2.Flat, weight: 5 },
        { ...this.corridor2.Flat_NoSupport, weight: 0 },
        { ...this.corridor2.Flat_Ring, weight: 50 },
        { ...this.corridor2.Flat_Open, weight: 5 },
        { ...tagFaces(this.corridor2.Corner, [["in", "#X"]]), weight: 10 },
        {
          ...tagFaces(this.corridor2.Corner_Round, [["in", "#X"]]),
          weight: 10
        },
        { ...tagFaces(this.corridor2.TJoin, [["in", "#X"]]), weight: 30 },
        { ...tagFaces(this.corridor2.CrossJoin, [["in", "#X"]]), weight: 30 }
      ], {
        color: [128, 128, 142],
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty
      })
      // --------------------------------------------------
    ];
  }
};

// IsoGame/wcBuilding2/wcBuildAction.ts
var indexBuildingConfigClass = {
  "WcBuildConf_LabPipeA": WcBuildConf_LabPipeA,
  "WcBuildConf_LabBorderA": WcBuildConf_LabBorderA,
  "WcBuildConf_HouseA": WcBuildConf_HouseA,
  "WcBuildConf_ManorA": WcBuildConf_ManorA,
  "WcBuildConf_RLabA": WcBuildConf_RLabA,
  "WcBuildConf_GraveA": WcBuildConf_GraveA
};
var WcBuildActions = class _WcBuildActions {
  static instance;
  static getInstance() {
    return _WcBuildActions.instance ??= new _WcBuildActions();
  }
  world;
  fm;
  index;
  constructor() {
    this.world = World.getInstance();
    this.fm = FactoryMap.getInstance();
    this.index = {
      // doFunction: this.doFunction.bind(this),
      "createBuilding": (conf) => {
        const typeBuildingConf = indexBuildingConfigClass[conf.buildingType];
        const buildingConf = new typeBuildingConf({
          growLoopCount: conf.growLoopCount ? conf.growLoopCount : 50,
          endLoopMax: conf.endLoopMax ? conf.endLoopMax : 200
        });
        const building = new WcBuildingFactoryGenarator(
          this.world,
          buildingConf
        );
        building.start2(conf.x, conf.y);
      },
      "destroyBuilding": (_conf) => {
      }
    };
  }
  //--------------------
  doAction(conf) {
    const handler = this.index[conf.func];
    if (handler) {
      handler(conf);
    }
  }
  doActions(confs) {
    for (const conf of confs) {
      this.doAction(conf);
    }
  }
};

// IsoGame/city/nodeMap.ts
var NodeMap = class _NodeMap {
  x;
  y;
  alpha;
  constructor(x, y, alpha) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.alpha = alpha;
  }
  nodeDistance(node) {
    const x = Math.abs(this.x - node.x);
    const y = Math.abs(this.y - node.y);
    return Math.sqrt(x * x + y * y);
  }
  nodesDistance(nodes) {
    let distanceMap = nodes.map((endNode) => {
      return [this.nodeDistance(endNode), endNode];
    });
    distanceMap = distanceMap.sort((a, b) => a[0] - b[0]);
    return distanceMap;
  }
  nodesMinDistance(nodes) {
    if (nodes && nodes.length) {
      return this.nodesDistance(nodes)[0];
    }
    return [0, null];
  }
  nodeMeanMinDisance(nodes) {
    const nodesDistance = this.nodesDistance(nodes);
    const count = Math.min(nodesDistance.length, 3);
    let distanceMeanMin = 0;
    for (let i = 0; i < count; i++) {
      distanceMeanMin += nodesDistance[i][0];
    }
    return distanceMeanMin / count;
  }
  /**
   * Returns an array of nodes around the current node within a specified radius and step.
   */
  getNodesAround(radius, step) {
    const alpha = 2 * Math.PI / step;
    const arr = [];
    for (let i = 0; i < step; i++) {
      const deltaStep = alpha * i + this.alpha;
      const x = Math.round(this.x + radius * Math.cos(deltaStep));
      const y = Math.round(this.y + radius * Math.sin(deltaStep));
      arr.push(new _NodeMap(x, y, deltaStep));
    }
    return arr;
  }
};

// IsoGame/city/pathFactory.ts
function actionDrawPathAndPlatform(tileList, param) {
  return [
    ...actionDrawPath_Smooth_Large(tileList, param),
    ...actionDrawPath_Smooth_Close(tileList, param),
    ...actionDrawPath_EndPlatform(tileList, param),
    ...actionDrawPath_FrisePath(tileList, param)
  ];
}
function actionDrawPath(tileList, param) {
  return [
    ...actionDrawPath_Smooth_Large(tileList, param),
    ...actionDrawPath_Smooth_Close(tileList, param),
    ...actionDrawPath_FrisePath(tileList, param)
  ];
}
function actionDrawPath_Smooth_Large(tileList, param) {
  return [
    {
      func: "lvlAvgSquare",
      x: tileList[0].x,
      y: tileList[0].y,
      size: 14
    },
    ...tileList.map((tile) => {
      return [
        { func: "clearItemSquare", x: tile.x, y: tile.y, size: 3 },
        {
          func: "lvlAvgSquare",
          x: tileList[0].x,
          y: tileList[0].y,
          size: 14
        },
        {
          func: "colorSquare",
          x: tile.x,
          y: tile.y,
          size: 3,
          color: param.color
        }
      ];
    }).flat()
  ];
}
function actionDrawPath_Smooth_Close(tileList, param) {
  return [
    ...tileList.map((tile) => {
      return [
        {
          func: "lvlFlatSquare",
          // func: "lvlAvgSquare",
          x: tile.x,
          y: tile.y,
          size: 3
        },
        {
          func: "lvlAvgSquare",
          x: tile.x,
          y: tile.y,
          size: 5
        },
        {
          func: "colorSquare",
          x: tile.x,
          y: tile.y,
          size: 1,
          color: param.color2
        }
      ];
    }).flat()
  ];
}
function actionDrawPath_EndPlatform(tileList, param) {
  return [
    {
      func: "colorSquare",
      x: tileList[tileList.length - 1].x,
      y: tileList[tileList.length - 1].y,
      size: 5,
      color: param.color2
    },
    {
      func: "lvlFlatSquare",
      x: tileList[tileList.length - 1].x,
      y: tileList[tileList.length - 1].y,
      size: 3
    },
    {
      func: "setFriseSquare",
      x: tileList[tileList.length - 1].x,
      y: tileList[tileList.length - 1].y,
      size: 3
    },
    {
      func: "lvlFAvgSquare",
      x: tileList[tileList.length - 1].x,
      y: tileList[tileList.length - 1].y,
      size: 5
    }
  ];
}
function actionDrawPath_FrisePath(tileList, param) {
  return [
    ...tileList.map((tile) => {
      return [
        {
          func: "setFriseSquare",
          x: tile.x,
          y: tile.y,
          size: 3,
          isFrise: true
        }
      ];
    }).flat()
  ];
}
var PathFactory = class _PathFactory {
  world;
  fm;
  ta;
  maxLvlDiff;
  propagateLimit;
  colapseLimit;
  axeCount;
  tileStart;
  tileEnd;
  allList = [];
  openList = [];
  parentIndex = {};
  constructor(world) {
    this.world = world;
    this.fm = FactoryMap.getInstance();
    this.ta = TilesActions.getInstance();
    this.maxLvlDiff = 2;
    this.propagateLimit = 2e3;
    this.colapseLimit = 500;
    this.axeCount = 8;
  }
  isValideTile(tile) {
    const isVal = (tile2) => !tile2.wcBuild || !tile2.isBlock;
    return isVal(tile) && tile.nearTiles.filter(isVal).length === 4;
  }
  score(t1, t2) {
    const dist = _PathFactory.tilesMoveCount(t1, t2);
    const distFactor = t1.wcBuild ? 100 : 0;
    return dist - distFactor;
  }
  static tilesDistance(t1, t2) {
    const xd = Math.abs(Math.abs(t1.x) - Math.abs(t2.x));
    const yd = Math.abs(Math.abs(t1.y) - Math.abs(t2.y));
    return Math.sqrt(xd * xd + yd * yd);
  }
  static tilesMoveCount(t1, t2) {
    const xd = Math.abs(Math.abs(t1.x) - Math.abs(t2.x));
    const yd = Math.abs(Math.abs(t1.y) - Math.abs(t2.y));
    const diag = Math.abs(xd - yd);
    const line = Math.max(xd, yd) - diag;
    return line + diag;
  }
  createPath(pStart, pEnd) {
    this.tileStart = this.fm.getTile(pStart.x, pStart.y);
    this.tileEnd = this.fm.getTile(pEnd.x, pEnd.y);
    this.allList = [this.tileStart];
    this.openList = [{
      score: this.score(this.tileStart, this.tileEnd),
      tile: this.tileStart
    }];
    this.parentIndex = {};
    let i = 0;
    while (this.openList.length && i++ < this.propagateLimit && !this.allList.includes(this.tileEnd)) {
      this.propagate();
    }
    if (this.allList.includes(this.tileEnd)) {
      const tileList = [];
      let current = this.tileEnd;
      i = 0;
      while (current && i++ < this.colapseLimit) {
        tileList.push(current);
        current = this.parentIndex[`${current.x}_${current.y}`];
      }
      return tileList.reverse();
    }
    return null;
  }
  /*
  createWcPath(
    pStart: { x: number; y: number },
    pEnd: { x: number; y: number },
  ): any | null {
    const tileList = this.createPath(pStart, pEnd);
    return tileList ? new WcPath(this.world, tileList) : null;
  }
  */
  propagate() {
    this.openList.sort((a, b) => a.score - b.score);
    const bestTileConf = this.openList.shift();
    if (!bestTileConf)
      return;
    const bestTile = bestTileConf.tile;
    const nears = this.axeCount === 4 ? bestTile.nearTiles : bestTile.nearSquareTiles;
    const nearsNew = nears.filter((n) => {
      return _PathFactory.canMove(bestTile, n) && !this.allList.includes(n) && this.isValideTile(n);
    });
    nearsNew.forEach((nearTile) => {
      this.allList.push(nearTile);
      this.parentIndex[`${nearTile.x}_${nearTile.y}`] = bestTile;
      this.openList.push({
        score: this.score(nearTile, this.tileEnd),
        tile: nearTile
      });
    });
  }
  static canMove(t1, t2) {
    return !(t2.isBlock || Math.abs(t1.lvl - t2.lvl) > 2);
  }
};

// IsoGame/city/graph.ts
var GraphTileNode = class _GraphTileNode {
  world;
  fm;
  tile;
  nodeMap;
  parents;
  childs;
  isEnd;
  powerAction;
  constructor(world, tile, alphaPath) {
    this.world = world;
    this.tile = tile;
    this.fm = FactoryMap.getInstance();
    this.nodeMap = new NodeMap(tile.x, tile.y, alphaPath);
    this.parents = [];
    this.childs = [];
    this.isEnd = false;
    this.powerAction = 0;
  }
  addParent(parentNode) {
    if (!this.parents.includes(parentNode)) {
      this.parents.push(parentNode);
    }
  }
  addChild(childNode) {
    if (!this.childs.includes(childNode)) {
      this.childs.push(childNode);
    }
  }
  get link() {
    return [...this.parents, ...this.childs];
  }
  getGraphNodeFrom(pIterMax = 5) {
    const startNode = {
      depth: 0,
      node: this,
      distance: 0
    };
    const openNode = [startNode];
    const allNode = [startNode];
    let currentNodeInfo = openNode.shift();
    while (currentNodeInfo) {
      const pIter = currentNodeInfo.depth + 1;
      const currentNode = currentNodeInfo.node;
      [...currentNode.parents, ...currentNode.childs].forEach(
        (broNode) => {
          if (!allNode.map((x) => x.node).includes(broNode)) {
            allNode.push({
              depth: pIter,
              node: broNode,
              parent: currentNodeInfo,
              distance: this.nodeMap.nodeDistance(broNode.nodeMap)
            });
            if (pIter < pIterMax) {
              openNode.push({
                depth: pIter,
                node: broNode,
                parent: currentNodeInfo,
                distance: this.nodeMap.nodeDistance(broNode.nodeMap)
              });
            }
          }
        }
      );
      currentNodeInfo = openNode.shift();
    }
    return allNode.sort(
      (a, b) => a.depth - b.depth ? a.depth - b.depth : a.distance - b.distance
    );
  }
  graphNodeDistance(nodeGraph) {
    return nodeGraph.map((nodeG) => {
      return {
        ...nodeG,
        distance: this.nodeMap.nodeDistance(nodeG.node.nodeMap)
      };
    }).sort((a, b) => a.distance - b.distance);
  }
  /* ------------------------------------ */
  /* ------------------------------------ */
  /* ------------------------------------ */
  _isValideNearNode(node) {
    const tile = this.fm.getTile(node.tile.x, node.tile.y);
    return !tile.isFrise && !tile.isBlock && !tile.wcBuild;
  }
  getNodesAround(radius, step) {
    return this.nodeMap.getNodesAround(
      radius,
      step
    ).map((n) => {
      const nodeGraph = new _GraphTileNode(
        this.world,
        this.fm.getTile(n.x, n.y),
        n.alpha
      );
      nodeGraph.parents.push(this);
      return nodeGraph;
    });
  }
  getNearConnectedNode(crossDist, depthMin) {
    const ITER_LIMIT = 40;
    const nodeGraph = this.getGraphNodeFrom(ITER_LIMIT);
    const filterCross = this.graphNodeDistance(
      nodeGraph
    ).filter((nG) => {
      return nG.depth >= depthMin && nG.distance <= crossDist;
    });
    if (filterCross.length) {
      return filterCross.sort((a, b) => a.distance - b.distance)[0].node;
    }
    return null;
  }
  getBestNearNode(config) {
    const ITER_LIMIT = 40;
    const CROSS_ITER_MIN = 40;
    const nodeGraph = this.getGraphNodeFrom(ITER_LIMIT);
    if (config.crossDist) {
      const filterCross = this.graphNodeDistance(
        nodeGraph
      ).filter((nG) => {
        return nG.depth >= CROSS_ITER_MIN && nG.distance <= config.crossDist;
      });
      if (filterCross.length) {
        return filterCross.sort((a, b) => a.distance - b.distance)[0].node;
      }
    }
    const nodeAroundRaw = this.getNodesAround(
      config.length,
      config.alphaStep
    );
    const nodeAroundValide = nodeAroundRaw.filter((n) => this._isValideNearNode(n));
    if (nodeAroundValide.length == 0)
      return null;
    const nodeAroundInfo = nodeAroundValide.map((n) => {
      const distNodeGraph = n.graphNodeDistance(nodeGraph);
      return {
        node: n,
        minDist: distNodeGraph[0].distance,
        avgNearDist: distNodeGraph.filter((nG) => nG.depth <= config.fareDepthLimit).reduce((acc, a) => acc + a.distance, 0),
        avgFareDist: distNodeGraph.filter((nG) => nG.depth > config.fareDepthLimit).reduce((acc, a) => acc + a.distance, 0)
      };
    });
    const nodeFilterA = nodeAroundInfo.filter((nInfo) => nInfo.minDist > config.minDist);
    if (nodeFilterA.length == 0)
      return null;
    const nodeFilterB = nodeFilterA.sort((a, b) => b.avgNearDist - a.avgNearDist).slice(0, Math.min(nodeFilterA.length, config.fareKeep));
    const nodeFilterC = config.extend ? nodeFilterB.sort(
      (a, b) => b.avgFareDist - a.avgFareDist || b.avgNearDist - a.avgNearDist
    ) : nodeFilterB.sort(
      (a, b) => a.avgFareDist - b.avgFareDist || b.avgNearDist - a.avgNearDist
    );
    let bestNode = nodeFilterC.shift();
    while (bestNode) {
      const path = new PathFactory(this.world);
      const tileList = path.createPath({ x: this.tile.x, y: this.tile.y }, {
        x: bestNode.node.tile.x,
        y: bestNode.node.tile.y
      });
      if (!tileList || tileList.length == 0)
        return null;
      if (tileList.length < config.length + 10) {
        return bestNode.node;
      }
      bestNode = nodeFilterC.shift();
    }
    return null;
  }
  propagatePowerAction(value, pIter, parentNode) {
    this.powerAction += value;
    if (pIter == 0)
      return;
    this.link.forEach((nextNode) => {
      if (nextNode != parentNode) {
        nextNode.propagatePowerAction(value, pIter - 1, this);
      }
    });
  }
  /*
  
    getNodeConnected(pIter: number): GraphTileNode[] {
      let nodes: GraphTileNode[] = [];
      this.link.forEach((broNode) => {
        nodes.push(broNode);
        if (pIter > 0) {
          nodes = nodes.concat(broNode.getNodeConnected(pIter - 1));
        }
      });
      return [...new Set(nodes)];
    }
  
    // ----
    getCloserDistanceNode(pIter = 5) {
      // Get Direct Connected Node
      const nearNodesConnected = this.getNodeConnected(0);
      // Get All node Conected to a (n)child
      // Filter Node not connected .
      const nearNodesPossible = this.getNodeConnected(pIter)
        .filter((n) => !nearNodesConnected.includes(n) && n !== this);
  
      const minDistNode = this.nodesMinDistance(nearNodesPossible);
      return minDistNode;
    }
  
    addRoad(road, pIter = 5, cost = 1) {
      this.roads.push(road);
      this.propagateRoad(pIter, road.getBrother(this), cost);
    }
  
      */
};

// IsoGame/city/cityNode.ts
var CityNode = class _CityNode extends GraphTileNode {
  x;
  y;
  ta;
  static FromNodeGraph(nodeGraph) {
    return Object.assign(
      new _CityNode(nodeGraph.world, nodeGraph.tile, nodeGraph.nodeMap.alpha),
      nodeGraph
    );
  }
  static FromNodeMap(world, nodeMap) {
    return new _CityNode(
      world,
      FactoryMap.getInstance().getTile(nodeMap.x, nodeMap.y),
      nodeMap.alpha
    );
  }
  constructor(world, tile, alphaPath) {
    super(world, tile, alphaPath);
    this.x = tile.x;
    this.y = tile.y;
    this.ta = TilesActions.getInstance();
  }
};

// IsoGame/city/pathConfig.ts
var DEFAULT_CITY_PARAM = {
  count: 40,
  mainRoad: {
    length: 18,
    crossDist: 20,
    minDist: 15,
    color: [64, 64, 64],
    color2: [46, 46, 46],
    alphaStep: 5,
    extend: true,
    fareKeep: 3,
    fareDepthLimit: 2,
    powerCost: 1,
    powerIter: 10
  },
  crossingRoad: {
    length: 18,
    crossDist: 20,
    minDist: 14,
    color: [64, 64, 64],
    color2: [50, 50, 64],
    alphaStep: 4,
    extend: false,
    fareKeep: 1,
    fareDepthLimit: 3,
    powerCondition: 3,
    powerCost: -2,
    powerIter: 5
  },
  connectRoad: {
    length: 20,
    minDist: 12,
    color: [64, 64, 64],
    color2: [50, 64, 50],
    powerCost: 1,
    powerIter: 10
  },
  mainBuilding: {
    buildList: [
      // "WcBuildConf_HouseA",
      // "WcBuildConf_HouseA",
      // "WcBuildConf_HouseA",
      // "WcBuildConf_HouseA",
      //# "WcBuildConf_HouseA",
      //# "WcBuildConf_GraveA",
      //# "WcBuildConf_LabPipeA",
      "WcBuildConf_LabBorderA",
      "WcBuildConf_RLabA"
      // "WcBuildConf_ManorA",
      // "WcBuildConf_ManorA",
      //
    ],
    count: 60,
    length: 8,
    crossDist: 0,
    minDist: 2,
    color: [256, 256, 256],
    color2: [64, 64, 64],
    alphaStep: 4,
    extend: false,
    fareKeep: 4,
    fareDepthLimit: 3,
    powerCondition: 3,
    powerCost: -1e3,
    powerIter: 0
  }
};

// IsoGame/city/city.ts
var City = class {
  world;
  fm;
  x = 0;
  y = 0;
  centerNode;
  param;
  openNodes;
  gridNodes;
  pointNode;
  blockNodes;
  buildingNodes;
  // roads:
  constructor(world, x, y, param = DEFAULT_CITY_PARAM) {
    this.world = world;
    this.fm = FactoryMap.getInstance();
    this.x = x;
    this.y = y;
    this.param = param;
    this.openNodes = [];
    this.gridNodes = [];
    this.pointNode = [];
    this.blockNodes = [];
    this.buildingNodes = [];
    this.centerNode = new CityNode(world, this.fm.getTile(x, y), 0);
    this.gridNodes.push(this.centerNode);
    this.openNodes.push(this.centerNode);
    for (let i = 0; i < this.param.count; i++) {
      console.log("= City : MainRoad", i);
      const bestEvalNode = this.nextBestRoad();
      if (bestEvalNode) {
        console.debug(
          `Road ${bestEvalNode.startNode.x} | ${bestEvalNode.endNode.y}`
        );
        this.createNewRoad(
          bestEvalNode.startNode,
          bestEvalNode.endNode,
          bestEvalNode.param
        );
        bestEvalNode.endNode.propagatePowerAction(
          bestEvalNode.param.powerCost,
          bestEvalNode.param.powerIter,
          bestEvalNode.endNode
        );
        const newNode = bestEvalNode.endNode.getNearConnectedNode(
          param.connectRoad.length,
          5
        );
        if (newNode) {
          const newCityNode = CityNode.FromNodeGraph(newNode);
          this.createNewRoad(
            bestEvalNode.endNode,
            newCityNode,
            this.param.connectRoad
          );
        }
      }
    }
    for (let i = 0; i < this.param.mainBuilding.count; i++) {
      console.log("= City : Build", i);
      const bestEvalNode = this.nextBestBuilding();
      if (bestEvalNode) {
        console.log(
          `Build ${bestEvalNode.startNode.x} | ${bestEvalNode.endNode.y}`
        );
        this.createNewBuilding(
          bestEvalNode.startNode,
          bestEvalNode.endNode,
          bestEvalNode.param
        );
      }
    }
  }
  nextBestBuilding() {
    const buildingRoadNodes = this.gridNodes.filter((node) => {
      return node.link.length < 4 && node.childs.length > 0;
    });
    return this.createBestRoadAgroundNodeList(
      buildingRoadNodes,
      this.param.mainBuilding
    );
  }
  // Create Main Raod
  nextBestRoad() {
    const crossRoadNodes = this.gridNodes.filter((node) => {
      return node.link.length < 3 && node.childs.length > 0 && node.powerAction >= (this.param.crossingRoad.powerCondition | 0);
    }).filter((node) => {
      const nearNode = [...new Set(node.getGraphNodeFrom(0))];
      const neadlink = nearNode.map((n) => n.node.link.length).reduce(
        (acc, v) => acc + v,
        0
      );
      return neadlink <= 6;
    });
    if (crossRoadNodes.length > 0) {
      const bestEvalRoad = this.createBestRoadAgroundNodeList(
        crossRoadNodes,
        this.param.crossingRoad
      );
      if (bestEvalRoad) {
        return bestEvalRoad;
      }
    }
    this.openNodes = this.openNodes.filter((node) => {
      return node.link.length < 2;
    });
    return this.createBestRoadAgroundNodeList(
      this.openNodes,
      this.param.mainRoad
    );
  }
  /** --------------------- */
  // Chose the best Node Aroud can be created.
  createBestRoadAgroundNodeList(nodesList, param) {
    const bestNodeList = nodesList.map((startNode) => {
      const newNode = startNode.getBestNearNode(param);
      if (newNode) {
        const newCityNode = CityNode.FromNodeGraph(newNode);
        const evals = this.evalNode(newCityNode);
        return {
          eval: evals,
          startNode,
          endNode: newCityNode,
          param
        };
      } else {
        return {
          eval: 0,
          startNode,
          endNode: startNode,
          param
        };
      }
    }).filter((evalNode) => evalNode.eval > 0).sort((a, b) => -a.eval + b.eval);
    if (bestNodeList.length < 1) {
      return null;
    } else {
      return bestNodeList[0];
    }
  }
  /** --------------------- */
  evalNode(cityNode) {
    const centerDistance = this.centerNode.nodeMap.nodeDistance(
      cityNode.nodeMap
    );
    const centerFactor = centerDistance > 140 ? 0 : 1 - centerDistance / 140;
    const minDistance = cityNode.nodeMap.nodeMeanMinDisance(
      this.gridNodes.map((cn) => cn.nodeMap)
    );
    return centerFactor * minDistance;
  }
  createNewRoad(startNode, newNode, param) {
    startNode.addChild(newNode);
    newNode.addParent(startNode);
    this.gridNodes.push(newNode);
    this.openNodes.push(newNode);
    if (newNode.tile.rFlore * 1e3 % 42 < 3) {
      this.centerNode = newNode;
    }
    const pathFactory = new PathFactory(this.world);
    pathFactory.axeCount = 4;
    const tileList = pathFactory.createPath({
      x: startNode.x,
      y: startNode.y
    }, {
      x: newNode.x,
      y: newNode.y
    });
    if (tileList) {
      const actionList = actionDrawPathAndPlatform(tileList, param);
      TilesActions.getInstance().doActions(actionList);
    }
  }
  createNewBuilding(startNode, newNode, param) {
    startNode.addChild(newNode);
    newNode.addParent(startNode);
    const buildingType = param.buildList[this.buildingNodes.length % param.buildList.length];
    WcBuildActions.getInstance().doAction({
      func: "createBuilding",
      x: newNode.x,
      y: newNode.y,
      buildingType,
      growLoopCount: 80,
      endLoopMax: 500
    });
    const tile = this.fm.getTile(newNode.x, newNode.y);
    const wcBuildTile = tile.wcBuild;
    if (wcBuildTile) {
      const wcBuild = wcBuildTile.buildFactory;
      if (!this.buildingNodes.includes(wcBuild)) {
        this.buildingNodes.push(wcBuild);
      }
    }
    const pathFactory = new PathFactory(this.world);
    pathFactory.axeCount = 4;
    const tileList = pathFactory.createPath({
      x: startNode.x,
      y: startNode.y
    }, {
      x: newNode.x,
      y: newNode.y
    });
    if (tileList) {
      const actionList = actionDrawPath(tileList, param);
      TilesActions.getInstance().doActions(actionList);
    }
  }
  /** --------------------- * /
    nodeLvlDeviation(
      startNode: CityNode,
      newNode: CityNode,
      param: CityParamRoadSection,
    ) {
      const lvl = this.fm.getRoundTile(startNode.x, startNode.y).lvl;
      // const arround = newNode.getNodesAroud(param.lvlDeviationLength, param.lvlDefviationAlphaStep);
      const arround = newNode.nodeMap.getNodesNearTarget(
        startNode.nodeMap,
        param.lvlDefviationAlpha,
        param.lvlDeviationCount,
      );
      let endNode = newNode.nodeMap;
  
      let diffLvl = Math.abs(
        this.fm.getRoundTile(newNode.x, newNode.y).lvl - lvl,
      );
      arround.forEach((tmpNode) => {
        const tmpDiffLvl = Math.abs(
          this.fm.getRoundTile(tmpNode.x, tmpNode.y).lvl - lvl,
        );
        if (tmpDiffLvl < diffLvl) {
          diffLvl = tmpDiffLvl;
          endNode = tmpNode;
        }
      });
      return endNode;
    }
  
  
    expendSubRoads() {
      // SubSelect a part of Road , Find a Road extention
      const sizeGridRand = 1 / (this.gridNodes.length / 20.);
  
      const crossNodes = this.gridNodes.filter((node) => {
        return node.link.length < 3 && Math.random() < sizeGridRand; // Magic Random to Perf
      });
      this.createBestRoadAgroundNodeList(crossNodes, this.param.subRoad);
    }
  
    connectSubRoads() {
      const param = this.param.connectRoad;
      const crossNodes = this.gridNodes.filter((node) => {
        return node.link.length == 2; // & node.power > this.param.subRoad.powerCondition;
      });
      crossNodes.forEach((startNode) => {
        const nearNodes = startNode.getGraphNodeFrom(2);
  
        const arround = startNode.nodeMap.getNodesAround(
          param.length,
          param.alphaStep,
        );
  
        let arroundNear = arround.map((endNode) => {
          const [dist, node] = endNode.nodesMinDistance(
            this.gridNodes.map((n) => n.nodeMap),
          );
          return {
            eval: dist,
            startNode: startNode,
            endNode: node ? CityNode.FromNodeMap(this.world, node) : null,
          } as EvalRoad;
        });
        arroundNear = arroundNear
          .filter((x) => x.eval > 0)
          .filter((x) => !nearNodes.map((n) => n.node).includes(x.endNode))
          .sort((a, b) => -a.eval + b.eval);
        const firstArroundNear = arroundNear[0];
        if (firstArroundNear) {
          this.createNewRoad(
            firstArroundNear.startNode,
            firstArroundNear.endNode,
            param,
          );
        }
      });
    }
    /*
    createCenter() {
      const count = 8;
      const step = Math.round(this.gridNodes.length / count);
      let centerNode = [];
      for (let i = 0; i < count; i++) {
        centerNode.push(
          new CityNode(this.gridNodes[i * step].x, this.gridNodes[i * step].y),
        );
      }
      this.gridNodes.forEach((node) => {
        const movingNode = node.nodesMinDistance(centerNode)[1];
        movingNode.move(node);
      });
      this.centerNode = centerNode;
    }
    */
  /*
    createBlock() {
      // Compute Point For Block Around each CrossRoadNode
      this.gridNodes
        // .filter(node => node.roads.length > 2)
        .forEach((node) => {
          node.getCrossZoneRoadNode();
        });
  
      this.roads.forEach((road) => {
        road.sliptBlocks(3, 0.1);
      });
    }
    */
  /*
  
      drawPoint(context, node, size, color, zoom) {
          if (!node ) return false;
  
          context.beginPath();
          context.arc(node.getx(zoom), node.gety(zoom), size, 0, 2 * Math.PI);
          context.lineWidth = 0;
          context.fillStyle = color;
          context.fill();
      }
  
      drawLine(context, n1, n2, size, color, zoom) {
          if (!n1 | !n2 ) return false;
          context.beginPath();
          context.moveTo(n1.getx(zoom), n1.gety(zoom));
          context.lineTo(n2.getx(zoom), n2.gety(zoom));
          context.lineWidth = size;
          context.strokeStyle = color;
          context.stroke();
      }
      drawBlock(context, n1, n2, n3, n4, color, zoom) {
          context.beginPath();
          context.moveTo(n1.getx(zoom), n1.gety(zoom));
          context.lineTo(n2.getx(zoom), n2.gety(zoom));
          context.lineTo(n3.getx(zoom), n3.gety(zoom));
          context.lineTo(n4.getx(zoom), n4.gety(zoom));
          context.lineWidth = 0;
          context.fillStyle = color;
          context.fill();
      }
  
      draw(context, zoom) {
          console.log("Draw", this);
  
          // this.tiledBuilding.context.drawImage(build.imageData, xDisplay, yDisplay, z, z);
  
          this.roads.forEach(road => {
              this.drawLine(context, road.n1, road.n2, road.param.size, road.param.color, zoom);
  
              road.blocks
              .filter(blc => blc.lineRoad != undefined & blc.lineOut != undefined)
              .forEach(blc => {
                  if (!blc.lineRoad | !blc.lineOut | !blc.lineRoad.n1 | !blc.lineRoad.n2 | !blc.lineOut.n1 | !blc.lineOut.n2) {
                      return;
                  }
                  // this.drawLine(context, blc.lineRoad.n1, blc.lineOut.n1, 1, '#9999FF', zoom);
                  // this.drawLine(context, blc.lineRoad.n1, blc.lineRoad.n2, 1, '#9999FF', zoom);
                  // this.drawLine(context, blc.lineOut.n1, blc.lineOut.n2, 1, '#99FFFF', zoom);
                  const density = 128 // this.world.factoryGenerator.getRawDensity(blc.lineRoad.n1.x, blc.lineRoad.n1.y);
  
                  if (Math.random() < density - .7) {
                      this.drawBlock(context,
                          blc.lineRoad.n1, blc.lineRoad.n2,
                          blc.lineOut.n2, blc.lineOut.n1,
                          '#99999999', zoom
                      )
                  }
              })
          })
  
          / *
          this.centerNode.forEach(node => {
              context.beginPath();
              context.arc(node.getx(zoom), node.gety(zoom), 5, 0, 2 * Math.PI);
              context.lineWidth = 5;
              context.strokeStyle = '#000000';
              context.stroke();
          })
          * /
  
          context.beginPath();
          context.arc((this.x * 16 + 8) / zoom, (this.y * 16 + 8) / zoom, 5, 0, 2 * Math.PI);
          context.strokeStyle = '#FFF';
          context.lineWidth = 5;
          context.stroke();
  
  
      }
      */
};

// IsoGame/mapIso/asset/assetOptiConfig.ts
var asset_ItemTech = {
  "src": "./img/asset_opti/ItemTech.png",
  "group": "ItemTech",
  "images": [
    {
      "label": "barrels_rail",
      "top": 0
    },
    {
      "label": "satelliteDish_large",
      "top": 224
    },
    {
      "label": "barrels",
      "top": 448
    },
    {
      "label": "machine_barrel",
      "top": 672
    },
    {
      "label": "gate_simple",
      "top": 896
    },
    {
      "label": "satelliteDish",
      "top": 1120
    },
    {
      "label": "machine_generator",
      "top": 1344
    },
    {
      "label": "gate_complex",
      "top": 1568
    },
    {
      "label": "machine_wirelessCable",
      "top": 1792
    },
    {
      "label": "machine_generatorLarge",
      "top": 2016
    },
    {
      "label": "satelliteDish_detailed",
      "top": 2240
    },
    {
      "label": "machine_wireless",
      "top": 2464
    },
    {
      "label": "machine_barrelLarge",
      "top": 2688
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_AstroBase = {
  "src": "./img/asset_opti/AstroBase.png",
  "group": "AstroBase",
  "images": [
    {
      "label": "corridor_open",
      "top": 0
    },
    {
      "label": "corridor_windowClosed",
      "top": 224
    },
    {
      "label": "corridor_",
      "top": 448
    },
    {
      "label": "corridor_cornerRoundWindow",
      "top": 672
    },
    {
      "label": "corridor_cross",
      "top": 896
    },
    {
      "label": "corridor_corner",
      "top": 1120
    },
    {
      "label": "corridor_window",
      "top": 1344
    },
    {
      "label": "corridor_detailed",
      "top": 1568
    },
    {
      "label": "corridor_end",
      "top": 1792
    },
    {
      "label": "corridor_cornerRound",
      "top": 2016
    },
    {
      "label": "corridor_roof",
      "top": 2240
    },
    {
      "label": "corridor_split",
      "top": 2464
    },
    {
      "label": "corridor_wallCorner",
      "top": 2688
    },
    {
      "label": "corridor_wall",
      "top": 2912
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_Wall = {
  "src": "./img/asset_opti/Wall.png",
  "group": "Wall",
  "images": [
    {
      "label": "fence_simpleLow",
      "top": 0
    },
    {
      "label": "fenceGate",
      "top": 224
    },
    {
      "label": "fence_bend",
      "top": 448
    },
    {
      "label": "doorClosed",
      "top": 672
    },
    {
      "label": "fence_simpleDiagonal",
      "top": 896
    },
    {
      "label": "fence_gate",
      "top": 1120
    },
    {
      "label": "doorOpen",
      "top": 1344
    },
    {
      "label": "hedge",
      "top": 1568
    },
    {
      "label": "fence_simpleHigh",
      "top": 1792
    },
    {
      "label": "fence_planks",
      "top": 2016
    },
    {
      "label": "ironFenceBorder",
      "top": 2240
    },
    {
      "label": "fence_simpleCenter",
      "top": 2464
    },
    {
      "label": "fence_bendCenter",
      "top": 2688
    },
    {
      "label": "fence_simpleDiagonalCenter",
      "top": 2912
    },
    {
      "label": "brickWallCurve",
      "top": 3136
    },
    {
      "label": "stoneWallDamaged",
      "top": 3360
    },
    {
      "label": "fence_planksDouble",
      "top": 3584
    },
    {
      "label": "brickWall",
      "top": 3808
    },
    {
      "label": "stoneWall",
      "top": 4032
    },
    {
      "label": "ironFence",
      "top": 4256
    },
    {
      "label": "stoneWallCurve",
      "top": 4480
    },
    {
      "label": "ironFenceBar",
      "top": 4704
    },
    {
      "label": "rail_middle",
      "top": 4928
    },
    {
      "label": "hedgeCorner",
      "top": 5152
    },
    {
      "label": "ironFenceDamaged",
      "top": 5376
    },
    {
      "label": "fence_corner",
      "top": 5600
    },
    {
      "label": "ironFenceBorderColumn",
      "top": 5824
    },
    {
      "label": "ironFenceCurve",
      "top": 6048
    },
    {
      "label": "fence_simple",
      "top": 6272
    },
    {
      "label": "ironFenceBorderGate",
      "top": 6496
    },
    {
      "label": "rail_end",
      "top": 6720
    },
    {
      "label": "fence_",
      "top": 6944
    },
    {
      "label": "rail_corner",
      "top": 7168
    },
    {
      "label": "stoneWallColumn",
      "top": 7392
    },
    {
      "label": "ironFenceBorderCurve",
      "top": 7616
    },
    {
      "label": "fenceDamaged",
      "top": 7840
    },
    {
      "label": "rail",
      "top": 8064
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_ItemPilar = {
  "src": "./img/asset_opti/ItemPilar.png",
  "group": "ItemPilar",
  "images": [
    {
      "label": "statue_column",
      "top": 0
    },
    {
      "label": "statue_ring",
      "top": 224
    },
    {
      "label": "statue_obelisk",
      "top": 448
    },
    {
      "label": "pillarSquare",
      "top": 672
    },
    {
      "label": "statue_head",
      "top": 896
    },
    {
      "label": "pillarObelisk",
      "top": 1120
    },
    {
      "label": "statue_block",
      "top": 1344
    },
    {
      "label": "pillarLarge",
      "top": 1568
    },
    {
      "label": "borderPillar",
      "top": 1792
    },
    {
      "label": "pillarSmall",
      "top": 2016
    },
    {
      "label": "statue_columnDamaged",
      "top": 2240
    },
    {
      "label": "columnLarge",
      "top": 2464
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_NatureRock = {
  "src": "./img/asset_opti/NatureRock.png",
  "group": "NatureRock",
  "images": [
    {
      "label": "rock_largeA",
      "top": 0
    },
    {
      "label": "rockSmall",
      "top": 224
    },
    {
      "label": "debrisWood",
      "top": 448
    },
    {
      "label": "stone_smallFlatB",
      "top": 672
    },
    {
      "label": "stone_largeB",
      "top": 896
    },
    {
      "label": "stone_smallC",
      "top": 1120
    },
    {
      "label": "stone_smallTopA",
      "top": 1344
    },
    {
      "label": "platform_stone",
      "top": 1568
    },
    {
      "label": "stone_tallB",
      "top": 1792
    },
    {
      "label": "debris",
      "top": 2016
    },
    {
      "label": "stone_smallA",
      "top": 2240
    },
    {
      "label": "rockLarge",
      "top": 2464
    },
    {
      "label": "stone_tallD",
      "top": 2688
    },
    {
      "label": "stone_tallH",
      "top": 2912
    },
    {
      "label": "stone_smallE",
      "top": 3136
    },
    {
      "label": "stone_largeD",
      "top": 3360
    },
    {
      "label": "stone_smallI",
      "top": 3584
    },
    {
      "label": "rock_crystalsLargeA",
      "top": 3808
    },
    {
      "label": "rocksTall",
      "top": 4032
    },
    {
      "label": "meteor",
      "top": 4256
    },
    {
      "label": "rock_crystals",
      "top": 4480
    },
    {
      "label": "meteor_detailed",
      "top": 4704
    },
    {
      "label": "platform_beach",
      "top": 4928
    },
    {
      "label": "rocks",
      "top": 5152
    },
    {
      "label": "stone_tallJ",
      "top": 5376
    },
    {
      "label": "stone_tallF",
      "top": 5600
    },
    {
      "label": "rocks_smallB",
      "top": 5824
    },
    {
      "label": "stone_largeF",
      "top": 6048
    },
    {
      "label": "stone_smallG",
      "top": 6272
    },
    {
      "label": "platform_grass",
      "top": 6496
    },
    {
      "label": "stone_tallC",
      "top": 6720
    },
    {
      "label": "stone_smallB",
      "top": 6944
    },
    {
      "label": "stone_largeC",
      "top": 7168
    },
    {
      "label": "stone_smallFlatC",
      "top": 7392
    },
    {
      "label": "stone_smallFlatA",
      "top": 7616
    },
    {
      "label": "rock_largeB",
      "top": 7840
    },
    {
      "label": "stone_tallA",
      "top": 8064
    },
    {
      "label": "stone_smallTopB",
      "top": 8288
    },
    {
      "label": "crater",
      "top": 8512
    },
    {
      "label": "rock",
      "top": 8736
    },
    {
      "label": "stone_largeA",
      "top": 8960
    },
    {
      "label": "craterLarge",
      "top": 9184
    },
    {
      "label": "stone_largeE",
      "top": 9408
    },
    {
      "label": "stone_smallD",
      "top": 9632
    },
    {
      "label": "stone_smallH",
      "top": 9856
    },
    {
      "label": "rocks_smallA",
      "top": 10080
    },
    {
      "label": "stone_tallE",
      "top": 10304
    },
    {
      "label": "stone_tallI",
      "top": 10528
    },
    {
      "label": "meteor_half",
      "top": 10752
    },
    {
      "label": "stone_smallF",
      "top": 10976
    },
    {
      "label": "stone_tallG",
      "top": 11200
    },
    {
      "label": "rockWide",
      "top": 11424
    },
    {
      "label": "rock_crystalsLargeB",
      "top": 11648
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_AstroRocket = {
  "src": "./img/asset_opti/AstroRocket.png",
  "group": "AstroRocket",
  "images": [
    {
      "label": "rocket_fuelB",
      "top": 0
    },
    {
      "label": "rocket_sidesA",
      "top": 224
    },
    {
      "label": "rocket_finsA",
      "top": 448
    },
    {
      "label": "rocket_baseB",
      "top": 672
    },
    {
      "label": "rocket_topA",
      "top": 896
    },
    {
      "label": "rocket_sidesB",
      "top": 1120
    },
    {
      "label": "rocket_fuelA",
      "top": 1344
    },
    {
      "label": "rocket_topB",
      "top": 1568
    },
    {
      "label": "rocket_finsB",
      "top": 1792
    },
    {
      "label": "rocket_baseA",
      "top": 2016
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_Town2 = {
  "src": "./img/asset_opti/Town2.png",
  "group": "Town2",
  "images": [
    {
      "label": "wallWoodArchTopDetail",
      "top": 0
    },
    {
      "label": "wallWoodCornerDiagonal",
      "top": 224
    },
    {
      "label": "wallWood",
      "top": 448
    },
    {
      "label": "wallWoodArch",
      "top": 672
    },
    {
      "label": "roofHighGableTop",
      "top": 896
    },
    {
      "label": "wallWoodCurved",
      "top": 1120
    },
    {
      "label": "wallWoodDoorwayRound",
      "top": 1344
    },
    {
      "label": "wallWoodBlockHalf",
      "top": 1568
    },
    {
      "label": "roofHighGableDetail",
      "top": 1792
    },
    {
      "label": "wallWoodDetailCross",
      "top": 2016
    },
    {
      "label": "wallWoodWindowStone",
      "top": 2240
    },
    {
      "label": "wallWoodWindowRound",
      "top": 2464
    },
    {
      "label": "wallWoodWindowSmall",
      "top": 2688
    },
    {
      "label": "wallWoodWindowShutters",
      "top": 2912
    },
    {
      "label": "wallWoodDetailHorizontal",
      "top": 3136
    },
    {
      "label": "roofHighCornerInner",
      "top": 3360
    },
    {
      "label": "wallWoodCornerDiagonalHalf",
      "top": 3584
    },
    {
      "label": "roofHighPoint",
      "top": 3808
    },
    {
      "label": "poles",
      "top": 4032
    },
    {
      "label": "roofHighRight",
      "top": 4256
    },
    {
      "label": "wallWoodBlock",
      "top": 4480
    },
    {
      "label": "wallWoodCornerEdge",
      "top": 4704
    },
    {
      "label": "wallWoodHalf",
      "top": 4928
    },
    {
      "label": "roofHigh",
      "top": 5152
    },
    {
      "label": "roofHighCornerRound",
      "top": 5376
    },
    {
      "label": "wallWoodRounded",
      "top": 5600
    },
    {
      "label": "wallWoodSide",
      "top": 5824
    },
    {
      "label": "wallWoodDiagonal",
      "top": 6048
    },
    {
      "label": "wallWoodWindowGlass",
      "top": 6272
    },
    {
      "label": "wallWoodSlope",
      "top": 6496
    },
    {
      "label": "roofHighFlat",
      "top": 6720
    },
    {
      "label": "wallWoodDoorwaySquareWideCurved",
      "top": 6944
    },
    {
      "label": "wallWoodDoor",
      "top": 7168
    },
    {
      "label": "roofHighGable",
      "top": 7392
    },
    {
      "label": "wallWoodArchTop",
      "top": 7616
    },
    {
      "label": "wallWoodDoorwaySquare",
      "top": 7840
    },
    {
      "label": "wallWoodDetailDiagonal",
      "top": 8064
    },
    {
      "label": "roofHighGableEnd",
      "top": 8288
    },
    {
      "label": "wallWoodDoorwayBase",
      "top": 8512
    },
    {
      "label": "polesHorizontal",
      "top": 8736
    },
    {
      "label": "wallWoodCorner",
      "top": 8960
    },
    {
      "label": "roofHighWindow",
      "top": 9184
    },
    {
      "label": "wallWoodDoorwaySquareWide",
      "top": 9408
    },
    {
      "label": "roofHighLeft",
      "top": 9632
    },
    {
      "label": "wallWoodBroken",
      "top": 9856
    },
    {
      "label": "roofHighCorner",
      "top": 10080
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_NatureFlower = {
  "src": "./img/asset_opti/NatureFlower.png",
  "group": "NatureFlower",
  "scall": true,
  "images": [
    {
      "label": "mushroom_redTall",
      "top": 0
    },
    {
      "label": "crops_bambooStageB",
      "top": 224
    },
    {
      "label": "crops_cornStageA",
      "top": 448
    },
    {
      "label": "flower_purpleA",
      "top": 672
    },
    {
      "label": "grass_large",
      "top": 896
    },
    {
      "label": "crops_cornStageC",
      "top": 1120
    },
    {
      "label": "flower_purpleC",
      "top": 1344
    },
    {
      "label": "flower_redB",
      "top": 1568
    },
    {
      "label": "grass",
      "top": 1792
    },
    {
      "label": "crops_wheatStageB",
      "top": 2016
    },
    {
      "label": "plant_flatTall",
      "top": 2240
    },
    {
      "label": "flower_yellowC",
      "top": 2464
    },
    {
      "label": "plant_bushLarge",
      "top": 2688
    },
    {
      "label": "mushroom_tan",
      "top": 2912
    },
    {
      "label": "flower_yellowA",
      "top": 3136
    },
    {
      "label": "plant_bush",
      "top": 3360
    },
    {
      "label": "plant_bushSmall",
      "top": 3584
    },
    {
      "label": "crops_leafsStageA",
      "top": 3808
    },
    {
      "label": "lily_small",
      "top": 4032
    },
    {
      "label": "mushroom_redGroup",
      "top": 4256
    },
    {
      "label": "plant_bushDetailed",
      "top": 4480
    },
    {
      "label": "flower_redA",
      "top": 4704
    },
    {
      "label": "mushroom_red",
      "top": 4928
    },
    {
      "label": "crops_bambooStageA",
      "top": 5152
    },
    {
      "label": "flower_redC",
      "top": 5376
    },
    {
      "label": "lily_large",
      "top": 5600
    },
    {
      "label": "flower_purpleB",
      "top": 5824
    },
    {
      "label": "crops_cornStageB",
      "top": 6048
    },
    {
      "label": "plant_flatShort",
      "top": 6272
    },
    {
      "label": "grass_leafs",
      "top": 6496
    },
    {
      "label": "mushroom_tanTall",
      "top": 6720
    },
    {
      "label": "flower_yellowB",
      "top": 6944
    },
    {
      "label": "plant_bushTriangle",
      "top": 7168
    },
    {
      "label": "crops_leafsStageB",
      "top": 7392
    },
    {
      "label": "grass_leafsLarge",
      "top": 7616
    },
    {
      "label": "mushroom_tanGroup",
      "top": 7840
    },
    {
      "label": "crops_cornStageD",
      "top": 8064
    },
    {
      "label": "crops_wheatStageA",
      "top": 8288
    },
    {
      "label": "plant_bushLargeTriangle",
      "top": 8512
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_AstroPlatform = {
  "src": "./img/asset_opti/AstroPlatform.png",
  "group": "AstroPlatform",
  "images": [
    {
      "label": "platform_center",
      "top": 0
    },
    {
      "label": "platform_small",
      "top": 224
    },
    {
      "label": "structure_closed",
      "top": 448
    },
    {
      "label": "platform_corner",
      "top": 672
    },
    {
      "label": "platform_cornerOpen",
      "top": 896
    },
    {
      "label": "platform_side",
      "top": 1120
    },
    {
      "label": "platform_high",
      "top": 1344
    },
    {
      "label": "platform_low",
      "top": 1568
    },
    {
      "label": "platform_cornerRound",
      "top": 1792
    },
    {
      "label": "structure",
      "top": 2016
    },
    {
      "label": "platform_smallDiagonal",
      "top": 2240
    },
    {
      "label": "platform_end",
      "top": 2464
    },
    {
      "label": "structure_diagonal",
      "top": 2688
    },
    {
      "label": "supports_high",
      "top": 2912
    },
    {
      "label": "platform_straight",
      "top": 3136
    },
    {
      "label": "structure_detailed",
      "top": 3360
    },
    {
      "label": "supports_low",
      "top": 3584
    },
    {
      "label": "platform_cornerDot",
      "top": 3808
    },
    {
      "label": "platform_centerA",
      "top": 4032
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_MyTower = {
  "src": "./img/asset_opti/MyTower.png",
  "group": "MyTower",
  "images": [],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_ItemOther = {
  "src": "./img/asset_opti/ItemOther.png",
  "group": "ItemOther",
  "images": [
    {
      "label": "crate",
      "top": 0
    },
    {
      "label": "barrel",
      "top": 224
    },
    {
      "label": "detailPlate",
      "top": 448
    },
    {
      "label": "bench",
      "top": 672
    },
    {
      "label": "heart",
      "top": 896
    },
    {
      "label": "campfire_logs",
      "top": 1120
    },
    {
      "label": "flag",
      "top": 1344
    },
    {
      "label": "chest",
      "top": 1568
    },
    {
      "label": "chimney",
      "top": 1792
    },
    {
      "label": "spikesHidden",
      "top": 2016
    },
    {
      "label": "key",
      "top": 2240
    },
    {
      "label": "crateStrong",
      "top": 2464
    },
    {
      "label": "coinSilver",
      "top": 2688
    },
    {
      "label": "bones",
      "top": 2912
    },
    {
      "label": "road",
      "top": 3136
    },
    {
      "label": "detailBowl",
      "top": 3360
    },
    {
      "label": "crateItemStrong",
      "top": 3584
    },
    {
      "label": "benchDamaged",
      "top": 3808
    },
    {
      "label": "coinGold",
      "top": 4032
    },
    {
      "label": "spikesLarge",
      "top": 4256
    },
    {
      "label": "detailChalice",
      "top": 4480
    },
    {
      "label": "sign",
      "top": 4704
    },
    {
      "label": "chimney_detailed",
      "top": 4928
    },
    {
      "label": "jewel",
      "top": 5152
    },
    {
      "label": "urn",
      "top": 5376
    },
    {
      "label": "arrows",
      "top": 5600
    },
    {
      "label": "tent_detailedClosed",
      "top": 5824
    },
    {
      "label": "arrow",
      "top": 6048
    },
    {
      "label": "crateItem",
      "top": 6272
    },
    {
      "label": "spikes",
      "top": 6496
    },
    {
      "label": "tent_detailedOpen",
      "top": 6720
    },
    {
      "label": "campfire_stones",
      "top": 6944
    },
    {
      "label": "coinBronze",
      "top": 7168
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_ItemGrave = {
  "src": "./img/asset_opti/ItemGrave.png",
  "group": "ItemGrave",
  "images": [
    {
      "label": "gravestoneDecorative",
      "top": 0
    },
    {
      "label": "coffinOld",
      "top": 224
    },
    {
      "label": "gravestoneRound",
      "top": 448
    },
    {
      "label": "altarStone",
      "top": 672
    },
    {
      "label": "gravestoneBevel",
      "top": 896
    },
    {
      "label": "crypt",
      "top": 1120
    },
    {
      "label": "gravestoneFlat",
      "top": 1344
    },
    {
      "label": "gravestoneRoof",
      "top": 1568
    },
    {
      "label": "gravestoneFlatOpen",
      "top": 1792
    },
    {
      "label": "gravestoneWide",
      "top": 2016
    },
    {
      "label": "coffin",
      "top": 2240
    },
    {
      "label": "altarWood",
      "top": 2464
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_Train = {
  "src": "./img/asset_opti/Train.png",
  "group": "Train",
  "images": [
    {
      "label": "monorail_trainFront",
      "top": 0
    },
    {
      "label": "monorail_trainEnd",
      "top": 224
    },
    {
      "label": "monorail_trackSlope",
      "top": 448
    },
    {
      "label": "pipe_entrance",
      "top": 672
    },
    {
      "label": "monorail_trainBox",
      "top": 896
    },
    {
      "label": "pipe_supportHigh",
      "top": 1120
    },
    {
      "label": "pipe_split",
      "top": 1344
    },
    {
      "label": "monorail_trainFlat",
      "top": 1568
    },
    {
      "label": "monorail_trainCargo",
      "top": 1792
    },
    {
      "label": "monorail_trackSupport",
      "top": 2016
    },
    {
      "label": "monorail_trackStraight",
      "top": 2240
    },
    {
      "label": "pipe_end",
      "top": 2464
    },
    {
      "label": "monorail_trackSupportCorner",
      "top": 2688
    },
    {
      "label": "pipe_cornerDiagonal",
      "top": 2912
    },
    {
      "label": "pipe_straight",
      "top": 3136
    },
    {
      "label": "pipe_ringHighEnd",
      "top": 3360
    },
    {
      "label": "pipe_cross",
      "top": 3584
    },
    {
      "label": "pipe_rampLarge",
      "top": 3808
    },
    {
      "label": "pipe_ringHigh",
      "top": 4032
    },
    {
      "label": "pipe_ring",
      "top": 4256
    },
    {
      "label": "pipe_corner",
      "top": 4480
    },
    {
      "label": "monorail_trackCornerSmall",
      "top": 4704
    },
    {
      "label": "monorail_trainPassenger",
      "top": 4928
    },
    {
      "label": "pipe_cornerRound",
      "top": 5152
    },
    {
      "label": "pipe_supportLow",
      "top": 5376
    },
    {
      "label": "pipe_open",
      "top": 5600
    },
    {
      "label": "pipe_ringSupport",
      "top": 5824
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_UserAstro = {
  "src": "./img/asset_opti/UserAstro.png",
  "group": "UserAstro",
  "images": [],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_Town1 = {
  "src": "./img/asset_opti/Town1.png",
  "group": "Town1",
  "images": [
    {
      "label": "wallCurved",
      "top": 0
    },
    {
      "label": "roofCornerRound",
      "top": 224
    },
    {
      "label": "wallDoor",
      "top": 448
    },
    {
      "label": "wallDoorwaySquareWideCurved",
      "top": 672
    },
    {
      "label": "wallRounded",
      "top": 896
    },
    {
      "label": "wallSlope",
      "top": 1120
    },
    {
      "label": "wallSide",
      "top": 1344
    },
    {
      "label": "wallArchTop",
      "top": 1568
    },
    {
      "label": "wallCornerDetail",
      "top": 1792
    },
    {
      "label": "wallWindowSmall",
      "top": 2016
    },
    {
      "label": "wallDetailCross",
      "top": 2240
    },
    {
      "label": "wallWindowRound",
      "top": 2464
    },
    {
      "label": "wallArchTopDetail",
      "top": 2688
    },
    {
      "label": "wallWindowStone",
      "top": 2912
    },
    {
      "label": "wallCornerDiagonalHalf",
      "top": 3136
    },
    {
      "label": "roofPoint",
      "top": 3360
    },
    {
      "label": "roofCorner",
      "top": 3584
    },
    {
      "label": "roofRight",
      "top": 3808
    },
    {
      "label": "wallDetailDiagonal",
      "top": 4032
    },
    {
      "label": "roofWindow",
      "top": 4256
    },
    {
      "label": "roofGableTop",
      "top": 4480
    },
    {
      "label": "wallDoorwayRound",
      "top": 4704
    },
    {
      "label": "wallCornerDiagonal",
      "top": 4928
    },
    {
      "label": "wallBlockHalf",
      "top": 5152
    },
    {
      "label": "roofGableDetail",
      "top": 5376
    },
    {
      "label": "wallArch",
      "top": 5600
    },
    {
      "label": "wallCornerEdge",
      "top": 5824
    },
    {
      "label": "roofGableEnd",
      "top": 6048
    },
    {
      "label": "wallDetailHorizontal",
      "top": 6272
    },
    {
      "label": "wallDiagonal",
      "top": 6496
    },
    {
      "label": "roofGable",
      "top": 6720
    },
    {
      "label": "wallDoorwayBase",
      "top": 6944
    },
    {
      "label": "roofFlat",
      "top": 7168
    },
    {
      "label": "wallDoorwaySquareWide",
      "top": 7392
    },
    {
      "label": "roof",
      "top": 7616
    },
    {
      "label": "wallBlock",
      "top": 7840
    },
    {
      "label": "roofCornerInner",
      "top": 8064
    },
    {
      "label": "wallHalf",
      "top": 8288
    },
    {
      "label": "wall",
      "top": 8512
    },
    {
      "label": "wallDoorwaySquare",
      "top": 8736
    },
    {
      "label": "wallBroken",
      "top": 8960
    },
    {
      "label": "wallWindowShutters",
      "top": 9184
    },
    {
      "label": "wallCorner",
      "top": 9408
    },
    {
      "label": "roofLeft",
      "top": 9632
    },
    {
      "label": "wallWindowGlass",
      "top": 9856
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_NatureTree = {
  "src": "./img/asset_opti/NatureTree.png",
  "group": "NatureTree",
  "scall": true,
  "images": [
    {
      "label": "tree_detailed",
      "top": 0
    },
    {
      "label": "tree_thin_fall",
      "top": 224
    },
    {
      "label": "tree_palmShort",
      "top": 448
    },
    {
      "label": "tree_small",
      "top": 672
    },
    {
      "label": "tree_pineDefaultA",
      "top": 896
    },
    {
      "label": "tree_thin_dark",
      "top": 1120
    },
    {
      "label": "cactus_tall",
      "top": 1344
    },
    {
      "label": "tree_pineRoundE",
      "top": 1568
    },
    {
      "label": "tree_cone",
      "top": 1792
    },
    {
      "label": "tree_tall_dark",
      "top": 2016
    },
    {
      "label": "tree_blocks_fall",
      "top": 2240
    },
    {
      "label": "tree_cone_fall",
      "top": 2464
    },
    {
      "label": "tree_default_fall",
      "top": 2688
    },
    {
      "label": "tree_pineTallC",
      "top": 2912
    },
    {
      "label": "tree_pineRoundA",
      "top": 3136
    },
    {
      "label": "tree_simple_dark",
      "top": 3360
    },
    {
      "label": "tree_pineRoundC",
      "top": 3584
    },
    {
      "label": "tree_simple_fall",
      "top": 3808
    },
    {
      "label": "tree_pineTallA",
      "top": 4032
    },
    {
      "label": "tree_default",
      "top": 4256
    },
    {
      "label": "tree_simple",
      "top": 4480
    },
    {
      "label": "tree_default_dark",
      "top": 4704
    },
    {
      "label": "tree_cone_dark",
      "top": 4928
    },
    {
      "label": "tree_tall_fall",
      "top": 5152
    },
    {
      "label": "tree_pineSmallA",
      "top": 5376
    },
    {
      "label": "tree_blocks_dark",
      "top": 5600
    },
    {
      "label": "tree_palmTall",
      "top": 5824
    },
    {
      "label": "tree_thin",
      "top": 6048
    },
    {
      "label": "tree_pineSmallD",
      "top": 6272
    },
    {
      "label": "tree_fat",
      "top": 6496
    },
    {
      "label": "tree_fat_darkh",
      "top": 6720
    },
    {
      "label": "tree_oak_fall",
      "top": 6944
    },
    {
      "label": "tree_pineTallD",
      "top": 7168
    },
    {
      "label": "tree_plateau_fall",
      "top": 7392
    },
    {
      "label": "tree_detailed_dark",
      "top": 7616
    },
    {
      "label": "tree_palmBend",
      "top": 7840
    },
    {
      "label": "tree_pineRoundD",
      "top": 8064
    },
    {
      "label": "tree_detailed_fall",
      "top": 8288
    },
    {
      "label": "tree_oak_dark",
      "top": 8512
    },
    {
      "label": "tree_plateau_dark",
      "top": 8736
    },
    {
      "label": "tree_palmDetailedShort",
      "top": 8960
    },
    {
      "label": "cactus_short",
      "top": 9184
    },
    {
      "label": "tree_small_fall",
      "top": 9408
    },
    {
      "label": "tree_pineTallB",
      "top": 9632
    },
    {
      "label": "tree_palmDetailedTall",
      "top": 9856
    },
    {
      "label": "tree_fat_fall",
      "top": 10080
    },
    {
      "label": "tree_pineSmallB",
      "top": 10304
    },
    {
      "label": "tree_blocks",
      "top": 10528
    },
    {
      "label": "tree_palm",
      "top": 10752
    },
    {
      "label": "tree_oak",
      "top": 10976
    },
    {
      "label": "tree_pineGroundA",
      "top": 11200
    },
    {
      "label": "tree_tall",
      "top": 11424
    },
    {
      "label": "tree_small_dark",
      "top": 11648
    },
    {
      "label": "tree_pineRoundB",
      "top": 11872
    },
    {
      "label": "tree_plateau",
      "top": 12096
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_AstroBase2 = {
  "src": "./img/asset_opti/AstroBase2.png",
  "group": "AstroBase2",
  "images": [
    /*
    corridor_cross
    corridor_split
    corridor_cornerRound
    corridor_corner
    
    corridor_window
    corridor_detailed
    corridor_
    */
    {
      "label": "Lab2_corridor_cross",
      "top": 0
    },
    {
      "label": "Lab2_corridor_split",
      "top": 224
    },
    {
      "label": "Lab2_corridor_cornerRound",
      "top": 448
    },
    {
      "label": "Lab2_corridor_corner",
      "top": 672
    },
    {
      "label": "Lab2_corridor_window",
      "top": 896
    },
    {
      "label": "Lab2_corridor_detailed",
      "top": 1120
    },
    {
      "label": "Lab2_corridor_",
      "top": 1344
    },
    {
      "label": "Lab2_corridor_end",
      "top": 1568
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_AstroBase3 = {
  "src": "./img/asset_opti/AstroBase3.png",
  "group": "AstroBase3",
  "images": [
    /*
    corridor_cross
    corridor_split
    corridor_cornerRound
    corridor_corner
    
    corridor_window
    corridor_detailed
    corridor_
    */
    {
      "label": "Lab3_corridor_cross",
      "top": 0
    },
    {
      "label": "Lab3_corridor_split",
      "top": 224
    },
    {
      "label": "Lab3_corridor_cornerRound",
      "top": 448
    },
    {
      "label": "Lab3_corridor_corner",
      "top": 672
    },
    {
      "label": "Lab3_corridor_window",
      "top": 896
    },
    {
      "label": "Lab3_corridor_detailed",
      "top": 1120
    },
    {
      "label": "Lab3_corridor_",
      "top": 1344
    },
    {
      "label": "Lab3_corridor_end",
      "top": 1568
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_AstroBase4 = {
  "src": "./img/asset_opti/AstroBase4.png",
  "group": "AstroBase4",
  "images": [
    {
      "label": "Lab4_corridor_cross",
      "top": 0
    },
    {
      "label": "Lab4_corridor_split",
      "top": 224
    },
    {
      "label": "Lab4_corridor_cornerRound",
      "top": 448
    },
    {
      "label": "Lab4_corridor_corner",
      "top": 672
    },
    {
      "label": "Lab4_corridor_window",
      "top": 896
    },
    {
      "label": "Lab4_corridor_detailed",
      "top": 1120
    },
    {
      "label": "Lab4_corridor_",
      "top": 1344
    },
    {
      "label": "Lab4_corridor_end",
      "top": 1568
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var asset_AstroBase5 = {
  "src": "./img/asset_opti/AstroBase5.png",
  "group": "AstroBase5",
  "images": [
    {
      "label": "Lab5_corridor_cross",
      "top": 0
    },
    {
      "label": "Lab5_corridor_split",
      "top": 224
    },
    {
      "label": "Lab5_corridor_cornerRound",
      "top": 448
    },
    {
      "label": "Lab5_corridor_corner",
      "top": 672
    },
    {
      "label": "Lab5_corridor_window",
      "top": 896
    },
    {
      "label": "Lab5_corridor_detailed",
      "top": 1120
    },
    {
      "label": "Lab5_corridor_",
      "top": 1344
    },
    {
      "label": "Lab5_corridor_end",
      "top": 1568
    }
  ],
  "imgHeight": 224,
  "imgWidth": 192
};
var assetOptiConfig = [
  asset_ItemTech,
  asset_AstroBase,
  asset_AstroBase2,
  asset_AstroBase3,
  asset_AstroBase4,
  asset_AstroBase5,
  asset_Wall,
  asset_ItemPilar,
  asset_NatureRock,
  asset_AstroRocket,
  asset_Town2,
  asset_NatureFlower,
  asset_AstroPlatform,
  asset_MyTower,
  asset_ItemOther,
  asset_ItemGrave,
  asset_Train,
  asset_UserAstro,
  asset_Town1,
  asset_NatureTree,
  // ----------- 8 axes
  {
    "src": "./img/asset_opti/UserAstro.png",
    "group": "UserAstro",
    "images": [
      {
        "label": "astronautA-1",
        "8axes": true,
        "top": 0
      },
      {
        "label": "astronautA-3",
        "8axes": true,
        "top": 224
      },
      {
        "label": "astronautA-2",
        "8axes": true,
        "top": 448
      }
    ],
    "imgHeight": 224,
    "imgWidth": 192
  },
  {
    "src": "./img/asset_opti/MyPerso2.png",
    "group": "MyPerso2",
    "images": [
      {
        "label": "astronautB",
        "8axes": true,
        "top": 0
      },
      {
        "label": "digger",
        "8axes": true,
        "top": 224
      },
      {
        "label": "vampire",
        "8axes": true,
        "top": 448
      },
      {
        "label": "zombie",
        "8axes": true,
        "top": 672
      },
      {
        "label": "astronautA",
        "8axes": true,
        "top": 896
      },
      {
        "label": "ghost",
        "8axes": true,
        "top": 1120
      },
      {
        "label": "skeleton",
        "8axes": true,
        "top": 1344
      },
      {
        "label": "alien",
        "8axes": true,
        "top": 1568
      }
    ],
    "imgHeight": 224,
    "imgWidth": 192
  }
];

// IsoGame/mapIso/asset/assetUtils.ts
function createCanvas(width, height) {
  return new OffscreenCanvas(width, height);
}
var RANGE_HEIGHT = [...Array(8)].map((_, x) => x * 0.5);
var RANGE_HUE = [...Array(36)].map((_, x) => x * 10);
var RANGE_SATURATION = [...Array(50)].map((_, x) => x * 5 + 5);
var RANGE_BRIGHTNESS = [...Array(50)].map((_, x) => x * 5 + 5);
var RANGE_CONTRAST = [...Array(50)].map((_, x) => x * 5 + 5);
var CANVAS_FILTER_DEFAULT_IDX = {
  hue: 0,
  saturation: 19,
  brightness: 100,
  contrast: 100
};
var canvasFilterStrToValue = (str) => {
  const conf = { ...CANVAS_FILTER_DEFAULT_IDX };
  const tokens = str.split("_");
  tokens.forEach((token) => {
    const key = token[0] == "H" ? "hue" : token[0] == "C" ? "contrast" : token[0] == "S" ? "saturation" : token[0] == "B" ? "brightness" : null;
    const value = new Number(token.substring(1)).valueOf();
    if (key && value !== void 0) {
      conf[key] = value;
    }
  });
  return conf;
};
var colorVariation = (source, cFilter) => {
  if (!source)
    return null;
  const hue = cFilter.hue ? cFilter.hue : 0;
  const saturation = cFilter.saturation ? cFilter.saturation : 100;
  const contrast = cFilter.contrast ? cFilter.contrast : 100;
  const brightness = cFilter.brightness ? cFilter.brightness : 100;
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx)
    return null;
  let imageData = ctx.getImageData(0, 0, source.width, source.height);
  if (hue || saturation != 100 || contrast != 100 || brightness != 100) {
    if (hue) {
      imageData = __applyHueRotation(imageData, hue);
    }
    if (saturation) {
      imageData = __applySaturationAdjustment(imageData, saturation / 100);
    }
    if (brightness != 100) {
      imageData = __applyContrast(imageData, brightness / 100);
    }
    if (contrast != 100) {
      imageData = __applyBrightness(imageData, contrast / 100);
    }
    const canvasN = createCanvas(source.width, source.height);
    const ctx2 = canvasN.getContext("2d");
    if (!ctx2)
      return null;
    ctx2.putImageData(imageData, 0, 0);
    return canvasN;
  }
  return null;
};
function __applyHueRotation(imageData, hueAngle) {
  const pixels = imageData.data;
  const h = hueAngle / 360;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const [hPrime, s, l] = rgbToHsl2(r, g, b);
    const newHue = (hPrime + h) % 1;
    const [newR, newG, newB] = hslToRgb2(newHue, s, l);
    pixels[i] = newR;
    pixels[i + 1] = newG;
    pixels[i + 2] = newB;
  }
  return imageData;
}
function __applySaturationAdjustment(imageData, saturationFactor) {
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const [h, s, l] = rgbToHsl2(r, g, b);
    const newS = s * saturationFactor;
    const [newR, newG, newB] = hslToRgb2(h, newS, l);
    pixels[i] = newR;
    pixels[i + 1] = newG;
    pixels[i + 2] = newB;
  }
  return imageData;
}
function __applyBrightness(imageData, brightnessFactor) {
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = pixels[i] * brightnessFactor + (1 - brightnessFactor) * 255;
    pixels[i + 1] = pixels[i + 1] * brightnessFactor + (1 - brightnessFactor) * 255;
    pixels[i + 2] = pixels[i + 2] * brightnessFactor + (1 - brightnessFactor) * 255;
  }
  return imageData;
}
function __applyContrast(imageData, contrastFactor) {
  const pixels = imageData.data;
  const mid = 0.5;
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = mid + contrastFactor * (pixels[i] - mid);
    pixels[i + 1] = mid + contrastFactor * (pixels[i + 1] - mid);
    pixels[i + 2] = mid + contrastFactor * (pixels[i + 2] - mid);
  }
  return imageData;
}
function rgbToHsl2(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = (max + min) / 2;
  let s = (max + min) / 2;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb2(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p2, q2, t) => {
      if (t < 0)
        t += 1;
      if (t > 1)
        t -= 1;
      if (t < 1 / 6)
        return p2 + (q2 - p2) * 6 * t;
      if (t < 1 / 2)
        return q2;
      if (t < 2 / 3)
        return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      return p2;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// IsoGame/mapIso/asset/assetLoaderOpti.ts
var SCALE_SIZE = 1;
var AssetLoaderOpti = class _AssetLoaderOpti {
  assetList;
  assetTree = {};
  countLoad = 0;
  constructor() {
    this.assetList = assetOptiConfig;
  }
  // Static method to create an instance and handle async loading
  static async create(assetList) {
    const loader = new _AssetLoaderOpti();
    await loader.loadAssetFiles(assetList || assetOptiConfig);
    console.log("assetTree", loader.assetTree);
    return loader;
  }
  async loadAssetFiles(assetList) {
    const assList = assetList ? assetList : this.assetList;
    async function loadImage(url) {
      const response = await fetch(url);
      return createImageBitmap(await response.blob());
    }
    const promises = assList.map(
      async (assetInfo) => {
        this.countLoad++;
        try {
          const image = await loadImage("../../" + assetInfo.src);
          this.loadAssetImage(assetInfo, image);
        } catch (e) {
          console.error(e);
        }
        return;
      }
    );
    await Promise.all(promises);
  }
  // Function to create a canvas and draw an image on it
  createCanvasContext(image) {
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    if (ctx == null)
      return;
    const drawableImage = image;
    ctx.drawImage(drawableImage, 0, 0);
    return ctx;
  }
  loadAssetImage(assetInfo, sourceImg) {
    const wCutSize = 256 - 64;
    const hCutSize = 256 - 32;
    const scall = assetInfo.scall ? 0.7 : 1;
    assetInfo.images.map((info, idx) => {
      const __cutImage = (wId, hId) => {
        const destCanvas = new OffscreenCanvas(
          256 * SCALE_SIZE,
          256 * SCALE_SIZE
        );
        const ctx = destCanvas.getContext("2d", { willReadFrequently: true });
        if (ctx == null)
          return destCanvas;
        ctx.drawImage(
          sourceImg,
          wCutSize * wId + Math.floor(wCutSize * ((1 - scall) / 2)),
          hCutSize * hId + Math.floor(hCutSize * (1 - scall)),
          Math.floor(wCutSize * scall),
          hCutSize + 128,
          32 * SCALE_SIZE,
          0 + (assetInfo.scall ? 32 : 0),
          wCutSize * SCALE_SIZE,
          Math.floor(hCutSize / scall) * SCALE_SIZE + 128
        );
        return destCanvas;
      };
      this.assetTree[info.label + "_NE"] = {
        "group": assetInfo.group,
        "label": info.label + "_NE",
        "cimage": __cutImage(0, idx)
      };
      this.assetTree[info.label + "_NW"] = {
        "group": assetInfo.group,
        "label": info.label + "_NW",
        "cimage": __cutImage(1, idx)
      };
      this.assetTree[info.label + "_SW"] = {
        "group": assetInfo.group,
        "label": info.label + "_SW",
        "cimage": __cutImage(2, idx)
      };
      this.assetTree[info.label + "_SE"] = {
        "group": assetInfo.group,
        "label": info.label + "_SE",
        "cimage": __cutImage(3, idx)
      };
      if (info["8axes"]) {
        this.assetTree[info.label + "_N"] = {
          "group": assetInfo.group,
          "label": info.label + "_N",
          "cimage": __cutImage(4, idx)
        };
        this.assetTree[info.label + "_W"] = {
          "group": assetInfo.group,
          "label": info.label + "_W",
          "cimage": __cutImage(5, idx)
        };
        this.assetTree[info.label + "_S"] = {
          "group": assetInfo.group,
          "label": info.label + "_S",
          "cimage": __cutImage(6, idx)
        };
        this.assetTree[info.label + "_E"] = {
          "group": assetInfo.group,
          "label": info.label + "_E",
          "cimage": __cutImage(7, idx)
        };
      }
    });
  }
  getAsset(key) {
    if (this.assetTree[key]) {
      return this.assetTree[key].cimage;
    } else {
      const [keyParent, canvasFilter] = key.split("#");
      if (this.assetTree[keyParent]) {
        const parentCimage = this.assetTree[keyParent].cimage;
        const canvasFilterConf = canvasFilterStrToValue(
          canvasFilter
        );
        const newCimage = colorVariation(
          parentCimage,
          canvasFilterConf
        );
        if (newCimage) {
          this.assetTree[key] = {
            ...this.assetTree[keyParent],
            cimage: newCimage
          };
          return this.assetTree[key].cimage;
        }
      }
    }
  }
};

// IsoGame/mapIso/iso/color.ts
var Color = class _Color {
  r;
  g;
  b;
  a;
  h = 0;
  s = 0;
  l = 0;
  constructor(r = 0, g = 0, b = 0, a = 1) {
    this.r = Math.round(r);
    this.g = Math.round(g);
    this.b = Math.round(b);
    this.a = Math.round(a * 100) / 100;
    this.loadHSL();
  }
  toHex() {
    const hex = (this.r * 256 * 256 + this.g * 256 + this.b).toString(16).padStart(6, "0");
    return `#${hex}`;
  }
  lighten(percentage, lightColor = new _Color(255, 255, 255)) {
    const newColor = new _Color(
      lightColor.r / 255 * this.r,
      lightColor.g / 255 * this.g,
      lightColor.b / 255 * this.b,
      this.a
    );
    newColor.l = Math.min(newColor.l + percentage, 1);
    newColor.loadRGB();
    return newColor;
  }
  loadHSL() {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    this.l = (max + min) / 2;
    if (max === min) {
      this.h = this.s = 0;
    } else {
      const d = max - min;
      this.s = this.l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          this.h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          this.h = (b - r) / d + 2;
          break;
        case b:
          this.h = (r - g) / d + 4;
          break;
      }
      this.h /= 6;
    }
  }
  loadRGB() {
    let r, g, b;
    if (this.s === 0) {
      r = g = b = this.l;
    } else {
      const q = this.l < 0.5 ? this.l * (1 + this.s) : this.l + this.s - this.l * this.s;
      const p = 2 * this.l - q;
      r = this._hue2rgb(p, q, this.h + 1 / 3);
      g = this._hue2rgb(p, q, this.h);
      b = this._hue2rgb(p, q, this.h - 1 / 3);
    }
    this.r = Math.round(r * 255);
    this.g = Math.round(g * 255);
    this.b = Math.round(b * 255);
  }
  _hue2rgb(p, q, t) {
    if (t < 0)
      t += 1;
    if (t > 1)
      t -= 1;
    if (t < 1 / 6)
      return p + (q - p) * 6 * t;
    if (t < 1 / 2)
      return q;
    if (t < 2 / 3)
      return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
};

// IsoGame/mapIso/iso/point.ts
var Point = class _Point {
  x;
  y;
  z;
  static ORIGIN = new _Point(0, 0, 0);
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  /** Translate a point from a given dx, dy, and dz */
  translate(dx = 0, dy = 0, dz = 0) {
    return new _Point(this.x + dx, this.y + dy, this.z + dz);
  }
  /** Scale a point about a given origin */
  scale(origin, dx, dy, dz) {
    const p = this.translate(-origin.x, -origin.y, -origin.z);
    if (dy === void 0 || dz === void 0) {
      dy = dz = dx;
    } else {
      dz = dz ?? 1;
    }
    p.x *= dx;
    p.y *= dy;
    p.z *= dz;
    return p.translate(origin.x, origin.y, origin.z);
  }
  /** Rotate about origin on the X axis */
  rotateX(origin, angle) {
    const p = this.translate(-origin.x, -origin.y, -origin.z);
    const z = p.z * Math.cos(angle) - p.y * Math.sin(angle);
    const y = p.z * Math.sin(angle) + p.y * Math.cos(angle);
    return new _Point(p.x, y, z).translate(origin.x, origin.y, origin.z);
  }
  /** Rotate about origin on the Y axis */
  rotateY(origin, angle) {
    const p = this.translate(-origin.x, -origin.y, -origin.z);
    const x = p.x * Math.cos(angle) - p.z * Math.sin(angle);
    const z = p.x * Math.sin(angle) + p.z * Math.cos(angle);
    return new _Point(x, p.y, z).translate(origin.x, origin.y, origin.z);
  }
  /** Rotate about origin on the Z axis */
  rotateZ(origin, angle) {
    const p = this.translate(-origin.x, -origin.y, -origin.z);
    const x = p.x * Math.cos(angle) - p.y * Math.sin(angle);
    const y = p.x * Math.sin(angle) + p.y * Math.cos(angle);
    return new _Point(x, y, p.z).translate(origin.x, origin.y, origin.z);
  }
  /** The depth of a point in the isometric plane */
  depth() {
    return this.x + this.y - 2 * this.z;
  }
  /** Distance between two points */
  static distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
};

// IsoGame/mapIso/iso/path.ts
var Path = class _Path {
  points;
  constructor(points = []) {
    if (Array.isArray(points)) {
      this.points = points;
    } else {
      this.points = Array.from(arguments);
    }
  }
  /** Pushes a point onto the end of the path */
  push(point) {
    this.points.push(point);
  }
  /** Returns a new path with the points in reverse order */
  reverse() {
    return new _Path([...this.points].reverse());
  }
  /** Translates a given path */
  translate(x, y, z) {
    return new _Path(this.points.map((point) => point.translate(x, y, z)));
  }
  /** Rotates along the X axis */
  rotateX(origin, angle) {
    return new _Path(this.points.map((point) => point.rotateX(origin, angle)));
  }
  /** Rotates along the Y axis */
  rotateY(origin, angle) {
    return new _Path(this.points.map((point) => point.rotateY(origin, angle)));
  }
  /** Rotates along the Z axis */
  rotateZ(origin, angle) {
    return new _Path(this.points.map((point) => point.rotateZ(origin, angle)));
  }
  /** Scales the path about a given origin */
  scale(origin, factor) {
    return new _Path(this.points.map((point) => point.scale(origin, factor)));
  }
  /** The estimated depth of a path as defined by the average depth of its points */
  depth() {
    return this.points.reduce((sum, point) => sum + point.depth(), 0) / (this.points.length || 1);
  }
  /** A rectangle with the bottom-left corner in the origin */
  static Rectangle(origin, width = 1, height = 1) {
    return new _Path([
      origin,
      new Point(origin.x + width, origin.y, origin.z),
      new Point(origin.x + width, origin.y + height, origin.z),
      new Point(origin.x, origin.y + height, origin.z)
    ]);
  }
  /** A circle centered at origin with a given radius and number of vertices */
  static Circle(origin, radius, vertices = 20) {
    const path = new _Path();
    for (let i = 0; i < vertices; i++) {
      path.push(
        new Point(
          radius * Math.cos(i * 2 * Math.PI / vertices),
          radius * Math.sin(i * 2 * Math.PI / vertices),
          0
        )
      );
    }
    return path.translate(origin.x, origin.y, origin.z);
  }
  /** A star centered at origin with a given outer radius, inner radius, and number of points */
  static Star(origin, outerRadius, innerRadius, points) {
    const path = new _Path();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      path.push(
        new Point(
          r * Math.cos(i * Math.PI / points),
          r * Math.sin(i * Math.PI / points),
          0
        )
      );
    }
    return path.translate(origin.x, origin.y, origin.z);
  }
};

// IsoGame/mapIso/iso/shape.ts
var Shape = class _Shape {
  paths;
  constructor(paths) {
    if (Array.isArray(paths)) {
      this.paths = paths;
    } else {
      this.paths = Array.prototype.slice.call(arguments);
    }
  }
  /**
   * Pushes a path onto the end of the Shape.
   */
  push(path) {
    this.paths.push(path);
  }
  /**
   * Translates a given shape.
   */
  translate(...args) {
    return new _Shape(this.paths.map((path) => path.translate(...args)));
  }
  /**
   * Rotates a given shape along the X axis around a given origin.
   */
  rotateX(...args) {
    return new _Shape(this.paths.map((path) => path.rotateX(...args)));
  }
  /**
   * Rotates a given shape along the Y axis around a given origin.
   */
  rotateY(...args) {
    return new _Shape(this.paths.map((path) => path.rotateY(...args)));
  }
  /**
   * Rotates a given shape along the Z axis around a given origin.
   */
  rotateZ(...args) {
    return new _Shape(this.paths.map((path) => path.rotateZ(...args)));
  }
  /**
   * Scales a shape about a given origin.
   */
  scale(...args) {
    return new _Shape(this.paths.map((path) => path.scale(...args)));
  }
  /**
   * Orders the paths of the shape by depth.
   */
  orderedPaths() {
    return this.paths.slice().sort((a, b) => b.depth() - a.depth());
  }
  /**
   * Utility function to extrude a 2D path into a 3D shape.
   */
  static extrude(path, height = 1) {
    const topPath = path.translate(0, 0, height);
    const shape = new _Shape([]);
    shape.push(path.reverse());
    shape.push(topPath);
    for (let i = 0; i < path.points.length; i++) {
      shape.push(
        new Path([
          topPath.points[i],
          path.points[i],
          path.points[(i + 1) % path.points.length],
          topPath.points[(i + 1) % topPath.points.length]
        ])
      );
    }
    return shape;
  }
  /**
   * Creates a simple surface in the SE direction.
   */
  static SurfaceSE(origin, dx = 1, dy = 1, dz = 1) {
    const prism = new _Shape([]);
    const face1 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx, origin.y, origin.z + dz),
      new Point(origin.x, origin.y, origin.z + dz)
    ]);
    prism.push(face1);
    return prism;
  }
  /**
   * Creates a simple surface in the SW direction.
   */
  static SurfaceSW(origin, dx = 1, dy = 1, dz = 1) {
    const prism = new _Shape([]);
    const face2 = new Path([
      origin,
      new Point(origin.x, origin.y, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z)
    ]);
    prism.push(face2);
    return prism;
  }
  /**
   * Creates a flat surface parallel to the XY plane.
   */
  static SurfaceFlat(origin, dx = 1, dy = 1, dz = 1) {
    const prism = new _Shape([]);
    const face3 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx, origin.y + dy, origin.z),
      new Point(origin.x, origin.y + dy, origin.z)
    ]);
    prism.push(face3.translate(0, 0, dz));
    return prism;
  }
  /**
   * Creates a full rectangular prism.
   */
  static Prism(origin, dx = 1, dy = 1, dz = 1) {
    const prism = new _Shape([]);
    const face1 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx, origin.y, origin.z + dz),
      new Point(origin.x, origin.y, origin.z + dz)
    ]);
    prism.push(face1);
    prism.push(face1.reverse().translate(0, dy, 0));
    const face2 = new Path([
      origin,
      new Point(origin.x, origin.y, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z)
    ]);
    prism.push(face2);
    prism.push(face2.reverse().translate(dx, 0, 0));
    const face3 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx, origin.y + dy, origin.z),
      new Point(origin.x, origin.y + dy, origin.z)
    ]);
    prism.push(face3.reverse());
    prism.push(face3.translate(0, 0, dz));
    return prism;
  }
  /**
   * Creates a pyramid shape.
   */
  static Pyramid(origin, dx = 1, dy = 1, dz = 1) {
    const pyramid = new _Shape([]);
    const face1 = new Path([
      origin,
      new Point(origin.x + dx, origin.y, origin.z),
      new Point(origin.x + dx / 2, origin.y + dy / 2, origin.z + dz)
    ]);
    pyramid.push(face1);
    pyramid.push(face1.rotateZ(origin.translate(dx / 2, dy / 2), Math.PI));
    const face2 = new Path([
      origin,
      new Point(origin.x + dx / 2, origin.y + dy / 2, origin.z + dz),
      new Point(origin.x, origin.y + dy, origin.z)
    ]);
    pyramid.push(face2);
    pyramid.push(face2.rotateZ(origin.translate(dx / 2, dy / 2), Math.PI));
    return pyramid;
  }
  /**
   * Creates a cylinder shape.
   */
  static Cylinder(origin, radius = 1, vertices = 20, height = 1) {
    const circle = Path.Circle(origin, radius, vertices);
    return _Shape.extrude(circle, height);
  }
};

// IsoGame/mapIso/iso/vector.ts
var Vector = class _Vector {
  i;
  j;
  k;
  constructor(i = 0, j = 0, k = 0) {
    this.i = i;
    this.j = j;
    this.k = k;
  }
  /**
   * Creates a vector from two points
   */
  static fromTwoPoints(p1, p2) {
    return new _Vector(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
  }
  /**
   * Computes the cross product of two vectors
   */
  static crossProduct(v1, v2) {
    const i = v1.j * v2.k - v2.j * v1.k;
    const j = -1 * (v1.i * v2.k - v2.i * v1.k);
    const k = v1.i * v2.j - v2.i * v1.j;
    return new _Vector(i, j, k);
  }
  /**
   * Computes the dot product of two vectors
   */
  static dotProduct(v1, v2) {
    return v1.i * v2.i + v1.j * v2.j + v1.k * v2.k;
  }
  /**
   * Returns the magnitude (length) of the vector
   */
  magnitude() {
    return Math.sqrt(this.i ** 2 + this.j ** 2 + this.k ** 2);
  }
  /**
   * Returns a normalized (unit length) vector
   */
  normalize() {
    const magnitude = this.magnitude();
    return magnitude === 0 ? new _Vector(0, 0, 0) : new _Vector(this.i / magnitude, this.j / magnitude, this.k / magnitude);
  }
};

// IsoGame/mapIso/iso/isomer.ts
var ISO_LVL_SCALE = 39;
var Isomer = class {
  canvas;
  canvasCtx;
  SCALE_SIZE;
  SCALE_MOD;
  // private angle: number = 0.44721359; // Math.PI / 6.75
  originX;
  originY = 660;
  // Fixed Y-origin
  lightPosition;
  lightAngle;
  colorDifference = 0.2;
  lightColor;
  transformation;
  offsetX;
  offsetY;
  constructor(canvas, DRAW_TILE_COUNT = 30, SCALE_SIZE2 = 1, SCALE_MOD = 1) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext("2d");
    this.SCALE_SIZE = SCALE_SIZE2;
    this.SCALE_MOD = SCALE_MOD;
    this.originX = this.canvas.width / 2;
    this.originY = this.canvas.height / 2 + DRAW_TILE_COUNT * 16 * this.SCALE_SIZE;
    this.offsetX = 0;
    this.offsetY = 0;
    this.lightPosition = new Vector(2, -1, 3);
    this.lightAngle = this.lightPosition.normalize();
    this.lightColor = new Color(255, 255, 255);
    this.transformation = [
      [32 * this.SCALE_SIZE, 16 * this.SCALE_SIZE],
      // ISOSCALE * Math.cos(this.angle), ISOSCALE * Math.sin(this.angle)
      [-32 * this.SCALE_SIZE, 16 * this.SCALE_SIZE]
      // ISOSCALE * Math.cos(Math.PI - this.angle), ISOSCALE * Math.sin(Math.PI - this.angle)
    ];
  }
  setOffset(x, y) {
    this.offsetX = x;
    this.offsetY = y;
  }
  /**
   * Sets the light position for drawing.
   */
  setLightPosition(x, y, z) {
    this.lightPosition = new Vector(x, y, z);
    this.lightAngle = this.lightPosition.normalize();
  }
  /**
   * Translates a 3D point to a 2D isometric projection.
   */
  translatePoint(_point) {
    const point = _point.translate(-this.offsetX, -this.offsetY, 0);
    const xMap = new Point(
      point.x * this.transformation[0][0],
      point.x * this.transformation[0][1]
    );
    const yMap = new Point(
      point.y * this.transformation[1][0],
      point.y * this.transformation[1][1]
    );
    const x = this.originX + xMap.x + yMap.x;
    const y = this.originY - xMap.y - yMap.y - point.z * ISO_LVL_SCALE / this.SCALE_MOD;
    return new Point(x, y);
  }
  /**
   * Adds a shape or path to the scene
   */
  add(item, baseColor) {
    if (Array.isArray(item)) {
      item.forEach((subItem) => this.add(subItem, baseColor));
    } else if (item instanceof Path) {
      this._addPath(item, baseColor);
    } else if (item instanceof Shape) {
      item.orderedPaths().forEach((path) => this._addPath(path, baseColor));
    }
  }
  /**
     * Adds an image to the scene
     * /
    addImage(imgSrc: string, point: Point): void {
      const image = new Image();
      image.onload = () => {
        console.log("DRAW IMAGE");
        const p = this._translatePoint(new Point(10, 10, 0));
        this.canvas.ctx.drawImage(image, p.x - 105, p.y - 142, 210, 210);
      };
      image.src = imgSrc;
    }
  
    /**
     * Adds a path to the scene
     */
  _addPath(path, baseColor = new Color(120, 120, 120)) {
    const v1 = Vector.fromTwoPoints(path.points[1], path.points[0]);
    const v2 = Vector.fromTwoPoints(path.points[2], path.points[1]);
    const normal = Vector.crossProduct(v1, v2).normalize();
    const brightness = Vector.dotProduct(normal, this.lightAngle);
    const color = baseColor.lighten(
      brightness * this.colorDifference,
      this.lightColor
    );
    this.canvasCtx.beginPath();
    const translatedPoints = path.points.map((p) => this.translatePoint(p));
    translatedPoints.forEach((p, index) => {
      if (index === 0) {
        this.canvasCtx.moveTo(p.x, p.y);
      } else {
        this.canvasCtx.lineTo(p.x, p.y);
      }
    });
    this.canvasCtx.closePath();
    this.canvasCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    this.canvasCtx.fill();
  }
  /**
   * Precomputes transformation values to optimize rendering
   */
  _calculateTransformation() {
    this.transformation = [
      [32, 16],
      // ISOSCALE * Math.cos(this.angle), ISOSCALE * Math.sin(this.angle)
      [-32, 16]
      // ISOSCALE * Math.cos(Math.PI - this.angle), ISOSCALE * Math.sin(Math.PI - this.angle)
    ];
  }
};

// IsoGame/mapIso/simpleIso/IsometricProjector.ts
var ISO_LVL_SCALE2 = 39;
var PointIso = class _PointIso {
  x;
  y;
  z;
  static ORIGIN = new _PointIso(0, 0, 0);
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  /** Translate a point from a given dx, dy, and dz */
  translate(dx = 0, dy = 0, dz = 0) {
    return new _PointIso(this.x + dx, this.y + dy, this.z + dz);
  }
  // NOTE: Other Point methods (scale, rotateX/Y/Z, depth) are omitted for simplicity 
  // as they were not directly used in the projection logic, but can be added back if needed.
  depth() {
    return this.x + this.y - 2 * this.z;
  }
};
var IsometricConfDefaults = {
  SCALE_SIZE: 1,
  // Base scale for 1x1 tile size
  SCALE_MOD: 1,
  // Scale modifier (often unused in projection)
  ISO_LVL_SCALE: 39,
  // Z-axis scale factor (from original isomer.ts)
  originX: 0,
  // X-offset for the map origin
  originY: 660,
  // Fixed Y-offset for the map origin (from original isomer.ts)
  offsetX: 0,
  // Panning offset X
  offsetY: 0
  // Panning offset Y
};
var IsometricProjector = class {
  conf;
  transformation;
  /**
   * Initializes the projector.
   * @param overrides Optional partial configuration to override defaults.
   */
  constructor(overrides = {}) {
    this.conf = { ...IsometricConfDefaults, ...overrides };
    this.updateConf();
  }
  updateConf(overrides = {}) {
    this.conf = { ...this.conf, ...overrides };
    this.transformation = [
      [32 * this.conf.SCALE_SIZE, 16 * this.conf.SCALE_SIZE],
      // ISOSCALE * Math.cos(this.angle), ISOSCALE * Math.sin(this.angle)
      [-32 * this.conf.SCALE_SIZE, 16 * this.conf.SCALE_SIZE]
      // ISOSCALE * Math.cos(Math.PI - this.angle), ISOSCALE * Math.sin(Math.PI - this.angle)
    ];
  }
  /**
   * Projects a 3D Point to 2D screen coordinates.
   * This is the core 3D -> 2D isometric translation function.
   * * @param point The 3D Point object to translate.
   * @returns An object containing the projected screen coordinates { x: number, y: number }.
   */
  /**
   * Translates a 3D point to a 2D isometric projection.
   */
  translatePoint(_point) {
    const point = _point.translate(-this.conf.offsetX, -this.conf.offsetY, 0);
    const xMap = new PointIso(
      point.x * this.transformation[0][0],
      point.x * this.transformation[0][1]
    );
    const yMap = new PointIso(
      point.y * this.transformation[1][0],
      point.y * this.transformation[1][1]
    );
    const x = this.conf.originX + xMap.x + yMap.x;
    const y = this.conf.originY - xMap.y - yMap.y - point.z * ISO_LVL_SCALE2 / this.conf.SCALE_MOD;
    return new PointIso(x, y);
  }
};

// IsoGame/mapIso/simpleIso/IsometricTileGenerator.ts
var IsometricConfDefaults2 = {
  SCALE_SIZE: 1,
  SCALE_MOD: 1,
  ISO_LVL_SCALE: 39,
  originX: 32,
  originY: 32,
  offsetX: 0,
  offsetY: 0
};
var IsometricTileGenerator = class {
  CANVAS_WIDTH = 64;
  conf;
  projector;
  canvas;
  // Default luminance change factors for shading
  SE_SHADE_FACTOR = -0.1;
  // Slightly darker for SE border
  SW_SHADE_FACTOR = -0.25;
  // Darker for SW border (to imply shadow)
  constructor(confOverrides = {}) {
    this.conf = { ...IsometricConfDefaults2, ...confOverrides };
    this.updateConf();
  }
  updateConf(overrides = {}) {
    this.conf = { ...this.conf, ...overrides };
    this.projector = new IsometricProjector(this.conf);
    this.canvas = new OffscreenCanvas(64 * this.conf.SCALE_SIZE, 64 * this.conf.SCALE_SIZE);
  }
  /**
   * Creates an image of a 1x1 isometric tile with optional walls/borders on an OffscreenCanvas.
   * The border colors are automatically shaded from the base color.
   * * @param BASE_COLOR The base Color object for the floor.
   * @param diffLvlSE The height (in Z-units) of the South-East border (Y-axis face).
   * @param diffLvlSW The height (in Z-units) of the South-West border (X-axis face).
   * @returns An OffscreenCanvas containing the tile image.
   */
  createTile(BASE_COLOR, diffLvlSE, diffLvlSW) {
    const floorColor = BASE_COLOR;
    const borderSEColor = BASE_COLOR.lighten(this.SE_SHADE_FACTOR);
    const borderSWColor = BASE_COLOR.lighten(this.SW_SHADE_FACTOR);
    const P0 = new PointIso(0, 0, 0);
    const P1 = new PointIso(1, 0, 0);
    const P2 = new PointIso(1, 1, 0);
    const P3 = new PointIso(0, 1, 0);
    const p0 = this.projector.translatePoint(P0);
    const p1 = this.projector.translatePoint(P1);
    const p2 = this.projector.translatePoint(P2);
    const p3 = this.projector.translatePoint(P3);
    const P0_b_sw = new PointIso(0, 0, -diffLvlSE);
    const P1_b = new PointIso(1, 0, -diffLvlSE);
    const P0_b_se = new PointIso(0, 0, -diffLvlSW);
    const P3_b = new PointIso(0, 1, -diffLvlSW);
    const p0_b_sw = this.projector.translatePoint(P0_b_sw);
    const p1_b = this.projector.translatePoint(P1_b);
    const p0_b_se = this.projector.translatePoint(P0_b_se);
    const p3_b = this.projector.translatePoint(P3_b);
    const allYCoords = [p0.y, p0_b_sw.y, p0_b_se.y];
    const highestYCoord = Math.max(...allYCoords);
    const CANVAS_HEIGHT_ACTUAL = Math.ceil(highestYCoord);
    this.canvas.width = this.CANVAS_WIDTH * this.conf.SCALE_SIZE;
    this.canvas.height = CANVAS_HEIGHT_ACTUAL;
    const ctx = this.canvas.getContext("2d");
    if (!ctx)
      return this.canvas;
    if (diffLvlSE > 0) {
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p1_b.x, p1_b.y);
      ctx.lineTo(p0_b_sw.x, p0_b_sw.y);
      ctx.closePath();
      ctx.fillStyle = borderSWColor.toHex();
      ctx.fill();
    }
    if (diffLvlSW > 0) {
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p3_b.x, p3_b.y);
      ctx.lineTo(p0_b_se.x, p0_b_se.y);
      ctx.closePath();
      ctx.fillStyle = borderSEColor.toHex();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fillStyle = floorColor.toHex();
    ctx.fill();
    return this.canvas;
  }
};

// IsoGame/mapIso/simpleIso/Color.ts
var ColorIso = class _ColorIso {
  r;
  g;
  b;
  a;
  h = 0;
  s = 0;
  l = 0;
  constructor(r = 0, g = 0, b = 0, a = 1) {
    this.r = Math.round(r);
    this.g = Math.round(g);
    this.b = Math.round(b);
    this.a = Math.round(a * 100) / 100;
    this.loadHSL();
  }
  toHex() {
    const hex = (this.r * 256 * 256 + this.g * 256 + this.b).toString(16).padStart(6, "0");
    return `#${hex}`;
  }
  lighten(percentage, lightColor = new _ColorIso(255, 255, 255)) {
    const newColor = new _ColorIso(
      lightColor.r / 255 * this.r,
      lightColor.g / 255 * this.g,
      lightColor.b / 255 * this.b,
      this.a
    );
    newColor.l = Math.min(newColor.l + percentage, 1);
    newColor.loadRGB();
    return newColor;
  }
  loadHSL() {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    this.l = (max + min) / 2;
    if (max === min) {
      this.h = this.s = 0;
    } else {
      const d = max - min;
      this.s = this.l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          this.h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          this.h = (b - r) / d + 2;
          break;
        case b:
          this.h = (r - g) / d + 4;
          break;
      }
      this.h /= 6;
    }
  }
  loadRGB() {
    let r, g, b;
    if (this.s === 0) {
      r = g = b = this.l;
    } else {
      const q = this.l < 0.5 ? this.l * (1 + this.s) : this.l + this.s - this.l * this.s;
      const p = 2 * this.l - q;
      const hueToRgb = (t) => {
        if (t < 0)
          t += 1;
        if (t > 1)
          t -= 1;
        if (t < 1 / 6)
          return p + (q - p) * 6 * t;
        if (t < 1 / 2)
          return q;
        if (t < 2 / 3)
          return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      r = hueToRgb(this.h + 1 / 3);
      g = hueToRgb(this.h);
      b = hueToRgb(this.h - 1 / 3);
    }
    this.r = Math.round(r * 255);
    this.g = Math.round(g * 255);
    this.b = Math.round(b * 255);
  }
};

// IsoGame/mapIso/canvasMapDrawer.ts
function createCanvas2(width, height) {
  return new OffscreenCanvas(width, height);
}
var LVL_Z_SCALE_FACTOR = 1 / 3;
var ASSET_WIDTH = 128;
var ASSET_OFFSET_X = -127 + 64;
var ASSET_OFFSET_Y = -172 + 64 - 1;
var CanvasMapDrawersConfDefault = {
  DRAW_TILE_COUNT: 40,
  SCALE_SIZE: 1,
  SCALE_MOD: 1
};
var CanvasMapDrawers = class {
  world;
  fm;
  conf;
  c;
  tilesMatrix;
  assetLoader;
  canvas;
  canvasCtx;
  // Shared buffers for worker communication
  bufferMapLvl;
  mapLvl;
  bufferMapInfo;
  mapInfo;
  // [ 0:centreX , 1:centreY, 2:offX, 3:offY ]
  isomer;
  isoProject;
  isoGenerator;
  tileCache = /* @__PURE__ */ new Map();
  frameSubCount;
  frameCount;
  constructor(world, width, height, conf, assetLoadder, canvas) {
    this.world = world;
    this.fm = FactoryMap.getInstance();
    this.conf = { ...CanvasMapDrawersConfDefault, ...conf, DRAW_TILE_COUNT: conf.DRAW_TILE_COUNT || CanvasMapDrawersConfDefault.DRAW_TILE_COUNT };
    this.canvas = canvas ? canvas : createCanvas2(width, height);
    this.canvasCtx = this.canvas.getContext("2d");
    const bufferSize = this.conf.DRAW_TILE_COUNT * this.conf.DRAW_TILE_COUNT * Float32Array.BYTES_PER_ELEMENT;
    this.bufferMapLvl = new SharedArrayBuffer(bufferSize);
    this.mapLvl = new Float32Array(this.bufferMapLvl);
    this.bufferMapInfo = new SharedArrayBuffer(
      4 * Float32Array.BYTES_PER_ELEMENT
    );
    this.mapInfo = new Float32Array(this.bufferMapInfo);
    this.isomer = new Isomer(
      this.canvas,
      this.conf.DRAW_TILE_COUNT,
      this.conf.SCALE_SIZE,
      this.conf.SCALE_MOD
    );
    this.isoProject = new IsometricProjector({
      originX: this.canvas.width / 2,
      originY: this.canvas.height / 2 + this.conf.DRAW_TILE_COUNT * 16 * this.conf.SCALE_SIZE,
      SCALE_SIZE: this.conf.SCALE_SIZE,
      SCALE_MOD: this.conf.SCALE_MOD
    });
    this.isoGenerator = new IsometricTileGenerator({
      SCALE_SIZE: this.conf.SCALE_SIZE
    });
    this.c = {
      selected: new Color(160, 60, 50, 1),
      red: new Color(160, 60, 50, 1),
      blue: new Color(80, 100, 240, 0.5),
      flore: new Color(53, 148, 56)
    };
    this.tilesMatrix = new TilesMatrix(
      this.conf.DRAW_TILE_COUNT,
      0,
      0,
      this.conf.SCALE_MOD
    );
    this.assetLoader = assetLoadder;
    this.frameSubCount = 0;
    this.frameCount = 0;
    console.log("=== GameContext- Init");
    console.log("=== GameContext- Init", this.tilesMatrix.rangeX);
  }
  // --------------------------------------
  drawUpdate(centreX, centreY, offx = 0, offy = 0) {
    this.tilesMatrix.setCenter(centreX, centreY);
    this.isomer.SCALE_MOD = Math.max(1, 1 / 8);
    this.isomer.setOffset(offx, offy);
    this.isoProject.updateConf({
      SCALE_MOD: Math.max(1, 1 / 8),
      offsetX: offx,
      offsetY: offy
    });
    this.mapInfo[0] = centreX;
    this.mapInfo[1] = centreY;
    this.mapInfo[2] = offx;
    this.mapInfo[3] = offy;
    this.drawIso();
  }
  getTileImage(tile, diffLvlSE, diffLvlSW) {
    const key = `${tile.x}:${tile.y}`;
    if (this.tileCache.has(key)) {
      return this.tileCache.get(key);
    }
    console.log("tileGen");
    const colorIso = new ColorIso(tile.color[0], tile.color[1], tile.color[2]);
    const canvas = this.isoGenerator.createTile(colorIso, diffLvlSE, diffLvlSW);
    createImageBitmap(canvas).then((optimizedDrawSource) => {
      this.tileCache.set(key, optimizedDrawSource);
    });
    this.tileCache.set(key, canvas);
    return canvas;
  }
  // --- Drawing Helpers (Refactored from drawTileItem) ---
  /** Draws an isometric asset (image/svg) on the tile. */
  drawTileBase(tile, x, y, currentlvl, diffLvlSE, diffLvlSW) {
    const tileImage = this.getTileImage(tile, diffLvlSE, diffLvlSW);
    try {
      const off = { x: 0, y: 0 };
      const lvl = currentlvl + 0 * this.conf.SCALE_SIZE;
      const p = this.isoProject.translatePoint(new PointIso(x + off.x, y + off.y, lvl));
      const scale = this.conf.SCALE_SIZE;
      this.canvasCtx.drawImage(
        tileImage,
        p.x - 32 * scale,
        p.y - 32 * scale,
        tileImage.width * scale,
        tileImage.height * scale
      );
    } catch (e) {
      console.error(`Error drawing baseItem`, e);
    }
  }
  /** Draws an isometric asset (image/svg) on the tile. */
  drawAsset(x, y, itemConf, currentlvl) {
    if (!this.assetLoader) {
      console.warn("AssetLoader not initialized.");
      return;
    }
    try {
      const key = itemConf.key;
      const keySelect = Array.isArray(key) ? key[this.frameCount % key.length] : key;
      const cimage = this.assetLoader.getAsset(keySelect);
      if (cimage) {
        const off = itemConf.off ? itemConf.off : { x: 0, y: 0 };
        const lvl = currentlvl + (itemConf.lvl || 0) * this.conf.SCALE_SIZE;
        const p2 = this.isoProject.translatePoint(new PointIso(x + off.x, y + off.y, lvl));
        const p = this.isomer.translatePoint(
          new Point(x + off.x, y + off.y, lvl)
        );
        const scale = this.conf.SCALE_SIZE;
        this.canvasCtx.drawImage(
          cimage,
          p2.x + ASSET_OFFSET_X * scale,
          p2.y + ASSET_OFFSET_Y * scale,
          ASSET_WIDTH * scale,
          ASSET_WIDTH * scale
        );
      }
    } catch (e) {
      console.error(`Error drawing asset: ${itemConf.key}`, e);
    }
  }
  /** Draws a selected marker prism on the tile. * /
    private drawSelected(x: number, y: number, itemConf: any, currentlvl: number) {
      const height = itemConf.height || .1;
      const lvl = currentlvl + (itemConf.lvl || 0) * this.conf.SCALE_SIZE;
  
      this.isomer.add(
        Shape.Prism(new Point(x, y, lvl), 1, 1, height),
        this.c.selected,
      );
    }
    */
  /**
   * Draws a single item onto a tile using the correct drawing function.
   */
  drawTileItem(x, y, metaTile, itemConf, currentlvl) {
    const type = itemConf.t;
    switch (type) {
      case "Asset":
      case "Svg":
        this.drawAsset(x, y, itemConf, currentlvl);
        break;
      case "Box":
        break;
      default:
        break;
    }
  }
  drawTileOld(xx, yy, currentlvl, color, diffLvlSE, diffLvlSW) {
    const height = 1;
    this.isomer.add(
      Shape.SurfaceFlat(new Point(xx, yy, currentlvl - height), 1, 1, height),
      color
    );
    if (diffLvlSE > 0 && this.conf.SCALE_SIZE > 0.5) {
      this.isomer.add(
        Shape.SurfaceSE(
          new Point(xx, yy, currentlvl - diffLvlSE),
          1,
          1,
          diffLvlSE
        ),
        color
      );
    }
    if (diffLvlSW > 0 && this.conf.SCALE_SIZE > 0.4) {
      this.isomer.add(
        Shape.SurfaceSW(
          new Point(xx, yy, currentlvl - diffLvlSW),
          1,
          1,
          diffLvlSW
        ),
        color
      );
    }
  }
  /**
   * Draws the base tile geometry, including floor and borders.
   */
  drawTile(x, y) {
    const size = this.conf.DRAW_TILE_COUNT;
    const xx = size - x - 1;
    const yy = size - y - 1;
    const metaTile = this.tilesMatrix.tiles[xx][yy];
    const LVL_DISPLAY_SCALE = LVL_Z_SCALE_FACTOR * this.conf.SCALE_SIZE / this.conf.SCALE_MOD;
    const currentlvl = (metaTile.lvl - this.tilesMatrix.avgLvl) * LVL_DISPLAY_SCALE;
    this.mapLvl[xx * size + yy] = currentlvl;
    const height = 1;
    const color = new Color(
      metaTile.color[0],
      metaTile.color[1],
      metaTile.color[2],
      1
      // Alpha
    );
    const lvlYNeighbor = this.tilesMatrix.tiles[xx][yy - 1].lvl;
    const diffLvlSE = (metaTile.lvl - lvlYNeighbor) * LVL_DISPLAY_SCALE;
    const lvlXNeighbor = this.tilesMatrix.tiles[xx - 1][yy].lvl;
    const diffLvlSW = (metaTile.lvl - lvlXNeighbor) * LVL_DISPLAY_SCALE;
    this.drawTileOld(xx, yy, currentlvl, color, diffLvlSE, diffLvlSW);
    const entitiesItems = metaTile.entities.flatMap((x2) => x2.items);
    const items = [
      ...metaTile.items,
      ...metaTile.temporatyItems,
      ...entitiesItems
    ];
    if (metaTile.cityNode) {
      items.push({ t: "Svg", key: metaTile.cityNode.asset.key });
    }
    if (this.conf.DRAW_TILE_COUNT < 60) {
      items.sort((a, b) => (a.lvl || 0) - (b.lvl || 0)).forEach((item) => this.drawTileItem(xx, yy, metaTile, item, currentlvl));
    }
  }
  drawIso() {
    const size = this.conf.DRAW_TILE_COUNT;
    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let x = 1; x < size - 1; x++) {
      for (let y = 1; y < size - 1; y++) {
        this.drawTile(x, y);
      }
    }
    this._cleanCache();
  }
  /**
   * Memory Optimization: Cleans the cache by removing tiles far outside the current view.
   * Uses a margin of 2x the current visible extent.
   */
  _cleanCache() {
    const KEEP_MARGIN_X = this.conf.DRAW_TILE_COUNT;
    const KEEP_MARGIN_Y = this.conf.DRAW_TILE_COUNT;
    const xMin = this.tilesMatrix.x - KEEP_MARGIN_X;
    const xMax = this.tilesMatrix.x + KEEP_MARGIN_X;
    const yMin = this.tilesMatrix.y - KEEP_MARGIN_Y;
    const yMax = this.tilesMatrix.y + KEEP_MARGIN_Y;
    for (const key of this.tileCache.keys()) {
      const parts = key.split(":");
      const x = parseInt(parts[0], 10);
      const y = parseInt(parts[1], 10);
      if (x < xMin || x > xMax || y < yMin || y > yMax) {
        this.tileCache.delete(key);
        console.log("tileDelete");
      }
    }
  }
};

// web/js/worker/messageHandler.ts
var HandelersMap = class extends Map {
  append(handler) {
    handler.forEach(([k, f]) => {
      this.set(k, f);
    });
  }
};
var MessageHandler = class {
  worker;
  pendingResponses = /* @__PURE__ */ new Map();
  handlers = new HandelersMap([]);
  constructor(worker) {
    this.worker = worker;
    this.worker.onmessage = (event) => {
      this.handleIncoming(event.data);
    };
  }
  sendDataSync(payload, data, id = crypto.randomUUID()) {
    const message = { ...payload, id };
    this.worker.postMessage(message, data);
    return id;
  }
  send(payload, id = crypto.randomUUID()) {
    const message = { ...payload, id };
    this.worker.postMessage(message);
    return id;
  }
  sendMessageWithResponse(payload) {
    return new Promise((resolve) => {
      const id = this.send(payload);
      this.pendingResponses.set(id, resolve);
    });
  }
  async handleIncoming(message) {
    const { action, id } = message;
    if (id && this.pendingResponses.has(id)) {
      this.pendingResponses.get(id)?.(message);
      this.pendingResponses.delete(id);
      return;
    }
    const handler = this.handlers.get(action);
    if (handler) {
      const result = await handler(message);
      if (id) {
        this.worker.postMessage({ type: "response", id, result });
      }
    } else {
      console.warn(`[MessageHandler] No handler for type "${action}"`);
    }
  }
  append(handler) {
    handler.forEach(([k, f]) => {
      this.handlers.set(k, f);
    });
  }
};

// web/js/gameWorker.ts
var GameWorker = class {
  world = new World();
  handler;
  x = 0;
  y = 0;
  xf = 0;
  yf = 0;
  assetLoader;
  canvasMap;
  canvasMapDrawer;
  sharedMapLvl;
  /*
  private sharedMapInfo!: Float32Array;
  */
  framId = 0;
  _shouldRun = false;
  constructor() {
    this.handler = new MessageHandler(self);
    self.onmessage = (e) => this.handlers.get(e.data.action)?.(e.data);
  }
  // ============================================================================
  // INIT
  // ============================================================================
  initWorker = async (_data) => {
    console.log("=== InitGameWorker");
    console.log("== Load Asset");
    this.assetLoader = await AssetLoaderOpti.create();
    console.log("== Load Word");
    this.world.init();
    this.handler.send({ action: "callback_initWorker" });
  };
  // ============================================================================
  // SET SHARED
  // ============================================================================
  setCanvasMap = (data) => {
    const canvas = data.canvas;
    this.canvasMap = canvas;
  };
  setMapLvl = (data) => {
    const buffer = data.buffer;
    this.sharedMapLvl = new Float32Array(buffer);
  };
  initCanvasMap = (data) => {
    console.log("=== Init Render Worker");
    this.canvasMapDrawer = new CanvasMapDrawers(
      this.world,
      data.width | 1600,
      data.height | 800,
      data.mapConf || {
        DRAW_TILE_COUNT: 40,
        SCALE_SIZE: 1,
        // 2 / 3,
        SCALE_MOD: 1
      },
      this.assetLoader,
      this.canvasMap
    );
    this.handler.send(
      {
        action: "callback_initCanvasMap",
        mapConf: data.mapConf,
        mapLvlBuffer: this.canvasMapDrawer.bufferMapLvl,
        mapInfoBuffer: this.canvasMapDrawer.bufferMapInfo
      }
    );
  };
  // ============================================================================
  // == MESSAGE
  // ============================================================================
  handlers = /* @__PURE__ */ new Map([
    ["initWorker", this.initWorker.bind(this)],
    ["initCanvasMap", this.initCanvasMap.bind(this)],
    ["setCanvasMap", this.setCanvasMap.bind(this)],
    ["setMapLvl", this.setMapLvl.bind(this)],
    [
      "startRender",
      (_data) => this.startLoop()
    ],
    [
      "stopRender",
      (_data) => this.stopLoop()
    ],
    // ----
    [
      "setCenter",
      (data) => {
        this.x = data.x;
        this.y = data.y;
        this.xf = data.x;
        this.yf = data.y;
      }
    ],
    [
      "updatePlayerMovement",
      (data) => {
        const pm = data.playerMovement;
        const diffX = pm.up ? 1 : pm.down ? -1 : 0;
        const diffY = pm.left ? 1 : pm.right ? -1 : 0;
        const speed = 0.1;
        if (diffX != 0 || diffY != 0) {
          this.xf += diffY != 0 ? diffX * speed * 0.7 : diffX * speed;
          this.yf += diffX != 0 ? diffY * speed * 0.7 : diffY * speed;
          this.x = Math.floor(this.xf);
          this.y = Math.floor(this.yf);
          const tile = FactoryMap.getInstance().getTile(this.x - 1, this.y - 1);
          this.handler.send(
            {
              action: "infoCell",
              data: tile.toJsonInfo()
            }
          );
        }
      }
    ],
    ["gridClick_Building", (data) => {
      const x = this.x + Math.round(
        (data.x | 0) * this.canvasMapDrawer.conf.DRAW_TILE_COUNT / 30
      );
      const y = this.y + Math.round(
        (data.y | 0) * this.canvasMapDrawer.conf.DRAW_TILE_COUNT / 30
      );
      console.log("####################### gridClick ");
      console.log(data);
      const buildingConf1 = new WcBuildConf_GraveA({
        growLoopCount: data.growLoopCount === void 0 ? 20 : data.growLoopCount,
        endLoopMax: data.endLoopMax === void 0 ? 100 : data.endLoopMax
      });
      const building1 = new WcBuildingFactoryGenarator(
        this.world,
        buildingConf1
      );
      building1.start2(x, y);
    }],
    ["gridClick", (data) => {
      const x = data.x;
      const y = data.y;
      console.log("####################### gridClick CITY ");
      console.log(data);
      const city = new City(this.world, x, y);
    }],
    [
      "init_test",
      (data) => {
        TilesActions.getInstance().doActions([{
          func: "lvlFlatSquare",
          x: data.x,
          y: data.y,
          size: 80
        }, {
          func: "clearItemSquare",
          x: data.x,
          y: data.y,
          size: 80
        }]);
      }
    ],
    [
      "query_infoCell",
      (data) => {
        const x = data.x !== void 0 ? data.x : data.gridX !== void 0 ? data.gridX + this.x - 1 : this.x;
        const y = data.y !== void 0 ? data.y : data.gridY !== void 0 ? data.gridY + this.y - 1 : this.y;
        const tile = FactoryMap.getInstance().getTile(x, y);
        this.handler.send(
          {
            action: "infoCell",
            data: tile.toJsonInfo()
          }
        );
      }
    ]
  ]);
  addHandels(key, func) {
    this.handlers.set(key, func);
  }
  // ============================================================================
  // == LOOP
  // ============================================================================
  // ----------------------------------------------------------------------------
  // FPS
  lastFrameTime = performance.now();
  frameTimes = [];
  updateFPS() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameTimes.push(delta);
    if (this.frameTimes.length > 60)
      this.frameTimes.shift();
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = Math.round(1e3 / avgFrameTime);
    this.handler.send({ action: "FPS", fps });
  }
  startLoop() {
    console.log("GameWorker: # START #");
    this._shouldRun = true;
    this.updateFram();
  }
  stopLoop() {
    console.log("GameWorker: # STOP #");
    this._shouldRun = false;
  }
  // 🌟 Read Matrix & Update Grid Efficiently
  updateFram() {
    if (!this._shouldRun) {
      return;
    }
    this.framId = (this.framId + 1) % 1024;
    if (this.framId % 4 == 0) {
      this.updateFPS();
      console.log("Draw");
      this.world.tick();
      this.canvasMapDrawer.drawUpdate(
        this.x,
        this.y,
        this.xf - this.x,
        this.yf - this.y
      );
    }
    requestAnimationFrame(this.updateFram.bind(this));
  }
};
new GameWorker();
export {
  GameWorker
};
