import { CityEntity } from "./entity/cityEntity.ts";


export class World {
  private static instance: World;
  public static getInstance(): World {
    return World.instance ??= new World();
  }

  seed: string = "mickey";
  entities: CityEntity[] = [];
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
}
