import { MenuTab } from "../headMenu.ts";
import { DialogManager } from "../dialog.ts";
import { gobalMapState } from "@iso-game/mapIso/mapState.ts";
import { ACTION_REGISTRY } from "@iso-game/map/action2/actions/registry.ts";
import type { ActionField } from "@iso-game/map/action2/utils/types.ts";
import type { Potion, PotionActionEntry } from "@iso-game/mapIso/mapState.ts";

// ============================================================================
// GLOBALS
let gameWorker: Worker;
let pendingActions: PotionActionEntry[] = [];
let selectedActionKey: string | null = null;
let currentFormValues: Record<string, unknown> = {};

// Reference for the "Use Potion" select so we can refresh options
let potionSelectEl: HTMLSelectElement | null = null;

// ============================================================================
// HELPERS

function uuid(): string {
  return crypto.randomUUID();
}

function listCraftableActions() {
  return ACTION_REGISTRY.filter((a) => a.meta);
}

/** Send a save request to the worker (which persists to IndexedDB — the server truth) */
function sendSavePotion(potion: Potion): void {
  gameWorker.postMessage({ action: "savePotion", potion });
}

/** Send a delete request to the worker */
function sendDeletePotion(potionId: string): void {
  gameWorker.postMessage({ action: "deletePotion", potionId });
}

/** Sync inventory to worker so potionTool.ts can look up potions by ID */
function syncInventoryToWorker(): void {
  gameWorker.postMessage({
    action: "syncInventory",
    inventory: gobalMapState.playerState.inventory,
  });
}

/**
 * Convert any hex "#rrggbb" strings in potion action configs to [r,g,b] arrays.
 * This handles old potions stored before the color input was fixed.
 */
function sanitizePotionConfig(potion: Potion): Potion {
  for (const action of potion.actions) {
    for (const [key, value] of Object.entries(action.config)) {
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) {
        const match = value.match(/\w\w/g);
        action.config[key] = match!.map((c) => parseInt(c, 16));
      }
    }
  }
  return potion;
}

// ============================================================================
// REFRESH POTION SELECT (for the "Use Potion" sub-tool)

async function populatePotionSelect(): Promise<void> {
  if (!potionSelectEl) return;
  // Use local inventory (authoritative — synced via potionDBSynced from worker).
  // If empty on first call, load from IndexedDB as a one-time initialisation.
  let potions = gobalMapState.playerState.inventory;
  if (potions.length === 0) {
    try {
      const { mapDB } = await import("@iso-game/map/persistence/db/mapWebDatabase.ts");
      potions = await mapDB.getAllPotions(gobalMapState.playerState.username);
      potions = potions.map(sanitizePotionConfig);
      gobalMapState.playerState.inventory = potions;
      syncInventoryToWorker();
    } catch {
      potions = [];
    }
  }

  // Keep the placeholder option
  potionSelectEl.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Select potion --";
  potionSelectEl.appendChild(placeholder);

  for (const potion of potions) {
    if (potion.remainingUses <= 0) continue; // Don't show depleted potions
    const opt = document.createElement("option");
    opt.value = potion.id;
    opt.textContent = `${potion.name} (${potion.remainingUses} use${
      potion.remainingUses !== 1 ? "s" : ""
    })`;
    potionSelectEl.appendChild(opt);
  }
}

export async function refreshPotionSelect(): Promise<void> {
  await populatePotionSelect();
}

// ============================================================================
// CARD MOUNT FUNCTIONS

function mountCraftCard(container: HTMLElement): void {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;padding:8px;color:#fff;font-family:monospace;">
      <strong style="font-size:1rem;">Craft Potion</strong>
      <p style="font-size:0.85rem;opacity:0.7;margin:0;">Create a new potion by combining actions.</p>
      <button id="btn-open-craft" style="padding:8px 16px;border:none;border-radius:4px;background:#4a7;color:#fff;cursor:pointer;font-weight:bold;align-self:flex-start;">Open Craft Dialog</button>
    </div>
  `;
  container.querySelector("#btn-open-craft")?.addEventListener(
    "click",
    async () => {
      await openCraftDialog();
      await populatePotionSelect();
    },
  );
}

function mountInventoryCard(container: HTMLElement): void {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;padding:8px;color:#fff;font-family:monospace;">
      <strong style="font-size:1rem;">Potion Inventory</strong>
      <p style="font-size:0.85rem;opacity:0.7;margin:0;">View and manage your crafted potions.</p>
      <button id="btn-open-list" style="padding:8px 16px;border:none;border-radius:4px;background:#57a;color:#fff;cursor:pointer;font-weight:bold;align-self:flex-start;">Open Inventory</button>
    </div>
  `;
  container.querySelector("#btn-open-list")?.addEventListener(
    "click",
    async () => {
      await openPotionListDialog();
      await populatePotionSelect();
    },
  );
}

