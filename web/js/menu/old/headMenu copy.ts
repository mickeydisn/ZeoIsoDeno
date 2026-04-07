/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export interface MenuTab {
  id: string;
  icon: string;
}

export interface HeadMenuConfig {
  tabs: MenuTab[];
  defaultIndex?: number;        // defaults to 0
  mountTo?: HTMLElement;        // defaults to document.body
}

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const STYLE_ID = "HeadMenuStyle";

const buildCss = (tabs: MenuTab[]): string => {
  const sectionRules = tabs
    .map(
      (tab, i) => `
      #radio-${tab.id}:checked ~ #HeadMenuPanel #section-${tab.id} {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
        transition:
          opacity   0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s,
          transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s;
      }`
    )
    .join("\n");

  return `
    #HeadMenuIcons {
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: row;
      gap: .5rem;
      z-index: 2001;
      color: white;
      font-family: monospace;
      align-items: flex-start;
      justify-content: center;
    }

    #HeadMenuIcons label {
      background: rgba(0, 0, 0, 0.9);
      cursor: pointer;
      border-radius: .5rem;
      padding: .2rem;
      font-size: 1.5rem;
      transition:
        font-size  0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
        padding    0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
        background 0.3s ease,
        transform  0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      will-change: font-size, padding, transform;
    }

    #HeadMenuIcons label.nav {
      font-size: 2.5rem;
      padding: .4rem;
    }
    #HeadMenuIcons label.nav:hover {
      background: rgba(64, 64, 64, 0.9);
    }

    #HeadMenuIcons label.menu-icone.is-checked {
      font-size: 2.5rem;
      padding: .4rem;
      background: rgba(40, 40, 40, 0.95);
      transform: scale(1.05);
    }

    #HeadMenuPanel {
      position: fixed;
      bottom: 10vh;
      left: 50%;
      transform: translateX(-50%);
      width: 60vw;
      height: 10vh;
      z-index: 2000;
      overflow: hidden;
      border-radius: .75rem;
    }

    #HeadMenuPanel .panel-section {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      border-radius: .75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: white;
      font-family: monospace;
      opacity: 0;
      transform: translateY(12px) scale(0.98);
      pointer-events: none;
      transition:
        opacity   0.45s cubic-bezier(0.34, 1.3, 0.64, 1),
        transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1);
    }

    ${sectionRules}
  `;
};

/* ─────────────────────────────────────────────
   DOM helpers
───────────────────────────────────────────── */
const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const child of children)
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  return node;
};

/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */
export const initHeadMenu = (config: HeadMenuConfig) => {
  const { tabs, defaultIndex = 0, mountTo = document.body } = config;

  // ── Cleanup previous instance ──────────────────────────────
  document.getElementById(STYLE_ID)?.remove();
  tabs.forEach(tab => document.getElementById(`radio-${tab.id}`)?.remove());
  document.getElementById("HeadMenuIcons")?.remove();
  document.getElementById("HeadMenuPanel")?.remove();

  // ── Styles ─────────────────────────────────────────────────
  mountTo.appendChild(
    el("style", { id: STYLE_ID }, buildCss(tabs))
  );

  // ── Radios (direct children of mountTo for ~ selector) ─────
  tabs.forEach((tab, i) => {
    const radio = el("input", {
      type:  "radio",
      name:  "menu-select",
      id:    `radio-${tab.id}`,
      value: tab.id,
      ...(i === defaultIndex ? { checked: "" } : {}),
    });
    mountTo.appendChild(radio);
  });

  // ── Icon strip ─────────────────────────────────────────────
  const iconsEl = el("div", { id: "HeadMenuIcons" });

  const leftArrow = el("label", { id: "HeadMenuSelectLeft", class: "nav" });
  leftArrow.innerHTML = `<i class="fa fa-arrow-circle-left" aria-hidden="true"></i>`;
  iconsEl.appendChild(leftArrow);

  tabs.forEach(tab => {
    const lbl = el("label", { for: `radio-${tab.id}`, class: "menu-icone" }, tab.icon);
    iconsEl.appendChild(lbl);
  });

  const rightArrow = el("label", { id: "HeadMenuSelectRight", class: "nav" });
  rightArrow.innerHTML = `<i class="fa fa-arrow-circle-right" aria-hidden="true"></i>`;
  iconsEl.appendChild(rightArrow);

  mountTo.appendChild(iconsEl);

  // ── Panel ──────────────────────────────────────────────────
  const panelEl = el("div", { id: "HeadMenuPanel" });

  tabs.forEach(tab => {
    const section = el("div", {
      id:    `section-${tab.id}`,
      class: "panel-section",
    }, `${tab.icon} — ${tab.id}`);   // placeholder content; replaced per-tab next iteration
    panelEl.appendChild(section);
  });

  mountTo.appendChild(panelEl);

  // ── Sync .is-checked class (drives CSS scale transition) ───
  const syncChecked = () => {
    const labels = iconsEl.querySelectorAll<HTMLElement>("label.menu-icone");
    tabs.forEach((tab, i) => {
      const radio = document.getElementById(`radio-${tab.id}`) as HTMLInputElement;
      labels[i]?.classList.toggle("is-checked", radio?.checked ?? false);
    });
  };

  tabs.forEach(tab => {
    document
      .getElementById(`radio-${tab.id}`)
      ?.addEventListener("change", syncChecked);
  });

  syncChecked();

  // ── Arrow navigation (clamp, no wrap) ─────────────────────
  const getRadios = () =>
    tabs.map(tab => document.getElementById(`radio-${tab.id}`) as HTMLInputElement);

  const moveSelection = (delta: number) => {
    const all     = getRadios();
    const current = all.findIndex(r => r.checked);
    const next    = current + delta;
    if (next < 0 || next >= all.length) return;
    all[next].checked = true;
    all[next].dispatchEvent(new Event("change"));
  };

  document
    .getElementById("HeadMenuSelectLeft")
    ?.addEventListener("click", () => moveSelection(-1));
  document
    .getElementById("HeadMenuSelectRight")
    ?.addEventListener("click", () => moveSelection(+1));
};