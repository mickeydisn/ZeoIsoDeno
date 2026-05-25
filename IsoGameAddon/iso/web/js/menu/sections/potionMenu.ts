import { MenuTab } from "../headMenu.ts";
import { DialogManager } from "../dialog.ts";
import { gobalMapState } from "@iso-game/mapIso/mapState.ts";
import { ACTION_REGISTRY } from "@iso-game/map/action2/actions/registry.ts";
import type {
  ActionField,
  ActionMeta,
} from "@iso-game/map/action2/utils/types.ts";
import type { Potion, PotionActionEntry } from "@iso-game/mapIso/mapState.ts";
import { mapDB } from "@iso-game/map/persistence/db/mapWebDatabase.ts";

// ============================================================================
// GLOBAL
let gameWorker: Worker;
let pendingActions: PotionActionEntry[] = [];
let selectedActionKey: string | null = null;
let currentFormValues: Record<string, unknown> = {};

// ============================================================================
// HELPERS

function uuid(): string {
  return crypto.randomUUID();
}

/** Filter actions that have meta (craftable) */
function listCraftableActions() {
  return ACTION_REGISTRY.filter((a) => a.meta);
}

/** Load potions from DB into playerState */
async function syncPotionsToPlayerState(username: string): Promise<void> {
  try {
    const potions = await mapDB.getAllPotions(username);
    gobalMapState.playerState.inventory = potions;
  } catch (err) {
    console.warn("[PotionMenu] Failed to sync potions:", err);
  }
}

// ============================================================================
// DIALOG: RENDER FIELD

function renderField(field: ActionField): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "potion-field";
  wrapper.style.cssText =
    "display:flex;flex-direction:column;gap:4px;margin-bottom:8px;";

  const label = document.createElement("label");
  label.textContent = field.label;
  label.style.cssText = "font-size:0.85rem;opacity:0.8;";
  wrapper.appendChild(label);

  let input: HTMLElement;

  switch (field.type) {
    case "number": {
      const el = document.createElement("input");
      el.type = "number";
      el.value = String(field.default ?? 0);
      el.min = String(field.min ?? 0);
      el.max = String(field.max ?? 255);
      el.step = String(field.step ?? 1);
      el.style.cssText =
        "width:100%;padding:4px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#fff;";
      el.addEventListener("input", () => {
        currentFormValues[field.key] = parseFloat(el.value);
      });
      input = el;
      break;
    }
    case "range": {
      const container = document.createElement("div");
      container.style.cssText = "display:flex;align-items:center;gap:8px;";
      const el = document.createElement("input");
      el.type = "range";
      el.value = String(field.default ?? 0);
      el.min = String(field.min ?? 0);
      el.max = String(field.max ?? 100);
      el.step = String(field.step ?? 1);
      el.style.cssText = "flex:1;";
      const readout = document.createElement("span");
      readout.textContent = el.value;
      readout.style.cssText =
        "min-width:32px;text-align:right;font-family:monospace;";
      el.addEventListener("input", () => {
        readout.textContent = el.value;
        currentFormValues[field.key] = parseFloat(el.value);
      });
      container.appendChild(el);
      container.appendChild(readout);
      input = container;
      break;
    }
    case "color": {
      const el = document.createElement("input");
      el.type = "color";
      el.value = String(field.default ?? "#ff0000");
      el.style.cssText =
        "width:100%;height:32px;border:none;border-radius:4px;background:none;cursor:pointer;";
      el.addEventListener("input", () => {
        currentFormValues[field.key] = el.value;
      });
      input = el;
      break;
    }
    case "boolean": {
      const el = document.createElement("input");
      el.type = "checkbox";
      el.checked = Boolean(field.default ?? false);
      el.style.cssText = "width:20px;height:20px;cursor:pointer;";
      el.addEventListener("change", () => {
        currentFormValues[field.key] = el.checked;
      });
      input = el;
      break;
    }
    case "select": {
      const el = document.createElement("select");
      el.style.cssText =
        "width:100%;padding:4px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#fff;";
      for (const opt of field.options ?? []) {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        el.appendChild(option);
      }
      el.value = String(field.default ?? "");
      el.addEventListener("change", () => {
        currentFormValues[field.key] = el.value;
      });
      input = el;
      break;
    }
    case "text":
    default: {
      const el = document.createElement("input");
      el.type = "text";
      el.value = String(field.default ?? "");
      el.style.cssText =
        "width:100%;padding:4px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#fff;";
      el.addEventListener("input", () => {
        currentFormValues[field.key] = el.value;
      });
      input = el;
      break;
    }
  }

  wrapper.appendChild(input);
  return wrapper;
}

