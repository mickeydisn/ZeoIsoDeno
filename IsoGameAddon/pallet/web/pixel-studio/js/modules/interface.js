/**
 * interface.js — UI building blocks, drag/drop, controls
 * Part of Pixel Art Studio Modular Engine V2
 */

/**
 * Build a pipeline item element for a given tool
 */
export function createPipelineItem(toolDef, params) {
    const item = document.createElement('div');
    item.className = 'pipeline-item';
    item.setAttribute('draggable', 'true');
    item.setAttribute('data-type', toolDef.id);
    item.innerHTML = toolDef.ui(params);

    // Bind remove button
    const removeBtn = item.querySelector('[data-action="remove"]');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            item.remove();
            // Dispatch a custom event to notify pipeline change
            document.dispatchEvent(new CustomEvent('pipeline-change'));
        });
    }

    // Bind parameter inputs with live update
    item.querySelectorAll('.p-input').forEach(input => {
        const eventType = input.type === 'range' ? 'input' : 'change';
        input.addEventListener(eventType, () => {
            // Update display values
            const key = input.getAttribute('data-key');
            const display = item.querySelector(`[data-display="${key}"]`);
            if (display) display.textContent = input.value;

            // Notify pipeline change
            document.dispatchEvent(new CustomEvent('pipeline-change'));
        });
    });

    // Bind drag & drop
    setupDragListeners(item);

    return item;
}

/**
 * Read params from a pipeline item's inputs
 */
export function readItemParams(item) {
    const params = {};
    item.querySelectorAll('.p-input').forEach(input => {
        params[input.getAttribute('data-key')] = input.value;
    });
    return params;
}

// --- Drag & Drop ---
let dragSrcEl = null;

function setupDragListeners(el) {
    el.addEventListener('dragstart', handleDragStart, false);
    el.addEventListener('dragenter', handleDragEnter, false);
    el.addEventListener('dragover', handleDragOver, false);
    el.addEventListener('dragleave', handleDragLeave, false);
    el.addEventListener('drop', handleDrop, false);
    el.addEventListener('dragend', handleDragEnd, false);
}

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    this.style.opacity = '0.4';
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    return false;
}

function handleDragEnter(e) {
    this.style.borderTop = '3px solid var(--accent-color)';
}

function handleDragLeave(e) {
    this.style.borderTop = '';
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragSrcEl !== this) {
        const container = this.parentNode;
        container.insertBefore(dragSrcEl, this);
        document.dispatchEvent(new CustomEvent('pipeline-change'));
    }
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    this.style.borderTop = '';
    const container = this.closest('.pipeline-list');
    if (container) {
        container.querySelectorAll('.pipeline-item').forEach(el => {
            el.style.borderTop = '';
        });
    }
}

/**
 * Create tool button for the "Add filters" section
 */
export function createAddToolButton(toolDef) {
    const btn = document.createElement('button');
    btn.className = 'action-btn btn-secondary';
    btn.textContent = `+ ${toolDef.meta.icon || '🔧'} ${toolDef.meta.name}`;
    btn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('add-tool', { detail: { toolId: toolDef.id } }));
    });
    return btn;
}

/**
 * Update a display label linked to an input range
 */
export function bindRangeDisplay(input, displayEl) {
    input.addEventListener('input', () => {
        displayEl.textContent = input.value;
    });
}
