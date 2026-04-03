/**
 * ColorPicker — Color Suffix Helper Component
 *
 * Provides a UI for constructing color filter suffixes in the format #H_C_S_B
 * (Height, Color, Saturation, Brightness) or template references like {WALL_SUFFIX}.
 */

export interface ColorPickerOptions {
  /** Initial suffix value (can be raw #H_C_S_B or {PARAM_REF}) */
  initialValue?: string;
  /** Available template parameter names for template references */
  templateParams?: string[];
  /** Callback when suffix value changes */
  onChange: (suffix: string) => void;
}

interface ColorValues {
  h: number;  // Height: 0-300
  c: number;  // Color: 0-255
  s: number;  // Saturation: 0-100
  b: number;  // Brightness: 50-200
}

// Preset colors for common use cases
const COLOR_PRESETS: { label: string; values: ColorValues }[] = [
  { label: "Wall", values: { h: 210, c: 115, s: 35, b: 120 } },
  { label: "Roof", values: { h: 200, c: 80, s: 50, b: 100 } },
  { label: "Fence", values: { h: 180, c: 140, s: 30, b: 130 } },
  { label: "Door", values: { h: 190, c: 60, s: 60, b: 90 } },
  { label: "Stone", values: { h: 200, c: 150, s: 15, b: 140 } },
];

export class ColorPicker {
  private container: HTMLElement;
  private options: ColorPickerOptions;
  private values: ColorValues;
  private useTemplateRef: boolean = false;
  private selectedTemplateParam: string = "";

  constructor(
    container: HTMLElement,
    options: ColorPickerOptions
  ) {
    this.container = container;
    this.options = options;
    this.values = this.parseSuffix(options.initialValue || "");
  }

  /**
   * Parse a suffix string into color values.
   * Supports: #H210_C115_S35_B120 or {WALL_SUFFIX}
   */
  private parseSuffix(suffix: string): ColorValues {
    const defaults: ColorValues = { h: 210, c: 115, s: 35, b: 120 };

    // Check for template reference
    if (suffix.startsWith("{") && suffix.endsWith("}")) {
      this.useTemplateRef = true;
      this.selectedTemplateParam = suffix.slice(1, -1);
      return defaults;
    }

    // Parse raw suffix: #H210_C115_S35_B120
    this.useTemplateRef = false;
    const match = suffix.match(/#H(\d+)_C(\d+)_S(\d+)_B(\d+)/);
    if (match) {
      return {
        h: parseInt(match[1], 10),
        c: parseInt(match[2], 10),
        s: parseInt(match[3], 10),
        b: parseInt(match[4], 10),
      };
    }

    return defaults;
  }

  /**
   * Construct suffix string from current values.
   */
  private buildSuffix(): string {
    if (this.useTemplateRef && this.selectedTemplateParam) {
      return `{${this.selectedTemplateParam}}`;
    }
    return `#H${this.values.h}_C${this.values.c}_S${this.values.s}_B${this.values.b}`;
  }

  /**
   * Render the color picker component.
   */
  render(): void {
    this.container.innerHTML = "";
    this.container.className = "color-picker";

    // Mode toggle: Raw vs Template Reference
    const modeToggle = document.createElement("div");
    modeToggle.className = "color-picker-mode";

    const rawRadio = document.createElement("input");
    rawRadio.type = "radio";
    rawRadio.name = "color-mode";
    rawRadio.id = "color-mode-raw";
    rawRadio.checked = !this.useTemplateRef;

    const rawLabel = document.createElement("label");
    rawLabel.htmlFor = "color-mode-raw";
    rawLabel.textContent = "Raw value";

    const templateRadio = document.createElement("input");
    templateRadio.type = "radio";
    templateRadio.name = "color-mode";
    templateRadio.id = "color-mode-template";
    templateRadio.checked = this.useTemplateRef;

    const templateLabel = document.createElement("label");
    templateLabel.htmlFor = "color-mode-template";
    templateLabel.textContent = "Template reference";

    modeToggle.appendChild(rawRadio);
    modeToggle.appendChild(rawLabel);
    modeToggle.appendChild(templateRadio);
    modeToggle.appendChild(templateLabel);
    this.container.appendChild(modeToggle);

    // Raw mode sliders
    const slidersContainer = document.createElement("div");
    slidersContainer.className = "color-picker-sliders";
    slidersContainer.style.display = this.useTemplateRef ? "none" : "block";
    this.container.appendChild(slidersContainer);

    const createSlider = (
      label: string,
      min: number,
      max: number,
      value: number,
      key: keyof ColorValues
    ) => {
      const row = document.createElement("div");
      row.className = "slider-row";

      const labelEl = document.createElement("label");
      labelEl.textContent = `${label} (${min}-${max}):`;
      labelEl.className = "slider-label";

      const input = document.createElement("input");
      input.type = "range";
      input.min = String(min);
      input.max = String(max);
      input.value = String(value);
      input.className = "slider-input";

      const valueDisplay = document.createElement("span");
      valueDisplay.className = "slider-value";
      valueDisplay.textContent = String(value);

      input.addEventListener("input", () => {
        const newVal = parseInt(input.value, 10);
        this.values[key] = newVal;
        valueDisplay.textContent = String(newVal);
        this.onValueChange();
      });

      row.appendChild(labelEl);
      row.appendChild(input);
      row.appendChild(valueDisplay);
      slidersContainer.appendChild(row);
    };

    createSlider("H (Height)", 0, 300, this.values.h, "h");
    createSlider("C (Color)", 0, 255, this.values.c, "c");
    createSlider("S (Saturation)", 0, 100, this.values.s, "s");
    createSlider("B (Brightness)", 50, 200, this.values.b, "b");

    // Template mode dropdown
    const templateContainer = document.createElement("div");
    templateContainer.className = "color-picker-template";
    templateContainer.style.display = this.useTemplateRef ? "block" : "none";
    this.container.appendChild(templateContainer);

    const templateSelect = document.createElement("select");
    templateSelect.className = "template-param-select";

    // Default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Select parameter —";
    templateSelect.appendChild(defaultOption);

    // Add template params from options
    const params = this.options.templateParams || [
      "WALL_SUFFIX", "ROOF_SUFFIX", "FENCE_SUFFIX", "DOOR_SUFFIX"
    ];
    params.forEach((param) => {
      const option = document.createElement("option");
      option.value = param;
      option.textContent = `{${param}}`;
      if (param === this.selectedTemplateParam) {
        option.selected = true;
      }
      templateSelect.appendChild(option);
    });

    templateSelect.addEventListener("change", () => {
      this.selectedTemplateParam = templateSelect.value;
      this.onValueChange();
    });

    templateContainer.appendChild(templateSelect);

    // Mode toggle handlers
    rawRadio.addEventListener("change", () => {
      this.useTemplateRef = false;
      slidersContainer.style.display = "block";
      templateContainer.style.display = "none";
      this.onValueChange();
    });

    templateRadio.addEventListener("change", () => {
      this.useTemplateRef = true;
      slidersContainer.style.display = "none";
      templateContainer.style.display = "block";
      this.onValueChange();
    });

    // Preset color swatches
    const presetsContainer = document.createElement("div");
    presetsContainer.className = "color-picker-presets";

    const presetsLabel = document.createElement("div");
    presetsLabel.className = "presets-label";
    presetsLabel.textContent = "Presets:";
    presetsContainer.appendChild(presetsLabel);

    COLOR_PRESETS.forEach((preset) => {
      const button = document.createElement("button");
      button.className = "preset-swatch";
      button.textContent = preset.label;
      button.title = `H${preset.values.h}_C${preset.values.c}_S${preset.values.s}_B${preset.values.b}`;
      button.addEventListener("click", () => {
        this.values = { ...preset.values };
        this.useTemplateRef = false;
        rawRadio.checked = true;
        slidersContainer.style.display = "block";
        templateContainer.style.display = "none";
        this.render();
      });
      presetsContainer.appendChild(button);
    });

    this.container.appendChild(presetsContainer);

    // Preview and output
    const previewContainer = document.createElement("div");
    previewContainer.className = "color-picker-preview";

    // Color preview rectangle
    const colorPreview = document.createElement("div");
    colorPreview.className = "color-preview-rect";
    const bgColor = this.valuesToApproxColor();
    colorPreview.style.backgroundColor = bgColor;
    previewContainer.appendChild(colorPreview);

    // Suffix preview text
    const suffixPreview = document.createElement("div");
    suffixPreview.className = "suffix-preview-text";
    suffixPreview.textContent = this.buildSuffix();
    previewContainer.appendChild(suffixPreview);

    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.className = "btn-small";
    copyBtn.textContent = "📋 Copy";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(this.buildSuffix()).then(() => {
        copyBtn.textContent = "✅ Copied";
        setTimeout(() => {
          copyBtn.textContent = "📋 Copy";
        }, 1500);
      });
    });
    previewContainer.appendChild(copyBtn);

