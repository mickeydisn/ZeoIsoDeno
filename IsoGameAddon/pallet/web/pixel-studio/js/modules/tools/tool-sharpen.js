/**
 * Tool: Smart Sharpen (Unsharp Mask)
 * Améliore la netteté des images basse définition ou floues.
 * Utilise un masque flou (unsharp mask) avec seuillage pour éviter
 * d'amplifier le bruit dans les zones uniformes.
 */

export const id = 'sharpen';

export const meta = {
    name: 'Netteté Intelligente',
    description: 'Renforce les détails et la netteté des assets basse déf',
    category: 'enhance',
    icon: '✨'
};

export const defaults = {
    amount: 80,
    radius: 1.0,
    threshold: 10
};

/**
 * Generate the UI template for this tool's parameters
 */
export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>✨ Netteté Intelligente</span>
            <button class="btn-remove" data-action="remove">×</button>
        </div>
        <label>Force <span class="label-val" data-display="amount">${params.amount}</span>%</label>
        <input type="range" class="p-input" data-key="amount" min="0" max="200" value="${params.amount}">
        
        <label>Rayon <span class="label-val" data-display="radius">${params.radius}</span></label>
        <input type="range" class="p-input" data-key="radius" min="0.25" max="5" step="0.25" value="${params.radius}">
        
        <label>Seuil <span class="label-val" data-display="threshold">${params.threshold}</span></label>
        <input type="range" class="p-input" data-key="threshold" min="0" max="128" value="${params.threshold}">
        <small style="color:#888;font-size:11px;display:block;margin-top:4px;">
            Seuil bas = renforce presque tout (attention au bruit). Seuil haut = ne renforce que les
            contours marqués. Recommandé : 5–15 pour assets basse déf, 15–30 pour photos.
        </small>
    `;
}

/**
 * Apply smart sharpen (unsharp mask) to ImageData
 */
export function apply(imgData, params) {
    const d = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    const amount = (parseFloat(params.amount) || 80) / 100;
    const radius = parseFloat(params.radius) || 1.0;
    const threshold = parseFloat(params.threshold) || 10;

    // Create a Gaussian-blurred copy of the image
    const blurred = new Uint8ClampedArray(d.length);
    gaussianBlur(d, blurred, w, h, radius);

    // Apply unsharp mask: original + (original - blurred) * amount
    // Only where the difference exceeds the threshold (to avoid amplifying noise)
    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;

        for (let c = 0; c < 3; c++) {
            const orig = d[i + c];
            const blur = blurred[i + c];
            const diff = orig - blur;

            // Apply threshold: only sharpen if the edge is strong enough
            const absDiff = Math.abs(diff);
            if (absDiff <= threshold) continue;

            // Scale the enhancement based on how far above threshold
            let scaledDiff = diff * amount;
            // For very strong edges, reduce the enhancement somewhat to avoid halos
            if (absDiff > 60) {
                const damp = Math.max(0.3, 1 - (absDiff - 60) / 196);
                scaledDiff *= damp;
            }

            d[i + c] = Math.max(0, Math.min(255, Math.round(orig + scaledDiff)));
        }
    }
}

/**
 * Fast approximate Gaussian blur using separable box blurs
 * (3 passes of box blur ≈ Gaussian blur)
 */
function gaussianBlur(src, dst, w, h, radius) {
    // Copy source to destination first
    for (let i = 0; i < src.length; i++) {
        dst[i] = src[i];
    }

    if (radius <= 0) return;

    // Convert radius to box blur passes
    // For small radius, use fewer passes
    const passes = radius < 1.5 ? 2 : 3;
    const boxRadius = Math.max(1, Math.round(radius / Math.sqrt(passes)));

    // Temp buffer for horizontal pass
    const temp = new Uint8ClampedArray(src.length);

    for (let p = 0; p < passes; p++) {
        // Horizontal blur
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                let sumR = 0, sumG = 0, sumB = 0, sumA = 0, count = 0;
                const x1 = Math.max(0, x - boxRadius);
                const x2 = Math.min(w - 1, x + boxRadius);
                for (let nx = x1; nx <= x2; nx++) {
                    const nIdx = (y * w + nx) * 4;
                    sumR += dst[nIdx];
                    sumG += dst[nIdx + 1];
                    sumB += dst[nIdx + 2];
                    sumA += dst[nIdx + 3];
                    count++;
                }
                temp[idx]     = Math.round(sumR / count);
                temp[idx + 1] = Math.round(sumG / count);
                temp[idx + 2] = Math.round(sumB / count);
                temp[idx + 3] = Math.round(sumA / count);
            }
        }

        // Vertical blur (read from temp, write to dst)
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                const idx = (y * w + x) * 4;
                let sumR = 0, sumG = 0, sumB = 0, sumA = 0, count = 0;
                const y1 = Math.max(0, y - boxRadius);
                const y2 = Math.min(h - 1, y + boxRadius);
                for (let ny = y1; ny <= y2; ny++) {
                    const nIdx = (ny * w + x) * 4;
                    sumR += temp[nIdx];
                    sumG += temp[nIdx + 1];
                    sumB += temp[nIdx + 2];
                    sumA += temp[nIdx + 3];
                    count++;
                }
                dst[idx]     = Math.round(sumR / count);
                dst[idx + 1] = Math.round(sumG / count);
                dst[idx + 2] = Math.round(sumB / count);
                dst[idx + 3] = Math.round(sumA / count);
            }
        }
    }
}
