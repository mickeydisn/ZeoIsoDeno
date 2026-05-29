/**
 * Craft / Edit Potion dialog.
 *
 * Allows the user to pick actions, configure their fields, order them,
 * name the potion, and save it.
 *
 * Section order: name -> action sequence (editable) -> action selector
 *                -> config -> add/update action -> save -> close
 */

import { DialogManager } from "../dialog.ts";
import { gobalMapState } from "@iso-game/handlers/game/mapState.ts";
import { ACTION_REGISTRY } from "@iso-game/map/action/actions/registry.ts";
import type { Potion, PotionActionEntry } from "@iso-game/handlers/game/mapState.ts";
import { uuid, renderField } from "./dialogHelpers.ts";

// ============================================================================
// HELPERS
// ============================================================================

function listCraftableActions() {
  return ACTION_REGISTRY.filter((a) => a.meta);
}

/** Send a save request to the worker (which persists to IndexedDB — the server truth) */
function sendSavePotion(potion: Potion, gameWorker: Worker): void {
  gameWorker.postMessage({ action: "savePotion", potion });
}

/** Sync inventory to worker so potionTool.ts can look up potions by ID */
function syncInventoryToWorker(gameWorker: Worker): void {
  gameWorker.postMessage({
    action: "syncInventory",
    inventory: gobalMapState.playerState.inventory,
  });
}

// ============================================================================
// RENDER PENDING ACTION LIST
// ============================================================================

function renderPendingActionList(
  container: HTMLElement,
  pendingActions: PotionActionEntry[],
  craftable: ReturnType<typeof listCraftableActions>,
  onEdit: (index: number) => void,
): void {
  container.innerHTML = "";
  if (pendingActions.length === 0) {
    container.innerHTML =
      `<div style="opacity:0.5;font-size:0.85rem;">No actions added yet.</div>`;
    return;
  }

  for (let i = 0; i < pendingActions.length; i++) {
    const entry = pendingActions[i];
    const actionObj = craftable.find((a) => a.key === entry.func);
    const label = actionObj?.meta?.label ?? entry.func;
    const configStr = Object.entries(entry.config)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");

    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;gap:8px;padding:4px 8px;background:#333;border-radius:4px;";

    // Move up
    const upBtn = document.createElement("button");
    upBtn.textContent = "↑";
    upBtn.title = "Move up";
    upBtn.style.cssText =
      "padding:2px 6px;border:none;border-radius:2px;background:#555;color:#fff;cursor:pointer;font-size:0.75rem;";
    upBtn.disabled = i === 0;
    upBtn.addEventListener("click", () => {
      if (i === 0) return;
      [pendingActions[i - 1], pendingActions[i]] = [
        pendingActions[i],
        pendingActions[i - 1],
      ];
      renderPendingActionList(container, pendingActions, craftable, onEdit);
    });
    row.appendChild(upBtn);

    // Move down
    const downBtn = document.createElement("button");
    downBtn.textContent = "↓";
    downBtn.title = "Move down";
    downBtn.style.cssText =
      "padding:2px 6px;border:none;border-radius:2px;background:#555;color:#fff;cursor:pointer;font-size:0.75rem;";
    downBtn.disabled = i === pendingActions.length - 1;
    downBtn.addEventListener("click", () => {
      if (i === pendingActions.length - 1) return;
      [pendingActions[i], pendingActions[i + 1]] = [
        pendingActions[i + 1],
        pendingActions[i],
      ];
      renderPendingActionList(container, pendingActions, craftable, onEdit);
    });
    row.appendChild(downBtn);

    // Action label
    const labelEl = document.createElement("span");
    labelEl.textContent = `${label}`;
    labelEl.style.cssText = "flex:1;font-size:0.85rem;";
    row.appendChild(labelEl);

    // Config display
    const configEl = document.createElement("span");
    configEl.textContent = configStr ? `(${configStr})` : "";
    configEl.style.cssText = "opacity:0.6;font-size:0.75rem;flex:1;";
    row.appendChild(configEl);

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.title = "Edit action config";
    editBtn.style.cssText =
      "padding:2px 6px;border:none;border-radius:2px;background:#57a;color:#fff;cursor:pointer;font-size:0.75rem;";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onEdit(i);
    });
    row.appendChild(editBtn);

    // Remove button
    const rmBtn = document.createElement("button");
    rmBtn.textContent = "🗑️";
    rmBtn.title = "Remove";
    rmBtn.style.cssText =
      "padding:2px 6px;border:none;border-radius:2px;background:#a44;color:#fff;cursor:pointer;font-size:0.75rem;";
    rmBtn.addEventListener("click", () => {
      pendingActions.splice(i, 1);
      renderPendingActionList(container, pendingActions, craftable, onEdit);
    });
    row.appendChild(rmBtn);

    container.appendChild(row);
  }
}

