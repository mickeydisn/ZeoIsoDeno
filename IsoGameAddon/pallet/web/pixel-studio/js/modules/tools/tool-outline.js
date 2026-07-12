/**
 * Tool: Outline Cleaner (Isolated Pixel Remover)
 * Removes isolated pixels/small blobs based on connectivity.
 */

export const id = 'outline';

export const meta = {
    name: 'Nettoyeur Contours',
    description: 'Supprime les pixels isolés et petits artéfacts',
    category: 'clean',
    icon: '🧹'
};

export const defaults = {
    cleanMode: '1px'
};

/**
 * Generate the UI template
 */
export function ui(params = defaults) {
    const modeLabels = {
        '1px': 'Supprimer Pixels Isolés (1px)',
        '2px': 'Supprimer petits blocs (2px)',
        '3px': 'Supprimer blocs moyens (3px)'
    };

    return `
        <div class="item-header">
            <span>🧹 Nettoyeur Contours</span>
            <button class="btn-remove" data-action="remove">×</button>
        </div>
        <label>Méthode d'isolation</label>
        <select class="p-input" data-key="cleanMode">
            ${Object.entries(modeLabels).map(([val, label]) =>
                `<option value="${val}" ${params.cleanMode === val ? 'selected' : ''}>${label}</option>`
            ).join('')}
        </select>
    `;
}

/**
 * Clean isolated pixels from ImageData
 */
export function apply(imgData, params) {
    const w = imgData.width, h = imgData.height, data = imgData.data;
    const radius = parseInt(params.cleanMode) || 1;

    // Build alpha channel snapshot for connectivity checks
    const tempAlpha = new Uint8ClampedArray(w * h);
    for (let i = 0; i < w * h; i++) {
        tempAlpha[i] = data[i * 4 + 3];
    }

    for (let y = radius; y < h - radius; y++) {
        for (let x = radius; x < w - radius; x++) {
            const idx = (y * w + x) * 4;
            if (data[idx + 3] === 0) continue;

            let connected = 0;
            for (let ny = -radius; ny <= radius; ny++) {
                for (let nx = -radius; nx <= radius; nx++) {
                    if (nx === 0 && ny === 0) continue;
                    if (tempAlpha[(y + ny) * w + (x + nx)] > 50) connected++;
                }
            }

            if (connected < 2) {
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;
                data[idx + 3] = 0;
            }
        }
    }
}
