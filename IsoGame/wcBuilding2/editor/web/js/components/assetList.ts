/**
 * AssetListEditor — Tile Asset List Editor Component
 *
 * Provides CRUD operations for tile assets with support for:
 * - Layer management (h: 0, 1, 2)
 * - Asset key selection with autocomplete
 * - Rotation selector (0°, 90°, 180°, 270°)
 * - Suffix input with color picker integration
 * - Height layer selector
 * - Template reference resolution ({WALL_SUFFIX} → preview value)
 */

import type { WcConfTileAsset } from "../../../types.ts";
import { ColorPicker } from "./colorPicker.ts";

export interface AssetListEditorOptions {
  /** Current asset list */
  assets: WcConfTileAsset[];
  /** Available asset keys from /editor/assets/list */
  availableAssets: { key: string; category: string; filename: string }[];
  /** Collection params for resolving template references */
  collectionParams?: Record<string, string | number | boolean>;
  /** Template parameter names for color picker */
  templateParams?: string[];
  /** Callback when assets change */
  onChange: (updatedAssets: WcConfTileAsset[]) => void;
}

const ROTATION_LABELS = ["0°", "90°", "180°", "270°"];

export class AssetListEditor {
  private container: HTMLElement;
  private options: AssetListEditorOptions;
  private assets: WcConfTileAsset[];

  constructor(
    container: HTMLElement,
    options: AssetListEditorOptions
  ) {
    this.container = container;
    this.options = options;
    this.assets = [...(options.assets || [])];
  }

