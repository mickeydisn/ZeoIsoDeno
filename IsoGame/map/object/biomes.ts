import { GameBiomesType } from "../data/biomes.ts";

export class Biome {
  name: string;
  id: string;
  rgb: string[];
  lvlType: string;
  color: (lvl: number, flore: number) => number[];
  flore: (lvl: number, flore: number) => string;
  private floreCondition: string[] = ["null"];

  constructor(biomeConf: GameBiomesType) {
    this.name = biomeConf.name;
    this.id = biomeConf.id;
    this.rgb = biomeConf.rgb;
    this.lvlType = biomeConf.lvlType;
    this.color = this.initColor();
    this.flore = this.initFlore();
  }

  private initColor() {
    const rgbFunc = this.rgb.map((x) => `(${x}) & 0xFF`);
    return eval(`(lvl, flore) => [${rgbFunc.join(",")}, 255]`);
  }

  private initFlore() {
    return eval(
      `(lvl, flore) => ${this.floreCondition.join(":")}`,
    );
  }

  appendFloreCondition(condition: string): void {
    this.floreCondition.unshift(condition);
    this.flore = this.initFlore();
  }
}
