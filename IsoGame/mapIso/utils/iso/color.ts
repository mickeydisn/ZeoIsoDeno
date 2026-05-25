export class Color {
  r: number;
  g: number;
  b: number;
  a: number;
  h: number = 0;
  s: number = 0;
  l: number = 0;

  constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
    this.r = Math.round(r);
    this.g = Math.round(g);
    this.b = Math.round(b);
    this.a = Math.round(a * 100) / 100;
    this.loadHSL();
  }

  toHex(): string {
    const hex = (this.r * 256 * 256 + this.g * 256 + this.b).toString(16)
      .padStart(6, "0");
    return `#${hex}`;
  }

  lighten(
    percentage: number,
    lightColor: Color = new Color(255, 255, 255),
  ): Color {
    const newColor = new Color(
      (lightColor.r / 255) * this.r,
      (lightColor.g / 255) * this.g,
      (lightColor.b / 255) * this.b,
      this.a,
    );
    newColor.l = Math.min(newColor.l + percentage, 1);
    newColor.loadRGB();
    return newColor;
  }

  private loadHSL(): void {
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

  private loadRGB(): void {
    let r, g, b;
    if (this.s === 0) {
      r = g = b = this.l;
    } else {
      const q = this.l < 0.5
        ? this.l * (1 + this.s)
        : this.l + this.s - this.l * this.s;
      const p = 2 * this.l - q;
      r = this._hue2rgb(p, q, this.h + 1 / 3);
      g = this._hue2rgb(p, q, this.h);
      b = this._hue2rgb(p, q, this.h - 1 / 3);
    }
    this.r = Math.round(r * 255);
    this.g = Math.round(g * 255);
    this.b = Math.round(b * 255);
  }

  private _hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
}