    this.container.appendChild(previewContainer);
  }

  /**
   * Convert current H/C/S/B values to an approximate RGB color for preview.
   */
  private valuesToApproxColor(): string {
    const { h: hue, c: chroma, s: saturation, b: brightness } = this.values;

    // Simplified HSL-ish to RGB conversion for preview
    // Use chroma as a rough hue indicator
    const h = (hue % 360) / 360;
    const s = saturation / 100;
    const l = brightness / 200;

    // HSL to RGB
    const r = Math.round(255 * this.hslToRgb(h, s, l));
    const g = Math.round(255 * this.hslToRgb(h + 1/3, s, l));
    const b2 = Math.round(255 * this.hslToRgb(h + 2/3, s, l));

    return `rgb(${r}, ${g}, ${b2})`;
  }

  /**
   * Convert HSL to RGB component.
   */
  private hslToRgb(h: number, s: number, l: number): number {
    h = h % 1;
    if (s === 0) return l;

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    return hue2rgb(p, q, h);
  }

  /**
   * Handle value change.
   */
  private onValueChange(): void {
    const suffix = this.buildSuffix();

    // Update preview
    const preview = this.container.querySelector(".suffix-preview-text");
    if (preview) {
      preview.textContent = suffix;
    }

    const colorPreview = this.container.querySelector(".color-preview-rect") as HTMLElement;
    if (colorPreview && !this.useTemplateRef) {
      colorPreview.style.backgroundColor = this.valuesToApproxColor();
    }

    this.options.onChange(suffix);
  }

  /**
   * Set the current suffix value and re-render.
   */
  setValue(suffix: string): void {
    this.values = this.parseSuffix(suffix);
    this.render();
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.container.innerHTML = "";
  }
}