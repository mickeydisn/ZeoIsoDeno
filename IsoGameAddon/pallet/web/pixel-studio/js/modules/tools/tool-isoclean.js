/**
 * Tool: Iso Line Cleaner
 * Detecte et nettoie les lignes selon les 4 axes isometriques 1:2 :
 *   - Horizontal (0°)
 *   - Vertical (90°)
 *   - Iso gauche (pente 1/2, ~26.6°)
 *   - Iso droite (pente -1/2, ~153.4°)
 */

export const id = 'isoclean';

export const meta = {
    name: 'Nettoyeur Lignes Iso',
    description: 'Nettoie les lignes sur les 4 axes isometriques 1:2',
    category: 'clean',
    icon: '\u{1F4D0}'
};

export const defaults = {
    h: true,
    v: true,
    isoL: true,
    isoR: true,
    threshold: 40,
    passes: 1
};

export function ui(params = defaults) {
    const ck = (k) => params[k] ? 'checked' : '';
    return `
        <div class="item-header">
            <span>\u{1F4D0} Nettoyeur Lignes Iso 1:2</span>
            <button class="btn-remove" data-action="remove">\u00d7</button>
        </div>
        <label style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <input type="checkbox" class="p-input" data-key="h" ${ck('h')} style="width:auto;"> Horizontal (\u2014)
        </label>
        <label style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <input type="checkbox" class="p-input" data-key="v" ${ck('v')} style="width:auto;"> Vertical (|)
        </label>
        <label style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <input type="checkbox" class="p-input" data-key="isoL" ${ck('isoL')} style="width:auto;"> Iso gauche (\u2B07 1:2)
        </label>
        <label style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <input type="checkbox" class="p-input" data-key="isoR" ${ck('isoR')} style="width:auto;"> Iso droite (\u2B06 1:2)
        </label>
        <label style="margin-top:8px;">Seuil <span class="label-val" data-display="threshold">${params.threshold}</span></label>
        <input type="range" class="p-input" data-key="threshold" min="1" max="120" value="${params.threshold}">
        <label>Passes <span class="label-val" data-display="passes">${params.passes}</span></label>
        <input type="range" class="p-input" data-key="passes" min="1" max="5" value="${params.passes}">
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Nettoie les artefacts sur les axes selectionnes.
        </small>
    `;
}

function buildFillMap(data, w, h) {
    const fill = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) fill[i] = data[i * 4 + 3] > 128 ? 1 : 0;
    return fill;
}

function sampleNeighborColor(data, x, y, w, h, fill, radius) {
    if (radius === undefined) radius = 2;
    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    const x1 = Math.max(0, x - radius), x2 = Math.min(w - 1, x + radius);
    const y1 = Math.max(0, y - radius), y2 = Math.min(h - 1, y + radius);
    for (let ny = y1; ny <= y2; ny++) {
        for (let nx = x1; nx <= x2; nx++) {
            if (nx === x && ny === y) continue;
            const idx = ny * w + nx;
            if (fill[idx]) {
                const p = idx * 4;
                sumR += data[p]; sumG += data[p + 1]; sumB += data[p + 2];
                count++;
            }
        }
    }
    if (count === 0) return null;
    return [Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)];
}

