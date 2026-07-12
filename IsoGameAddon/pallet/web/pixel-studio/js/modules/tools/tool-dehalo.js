/**
 * Tool: De-Halo / De-Ring
 * Supprime les halos clairs/fonces autour des contours nets.
 * Ces artefacts apparaissent apres un sur-aiguisage (oversharpen)
 * ou une compression JPEG agressive.
 */

export const id = 'dehalo';

export const meta = {
    name: 'Anti-Halo',
    description: 'Supprime les halos clairs/fonces autour des contours',
    category: 'clean',
    icon: '\u{1F32A}\uFE0F'
};

export const defaults = {
    radius: 2,
    strength: 50,
    mode: 'both'
};

export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>\u{1F32A}\uFE0F Anti-Halo</span>
            <button class="btn-remove" data-action="remove">\u00d7</button>
        </div>
        <label>Rayon <span class="label-val" data-display="radius">${params.radius}</span></label>
        <input type="range" class="p-input" data-key="radius" min="1" max="8" value="${params.radius}">
        <label>Force <span class="label-val" data-display="strength">${params.strength}</span>%</label>
        <input type="range" class="p-input" data-key="strength" min="0" max="100" value="${params.strength}">
        <label>Mode</label>
        <select class="p-input" data-key="mode">
            <option value="both" ${params.mode === 'both' ? 'selected' : ''}>Clair + Fonce</option>
            <option value="light" ${params.mode === 'light' ? 'selected' : ''}>Halos clairs seulement</option>
            <option value="dark" ${params.mode === 'dark' ? 'selected' : ''}>Halos fonces seulement</option>
        </select>
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Detecte les pixels qui different de leur voisinage dans une couronne autour des contours.
        </small>
    `;
}

export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const radius = Math.max(1, Math.min(8, parseInt(params.radius) || 2));
    const strength = (Math.max(0, Math.min(100, parseInt(params.strength) || 50))) / 100;
    const mode = params.mode || 'both';
    const src = new Uint8ClampedArray(d);
    const changes = [];
    const innerR = 1;

    for (let y = radius; y < h - radius; y++) {
        for (let x = radius; x < w - radius; x++) {
            const idx = (y * w + x) * 4;
            if (src[idx + 3] < 128) continue;
            const r = src[idx], g = src[idx + 1], b = src[idx + 2];

            let innerSumR = 0, innerSumG = 0, innerSumB = 0, innerCount = 0;
            for (let ny = -innerR; ny <= innerR; ny++) {
                for (let nx = -innerR; nx <= innerR; nx++) {
                    if (nx === 0 && ny === 0) continue;
                    const px = x + nx, py = y + ny;
                    if (px < 0 || px >= w || py < 0 || py >= h) continue;
                    const ni = (py * w + px) * 4;
                    if (src[ni + 3] < 128) continue;
                    innerSumR += src[ni]; innerSumG += src[ni + 1]; innerSumB += src[ni + 2];
                    innerCount++;
                }
            }

            let outerSumR = 0, outerSumG = 0, outerSumB = 0, outerCount = 0;
            for (let ny = -radius; ny <= radius; ny++) {
                for (let nx = -radius; nx <= radius; nx++) {
                    const dist = Math.abs(nx) + Math.abs(ny);
                    if (dist < innerR + 1 || dist > radius) continue;
                    const px = x + nx, py = y + ny;
                    if (px < 0 || px >= w || py < 0 || py >= h) continue;
                    const ni = (py * w + px) * 4;
                    if (src[ni + 3] < 128) continue;
                    outerSumR += src[ni]; outerSumG += src[ni + 1]; outerSumB += src[ni + 2];
                    outerCount++;
                }
            }
            if (innerCount < 2 || outerCount < 2) continue;

            const aiR = innerSumR / innerCount, aiG = innerSumG / innerCount, aiB = innerSumB / innerCount;
            const aoR = outerSumR / outerCount, aoG = outerSumG / outerCount, aoB = outerSumB / outerCount;
            const iBright = (aiR + aiG + aiB) / 3;
            const oBright = (aoR + aoG + aoB) / 3;
            const pBright = (r + g + b) / 3;

            let isHalo = false;
            if (iBright > oBright) {
                if ((mode === 'both' || mode === 'light') && pBright > iBright + 8) isHalo = true;
                if ((mode === 'both' || mode === 'dark') && pBright < oBright - 8) isHalo = true;
            } else {
                if ((mode === 'both' || mode === 'dark') && pBright < iBright - 8) isHalo = true;
                if ((mode === 'both' || mode === 'light') && pBright > oBright + 8) isHalo = true;
            }

            if (isHalo) {
                const blend = strength * 0.8;
                const dI = Math.abs(r - aiR) + Math.abs(g - aiG) + Math.abs(b - aiB);
                const dO = Math.abs(r - aoR) + Math.abs(g - aoG) + Math.abs(b - aoB);
                const tR = dI < dO ? aiR : aoR, tG = dI < dO ? aiG : aoG, tB = dI < dO ? aiB : aoB;
                changes.push({ idx, r: Math.round(r + (tR - r) * blend), g: Math.round(g + (tG - g) * blend), b: Math.round(b + (tB - b) * blend) });
            }
        }
    }
    for (const c of changes) { d[c.idx] = c.r; d[c.idx + 1] = c.g; d[c.idx + 2] = c.b; }
}

