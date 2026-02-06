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
var AXE_DIRECTION = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0]
];
var AXE_DIRECTION2 = [
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
        const [dx, dy] = AXE_DIRECTION[axe];
        return FactoryMap.getInstance().getTile(this.x + dx, this.y + dy);
      });
    }
    return this._nearTiles;
  }
  get nearCrossTiles() {
    if (this._nearTiles.length == 0) {
      this._nearTilesCross = [0, 1, 2, 3].map((axe) => {
        const [dx, dy] = AXE_DIRECTION2[axe];
        return FactoryMap.getInstance().getTile(this.x + dx, this.y + dy);
      });
    }
    return this._nearTilesCross;
  }
  nearTilesAxe(size = 1) {
    return [0, 1, 2, 3].map((axe) => {
      const [dx, dy] = AXE_DIRECTION[axe];
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

// IsoGame/mapIso/canvasMiniMap.ts
var CanvasMiniMapConfDefault = {
  CHUNK_SIZE: 1,
  MAP_DEFINITION: 1,
  SHOW_BIOME_COLOR: true,
  SHOW_LVL: false,
  SHOW_LVLBIOME: false,
  SHOW_TEMP: false,
  SHOW_HIDRYO: false
};
var scaleGenLvl = scaleLinear([-144, 512], [0, 255]);
var getGenLvlScaled = (atile) => {
  const genLvl = scaleGenLvl(atile.genLvl2);
  return genLvl - genLvl % 10;
};
var CanvasMiniMap = class {
  world;
  fg;
  fm;
  sizeW;
  sizeH;
  canvas;
  canvasCtx;
  conf;
  // Optimization 1: ImageData Buffer for fast drawing
  imageData = null;
  data = null;
  // Optimization 2: Local Cache for expensive RawTile generation
  tileCache = /* @__PURE__ */ new Map();
  constructor(world2, width, height, canvas, conf = CanvasMiniMapConfDefault) {
    this.conf = conf;
    this.world = world2;
    this.fg = FactoryGenerator.getInstance();
    this.fm = FactoryMap.getInstance();
    this.sizeW = width;
    this.sizeH = height;
    console.log("=== MiniMap - Init");
    this.canvas = canvas;
    this.canvasCtx = this.canvas.getContext("2d");
    if (this.canvasCtx == null)
      return;
    this.canvasCtx.imageSmoothingEnabled = false;
    this.imageData = this.canvasCtx.createImageData(this.sizeW, this.sizeH);
    this.data = this.imageData.data;
  }
  /**
   * Optimization: Cached wrapper for the expensive fm.getTileNoGen call.
   * If the tile exists in the cache, returns it immediately. Otherwise, generates and caches it.
   */
  _getTileNoGenCached(x, y) {
    const key = `${x}:${y}`;
    if (this.tileCache.has(key)) {
      return this.tileCache.get(key);
    }
    const tile = this.fm.getTileNoGen(x, y);
    this.tileCache.set(key, tile);
    return tile;
  }
  /**
   * Memory Optimization: Cleans the cache by removing tiles far outside the current view.
   * Uses a margin of 2x the current visible extent.
   */
  _cleanCache(centreX, centreY) {
    const tilesPerDimensionW = this.sizeW / this.conf.MAP_DEFINITION;
    const tilesPerDimensionH = this.sizeH / this.conf.MAP_DEFINITION;
    const worldViewWidth = tilesPerDimensionW * this.conf.CHUNK_SIZE;
    const worldViewHeight = tilesPerDimensionH * this.conf.CHUNK_SIZE;
    const KEEP_MARGIN_X = worldViewWidth * 2;
    const KEEP_MARGIN_Y = worldViewHeight * 2;
    const xMin = centreX - KEEP_MARGIN_X;
    const xMax = centreX + KEEP_MARGIN_X;
    const yMin = centreY - KEEP_MARGIN_Y;
    const yMax = centreY + KEEP_MARGIN_Y;
    for (const key of this.tileCache.keys()) {
      const parts = key.split(":");
      const x = parseInt(parts[0], 10);
      const y = parseInt(parts[1], 10);
      if (x < xMin || x > xMax || y < yMin || y > yMax) {
        this.tileCache.delete(key);
      }
    }
  }
  /**
   * Code Clarity Refactor: Encapsulates all color and border calculation logic.
   * Returns [r, g, b, a, borderR, borderG, borderB, borderA, drawBorderFlag]
   */
  _calculatePixelData(tile, tile2, tile3, conf) {
    let r = 0, g = 0, b = 0, a = 255;
    let br = 0, bg = 0, bb = 0, ba = 0;
    let drawBorder = false;
    if (conf.SHOW_BIOME_COLOR) {
      const c = tile.genColor;
      r = c[0];
      g = c[1];
      b = c[2];
      a = 255;
      if (tile.rawBiome.name != tile2.rawBiome.name || tile.rawBiome.name != tile3.rawBiome.name) {
        drawBorder = true;
        br = 0;
        bg = 0;
        bb = 0;
        ba = Math.floor(255 * 0.5);
      }
    } else if (conf.SHOW_LVL) {
      const cLvl = tile.fLvl - tile.fLvl % 16;
      r = cLvl;
      g = 0;
      b = cLvl;
      a = Math.floor(255 * 0.2);
      const cLvl2 = tile2.fLvl - tile2.fLvl % 16;
      const cLvl3 = tile3.fLvl - tile3.fLvl % 16;
      if (cLvl != cLvl2 || cLvl != cLvl3) {
        drawBorder = true;
        br = cLvl;
        bg = cLvl;
        bb = cLvl;
        ba = Math.floor(255 * 0.8);
      }
    } else if (conf.SHOW_LVLBIOME) {
      const cLvl = getGenLvlScaled(tile);
      r = cLvl;
      g = cLvl;
      b = cLvl;
      a = Math.floor(255 * 0.2);
      const cLvl2 = getGenLvlScaled(tile2);
      const cLvl3 = getGenLvlScaled(tile3);
      if (cLvl != cLvl2 || cLvl != cLvl3) {
        drawBorder = true;
        br = cLvl;
        bg = cLvl;
        bb = cLvl;
        ba = Math.floor(255 * 0.8);
      }
    } else if (conf.SHOW_TEMP) {
      const temp = tile.fTemp - tile.fTemp % 32;
      const cTemp = temp + Math.floor((255 - temp) / 2);
      r = cTemp;
      g = Math.floor((255 - temp) / 2);
      b = 255 - temp;
      a = Math.floor(255 * 0.2);
      const temp2 = tile2.fTemp - tile2.fTemp % 32;
      const temp3 = tile3.fTemp - tile3.fTemp % 32;
      if (temp != temp2 || temp != temp3) {
        drawBorder = true;
        br = cTemp;
        bg = Math.floor((255 - temp) / 2);
        bb = 255 - temp;
        ba = Math.floor(255 * 0.7);
      }
    } else if (conf.SHOW_HIDRYO) {
      const hydro = tile.fHydro - tile.fHydro % 32;
      r = 255 - hydro;
      g = 255;
      b = hydro;
      a = Math.floor(255 * 0.2);
      const hydro2 = tile2.fHydro - tile2.fHydro % 32;
      const hydro3 = tile3.fHydro - tile3.fHydro % 32;
      if (hydro != hydro2 || hydro != hydro3) {
        drawBorder = true;
        br = 255 - hydro;
        bg = 255;
        bb = hydro;
        ba = Math.floor(255 * 0.7);
      }
    }
    return [r, g, b, a, br, bg, bb, ba, drawBorder];
  }
  drawUpdate(centreX, centreY, conf) {
    if (this.canvasCtx == null || this.data == null || this.imageData == null)
      return;
    this._cleanCache(centreX, centreY);
    this.conf = conf ? conf : CanvasMiniMapConfDefault;
    const ctx = this.canvasCtx;
    const data = this.data;
    const xOffset = centreX - centreX % this.conf.CHUNK_SIZE;
    const yOffset = centreY - centreY % this.conf.CHUNK_SIZE;
    const matrixSizeW = Math.floor(this.sizeW / this.conf.MAP_DEFINITION);
    const matrixSizeH = Math.floor(this.sizeH / this.conf.MAP_DEFINITION);
    const halfMatrixW_ChunkSteps = Math.floor(matrixSizeW / 2);
    const halfMatrixH_ChunkSteps = Math.floor(matrixSizeH / 2);
    const step = this.conf.MAP_DEFINITION;
    const chunkSize = this.conf.CHUNK_SIZE;
    const X_BASE_WORLD = xOffset - chunkSize * halfMatrixH_ChunkSteps;
    const Y_BASE_WORLD = yOffset + chunkSize * matrixSizeH - chunkSize * halfMatrixW_ChunkSteps;
    for (let row = 0; row < matrixSizeH; row++) {
      for (let col = 0; col < matrixSizeW; col++) {
        const xx = X_BASE_WORLD + chunkSize * col;
        const yy = Y_BASE_WORLD - chunkSize * row;
        if (row == matrixSizeH / 2 && col == matrixSizeW / 2) {
          console.log("------------------------ minimap center", centreX, centreY, xx, yy);
        }
        const startY = row * step;
        const startX = col * step;
        let r = 0, g = 0, b = 0, a = 255;
        let br = 0, bg = 0, bb = 0, ba = 0;
        let drawBorder = false;
        if (Math.abs(row - halfMatrixH_ChunkSteps) <= 1 && Math.abs(col - halfMatrixW_ChunkSteps) <= 1) {
          r = 255;
          g = 0;
          b = 0;
          a = 255;
        } else {
          const tile = this._getTileNoGenCached(xx, yy);
          const tile2 = this._getTileNoGenCached(xx, yy + chunkSize);
          const tile3 = this._getTileNoGenCached(xx + chunkSize, yy + chunkSize);
          [r, g, b, a, br, bg, bb, ba, drawBorder] = this._calculatePixelData(
            tile,
            tile2,
            tile3,
            this.conf
          );
        }
        for (let yPixel = 0; yPixel < step; yPixel++) {
          for (let xPixel = 0; xPixel < step; xPixel++) {
            const arrayIndex = ((startY + yPixel) * this.sizeW + (startX + xPixel)) * 4;
            if (drawBorder && yPixel === 0) {
              data[arrayIndex + 0] = br;
              data[arrayIndex + 1] = bg;
              data[arrayIndex + 2] = bb;
              data[arrayIndex + 3] = ba;
            } else {
              data[arrayIndex + 0] = r;
              data[arrayIndex + 1] = g;
              data[arrayIndex + 2] = b;
              data[arrayIndex + 3] = a;
            }
          }
        }
      }
    }
    ctx.putImageData(this.imageData, 0, 0);
  }
};

// web/jsP/pallet/MenuIconModule.ts
var MenuIconModule = class {
  containerDiv;
  menuIconList;
  // Map to store all icon configurations for easy access
  iconConfigs = /* @__PURE__ */ new Map();
  // Map to track the currently active linkedDivId for each group
  // Key: group name (string), Value: linkedDivId (string)
  activeGroupMap = /* @__PURE__ */ new Map();
  constructor(params) {
    const container = document.getElementById(params.divId);
    if (!container) {
      throw new Error(`DOM element with ID "${params.divId}" not found.`);
    }
    this.containerDiv = container;
    this.containerDiv.innerHTML = this.getInitialStyles();
    const menuIconListElement = this.containerDiv.querySelector(".menu-icon-list");
    if (!menuIconListElement) {
      throw new Error("Could not find '.menu-icon-list' element after setup.");
    }
    this.menuIconList = menuIconListElement;
  }
  /**
   * Internal CSS styles for the module elements.
   */
  getInitialStyles() {
    return `
            <style>
                /* --- Custom styles based on request --- */
                .menu-icon-list {
                    position: absolute;
                    top: 10px;
                    right: 60px;
                    display: flex; /* Arrange icons horizontally */
                    gap: 5px; /* Spacing between icons */
                }
                .menu-icon-list > a {
                    /* Common styles for all icons */
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    background: white;
                    border-radius: 5px;
                    text-align: center;
                    line-height: 30px;
                    font-weight: bold;
                    color: black;
                    text-decoration: none; /* Remove underline from <a> */
                    display: inline-block; /* Required for width/height */
                    transition: background-color 0.2s;
                }
                /* Style for the active/selected icon */
                .menu-icon-list > a.active {
                    background-color: #e67e22; /* Use a color to indicate active state */
                    color: white;
                }
            </style>
            <div class="menu-icon-list">
                </div>
        `;
  }
  /**
   * PUBLIC METHOD: Adds a new icon to the menu and sets up its functionality.
   * @param label The text label to display on the icon (e.g., 'A', 'B').
   * @param linkedDivId The ID of the DOM element to show/hide.
   * @param group The group this icon belongs to (only one per group can be visible).
   * @param callClick OPTIONAL: A function to run when the icon is clicked. 
   * It receives the linkedDivId and the *current* active state (true if active, false if not).
   */
  addIcon(label, linkedDivId, group, callClick) {
    const key = `${group}:${label}`;
    if (this.iconConfigs.has(key)) {
      console.warn(`Icon with key '${key}' already exists. Skipping.`);
      return;
    }
    const config = { label, linkedDivId, group, callClick };
    this.iconConfigs.set(key, config);
    const iconElement = document.createElement("a");
    iconElement.textContent = label;
    iconElement.href = "javascript:void(0)";
    iconElement.dataset.linkedDivId = linkedDivId;
    iconElement.dataset.group = group;
    const linkedElement = document.getElementById(linkedDivId);
    if (linkedElement) {
      linkedElement.style.display = "none";
    } else {
      console.warn(`Linked div with ID "${linkedDivId}" not found in the document.`);
    }
    iconElement.addEventListener("click", () => this.handleIconClick(iconElement, config));
    this.menuIconList.appendChild(iconElement);
  }
  /**
   * Handles the click event for an icon, running the optional callback, 
   * toggling the visibility of linked elements, and updating the icon's active state.
   * @param clickedIcon The HTML anchor element that was clicked.
   * @param config The configuration object for the clicked icon.
   */
  handleIconClick(clickedIcon, config) {
    const group = config.group;
    const linkedDivId = config.linkedDivId;
    const currentActiveDivId = this.activeGroupMap.get(group);
    const linkedDiv = document.getElementById(linkedDivId);
    if (!linkedDiv)
      return;
    const groupIcons = this.menuIconList.querySelectorAll(`a[data-group="${group}"]`);
    if (currentActiveDivId === linkedDivId) {
      linkedDiv.style.display = "none";
      clickedIcon.classList.remove("active");
      this.activeGroupMap.delete(group);
      console.log(`Deactivated: ${linkedDivId} (Group: ${group})`);
    } else {
      if (currentActiveDivId) {
        const oldLinkedDiv = document.getElementById(currentActiveDivId);
        if (oldLinkedDiv) {
          oldLinkedDiv.style.display = "none";
        }
        groupIcons.forEach((icon) => {
          if (icon.dataset.linkedDivId === currentActiveDivId) {
            icon.classList.remove("active");
          }
        });
      }
      linkedDiv.style.display = "block";
      clickedIcon.classList.add("active");
      this.activeGroupMap.set(group, linkedDivId);
      console.log(`Activated: ${linkedDivId} (Group: ${group})`);
    }
    const willBeActive = currentActiveDivId !== linkedDivId;
    if (config.callClick) {
      config.callClick(linkedDivId, willBeActive);
    }
  }
};

// web/jsP/main.ts
var editorMenu = new MenuIconModule({
  divId: "menu-icon-container"
});
editorMenu.addIcon("I", "isogame-module", "main-content");
editorMenu.addIcon("T", "isometric-grid-container", "main-content");
editorMenu.addIcon("S", "sheet-editor-module", "main-content");
editorMenu.addIcon("M", "menu2", "action-content");
var miniMapContainer = document.getElementById("canva-mini-map");
var world = new World();
var minimap = new CanvasMiniMap(
  world,
  miniMapContainer.width,
  miniMapContainer.height,
  miniMapContainer.transferControlToOffscreen()
);
minimap.drawUpdate(0, 0);
