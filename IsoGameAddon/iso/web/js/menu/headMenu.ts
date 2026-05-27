import { assetCssClass } from "./sections/assetMenu.ts";

/* ═══════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════ */
export type DisplayState = "visible" | "disabled" | "hidden";

export interface ParamConfig {
  id: string;
  type: "range" | "color" | "div";
  default?: number | string;
  min?: number;
  max?: number;
  step?: number;
  callback_change?: (value: number | string) => void;
  // for type "div": dev mounts content into the returned element
  mount?: (container: HTMLElement) => void;
}

export interface SubTool {
  id: string;
  icon: string;
  display?: DisplayState;
  callback_select?: () => void;
  params?: ParamConfig[];
}

export interface MenuTab {
  id: string;
  icon: string;
  display?: DisplayState;
  sub?: SubTool[];
  params?: ParamConfig[];
}

export interface HeadMenuConfig {
  tabs: MenuTab[];
  defaultIndex?: number;
  mountTo?: HTMLElement;
}

// Partial update shape — only ids + display needed
export interface DisplayUpdateSub {
  id: string;
  display?: DisplayState;
}
export interface DisplayUpdateTab {
  id: string;
  display?: DisplayState;
  sub?: DisplayUpdateSub[];
}

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const STYLE_ID = "HeadMenuStyle";

const buildCss = (tabs: MenuTab[]): string => {
  const sectionRules = tabs
    .map((tab) => `
      #radio-${tab.id}:checked ~ #HeadMenuPanel #section-${tab.id} {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
        transition:
          opacity   0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s,
          transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s;
      }`)
    .join("\n");

  return /* css */ `
    #HeadMenuIcons,  #HeadMenuPanel  {
      --back-hieght: 3.3rem;
      --opacity-hover: 0.9;
      --opacity-disabled: 0.25;
      --color-back-tranp : rgba(0, 0, 0, 0);
      --color-back-white: rgba(255, 255, 255, 0.5);
      /* --color-back: rgba(0, 0, 0, 0.5); */
      --color-back: #3A3A3A;     
      --color-active: rgba(0, 0, 0, 1);
    }

    #HeadMenuIcons {
      position: fixed;
      top: 10px;
      left: 50%;
      height: var(--back-hieght);
      border-radius:var(--back-hieght);
      transform: translateX(-50%);
      display: flex;
      flex-direction: row;
      gap: .5rem;
      z-index: 2001;
      color: white;
      font-family: monospace;
      align-items: center;
      justify-content: center;
      background-color: var( --color-back);
      /*
      background: linear-gradient(180deg, var(--color-back-tranp) 0%, var(--color-back-tranp) 40%, var(--color-back) 40%, var(--color-back) 60%, var(--color-back-tranp) 60%, var(--color-back-tranp) 100%);
      */
    }

    #HeadMenuIcons input[type="radio"] { display: none; }

    .hm-radio-hidden { 
      display: none;
    }

    /*--------------*/    

    .hm-label {
      
      cursor: pointer;
      border-radius: .5rem;
      padding: .2rem;
      font-size: 1.5rem;
      user-select: none;
      
      transition:
        font-size  0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
        padding    0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
        background 0.3s ease,
        transform  0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
        opacity    0.3s ease;
      will-change: font-size, padding, transform, opacity;
    }

    .hm-label.nav {
      font-size: var(--back-hieght);
      padding: .4rem;
      height: calc(2 var(--back-hieght));
      width: calc(var(--back-hieght));
      border-radius: 100%;
      line-height: 0;
      opacity: .3;
    }
    .hm-label.nav::before {
        content: "";
        position: absolute;
        z-index: -1;
        top: .1rem; left: .1rem; right: .1rem; bottom: .1rem;
        border-radius: inherit;
        background-color: var(--color-active);
    }
    .hm-label.nav:hover     { background: rgba(64, 64, 64, 0.9); }
    .hm-label.nav.disabled  { opacity: 0.25; cursor: default; pointer-events: none; }

    .hm-label.nav.left { margin-right: 2rem;} 
    .hm-label.nav.right { margin-left: 2rem; } 

    .hm-label.menu-icone {
      opacity: .4;
      background-color: var(--color-active);
    }
    .hm-label.is-checked {
      font-size: 2.5rem;
      padding: .4rem;
      transform: scale(1.05);
      opacity: 1;
    }

    /* display states on tool icons */
    .hm-label.hm-disabled {
      opacity: 0.1;
      background-color: #900
      cursor: default;
      pointer-events: none;
    }
    .hm-label.hm-hidden {
      display: none;
    }


    /*--------------*/    
    #HeadMenuPanel {
      z-index: 2000;
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      width: 60vw;
      height: var(--back-hieght);
      border-bottom: calc(var(--back-hieght)/2) solid var(--color-back);
      bottom:0px;



      .panel-section {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;

        background-color: var(--color-back);
        border-radius: calc(var(--back-hieght)/2) calc(var(--back-hieght)/2) 0 0;
        padding: 0 .75rem;
        gap: .5rem;

        color: white;
        font-family: monospace;
        pointer-events: none;

        transform: translateY(12px) scale(0.98);
        opacity: 0;
        transition:
          opacity   0.45s cubic-bezier(0.34, 1.3, 0.64, 1),
          transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1);
      }

    }

    #HeadMenuPanel {


      select {
        appearance: base-select;
        background-color:  var(--color-active);
        color: white;
        display: flex;
        align-items: center;
        font-weight: 900;
        padding: 1rem .5rem;
        border: none;
        border-radius: 1rem;
        width:10rem;
      }   
      select::picker-icon {
        content:'▽';
      }
      select::picker(select) {
        appearance: base-select;

        /* ✅ Size */
        width:25rem;
        height: 40vh;
        overflow-y: auto;
        margin-bottom: 3rem;

        background-color: var(--color-back-white);
        border: none;
        border-radius: 1rem;
        padding: 0.5rem .5rem;
        color: white;

      }

      option {
        padding: 1rem 0;
        margin: 1.5rem 0;

        background-color: var(--color-back);
        border-radius: 1rem;
        font-size: 1.2rem;

        border: none;
        color: white;

        &:hover {
          background-color: var(--color-active);
        }
        &:checked {
          background-color: var(--color-active);
        }
      
      }
    }


    .hm-sub-strip {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: .4rem;
      flex-shrink: 0;
    }

    .hm-divider {
      width: 1px;
      align-self: stretch;
      margin: .4rem 0;
      background-color: rgba(255,255,255,0.15);
      flex-shrink: 0;
    }

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

    /* param label row: id + numeric readout */
    .hm-param-value {
        font-size: 1.5rem;
        opacity: 0.85;
        font-family: monospace;
        text-align: right;
        padding-left: .2rem;
    }
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

    /* div param: dev-mounted content area */
    .hm-param-div {
      display: flex;
      align-items: center;
      min-width: 32px;
      min-height: 22px;
    }

    ${sectionRules}

    ${assetCssClass}
    
  ` /* css */;
};

