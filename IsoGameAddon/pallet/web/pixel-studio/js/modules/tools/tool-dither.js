/**
 * Tool: Dithering & Palette Merging
 * Applies dithering algorithms to simulate color depth with palette.
 */

import { findNearestColor } from '../palettes.js';

export const id = 'dither';

export const meta = {
    name: 'Merger / Dither',
    description: 'Applique un dithering pour fondre les couleurs',
    category: 'color',
    icon: '🔀'
};

export const defaults = {
    mergeAlgo: 'euclidean',
    ditherAlgo: 'none',
    weight: 100
};

/**
 * Generate the UI template
 */
export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>🔀 Merger / Dither</span>
            <button class="btn-remove" data-action="remove">×</button>
        </div>
        <label>Algorithme de fusion</label>
        <select class="p-input" data-key="mergeAlgo">
            <option value="euclidean" ${params.mergeAlgo === 'euclidean' ? 'selected' : ''}>Euclidien</option>
            <option value="manhattan" ${params.mergeAlgo === 'manhattan' ? 'selected' : ''}>Manhattan</option>
            <option value="cie76" ${params.mergeAlgo === 'cie76' ? 'selected' : ''}>CIE76 pondéré</option>
        </select>
        <label>Motif de dithering</label>
        <select class="p-input" data-key="ditherAlgo">
            <option value="none" ${params.ditherAlgo === 'none' ? 'selected' : ''}>Aucun</option>
            <option value="bayer2x2" ${params.ditherAlgo === 'bayer2x2' ? 'selected' : ''}>Bayer 2×2</option>
            <option value="bayer4x4" ${params.ditherAlgo === 'bayer4x4' ? 'selected' : ''}>Bayer 4×4</option>
            <option value="floyd" ${params.ditherAlgo === 'floyd' ? 'selected' : ''}>Floyd-Steinberg</option>
        </select>
        <label>Force du dither <span class="label-val" data-display="weight">${params.weight}</span>%</label>
        <input type="range" class="p-input" data-key="weight" min="0" max="200" value="${params.weight}">
    `;
}

/**
 * Distribute error to neighboring pixels (Floyd-Steinberg)
 */
function distributeError(data, x, y, w, h, errR, errG, errB) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = (y * w + x) * 4;
    data[idx] = Math.min(255, Math.max(0, data[idx] + errR));
    data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + errG));
    data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + errB));
}

/**
 * Apply dithering transformation
 * Uses the active palette from the shared context (set by quant tool)
 */
export function apply(imgData, params, context) {
    // Fallback to context palette or generate a basic one
    let palette = context?.activePalette;
    if (!palette || palette.length === 0) {
        // No palette available — nothing to dither to
        return;
    }

    const w = imgData.width, h = imgData.height, d = imgData.data;
    const bayer2x2 = [[0, 2], [3, 1]];
    const bayer4x4 = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ];

    const weight = (parseFloat(params.weight) || 100) / 100;
    const mergeAlgo = params.mergeAlgo || 'euclidean';
    const ditherAlgo = params.ditherAlgo || 'none';

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (d[idx + 3] < 128) continue;

            let r = d[idx], g = d[idx + 1], b = d[idx + 2];

            // Apply Bayer threshold dithering
            if (ditherAlgo.startsWith('bayer')) {
                const matrix = ditherAlgo === 'bayer2x2' ? bayer2x2 : bayer4x4;
                const size = matrix.length;
                const ratio = (matrix[y % size][x % size] / (size * size)) - 0.5;
                r = Math.min(255, Math.max(0, r + ratio * 68 * weight));
                g = Math.min(255, Math.max(0, g + ratio * 68 * weight));
                b = Math.min(255, Math.max(0, b + ratio * 68 * weight));
            }

            const nearest = findNearestColor([r, g, b], palette, mergeAlgo);

            // Floyd-Steinberg error diffusion
            if (ditherAlgo === 'floyd' && weight > 0) {
                const errR = (d[idx] - nearest[0]) * weight;
                const errG = (d[idx + 1] - nearest[1]) * weight;
                const errB = (d[idx + 2] - nearest[2]) * weight;
                distributeError(d, x + 1, y, w, h, errR * 7 / 16, errG * 7 / 16, errB * 7 / 16);
                distributeError(d, x - 1, y + 1, w, h, errR * 3 / 16, errG * 3 / 16, errB * 3 / 16);
                distributeError(d, x, y + 1, w, h, errR * 5 / 16, errG * 5 / 16, errB * 5 / 16);
                distributeError(d, x + 1, y + 1, w, h, errR * 1 / 16, errG * 1 / 16, errB * 1 / 16);
            }

            d[idx] = nearest[0];
            d[idx + 1] = nearest[1];
            d[idx + 2] = nearest[2];
        }
    }
}
