// EntityAI.ts

import { PathFactory } from "../city/pathFactory.ts";
import { Tile } from "../map/tile.ts";
import { CityEntity } from "./cityEntity.ts";
import { EntityBehavior, EntityGoal } from "./typeEntityBehavior.ts";

/**
 * EntityAI manages the behavior, goals, and decision-making logic 
 * for a CityEntity instance, and holds the relevant AI state.
 */
export class EntityAI {
    private entity: CityEntity;
    private behaviorChain: EntityBehavior[];
    
    // AI STATE IS NOW DEFINED HERE!
    waitingTickCount: number;
    currentGoal: EntityGoal | null;
    nextGoalList: EntityGoal[];
    
    pathFactory: PathFactory; // Utility for behavior

    constructor(entity: CityEntity) {
        this.entity = entity;
        this.pathFactory = new PathFactory(entity.world);
        
        // Initialize AI state
        this.waitingTickCount = 0;
        this.currentGoal = null;
        this.nextGoalList = [
            { id: "randomMove", waitCount: 20 * 4 },
        ];

        // Define the behavior chain
        this.behaviorChain = [
            behavior_noGoal,
            behaviorMove_getRandomGoal,
            behaviorMove_GoalIN,
            behaviorMove_getPath,
            behaviorMove_nextPossition,
        ];
    }

    tick() {
        // AI component manages its own wait state
        if (this.waitingTickCount > 0) { 
            this.waitingTickCount -= 1;
            return;
        }

        // Execute the first behavior that is validated
        for (const step of this.behaviorChain) {
            // Note: Behavior objects still take CityEntity, 
            // but now access AI state through entity.ai
            if (step.isValidate(this.entity)) {
                step.do(this.entity);
                break;
            }
        }
    }

    clearGoal() {
        this.waitingTickCount = 0;
        this.currentGoal = null;
    }
}

// ----------------------------------------------------------------
// BEHAVIOR DEFINITIONS (Must now use entity.ai to access state)
// ----------------------------------------------------------------

const behavior_noGoal: EntityBehavior = {
    name: "behavior_noGoal",
    isValidate: (entity: CityEntity) => {
        return entity.ai.currentGoal == null; // Access state via .ai
    },
    do: (entity: CityEntity) => {
        const ai = entity.ai; 
        const nextGoal = ai.nextGoalList.shift();
        
        if (!nextGoal) {
            ai.nextGoalList = [{ id: "randomMove", waitCount: 20 * 4 }];
            return;
        }

        if (nextGoal.waitCount) {
            ai.waitingTickCount = nextGoal.waitCount;
        }
        ai.currentGoal = nextGoal;
    },
};

const behaviorMove_getRandomGoal: EntityBehavior = {
    name: "behaviorMove_getRandomGoal",
    isValidate: (entity: CityEntity) =>
        entity.ai.currentGoal?.id.localeCompare("randomMove") == 0 &&
        !entity.ai.currentGoal?.sData?.moveGoal,
    do: (entity: CityEntity) => {
        const currentGoal = entity.ai.currentGoal as EntityGoal;
        const randomX = Math.round(Math.random() * 40 - 20);
        const randomY = Math.round(Math.random() * 40 - 20);
        currentGoal.sData = {
            moveGoal: {
                x: entity.tile.x + randomX,
                y: entity.tile.y + randomY,
            },
        };
    },
};

const behaviorMove_GoalIN: EntityBehavior = {
    name: "behaviorMove_GoalIN",
    isValidate: (entity: CityEntity) => {
        const currentGoal = entity.ai.currentGoal;
        return currentGoal &&
            currentGoal.sData &&
            currentGoal.sData.moveGoal &&
            (currentGoal.sData.moveGoal.x == entity.tile.x &&
                currentGoal.sData.moveGoal.y == entity.tile.y);
    },
    do: (entity: CityEntity) => {
        entity.offset.x = 0;
        entity.offset.y = 0;
        entity.direction = "S";
        entity.ai.clearGoal(); // Call the AI component method
    },
};

const behaviorMove_getPath: EntityBehavior = {
    name: "getPath",
    isValidate: (entity: CityEntity) => {
        const currentGoal = entity.ai.currentGoal;
        return currentGoal &&
            currentGoal.sData.moveGoal &&
            (currentGoal.sData.moveGoal.x != entity.tile.x ||
                currentGoal.sData.moveGoal.y != entity.tile.y) &&
            (!currentGoal.sData.moveTilesPath ||
                currentGoal.sData.moveTilesPath.length == 0);
    },

    do: (entity: CityEntity) => {
        const ai = entity.ai;
        const currentGoal = ai.currentGoal as EntityGoal;
        
        if (!currentGoal.sData) currentGoal.sData = {}; 

        // Use the PathFactory instance stored in EntityAI
        const moveTilesPath = ai.pathFactory.createPath(
            { x: entity.tile.x, y: entity.tile.y },
            { x: currentGoal.sData.moveGoal.x, y: currentGoal.sData.moveGoal.y },
        );
        if (!moveTilesPath) {
            currentGoal.sData.moveGoal = null;
        }
        currentGoal.sData.moveTilesPath = moveTilesPath;
    },
};

const behaviorMove_nextPossition: EntityBehavior = {
    name: "nextPossition",
    isValidate: (entity: CityEntity) => {
        const currentGoal = entity.ai.currentGoal;
        return currentGoal &&
            currentGoal.sData.moveGoal &&
            (currentGoal.sData.moveGoal.x != entity.tile.x ||
                currentGoal.sData.moveGoal.y != entity.tile.y) &&
            currentGoal.sData.moveTilesPath &&
            currentGoal.sData.moveTilesPath.length > 0;
    },

    do: (entity: CityEntity) => {
        const currentGoal = entity.ai.currentGoal as EntityGoal;
        const moveTilesPath = currentGoal.sData.moveTilesPath as Tile[];

        const nextPos = moveTilesPath[0];
        const dx = nextPos.x - entity.tile.x;
        const dy = nextPos.y - entity.tile.y;
        const dh = nextPos.lvl - entity.tile.lvl;

        entity.moveOffet(dx, dy, dh);
        
        if (nextPos.x == entity.tile.x && nextPos.y == entity.tile.y) {
            moveTilesPath.shift();
        }
    },
};