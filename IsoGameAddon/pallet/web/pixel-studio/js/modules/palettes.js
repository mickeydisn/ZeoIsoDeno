/**
 * palettes.js — Palette color definitions and helpers
 * Part of Pixel Art Studio Modular Engine
 */

export const PALETTES = {
    "16_std": {
        name: "16 Couleurs (Standard Web)",
        colors: [
            [0,0,0],[128,0,0],[0,128,0],[128,128,0],
            [0,0,128],[128,0,128],[0,128,128],[192,192,192],
            [128,128,128],[255,0,0],[0,255,0],[255,255,0],
            [0,0,255],[255,0,255],[0,255,255],[255,255,255]
        ]
    },
    "16_cga": {
        name: "16 Couleurs (CGA Retro)",
        colors: [
            [0,0,0],[170,0,0],[0,170,0],[170,85,0],
            [0,0,170],[170,0,170],[0,170,170],[170,170,170],
            [85,85,85],[255,85,85],[85,255,85],[255,255,85],
            [85,85,255],[255,85,255],[85,255,255],[255,255,255]
        ]
    },
    "32_std": {
        name: "32 Couleurs (Standard Étendu)",
        colors: [
            [0,0,0],[68,68,68],[102,102,102],[153,153,153],
            [204,204,204],[238,238,238],[255,255,255],[128,0,0],
            [255,0,0],[255,128,128],[0,128,0],[0,255,0],
            [128,255,128],[128,128,0],[255,255,0],[255,255,128],
            [0,0,128],[0,0,255],[128,128,255],[128,0,128],
            [255,0,255],[255,128,255],[0,128,128],[0,255,255],
            [128,255,255],[64,0,0],[128,64,0],[255,128,0],
            [128,96,0],[255,192,128],[64,64,0],[96,128,0]
        ]
    },
    "32_sweet": {
        name: "32 Couleurs (Sweetie Pastel)",
        colors: [
            [26,28,44],[40,43,68],[51,55,92],[67,72,117],
            [95,100,147],[123,130,177],[154,161,200],[191,196,220],
            [222,212,186],[240,215,172],[244,196,148],[244,172,138],
            [235,147,130],[213,107,116],[175,81,97],[133,64,84],
            [232,145,113],[246,176,129],[255,207,136],[254,237,155],
            [226,235,159],[190,216,141],[155,195,129],[120,175,119],
            [124,189,187],[140,211,212],[172,231,205],[201,245,213],
            [177,193,235],[158,161,212],[141,126,181],[244,147,168]
        ]
    },
    "32_db32": {
        name: "32 Couleurs (DB32 Retro)",
        colors: [
            [0,0,0],[34,32,52],[69,40,60],[102,57,49],
            [143,86,59],[223,113,38],[217,160,102],[238,195,154],
            [251,242,54],[153,229,80],[106,190,48],[55,148,110],
            [75,105,47],[82,75,36],[50,60,57],[63,73,115],
            [48,96,130],[91,110,225],[99,155,255],[95,205,228],
            [203,219,252],[255,255,255],[155,173,183],[132,126,135],
            [105,106,106],[89,86,81],[118,66,138],[172,50,50],
            [217,87,99],[215,123,186],[143,151,74],[138,111,48]
        ]
    },
    "32_gameboy": {
        name: "32 Couleurs (Gameboy Advanced)",
        colors: [
            [15,56,15],[48,98,48],[139,172,15],[155,188,15],
            [10,10,25],[30,40,80],[90,100,180],[150,190,240],
            [240,250,220],[200,160,40],[140,90,20],[70,30,10],
            [250,50,90],[180,20,80],[100,10,60],[40,5,40],
            [5,120,130],[20,170,150],[110,220,190],[220,250,240],
            [250,120,40],[200,80,20],[255,220,80],[255,255,255],
            [210,210,210],[160,160,160],[110,110,110],[70,70,70],
            [40,40,40],[180,140,200],[120,80,150],[50,20,90]
        ]
    },
    "48": { name: "48 Couleurs (Étendu Adaptatif)", colors: null },
    "64": { name: "64 Couleurs (Adaptatif)", colors: null },
    "128": { name: "128 Couleurs (Adaptatif)", colors: null }
};


/**
 * Get palette colors by mode ID, extracting dynamically if needed
 */
export function getPalette(mode, imgData = null) {
    const entry = PALETTES[mode];
    if (!entry) return PALETTES["32_std"].colors;
    if (entry.colors) return entry.colors;

    // Adaptive palette extraction from image data
    const maxColors = parseInt(mode);
    return extractAdaptivePalette(imgData, maxColors);
}

/**
 * Dynamically extract a color palette from ImageData
 */
export function extractAdaptivePalette(imgData, maxColors) {
    if (!imgData) return PALETTES["32_std"].colors;

    const data = imgData.data;
    const buckets = {};

    for (let i = 0; i < data.length; i += 16) {
        if (data[i + 3] < 128) continue;
        const key = (data[i] >> 4) + "," + (data[i + 1] >> 4) + "," + (data[i + 2] >> 4);
        if (!buckets[key]) buckets[key] = { rgb: [data[i], data[i + 1], data[i + 2]], count: 0 };
        buckets[key].count++;
    }

    return Object.values(buckets)
        .sort((a, b) => b.count - a.count)
        .slice(0, maxColors)
        .map(b => b.rgb);
}

/**
 * Color distance functions
 */
export function getColorDistance(c1, c2, algo = 'euclidean') {
    if (algo === 'manhattan') {
        return Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c2[1]) + Math.abs(c1[2] - c2[2]);
    }
    if (algo === 'cie76') {
        return Math.pow((c1[0] - c2[0]) * 0.3, 2) +
               Math.pow((c1[1] - c2[1]) * 0.59, 2) +
               Math.pow((c1[2] - c2[2]) * 0.11, 2);
    }
    // euclidean
    return Math.pow(c1[0] - c2[0], 2) +
           Math.pow(c1[1] - c2[1], 2) +
           Math.pow(c1[2] - c2[2], 2);
}

/**
 * Find nearest color in palette
 */
export function findNearestColor(pixel, palette, algo = 'euclidean') {
    let minDistance = Infinity;
    let nearest = palette[0] || [0, 0, 0];
    for (let i = 0; i < palette.length; i++) {
        const dist = getColorDistance(pixel, palette[i], algo);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = palette[i];
        }
    }
    return nearest;
}

/**
 * Apply palette snap directly to ImageData
 */
export function applyDirectPaletteSnap(imgData, palette, algo = 'euclidean') {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue;
        const nearest = findNearestColor([d[i], d[i + 1], d[i + 2]], palette, algo);
        d[i] = nearest[0];
        d[i + 1] = nearest[1];
        d[i + 2] = nearest[2];
    }
}
