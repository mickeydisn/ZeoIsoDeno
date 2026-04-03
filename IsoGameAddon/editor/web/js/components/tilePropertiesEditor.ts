/**
 * TilePropertiesEditor — Tile Basic Properties Widget
 *
 * Renders and manages editing of basic tile properties:
 * - Tile ID
 * - Weight (0-∞)
 * - Boolean flags: allowMove, isFrise, empty
 * - Optional Height (h)
 * - Optional Level (lvl)
 *
 * Uses document.createElement exclusively (no innerHTML for data binding).
 */

import type { TileConfig } from "../../../types.ts";

// ============================================================================
// Property configuration
// ============================================================================

interface BooleanPropDef {
  key: keyof TileConfig;
  label: string;
  title: string;
}

const BOOLEAN_PROPS: BooleanPropDef[] = [
  { key: "allowMove", label: "Allow Move", title: "Allow terrain modification on this tile" },
  { key: "isFrise", label: "Is Frise", title: "Decorative tile (no collision)" },
  { key: "empty", label: "Empty", title: "Empty tile (no assets rendered)" },
];

// ============================================================================
// Change event
// ============================================================================

export type PropertiesChangeHandler = (properties: Partial<TileConfig>) => void;

// ============================================================================
// TilePropertiesEditor Class
// ============================================================================

export class TilePropertiesEditor {
  private container: HTMLElement;
  private tile: TileConfig;
  private onChange: PropertiesChangeHandler;
  private fieldElements: {
    tileId: HTMLInputElement;
    weight: HTMLInputElement;
    booleanFlags: Map<keyof TileConfig, HTMLInputElement>;
    height: HTMLInputElement;
    level: HTMLInputElement;
  } | null = null;

  constructor(
    container: HTMLElement,
    tile: TileConfig,
    onChange: PropertiesChangeHandler
  ) {
    this.container = container;
    this.tile = tile;
    this.onChange = onChange;
  }

  /**
   * Render the properties form.
   */
  render(): void {
    this.container.innerHTML = "";
    this.container.className = "tile-properties-editor";

    const form = document.createElement("div");
    form.className = "tile-properties-form";

    // Tile ID
    form.appendChild(this.createTileIdRow());

    // Weight
    form.appendChild(this.createWeightRow());

    // Boolean flags
    BOOLEAN_PROPS.forEach((def) => {
      form.appendChild(this.createBooleanRow(def));
    });

    // Height
    form.appendChild(this.createHeightRow());

    // Level
    form.appendChild(this.createLevelRow());

    this.container.appendChild(form);
  }

  /**
   * Create the tile ID input row.
   */
  private createTileIdRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "prop-row tile-id-row";

    const label = document.createElement("label");
    label.textContent = "Tile ID:";
    row.appendChild(label);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "tile-id-input";
    input.value = this.tile.id || "";
    input.addEventListener("input", () => {
      this.tile.id = input.value;
      this.onChange({ id: input.value });
    });
    row.appendChild(input);

    return row;
  }

  /**
   * Create the weight input row.
   */
  private createWeightRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "prop-row";

    const label = document.createElement("label");
    label.textContent = "Weight (0-∞):";
    row.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.className = "prop-input";
    input.min = "0";
    input.value = String(this.tile.weight ?? 0);
    input.addEventListener("change", () => {
      const val = Math.max(0, parseInt(input.value, 10) || 0);
      input.value = String(val);
      this.tile.weight = val;
      this.onChange({ weight: val });
    });
    row.appendChild(input);

    return row;
  }

  /**
   * Create a boolean checkbox row.
   */
  private createBooleanRow(def: BooleanPropDef): HTMLElement {
    const row = document.createElement("div");
    row.className = "prop-row prop-checkbox";

    const label = document.createElement("label");
    label.title = def.title;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!this.tile[def.key];
    checkbox.addEventListener("change", () => {
      (this.tile[def.key] as boolean) = checkbox.checked;
      this.onChange({ [def.key]: checkbox.checked });
    });
    label.appendChild(checkbox);

    const text = document.createTextNode(` ${def.label}`);
    label.appendChild(text);

    row.appendChild(label);
    return row;
  }

  /**
   * Create the height input row.
   */
  private createHeightRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "prop-row";

    const label = document.createElement("label");
    label.textContent = "Height (h):";
    row.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.className = "prop-input";
    input.min = "0";
    input.value = this.tile.h !== undefined ? String(this.tile.h) : "";
    input.addEventListener("change", () => {
      const val = input.value ? parseInt(input.value, 10) : undefined;
      this.tile.h = val;
      this.onChange({ h: val });
    });
    row.appendChild(input);

    return row;
  }

  /**
   * Create the level input row.
   */
  private createLevelRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "prop-row";

    const label = document.createElement("label");
    label.textContent = "Level (lvl):";
    row.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.className = "prop-input";
    input.value = this.tile.lvl !== undefined ? String(this.tile.lvl) : "";
    input.addEventListener("change", () => {
      const val = input.value ? parseInt(input.value, 10) : undefined;
      this.tile.lvl = val;
      this.onChange({ lvl: val });
    });
    row.appendChild(input);

    return row;
  }

  /**
   * Get current property values from the form.
   */
  getValues(): Partial<TileConfig> {
    return {
      id: this.tile.id,
      weight: this.tile.weight,
      allowMove: this.tile.allowMove,
      isFrise: this.tile.isFrise,
      empty: this.tile.empty,
      h: this.tile.h,
      lvl: this.tile.lvl,
    };
  }

  /**
   * Update the tile data and re-render.
   */
  setTile(tile: TileConfig): void {
    this.tile = tile;
    this.render();
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.container.innerHTML = "";
    this.fieldElements = null;
  }
}