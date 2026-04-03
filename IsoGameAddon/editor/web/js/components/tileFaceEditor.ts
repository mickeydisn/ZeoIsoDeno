/**
 * TileFaceEditor — Tile Face Configuration Widget
 *
 * Renders and manages the 4-direction face configuration for tiles:
 * - NW, NE, SE, SW face directions
 * - Face key selection with color-coded dropdowns
 * - Integration with FaceEditor component
 *
 * Uses document.createElement exclusively (no innerHTML for data binding).
 */

import { FaceEditor } from "./faceEditor.ts";

// ============================================================================
// Types
// ============================================================================

export type FaceChangeHandler = (face: (string | null)[]) => void;

// ============================================================================
// TileFaceEditor Class
// ============================================================================

export class TileFaceEditor {
  private container: HTMLElement;
  private faceValues: (string | null)[];
  private faceKeys: string[];
  private onChange: FaceChangeHandler;
  private faceEditor: FaceEditor | null = null;

  constructor(
    container: HTMLElement,
    faceValues: (string | null)[],
    faceKeys: string[],
    onChange: FaceChangeHandler
  ) {
    this.container = container;
    this.faceValues = [...faceValues];
    this.faceKeys = [...faceKeys];
    this.onChange = onChange;
  }

  /**
   * Render the face configuration section.
   */
  render(): void {
    this.container.innerHTML = "";
    this.container.className = "editor-section tile-face-section";

    // Header
    const header = document.createElement("h3");
    header.textContent = "🔷 Face Configuration (NW, NE, SE, SW)";
    this.container.appendChild(header);

    // Face editor container
    const faceContainer = document.createElement("div");
    faceContainer.className = "face-editor-container";
    this.container.appendChild(faceContainer);

    // Initialize face editor component
    this.faceEditor = new FaceEditor(
      faceContainer,
      [...this.faceValues],
      this.faceKeys,
      (updatedFace) => {
        this.faceValues = [...updatedFace];
        this.onChange([...this.faceValues]);
      }
    );
    this.faceEditor.render();
  }

  /**
   * Get current face values.
   */
  getValues(): (string | null)[] {
    return [...this.faceValues];
  }

  /**
   * Update face values and re-render.
   */
  setFaceValues(faceValues: (string | null)[]): void {
    this.faceValues = [...faceValues];
    if (this.faceEditor) {
      this.faceEditor.setFaceValues([...this.faceValues]);
    }
  }

  /**
   * Update available face keys and re-render.
   */
  setFaceKeys(faceKeys: string[]): void {
    this.faceKeys = [...faceKeys];
    // Re-render to update dropdown options
    this.render();
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    if (this.faceEditor) {
      this.faceEditor.destroy();
      this.faceEditor = null;
    }
    this.container.innerHTML = "";
  }
}