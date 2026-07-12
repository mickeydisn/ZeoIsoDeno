/**
 * Tool: Despeckle
 * Supprime les pixels isoles (tres clairs ou tres fonces) entoures de
 * pixels de couleur differente. Plus leger que le debruitage median,
 * il cible uniquement les "points" parasites sans affecter les structures.
 */

export const id = 'despeckle';

export const meta = {
    name: 'Despeckle',
    description: 'Supprime les pixels isoles parasites (sel & poivre)',
    category: 'clean',
    icon: '\u{1F9F9}'
};

export const defaults = {
    threshold: 60,
    mode: 'outlier'
};

export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>\u{1F9F9} Despeckle</span>
            <button class="btn-remove" data-action="remove">\u00d7</button>
        </div>
        <label>Seuil <span class="label-val" data-display="threshold">${params.threshold}</span></label>
        <input type="range" class="p-input" data-key="threshold" min="10" max="255" value="${params.threshold}">
        <label>Mode</label>
        <select class="p-input" data-key="mode">
            <option value="outlier" ${params.mode === 'outlier' ? 'selected' : ''}>Pixel aberrant</option>
            <option value="saltpepper" ${params.mode === 'saltpepper' ? 'selected' : ''}>Sel & Poivre</option>
        </select>
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Plus le seuil est bas, plus la detection est sensible.
            "Sel & Poivre" ne cible que les extremes (0 ou 255).
        </small>
    `;
}

export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const threshold = Math.max(10, Math.min(255, parseInt(params.threshold) || 60));
    const mode = params.mode || 'outlier';

    const src = new Uint8ClampedArray(d);
    const changes = [];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (src[idx + 3] < 128) continue;

            const r = src[idx], g = src[idx + 1], b = src[idx + 2];

            // For salt & pepper mode: only extreme values
            if (mode === 'saltpepper') {
                const avg = (r + g + b) / 3;
                if (avg > 10 && avg < 245) continue;
            }

            // Gather 3x3 neighbor stats (excluding self)
            let sumR = 0, sumG = 0, sumB = 0, count = 0;
            for (let ny = -1; ny <= 1; ny++) {
                for (let nx = -1; nx <= 1; nx++) {
                    if (nx === 0 && ny === 0) continue;
                    const px = x + nx, py = y + ny;
                    if (px < 0 || px >= w || py < 0 || py >= h) continue;
                    const ni = (py * w + px) * 4;
                    if (src[ni + 3] < 128) continue;
                    sumR += src[ni]; sumG += src[ni + 1]; sumB += src[ni + 2];
                    count++;
                }
            }
            if (count < 3) continue;

            const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
            const diff = Math.max(Math.abs(r - avgR), Math.abs(g - avgG), Math.abs(b - avgB));

            if (diff > threshold) {
                // This pixel is a speckle — replace with neighbor average
                changes.push({
                    idx,
                    r: Math.round(avgR),
                    g: Math.round(avgG),
                    b: Math.round(avgB)
                });
            }
        }
    }

    for (const c of changes) {
        d[c.idx] = c.r; d[c.idx + 1] = c.g; d[c.idx + 2] = c.b;
    }
}
