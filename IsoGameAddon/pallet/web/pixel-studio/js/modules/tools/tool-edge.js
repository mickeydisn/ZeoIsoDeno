/**
 * Tool: Edge / Border Cleaner
 * Removes dark pixels ONLY when adjacent to transparent pixels.
 * Perfect for cleaning dark anti-aliasing fringes around sprites
 * without affecting dark interior pixels.
 */

export const id = 'edge';

export const meta = {
    name: 'Nettoyeur Bordures Sombres',
    description: 'Supprime les pixels sombres uniquement en bordure de zone transparente',
    category: 'clean',
    icon: '✂️'
};

export const defaults = {
    threshold: 60,
    mode: 'luminance',
    passes: 1
};

/**
 * Generate the UI template for this tool's parameters
 */
export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>✂️ Nettoyeur Bordures Sombres</span>
            <button class="btn-remove" data-action="remove">×</button>
        </div>
        <label>Seuil de noir <span class="label-val" data-display="threshold">${params.threshold}</span></label>
        <input type="range" class="p-input" data-key="threshold" min="0" max="255" value="${params.threshold}">
        
        <label>Mode de détection</label>
        <select class="p-input" data-key="mode">
            <option value="luminance" ${params.mode === 'luminance' ? 'selected' : ''}>Luminance (pondérée)</option>
            <option value="maxchannel" ${params.mode === 'maxchannel' ? 'selected' : ''}>Canal max</option>
            <option value="average" ${params.mode === 'average' ? 'selected' : ''}>Moyenne RVB</option>
        </select>

        <label>Passes <span class="label-val" data-display="passes">${params.passes}</span></label>
        <input type="range" class="p-input" data-key="passes" min="1" max="10" value="${params.passes}">
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Nettoie les pixels sombres adjacents à une zone transparente. 
            Augmentez les passes pour nettoyer plusieurs couches de bordure.
        </small>
    `;
}

/**
 * Compute pixel luminance (perceived brightness)
 */
function getLuminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Get the "darkness value" of a pixel based on the selected mode
 */
function getDarknessValue(r, g, b, mode) {
    switch (mode) {
        case 'maxchannel': return Math.max(r, g, b);
        case 'average':    return (r + g + b) / 3;
        case 'luminance':
        default:           return getLuminance(r, g, b);
    }
}

/**
 * Check if a pixel has any neighbor that is transparent (alpha < 128)
 * Returns true if at least one of the 8 adjacent pixels is transparent.
 */
function hasTransparentNeighbor(data, x, y, w, h) {
    const minX = Math.max(0, x - 1);
    const maxX = Math.min(w - 1, x + 1);
    const minY = Math.max(0, y - 1);
    const maxY = Math.min(h - 1, y + 1);

    for (let ny = minY; ny <= maxY; ny++) {
        for (let nx = minX; nx <= maxX; nx++) {
            if (nx === x && ny === y) continue;
            const idx = (ny * w + nx) * 4;
            if (data[idx + 3] < 128) return true;
        }
    }
    return false;
}

/**
 * Apply border-dark removal transformation to ImageData.
 * Only affects dark pixels that are adjacent to transparent areas.
 * Multiple passes clean progressively deeper layers.
 */
export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const threshold = parseFloat(params.threshold) || 60;
    const mode = params.mode || 'luminance';
    const passes = Math.max(1, Math.min(10, parseInt(params.passes) || 1));

    for (let pass = 0; pass < passes; pass++) {
        // Build a map of pixels to clear in this pass
        // We do this in two steps to avoid sequencing issues
        // (clearing a pixel mid-pass shouldn't affect neighbor checks in the same pass)
        const toClear = new Set();

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const alpha = d[idx + 3];

                // Skip if already transparent
                if (alpha < 128) continue;

                const r = d[idx];
                const g = d[idx + 1];
                const b = d[idx + 2];

                // Check if pixel is dark enough
                const value = getDarknessValue(r, g, b, mode);
                if (value >= threshold) continue;

                // Only clear if adjacent to a transparent pixel
                if (hasTransparentNeighbor(d, x, y, w, h)) {
                    toClear.add(idx);
                }
            }
        }

        // Apply clearing
        if (toClear.size === 0) break; // Nothing left to clear — stop early
        for (const idx of toClear) {
            d[idx]     = 0;
            d[idx + 1] = 0;
            d[idx + 2] = 0;
            d[idx + 3] = 0;
        }
    }
}

