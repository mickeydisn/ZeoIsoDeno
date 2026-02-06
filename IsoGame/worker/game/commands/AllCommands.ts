// FILE: AllCommands.ts (REWRITTEN for Self-Registration)

// --- Imports ---
// IMPORTANT: These types must be defined in TypeTileActionConfig.ts and TileActionInterfaceTypes.ts
import { 
    ICommandStatic, // Interface for static members (func, params, createFromConfig)
} from "../../shared/actions/TypeCommand.ts"; 
import { 
    // SetBlockedCommand,
    SetBlockedSquareCommand,
    SetFriseCommand,
    SetFriseSquareCommand,
} from "./CommandsBlockFrise.ts";
import {     
    ClearColorCommand,
    ClearColorSquareCommand,
    ColorCommand,
    ColorSquareCommand,
 } from "./CommandsColor.ts";
import {
    ItemAddKeyCommand,
    ItemForceKeyCommand,
    ClearItemCommand,
    ClearItemSquareCommand,
    TemporatyItemsForceKeyCommand,
} from "./CommandsItems.ts";
import {     
    ClearAllCommand,
    ClearAllSquareCommand,
    ClearAllTemporatyItemsCommand,
 } from "./CommandsClean.ts";
import {     
    ClearLvlCommand,
    ClearLvlSquareCommand,
    LvlSetCommand,
    LvlUpCommand,
    LvlUpSquareCommand,
    LvlFlatSquareCommand,
    LvlAvgCommand,
    LvlAvgSquareCommand,
    LvlAvgBorderCommand,
 } from "./CommandsLvl.ts";

// Note: ITileActionCommand and ITileCommandStatic must be exported from TypeTileActionConfig.ts

// ----------------------------------------------------------------------
// 🗃️ Export List: The Single Point of Registration
// ----------------------------------------------------------------------
/**
 * This array is the new, single point of registration for the entire system.
 * It is correctly typed to enforce the static contract ITileCommandStatic.
 * To add a new command, you MUST add its class constructor to this list.
 */
export const AllCommandClasses: ICommandStatic[] = [
    // 1. Block and Frise Commands
    // SetBlockedCommand,
    SetBlockedSquareCommand,
    SetFriseCommand,
    SetFriseSquareCommand,
    
    // 2. Level (Lvl) Commands
    ClearLvlCommand,
    ClearLvlSquareCommand,
    LvlSetCommand,
    LvlUpCommand,
    LvlUpSquareCommand,
    LvlFlatSquareCommand,
    LvlAvgCommand,
    LvlAvgSquareCommand,
    LvlAvgBorderCommand,
    
    // 3. Color Commands
    ClearColorCommand,
    ClearColorSquareCommand,
    ColorCommand,
    ColorSquareCommand,
    
    // 4. Item Commands
    ItemAddKeyCommand,
    ItemForceKeyCommand,
    ClearItemCommand,
    ClearItemSquareCommand,
    TemporatyItemsForceKeyCommand,
    
    // 5. Global/Cleanup Commands
    ClearAllCommand,
    ClearAllSquareCommand,
    ClearAllTemporatyItemsCommand,
];
