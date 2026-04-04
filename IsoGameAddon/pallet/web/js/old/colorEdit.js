import {  hslToRgb, rgbToHsl } from "./colorUtils.js";

// =========================================================================
// === 2. INDEPENDENT COLOR EDITOR MODULE (State Manager) ===
// =========================================================================

export class ColorEditorModule {
    // ... (ColorEditorModule remains structurally the same as it only manages state, not destructive data)
    // The only change is removing the unused 'createTempImageData' argument from applyFilter 
    // and relying on the orchestrator's utility.

  constructor(containerId, initialState, onStateChange) {
      this.container = document.getElementById(containerId);
      this.state = initialState;
      this.onStateChange = onStateChange;

      this.render();

      const idSuffix = this.container.id;
      this.resetColorBtn = this.container.querySelector(`#resetColorBtn-${idSuffix}`);
      this.attachEventListeners();
  }

  render() {
        // ... (Same as before)
        const idSuffix = this.container.id;
      this.container.innerHTML = `
          <div class="module-group">
              <div class="module-group-title">Color Adjustments (Hue, Contrast, Saturation, Brightness)</div>
              <div class="slider-control">
                  <label>Hue:</label>
                  <input type="range" id="hueSlider-${idSuffix}" min="-180" max="180" value="${this.state.hue}">
                  <span id="hueValue-${idSuffix}">${this.state.hue}°</span>
              </div>
              <div class="slider-control">
                  <label>Saturation:</label>
                  <input type="range" id="saturationSlider-${idSuffix}" min="-100" max="100" value="${this.state.saturation}">
                  <span id="saturationValue-${idSuffix}">${this.state.saturation}%</span>
              </div>
              <div class="slider-control">
                  <label>Contrast:</label>
                  <input type="range" id="contrastSlider-${idSuffix}" min="-100" max="100" value="${this.state.contrast}">
                  <span id="contrastValue-${idSuffix}">${this.state.contrast}%</span>
              </div>
              <div class="slider-control">
                  <label>Brightness (Equaliser):</label>
                  <input type="range" id="brightnessSlider-${idSuffix}" min="-100" max="100" value="${this.state.brightness}">
                  <span id="brightnessValue-${idSuffix}">${this.state.brightness}%</span>
              </div>
              <div class="transform-buttons">
                  <button class="btn" id="resetColorBtn-${idSuffix}">Reset Color Edits</button>
              </div>
          </div>
      `;
  }

  attachEventListeners() {
      this.container.querySelectorAll('input[type="range"]').forEach(input => {
          input.addEventListener('input', this.handleSliderChange.bind(this));
      });
      this.resetColorBtn.addEventListener('click', this.resetState.bind(this));
  }

  handleSliderChange(e) {
      // ... (Same as before)
      const id = e.target.id;
      const value = parseInt(e.target.value);
      const span = this.container.querySelector(`#${id.replace('Slider', 'Value')}`);
      const keyName = id.substring(0, id.indexOf('Slider')).toLowerCase();
      this.state[keyName] = value;
      span.textContent = keyName === 'hue' ? `${value}°` : `${value}%`;
      this.onStateChange(this.state);
  }

  resetState() {
      // ... (Same as before)
      const newState = { hue: 0, saturation: 0, contrast: 0, brightness: 0 };
      this.state = newState;
      this.container.querySelectorAll('input[type="range"]').forEach(input => {
          input.value = 0;
          const valueSpan = this.container.querySelector(`#${input.id.replace('Slider', 'Value')}`);
          valueSpan.textContent = input.id.includes('hueSlider') ? '0°' : '0%';
      });
      this.onStateChange(this.state);
  }
  
  static applyFilter(baseData, state, createImageData) {
      // ... (Same static function for applying filters)
      if (!baseData) return null;

      const { hue, saturation, contrast, brightness } = state;
      if (hue === 0 && saturation === 0 && contrast === 0 && brightness === 0) {
          const copyData = createImageData(baseData.width, baseData.height);
          copyData.data.set(baseData.data);
          return copyData; 
      }

      const newData = createImageData(baseData.width, baseData.height);
      const pixels = baseData.data;
      const newPixels = newData.data;

      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const brightnessFactor = brightness * 2.55; 

      for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] === 0) {
              newPixels[i+3] = 0;
              continue;
          }

          let r = pixels[i];
          let g = pixels[i + 1];
          let b = pixels[i + 2];

          r += brightnessFactor;
          g += brightnessFactor;
          b += brightnessFactor;

          r = (r - 128) * contrastFactor + 128;
          g = (g - 128) * contrastFactor + 128;
          b = (b - 128) * contrastFactor + 128;
          
          const hsl = rgbToHsl({r, g, b});

          hsl.h = (hsl.h + hue) % 360;
          if (hsl.h < 0) hsl.h += 360;

          hsl.s = Math.max(0, Math.min(1, hsl.s + saturation / 100));

          const finalRgb = hslToRgb(hsl.h, hsl.s, hsl.l);

          newPixels[i] = Math.max(0, Math.min(255, finalRgb.r));
          newPixels[i + 1] = Math.max(0, Math.min(255, finalRgb.g));
          newPixels[i + 2] = Math.max(0, Math.min(255, finalRgb.b));
          newPixels[i + 3] = pixels[i + 3];
      }
      
      return newData;
  }
}