function cleanIsoAxis(fill, w, h, threshold, modified, stepX, stepY) {
    const visited = new Set();
    for (let startY = 0; startY < h; startY++) {
        for (let startX = 0; startX < w; startX++) {
            const idx = startY * w + startX;
            if (visited.has(idx)) continue;
            let x = startX, y = startY;
            const linePixels = [];
            while (x >= 0 && x < w && y >= 0 && y < h) {
                const pi = y * w + x;
                if (!visited.has(pi)) {
                    visited.add(pi);
                    linePixels.push({x, y, idx: pi, filled: fill[pi] === 1});
                }
                let stepped = false;
                const nx = x + stepX;
                if (nx >= 0 && nx < w) { x = nx; stepped = true; }
                const ny = y + stepY;
                if (ny >= 0 && ny < h) { y = ny; stepped = true; }
                if (!stepped) break;
                if (Math.abs(x - startX) > w * 2 || Math.abs(y - startY) > h * 2) break;
            }
            if (linePixels.length < 4) continue;
            let runs = [];
            let runStart = 0;
            for (let i = 1; i <= linePixels.length; i++) {
                const cf = i < linePixels.length ? linePixels[i].filled : !linePixels[runStart].filled;
                const pf = linePixels[i - 1].filled;
                if (i === linePixels.length || cf !== pf) {
                    runs.push({start: runStart, end: i - 1, length: i - runStart, filled: pf});
                    runStart = i;
                }
            }
            for (const run of runs) {
                if (run.filled && run.length <= threshold) {
                    for (let i = run.start; i <= run.end; i++) modified.add(linePixels[i].idx);
                }
            }
        }
    }
}

function cleanHorizontal(fill, w, h, threshold, modified) {
    for (let x = 0; x < w; x++) {
        let start = -1;
        for (let y = 0; y <= h; y++) {
            const isFilled = y < h && fill[y * w + x] === 1;
            if (isFilled && start === -1) start = y;
            if (!isFilled && start !== -1) {
                const len = y - start;
                if (len <= threshold) {
                    for (let yy = start; yy < y; yy++) modified.add(yy * w + x);
                }
                start = -1;
            }
        }
    }
}

function cleanVertical(fill, w, h, threshold, modified) {
    for (let y = 0; y < h; y++) {
        let start = -1;
        for (let x = 0; x <= w; x++) {
            const isFilled = x < w && fill[y * w + x] === 1;
            if (isFilled && start === -1) start = x;
            if (!isFilled && start !== -1) {
                const len = x - start;
                if (len <= threshold) {
                    for (let xx = start; xx < x; xx++) modified.add(y * w + xx);
                }
                start = -1;
            }
        }
    }
}

export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const threshold = Math.max(1, Math.min(120, parseInt(params.threshold) || 40));
    const passes = Math.max(1, Math.min(5, parseInt(params.passes) || 1));
    const activeAxes = [];
    const isActive = (v) => v === true || v === 'true' || v === 'on';
    if (isActive(params.h)) activeAxes.push('h');
    if (isActive(params.v)) activeAxes.push('v');
    if (isActive(params.isoL)) activeAxes.push('isoL');
    if (isActive(params.isoR)) activeAxes.push('isoR');
    if (activeAxes.length === 0) return;
    for (let pass = 0; pass < passes; pass++) {
        const fill = buildFillMap(d, w, h);
        const modified = new Set();
        for (const axisKey of activeAxes) {
            if (axisKey === 'h') cleanHorizontal(fill, w, h, threshold, modified);
            else if (axisKey === 'v') cleanVertical(fill, w, h, threshold, modified);
            else if (axisKey === 'isoL') cleanIsoAxis(fill, w, h, threshold, modified, 1, 1);
            else if (axisKey === 'isoR') cleanIsoAxis(fill, w, h, threshold, modified, 1, -1);
        }
        let changes = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const fillIdx = y * w + x;
                const wasFilled = d[idx + 3] > 128;
                const shouldBeFilled = fill[fillIdx] === 1;
                if (wasFilled && !shouldBeFilled) {
                    const brightness = (d[idx] + d[idx + 1] + d[idx + 2]) / 3;
                    if (brightness > threshold * 0.5) {
                        d[idx] = 0; d[idx + 1] = 0; d[idx + 2] = 0; d[idx + 3] = 0;
                        changes++;
                    }
                } else if (!wasFilled && shouldBeFilled) {
                    const color = sampleNeighborColor(d, x, y, w, h, fill);
                    if (color) {
                        d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2];
                        d[idx + 3] = 255;
                        changes++;
                    }
                }
            }
        }
        if (changes === 0 && pass > 0) break;
    }
}
