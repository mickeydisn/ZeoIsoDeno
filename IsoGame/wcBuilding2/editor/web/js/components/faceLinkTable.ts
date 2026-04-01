/**
 * Face Link Table Component — Face Links Table Editor
 *
 * Renders a table with columns: From, To, Actions
 * Shows only unique pairs (no bidirectional duplicates).
 * Allows adding and deleting face link pairs.
 */

// ============================================================================
// Face Link Table Class
// ============================================================================

export class FaceLinkTable {
  private container: HTMLElement;
  private faceLinks: [string, string][];
  private allFaceKeys: string[];
  private onChange: (updatedFaceLinks: [string, string][]) => void;

  constructor(
    container: HTMLElement,
    faceLinks: [string, string][],
    allFaceKeys: string[],
    onChange: (updatedFaceLinks: [string, string][]) => void
  ) {
    this.container = container;
    this.faceLinks = [...faceLinks];
    this.allFaceKeys = [...allFaceKeys];
    this.onChange = onChange;
  }

  /**
   * Render the face link table into the container.
   */
  render(): void {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "face-link-table-wrapper";

    // Table
    const table = document.createElement("table");
    table.className = "face-link-table";

    // Header
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>From</th>
        <th>To</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");

    for (let i = 0; i < this.faceLinks.length; i++) {
      const [from, to] = this.faceLinks[i];
      tbody.appendChild(this.renderLinkRow(from, to, i));
    }

    if (this.faceLinks.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `<td colspan="3" class="empty-cell">No face links configured</td>`;
      tbody.appendChild(emptyRow);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);

    // Helper text
    const helper = document.createElement("div");
    helper.className = "face-link-helper";
    helper.textContent =
      "Note: Each pair expands to bidirectional at save time: [a,b] ↔ [b,a]";
    wrapper.appendChild(helper);

    // Add Link Section
    wrapper.appendChild(this.renderAddLinkSection());

    this.container.appendChild(wrapper);
  }

  /**
   * Render a single link row.
   */
  private renderLinkRow(from: string, to: string, index: number): HTMLElement {
    const tr = document.createElement("tr");

    // From cell
    const fromTd = document.createElement("td");
    const fromSelect = this.createFaceKeySelect(from, "from", index);
    fromTd.appendChild(fromSelect);
    tr.appendChild(fromTd);

    // To cell
    const toTd = document.createElement("td");
    const toSelect = this.createFaceKeySelect(to, "to", index);
    toTd.appendChild(toSelect);
    tr.appendChild(toTd);

    // Actions cell
    const actionsTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon btn-danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete face link";
    deleteBtn.addEventListener("click", () => {
      this.faceLinks.splice(index, 1);
      this.onChange([...this.faceLinks]);
      this.render();
    });
    actionsTd.appendChild(deleteBtn);
    tr.appendChild(actionsTd);

    return tr;
  }

  /**
   * Create a face key dropdown with all available keys.
   */
  private createFaceKeySelect(
    value: string,
    direction: "from" | "to",
    rowIndex: number
  ): HTMLSelectElement {
    const select = document.createElement("select");
    select.className = "face-key-select";
    select.innerHTML = '<option value="">— Select —</option>';

    for (const key of this.allFaceKeys) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      if (key === value) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    select.addEventListener("change", () => {
      const selectedKey = select.value;
      if (!selectedKey) return;
      const [currentFrom, currentTo] = this.faceLinks[rowIndex];
      this.faceLinks[rowIndex] =
        direction === "from"
          ? [selectedKey, currentTo]
          : [currentFrom, selectedKey];
      this.onChange([...this.faceLinks]);
    });

    return select;
  }

  /**
   * Render the add link section.
   */
  private renderAddLinkSection(): HTMLElement {
    const addSection = document.createElement("div");
    addSection.className = "face-link-add-section";

    const label = document.createElement("label");
    label.textContent = "Add Link: ";
    addSection.appendChild(label);

    // From dropdown
    const fromSelect = document.createElement("select");
    fromSelect.className = "face-link-from";
    fromSelect.innerHTML = '<option value="">From</option>';
    for (const key of this.allFaceKeys) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      fromSelect.appendChild(option);
    }
    addSection.appendChild(fromSelect);

    const toLabel = document.createElement("span");
    toLabel.className = "link-arrow";
    toLabel.textContent = " → ";
    addSection.appendChild(toLabel);

    // To dropdown
    const toSelect = document.createElement("select");
    toSelect.className = "face-link-to";
    toSelect.innerHTML = '<option value="">To</option>';
    for (const key of this.allFaceKeys) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      toSelect.appendChild(option);
    }
    addSection.appendChild(toSelect);

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    addBtn.className = "btn-small";
    addBtn.addEventListener("click", () => {
      const fromVal = fromSelect.value;
      const toVal = toSelect.value;
      if (!fromVal || !toVal) {
        alert("Please select both From and To face keys");
        return;
      }
      if (fromVal === toVal) {
        alert("From and To must be different");
        return;
      }

      // Check for duplicates (considering unique pairs)
      const alreadyExists = this.faceLinks.some(
        ([a, b]) => (a === fromVal && b === toVal) || (a === toVal && b === fromVal)
      );
      if (alreadyExists) {
        alert("This pair already exists in bidirectional form");
        return;
      }

      // Normalize to canonical form (sorted alphabetically)
      const pair = fromVal < toVal ? [fromVal, toVal] : [toVal, fromVal];
      this.faceLinks.push(pair as [string, string]);
      this.onChange([...this.faceLinks]);
      this.render();
    });
    addSection.appendChild(addBtn);

    return addSection;
  }

  /**
   * Update the data and re-render.
   */
  update(faceLinks: [string, string][], allFaceKeys?: string[]): void {
    this.faceLinks = [...faceLinks];
    if (allFaceKeys) {
      this.allFaceKeys = [...allFaceKeys];
    }
    this.render();
  }

  /**
   * Cleanup.
   */
  destroy(): void {
    // Nothing to clean up
  }
}