/**
 * main.js — App entry point, tool registry, initialization
 * Part of Pixel Art Studio Modular Engine V2
 *
 * This file:
 * - Indexes all available tools
 * - Manages the tool registry
 * - Handles image loading
 * - Orchestrates zoom, save, and global events
 */

import * as toolHSL from './tools/tool-hsl.js';
import * as toolQuant from './tools/tool-quant.js';
import * as toolDither from './tools/tool-dither.js';
import * as toolOutline from './tools/tool-outline.js';
import * as toolPixel from './tools/tool-pixel.js';
import * as toolContrast from './tools/tool-contrast.js';
import * as toolEdge from './tools/tool-edge.js';
import * as toolDenoise from './tools/tool-denoise.js';
import * as toolSharpen from './tools/tool-sharpen.js';
import * as toolIsoClean from './tools/tool-isoclean.js';
import * as toolEdgeClean from './tools/tool-edgeclean.js';
import * as toolDespeckle from './tools/tool-despeckle.js';
import * as toolDehalo from './tools/tool-dehalo.js';
import * as toolDust from './tools/tool-dust.js';
import * as toolHolefill from './tools/tool-holefill.js';
import * as toolAAClean from './tools/tool-aaclean.js';
import { createPipelineItem, createAddToolButton, readItemParams } from './interface.js';
import { runPipeline, gatherPipelineFromDOM } from './process.js';

// --- Tool Registry ---
// Each tool exports: id, meta, defaults, ui(params), apply(imgData, params, context)
const TOOLS = [
    toolHSL,
    toolQuant,
    toolDither,
    toolOutline,
    toolPixel,
    toolContrast,
    toolEdge,
    toolDenoise,
    toolSharpen,
    toolIsoClean,
    toolEdgeClean,
    toolDespeckle,
    toolDehalo,
    toolDust,
    toolHolefill,
    toolAAClean
];

// Build lookup map: toolId → tool module
const toolRegistry = {};
TOOLS.forEach(t => { toolRegistry[t.id] = t; });

// --- DOM References ---
let canvas, ctx, originalImage;
let zoomScale = 1.0;
let currentFileName = 'pixelart-studio';
const pipelineContainer = document.getElementById('pipelineList');
const addToolsContainer = document.getElementById('addToolsContainer');

/**
 * Initialize the application
 */
function init() {
    canvas = document.getElementById('mainCanvas');
    ctx = canvas.getContext('2d');
    pipelineContainer.innerHTML = '';

    // Build "Add filter" buttons
    buildAddToolsUI();

    // Add default pipeline (matching original behavior)
    addToolToPipeline('hsl');
    addToolToPipeline('quant');
    addToolToPipeline('dither');
    addToolToPipeline('outline');
    addToolToPipeline('pixel');

    // Setup image loader
    setupImageLoader();

    // Setup zoom controls
    setupZoomControls();

    // Setup save button
    setupSaveButton();

    // Setup pipeline save/load
    setupPipelineSaveLoad();

    // Listen for pipeline changes
    document.addEventListener('pipeline-change', processImage);
    document.addEventListener('add-tool', (e) => {
        addToolToPipeline(e.detail.toolId);
    });

    // Initial auto-process once an image is loaded
}

/**
 * Build the "Add filter" button grid
 */
function buildAddToolsUI() {
    addToolsContainer.innerHTML = '';
    TOOLS.forEach(t => {
        const btn = createAddToolButton(t);
        addToolsContainer.appendChild(btn);
    });
}

/**
 * Add a tool to the pipeline
 */
function addToolToPipeline(toolId) {
    const tool = toolRegistry[toolId];
    if (!tool) return;

    const item = createPipelineItem(tool, tool.defaults);
    pipelineContainer.appendChild(item);
    document.dispatchEvent(new CustomEvent('pipeline-change'));
}

/**
 * Setup image file loader
 */
