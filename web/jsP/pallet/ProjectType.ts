

export type TypeImage = {
    cimage: OffscreenCanvas;
}

export const DEFAULT_EMPTY_ASSET: TypeImage = {
    cimage: new OffscreenCanvas(256, 256),
};
