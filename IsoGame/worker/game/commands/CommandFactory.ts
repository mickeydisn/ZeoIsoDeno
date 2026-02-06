

// Import the static interface

import { CommandFactory } from "../../shared/CommandFactory.ts";
import { AllCommandClasses } from "./AllCommands.ts";

// CommandMap uses the static interface for its values


export class CommandFactoryWorker extends CommandFactory {
    protected commandMap = new Map(AllCommandClasses.map(CmdClass => [CmdClass.func, CmdClass]));    
}