// ============================================================================
// DIALOG: CRAFT POTION

export async function openCraftDialog(_gameWorker: Worker): Promise<void> {
  gameWorker = _gameWorker;
  const craftable = listCraftableActions();

  const dialog = DialogManager.getInstance();
  const container = document.createElement("div");
  container.style.cssText =
    "display:flex;flex-direction:column;gap:12px;padding:16px;color:#fff;font-family:monospace;max-height:70vh;overflow-y:auto;";

  // Header
  const header = document.createElement("h2");
  header.textContent = "🧪 Craft Potion";
  header.style.cssText = "margin:0;font-size:1.2rem;";
  container.appendChild(header);

  // Action type selector
  const selectorRow = document.createElement("div");
  selectorRow.style.cssText = "display:flex;gap:8px;align-items:center;";
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

  // Config form area
  const formArea = document.createElement("div");
  formArea.id = "potion-config-form";
  container.appendChild(formArea);

  // Pending actions list
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

  // Add action button
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Add Action";
  addBtn.style.cssText =
    "padding:8px 16px;border:none;border-radius:4px;background:#4a7;color:#fff;cursor:pointer;font-weight:bold;";
  addBtn.disabled = true;
  container.appendChild(addBtn);

  // Potion name
  const nameRow = document.createElement("div");
  nameRow.style.cssText =
    "display:flex;gap:8px;align-items:center;margin-top:8px;";
  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Potion Name:";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "My Potion";
  nameInput.style.cssText =
    "flex:1;padding:6px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#fff;";
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  container.appendChild(nameRow);

  // Save button
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾 Save Potion";
  saveBtn.style.cssText =
    "padding:10px 20px;border:none;border-radius:4px;background:#57a;color:#fff;cursor:pointer;font-weight:bold;font-size:1rem;margin-top:8px;";
  saveBtn.disabled = true;
  container.appendChild(saveBtn);

  // ---- Event handlers ----

  // When action type changes, render config form
  select.addEventListener("change", () => {
    const key = select.value;
    if (!key) {
      addBtn.disabled = true;
      formArea.innerHTML = "";
      return;
    }
    selectedActionKey = key;
    const action = craftable.find((a) => a.key === key);
    if (!action?.meta) return;

    // Reset form values
    currentFormValues = {};
    for (const f of action.meta.fields) {
      currentFormValues[f.key] = f.default;
    }

    // Render fields
    formArea.innerHTML = "";
    const formHeader = document.createElement("strong");
    formHeader.textContent = "Config:";
    formArea.appendChild(formHeader);
    for (const field of action.meta.fields) {
      formArea.appendChild(renderField(field));
    }
    addBtn.disabled = false;
  });

  // Add action to pending list
  addBtn.addEventListener("click", () => {
    if (!selectedActionKey) return;

    // Collect current form values into a clean config (no x/y)
    const config: Record<string, unknown> = {};
    const action = craftable.find((a) => a.key === selectedActionKey);
    if (action?.meta) {
      for (const f of action.meta.fields) {
        const v = currentFormValues[f.key];
        if (v !== undefined) config[f.key] = v;
      }
    }

    pendingActions.push({
      func: selectedActionKey,
      config,
    });

    // Refresh action list display
    renderPendingActionList(actionListEl, craftable);
    saveBtn.disabled = false;
    addBtn.disabled = true;
    formArea.innerHTML = "";
    select.value = "";
    selectedActionKey = null;
  });

  // Save potion
  saveBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (!name || pendingActions.length === 0) return;

    const potion: Potion = {
      id: uuid(),
      name,
      actions: [...pendingActions],
      remainingUses: 1,
      createdAt: Date.now(),
    };

    try {
      await mapDB.savePotion(gobalMapState.playerState.username, potion);
      await syncPotionsToPlayerState(gobalMapState.playerState.username);
    } catch (err) {
      console.error("[PotionMenu] Failed to save potion:", err);
      return;
    }

    // Reset state
    pendingActions = [];
    selectedActionKey = null;
    currentFormValues = {};
    dialog.close();
  });

  dialog.setContent("");
  dialog.getElement()?.appendChild(container);
  dialog.open(false);
}

