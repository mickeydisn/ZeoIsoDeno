/**
 * Tool: Contrast / Brightness
 * Adjust image contrast and brightness levels.
 */

export const id = 'contrast';

export const meta = {
    name: 'Contraste / Luminosité',
    description: 'Ajuste le contraste et la luminosité globale',
    category: 'color',
    icon: '☀️'
};

export const defaults = {
    contrast: 0,
    brightness: 0
};

/**
 * Generate the UI template for this tool's parameters
 */
export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>☀️ Contraste / Luminosité</span>
            <button class="btn-remove" data-action="remove">×</button>
        </div>
        <label>Contraste <span class="label-val" data-display="contrast">${params.contrast}</span></label>
        <input type="range" class="p-input" data-key="contrast" min="-100" max="100" value="${params.contrast}">
        
        <label>Luminosité <span class="label-val" data-display="brightness">${params.brightness}</span></label>
        <input type="range" class="p-input" data-key="brightness" min="-100" max="100" value="${params.brightness}">
    `;
}

/**
 * Apply contrast/brightness transformation to ImageData
 */
export function apply(imgData, params) {
    const d = imgData.data;
    let contrast = parseFloat(params.contrast) || 0;
    let brightness = parseFloat(params.brightness) || 0;

    // Normalize: contrast -100..100 → factor 0..2 (center at 1.0)
    const contrastFactor = (contrast + 100) / 100;
    // brightness -100..100 → offset -255..255
    const brightnessOffset = (brightness / 100) * 255;

    // Pre-compute lookup table for performance
    const lut = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
        // Apply contrast: (i - 128) * factor + 128
        let val = (i - 128) * contrastFactor + 128;
        // Apply brightness
        val += brightnessOffset;
        lut[i] = Math.max(0, Math.min(255, Math.round(val)));
    }

    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        d[i]     = lut[d[i]];
        d[i + 1] = lut[d[i + 1]];
        d[i + 2] = lut[d[i + 2]];
        // Alpha unchanged
    }
}
