/**
 * process.js — Pipeline processing orchestrator
 * Part of Pixel Art Studio Modular Engine V2
 *
 * Orchestrates the sequential application of tools to ImageData.
 * Each tool receives the current ImageData, its params, and a shared context.
 */

/**
 * Run the complete pipeline on the given ImageData
 * @param {ImageData} imgData - The source image data to process
 * @param {Array} pipelineItems - Array of { tool, params } objects in order
 * @returns {ImageData} The processed image data
 */
export function runPipeline(imgData, pipelineItems) {
    // Shared context for passing data between tools (e.g., palette from quant → dither)
    const context = {};

    for (let i = 0; i < pipelineItems.length; i++) {
        const { tool, params } = pipelineItems[i];
        try {
            tool.apply(imgData, params, context);
        } catch (err) {
            console.error(`Pipeline error in tool "${tool.meta?.name || tool.id}":`, err);
        }
    }

    return imgData;
}

/**
 * Gather pipeline items from the DOM
 * @param {HTMLElement} container - The pipeline list container
 * @param {Object} toolRegistry - Map of toolId → tool module
 * @returns {Array} Array of { tool, params }
 */
export function gatherPipelineFromDOM(container, toolRegistry) {
    const items = [];
    const itemEls = container.querySelectorAll('.pipeline-item');

    itemEls.forEach(el => {
        const type = el.getAttribute('data-type');
        const tool = toolRegistry[type];
        if (!tool) return;

        const params = {};
        el.querySelectorAll('.p-input').forEach(input => {
            params[input.getAttribute('data-key')] = input.value;
        });

        items.push({ tool, params });
    });

    return items;
}