// ============================================================================
// DIALOG: RENDER PENDING ACTION LIST

function renderPendingActionList(
  container: HTMLElement,
  craftable: ReturnType<typeof listCraftableActions>,
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

    // Up button
    const upBtn = document.createElement("button");
    upBtn.textContent = "↑";
    upBtn.title = "Move up";
    upBtn.style.cssText =
      "padding:2px 6px;border:none;border-radius:2px;background:#555;color:#fff;cursor:pointer;";
    upBtn.disabled = i === 0;
    upBtn.addEventListener("click", () => {
      if (i === 0) return;
      [pendingActions[i - 1], pendingActions[i]] = [
        pendingActions[i],
        pendingActions[i - 1],
      ];
      renderPendingActionList(container, craftable);
    });
    row.appendChild(upBtn);

    // Down button
    const downBtn = document.createElement("button");
    downBtn.textContent = "↓";
    downBtn.title = "Move down";
    downBtn.style.cssText =
      "padding:2px 6px;border:none;border-radius:2px;background:#555;color:#fff;cursor:pointer;";
    downBtn.disabled = i === pendingActions.length - 1;
    downBtn.addEventListener("click", () => {
      if (i === pendingActions.length - 1) return;
      [pendingActions[i], pendingActions[i + 1]] = [
        pendingActions[i + 1],
        pendingActions[i],
      ];
      renderPendingActionList(container, craftable);
    });
    row.appendChild(downBtn);

    // Label
    const labelEl = document.createElement("span");
    labelEl.textContent = `${label}`;
    labelEl.style.cssText = "flex:1;";
    row.appendChild(labelEl);

    // Config
    const configEl = document.createElement("span");
    configEl.textContent = configStr ? `(${configStr})` : "";
    configEl.style.cssText = "opacity:0.6;font-size:0.8rem;flex:1;";
    row.appendChild(configEl);

    // Remove button
    const rmBtn = document.createElement("button");
    rmBtn.textContent = "🗑️";
    rmBtn.title = "Remove";
    rmBtn.style.cssText =
      "padding:2px 6px;border:none;border-radius:2px;background:#a44;color:#fff;cursor:pointer;";
    rmBtn.addEventListener("click", () => {
      pendingActions.splice(i, 1);
      renderPendingActionList(container, craftable);
    });
    row.appendChild(rmBtn);

    container.appendChild(row);
  }
}

// ============================================================================
// DIALOG: POTION LIST

