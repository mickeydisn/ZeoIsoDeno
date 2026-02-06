export class SimplexNoise {
  private perm: Uint8Array;
  private permMod12: Uint8Array;
  private static readonly F2: number = 0.5 * (Math.sqrt(3.0) - 1.0);
  private static readonly G2: number = (3.0 - Math.sqrt(3.0)) / 6.0;
  private static readonly F3: number = 1.0 / 3.0;
  private static readonly G3: number = 1.0 / 6.0;
  private static readonly F4: number = (Math.sqrt(5.0) - 1.0) / 4.0;
  private static readonly G4: number = (5.0 - Math.sqrt(5.0)) / 20.0;
  private static grad3 = new Float32Array([
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
    -1,
  ]);

  constructor(randomOrSeed?: (() => number) | string) {
    let random: () => number;
    if (typeof randomOrSeed === "function") {
      random = randomOrSeed;
    } else if (randomOrSeed) {
      random = SimplexNoise.alea(randomOrSeed);
    } else {
      random = Math.random;
    }

    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    const p = SimplexNoise.buildPermutationTable(random);

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  noise2D(xin: number, yin: number): number {
    const permMod12 = this.permMod12;
    const perm = this.perm;
    const grad3 = SimplexNoise.grad3;
    let n0 = 0, n1 = 0, n2 = 0;
    const s = (xin + yin) * SimplexNoise.F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * SimplexNoise.G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + SimplexNoise.G2;
    const y1 = y0 - j1 + SimplexNoise.G2;
    const x2 = x0 - 1.0 + 2.0 * SimplexNoise.G2;
    const y2 = y0 - 1.0 + 2.0 * SimplexNoise.G2;
    const ii = i & 255;
    const jj = j & 255;
    /*
    var t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      var gi0 = permMod12[ii + perm[jj]] * 3;
      t0 *= t0;
      n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
      t1 *= t1;
      n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
    }
    var t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
      t2 *= t2;
      n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
    }
    */
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
    return 70.0 * (n0 + n1 + n2);
  }

  private static buildPermutationTable(random: () => number): Uint8Array {
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

  private static alea(seed: string): () => number {
    /*
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    var mash = masher();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    for (var i = 0; i < arguments.length; i++) {
      s0 -= mash(arguments[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(arguments[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(arguments[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;
    return function() {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };
    */
    let s0 = 0, s1 = 0, s2 = 0, c = 1;
    const mash = SimplexNoise.masher();
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
    return function () {
      const t = 2091639 * s0 + c * 2.3283064365386963e-10;
      s0 = s1;
      s1 = s2;
      s2 = t - (c = t | 0);
      return s2;
    };
  }

  private static masher(): (data: string) => number {
    /*
     var n = 0xefc8249d;
    return function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
    */
    let n = 0xefc8249d;
    return function (data: string): number {
      for (let i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        let h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
  }
}
