import { CityEntity } from "./cityEntity.ts";

export type EntityGoalName = "randomMove";
export type EntityGoal = {
  id: EntityGoalName;
  waitCount: number;
  sData?: any;
  moveTilesPath?: any;
};

export type EntityBehaviorName =
  | "behaviorMove_getRandomGoal"
  | "behaviorMove_getHouseGoal"
  | "behaviorMove_GoalIN"
  | "behaviorMove_nextPossition";

export type EntityBehavior = {
  name: EntityBehaviorName;
  isValidate: (entity: CityEntity) => boolean;
  do: (entity: CityEntity) => void;
};