function mountUsePotionCard(container: HTMLElement): void {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;padding:8px;color:#fff;font-family:monospace;">
      <strong style="font-size:1rem;">Use Potion</strong>
      <label style="font-size:0.85rem;opacity:0.7;">Select a potion to activate:</label>
      <select id="potion-select" style="padding:6px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#fff;font-family:monospace;cursor:pointer;"></select>
    </div>
  `;
  potionSelectEl = container.querySelector(
    "#potion-select",
  ) as HTMLSelectElement;
  populatePotionSelect();
  potionSelectEl.addEventListener("change", () => {
    const potionId = potionSelectEl!.value;
    if (potionId) {
      // Sync inventory to worker before setting active tool,
      // so potionTool.ts can find the potion by ID.
      syncInventoryToWorker();
      gameWorker.postMessage({
        action: "setActiveTool",
        toolId: "use_potion",
        potionId,
      });
    }
  });
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
      // field.default may be [r,g,b] array or hex string; normalise to hex for the input
      const defaultHex = Array.isArray(field.default)
        ? "#" + (field.default as number[]).slice(0, 3).map(c => c.toString(16).padStart(2, "0")).join("")
        : String(field.default ?? "#ff0000");
      el.value = defaultHex;
      el.style.cssText =
        "width:100%;height:32px;border:none;border-radius:4px;background:none;cursor:pointer;";
      el.addEventListener("input", () => {
        // Convert hex "#RRGGBB" to [r, g, b] array
        const hex = el.value;
        const match = hex.match(/\w\w/g);
        currentFormValues[field.key] = match
          ? match.map((c) => parseInt(c, 16))
          : [255, 0, 0];
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

async function openCraftDialog(editPotion?: Potion): Promise<void> {
  const isEdit = !!editPotion;
  const craftable = listCraftableActions();

  // If editing, populate pendingActions from the existing potion
  if (editPotion) {
    pendingActions = editPotion.actions.map((a) => ({ ...a, config: { ...a.config } }));
  } else {
    pendingActions = [];
  }

  const dialog = DialogManager.getInstance();
  const container = document.createElement("div");
  container.style.cssText =
    "display:flex;flex-direction:column;gap:12px;padding:16px;color:#fff;font-family:monospace;max-height:70vh;overflow-y:auto;";

  const header = document.createElement("h2");
  header.textContent = isEdit ? "✏️ Edit Potion" : "🧪 Craft Potion";
  header.style.cssText = "margin:0;font-size:1.2rem;";
  container.appendChild(header);

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

  const formArea = document.createElement("div");
  formArea.id = "potion-config-form";
  container.appendChild(formArea);

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

  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Add Action";
  addBtn.style.cssText =
    "padding:8px 16px;border:none;border-radius:4px;background:#4a7;color:#fff;cursor:pointer;font-weight:bold;";
  addBtn.disabled = true;
  container.appendChild(addBtn);

  const nameRow = document.createElement("div");
  nameRow.style.cssText =
    "display:flex;gap:8px;align-items:center;margin-top:8px;";
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

  const saveBtn = document.createElement("button");
  saveBtn.textContent = isEdit ? "💾 Update Potion" : "💾 Save Potion";
  saveBtn.style.cssText =
    "padding:10px 20px;border:none;border-radius:4px;background:#57a;color:#fff;cursor:pointer;font-weight:bold;font-size:1rem;margin-top:8px;";
  saveBtn.disabled = true;
  container.appendChild(saveBtn);

  // Render existing actions when editing
  if (isEdit && pendingActions.length > 0) {
    renderPendingActionList(actionListEl, craftable);
    saveBtn.disabled = false;
  }

  // ---- Event handlers ----

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

    currentFormValues = {};
    for (const f of action.meta.fields) {
      currentFormValues[f.key] = f.default;
    }

    formArea.innerHTML = "";
    const formHeader = document.createElement("strong");
    formHeader.textContent = "Config:";
    formArea.appendChild(formHeader);
    for (const field of action.meta.fields) {
      formArea.appendChild(renderField(field));
    }
    addBtn.disabled = false;
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

    pendingActions.push({
      func: selectedActionKey,
      config,
    });

    renderPendingActionList(actionListEl, craftable);
    saveBtn.disabled = false;
    addBtn.disabled = true;
    formArea.innerHTML = "";
    select.value = "";
    selectedActionKey = null;
  });

  saveBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (!name || pendingActions.length === 0) return;

    const potion: Potion = {
      id: editPotion?.id ?? uuid(),
      name,
      actions: [...pendingActions],
      remainingUses: editPotion?.remainingUses ?? 1,
      createdAt: editPotion?.createdAt ?? Date.now(),
    };

    // Send to worker for persistence (server truth)
    sendSavePotion(potion);

    pendingActions = [];
    selectedActionKey = null;
    currentFormValues = {};
    dialog.close();

    // Optimistically update local state (will be confirmed by potionDBSynced)
    const idx = gobalMapState.playerState.inventory.findIndex((p) => p.id === potion.id);
    if (idx !== -1) {
      gobalMapState.playerState.inventory[idx] = potion;
    } else {
      gobalMapState.playerState.inventory.push(potion);
    }
    syncInventoryToWorker();

    // Optimistically refresh the potion select dropdown
    if (potionSelectEl) {
      potionSelectEl.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Select potion --";
      potionSelectEl.appendChild(placeholder);
      for (const p of gobalMapState.playerState.inventory) {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.remainingUses} use${p.remainingUses !== 1 ? "s" : ""})`;
        potionSelectEl.appendChild(opt);
      }
    }
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

    const labelEl = document.createElement("span");
    labelEl.textContent = `${label}`;
    labelEl.style.cssText = "flex:1;";
    row.appendChild(labelEl);

    const configEl = document.createElement("span");
    configEl.textContent = configStr ? `(${configStr})` : "";
    configEl.style.cssText = "opacity:0.6;font-size:0.8rem;flex:1;";
    row.appendChild(configEl);

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

