/**
 * Tool: Pixel Art Render (Pixelation)
 * Downscales and pixelates the image into blocky pixel art style.
 */

export const id = 'pixel';

export const meta = {
    name: 'Pixel Art Render',
    description: 'Pixelate l\'image en blocs de pixels',
    category: 'effect',
    icon: '🧊'
};

export const defaults = {
    size: 8,
    algo: 'center'
};

/**
 * Generate the UI template
 */
export function ui(params = defaults) {
    return `
        <div class="item-header">
            <span>🧊 Pixel Art Render</span>
            <button class="btn-remove" data-action="remove">×</button>
        </div>
        <label>Taille Pixel <span class="label-val" data-display="size">${params.size}</span>px</label>
        <input type="range" class="p-input" data-key="size" min="1" max="64" value="${params.size}">
        <label>Mode Échantillonnage</label>
        <select class="p-input" data-key="algo">
            <option value="center" ${params.algo === 'center' ? 'selected' : ''}>Pixel Centre</option>
            <option value="average" ${params.algo === 'average' ? 'selected' : ''}>Moyenne du Bloc</option>
        </select>
    `;
}

/**
 * Apply pixelation to ImageData
 */
export function apply(imgData, params) {
    const size = parseInt(params.size) || 1;
    if (size <= 1) return imgData;

    const w = imgData.width, h = imgData.height, data = imgData.data;

    for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
            let r = 0, g = 0, b = 0, a = 0, count = 0;

            if (params.algo === 'average') {
                // Block average sampling
                for (let cy = 0; cy < size && y + cy < h; cy++) {
                    for (let cx = 0; cx < size && x + cx < w; cx++) {
                        const idx = ((y + cy) * w + (x + cx)) * 4;
                        r += data[idx];
                        g += data[idx + 1];
                        b += data[idx + 2];
                        a += data[idx + 3];
                        count++;
                    }
                }
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);
                a = Math.floor(a / count);
            } else {
                // Center pixel sampling
                const cx = Math.min(x + Math.floor(size / 2), w - 1);
                const cy = Math.min(y + Math.floor(size / 2), h - 1);
                const idx = (cy * w + cx) * 4;
                r = data[idx];
                g = data[idx + 1];
                b = data[idx + 2];
                a = data[idx + 3];
            }

            // Fill the block
            for (let cy = 0; cy < size && y + cy < h; cy++) {
                for (let cx = 0; cx < size && x + cx < w; cx++) {
                    const idx = ((y + cy) * w + (x + cx)) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = a;
                }
            }
        }
    }

    return imgData;
}
