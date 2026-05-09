import { Biome } from "../object/biomes.ts";
import { GAME_BIOMES, GameBiomesType } from "./data/biomes.ts";
import { GAME_FLORE_ITEMS, GameFloreItem } from "./data/items.ts";

export class FactoryBiomes {
  private static instance: FactoryBiomes;
  public static getInstance(): FactoryBiomes {
    return FactoryBiomes.instance ??= new FactoryBiomes();
  }

  biomes: Record<string, Biome> = {};

  constructor() {
    GAME_BIOMES.forEach((biomeConf: GameBiomesType) => {
      if (!(biomeConf.id in this.biomes)) {
        this.biomes[biomeConf.id] = new Biome(biomeConf);
      }
    });

    GAME_FLORE_ITEMS.forEach((floreItemsConf: GameFloreItem) => {
      this.addFloreCondition(floreItemsConf);
    });
  }

  private addFloreCondition(floreItemsConf: GameFloreItem): void {
    const f = floreItemsConf;
    const func =
      `((flore * 1024 | 0) % ${f.flore.mod} == ${f.flore.eq} && flore >= ${f.flore.min} && flore < ${f.flore.max} && lvl >= ${f.l.min} && lvl < ${f.l.max}) ? '${f.key}' `;

    floreItemsConf.b.forEach((bid: number) => {
      const biomeKey: string = String(bid);
      this.biomes[biomeKey].appendFloreCondition(func);
    });
  }
}
