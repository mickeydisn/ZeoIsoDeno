/**
 * Potion Menu Tab definition.
 *
 * Three sub-tools:
 *   - Craft Potion  (opens craft dialog)
 *   - Potion List   (opens inventory grid with reorder)
 *   - Use Potion    (horizontal potion bar + inventory open button)
 *
 * Dialogs extracted to ../dialogs/.
 */

import { MenuTab } from "../headMenu.ts";
import { gobalGameState } from "../../../../../../IsoGame/handlers/game/gameState.ts";
import { openCraftDialog } from "../dialogs/craftPotionDialog.ts";
import {
  openPotionListDialog,
  renderPotionBar,
} from "../dialogs/potionListDialog.ts";

// How many potions to show in the quick-bar
const BAR_SLOTS = 6;

// ============================================================================
// MODULE STATE
// ============================================================================

let gameWorker: Worker;

/** Container for the quick-bar so we can re-render on inventory change */
let barContainerEl: HTMLElement | null = null;

// ============================================================================
// WORKER HELPERS
// ============================================================================

function syncInventoryToWorker(): void {
  gameWorker.postMessage({
    action: "syncInventory",
    inventory: gobalGameState.playerState.inventory,
  });
}

// ============================================================================
// REFRESH – called externally by potionDBSynced handler (mainMessage.ts)
// ============================================================================

export async function refreshPotionSelect(): Promise<void> {
  if (barContainerEl) {
    await renderPotionBar(barContainerEl, gameWorker, BAR_SLOTS);
  }
}

// ============================================================================
// CARD MOUNT FUNCTIONS
// ============================================================================

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
      await openCraftDialog(gameWorker);
      await refreshPotionSelect();
    },
  );
}

function mountInventoryCard(container: HTMLElement): void {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;padding:8px;color:#fff;font-family:monospace;">
      <strong style="font-size:1rem;">Potion Inventory</strong>
      <p style="font-size:0.85rem;opacity:0.7;margin:0;">View, manage and reorder your crafted potions.</p>
      <button id="btn-open-list" style="padding:8px 16px;border:none;border-radius:4px;background:#57a;color:#fff;cursor:pointer;font-weight:bold;align-self:flex-start;">Open Inventory</button>
    </div>
  `;
  container.querySelector("#btn-open-list")?.addEventListener(
    "click",
    async () => {
      await openPotionListDialog(gameWorker);
      await refreshPotionSelect();
    },
  );
}

// ============================================================================
// USE POTION – Visual inventory bar
// ============================================================================

function mountUsePotionCard(container: HTMLElement): void {
  // Main wrapper
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "display:flex;flex-direction:column;gap:6px;padding:4px 8px;color:#fff;font-family:monospace;";

  // Label row
  const labelRow = document.createElement("div");
  labelRow.style.cssText =
    "display:flex;justify-content:space-between;align-items:center;";

  const title = document.createElement("strong");
  title.style.cssText = "font-size:0.9rem;";
  title.textContent = "🧪 Quick Potions";

  const invBtn = document.createElement("button");
  invBtn.textContent = "📦 Inventory";
  invBtn.title = "Open full inventory to reorder potions";
  invBtn.style.cssText =
    "padding:3px 10px;border:none;border-radius:4px;background:#57a;color:#fff;cursor:pointer;font-size:0.75rem;font-weight:bold;";

  labelRow.appendChild(title);
  labelRow.appendChild(invBtn);
  wrapper.appendChild(labelRow);

  // Quick-bar row
  barContainerEl = document.createElement("div");
  barContainerEl.id = "potion-quick-bar";
  barContainerEl.style.cssText =
    "display:flex;flex-direction:row;gap:6px;min-height:48px;align-items:stretch;";
  wrapper.appendChild(barContainerEl);

  container.appendChild(wrapper);

  // Initial render
  renderPotionBar(barContainerEl, gameWorker, BAR_SLOTS);

  // Inventory button
  invBtn.addEventListener("click", async () => {
    await openPotionListDialog(gameWorker);
    await refreshPotionSelect();
  });
}

// ============================================================================
// MENU TAB FACTORY
// ============================================================================

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
