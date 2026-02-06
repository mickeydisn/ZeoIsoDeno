import { MessageHandler } from "./MessageHandler.ts";

// ============================================================================
// Main Thread State
// ============================================================================

export class MainState {
  private static instance: MainState | null = null;
  
  private canvasMap = new Map<string, HTMLCanvasElement>();
  private offscreenMap = new Map<string, OffscreenCanvas>();
  private messageHandler: MessageHandler;
  private worker: Worker;

  private constructor(worker: Worker) {
    this.worker = worker;
    this.messageHandler = MessageHandler.initialize(worker);
  }

  /**
   * Initialize the main state singleton
   */
  public static initialize(worker: Worker): MainState {
    if (!MainState.instance) {
      MainState.instance = new MainState(worker);
    }
    return MainState.instance;
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): MainState {
    if (!MainState.instance) {
      throw new Error("MainState not initialized. Call initialize() first.");
    }
    return MainState.instance;
  }

  /**
   * Reset the singleton (useful for testing)
   */
  public static reset(): void {
    MainState.instance = null;
  }

  /**
   * Add a canvas from the DOM and optionally transfer it to worker
   */
  public addCanvas(
    canvasId: string, 
    canvas: HTMLCanvasElement,
    transferToWorker = false
  ): this {
    this.canvasMap.set(canvasId, canvas);

    if (transferToWorker) {
      this.transferCanvasToWorker(canvasId);
    }

    return this;
  }

