/**
 * Tool: Dust & Scratches
 * Detecte et corrige les defauts lineaires fins (rayures) et les
 * petits points (poussieres). Ideal pour nettoyer des sprites
 * scannes ou des tiles endommages.
 */

export const id = 'dust';

export const meta = {
    name: 'Poussiere & Rayures',
    description: 'Corrige les petits points et rayures fines',
    category: 'clean',
    icon: '\u{2728}'
};

export const defaults = {
    threshold: 40,
    scratchLen: 5,
    mode: 'both'
};

export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>\u{2728} Poussiere & Rayures</span>
            <button class="btn-remove" data-action="remove">\u00d7</button>
        </div>
        <label>Seuil <span class="label-val" data-display="threshold">${params.threshold}</span></label>
        <input type="range" class="p-input" data-key="threshold" min="10" max="200" value="${params.threshold}">
        <label>Long. max rayure <span class="label-val" data-display="scratchLen">${params.scratchLen}</span></label>
        <input type="range" class="p-input" data-key="scratchLen" min="1" max="20" value="${params.scratchLen}">
        <label>Mode</label>
        <select class="p-input" data-key="mode">
            <option value="both" ${params.mode === 'both' ? 'selected' : ''}>Poussiere + Rayures</option>
            <option value="dust" ${params.mode === 'dust' ? 'selected' : ''}>Poussiere seulement</option>
            <option value="scratch" ${params.mode === 'scratch' ? 'selected' : ''}>Rayures seulement</option>
        </select>
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Une rayure est une chaine de pixels deviants dans une direction.
            La poussiere est un pixel isole different de son voisinage.
        </small>
    `;
}

export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const threshold = Math.max(10, Math.min(200, parseInt(params.threshold) || 40));
    const maxScratchLen = Math.max(1, Math.min(20, parseInt(params.scratchLen) || 5));
    const mode = params.mode || 'both';
    const src = new Uint8ClampedArray(d);
    const changes = new Map();

    // --- DUST: isolated outlier pixels ---
    if (mode === 'both' || mode === 'dust') {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                if (src[idx + 3] < 128) continue;
                let sumR = 0, sumG = 0, sumB = 0, count = 0;
                let maxDiff = 0;
                for (let ny = -1; ny <= 1; ny++) {
                    for (let nx = -1; nx <= 1; nx++) {
                        if (nx === 0 && ny === 0) continue;
                        const px = x + nx, py = y + ny;
                        if (px < 0 || px >= w || py < 0 || py >= h) continue;
                        const ni = (py * w + px) * 4;
                        if (src[ni + 3] < 128) continue;
                        sumR += src[ni]; sumG += src[ni + 1]; sumB += src[ni + 2];
                        count++;
                        const d2 = Math.abs(src[idx] - src[ni]) + Math.abs(src[idx+1] - src[ni+1]) + Math.abs(src[idx+2] - src[ni+2]);
                        if (d2 > maxDiff) maxDiff = d2;
                    }
                }
                if (count >= 3 && maxDiff > threshold * 3) {
                    const avgR = Math.round(sumR / count);
                    const avgG = Math.round(sumG / count);
                    const avgB = Math.round(sumB / count);
                    if (Math.abs(src[idx] - avgR) + Math.abs(src[idx+1] - avgG) + Math.abs(src[idx+2] - avgB) > threshold) {
                        changes.set(idx, { r: avgR, g: avgG, b: avgB });
                    }
                }
            }
        }
    }

    // --- SCRATCHES: thin line defects ---
    if (mode === 'both' || mode === 'scratch') {
        const dirs = [[1,0],[0,1],[1,1],[1,-1]];
        const scrThresh = threshold * 2;
        for (const [dx, dy] of dirs) {
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const idx = (y * w + x) * 4;
                    if (src[idx + 3] < 128) continue;
                    let cx = x, cy = y;
                    let scratchPixels = [];
                    let prevOk = false;
                    for (let step = 0; step < maxScratchLen; step++) {
                        const nx = cx + dx, ny = cy + dy;
                        if (nx < 0 || nx >= w || ny < 0 || ny >= h) break;
                        const nIdx = (ny * w + nx) * 4;
                        if (src[nIdx + 3] < 128) break;
                        const perpDirs = dx === 0 ? [[1,0]] : dy === 0 ? [[0,1]] : [[dx, -dy], [-dx, dy]];
                        let psR = 0, psG = 0, psB = 0, pc = 0;
                        for (const [pdx, pdy] of perpDirs) {
                            for (let d = 1; d <= 2; d++) {
                                const ppx = nx + pdx * d, ppy = ny + pdy * d;
                                if (ppx < 0 || ppx >= w || ppy < 0 || ppy >= h) continue;
                                const pi = (ppy * w + ppx) * 4;
                                if (src[pi + 3] < 128) continue;
                                psR += src[pi]; psG += src[pi + 1]; psB += src[pi + 2]; pc++;
                            }
                        }
                        if (pc >= 1) {
                            const diff = Math.abs(src[nIdx] - psR/pc) + Math.abs(src[nIdx+1] - psG/pc) + Math.abs(src[nIdx+2] - psB/pc);
                            if (diff > scrThresh) {
                                scratchPixels.push({ idx: nIdx, r: Math.round(psR/pc), g: Math.round(psG/pc), b: Math.round(psB/pc) });
                                prevOk = false;
                            } else {
                                if (prevOk && scratchPixels.length > 0) break;
                                prevOk = true; scratchPixels = [];
                            }
                        }
                        cx = nx; cy = ny;
                    }
                    if (scratchPixels.length >= 1 && scratchPixels.length <= maxScratchLen) {
                        for (const sp of scratchPixels) {
                            if (!changes.has(sp.idx)) changes.set(sp.idx, { r: sp.r, g: sp.g, b: sp.b });
                        }
                    }
                }
            }
        }
    }

    for (const [idx, c] of changes) { d[idx] = c.r; d[idx + 1] = c.g; d[idx + 2] = c.b; }
}

