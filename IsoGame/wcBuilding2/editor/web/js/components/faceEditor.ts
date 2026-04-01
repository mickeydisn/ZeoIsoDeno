/**
 * FaceEditor — 4-Direction Face Configuration Widget
 *
 * Renders a diamond/compass layout showing 4 face directions (NW, NE, SE, SW)
 * with color-coded dropdowns for face key selection.
 */

export interface FaceEditorOptions {
  /** Current face values: [NW, NE, SE, SW] */
  faceValues: (string | null)[];
  /** All available face keys for dropdown options */
  faceKeys: string[];
  /** Callback when face values change */
  onChange: (updatedFace: (string | null)[]) => void;
}

// Color mapping by face key prefix
const FACE_KEY_COLORS: Record<string, string> = {
  "WH_": "#4a9eff",  // blue - Wall House
  "F_": "#4caf50",   // green - Fence
  "FP_": "#009688",  // teal - Fence Platform
  "E_": "#ff9800",   // orange - Entrance
  "X_": "#9e9e9e",   // grey - Unknown/Internal
  "G_": "#9c27b0",   // purple - Grave
  "L_": "#795548",   // brown - Lab
  "C_": "#607d8b",   // blue-grey - Corridor
  "Wr": "#4a9eff",
  "Wl": "#4a9eff",
  "Wout": "#4caf50",
  "Win": "#ff9800",
  "A": "#9e9e9e",
};

const DIRECTION_LABELS = ["NW", "NE", "SE", "SW"];

export class FaceEditor {
  private container: HTMLElement;
  private options: FaceEditorOptions;
  private faceValues: (string | null)[];

  constructor(
    container: HTMLElement,
    faceValues: (string | null)[],
    faceKeys: string[],
    onChange: (updatedFace: (string | null)[]) => void
  ) {
    this.container = container;
    this.faceValues = [...faceValues];
    this.options = { faceValues, faceKeys, onChange };
  }

  /**
   * Render the face editor widget.
   */
  render(): void {
    this.container.innerHTML = "";
    this.container.className = "face-editor";

    // Diamond layout:
    //        NW (0)
    //    SW (3)  NE (1)
    //        SE (2)
    const diamond = document.createElement("div");
    diamond.className = "face-diamond";

    const positions = [
      { row: 0, col: 1, dir: 0 },  // NW - top center
      { row: 1, col: 2, dir: 1 },  // NE - middle right
      { row: 2, col: 1, dir: 2 },  // SE - bottom center
      { row: 1, col: 0, dir: 3 },  // SW - middle left
    ];

    positions.forEach(({ row, col, dir }) => {
      const cell = this.createDirectionCell(dir);
      cell.style.gridRow = String(row + 1);
      cell.style.gridColumn = String(col + 1);
      diamond.appendChild(cell);
    });

    this.container.appendChild(diamond);
  }

  /**
   * Create a single direction cell with label and dropdown.
   */
  private createDirectionCell(direction: number): HTMLElement {
    const cell = document.createElement("div");
    cell.className = "face-direction-cell";

    // Label
    const label = document.createElement("div");
    label.className = "face-direction-label";
    label.textContent = `${DIRECTION_LABELS[direction]} (${direction})`;
    cell.appendChild(label);

    // Dropdown
    const select = document.createElement("select");
    select.className = "face-key-dropdown";
    select.dataset.direction = String(direction);

    // Current value
    const currentValue = this.faceValues[direction];

    // Null option
    const nullOption = document.createElement("option");
    nullOption.value = "";
    nullOption.textContent = "— null —";
    if (currentValue === null || currentValue === "") {
      nullOption.selected = true;
    }
    select.appendChild(nullOption);

    // Sorted face key options
    const sortedKeys = [...this.options.faceKeys].sort();
    sortedKeys.forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      if (key === currentValue) {
        option.selected = true;
      }

      // Color-code based on prefix
      const color = this.getFaceKeyColor(key);
      if (color) {
        option.style.color = color;
      }

      select.appendChild(option);
    });

    // Set border color based on current value
    const currentColor = currentValue ? this.getFaceKeyColor(currentValue) : null;
    if (currentColor) {
      select.style.borderColor = currentColor;
    }

    // Hover tooltip
    select.title = `Face ${DIRECTION_LABELS[direction]}: Select a face key for this direction`;

    // Change handler
    select.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const dir = parseInt(target.dataset.direction || "0", 10);
      const newValue = target.value || null;
      this.faceValues[dir] = newValue;

      // Update border color
      const color = newValue ? this.getFaceKeyColor(newValue) : null;
      target.style.borderColor = color || "";

      this.options.onChange([...this.faceValues]);
    });

    cell.appendChild(select);

    // Warning indicator if selected key has no matching weight entry (optional check)
    if (currentValue && !this.options.faceKeys.includes(currentValue)) {
      const warning = document.createElement("span");
      warning.className = "face-warning-badge";
      warning.textContent = "⚠️";
      warning.title = `Face key "${currentValue}" not found in known face keys`;
      cell.appendChild(warning);
    }

    return cell;
  }

  /**
   * Get color for a face key based on its prefix.
   */
  private getFaceKeyColor(key: string): string | null {
    for (const [prefix, color] of Object.entries(FACE_KEY_COLORS)) {
      if (key.startsWith(prefix) || key === prefix) {
        return color;
      }
    }
    return null;
  }

  /**
   * Update face values and re-render.
   */
  setFaceValues(values: (string | null)[]): void {
    this.faceValues = [...values];
    this.render();
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.container.innerHTML = "";
  }
}