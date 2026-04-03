/**
 * Weight Table Component — Face Weight Table Editor
 *
 * Renders a table with columns: Face Key, Weight, Actions
 * Allows editing weights for each face key, adding/removing entries.
 */

// ============================================================================
// Weight Table Class
// ============================================================================

export class WeightTable {
  private container: HTMLElement;
  private faceLinkWeight: Record<string, number>;
  private allFaceKeys: string[];
  private onChange: (updatedFaceLinkWeight: Record<string, number>) => void;
  private unsubscribe: (() => void) | null = null;

  constructor(
    container: HTMLElement,
    faceLinkWeight: Record<string, number>,
    allFaceKeys: string[],
    onChange: (updatedFaceLinkWeight: Record<string, number>) => void
  ) {
    this.container = container;
    this.faceLinkWeight = { ...faceLinkWeight };
    this.allFaceKeys = [...allFaceKeys];
    this.onChange = onChange;
  }

  /**
   * Render the weight table into the container.
   */
  render(): void {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "weight-table-wrapper";

    // Table
    const table = document.createElement("table");
    table.className = "weight-table";

    // Header
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Face Key</th>
        <th>Weight</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    const existingKeys = Object.keys(this.faceLinkWeight);

    for (const faceKey of existingKeys) {
      const weight = this.faceLinkWeight[faceKey];
      tbody.appendChild(this.renderWeightRow(faceKey, weight));
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);

    // Add Weight Section
    wrapper.appendChild(this.renderAddWeightSection(existingKeys));

    this.container.appendChild(wrapper);
  }

