// typeEntityBehavior.ts

import { CityEntity } from "./CityEntity.ts";

export type EntityGoalName = "randomMove";
export type EntityGoal = {
  id: EntityGoalName;
  waitCount: number;
  sData?: any;
  moveTilesPath?: any;
};

// Removed unused behavior names like "behaviorMove_getHouseGoal" 
// to keep it clean and reflective of current logic.
export type EntityBehaviorName =
  | "behavior_noGoal"
  | "behaviorMove_getRandomGoal"
  | "behaviorMove_GoalIN"
  | "getPath"
  | "nextPossition";

export type EntityBehavior = {
  name: string; // Changed to string as not all behaviors are in the old list
  isValidate: (entity: CityEntity) => boolean;
  do: (entity: CityEntity) => void;
};