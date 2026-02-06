// --- 1. Copied Point Class ---

// Configure the main LVL Diff factor display on the grid ( Transform real Lvl Diff to Pixel Diff)
const ISO_LVL_SCALE = 39;

/**
 * Represents a 3D point (x, y, z) in the isometric space.
 */
export class PointIso {
    x: number;
    y: number;
    z: number;
  
    static ORIGIN = new PointIso(0, 0, 0);
  
    constructor(x: number = 0, y: number = 0, z: number = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  
    /** Translate a point from a given dx, dy, and dz */
    translate(dx: number = 0, dy: number = 0, dz: number = 0): PointIso {
      return new PointIso(this.x + dx, this.y + dy, this.z + dz);
    }
  
    // NOTE: Other Point methods (scale, rotateX/Y/Z, depth) are omitted for simplicity 
    // as they were not directly used in the projection logic, but can be added back if needed.
    
    depth(): number {
      return this.x + this.y - 2 * this.z;
    }
  }
  
  // --- 2. Configuration Defaults (Inferred from Isomer.ts) ---
  
  /**
   * Default configuration for the Isometric Projector, mirroring the original setup.
   * Users can provide a partial object to override these.
   */
  const IsometricConfDefaults = {
    SCALE_SIZE: 1,         // Base scale for 1x1 tile size
    SCALE_MOD: 1,           // Scale modifier (often unused in projection)
    ISO_LVL_SCALE: 39,      // Z-axis scale factor (from original isomer.ts)
    originX: 0,             // X-offset for the map origin
    originY: 660,           // Fixed Y-offset for the map origin (from original isomer.ts)
    offsetX: 0,             // Panning offset X
    offsetY: 0,             // Panning offset Y
  };
  
  // Define the type alias for ease of use
  export type IsometricConf = typeof IsometricConfDefaults;
  
  
  // --- 3. Isometric Projector Class ---
  
  /**
   * Independent class to handle the core isometric 3D-to-2D projection (translatePoint) 
   * logic, decoupled from the main Isomer drawing class, and initialized with defaults.
   */
  export class IsometricProjector {
    public conf: IsometricConf;
    private transformation!: number[][];

    /**
     * Initializes the projector.
     * @param overrides Optional partial configuration to override defaults.
     */
    constructor(overrides: Partial<IsometricConf> = {}) {
      // Merge overrides with defaults
      this.conf = { ...IsometricConfDefaults, ...overrides };
      this.updateConf();
    }
  
    updateConf(overrides: Partial<IsometricConf> = {}) {
        // Merge overrides with defaults
        this.conf = { ...this.conf, ...overrides };
        this.transformation = [
            [32 * this.conf.SCALE_SIZE, 16 * this.conf.SCALE_SIZE], // ISOSCALE * Math.cos(this.angle), ISOSCALE * Math.sin(this.angle)
            [-32 * this.conf.SCALE_SIZE, 16 * this.conf.SCALE_SIZE], // ISOSCALE * Math.cos(Math.PI - this.angle), ISOSCALE * Math.sin(Math.PI - this.angle)
        ];
    }
    /**
     * Projects a 3D Point to 2D screen coordinates.
     * This is the core 3D -> 2D isometric translation function.
     * * @param point The 3D Point object to translate.
     * @returns An object containing the projected screen coordinates { x: number, y: number }.
     */
    /**
     * Translates a 3D point to a 2D isometric projection.
     */
    translatePoint(_point: PointIso): PointIso {
        const point = _point.translate(-this.conf.offsetX, -this.conf.offsetY, 0);
        const xMap = new PointIso(
        point.x * this.transformation[0][0],
        point.x * this.transformation[0][1],
        );

        const yMap = new PointIso(
        point.y * this.transformation[1][0],
        point.y * this.transformation[1][1],
        );

        const x = this.conf.originX + xMap.x + yMap.x;
        const y = this.conf.originY - xMap.y - yMap.y -
            point.z * ISO_LVL_SCALE / this.conf.SCALE_MOD;

        return new PointIso(x, y);
    }
  }