/* ═══════════════════════════════════════════════════════════════
   DOM helper
═══════════════════════════════════════════════════════════════ */
const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const child of children) {
    node.appendChild(
      typeof child === "string" ? document.createTextNode(child) : child,
    );
  }
  return node;
};

/* ═══════════════════════════════════════════════════════════════
   Param builder
═══════════════════════════════════════════════════════════════ */
const buildParam = (param: ParamConfig, scope: string): HTMLElement => {
  const wrapper = el("div", {
    class: "hm-param",
    "data-param-id": param.id,
    "data-param-scope": scope,
  });

  if (param.type === "range") {
    const header = el("div", { class: "hm-param-header" });
    const title = el("span", { class: "hm-param-title" }, param.id);
    const readout = el(
      "span",
      { class: "hm-param-value" },
      String(param.default ?? 0),
    );
    header.appendChild(title);
    header.appendChild(readout);
    wrapper.appendChild(header);

    const input = el("input", {
      type: "range",
      min: String(param.min ?? 0),
      max: String(param.max ?? 1),
      step: String(param.step ?? 1),
      value: String(param.default ?? 0),
    }) as HTMLInputElement;

    input.addEventListener("input", () => {
      readout.textContent = input.value;
      param.callback_change?.(parseFloat(input.value));
    });

    wrapper.appendChild(input);
  } else if (param.type === "color") {
    const input = el("input", {
      type: "color",
      value: String(param.default ?? "#000000"),
    }) as HTMLInputElement;

    input.addEventListener("input", () => param.callback_change?.(input.value));
    wrapper.appendChild(input);
  } else if (param.type === "div") {
    const container = el("div", { class: "hm-param-div" });
    wrapper.appendChild(container);

    // Let dev mount content asynchronously after DOM is ready
    if (param.mount) {
      requestAnimationFrame(() => param.mount!(container));
    }
  }

  return wrapper;
};

