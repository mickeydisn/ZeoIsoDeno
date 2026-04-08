/* ═══════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════ */
export interface ParamConfig {
  id:              string;
  type:            "range" | "color";
  default:         number | string;
  min?:            number;
  max?:            number;
  step?:           number;
  callback_change: (value: number | string) => void;
}

export interface SubTool {
  id:              string;
  icon:            string;
  callback_select?: () => void;
  params?:         ParamConfig[];   // sub-level params (shown only when this sub is active)
}

export interface MenuTab {
  id:     string;
  icon:   string;
  sub?:   SubTool[];
  params?: ParamConfig[];           // tab-level params (always shown when tab is active)
}

export interface HeadMenuConfig {
  tabs:          MenuTab[];
  defaultIndex?: number;
  mountTo?:      HTMLElement;
}

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const STYLE_ID = "HeadMenuStyle";

const buildCss = (tabs: MenuTab[]): string => {
  // #radio-{id}:checked ~ #HeadMenuPanel => show that tab's section
  const sectionRules = tabs
    .map(tab => `
      #radio-${tab.id}:checked ~ #HeadMenuPanel #section-${tab.id} {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
        transition:
          opacity   0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s,
          transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s;
      }`)
    .join("\n");

  return `
    /* ── Head strip ── */
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

    #HeadMenuIcons input[type="radio"] { display: none; }

    /* Shared label style — used by BOTH head and sub strips */
    .hm-label {
      background: rgba(0, 0, 0, 0.9);
      cursor: pointer;
      border-radius: .5rem;
      padding: .2rem;
      font-size: 1.5rem;
      user-select: none;
      transition:
        font-size  0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
        padding    0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
        background 0.3s ease,
        transform  0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      will-change: font-size, padding, transform;
    }

    .hm-label.nav {
      font-size: 2.5rem;
      padding: .4rem;
    }
    .hm-label.nav:hover    { background: rgba(64, 64, 64, 0.9); }
    .hm-label.nav.disabled { opacity: 0.25; cursor: default; pointer-events: none; }

    .hm-label.is-checked {
      font-size: 2.5rem;
      padding: .4rem;
      background: rgba(40, 40, 40, 0.95);
      transform: scale(1.05);
    }

    /* ── Panel ── */
    #HeadMenuPanel {
      position: fixed;
      bottom: 10vh;
      left: 50%;
      transform: translateX(-50%);
      width: 60vw;
      height: 10vh;
      z-index: 2000;
      border-radius: .75rem;
      overflow: hidden;
    }

    .panel-section {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      border-radius: .75rem;
      display: flex;
      align-items: center;
      padding: 0 .75rem;
      gap: .5rem;
      color: white;
      font-family: monospace;
      opacity: 0;
      transform: translateY(12px) scale(0.98);
      pointer-events: none;
      transition:
        opacity   0.45s cubic-bezier(0.34, 1.3, 0.64, 1),
        transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1);
    }

    /* Sub-tool strip (left part of panel) */
    .hm-sub-strip {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: .4rem;
      flex-shrink: 0;
    }

    /* Divider between sub-strip and params */
    .hm-divider {
      width: 1px;
      align-self: stretch;
      margin: .4rem 0;
      background: rgba(255,255,255,0.15);
      flex-shrink: 0;
    }

    /* Params area (right part of panel) */
    .hm-params {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: .75rem;
      flex: 1;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      padding: 0 .25rem;
    }
    .hm-params::-webkit-scrollbar { display: none; }

    .hm-param {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: .1rem;
      flex-shrink: 0;
    }
    .hm-param.hidden { display: none; }

    .hm-param label {
      font-size: .65rem;
      opacity: 0.55;
      letter-spacing: .04em;
      text-transform: uppercase;
      /* override hm-label sizing — param labels are static */
      font-size: .65rem !important;
      padding: 0 !important;
      background: none !important;
      transform: none !important;
      cursor: default;
      pointer-events: none;
    }

    .hm-param input[type="range"] {
      width: 90px;
      accent-color: white;
      cursor: pointer;
    }

    .hm-param input[type="color"] {
      width: 32px;
      height: 22px;
      border: none;
      border-radius: .3rem;
      cursor: pointer;
      background: none;
      padding: 0;
    }

    ${sectionRules}
  `;
};