function setupImageLoader() {
    const loader = document.getElementById('imageLoader');
    loader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Store original filename (without extension)
        currentFileName = file.name.replace(/\.[^/.]+$/, '');

        const reader = new FileReader();
        reader.onload = (event) => {
            originalImage = new Image();
            originalImage.onload = () => {
                canvas.width = originalImage.width;
                canvas.height = originalImage.height;
                zoomScale = 1.0;
                updateZoom();
                processImage();
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Zoom controls
 */
function setupZoomControls() {
    document.getElementById('btnZoomIn').addEventListener('click', () => {
        zoomScale += 0.25;
        updateZoom();
    });
    document.getElementById('btnZoomOut').addEventListener('click', () => {
        if (zoomScale > 0.25) zoomScale -= 0.25;
        updateZoom();
    });
    document.getElementById('btnZoomReset').addEventListener('click', () => {
        zoomScale = 1.0;
        updateZoom();
    });
}

function updateZoom() {
    canvas.style.transform = `scale(${zoomScale})`;
    const zoomVal = document.getElementById('zoomVal');
    if (zoomVal) zoomVal.textContent = Math.round(zoomScale * 100);
}

/**
 * Save button — saves image with -col.png suffix
 */
function setupSaveButton() {
    document.getElementById('btnSaveImg').addEventListener('click', () => {
        if (!originalImage) return alert('Chargez une image !');
        const link = document.createElement('a');
        link.download = currentFileName + '-col.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

/**
 * Serialize the current pipeline to a JSON object
 */
function serializePipeline() {
    const items = [];
    const itemEls = pipelineContainer.querySelectorAll('.pipeline-item');
    itemEls.forEach(el => {
        const type = el.getAttribute('data-type');
        const params = {};
        el.querySelectorAll('.p-input').forEach(input => {
            params[input.getAttribute('data-key')] = input.value;
        });
        items.push({ type, params });
    });
    return { pipeline: items };
}

/**
 * Deserialize and rebuild the pipeline from a JSON object
 */
function deserializePipeline(data) {
    // Clear existing pipeline
    pipelineContainer.innerHTML = '';

    // Rebuild each item
    data.pipeline.forEach(item => {
        const tool = toolRegistry[item.type];
        if (!tool) {
            console.warn(`Unknown tool type: ${item.type}`);
            return;
        }
        const pipelineItem = createPipelineItem(tool, item.params);
        pipelineContainer.appendChild(pipelineItem);
    });

    // Re-process
    document.dispatchEvent(new CustomEvent('pipeline-change'));
}

/**
 * Setup pipeline save/load buttons
 */
function setupPipelineSaveLoad() {
    // Save pipeline
    document.getElementById('btnSavePipeline').addEventListener('click', () => {
        const data = serializePipeline();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = currentFileName + '-pipeline.json';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    });

    // Load pipeline (trigger hidden file input)
    document.getElementById('btnLoadPipeline').addEventListener('click', () => {
        document.getElementById('pipelineLoader').click();
    });

    // Handle pipeline file selection
    document.getElementById('pipelineLoader').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!data.pipeline || !Array.isArray(data.pipeline)) {
                    throw new Error('Invalid pipeline format: missing "pipeline" array');
                }
                deserializePipeline(data);
            } catch (err) {
                alert('Erreur lors du chargement du pipeline : ' + err.message);
                console.error(err);
            }
        };
        reader.readAsText(file);

        // Reset input so the same file can be loaded again
        e.target.value = '';
    });
}

/**
 * Main processing loop: gather pipeline → run → put on canvas
 */
function processImage() {
    if (!originalImage) return;

    // Reset canvas to original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0);

    // Get ImageData
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Gather pipeline from DOM
    const pipelineItems = gatherPipelineFromDOM(pipelineContainer, toolRegistry);

    // Run pipeline
    runPipeline(imgData, pipelineItems);

    // Write back
    ctx.putImageData(imgData, 0, 0);
}

// --- App Start ---
document.addEventListener('DOMContentLoaded', init);

// Expose for debugging
window.__pixelStudio = { toolRegistry, processImage };
