/**
 * Potion Inventory List dialog & Quick-bar renderer.
 *
 * Inventory dialog shows potions in two columns:
 *   - Left: first N potions displayed on the quick-bar
 *   - Right: all remaining potions
 *
 * Each entry is a list row (icon + name + details/summary for actions).
 * Clicking two potions swaps their positions in the inventory order.
 *
 * An "admin mode" toggle in the header adds edit/delete buttons on each
 * row and a "Craft New" button at the bottom of the backpack column.
 *
 * The quick-bar renders the first N potions as clickable tiles.
 */

import { DialogManager } from "../dialog.ts";
import { gobalGameState } from "../../../../../../IsoGame/handlers/game/gameState.ts";
import { ACTION_REGISTRY } from "@iso-game/map/action/actions/registry.ts";
import type { Potion } from "../../../../../../IsoGame/handlers/game/gameState.ts";
import { sanitizePotionConfig } from "./dialogHelpers.ts";
import { openCraftDialog } from "./craftPotionDialog.ts";

const BAR_SLOTS = 6;

// ============================================================================
// WORKER MESSAGE HELPERS
// ============================================================================

function sendSavePotion(potion: Potion, gameWorker: Worker): void {
  gameWorker.postMessage({ action: "savePotion", potion });
}

function sendDeletePotion(potionId: string, gameWorker: Worker): void {
  gameWorker.postMessage({ action: "deletePotion", potionId });
}

function syncInventoryToWorker(worker: Worker): void {
  worker.postMessage({
    action: "syncInventory",
    inventory: gobalGameState.playerState.inventory,
  });
}

// ============================================================================
// LOAD INVENTORY (shared helper)
// ============================================================================

async function loadInventory(): Promise<Potion[]> {
  let potions = gobalGameState.playerState.inventory;
  if (potions.length === 0) {
    try {
      const { mapDB } = await import(
        "../../../../../../IsoGame/map/persistence/db/mapWebDatabase.ts"
      );
      potions = await mapDB.getAllPotions(gobalGameState.playerState.username);
      potions = potions.map(sanitizePotionConfig);
      gobalGameState.playerState.inventory = potions;
    } catch {
      potions = [];
    }
  }
  return potions;
}

// ============================================================================
// QUICK-BAR RENDERER
// ============================================================================

/**
 * Render the first `maxSlots` potions as clickable tiles in the bar container.
 * Clicking a tile sets it as the active potion tool.
 * Depleted potions (remainingUses <= 0) are skipped.
 */
export async function renderPotionBar(
  container: HTMLElement,
  gameWorker: Worker,
  maxSlots: number,
): Promise<void> {
  const potions = await loadInventory();

  container.innerHTML = "";

  // Filter to usable potions only, take first N
  const usable = potions.filter((p) => p.remainingUses > 0);
  const shown = usable.slice(0, maxSlots);

  for (const potion of shown) {
    const tile = document.createElement("div");
    tile.dataset.potionId = potion.id;
    tile.title = `${
      potion.icon || "🧪"
    } ${potion.name} (${potion.remainingUses} use${
      potion.remainingUses !== 1 ? "s" : ""
    })`;
    tile.style.cssText = `
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      min-width:52px; min-height:52px; padding:4px 8px;
      background:#444; border:1px solid #666; border-radius:6px;
      cursor:pointer; user-select:none;
      font-size:1.4rem; line-height:1;
      transition:background 0.15s, transform 0.1s;
    `;

    const iconSpan = document.createElement("span");
    iconSpan.textContent = potion.icon || "🧪";
    iconSpan.style.cssText = "font-size:1.2rem;";
    tile.appendChild(iconSpan);

    const badge = document.createElement("span");
    badge.textContent = String(potion.remainingUses);
    badge.style.cssText = `
      font-size:0.65rem; opacity:0.8;
      background:#222; border-radius:3px; padding:0 4px; margin-top:2px;
    `;
    tile.appendChild(badge);

    tile.addEventListener("mouseenter", () => {
      tile.style.background = "#5a5a5a";
      tile.style.transform = "scale(1.08)";
    });
    tile.addEventListener("mouseleave", () => {
      tile.style.background = "#444";
      tile.style.transform = "scale(1)";
    });
    tile.addEventListener("click", () => {
      syncInventoryToWorker(gameWorker);
      gameWorker.postMessage({
        action: "setActiveTool",
        toolId: "use_potion",
        potionId: potion.id,
      });

      container.querySelectorAll("[data-potion-id]").forEach((el) =>
        (el as HTMLElement).style.borderColor = "#666"
      );
      tile.style.borderColor = "#8cf";
    });

    container.appendChild(tile);
  }

  // Fill remaining empty slots
  const emptySlots = maxSlots - shown.length;
  for (let i = 0; i < emptySlots; i++) {
    const empty = document.createElement("div");
    empty.style.cssText = `
      display:flex; align-items:center; justify-content:center;
      min-width:52px; min-height:52px;
      border:1px dashed #444; border-radius:6px;
      color:#555; font-size:1.2rem; opacity:0.5;
    `;
    empty.textContent = "∅";
    container.appendChild(empty);
  }
}