// ============================================================================
// DIALOG: CRAFT / EDIT POTION
// ============================================================================

export async function openCraftDialog(
  gameWorker: Worker,
  editPotion?: Potion,
): Promise<void> {
  const isEdit = !!editPotion;
  const craftable = listCraftableActions();
  const dialog = DialogManager.getInstance();

  // Local mutable state for this dialog session
  const pendingActions: PotionActionEntry[] = [];
  let selectedActionKey: string | null = null;
  let editActionIndex: number | null = null;
  const currentFormValues: Record<string, unknown> = {};

  // If editing, populate pendingActions from the existing potion
  if (editPotion) {
    pendingActions.push(
      ...editPotion.actions.map((a) => ({
        ...a,
        config: { ...a.config },
      })),
    );
  }

  const container = document.createElement("div");
  container.style.cssText =
    "display:flex;flex-direction:column;gap:12px;padding:16px;color:#fff;font-family:monospace;max-height:70vh;overflow-y:auto;";

  // ---- Header ----
  const header = document.createElement("h2");
  header.textContent = isEdit ? "✏️ Edit Potion" : "🧪 Craft Potion";
  header.style.cssText = "margin:0;font-size:1.2rem;";
  container.appendChild(header);

  // ---- 1. Potion Icon ----
  const iconRow = document.createElement("div");
  iconRow.style.cssText = "display:flex;gap:8px;align-items:center;";
  const iconLabel = document.createElement("label");
  iconLabel.textContent = "Potion Icon:";
  const iconInput = document.createElement("input");
  iconInput.type = "text";
  iconInput.placeholder = "🧪";
  iconInput.value = editPotion?.icon ?? "🧪";
  iconInput.maxLength = 2;
  iconInput.style.cssText =
    "width:48px;padding:4px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#fff;font-size:1.2rem;text-align:center;";
  iconRow.appendChild(iconLabel);
  iconRow.appendChild(iconInput);
  container.appendChild(iconRow);

  // ---- 2. Potion Name ----
  const nameRow = document.createElement("div");
  nameRow.style.cssText = "display:flex;gap:8px;align-items:center;";
  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Potion Name:";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "My Potion";
  nameInput.value = editPotion?.name ?? "";
  nameInput.style.cssText =
    "flex:1;padding:6px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#fff;";
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  container.appendChild(nameRow);

  // ---- 2. Action Sequence ----
  const listHeader = document.createElement("div");
  listHeader.style.cssText =
    "display:flex;justify-content:space-between;align-items:center;margin-top:8px;";
  const listTitle = document.createElement("strong");
  listTitle.textContent = "Action Sequence:";
  listHeader.appendChild(listTitle);
  container.appendChild(listHeader);

  const actionListEl = document.createElement("div");
  actionListEl.id = "potion-action-list";
  actionListEl.style.cssText =
    "display:flex;flex-direction:column;gap:4px;min-height:48px;border:1px dashed #555;border-radius:4px;padding:8px;";
  actionListEl.innerHTML =
    `<div style="opacity:0.5;font-size:0.85rem;">No actions added yet.</div>`;
  container.appendChild(actionListEl);

  // ---- 3. Action Selector ----
  const selectorRow = document.createElement("div");
  selectorRow.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:8px;";
  const selectorLabel = document.createElement("label");
  selectorLabel.textContent = "Action:";
  const select = document.createElement("select");
  select.style.cssText =
    "flex:1;padding:6px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#fff;";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "-- Select action --";
  select.appendChild(defaultOpt);
  for (const action of craftable) {
    const opt = document.createElement("option");
    opt.value = action.key;
    opt.textContent = action.meta?.label ?? action.key;
    select.appendChild(opt);
  }
  selectorRow.appendChild(selectorLabel);
  selectorRow.appendChild(select);
  container.appendChild(selectorRow);

  // ---- 4. Config Form ----
  const formArea = document.createElement("div");
  formArea.id = "potion-config-form";
  container.appendChild(formArea);

  // ---- 5. Add / Update Action Button ----
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Add Action";
  addBtn.style.cssText =
    "padding:8px 16px;border:none;border-radius:4px;background:#4a7;color:#fff;cursor:pointer;font-weight:bold;";
  addBtn.disabled = true;
  container.appendChild(addBtn);

  // ---- 6. Save Button ----
  const saveBtn = document.createElement("button");
  saveBtn.textContent = isEdit ? "💾 Update Potion" : "💾 Save Potion";
  saveBtn.style.cssText =
    "padding:10px 20px;border:none;border-radius:4px;background:#57a;color:#fff;cursor:pointer;font-weight:bold;font-size:1rem;margin-top:8px;";
  saveBtn.disabled = true;
  container.appendChild(saveBtn);

  // ---- 7. Close Button ----
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText =
    "padding:8px 16px;border:none;border-radius:4px;background:#555;color:#fff;cursor:pointer;align-self:center;";
  closeBtn.addEventListener("click", () => dialog.close());
  container.appendChild(closeBtn);

  // ---- Helper: populate config form for given action ----
  function populateFormForAction(actionKey: string, existingConfig?: Record<string, unknown>): void {
    const action = craftable.find((a) => a.key === actionKey);
    if (!action?.meta) return;

    // Reset form values
    for (const key in currentFormValues) delete currentFormValues[key];
    for (const f of action.meta.fields) {
      currentFormValues[f.key] =
        existingConfig && existingConfig[f.key] !== undefined
          ? existingConfig[f.key]
          : f.default;
    }

    formArea.innerHTML = "";
    const formHeader = document.createElement("strong");
    formHeader.textContent = "Config:";
    formArea.appendChild(formHeader);
    for (const field of action.meta.fields) {
      formArea.appendChild(renderField(field, currentFormValues));
    }
    addBtn.disabled = false;
  }

  // ---- Helper: start editing an action at given index ----
  function startEditAction(index: number): void {
    editActionIndex = index;
    const entry = pendingActions[index];
    selectedActionKey = entry.func;
    select.value = entry.func;
    addBtn.textContent = "✏️ Update Action";
    populateFormForAction(entry.func, entry.config);
  }

  // ---- Re-render action list (after add/remove/move) ----
  function refreshActionList(): void {
    renderPendingActionList(actionListEl, pendingActions, craftable, (index) => {
      startEditAction(index);
    });
    saveBtn.disabled = pendingActions.length === 0;
  }

  // Render existing actions when editing
  if (isEdit && pendingActions.length > 0) {
    refreshActionList();
    saveBtn.disabled = false;
  }

  // ---- Event handlers ----

  select.addEventListener("change", () => {
    const key = select.value;
    if (!key) {
      addBtn.disabled = true;
      addBtn.textContent = "+ Add Action";
      formArea.innerHTML = "";
      editActionIndex = null;
      return;
    }
    selectedActionKey = key;
    editActionIndex = null;
    addBtn.textContent = "+ Add Action";
    populateFormForAction(key);
  });

  addBtn.addEventListener("click", () => {
    if (!selectedActionKey) return;

    const config: Record<string, unknown> = {};
    const action = craftable.find((a) => a.key === selectedActionKey);
    if (action?.meta) {
      for (const f of action.meta.fields) {
        const v = currentFormValues[f.key];
        if (v !== undefined) config[f.key] = v;
      }
    }

    if (editActionIndex !== null) {
      // Update existing action
      pendingActions[editActionIndex] = {
        func: selectedActionKey,
        config,
      };
    } else {
      // Add new action
      pendingActions.push({
        func: selectedActionKey,
        config,
      });
    }

    refreshActionList();
    editActionIndex = null;
    addBtn.textContent = "+ Add Action";
    addBtn.disabled = true;
    formArea.innerHTML = "";
    select.value = "";
    selectedActionKey = null;
  });

  saveBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (!name || pendingActions.length === 0) return;

    const icon = iconInput.value.trim() || "🧪";
    const potion: Potion = {
      id: editPotion?.id ?? uuid(),
      name,
      icon,
      actions: [...pendingActions],
      remainingUses: editPotion?.remainingUses ?? 1,
      createdAt: editPotion?.createdAt ?? Date.now(),
    };

    // Send to worker for persistence (server truth)
    sendSavePotion(potion, gameWorker);

    dialog.close();

    // Optimistically update local state (will be confirmed by potionDBSynced)
    const idx = gobalMapState.playerState.inventory.findIndex((p) =>
      p.id === potion.id
    );
    if (idx !== -1) {
      gobalMapState.playerState.inventory[idx] = potion;
    } else {
      gobalMapState.playerState.inventory.push(potion);
    }
    syncInventoryToWorker(gameWorker);
  });

  dialog.setContent("");
  dialog.getElement()?.appendChild(container);
  dialog.open(false);
}