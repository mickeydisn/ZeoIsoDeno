
/** Union of all possible parameter keys. */
export type TActionParamKey = string;

/** The types of input controls the UI should render. */
export type TParamType = 'number' | 'boolean' | 'string' | 'colorArray' | 'coordinates';

export interface IComMessageParam {
    key: TActionParamKey;
    label: string;
    type: TParamType;
    min?: number;
    max?: number;
    step?: number;
    options?: string[] | { value: any, label: string }[];
}
export type TComMessageParams = IComMessageParam[];

// ----------------------------------------------------------------------------

/** Base type for global actions (no coordinates). */
export interface IComMessage {
    func: string; 
    id ?: string;
}
export interface ILocatedComMessage  extends IComMessage{
    func: string;
    x: number;
    y: number;
}

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

// --- Instance Interface (ITileActionCommand remains) ---
export interface ICommand {
    conf: IComMessage; 
    execute(): void;
}


/**
 * The Static Interface is GENERIC over the Command's REQUIRED Config Type (TConfig).
 * TConfig MUST extend the global TypeTileActionConfig.
 * * NOTE: The 'new' signature is removed, and this interface is *not* used in the 'implements' clause.
 */
export interface ICommandStatic<TConfig extends IComMessage = IComMessage> {
    // Static Properties
    func: string;
    group: string;
    label: string;
    params: TComMessageParams; 
    defaults: Partial<Record<TActionParamKey, any>>;
    // Static Factory Method (MUST be implemented with the 'static' keyword in the class)
    new (...args: any[]): any
    createFromConfig(conf: TConfig): InstanceType<this>;
}




/**
 * Abstract base class that enforces the standard pattern for all commands.
 * Extend this class instead of implementing ICommand directly.
 */
export abstract class BaseCommand<TConfig extends IComMessage = IComMessage> implements ICommand {
    public readonly conf: TConfig;

    constructor(conf: TConfig) {
        this.conf = conf;
    }

    // Each command must implement its own execution logic
    abstract execute(): void;

    // Standard static factory - must be overridden with proper typing
    static createFromConfig<T extends BaseCommand<any>>(
        this: new (conf: any) => T,
        conf: any
    ): T {
        return new this(conf);
    }
}

// --- Helper Type for Registry ---
export type CommandClass<TConfig extends IComMessage = IComMessage> = 
    (new (conf: TConfig) => BaseCommand<TConfig>) & ICommandStatic<TConfig>;


/*
// --- Example Command ---
interface MyCommandConfig extends IComMessage {
    targetId: string;
    value: number;
}

class MyCommand extends BaseCommand<MyCommandConfig> {
    static readonly func = 'myFunction';
    static readonly group = 'myGroup';
    static readonly name = 'My Command';
    static readonly params: TComMessageParams = { / * ... * / };
    static readonly defaults = {};

    execute(): void {
        console.log(`Target: ${this.conf.targetId}, Value: ${this.conf.value}`);
    }
}

// --- Usage ---
// Direct usage
const cmd = MyCommand.createFromConfig({ targetId: 'tile-1', value: 42 });
cmd.execute();

// Registry usage
const registry: Record<string, CommandClass> = {
    myCommand: MyCommand as CommandClass
};

function executeCommand(funcName: string, conf: IComMessage) {
    const Cmd = registry[funcName];
    return Cmd.createFromConfig(conf);
}

*/