// ============================================================================
// ADMIN BUTTONS
// ============================================================================

function addAdminButtons(
  row: HTMLElement,
  potion: Potion,
  gameWorker: Worker,
  dialog: DialogManager,
): void {
  const btnRow = document.createElement("div");
  btnRow.style.cssText =
    "display:flex;gap:4px;margin-top:4px;justify-content:flex-end;";

  // +1 Use
  const useBtn = document.createElement("button");
  useBtn.textContent = "+100";
  useBtn.title = "Add one use";
  useBtn.style.cssText =
    "padding:2px 6px;border:none;border-radius:3px;background:#a84;color:#fff;cursor:pointer;font-size:0.7rem;";
  useBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    potion.remainingUses += 100;
    sendSavePotion(potion, gameWorker);
    // Update uses badge in the top line
    const badge = row.querySelector<HTMLElement>(".potion-uses-badge");
    if (badge) {
      badge.textContent = `${potion.remainingUses} use${
        potion.remainingUses !== 1 ? "s" : ""
      }`;
    }
  });
  btnRow.appendChild(useBtn);

  // Edit
  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️";
  editBtn.title = "Edit potion";
  editBtn.style.cssText =
    "padding:2px 6px;border:none;border-radius:3px;background:#57a;color:#fff;cursor:pointer;font-size:0.7rem;";
  editBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    dialog.close();
    await openCraftDialog(gameWorker, potion);
  });
  btnRow.appendChild(editBtn);

  // Delete
  const delBtn = document.createElement("button");
  delBtn.textContent = "🗑️";
  delBtn.title = "Delete potion";
  delBtn.style.cssText =
    "padding:2px 6px;border:none;border-radius:3px;background:#a44;color:#fff;cursor:pointer;font-size:0.7rem;";
  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sendDeletePotion(potion.id, gameWorker);
    row.remove();
  });
  btnRow.appendChild(delBtn);

  row.appendChild(btnRow);
}

// ============================================================================
// LIST ROW BUILDER
// ============================================================================

