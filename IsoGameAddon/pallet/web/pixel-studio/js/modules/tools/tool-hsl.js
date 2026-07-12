/**
 * Tool: HSL Adjustment
 * Adjust Hue, Saturation, and Lightness of an image.
 */

export const id = 'hsl';

export const meta = {
    name: 'Ajustement HSL',
    description: 'Modifie la teinte, saturation et luminosité',
    category: 'color',
    icon: '🎨'
};

export const defaults = {
    hue: 0,
    sat: 100,
    light: 100
};

/**
 * Generate the UI template for this tool's parameters
 */
export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>🔧 Ajustement HSL</span>
            <button class="btn-remove" data-action="remove">×</button>
        </div>
        <label>Teinte <span class="label-val" data-display="hue">${params.hue}</span>°</label>
        <input type="range" class="p-input" data-key="hue" min="-180" max="180" value="${params.hue}">
        
        <label>Saturation <span class="label-val" data-display="sat">${params.sat}</span>%</label>
        <input type="range" class="p-input" data-key="sat" min="0" max="200" value="${params.sat}">
        
        <label>Luminosité <span class="label-val" data-display="light">${params.light}</span>%</label>
        <input type="range" class="p-input" data-key="light" min="0" max="200" value="${params.light}">
    `;
}

/**
 * Apply HSL transformation to ImageData
 */
export function apply(imgData, params) {
    const d = imgData.data;
    const hMod = parseFloat(params.hue) || 0;
    const sMod = (parseFloat(params.sat) || 100) / 100;
    const lMod = (parseFloat(params.light) || 100) / 100;

    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;

        let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            let delta = max - min;
            s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

            if (max === r) {
                h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
            } else if (max === g) {
                h = ((b - r) / delta + 2) / 6;
            } else {
                h = ((r - g) / delta + 4) / 6;
            }
        }

        // Apply modifications
        h = (h + hMod / 360) % 1;
        if (h < 0) h += 1;
        s = Math.max(0, Math.min(1, s * sMod));
        l = Math.max(0, Math.min(1, l * lMod));

        // HSL → RGB
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        d[i] = Math.round(r * 255);
        d[i + 1] = Math.round(g * 255);
        d[i + 2] = Math.round(b * 255);
    }
}