async function openPotionListDialog(): Promise<void> {
  // Load from local inventory (potionDBSynced keeps it fresh from worker)
  let potions = gobalMapState.playerState.inventory;
  if (potions.length === 0) {
    // Initial load from IndexedDB if local state is empty
    try {
      const { mapDB } = await import("@iso-game/map/persistence/db/mapWebDatabase.ts");
      potions = await mapDB.getAllPotions(gobalMapState.playerState.username);
      potions = potions.map(sanitizePotionConfig);
      gobalMapState.playerState.inventory = potions;
    } catch (err) {
      console.error("[PotionMenu] Failed to load potions:", err);
      potions = [];
    }
  }

  const dialog = DialogManager.getInstance();
  const container = document.createElement("div");
  container.style.cssText =
    "display:flex;flex-direction:column;gap:12px;padding:16px;color:#fff;font-family:monospace;max-height:70vh;overflow-y:auto;min-width:500px;";

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

      const nameEl = document.createElement("div");
      nameEl.style.cssText = "font-weight:bold;font-size:1.1rem;";
      nameEl.textContent = `${potion.name} (${potion.remainingUses} use${
        potion.remainingUses !== 1 ? "s" : ""
      } left)`;
      card.appendChild(nameEl);

      // Action list with labels and config
      for (const action of potion.actions) {
        const actionObj = ACTION_REGISTRY.find((a) => a.key === action.func);
        const label = actionObj?.meta?.label ?? action.func;
        const configStr = Object.entries(action.config)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");

        const row = document.createElement("div");
        row.style.cssText =
          "display:flex;gap:8px;padding:2px 8px;font-size:0.85rem;opacity:0.8;";
        row.textContent = `  ${label}${configStr ? ` (${configStr})` : ""}`;
        card.appendChild(row);
      }

      const btnRow = document.createElement("div");
      btnRow.style.cssText = "display:flex;gap:8px;margin-top:6px;";

      const buyBtn = document.createElement("button");
      buyBtn.textContent = "+1 Use";
      buyBtn.style.cssText =
        "padding:4px 12px;border:none;border-radius:4px;background:#a84;color:#fff;cursor:pointer;";
      buyBtn.addEventListener("click", () => {
        potion.remainingUses += 1;
        sendSavePotion(potion);
        nameEl.textContent = `${potion.name} (${potion.remainingUses} use${
          potion.remainingUses !== 1 ? "s" : ""
        } left)`;
      });
      btnRow.appendChild(buyBtn);

      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️ Edit";
      editBtn.title = "Edit potion";
      editBtn.style.cssText =
        "padding:4px 12px;border:none;border-radius:4px;background:#57a;color:#fff;cursor:pointer;";
      editBtn.addEventListener("click", async () => {
        dialog.close();
        await openCraftDialog(potion);
        await populatePotionSelect();
      });
      btnRow.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️ Delete";
      delBtn.title = "Delete potion";
      delBtn.style.cssText =
        "padding:4px 12px;border:none;border-radius:4px;background:#a44;color:#fff;cursor:pointer;";
      delBtn.addEventListener("click", () => {
        sendDeletePotion(potion.id);
        card.remove();
      });
      btnRow.appendChild(delBtn);

      card.appendChild(btnRow);
      container.appendChild(card);
    }
  }

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
// MENU TAB FACTORY

export const potionMenuTab = (_gameWorker: Worker) => {
  gameWorker = _gameWorker;

  const sub = [
    {
      id: "craft_potion",
      icon: "🔬",
      params: [
        { id: "craft_card", type: "div" as const, mount: mountCraftCard },
      ],
    },
    {
      id: "potion_list",
      icon: "📜",
      params: [
        {
          id: "inventory_card",
          type: "div" as const,
          mount: mountInventoryCard,
        },
      ],
    },
    {
      id: "use_potion",
      icon: "🧪",
      params: [
        { id: "use_card", type: "div" as const, mount: mountUsePotionCard },
      ],
    },
  ];

  return {
    id: "potion",
    icon: "🧪",
    sub,
  } as MenuTab;
};