  /**
   * Render the asset list editor.
   */
  render(): void {
    this.container.innerHTML = "";
    this.container.className = "asset-list-editor";

    // Header with count
    const header = document.createElement("div");
    header.className = "asset-list-header";
    header.innerHTML = `<strong>Assets (${this.assets.length})</strong>`;
    this.container.appendChild(header);

    // Asset rows
    const rowsContainer = document.createElement("div");
    rowsContainer.className = "asset-rows";
    this.assets.forEach((asset, index) => {
      rowsContainer.appendChild(this.createAssetRow(asset, index));
    });
    this.container.appendChild(rowsContainer);

    // Add asset section
    const addSection = document.createElement("div");
    addSection.className = "asset-add-section";

    const addBtn = document.createElement("button");
    addBtn.className = "btn-small primary";
    addBtn.textContent = "➕ Add Asset";

    const addDropdown = document.createElement("select");
    addDropdown.className = "add-asset-select";
    addDropdown.style.display = "none";

    // Default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Select asset —";
    addDropdown.appendChild(defaultOption);

    // Group assets by category
    const categories = new Map<string, typeof this.options.availableAssets>();
    this.options.availableAssets.forEach((asset) => {
      const cat = asset.category || "Other";
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(asset);
    });

    categories.forEach((items, cat) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = cat;
      items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.key;
        option.textContent = item.key;
        optgroup.appendChild(option);
      });
      addDropdown.appendChild(optgroup);
    });

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "btn-small primary";
    confirmBtn.textContent = "Confirm";
    confirmBtn.style.display = "none";

    addBtn.addEventListener("click", () => {
      const isVisible = addDropdown.style.display !== "none";
      addDropdown.style.display = isVisible ? "none" : "inline-block";
      confirmBtn.style.display = isVisible ? "none" : "inline-block";
    });

    confirmBtn.addEventListener("click", () => {
      const selectedKey = addDropdown.value;
      if (!selectedKey) return;

      const newAsset: WcConfTileAsset = {
        key: selectedKey,
        keyR: 0,
        sufix: "",
        h: 0,
      };
      this.assets.push(newAsset);
      this.onAssetsChange();

      // Reset dropdown
      addDropdown.value = "";
      addDropdown.style.display = "none";
      confirmBtn.style.display = "none";
    });

    addSection.appendChild(addBtn);
    addSection.appendChild(addDropdown);
    addSection.appendChild(confirmBtn);
    this.container.appendChild(addSection);
  }

  /**
   * Create a single asset row.
   */
  private createAssetRow(asset: WcConfTileAsset, index: number): HTMLElement {
    const row = document.createElement("div");
    row.className = "asset-row";

    // Layer indicator
    const layer = document.createElement("span");
    layer.className = "asset-layer";
    layer.textContent = `h:${asset.h ?? 0}`;
    row.appendChild(layer);

    // Asset Key dropdown
    const keySelect = document.createElement("select");
    keySelect.className = "asset-key-select";
    keySelect.title = "Asset Key";

    // Default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Select —";
    if (!asset.key) defaultOption.selected = true;
    keySelect.appendChild(defaultOption);

    // Available assets grouped by category
    const categories = new Map<string, typeof this.options.availableAssets>();
    this.options.availableAssets.forEach((a) => {
      const cat = a.category || "Other";
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(a);
    });

    categories.forEach((items, cat) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = cat;
      items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.key;
        option.textContent = item.key;
        if (item.key === asset.key) option.selected = true;
        optgroup.appendChild(option);
      });
      keySelect.appendChild(optgroup);
    });

    keySelect.addEventListener("change", () => {
      this.assets[index].key = keySelect.value || undefined;
      this.onAssetsChange();
    });
    row.appendChild(keySelect);

    // Rotation selector
    const rotSelect = document.createElement("select");
    rotSelect.className = "asset-rotation-select";
    rotSelect.title = "Rotation";
    [0, 1, 2, 3].forEach((val) => {
      const option = document.createElement("option");
      option.value = String(val);
      option.textContent = ROTATION_LABELS[val];
      if (asset.keyR === val) option.selected = true;
      rotSelect.appendChild(option);
    });
    rotSelect.addEventListener("change", () => {
      this.assets[index].keyR = parseInt(rotSelect.value, 10) || 0;
      this.onAssetsChange();
    });
    row.appendChild(rotSelect);

    // Suffix input with color picker button
    const suffixContainer = document.createElement("div");
    suffixContainer.className = "asset-suffix-container";

    const suffixInput = document.createElement("input");
    suffixInput.type = "text";
    suffixInput.className = "asset-suffix-input";
    suffixInput.placeholder = "Suffix";
    suffixInput.value = asset.sufix || "";
    suffixInput.title = "Color filter suffix (e.g., #H210_C115_S35_B120 or {WALL_SUFFIX})";

    // Resolve template reference for display
    const resolvedSuffix = this.resolveTemplateRef(asset.sufix || "");
    if (resolvedSuffix && resolvedSuffix !== (asset.sufix || "")) {
      suffixInput.placeholder = `e.g., ${resolvedSuffix}`;
    }

    suffixInput.addEventListener("input", () => {
      this.assets[index].sufix = suffixInput.value;
      this.onAssetsChange();
    });
    suffixContainer.appendChild(suffixInput);

    // Color picker button
    const pickerBtn = document.createElement("button");
    pickerBtn.className = "btn-icon color-picker-btn";
    pickerBtn.textContent = "🎨";
    pickerBtn.title = "Open color picker";

    const pickerContainer = document.createElement("div");
    pickerContainer.className = "color-picker-popup hidden";

    pickerBtn.addEventListener("click", () => {
      pickerContainer.classList.toggle("hidden");
      if (!pickerContainer.classList.contains("hidden") && !pickerContainer.dataset.initialized) {
        pickerContainer.dataset.initialized = "true";
        const cp = new ColorPicker(pickerContainer, {
          initialValue: asset.sufix || "",
          templateParams: this.options.templateParams,
          onChange: (suffix) => {
            this.assets[index].sufix = suffix;
            suffixInput.value = suffix;
            this.onAssetsChange();
          },
        });
        cp.render();
      }
    });

    // Close picker when clicking outside
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!pickerContainer.contains(target) && target !== pickerBtn) {
        pickerContainer.classList.add("hidden");
      }
    });

    suffixContainer.appendChild(pickerBtn);
    suffixContainer.appendChild(pickerContainer);
    row.appendChild(suffixContainer);

    // Height selector
    const heightSelect = document.createElement("select");
    heightSelect.className = "asset-height-select";
    heightSelect.title = "Height layer";
    [0, 1, 2].forEach((val) => {
      const option = document.createElement("option");
      option.value = String(val);
      option.textContent = `h:${val}`;
      if ((asset.h ?? 0) === val) option.selected = true;
      heightSelect.appendChild(option);
    });
    heightSelect.addEventListener("change", () => {
      this.assets[index].h = parseInt(heightSelect.value, 10) || 0;
      // Update layer indicator
      layer.textContent = `h:${this.assets[index].h}`;
      this.onAssetsChange();
    });
    row.appendChild(heightSelect);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon btn-danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete asset";
    deleteBtn.addEventListener("click", () => {
      this.assets.splice(index, 1);
      this.onAssetsChange();
    });
    row.appendChild(deleteBtn);

    return row;
  }

  /**
   * Resolve template reference to its value.
   * E.g., {WALL_SUFFIX} → resolved value from collectionParams
   */
  private resolveTemplateRef(value: string): string {
    if (!value.startsWith("{") || !value.endsWith("}")) return value;
    const paramName = value.slice(1, -1);
    const params = this.options.collectionParams || {};
    const resolved = params[paramName];
    if (resolved !== undefined) return String(resolved);
    return value;
  }

  /**
   * Notify change and re-render.
   */
  private onAssetsChange(): void {
    this.options.onChange([...this.assets]);
    this.render();
  }

  /**
   * Get current assets.
   */
  getAssets(): WcConfTileAsset[] {
    return [...this.assets];
  }

  /**
   * Set assets and re-render.
   */
  setAssets(assets: WcConfTileAsset[]): void {
    this.assets = [...assets];
    this.render();
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.container.innerHTML = "";
  }
}