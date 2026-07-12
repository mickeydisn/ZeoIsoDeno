/**
 * Tool: Palette Quantizer (Normalizer)
 * Quantizes image colors to a fixed palette.
 */

import { getPalette, applyDirectPaletteSnap } from '../palettes.js';

export const id = 'quant';

export const meta = {
    name: 'Palette Normalizer',
    description: 'Quantifie les couleurs à une palette fixe',
    category: 'color',
    icon: '🎯'
};

export const defaults = {
    paletteMode: '32_std',
    snapAlgo: 'euclidean'
};

/**
 * Generate palette selection options HTML
 */
function paletteOptions() {
    const palettes = {
        '16_std': '16 Couleurs (Standard Web)',
        '16_cga': '16 Couleurs (CGA Retro)',
        '32_std': '32 Couleurs (Standard Étendu)',
        '32_sweet': '32 Couleurs (Sweetie Pastel)',
        '32_db32': '32 Couleurs (DB32 Retro)',
        '32_gameboy': '32 Couleurs (Gameboy Advanced)',
        '48': '48 Couleurs (Étendu Adaptatif)',
        '64': '64 Couleurs (Adaptatif)',
        '128': '128 Couleurs (Adaptatif)'
    };
    return Object.entries(palettes)
        .map(([val, label]) => `<option value="${val}">${label}</option>`)
        .join('');
}

/**
 * Generate the UI template
 */
export function ui(params = defaults) {
    const sel = params.paletteMode || '32_std';
    return `
        <div class="item-header">
            <span>🎯 Palette Normalizer</span>
            <button class="btn-remove" data-action="remove">×</button>
        </div>
        <label>Palette cible</label>
        <select class="p-input" data-key="paletteMode">
            ${paletteOptions().replace(`value="${sel}"`, `value="${sel}" selected`)}
        </select>
        <label>Algorithme de snapping</label>
        <select class="p-input" data-key="snapAlgo">
            <option value="euclidean" ${params.snapAlgo === 'euclidean' ? 'selected' : ''}>Euclidien</option>
            <option value="manhattan" ${params.snapAlgo === 'manhattan' ? 'selected' : ''}>Manhattan</option>
            <option value="cie76" ${params.snapAlgo === 'cie76' ? 'selected' : ''}>CIE76 pondéré</option>
        </select>
    `;
}

/**
 * Apply quantization transformation
 * Returns the active palette for downstream tools (dither) via context
 */
export function apply(imgData, params, context) {
    const palette = getPalette(params.paletteMode, imgData);
    applyDirectPaletteSnap(imgData, palette, params.snapAlgo || 'euclidean');

    // Store palette in shared context for downstream tools (dither)
    if (context) {
        context.activePalette = palette;
    }
    return palette;
}