function buildListRow(
  potion: Potion,
  index: number,
  adminMode: boolean,
  gameWorker: Worker,
  dialog: DialogManager,
): HTMLElement {
  const row = document.createElement("div");
  row.dataset.index = String(index);
  row.dataset.potionId = potion.id;
  row.style.cssText = `
    display:flex; flex-direction:column; gap:2px;
    padding:6px 10px; background:#333; border-radius:4px;
    border:1px solid #555; cursor:pointer;
    transition:background 0.15s;
    user-select:none;
  `;

  // ---- Top line: icon + name + uses ----
  const topLine = document.createElement("div");
  topLine.style.cssText = "display:flex;align-items:center;gap:8px;";

  const icon = document.createElement("span");
  icon.textContent = potion.icon || "🧪";
  icon.style.cssText = "font-size:1rem;flex-shrink:0;";
  topLine.appendChild(icon);

  const nameEl = document.createElement("span");
  nameEl.style.cssText = "flex:1;font-weight:bold;font-size:0.85rem;";
  nameEl.textContent = potion.name;
  topLine.appendChild(nameEl);

  const usesBadge = document.createElement("span");
  usesBadge.className = "potion-uses-badge";
  usesBadge.textContent = `${potion.remainingUses} use${
    potion.remainingUses !== 1 ? "s" : ""
  }`;
  usesBadge.style.cssText =
    "font-size:0.7rem;opacity:0.7;background:#222;border-radius:3px;padding:0 6px;flex-shrink:0;";
  topLine.appendChild(usesBadge);

  row.appendChild(topLine);

  // ---- Details/summary for actions ----
  if (potion.actions.length > 0) {
    const details = document.createElement("details");
    details.style.cssText =
      "font-size:0.75rem;opacity:0.7;margin-top:2px;text-align:left;";

    const summary = document.createElement("summary");
    summary.textContent = `${potion.actions.length} action${
      potion.actions.length !== 1 ? "s" : ""
    }`;
    summary.style.cssText = "cursor:pointer;opacity:0.8;";
    details.appendChild(summary);

    for (const action of potion.actions) {
      const actionObj = ACTION_REGISTRY.find((a) => a.key === action.func);
      const label = actionObj?.meta?.label ?? action.func;
      const configStr = Object.entries(action.config)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");

      const line = document.createElement("div");
      line.style.cssText = "padding:1px 0 1px 12px;";
      line.textContent = `${label}${configStr ? ` (${configStr})` : ""}`;
      details.appendChild(line);
    }

    row.appendChild(details);
  }

  // Admin buttons (if admin mode is active)
  if (adminMode) {
    addAdminButtons(row, potion, gameWorker, dialog);
  }

  // Hover feedback
  row.addEventListener("mouseenter", () => {
    row.style.background = "#3a3a3a";
  });
  row.addEventListener("mouseleave", () => {
    row.style.background = "#333";
  });

  return row;
}

// ============================================================================
// DIALOG: POTION INVENTORY (two-column list with swap-reorder)
// ============================================================================