/* ═══════════════════════════════════════════════════════════════
   DOM helpers
═══════════════════════════════════════════════════════════════ */
const el = <K extends keyof HTMLElementTagNameMap>(
  tag:    K,
  attrs:  Record<string, string> = {},
  ...children: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const child of children)
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  return node;
};

/* ═══════════════════════════════════════════════════════════════
   Param rendering
═══════════════════════════════════════════════════════════════ */
const buildParam = (param: ParamConfig, scope: string): HTMLElement => {
  const wrapper = el("div", {
    class:             "hm-param",
    "data-param-id":   param.id,
    "data-param-scope": scope,   // "tab" | sub.id
  });

  const labelEl = el("label", {}, param.id);
  labelEl.classList.add("hm-label");
  wrapper.appendChild(labelEl);

  if (param.type === "range") {
    const input = el("input", {
      type:  "range",
      min:   String(param.min  ?? 0),
      max:   String(param.max  ?? 1),
      step:  String(param.step ?? 1),
      value: String(param.default),
    }) as HTMLInputElement;
    input.addEventListener("input", () =>
      param.callback_change(parseFloat(input.value))
    );
    wrapper.appendChild(input);

  } else if (param.type === "color") {
    const input = el("input", {
      type:  "color",
      value: String(param.default),
    }) as HTMLInputElement;
    input.addEventListener("input", () =>
      param.callback_change(input.value)
    );
    wrapper.appendChild(input);
  }

  return wrapper;
};

/* ═══════════════════════════════════════════════════════════════
   Fire all visible params with their current values
═══════════════════════════════════════════════════════════════ */
const fireVisibleParams = (
  section:    HTMLElement,
  tab:        MenuTab,
  activeSubId: string | null
) => {
  // Collect all params that are currently visible (not .hidden)
  const allParams: ParamConfig[] = [];

  // Tab-level params
  for (const p of tab.params ?? []) allParams.push(p);

  // Active-sub params
  if (activeSubId) {
    const sub = tab.sub?.find(s => s.id === activeSubId);
    for (const p of sub?.params ?? []) allParams.push(p);
  }

  for (const param of allParams) {
    const inputEl = section.querySelector<HTMLInputElement>(
      `[data-param-id="${param.id}"] input`
    );
    if (!inputEl) continue;
    const value = param.type === "range"
      ? parseFloat(inputEl.value)
      : inputEl.value;
    param.callback_change(value);
  }
};

