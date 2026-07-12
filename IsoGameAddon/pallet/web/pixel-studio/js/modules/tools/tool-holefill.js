/**
 * Tool: Hole Filler
 * Detecte et remplit les petits trous transparents completement
 * entoures de pixels opaques. Ideal pour reparer les artefacts
 * de decoupe ou de nettoyage de fond.
 */

export const id = 'holefill';

export const meta = {
    name: 'Rebouche Trous',
    description: 'Remplit les petits trous transparents dans les zones opaques',
    category: 'clean',
    icon: '\u{1FAA7}'
};

export const defaults = {
    maxSize: 30,
    mode: 'average'
};

export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>\u{1FAA7} Rebouche Trous</span>
            <button class="btn-remove" data-action="remove">\u00d7</button>
        </div>
        <label>Taille max <span class="label-val" data-display="maxSize">${params.maxSize}</span> px</label>
        <input type="range" class="p-input" data-key="maxSize" min="1" max="200" value="${params.maxSize}">
        <label>Mode de remplissage</label>
        <select class="p-input" data-key="mode">
            <option value="average" ${params.mode === 'average' ? 'selected' : ''}>Moyenne des bords</option>
            <option value="nearest" ${params.mode === 'nearest' ? 'selected' : ''}>Couleur la plus proche</option>
            <option value="solid" ${params.mode === 'solid' ? 'selected' : ''}>Couleur unie</option>
        </select>
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Un trou est une zone transparente entierement entouree de pixels opaques.
            Utile apres un nettoyage de fond aggressif.
        </small>
    `;
}

export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const maxSize = Math.max(1, Math.min(200, parseInt(params.maxSize) || 30));
    const mode = params.mode || 'average';

    // Build a binary map: 1 = opaque, 0 = transparent
    const fill = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) fill[i] = d[i * 4 + 3] > 128 ? 1 : 0;

    // Find all transparent regions using flood fill
    const visited = new Uint8Array(w * h);
    const holes = [];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (fill[idx] === 1 || visited[idx]) continue;

            // Flood fill from this transparent pixel
            const stack = [{ x, y }];
            visited[idx] = 1;
            const region = [];
            let touchesBorder = false;

            while (stack.length > 0) {
                const p = stack.pop();
                region.push(p);

                if (p.x === 0 || p.x === w - 1 || p.y === 0 || p.y === h - 1) {
                    touchesBorder = true;
                }

                for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
                    const nx = p.x + dx, ny = p.y + dy;
                    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                    const ni = ny * w + nx;
                    if (fill[ni] === 0 && !visited[ni]) {
                        visited[ni] = 1;
                        stack.push({ x: nx, y: ny });
                    }
                }
            }

            if (!touchesBorder && region.length <= maxSize) {
                holes.push(region);
            }
        }
    }

    // Fill each hole
    for (const hole of holes) {
        // Collect border colors (pixels just outside the hole)
        const borderColors = [];
        const borderSet = new Set();

        for (const p of hole) {
            for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
                const nx = p.x + dx, ny = p.y + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                const ni = ny * w + nx;
                if (fill[ni] === 1 && !borderSet.has(ni)) {
                    borderSet.add(ni);
                    const pi = ni * 4;
                    borderColors.push({ r: d[pi], g: d[pi+1], b: d[pi+2] });
                }
            }
        }

        if (borderColors.length === 0) continue;

        let fillR, fillG, fillB;

        if (mode === 'average') {
            let sumR = 0, sumG = 0, sumB = 0;
            for (const c of borderColors) { sumR += c.r; sumG += c.g; sumB += c.b; }
            fillR = Math.round(sumR / borderColors.length);
            fillG = Math.round(sumG / borderColors.length);
            fillB = Math.round(sumB / borderColors.length);
        } else if (mode === 'nearest') {
            // Pick the most frequent color among borders
            const colorCounts = new Map();
            for (const c of borderColors) {
                const key = `${Math.round(c.r/32)*32},${Math.round(c.g/32)*32},${Math.round(c.b/32)*32}`;
                colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
            }
            let maxCount = 0, bestKey = '';
            for (const [key, count] of colorCounts) {
                if (count > maxCount) { maxCount = count; bestKey = key; }
            }
            const parts = bestKey.split(',');
            fillR = parseInt(parts[0]); fillG = parseInt(parts[1]); fillB = parseInt(parts[2]);
        } else {
            // solid: use first border color
            fillR = borderColors[0].r; fillG = borderColors[0].g; fillB = borderColors[0].b;
        }

        for (const p of hole) {
            const idx = (p.y * w + p.x) * 4;
            d[idx] = fillR; d[idx+1] = fillG; d[idx+2] = fillB; d[idx+3] = 255;
        }
    }
}