/* ═══════════════════════════════════════════════════════════════
   Fire visible params with current values
═══════════════════════════════════════════════════════════════ */
const fireVisibleParams = (
  section: HTMLElement,
  tab: MenuTab,
  activeSubId: string | null,
) => {
  const allParams: ParamConfig[] = [
    ...(tab.params ?? []),
    ...(activeSubId
      ? (tab.sub?.find((s) => s.id === activeSubId)?.params ?? [])
      : []),
  ];

  for (const param of allParams) {
    if (!param.callback_change) continue;
    const inputEl = section.querySelector<HTMLInputElement>(
      `[data-param-id="${param.id}"] input`,
    );
    if (!inputEl) continue;
    const value = param.type === "range"
      ? parseFloat(inputEl.value)
      : inputEl.value;
    param.callback_change(value);
  }
};

/* ═══════════════════════════════════════════════════════════════
   Apply display state to a label element
═══════════════════════════════════════════════════════════════ */
const applyDisplay = (el: HTMLElement, state: DisplayState) => {
  console.log(
    `Setting display of ${el.dataset.tabId ?? el.dataset.subId} to ${state}`,
  );
  el.classList.remove("hm-disabled", "hm-hidden");
  if (state === "disabled") el.classList.add("hm-disabled");
  if (state === "hidden") el.classList.add("hm-hidden");
};