/* ═══════════════════════════════════════════════════════════════
   Init
═══════════════════════════════════════════════════════════════ */
export const initHeadMenu = (config: HeadMenuConfig) => {
  const { tabs, defaultIndex = 0, mountTo = document.body } = config;

  // ── Cleanup ────────────────────────────────────────────────
  document.getElementById(STYLE_ID)?.remove();
  tabs.forEach(tab => document.getElementById(`radio-${tab.id}`)?.remove());
  document.getElementById("HeadMenuIcons")?.remove();
  document.getElementById("HeadMenuPanel")?.remove();

  // ── Styles ─────────────────────────────────────────────────
  mountTo.appendChild(el("style", { id: STYLE_ID }, buildCss(tabs)));

  // ── Tab radios (direct mountTo children for ~ selector) ────
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

  // ── Head icon strip ────────────────────────────────────────
  const iconsEl = el("div", { id: "HeadMenuIcons" });

  const leftNav = el("label", { id: "HeadMenuSelectLeft", class: "hm-label nav" });
  leftNav.innerHTML = `<i class="fa fa-arrow-circle-left" aria-hidden="true"></i>`;
  iconsEl.appendChild(leftNav);

  tabs.forEach(tab => {
    iconsEl.appendChild(
      el("label", { for: `radio-${tab.id}`, class: "hm-label menu-icone" }, tab.icon)
    );
  });

  const rightNav = el("label", { id: "HeadMenuSelectRight", class: "hm-label nav" });
  rightNav.innerHTML = `<i class="fa fa-arrow-circle-right" aria-hidden="true"></i>`;
  iconsEl.appendChild(rightNav);

  mountTo.appendChild(iconsEl);

  // ── Panel ──────────────────────────────────────────────────
  const panelEl = el("div", { id: "HeadMenuPanel" });

  // Track active sub per tab (persisted across tab switches)
  const activeSubIndex: Record<string, number> = {};

  tabs.forEach((tab, tabIdx) => {
    const section = el("div", { id: `section-${tab.id}`, class: "panel-section" });
    const hasSub  = (tab.sub?.length ?? 0) > 0;

    // ── Sub-tool strip ────────────────────────────────────────
    if (hasSub) {
      const strip = el("div", { class: "hm-sub-strip" });
      activeSubIndex[tab.id] = 0;

      // Left nav
      const subLeft = el("label", {
        class:            "hm-label nav",
        "data-sub-nav":   "left",
        "data-tab-id":    tab.id,
      });
      subLeft.innerHTML = `<i class="fa fa-arrow-circle-left" aria-hidden="true"></i>`;
      strip.appendChild(subLeft);

      // Sub icons
      tab.sub!.forEach(sub => {
        strip.appendChild(
          el("span", {
            class:        "hm-label menu-icone",
            "data-sub-id": sub.id,
            "data-tab-id": tab.id,
          }, sub.icon)
        );
      });

      // Right nav
      const subRight = el("label", {
        class:          "hm-label nav",
        "data-sub-nav": "right",
        "data-tab-id":  tab.id,
      });
      subRight.innerHTML = `<i class="fa fa-arrow-circle-right" aria-hidden="true"></i>`;
      strip.appendChild(subRight);

      section.appendChild(strip);
    }

    // ── Divider (only when there are params to show) ──────────
    const hasAnyParam = (tab.params?.length ?? 0) > 0
      || tab.sub?.some(s => (s.params?.length ?? 0) > 0);

    if (hasAnyParam) {
      section.appendChild(el("div", { class: "hm-divider" }));
    }

    // ── Params area ───────────────────────────────────────────
    if (hasAnyParam) {
      const paramsArea = el("div", { class: "hm-params" });

      // Tab-level params (always visible when this tab is active)
      for (const param of tab.params ?? []) {
        paramsArea.appendChild(buildParam(param, "tab"));
      }

      // Sub-level params (hidden by default, shown per active sub)
      for (const sub of tab.sub ?? []) {
        for (const param of sub.params ?? []) {
          const w = buildParam(param, sub.id);
          w.classList.add("hidden");
          paramsArea.appendChild(w);
        }
      }

      section.appendChild(paramsArea);
    }

    panelEl.appendChild(section);
  });

  mountTo.appendChild(panelEl);

  /* ── Helpers ──────────────────────────────────────────────── */

  const getTabLabels = () =>
    iconsEl.querySelectorAll<HTMLElement>("label.menu-icone");

  const getTabRadios = () =>
    tabs.map(t => document.getElementById(`radio-${t.id}`) as HTMLInputElement);

  const getActiveTabIndex = () =>
    getTabRadios().findIndex(r => r.checked);

  // Sync .is-checked on head labels + update nav disabled state
  const syncHeadChecked = () => {
    const radios = getTabRadios();
    const labels = getTabLabels();
    const idx    = radios.findIndex(r => r.checked);
    labels.forEach((lbl, i) => lbl.classList.toggle("is-checked", i === idx));
    leftNav.classList.toggle("disabled",  idx === 0);
    rightNav.classList.toggle("disabled", idx === tabs.length - 1);
  };

  // Update sub-strip for a given tab: sync .is-checked + show/hide sub params
  const syncSubStrip = (tab: MenuTab, activeIdx: number) => {
    const section = document.getElementById(`section-${tab.id}`)!;

    // Sub icon labels
    section.querySelectorAll<HTMLElement>("[data-sub-id]").forEach((lbl, i) => {
      lbl.classList.toggle("is-checked", i === activeIdx);
    });

    // Sub-nav disabled state
    const subLeft  = section.querySelector<HTMLElement>('[data-sub-nav="left"]');
    const subRight = section.querySelector<HTMLElement>('[data-sub-nav="right"]');
    subLeft?.classList.toggle("disabled",  activeIdx === 0);
    subRight?.classList.toggle("disabled", activeIdx === (tab.sub!.length - 1));

    // Sub-level params visibility
    const activeSub = tab.sub![activeIdx];
    section.querySelectorAll<HTMLElement>("[data-param-scope]").forEach(w => {
      const scope = w.dataset.paramScope!;
      if (scope === "tab") return;                               // always visible
      w.classList.toggle("hidden", scope !== activeSub.id);
    });
  };

  // Fire callbacks for a tab becoming active (or a sub changing within it)
  const fireTabActive = (tab: MenuTab, activeSubIdx: number) => {
    const section    = document.getElementById(`section-${tab.id}`)!;
    const activeSub  = tab.sub?.[activeSubIdx] ?? null;

    activeSub?.callback_select?.();
    fireVisibleParams(section, tab, activeSub?.id ?? null);
  };

  /* ── Wire sub-strip clicks ─────────────────────────────────── */
  panelEl.addEventListener("click", e => {
    const target = e.target as HTMLElement;
    const closest = target.closest<HTMLElement>("[data-sub-id], [data-sub-nav]");
    if (!closest) return;

    const tabId = closest.dataset.tabId!;
    const tab   = tabs.find(t => t.id === tabId)!;

    if (closest.dataset.subNav) {
      // Arrow navigation
      const delta = closest.dataset.subNav === "left" ? -1 : 1;
      const next  = activeSubIndex[tabId] + delta;
      if (next < 0 || next >= tab.sub!.length) return;
      activeSubIndex[tabId] = next;
    } else {
      // Direct icon click
      const clickedId = closest.dataset.subId!;
      activeSubIndex[tabId] = tab.sub!.findIndex(s => s.id === clickedId);
    }

    syncSubStrip(tab, activeSubIndex[tabId]);
    fireTabActive(tab, activeSubIndex[tabId]);
  });

  /* ── Wire head tab radios ──────────────────────────────────── */
  tabs.forEach(tab => {
    document.getElementById(`radio-${tab.id}`)?.addEventListener("change", () => {
      syncHeadChecked();
      // Ensure sub strip is synced to persisted sub index
      if (tab.sub?.length) syncSubStrip(tab, activeSubIndex[tab.id] ?? 0);
      fireTabActive(tab, activeSubIndex[tab.id] ?? 0);
    });
  });

  /* ── Head arrow navigation ─────────────────────────────────── */
  const moveTab = (delta: number) => {
    const all  = getTabRadios();
    const next = getActiveTabIndex() + delta;
    if (next < 0 || next >= all.length) return;
    all[next].checked = true;
    all[next].dispatchEvent(new Event("change"));
  };

  leftNav.addEventListener("click",  () => moveTab(-1));
  rightNav.addEventListener("click", () => moveTab(+1));

  /* ── Bootstrap: apply initial state ───────────────────────── */
  syncHeadChecked();
  const defaultTab = tabs[defaultIndex];
  if (defaultTab) {
    if (defaultTab.sub?.length) syncSubStrip(defaultTab, 0);
    fireTabActive(defaultTab, 0);
  }
};