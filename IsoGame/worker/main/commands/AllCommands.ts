// FILE: AllCommands.ts (REWRITTEN for Self-Registration)

// --- Imports ---
// IMPORTANT: These types must be defined in TypeTileActionConfig.ts and TileActionInterfaceTypes.ts
import { 
CommandClass,
    ICommandStatic, // Interface for static members (func, params, createFromConfig)
} from "../../shared/actions/TypeCommand.ts"; 
import { CallbackInitCanvasMap_Command, CallbackInitWorker_Command } from "./CommandsInit.ts";

// Note: ITileActionCommand and ITileCommandStatic must be exported from TypeTileActionConfig.ts

// ----------------------------------------------------------------------
// 🗃️ Export List: The Single Point of Registration
// ----------------------------------------------------------------------
/**
 * This array is the new, single point of registration for the entire system.
 * It is correctly typed to enforce the static contract ITileCommandStatic.
 * To add a new command, you MUST add its class constructor to this list.
 */
export const AllCommandClasses: CommandClass[] = [
    CallbackInitWorker_Command as CommandClass,
    CallbackInitCanvasMap_Command as CommandClass,
];
