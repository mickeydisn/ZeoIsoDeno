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
    console.log("word tick");
    for (const e of this.entities) {
      e.doTick();
    }
  }

  removeEntity(entity:CityEntity) {
    this.entities = this.entities.filter(t => t !== entity)
  }

  init() {
  }
}
