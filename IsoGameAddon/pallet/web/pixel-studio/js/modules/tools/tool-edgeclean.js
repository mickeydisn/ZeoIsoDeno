/**
 * Tool: Edge Line Cleaner
 * Detecte et lisse les bordures de pixels transparents le long des
 * 4 axes isometriques 1:2. Ideal pour nettoyer les contours pixelises
 * des tiles isometriques.
 */

export const id = 'edgeclean';

export const meta = {
    name: 'Lissage Bordures Iso',
    description: 'Lisse les bords des zones transparentes sur les 4 axes iso 1:2',
    category: 'clean',
    icon: '\u{2702}\uFE0F'
};

export const defaults = {
    h: true,
    v: true,
    isoL: true,
    isoR: true,
    strength: 50,
    passes: 1
};

export function ui(params = defaults) {
    const ck = (k) => params[k] ? 'checked' : '';
    return `
        <div class="item-header">
            <span>\u{2702}\uFE0F Lissage Bordures Iso</span>
            <button class="btn-remove" data-action="remove">\u00d7</button>
        </div>
        <label style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <input type="checkbox" class="p-input" data-key="h" ${ck('h')} style="width:auto;"> Horizontal
        </label>
        <label style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <input type="checkbox" class="p-input" data-key="v" ${ck('v')} style="width:auto;"> Vertical
        </label>
        <label style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <input type="checkbox" class="p-input" data-key="isoL" ${ck('isoL')} style="width:auto;"> Iso gauche
        </label>
        <label style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <input type="checkbox" class="p-input" data-key="isoR" ${ck('isoR')} style="width:auto;"> Iso droite
        </label>
        <label style="margin-top:8px;">Force <span class="label-val" data-display="strength">${params.strength}</span>%</label>
        <input type="range" class="p-input" data-key="strength" min="0" max="100" value="${params.strength}">
        <label>Passes <span class="label-val" data-display="passes">${params.passes}</span></label>
        <input type="range" class="p-input" data-key="passes" min="1" max="10" value="${params.passes}">
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Lisse les bords denteles le long des axes selectionnes.
        </small>
    `;
}

function isEdge(data, x, y, w, h) {
    const idx = (y * w + x) * 4;
    if (data[idx + 3] < 128) return false;
    const x1 = Math.max(0, x - 1), x2 = Math.min(w - 1, x + 1);
    const y1 = Math.max(0, y - 1), y2 = Math.min(h - 1, y + 1);
    for (let ny = y1; ny <= y2; ny++) {
        for (let nx = x1; nx <= x2; nx++) {
            if (nx === x && ny === y) continue;
            if (data[(ny * w + nx) * 4 + 3] < 128) return true;
        }
    }
    return false;
}

function smoothEdgeAt(data, x, y, w, h, axis, strength) {
    let offsets;
    switch (axis) {
        case 'h':   offsets = [[-1,0],[1,0],[0,-1],[0,1]]; break;
        case 'v':   offsets = [[0,-1],[0,1],[-1,0],[1,0]]; break;
        case 'isoL': offsets = [[-1,-1],[1,1],[-1,1],[1,-1]]; break;
        case 'isoR': offsets = [[1,-1],[-1,1],[1,1],[-1,-1]]; break;
        default: return 0;
    }

    const idx = (y * w + x) * 4;
    const alpha = data[idx + 3];
    if (alpha < 128) return 0;

    // Count solids and transparents along the axis pattern
    let solids = 0, transparents = 0;
    for (const [dx, dy] of offsets) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nIdx = (ny * w + nx) * 4;
        if (data[nIdx + 3] < 128) transparents++;
        else solids++;
    }

    // If the pixel is a "staircase" (mix of solid and transparent along axis),
    // smooth it by reducing alpha
    if (solids > 0 && transparents > 0) {
        const factor = (strength / 100) * 0.5;
        data[idx + 3] = Math.round(alpha * (1 - factor));
        if (data[idx + 3] < 10) {
            data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; data[idx + 3] = 0;
        }
        return 1;
    }
    return 0;
}

export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const strength = Math.max(0, Math.min(100, parseInt(params.strength) || 50));
    const passes = Math.max(1, Math.min(10, parseInt(params.passes) || 1));
    const isActive = (v) => v === true || v === 'true' || v === 'on';

    const axes = [];
    if (isActive(params.h)) axes.push('h');
    if (isActive(params.v)) axes.push('v');
    if (isActive(params.isoL)) axes.push('isoL');
    if (isActive(params.isoR)) axes.push('isoR');
    if (axes.length === 0) return;

    for (let pass = 0; pass < passes; pass++) {
        const edgePixels = [];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (isEdge(d, x, y, w, h)) {
                    edgePixels.push({x, y});
                }
            }
        }

        let changes = 0;
        for (const axis of axes) {
            for (const ep of edgePixels) {
                changes += smoothEdgeAt(d, ep.x, ep.y, w, h, axis, strength);
            }
        }

        if (changes === 0 && pass > 0) break;
    }
}
