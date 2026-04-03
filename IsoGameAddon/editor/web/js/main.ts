/**
 * Main Entry Point for Building Config Editor
 *
 * This file serves as the single entry point for the editor application.
 * All modules are imported here so esbuild bundles them together,
 * ensuring all imports share the same StateManager instance.
 */

import { stateManager } from "./state.ts";
import { apiClient } from "./api.ts";
import { BuildingEditorPanel } from "./panels/building.ts";
import { AssetCollectionEditorPanel } from "./panels/assetCollection.ts";
import { LibraryPanel } from "./panels/library.ts";

// Make stateManager globally available for any non-module scripts
(window as any).__stateManager = stateManager;

console.log("[main] Building Config Editor initialized");

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const libraryContainer = document.getElementById("library-panel");
  const mainPanel = document.getElementById("main-panel");
  const loadingDiv = document.getElementById("loading");
  const errorBanner = document.getElementById("error-banner");

  // Hide loading div initially
  if (loadingDiv) {
    loadingDiv.classList.add("hidden");
  }

  // Initialize library panel
  if (libraryContainer) {
    const libraryPanel = new LibraryPanel(stateManager, apiClient);
    libraryPanel.render(libraryContainer);
  }

  // Editor panel instances (created lazily)
  let buildingPanel: BuildingEditorPanel | null = null;
  let assetCollectionPanel: AssetCollectionEditorPanel | null = null;

  // Subscribe to state changes
  stateManager.subscribe(() => {
    const state = stateManager.getState();

    // Handle loading div
    if (loadingDiv) {
      if (state.loading) {
        loadingDiv.classList.remove("hidden");
      } else {
        loadingDiv.classList.add("hidden");
      }
    }

    // Handle error banner
    if (errorBanner) {
      if (state.error) {
        errorBanner.textContent = state.error;
        errorBanner.classList.remove("hidden");
      } else {
        errorBanner.textContent = "";
        errorBanner.classList.add("hidden");
      }
    }

    // Handle editor panels based on active config type
    if (mainPanel) {
      if (state.activeConfig?.type === "building") {
        // Show building editor
        if (!buildingPanel) {
          buildingPanel = new BuildingEditorPanel(stateManager, apiClient);
        }
        buildingPanel.render(mainPanel);
        assetCollectionPanel = null;
      } else if (state.activeConfig?.type === "assetCollection") {
        // Show asset collection editor
        if (!assetCollectionPanel) {
          assetCollectionPanel = new AssetCollectionEditorPanel(stateManager, apiClient);
        }
        assetCollectionPanel.render(mainPanel);
        buildingPanel = null;
      } else if (state.activeConfig?.type === null || state.activeConfig?.data === null) {
        // Show placeholder
        mainPanel.innerHTML = `
          <div class="placeholder-content">
            <h2>Welcome to Building Config Editor</h2>
            <p>Select a configuration from the library to start editing.</p>
            <p>Use the Extract All button to load TypeScript configurations.</p>
          </div>
        `;
        buildingPanel = null;
        assetCollectionPanel = null;
      }
    }
  });

  console.log("[main] State subscription registered");
});