/* ═══════════════════════════════════════════════════════════════
   Init
═══════════════════════════════════════════════════════════════ */
export const initHeadMenu = (gameWorker: Worker, config: HeadMenuConfig) => {
  const { tabs, defaultIndex = 0, mountTo = document.body } = config;

  // ── Cleanup ────────────────────────────────────────────────
  document.getElementById(STYLE_ID)?.remove();
  tabs.forEach((t) => document.getElementById(`radio-${t.id}`)?.remove());
  document.getElementById("HeadMenuIcons")?.remove();
  document.getElementById("HeadMenuPanel")?.remove();

  // ── Styles ─────────────────────────────────────────────────
  mountTo.appendChild(el("style", { id: STYLE_ID }, buildCss(tabs)));

  // ── Tab radios ─────────────────────────────────────────────
  tabs.forEach((tab, i) => {
    const radio = el("input", {
      class: "hm-radio-hidden",
      type: "radio",
      name: "menu-select",
      id: `radio-${tab.id}`,
      value: tab.id,
      ...(i === defaultIndex ? { checked: "" } : {}),
    });
    mountTo.appendChild(radio);
  });

  // ── Head icon strip ────────────────────────────────────────
  const iconsEl = el("div", { id: "HeadMenuIcons" });
  const leftNav = el("label", {
    id: "HeadMenuSelectLeft",
    class: "hm-label nav left",
  });
  const rightNav = el("label", {
    id: "HeadMenuSelectRight",
    class: "hm-label nav right",
  });
  leftNav.innerHTML =
    `<i class="fa fa-arrow-circle-left"  aria-hidden="true"></i>`;
  rightNav.innerHTML =
    `<i class="fa fa-arrow-circle-right" aria-hidden="true"></i>`;

  iconsEl.appendChild(leftNav);
  tabs.forEach((tab) => {
    const lbl = el("label", {
      for: `radio-${tab.id}`,
      class: "hm-label menu-icone",
      "data-tab-id": tab.id,
    }, tab.icon);
    applyDisplay(lbl, tab.display ?? "visible");
    iconsEl.appendChild(lbl);
  });
  iconsEl.appendChild(rightNav);
  mountTo.appendChild(iconsEl);

  // ── Panel ──────────────────────────────────────────────────
  const panelEl = el("div", { id: "HeadMenuPanel" });

  // Persist active sub index per tab
  const activeSubIndex: Record<string, number> = {};

  tabs.forEach((tab) => {
    const section = el("div", {
      id: `section-${tab.id}`,
      class: "panel-section",
    });
    const hasSub = (tab.sub?.length ?? 0) > 0;
    const hasParam = (tab.params?.length ?? 0) > 0 ||
      tab.sub?.some((s) => (s.params?.length ?? 0) > 0);

    activeSubIndex[tab.id] = 0;

    // Sub-tool strip
    if (hasSub) {
      const strip = el("div", { class: "hm-sub-strip" });
      const subLeft = el("label", {
        class: "hm-label nav",
        "data-sub-nav": "left",
        "data-tab-id": tab.id,
      });
      const subRight = el("label", {
        class: "hm-label nav",
        "data-sub-nav": "right",
        "data-tab-id": tab.id,
      });
      subLeft.innerHTML =
        `<i class="fa fa-arrow-circle-left"  aria-hidden="true"></i>`;
      subRight.innerHTML =
        `<i class="fa fa-arrow-circle-right" aria-hidden="true"></i>`;

      strip.appendChild(subLeft);
      tab.sub!.forEach((sub) => {
        const lbl = el("span", {
          class: "hm-label menu-icone",
          "data-sub-id": sub.id,
          "data-tab-id": tab.id,
        }, sub.icon);
        applyDisplay(lbl, sub.display ?? "visible");
        strip.appendChild(lbl);
      });
      strip.appendChild(subRight);
      section.appendChild(strip);
    }

    if (hasParam) section.appendChild(el("div", { class: "hm-divider" }));

    // Params area
    if (hasParam) {
      const paramsArea = el("div", { class: "hm-params" });

      // Tab-level params — always visible when tab is active
      for (const param of tab.params ?? []) {
        paramsArea.appendChild(buildParam(param, "tab"));
      }

      // Sub-level params — scoped, hidden until their sub is active
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

  /* ── Navigation helpers ────────────────────────────────────── */

  // Returns navigable (visible + not disabled) indices for head tabs
  const navigableTabIndices = (): number[] =>
    tabs.reduce<number[]>((acc, tab, i) => {
      const lbl = iconsEl.querySelector<HTMLElement>(
        `[data-tab-id="${tab.id}"]`,
      );
      if (
        lbl && !lbl.classList.contains("hm-hidden") &&
        !lbl.classList.contains("hm-disabled")
      ) {
        acc.push(i);
      }
      return acc;
    }, []);

  // Returns navigable sub indices for a given tab
  const navigableSubIndices = (tab: MenuTab): number[] => {
    const section = document.getElementById(`section-${tab.id}`)!;
    return (tab.sub ?? []).reduce<number[]>((acc, sub, i) => {
      const lbl = section.querySelector<HTMLElement>(
        `[data-sub-id="${sub.id}"]`,
      );
      if (
        lbl && !lbl.classList.contains("hm-hidden") &&
        !lbl.classList.contains("hm-disabled")
      ) {
        acc.push(i);
      }
      return acc;
    }, []);
  };

  const getTabRadios = () =>
    tabs.map((t) =>
      document.getElementById(`radio-${t.id}`) as HTMLInputElement
    );

  const getActiveTabIndex = () => getTabRadios().findIndex((r) => r.checked);

  /* ── Sync sub strip state ───────────────────────────────────── */
  const syncSubStrip = (tab: MenuTab, activeIdx: number) => {
    const section = document.getElementById(`section-${tab.id}`)!;
    const navigable = navigableSubIndices(tab);

    section.querySelectorAll<HTMLElement>("[data-sub-id]").forEach((lbl, i) => {
      lbl.classList.toggle("is-checked", i === activeIdx);
    });

    const subLeft = section.querySelector<HTMLElement>('[data-sub-nav="left"]');
    const subRight = section.querySelector<HTMLElement>(
      '[data-sub-nav="right"]',
    );
    const firstNav = navigable[0];
    const lastNav = navigable[navigable.length - 1];
    subLeft?.classList.toggle("disabled", activeIdx <= (firstNav ?? 0));
    subRight?.classList.toggle("disabled", activeIdx >= (lastNav ?? 0));

    // Show/hide sub-scoped params
    const activeSub = tab.sub![activeIdx];
    section.querySelectorAll<HTMLElement>("[data-param-scope]").forEach((w) => {
      const scope = w.dataset.paramScope!;
      if (scope === "tab") return;
      w.classList.toggle("hidden", scope !== activeSub.id);
    });
  };

  /* ── Sync head labels ───────────────────────────────────────── */
  const syncHeadChecked = () => {
    const radios = getTabRadios();
    const idx = radios.findIndex((r) => r.checked);
    const navigable = navigableTabIndices();
    const firstNav = navigable[0] ?? 0;
    const lastNav = navigable[navigable.length - 1] ?? tabs.length - 1;

    iconsEl.querySelectorAll<HTMLElement>("[data-tab-id]").forEach((lbl, i) =>
      lbl.classList.toggle("is-checked", i === idx)
    );

    leftNav.classList.toggle("disabled", idx <= firstNav);
    rightNav.classList.toggle("disabled", idx >= lastNav);
  };

  /* ── Fire callbacks ─────────────────────────────────────────── */
  const fireTabActive = (tab: MenuTab, activeSubIdx: number) => {
    const section = document.getElementById(`section-${tab.id}`)!;
    const activeSub = tab.sub?.[activeSubIdx] ?? null;

    gameWorker.postMessage({
      action: "setActiveTool",
      toolId: "",
    });

    activeSub?.callback_select?.();
    fireVisibleParams(section, tab, activeSub?.id ?? null);
  };

  /* ── Sub-strip click delegation ─────────────────────────────── */
  panelEl.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-sub-id],[data-sub-nav]",
    );
    if (!target) return;

    const tabId = target.dataset.tabId!;
    const tab = tabs.find((t) => t.id === tabId)!;
    const navigable = navigableSubIndices(tab);
    if (!navigable.length) return;

    if (target.dataset.subNav) {
      const delta = target.dataset.subNav === "left" ? -1 : 1;
      const curPos = navigable.indexOf(activeSubIndex[tabId]);
      const nextPos = curPos + delta;
      if (nextPos < 0 || nextPos >= navigable.length) return;
      activeSubIndex[tabId] = navigable[nextPos];
    } else {
      const clickedId = target.dataset.subId!;
      const idx = tab.sub!.findIndex((s) => s.id === clickedId);
      if (idx === -1) return;
      if (
        tab.sub![idx].display === "disabled" ||
        tab.sub![idx].display === "hidden"
      ) return;
      activeSubIndex[tabId] = idx;
    }

    syncSubStrip(tab, activeSubIndex[tabId]);
    fireTabActive(tab, activeSubIndex[tabId]);
  });

  /* ── Tab radio change ───────────────────────────────────────── */
  tabs.forEach((tab) => {
    document.getElementById(`radio-${tab.id}`)?.addEventListener(
      "change",
      () => {
        syncHeadChecked();
        if (tab.sub?.length) syncSubStrip(tab, activeSubIndex[tab.id] ?? 0);
        fireTabActive(tab, activeSubIndex[tab.id] ?? 0);
      },
    );
  });

  /* ── Head arrow navigation (skip hidden/disabled) ───────────── */
  const moveTab = (delta: number) => {
    const navigable = navigableTabIndices();
    const curIdx = getActiveTabIndex();
    const curPos = navigable.indexOf(curIdx);
    const nextPos = curPos + delta;
    if (nextPos < 0 || nextPos >= navigable.length) return;
    const all = getTabRadios();
    all[navigable[nextPos]].checked = true;
    all[navigable[nextPos]].dispatchEvent(new Event("change"));
  };

  leftNav.addEventListener("click", () => moveTab(-1));
  rightNav.addEventListener("click", () => moveTab(+1));

  /* ── Bootstrap ─────────────────────────────────────────────── */
  syncHeadChecked();
  const defaultTab = tabs[defaultIndex];
  if (defaultTab) {
    if (defaultTab.sub?.length) syncSubStrip(defaultTab, 0);
    fireTabActive(defaultTab, 0);
  }

  /* ═══════════════════════════════════════════════════════════
     Public API: updateDisplay
     Accepts a partial list — anything not mentioned resets to
     the original config display value (or "visible" if absent).
  ═══════════════════════════════════════════════════════════ */
  const updateDisplay = (updates: DisplayUpdateTab[]) => {
    tabs.forEach((tab) => {
      const upd = updates.find((u) => u.id === tab.id);
      const tabState = upd?.display ?? tab.display ?? "visible";

      // Head label
      const tabLbl = iconsEl.querySelector<HTMLElement>(
        `[data-tab-id="${tab.id}"]`,
      );
      if (tabLbl) applyDisplay(tabLbl, tabState);

      // Sub labels
      const section = document.getElementById(`section-${tab.id}`);
      tab.sub?.forEach((sub) => {
        const subUpd = upd?.sub?.find((s) => s.id === sub.id);
        const subState = subUpd?.display ?? sub.display ?? "visible";
        const subLbl = section?.querySelector<HTMLElement>(
          `[data-sub-id="${sub.id}"]`,
        );
        if (subLbl) applyDisplay(subLbl, subState);
      });
    });

    // Re-sync nav arrows after display changes
    syncHeadChecked();
    const activeTab = tabs[getActiveTabIndex()];
    if (activeTab?.sub?.length) {
      syncSubStrip(activeTab, activeSubIndex[activeTab.id] ?? 0);
    }
  };

  return { updateDisplay };
};
