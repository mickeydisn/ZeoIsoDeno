

// Import the static interface
import { SingletonBase } from "../../utils/SingletonBase.ts";
import { IComMessage, ICommand, ICommandStatic } from "./actions/TypeCommand.ts";
import { AllCommandClasses } from "../game/commands/AllCommands.ts"; 

// CommandMap uses the static interface for its values


export abstract class CommandFactory extends SingletonBase {
    protected abstract commandMap: Map<string, ICommandStatic>; 

    public createCommand(conf: IComMessage): ICommand | null {
        // ... (lookup remains the same) ...
        const CommandClass = this.commandMap.get(conf.func);
        if (!CommandClass) {
            // ...
            return null;
        }
        // Call the static method, which TypeScript now correctly validates
        return CommandClass.createFromConfig(conf); 
    }
}

export class CommandFactoryWorker extends CommandFactory {
    protected commandMap = new Map(AllCommandClasses.map(CmdClass => [CmdClass.func, CmdClass]));    
}
export class CommandFactoryMain extends CommandFactory {
    protected commandMap = new Map(AllCommandClasses.map(CmdClass => [CmdClass.func, CmdClass]));    
}