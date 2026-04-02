/**
 * GroupEditor — Tile Group Configuration Editor Component
 *
 * Renders shared face editor + list of tile items with properties
 * for editing TileGroupConfig objects.
 */

import { FaceEditor } from "./faceEditor.ts";
import type { TileGroupConfig, TileGroupItem } from "../../../types.ts";

export interface GroupEditorOptions {
  /** Group configuration to edit */
  group: TileGroupConfig;
  /** All available face keys for dropdown options */
  faceKeys: string[];
  /** Callback when group is modified */
  onChange: (updatedGroup: TileGroupConfig) => void;
  /** Callback when group should be deleted */
  onDelete?: () => void;
}

export class GroupEditor {
  private container: HTMLElement;
  private options: GroupEditorOptions;
  private group: TileGroupConfig;
  private faceEditor: FaceEditor | null = null;

  constructor(
    container: HTMLElement,
    group: TileGroupConfig,
    faceKeys: string[],
    onChange: (updatedGroup: TileGroupConfig) => void,
    onDelete?: () => void
  ) {
    this.container = container;
    this.group = JSON.parse(JSON.stringify(group));
    this.options = { group, faceKeys, onChange, onDelete };
  }

  /**
   * Render the complete group editor.
   */
  render(): void {
    this.container.innerHTML = "";
    this.container.className = "group-editor";

    // Header section
    const header = this.createHeader();
    this.container.appendChild(header);

    // Shared face editor section
    const faceSection = this.createFaceSection();
    this.container.appendChild(faceSection);

    // Tile items list section
    const itemsSection = this.createItemsSection();
    this.container.appendChild(itemsSection);

    // Actions footer
    const footer = this.createFooter();
    this.container.appendChild(footer);
  }

  /**
   * Create editor header with group ID and controls.
   */
  private createHeader(): HTMLElement {
    const header = document.createElement("div");
    header.className = "group-header";

    const idInput = document.createElement("input");
    idInput.type = "text";
    idInput.className = "group-id-input";
    idInput.value = this.group.id;
    idInput.placeholder = "Group ID";
    idInput.addEventListener("change", (e) => {
      this.group.id = (e.target as HTMLInputElement).value;
      this.notifyChange();
    });

    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.className = "group-weight-input";
    weightInput.value = String(this.group.weight ?? 1);
    weightInput.min = "0";
    weightInput.step = "0.1";
    weightInput.placeholder = "Weight";
    weightInput.addEventListener("change", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.group.weight = isNaN(value) ? 1 : value;
      this.notifyChange();
    });

    header.appendChild(idInput);
    header.appendChild(weightInput);

    return header;
  }

  /**
   * Create shared face configuration section.
   */
  private createFaceSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "group-face-section";

    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = "Shared Face Configuration";
    section.appendChild(label);

    const faceContainer = document.createElement("div");
    faceContainer.className = "group-face-container";
    section.appendChild(faceContainer);

    this.faceEditor = new FaceEditor(
      faceContainer,
      this.group.face,
      this.options.faceKeys,
      (updatedFace) => {
        this.group.face = updatedFace;
        this.notifyChange();
      }
    );
    this.faceEditor.render();

    return section;
  }

  /**
   * Create tile items list section.
   */
  private createItemsSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "group-items-section";

    const header = document.createElement("div");
    header.className = "items-header";

    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = `Group Items (${this.group.items.length})`;

    const addButton = document.createElement("button");
    addButton.className = "add-item-button";
    addButton.textContent = "+ Add Item";
    addButton.addEventListener("click", () => {
      this.group.items.push({ weight: 1 });
      this.notifyChange();
      this.render();
    });

    header.appendChild(label);
    header.appendChild(addButton);
    section.appendChild(header);

    const itemsList = document.createElement("div");
    itemsList.className = "group-items-list";

    this.group.items.forEach((item, index) => {
      const itemRow = this.createItemRow(item, index);
      itemsList.appendChild(itemRow);
    });

    section.appendChild(itemsList);

    return section;
  }

  /**
   * Create single item row in items list.
   */
  private createItemRow(item: TileGroupItem, index: number): HTMLElement {
    const row = document.createElement("div");
    row.className = "group-item-row";

    const indexLabel = document.createElement("span");
    indexLabel.className = "item-index";
    indexLabel.textContent = `#${index + 1}`;

    const itemWeight = document.createElement("input");
    itemWeight.type = "number";
    itemWeight.className = "item-weight-input";
    itemWeight.value = String(item.weight ?? 1);
    itemWeight.min = "0";
    itemWeight.step = "0.1";
    itemWeight.addEventListener("change", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.group.items[index].weight = isNaN(value) ? 1 : value;
      this.notifyChange();
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-item-button";
    deleteButton.textContent = "×";
    deleteButton.title = "Remove item";
    deleteButton.addEventListener("click", () => {
      this.group.items.splice(index, 1);
      this.notifyChange();
      this.render();
    });

    row.appendChild(indexLabel);
    row.appendChild(itemWeight);
    row.appendChild(deleteButton);

    return row;
  }

  /**
   * Create footer action buttons.
   */
  private createFooter(): HTMLElement {
    const footer = document.createElement("div");
    footer.className = "group-footer";

    if (this.options.onDelete) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-group-button";
      deleteButton.textContent = "Delete Group";
      deleteButton.addEventListener("click", () => {
        this.options.onDelete?.();
      });
      footer.appendChild(deleteButton);
    }

    return footer;
  }

  /**
   * Notify parent of group changes.
   */
  private notifyChange(): void {
    this.options.onChange(JSON.parse(JSON.stringify(this.group)));
  }

  /**
   * Update group data and re-render.
   */
  setGroup(group: TileGroupConfig): void {
    this.group = JSON.parse(JSON.stringify(group));
    this.render();
  }

  /**
   * Cleanup component resources.
   */
  destroy(): void {
    this.faceEditor?.destroy();
    this.container.innerHTML = "";
  }
}