export async function openPotionListDialog(_gameWorker: Worker): Promise<void> {
  gameWorker = _gameWorker;

  // Load potions from DB
  let potions: Potion[];
  try {
    potions = await mapDB.getAllPotions(gobalMapState.playerState.username);
  } catch (err) {
    console.error("[PotionMenu] Failed to load potions:", err);
    potions = [];
  }

  const dialog = DialogManager.getInstance();
  const container = document.createElement("div");
  container.style.cssText =
    "display:flex;flex-direction:column;gap:12px;padding:16px;color:#fff;font-family:monospace;max-height:70vh;overflow-y:auto;min-width:400px;";

  // Header
  const header = document.createElement("h2");
  header.textContent = "📜 Potion Inventory";
  header.style.cssText = "margin:0;font-size:1.2rem;";
  container.appendChild(header);

  if (potions.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText =
      "opacity:0.6;font-style:italic;padding:24px;text-align:center;";
    empty.textContent =
      "No potions crafted yet. Go to Craft tab to create one.";
    container.appendChild(empty);
  } else {
    for (const potion of potions) {
      const card = document.createElement("div");
      card.style.cssText =
        "display:flex;flex-direction:column;gap:4px;padding:12px;background:#333;border-radius:6px;border:1px solid #555;";

      // Name
      const nameEl = document.createElement("div");
      nameEl.style.cssText = "font-weight:bold;font-size:1.1rem;";
      nameEl.textContent = potion.name;
      card.appendChild(nameEl);

      // Details
      const details = document.createElement("div");
      details.style.cssText =
        "display:flex;gap:16px;font-size:0.85rem;opacity:0.7;";
      details.textContent =
        `${potion.actions.length} actions · ${potion.remainingUses} use${
          potion.remainingUses !== 1 ? "s" : ""
        } left`;
      card.appendChild(details);

      // Buttons
      const btnRow = document.createElement("div");
      btnRow.style.cssText = "display:flex;gap:8px;margin-top:4px;";

      // Use button
      const useBtn = document.createElement("button");
      useBtn.textContent = "▶ Use";
      useBtn.style.cssText =
        "padding:4px 12px;border:none;border-radius:4px;background:#4a7;color:#fff;cursor:pointer;";
      useBtn.addEventListener("click", () => {
        gobalMapState.playerState.activePotionId = potion.id;
        dialog.close();
        // Show a toast-like indicator
        const indicator = document.createElement("div");
        indicator.textContent =
          `🧪 Potion "${potion.name}" armed — click on map to use`;
        indicator.style.cssText =
          "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#4a7;color:#fff;padding:12px 24px;border-radius:8px;font-family:monospace;z-index:9999;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.5);";
        indicator.id = "potion-use-indicator";
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 5000);
      });
      btnRow.appendChild(useBtn);

      // Buy button
      const buyBtn = document.createElement("button");
      buyBtn.textContent = "+1 Use";
      buyBtn.style.cssText =
        "padding:4px 12px;border:none;border-radius:4px;background:#a84;color:#fff;cursor:pointer;";
      buyBtn.addEventListener("click", async () => {
        potion.remainingUses += 1;
        try {
          await mapDB.savePotion(gobalMapState.playerState.username, potion);
          await syncPotionsToPlayerState(gobalMapState.playerState.username);
          details.textContent =
            `${potion.actions.length} actions · ${potion.remainingUses} use${
              potion.remainingUses !== 1 ? "s" : ""
            } left`;
        } catch (err) {
          console.error("[PotionMenu] Failed to buy potion:", err);
        }
      });
      btnRow.appendChild(buyBtn);

      // Delete button
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️";
      delBtn.title = "Delete potion";
      delBtn.style.cssText =
        "padding:4px 12px;border:none;border-radius:4px;background:#a44;color:#fff;cursor:pointer;";
      delBtn.addEventListener("click", async () => {
        try {
          await mapDB.deletePotion(potion.id);
          await syncPotionsToPlayerState(gobalMapState.playerState.username);
          card.remove();
        } catch (err) {
          console.error("[PotionMenu] Failed to delete potion:", err);
        }
      });
      btnRow.appendChild(delBtn);

      card.appendChild(btnRow);
      container.appendChild(card);
    }
  }

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText =
    "padding:8px 16px;border:none;border-radius:4px;background:#555;color:#fff;cursor:pointer;margin-top:8px;align-self:center;";
  closeBtn.addEventListener("click", () => dialog.close());
  container.appendChild(closeBtn);

  dialog.setContent("");
  dialog.getElement()?.appendChild(container);
  dialog.open(false);
}

// ============================================================================
// MENU TAB FACTORY (Step 4.1)

export const potionMenuTab = (gameWorker: Worker) =>
  ({
    id: "potion",
    icon: "🧪",
    sub: [
      {
        id: "craft_potion",
        icon: "🔬",
        callback_select: () => openCraftDialog(gameWorker),
      },
      {
        id: "potion_list",
        icon: "📜",
        callback_select: () => openPotionListDialog(gameWorker),
      },
    ],
  }) as MenuTab;

// ============================================================================
// PERSISTENCE HELPERS

export async function loadPotions(username: string): Promise<Potion[]> {
  return mapDB.getAllPotions(username);
}

export async function savePotion(
  username: string,
  potion: Potion,
): Promise<void> {
  return mapDB.savePotion(username, potion);
}

export async function deletePotion(id: string): Promise<void> {
  return mapDB.deletePotion(id);
}
