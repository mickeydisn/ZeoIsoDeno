/**
 * Shared utilities for potion dialogs.
 */

import type { ActionField } from "@iso-game/map/action/utils/types.ts";
import type { Potion } from "@iso-game/handlers/game/mapState.ts";

// ============================================================================
// UUID
// ============================================================================

export function uuid(): string {
  return crypto.randomUUID();
}

// ============================================================================
// SANITIZE POTION CONFIG
// Convert any hex "#rrggbb" strings in potion action configs to [r,g,b] arrays.
// This handles old potions stored before the color input was fixed.
// ============================================================================

export function sanitizePotionConfig(potion: Potion): Potion {
  // Ensure icon field exists for old potions
  if (!potion.icon) {
    potion.icon = "🧪";
  }
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
// RENDER FIELD
// Build a form field DOM element based on the ActionField descriptor.
// Mutates `formValues` via event listeners for live two-way binding.
// ============================================================================

export function renderField(
  field: ActionField,
  formValues: Record<string, unknown>,
): HTMLElement {
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
        formValues[field.key] = parseFloat(el.value);
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
        formValues[field.key] = parseFloat(el.value);
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
        ? "#" +
          (field.default as number[]).slice(0, 3).map((c) =>
            c.toString(16).padStart(2, "0")
          ).join("")
        : String(field.default ?? "#ff0000");
      el.value = defaultHex;
      el.style.cssText =
        "width:100%;height:32px;border:none;border-radius:4px;background:none;cursor:pointer;";
      el.addEventListener("input", () => {
        // Convert hex "#RRGGBB" to [r, g, b] array
        const hex = el.value;
        const match = hex.match(/\w\w/g);
        formValues[field.key] = match
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
        formValues[field.key] = el.checked;
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
        formValues[field.key] = el.value;
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
        formValues[field.key] = el.value;
      });
      input = el;
      break;
    }
  }

  wrapper.appendChild(input);
  return wrapper;
}