export async function openPotionListDialog(
  gameWorker: Worker,
): Promise<void> {
  const potions = await loadInventory();

  const dialog = DialogManager.getInstance();
  const container = document.createElement("div");
  container.style.cssText =
    "display:flex;flex-direction:column;gap:10px;padding:16px;color:#fff;font-family:monospace;max-height:70vh;overflow-y:auto;min-width:600px;";

  // ---- Header row with admin toggle ----
  const headerRow = document.createElement("div");
  headerRow.style.cssText =
    "display:flex;justify-content:space-between;align-items:center;";

  const header = document.createElement("h2");
  header.textContent = "📜 Potion Inventory";
  header.style.cssText =
    "margin:0;font-size:1.1rem;display:flex;align-items:center;gap:8px;";

  const hint = document.createElement("span");
  hint.textContent = "(click two potions to swap)";
  hint.style.cssText = "font-size:0.65rem;opacity:0.5;font-weight:normal;";
  header.appendChild(hint);

  headerRow.appendChild(header);

  const adminBtn = document.createElement("button");
  adminBtn.textContent = "🔧 Admin";
  adminBtn.title = "Toggle admin mode (edit / delete / craft)";
  adminBtn.style.cssText =
    "padding:3px 10px;border:none;border-radius:4px;background:#555;color:#fff;cursor:pointer;font-size:0.75rem;font-weight:bold;transition:background 0.15s;";
  headerRow.appendChild(adminBtn);

  container.appendChild(headerRow);

  // ---- Two-column layout ----
  const columns = document.createElement("div");
  columns.style.cssText =
    "display:grid;grid-template-columns:1fr 1fr;gap:12px;";

  // -- Left column: quick-bar potions --
  const leftCol = document.createElement("div");
  leftCol.style.cssText = "display:flex;flex-direction:column;gap:4px;";

  const leftTitle = document.createElement("div");
  leftTitle.textContent = "⚡ Quick Bar";
  leftTitle.style.cssText = "font-size:0.8rem;opacity:0.6;margin-bottom:4px;";
  leftCol.appendChild(leftTitle);

  const leftList = document.createElement("div");
  leftList.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  leftCol.appendChild(leftList);

  // -- Right column: all other potions --
  const rightCol = document.createElement("div");
  rightCol.style.cssText = "display:flex;flex-direction:column;gap:4px;";

  const rightTitle = document.createElement("div");
  rightTitle.textContent = "📦 Backpack";
  rightTitle.style.cssText = "font-size:0.8rem;opacity:0.6;margin-bottom:4px;";
  rightCol.appendChild(rightTitle);

  const rightList = document.createElement("div");
  rightList.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  rightCol.appendChild(rightList);

  columns.appendChild(leftCol);
  columns.appendChild(rightCol);
  container.appendChild(columns);

  // ---- Craft New button (hidden by default, shown in admin mode) ----
  const craftNewBtn = document.createElement("button");
  craftNewBtn.textContent = "🧪 Craft New Potion";
  craftNewBtn.style.cssText = `
    display:none;
    padding:8px 16px;border:none;border-radius:4px;background:#4a7;
    color:#fff;cursor:pointer;font-weight:bold;font-size:0.85rem;
    align-self:center;margin-top:4px;
  `;
  craftNewBtn.addEventListener("click", async () => {
    dialog.close();
    await openCraftDialog(gameWorker);
  });
  container.appendChild(craftNewBtn);

  // ---- Swap state ----
  let adminMode = false;
  let swapTarget: HTMLElement | null = null;

  function attachSwapHandler(row: HTMLElement): void {
    row.addEventListener("click", () => {
      // Don't swap if clicking an admin button (stopPropagation handles that)
      if (!swapTarget) {
        swapTarget = row;
        row.style.outline = "2px solid #8cf";
        row.style.outlineOffset = "2px";
      } else if (swapTarget === row) {
        swapTarget.style.outline = "none";
        swapTarget = null;
      } else {
        const aIdx = parseInt(swapTarget.dataset.index!, 10);
        const bIdx = parseInt(row.dataset.index!, 10);
        if (!isNaN(aIdx) && !isNaN(bIdx)) {
          const arr = gobalGameState.playerState.inventory;
          [arr[aIdx], arr[bIdx]] = [arr[bIdx], arr[aIdx]];
          sendSavePotion(arr[aIdx], gameWorker);
          sendSavePotion(arr[bIdx], gameWorker);
          syncInventoryToWorker(gameWorker);
          swapTarget.style.outline = "none";
          swapTarget = null;
          rebuild();
        }
      }
    });
  }

  function rebuild(): void {
    const all = gobalGameState.playerState.inventory;

    // Clear lists
    leftList.innerHTML = "";
    rightList.innerHTML = "";
    swapTarget = null;

    if (all.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText =
        "opacity:0.6;font-style:italic;padding:24px;text-align:center;grid-column:1/-1;";
      empty.textContent = "No potions crafted yet.";
      leftList.appendChild(empty);
      return;
    }

    // Filter: usable potions first for left column
    const usable = all.filter((p) => p.remainingUses > 0);
    const leftPotions = usable.slice(0, BAR_SLOTS);
    const rightPotions = all.filter((p) =>
      !leftPotions.some((lp) => lp.id === p.id)
    );

    for (const potion of leftPotions) {
      const idx = all.indexOf(potion);
      const row = buildListRow(potion, idx, adminMode, gameWorker, dialog);
      attachSwapHandler(row);
      leftList.appendChild(row);
    }

    if (leftPotions.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText =
        "opacity:0.4;font-size:0.75rem;font-style:italic;padding:12px;text-align:center;";
      empty.textContent = "No potions in quick bar";
      leftList.appendChild(empty);
    }

    for (const potion of rightPotions) {
      const idx = all.indexOf(potion);
      const row = buildListRow(potion, idx, adminMode, gameWorker, dialog);
      attachSwapHandler(row);
      rightList.appendChild(row);
    }

    if (rightPotions.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText =
        "opacity:0.4;font-size:0.75rem;font-style:italic;padding:12px;text-align:center;";
      empty.textContent = "All potions are in the quick bar";
      rightList.appendChild(empty);
    }

    // Show/hide craft button based on admin mode
    craftNewBtn.style.display = adminMode ? "block" : "none";
  }

  // ---- Admin toggle ----
  adminBtn.addEventListener("click", () => {
    adminMode = !adminMode;
    adminBtn.style.background = adminMode ? "#4a7" : "#555";
    adminBtn.textContent = adminMode ? "🔧 Admin ON" : "🔧 Admin";
    rebuild();
  });

  // Initial build
  rebuild();

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText =
    "padding:8px 16px;border:none;border-radius:4px;background:#555;color:#fff;cursor:pointer;margin-top:6px;align-self:center;";
  closeBtn.addEventListener("click", () => dialog.close());
  container.appendChild(closeBtn);

  dialog.setContent("");
  dialog.getElement()?.appendChild(container);
  dialog.open(false);
}
