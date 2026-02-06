import { CommandClass, IComMessage } from "./actions/TypeCommand.ts";

type TWorker = Worker | (Window & typeof globalThis);

export class MessageHandler {
  private static instance: MessageHandler | null = null;
  
  private worker: TWorker;
  private pendingResponses = new Map<string, (data: any) => void>();
  private commandRegistry = new Map<string, CommandClass>();

  private constructor(worker: TWorker) {
    this.worker = worker;

    this.worker.onmessage = (event) => {
      this.handleIncoming(event.data);
    };
  }

  /**
   * Initialize the singleton instance
   */
  public static initialize(worker: TWorker): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler(worker);
    }
    return MessageHandler.instance;
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      throw new Error("MessageHandler not initialized. Call initialize() first.");
    }
    return MessageHandler.instance;
  }

  /**
   * Reset the singleton (useful for testing)
   */
  public static reset(): void {
    MessageHandler.instance = null;
  }

  /**
   * Register a command class
   */
  public registerCommand<TConfig extends IComMessage>(
    CommandClass: CommandClass<TConfig>
  ): this {
    this.commandRegistry.set(CommandClass.func, CommandClass);
    return this;
  }

  /**
   * Register multiple commands at once
   */
  public registerCommands(commands: CommandClass[]): this {
    commands.forEach(cmd => this.registerCommand(cmd));
    return this;
  }

  /**
   * Get all registered command names
   */
  public getRegisteredCommands(): string[] {
    return Array.from(this.commandRegistry.keys());
  }

  /**
   * Send a message without expecting a response
   */
  public send(payload: IComMessage, id = crypto.randomUUID()): string {
    const message = { ...payload, id };
    this.worker.postMessage(message);
    return id;
  }

  /**
   * Send a message and wait for a response
   */
  public sendWithResponse<T = any>(payload: IComMessage): Promise<T> {
    return new Promise((resolve) => {
      const id = this.send(payload);
      this.pendingResponses.set(id, resolve);
    });
  }

  /**
   * Send data with transferables (for Worker only)
   */
  public sendDataSync(
    payload: IComMessage,
    transferables: Transferable[],
    id = crypto.randomUUID()
  ): string {
    const message = { ...payload, id };
    (this.worker as Worker).postMessage(message, transferables);
    return id;
  }

  /**
   * Handle incoming messages
   */
  private handleIncoming(message: IComMessage): void {
    const { func, id } = message;

    // Handle response to a previous request
    if (id && this.pendingResponses.has(id)) {
      const resolver = this.pendingResponses.get(id);
      resolver?.(message);
      this.pendingResponses.delete(id);
      return;
    }

    // Handle command request
    const CommandClass = this.commandRegistry.get(func);
    
    if (CommandClass) {
      try {
        const command = CommandClass.createFromConfig(message);
        const result = command.execute();
        
        // Send response if message had an id
        if (id) {
          this.worker.postMessage({ 
            func: `${func}_response`,
            id, 
            result 
          });
        }
      } catch (error) {
        console.error(`[MessageHandler] Error executing command "${func}":`, error);
        
        if (id) {
          this.worker.postMessage({ 
            func: `${func}_error`,
            id, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    } else {
      console.warn(`[MessageHandler] No command registered for "${func}"`);
    }
  }
}

// --- Usage Example ---

// In main thread (main.ts):
/*
import { MessageHandler } from "./MessageHandler.ts";
import { MyCommand, AnotherCommand } from "./commands/index.ts";

const worker = new Worker("./worker.ts", { type: "module" });

MessageHandler.initialize(worker)
  .registerCommands([
    MyCommand,
    AnotherCommand
  ]);

// Later, anywhere in your code:
const handler = MessageHandler.getInstance();
handler.send({ func: "myFunction", targetId: "tile-1", value: 42 });

// With response:
const result = await handler.sendWithResponse({ 
  func: "myFunction", 
  targetId: "tile-1" 
});
*/

// In worker (worker.ts):
/*
import { MessageHandler } from "./MessageHandler.ts";
import { MyCommand, AnotherCommand } from "./commands/index.ts";

MessageHandler.initialize(self as any)
  .registerCommands([
    MyCommand,
    AnotherCommand
  ]);

// Send message to main thread:
const handler = MessageHandler.getInstance();
handler.send({ func: "updateProgress", progress: 50 });
*/