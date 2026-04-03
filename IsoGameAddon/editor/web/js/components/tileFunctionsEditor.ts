/**
 * TileFunctionsEditor — Terrain Function Management Widget
 *
 * Renders and manages editing of tile terrain functions:
 * - Function name selection (lvlAvgSquare, lvlAvg, lvlDiff)
 * - Size input (grid size for the function)
 * - Add/delete function operations
 *
 * Uses document.createElement exclusively (no innerHTML for data binding).
 */

import type { WcConfTileFunction } from "../../../types.ts";

// ============================================================================
// Constants
// ============================================================================

/** Available terrain function names */
const FUNCTION_NAMES = ["lvlAvgSquare", "lvlAvg", "lvlDiff"] as const;

/** Default size for new functions */
const DEFAULT_FUNCTION_SIZE = 5;

// ============================================================================
// Change event
// ============================================================================

export type FunctionsChangeHandler = (functions: WcConfTileFunction[]) => void;

// ============================================================================
// TileFunctionsEditor Class
// ============================================================================

export class TileFunctionsEditor {
  private container: HTMLElement;
  private functions: WcConfTileFunction[];
  private onChange: FunctionsChangeHandler;
  private headerElement: HTMLElement | null = null;

  constructor(
    container: HTMLElement,
    functions: WcConfTileFunction[],
    onChange: FunctionsChangeHandler
  ) {
    this.container = container;
    this.functions = [...functions];
    this.onChange = onChange;
  }

  /**
   * Render the functions editor.
   */
  render(): void {
    this.container.innerHTML = "";
    this.container.className = "tile-functions-editor";

    // Table
    const table = this.createTable();
    this.container.appendChild(table);
  }

  /**
   * Create the functions table.
   */
  private createTable(): HTMLElement {
    const table = document.createElement("table");
    table.className = "function-table";

    // Table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const nameHeader = document.createElement("th");
    nameHeader.textContent = "Function Name";
    headerRow.appendChild(nameHeader);

    const sizeHeader = document.createElement("th");
    sizeHeader.textContent = "Size";
    headerRow.appendChild(sizeHeader);

    const actionsHeader = document.createElement("th");
    actionsHeader.textContent = "Actions";
    headerRow.appendChild(actionsHeader);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement("tbody");

    // Render existing functions
    this.functions.forEach((func, index) => {
      tbody.appendChild(this.createFunctionRow(func, index));
    });

    // Add new function row
    tbody.appendChild(this.createAddRow());

    table.appendChild(tbody);

    return table;
  }

  /**
   * Create a row for an existing function.
   */
  private createFunctionRow(func: WcConfTileFunction, index: number): HTMLElement {
    const tr = document.createElement("tr");

    // Function name dropdown
    const funcNameTd = document.createElement("td");
    const funcSelect = this.createFunctionSelect(func.key);
    funcSelect.addEventListener("change", () => {
      this.functions[index].key = funcSelect.value;
      this.notifyChange();
    });
    funcNameTd.appendChild(funcSelect);
    tr.appendChild(funcNameTd);

    // Size input
    const sizeTd = document.createElement("td");
    const sizeInput = this.createSizeInput(func.size ?? DEFAULT_FUNCTION_SIZE);
    sizeInput.addEventListener("change", () => {
      this.functions[index].size = parseInt(sizeInput.value, 10) || DEFAULT_FUNCTION_SIZE;
      this.notifyChange();
    });
    sizeTd.appendChild(sizeInput);
    tr.appendChild(sizeTd);

    // Delete button
    const actionsTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-small btn-danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", () => {
      this.functions.splice(index, 1);
      this.notifyChange();
      this.render();
    });
    actionsTd.appendChild(deleteBtn);
    tr.appendChild(actionsTd);

    return tr;
  }

  /**
   * Create the add new function row.
   */
  private createAddRow(): HTMLElement {
    const addRow = document.createElement("tr");
    addRow.className = "function-add-row";

    // Function name select
    const nameTd = document.createElement("td");
    const funcSelect = this.createFunctionSelect(undefined, true);
    funcSelect.id = "new-func-name";
    nameTd.appendChild(funcSelect);
    addRow.appendChild(nameTd);

    // Size input
    const sizeTd = document.createElement("td");
    const sizeInput = this.createSizeInput(DEFAULT_FUNCTION_SIZE);
    sizeInput.id = "new-func-size";
    sizeTd.appendChild(sizeInput);
    addRow.appendChild(sizeTd);

    // Add button
    const actionsTd = document.createElement("td");
    const addBtn = document.createElement("button");
    addBtn.className = "btn-small primary";
    addBtn.textContent = "➕ Add";
    addBtn.addEventListener("click", () => {
      this.handleAddFunction();
    });
    actionsTd.appendChild(addBtn);
    addRow.appendChild(actionsTd);

    return addRow;
  }

  /**
   * Create a function name select element.
   */
  private createFunctionSelect(selectedKey?: string, includePlaceholder = false): HTMLSelectElement {
    const select = document.createElement("select");
    select.className = "func-select";

    if (includePlaceholder) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "— Select —";
      select.appendChild(placeholder);
    }

    for (const name of FUNCTION_NAMES) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      if (selectedKey === name) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    return select;
  }

  /**
   * Create a size input element.
   */
  private createSizeInput(value: number): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "func-size-input";
    input.min = "1";
    input.value = String(value);
    return input;
  }

  /**
   * Handle adding a new function.
   */
  private handleAddFunction(): void {
    const funcSelect = this.container.querySelector("#new-func-name") as HTMLSelectElement | null;
    const sizeInput = this.container.querySelector("#new-func-size") as HTMLInputElement | null;

    const funcName = funcSelect?.value;
    const funcSize = parseInt(sizeInput?.value || String(DEFAULT_FUNCTION_SIZE), 10);

    if (!funcName) {
      // Validation feedback - shake the select element
      if (funcSelect) {
        funcSelect.focus();
        funcSelect.classList.add("input-error");
        setTimeout(() => funcSelect.classList.remove("input-error"), 500);
      }
      return;
    }

    this.functions.push({
      key: funcName,
      size: funcSize || DEFAULT_FUNCTION_SIZE,
    });

    this.notifyChange();
    this.render();
  }

  /**
   * Notify the parent of changes.
   */
  private notifyChange(): void {
    this.onChange([...this.functions]);
  }

  /**
   * Get current functions data.
   */
  getFunctions(): WcConfTileFunction[] {
    return [...this.functions];
  }

  /**
   * Update functions data and re-render.
   */
  setFunctions(functions: WcConfTileFunction[]): void {
    this.functions = [...functions];
    this.render();
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.container.innerHTML = "";
    this.headerElement = null;
  }
}