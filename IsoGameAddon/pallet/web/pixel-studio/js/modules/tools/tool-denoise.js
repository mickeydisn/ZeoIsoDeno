/**
 * Tool: Denoiser (Median Filter)
 * Removes noise (salt & pepper, static) while preserving edges.
 * Replaces each pixel with the median value of its surrounding neighbors.
 * Great for cleaning noisy or poorly compressed assets.
 */

export const id = 'denoise';

export const meta = {
    name: 'Débruitage Médian',
    description: 'Supprime le bruit tout en préservant les contours',
    category: 'clean',
    icon: '🧼'
};

export const defaults = {
    radius: 1,
    threshold: 40
};

/**
 * Generate the UI template for this tool's parameters
 */
export function ui(params = defaults) {
    const radiusLabels = {
        '1': 'Faible (3×3)',
        '2': 'Moyen (5×5)',
        '3': 'Fort (7×7)'
    };

    return `
        <div class="item-header">
            <span>🧼 Débruitage Médian</span>
            <button class="btn-remove" data-action="remove">×</button>
        </div>
        <label>Rayon du filtre</label>
        <select class="p-input" data-key="radius">
            ${Object.entries(radiusLabels).map(([val, label]) =>
                `<option value="${val}" ${String(params.radius) === val ? 'selected' : ''}>${label}</option>`
            ).join('')}
        </select>
        <label>Seuil de changement <span class="label-val" data-display="threshold">${params.threshold}</span></label>
        <input type="range" class="p-input" data-key="threshold" min="0" max="255" value="${params.threshold}">
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Plus le seuil est bas, plus le filtre est fort. À 255, aucun pixel n'est modifié.
            Valeur recommandée : 30–60 pour du bruit léger, 60–120 pour du bruit fort.
        </small>
    `;
}

/**
 * Get median value from a sorted array
 */
function getMedian(values) {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0
        ? Math.round((values[mid - 1] + values[mid]) / 2)
        : values[mid];
}

/**
 * Apply median denoising to ImageData
 */
export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const radius = Math.max(1, Math.min(3, parseInt(params.radius) || 1));
    const threshold = Math.max(0, Math.min(255, parseFloat(params.threshold) || 40));

    // Create copies of R, G, B, A channels for reading
    const srcR = new Uint8ClampedArray(w * h);
    const srcG = new Uint8ClampedArray(w * h);
    const srcB = new Uint8ClampedArray(w * h);
    const srcA = new Uint8ClampedArray(w * h);

    for (let i = 0; i < w * h; i++) {
        const idx = i * 4;
        srcR[i] = d[idx];
        srcG[i] = d[idx + 1];
        srcB[i] = d[idx + 2];
        srcA[i] = d[idx + 3];
    }

    const kernelSize = radius * 2 + 1;
    const maxSamples = kernelSize * kernelSize;
    const samplesR = new Uint8ClampedArray(maxSamples);
    const samplesG = new Uint8ClampedArray(maxSamples);
    const samplesB = new Uint8ClampedArray(maxSamples);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;

            // Skip fully transparent pixels
            if (d[idx + 3] === 0) continue;

            let count = 0;

            // Gather neighbor samples
            for (let ky = -radius; ky <= radius; ky++) {
                const ny = y + ky;
                if (ny < 0 || ny >= h) continue;
                for (let kx = -radius; kx <= radius; kx++) {
                    const nx = x + kx;
                    if (nx < 0 || nx >= w) continue;
                    const ni = ny * w + nx;
                    samplesR[count] = srcR[ni];
                    samplesG[count] = srcG[ni];
                    samplesB[count] = srcB[ni];
                    count++;
                }
            }

            if (count < 3) continue;

            // Compute median for each channel
            const medR = getMedian(samplesR.subarray(0, count));
            const medG = getMedian(samplesG.subarray(0, count));
            const medB = getMedian(samplesB.subarray(0, count));

            // Only apply if the change exceeds the threshold (noise gating)
            const diffR = Math.abs(d[idx] - medR);
            const diffG = Math.abs(d[idx + 1] - medG);
            const diffB = Math.abs(d[idx + 2] - medB);
            const maxDiff = Math.max(diffR, diffG, diffB);

            if (maxDiff > threshold) {
                // Blend towards median proportional to how extreme the difference is
                // (stronger noise = more aggressive correction)
                const blend = Math.min(1, (maxDiff - threshold) / 128);
                d[idx]     = Math.round(d[idx]     + (medR - d[idx])     * blend);
                d[idx + 1] = Math.round(d[idx + 1] + (medG - d[idx + 1]) * blend);
                d[idx + 2] = Math.round(d[idx + 2] + (medB - d[idx + 2]) * blend);
            }
        }
    }
}