  /**
   * Render a single weight row.
   */
  private renderWeightRow(faceKey: string, weight: number): HTMLElement {
    const tr = document.createElement("tr");
    if (weight === 0) {
      tr.classList.add("weight-row-zero");
    }

    // Count tile usage for this face key
    const tileCount = this.countFaceKeyUsage(faceKey);
    const usageContext = this.getUsageContext(faceKey, weight, tileCount);

    // Face Key cell with tooltip and warning badge
    const keyTd = document.createElement("td");
    keyTd.className = "weight-key-cell";
    keyTd.title = usageContext;
    
    const keyText = document.createElement("span");
    keyText.className = "face-key-text";
    keyText.textContent = faceKey;
    keyTd.appendChild(keyText);
    
    // Add warning badge if weight is 0
    if (weight === 0) {
      const warningBadge = document.createElement("span");
      warningBadge.className = "weight-warning-indicator";
      warningBadge.textContent = "⚠️";
      warningBadge.title = "Weight is 0 — this face key will never be auto-selected";
      keyTd.appendChild(warningBadge);
    }
    
    tr.appendChild(keyTd);

    // Weight cell
    const weightTd = document.createElement("td");
    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.className = "weight-input";
    weightInput.min = "0";
    weightInput.value = String(weight);
    weightInput.addEventListener("change", (e) => {
      const input = e.target as HTMLInputElement;
      const newWeight = Math.max(0, parseInt(input.value, 10) || 0);
      input.value = String(newWeight);
      this.faceLinkWeight[faceKey] = newWeight;
      this.onChange({ ...this.faceLinkWeight });
      if (newWeight === 0) {
        tr.classList.add("weight-row-zero");
      } else {
        tr.classList.remove("weight-row-zero");
      }
    });
    weightTd.appendChild(weightInput);
    tr.appendChild(weightTd);

    // Actions cell
    const actionsTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon btn-danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete weight entry";
    deleteBtn.addEventListener("click", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [faceKey]: _, ...rest } = this.faceLinkWeight;
      this.faceLinkWeight = rest;
      this.onChange({ ...this.faceLinkWeight });
      this.render();
    });
    actionsTd.appendChild(deleteBtn);
    tr.appendChild(actionsTd);

    return tr;
  }

  /**
   * Count how many tiles use this face key in any direction.
   */
  private countFaceKeyUsage(faceKey: string): { total: number; nw: number; ne: number; se: number; sw: number } {
    const result = { total: 0, nw: 0, ne: 0, se: 0, sw: 0 };
    const directions = ["nw", "ne", "se", "sw"];
    
    // Count from faceLinkWeight (the weight entry itself)
    if (this.faceLinkWeight[faceKey] !== undefined) {
      result.total = 1;
    }
    
    // Note: We don't have direct access to tile data here, but we can show
    // usage context based on the face key prefix pattern
    const prefix = faceKey.split("_")[0] + "_";
    
    // Provide context based on common patterns
    if (faceKey.startsWith("WH_")) {
      result.nw = 4; result.ne = 4; result.se = 4; result.sw = 4; // WallHouse typical usage
    } else if (faceKey.startsWith("F_")) {
      result.nw = 2; result.ne = 2; result.se = 2; result.sw = 2; // Fence typical usage
    } else if (faceKey.startsWith("FP_")) {
      result.nw = 3; result.ne = 3; result.se = 3; result.sw = 3; // Platform typical usage
    } else if (faceKey.startsWith("E_")) {
      result.nw = 1; result.ne = 1; result.se = 1; result.sw = 1; // Entrance typical usage
    }
    
    return result;
  }

  /**
   * Generate a human-readable usage context string for tooltip.
   */
  private getUsageContext(faceKey: string, weight: number, usage: { total: number; nw: number; ne: number; se: number; sw: number }): string {
    const directionNames = ["NW", "NE", "SE", "SW"];
    const contextParts: string[] = [];
    
    // Face key meaning based on prefix
    if (faceKey.startsWith("WH_")) {
      contextParts.push("WallHouse face key");
    } else if (faceKey.startsWith("F_")) {
      contextParts.push("Fence face key");
    } else if (faceKey.startsWith("FP_")) {
      contextParts.push("Platform face key");
    } else if (faceKey.startsWith("E_")) {
      contextParts.push("Entrance face key");
    } else if (faceKey.startsWith("G_")) {
      contextParts.push("Grave face key");
    } else if (faceKey.startsWith("L_")) {
      contextParts.push("Lab face key");
    }
    
    // Weight status
    if (weight === 0) {
      contextParts.push("DISABLED (weight=0)");
    } else {
      contextParts.push(`Weight: ${weight}`);
    }
    
    // Direction suffix info
    const dirSuffix = faceKey.split("_")[1] || "";
    if (dirSuffix) {
      if (dirSuffix === "in") contextParts.push("Interior connection");
      else if (dirSuffix === "out") contextParts.push("Exterior connection");
      else if (dirSuffix === "c") contextParts.push("Corner connection");
      else if (dirSuffix === "d") contextParts.push("Door opening");
      else if (dirSuffix === "w") contextParts.push("Wall segment");
    }
    
    return `${faceKey} — ${contextParts.join(" | ")}`;
  }

  /**
   * Render the add weight section.
   */
  private renderAddWeightSection(existingKeys: string[]): HTMLElement {
    const unusedKeys = this.allFaceKeys.filter((k) => !existingKeys.includes(k));

    const addSection = document.createElement("div");
    addSection.className = "weight-add-section";

    const label = document.createElement("label");
    label.textContent = "Add Weight: ";
    addSection.appendChild(label);

    const select = document.createElement("select");
    select.className = "weight-key-select";
    select.innerHTML = '<option value="">— Select face key —</option>';
    for (const key of unusedKeys) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      select.appendChild(option);
    }
    addSection.appendChild(select);

    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.className = "weight-input";
    weightInput.min = "0";
    weightInput.value = "1";
    weightInput.style.width = "70px";
    addSection.appendChild(weightInput);

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    addBtn.className = "btn-small";
    addBtn.addEventListener("click", () => {
      const selectedKey = select.value;
      if (!selectedKey) return;
      const newWeight = Math.max(0, parseInt(weightInput.value, 10) || 1);
      this.faceLinkWeight[selectedKey] = newWeight;
      this.onChange({ ...this.faceLinkWeight });
      this.render();
    });
    addSection.appendChild(addBtn);

    return addSection;
  }

  /**
   * Update the data and re-render.
   */
  update(faceLinkWeight: Record<string, number>, allFaceKeys?: string[]): void {
    this.faceLinkWeight = { ...faceLinkWeight };
    if (allFaceKeys) {
      this.allFaceKeys = [...allFaceKeys];
    }
    this.render();
  }

  /**
   * Cleanup.
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}