  /**
   * Add a canvas by querying the DOM
   */
  public addCanvasById(
    canvasId: string, 
    transferToWorker = false
  ): this {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }
    
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Element with id "${canvasId}" is not a canvas`);
    }

    return this.addCanvas(canvasId, canvas, transferToWorker);
  }

  /**
   * Transfer a canvas to the worker as OffscreenCanvas
   */
  public transferCanvasToWorker(canvasId: string): this {
    const canvas = this.canvasMap.get(canvasId);
    
    if (!canvas) {
      throw new Error(`Canvas "${canvasId}" not found in state`);
    }

    if (this.offscreenMap.has(canvasId)) {
      console.warn(`Canvas "${canvasId}" already transferred to worker`);
      return this;
    }

    const offscreen = canvas.transferControlToOffscreen();
    this.offscreenMap.set(canvasId, offscreen);

    // Send offscreen canvas to worker
    this.messageHandler.sendDataSync(
      {
        func: "setCanvas",
        canvasId,
      },
      [offscreen]
    );

    return this;
  }

  /**
   * Get a canvas element (only available if not transferred)
   */
  public getCanvas(canvasId: string): HTMLCanvasElement | undefined {
    return this.canvasMap.get(canvasId);
  }

  /**
   * Check if a canvas has been transferred to worker
   */
  public isCanvasTransferred(canvasId: string): boolean {
    return this.offscreenMap.has(canvasId);
  }

  /**
   * Get all canvas IDs
   */
  public getCanvasIds(): string[] {
    return Array.from(this.canvasMap.keys());
  }

  /**
   * Get the message handler
   */
  public getMessageHandler(): MessageHandler {
    return this.messageHandler;
  }

  /**
   * Get the worker
   */
  public getWorker(): Worker {
    return this.worker;
  }
}

// ============================================================================
// Worker Thread State
// ============================================================================

export class WorkerState {
  private static instance: WorkerState | null = null;
  
  private offscreenCanvasMap = new Map<string, OffscreenCanvas>();
  private contextMap = new Map<string, OffscreenCanvasRenderingContext2D | null>();
  private messageHandler: MessageHandler;

  private constructor() {
    this.messageHandler = MessageHandler.initialize(self as any);
    
    // Register the built-in canvas handler
    this.messageHandler.registerCommand(SetCanvasCommand);
  }

  /**
   * Initialize the worker state singleton
   */
  public static initialize(): WorkerState {
    if (!WorkerState.instance) {
      WorkerState.instance = new WorkerState();
    }
    return WorkerState.instance;
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): WorkerState {
    if (!WorkerState.instance) {
      throw new Error("WorkerState not initialized. Call initialize() first.");
    }
    return WorkerState.instance;
  }

  /**
   * Reset the singleton (useful for testing)
   */
  public static reset(): void {
    WorkerState.instance = null;
  }

  /**
   * Set an offscreen canvas (called by SetCanvasCommand)
   */
  public setCanvas(canvasId: string, canvas: OffscreenCanvas): this {
    this.offscreenCanvasMap.set(canvasId, canvas);
    
    // Create and cache the 2D context
    const ctx = canvas.getContext("2d");
    this.contextMap.set(canvasId, ctx);

    return this;
  }

  /**
   * Get an offscreen canvas
   */
  public getCanvas(canvasId: string): OffscreenCanvas | undefined {
    return this.offscreenCanvasMap.get(canvasId);
  }

  /**
   * Get a 2D rendering context for a canvas
   */
  public getContext(canvasId: string): OffscreenCanvasRenderingContext2D | null {
    return this.contextMap.get(canvasId) ?? null;
  }

  /**
   * Get all canvas IDs
   */
  public getCanvasIds(): string[] {
    return Array.from(this.offscreenCanvasMap.keys());
  }

  /**
   * Check if a canvas exists
   */
  public hasCanvas(canvasId: string): boolean {
    return this.offscreenCanvasMap.has(canvasId);
  }

  /**
   * Get the message handler
   */
  public getMessageHandler(): MessageHandler {
    return this.messageHandler;
  }
}

// ============================================================================
// Built-in Command for Canvas Transfer
// ============================================================================

import { BaseCommand, IComMessage } from "./BaseCommand.ts";

interface SetCanvasMessage extends IComMessage {
  func: "setCanvas";
  canvasId: string;
  canvas?: OffscreenCanvas; // Received via transferable
}

class SetCanvasCommand extends BaseCommand<SetCanvasMessage> {
  static readonly func = "setCanvas";
  static readonly group = "system";
  static readonly name = "Set Canvas";
  static readonly params = {};
  static readonly defaults = {};

  execute(): void {
    // The canvas is actually passed in the message event's ports/transferables
    // We need to handle this specially in MessageHandler
    const { canvasId } = this.conf;
    
    // Access the canvas from the message event
    // This will be set by a custom handler in WorkerState
    console.log(`Canvas "${canvasId}" received in worker`);
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/*
// --- Main Thread (main.ts) ---
import { MainState } from "./MainState.ts";
import { MyCommand, AnotherCommand } from "./commands/index.ts";

// Create worker
const worker = new Worker("./worker.ts", { type: "module" });

// Initialize state
const mainState = MainState.initialize(worker);

// Register commands
mainState.getMessageHandler().registerCommands([
  MyCommand,
  AnotherCommand
]);

// Add canvas and transfer to worker
mainState
  .addCanvasById("canvas1", true)  // Auto-transfer
  .addCanvasById("canvas2", false); // Keep in main

// Or add manually
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
mainState.addCanvas("myCanvas", canvas, true);

// Later, anywhere in your code:
const state = MainState.getInstance();
const handler = state.getMessageHandler();
handler.send({ func: "render", canvasId: "canvas1" });


// --- Worker Thread (worker.ts) ---
import { WorkerState } from "./WorkerState.ts";
import { RenderCommand, UpdateCommand } from "./commands/index.ts";

// Initialize state
const workerState = WorkerState.initialize();

// Register commands
workerState.getMessageHandler().registerCommands([
  RenderCommand,
  UpdateCommand
]);

// Use canvas in commands:
class RenderCommand extends BaseCommand<{ func: "render"; canvasId: string }> {
  static readonly func = "render";
  static readonly group = "graphics";
  static readonly name = "Render";
  static readonly params = {};
  static readonly defaults = {};

  execute(): void {
    const state = WorkerState.getInstance();
    const ctx = state.getContext(this.conf.canvasId);
    
    if (ctx) {
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, 100, 100);
    }
  }
}
*/