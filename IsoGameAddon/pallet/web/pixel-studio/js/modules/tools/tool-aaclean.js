/**
 * Tool: AA Cleaner
 * Nettoie ou genere l'anti-aliasing autour des bords des sprites.
 * Mode "remove" = supprime les pixels semi-transparents (binarise).
 * Mode "generate" = ajoute des pixels de transition pour un lissage.
 * Mode "soften" = attenue les transitions brusques.
 */

export const id = 'aaclean';

export const meta = {
    name: 'Nettoyeur Anti-Aliasing',
    description: 'Supprime, genere ou adoucit l\'anti-aliasing des bords',
    category: 'clean',
    icon: '\u{1F9D0}'
};

export const defaults = {
    mode: 'remove',
    threshold: 128,
    strength: 70
};

export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>\u{1F9D0} Nettoyeur Anti-Aliasing</span>
            <button class="btn-remove" data-action="remove">\u00d7</button>
        </div>
        <label>Mode</label>
        <select class="p-input" data-key="mode">
            <option value="remove" ${params.mode === 'remove' ? 'selected' : ''}>Supprimer l'AA</option>
            <option value="soften" ${params.mode === 'soften' ? 'selected' : ''}>Adoucir l'AA</option>
            <option value="generate" ${params.mode === 'generate' ? 'selected' : ''}>Generer l'AA</option>
        </select>
        <label>Seuil alpha <span class="label-val" data-display="threshold">${params.threshold}</span></label>
        <input type="range" class="p-input" data-key="threshold" min="0" max="255" value="${params.threshold}">
        <label>Force <span class="label-val" data-display="strength">${params.strength}</span>%</label>
        <input type="range" class="p-input" data-key="strength" min="0" max="100" value="${params.strength}">
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Remove = binarise. Soften = adoucit les bords. Generate = cree des transitions.
        </small>
    `;
}

export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const mode = params.mode || 'remove';
    const threshold = Math.max(0, Math.min(255, parseInt(params.threshold) || 128));
    const strength = (Math.max(0, Math.min(100, parseInt(params.strength) || 70))) / 100;

    if (mode === 'remove') {
        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] === 0 || d[i + 3] === 255) continue;
            if (d[i + 3] >= threshold) { d[i + 3] = 255; }
            else { d[i] = 0; d[i+1] = 0; d[i+2] = 0; d[i+3] = 0; }
        }
        return;
    }

    if (mode === 'soften') {
        const src = new Uint8ClampedArray(d);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const alpha = src[idx + 3];
                if (alpha === 0 || alpha === 255) continue;
                let solidN = 0, transN = 0;
                for (let ny = -1; ny <= 1; ny++) {
                    for (let nx = -1; nx <= 1; nx++) {
                        if (nx === 0 && ny === 0) continue;
                        const px = x + nx, py = y + ny;
                        if (px < 0 || px >= w || py < 0 || py >= h) continue;
                        const ni = (py * w + px) * 4;
                        if (src[ni + 3] >= 200) solidN++;
                        else if (src[ni + 3] < 30) transN++;
                    }
                }
                if (solidN > 0 && transN > 0) {
                    const factor = strength * 0.5;
                    if (alpha > 128) d[idx + 3] = Math.round(alpha + (255 - alpha) * factor);
                    else d[idx + 3] = Math.round(alpha * (1 - factor));
                }
            }
        }
        return;
    }

    if (mode === 'generate') {
        const src = new Uint8ClampedArray(d);
        const changes = [];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                if (src[idx + 3] < 200) continue;
                for (let ny = -1; ny <= 1; ny++) {
                    for (let nx = -1; nx <= 1; nx++) {
                        if (nx === 0 && ny === 0) continue;
                        const px = x + nx, py = y + ny;
                        if (px < 0 || px >= w || py < 0 || py >= h) continue;
                        const ni = (py * w + px) * 4;
                        if (src[ni + 3] >= 30) continue;
                        const blend = strength * 0.4;
                        changes.push({
                            idx: ni,
                            r: Math.round(src[idx] * blend + src[ni] * (1 - blend)),
                            g: Math.round(src[idx+1] * blend + src[ni+1] * (1 - blend)),
                            b: Math.round(src[idx+2] * blend + src[ni+2] * (1 - blend)),
                            a: Math.round(255 * blend * 0.6)
                        });
                        break;
                    }
                }
            }
        }
        for (const c of changes) {
            d[c.idx] = c.r; d[c.idx+1] = c.g; d[c.idx+2] = c.b; d[c.idx+3] = Math.max(d[c.idx+3], c.a);
        }
    }
}

