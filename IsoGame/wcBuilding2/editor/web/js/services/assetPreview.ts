/**
 * Asset Image Loading Service
 *
 * Handles loading and caching of asset images from the server.
 * Provides fallback for broken/missing images.
 */

// ============================================================================
// Placeholder for missing/broken images
// ============================================================================

// Minimal 16x16 gray placeholder icon as data URI
const PLACEHOLDER_IMAGE_DATA_URI =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iOCIgeT0iOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxMCI+PzwvdGV4dD48L3N2Zz4=";

// ============================================================================
// Asset Preview Service Class
// ============================================================================

export class AssetPreviewService {
  private cache: Map<string, HTMLImageElement> = new Map();
  private promises: Map<string, Promise<HTMLImageElement>> = new Map();

  constructor() {}

  /**
   * Load a single image by key.
   * Returns cached image if already loaded.
   * Returns placeholder on failure.
   */
  async loadImage(key: string): Promise<HTMLImageElement> {
    // Return from cache if available
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Return in-flight promise if already loading
    if (this.promises.has(key)) {
      return this.promises.get(key)!;
    }

    // Start loading
    const promise = this.loadImageInternal(key);
    this.promises.set(key, promise);

    try {
      const img = await promise;
      return img;
    } finally {
      this.promises.delete(key);
    }
  }

  /**
   * Load multiple images in parallel.
   * Returns map of key → image.
   */
  async loadImages(keys: string[]): Promise<Map<string, HTMLImageElement>> {
    const results = new Map<string, HTMLImageElement>();

    await Promise.all(
      keys.map(async (key) => {
        const img = await this.loadImage(key);
        results.set(key, img);
      })
    );

    return results;
  }

  /**
   * Get placeholder image data URI for broken/missing images.
   */
  getPlaceholderImage(): string {
    return PLACEHOLDER_IMAGE_DATA_URI;
  }

  /**
   * Clear all cached images.
   * Useful when assets are updated.
   */
  clearCache(): void {
    // Revoke object URLs to prevent memory leaks
    for (const [key, img] of this.cache) {
      if (img.src.startsWith("blob:")) {
        URL.revokeObjectURL(img.src);
      }
    }
    this.cache.clear();
    this.promises.clear();
  }

  /**
   * Internal method to load a single image.
   */
  private async loadImageInternal(key: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        this.cache.set(key, img);
        resolve(img);
      };

      img.onerror = () => {
        // Create placeholder image for broken/missing assets
        const placeholder = this.createPlaceholderElement();
        this.cache.set(key, placeholder);
        resolve(placeholder);
      };

      // Set source to trigger load
      img.src = this.buildImageUrl(key);
    });
  }

  /**
   * Build URL for asset image.
   */
  private buildImageUrl(key: string): string {
    return `/editor/asset-preview/${encodeURIComponent(key)}`;
  }

  /**
   * Create a placeholder image element.
   */
  private createPlaceholderElement(): HTMLImageElement {
    const img = new Image(16, 16);
    img.src = PLACEHOLDER_IMAGE_DATA_URI;
    return img;
  }
}