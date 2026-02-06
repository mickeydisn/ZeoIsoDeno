
// =========================================================================
// === 3. INDEPENDENT TRANSFORM MODULE (Canvas Mutator User) ===
// =========================================================================

export class TransformModule {
    /**
     * @param {string} containerId - The ID of the div container.
     * @param {object} initialState - Initial state {translateX, translateY, scale}.
     * @param {function(object)} onStateChange - Callback with the new state when a slider changes.
     * @param {function(string)} onSimpleAction - Callback when a simple action (like reset) is triggered.
     * @param {object} workspaceMutator - Utilities for canvas manipulation/data commit.
     */
    constructor(containerId, initialState, onStateChange, onSimpleAction, workspaceMutator) {
        this.container = document.getElementById(containerId);
        this.state = initialState;
        this.onStateChange = onStateChange;
        this.onSimpleAction = onSimpleAction; 
        this.mutator = workspaceMutator; 
        this.render();

        const idSuffix = this.container.id;
        // ... (Store references)
        this.translateXSlider = this.container.querySelector(`#translateXSlider-${idSuffix}`);
        this.translateYSlider = this.container.querySelector(`#translateYSlider-${idSuffix}`);
        this.scaleSlider = this.container.querySelector(`#scaleSlider-${idSuffix}`);
        this.translateXValue = this.container.querySelector(`#translateXValue-${idSuffix}`);
        this.translateYValue = this.container.querySelector(`#translateYValue-${idSuffix}`);
        this.scaleValue = this.container.querySelector(`#scaleValue-${idSuffix}`);
        this.flipHBtn = this.container.querySelector(`#flipHBtn-${idSuffix}`);
        this.mirrorHLeftBtn = this.container.querySelector(`#mirrorHLeftBtn-${idSuffix}`);
        this.mirrorHRightBtn = this.container.querySelector(`#mirrorHRightBtn-${idSuffix}`);
        this.resetTransformBtn = this.container.querySelector(`#resetTransformBtn-${idSuffix}`);

        this.attachEventListeners();
    }

    render() {
        // ... (Same as before)
        const idSuffix = this.container.id;
        this.container.innerHTML = `
            <div class="module-group">
                <div class="module-group-title">Transformations (Actions Included)</div>
                <div class="slider-control">
                    <label>Translate X:</label>
                    <input type="range" id="translateXSlider-${idSuffix}" min="-50" max="50" value="${this.state.translateX}">
                    <span id="translateXValue-${idSuffix}">${this.state.translateX}px</span>
                </div>
                <div class="slider-control">
                    <label>Translate Y:</label>
                    <input type="range" id="translateYSlider-${idSuffix}" min="-50" max="50" value="${this.state.translateY}">
                    <span id="translateYValue-${idSuffix}">${this.state.translateY}px</span>
                </div>
                <div class="slider-control">
                    <label>Scale:</label>
                    <input type="range" id="scaleSlider-${idSuffix}" min="50" max="200" value="${this.state.scale * 100}">
                    <span id="scaleValue-${idSuffix}">${this.state.scale * 100}%</span>
                </div>
                <div class="transform-buttons">
                    <button class="btn" id="flipHBtn-${idSuffix}">Flip H</button>
                    <button class="btn" id="mirrorHLeftBtn-${idSuffix}">Mirror H (L)</button>
                    <button class="btn" id="mirrorHRightBtn-${idSuffix}">Mirror H (R)</button>
                    <button class="btn" id="resetTransformBtn-${idSuffix}">Reset Transform</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // ... (Same slider change handlers)
        this.translateXSlider.addEventListener('input', (e) => this.handleTranslateChange('translateX', e));
        this.translateYSlider.addEventListener('input', (e) => this.handleTranslateChange('translateY', e));
        this.scaleSlider.addEventListener('input', this.handleScaleChange.bind(this));
        
        this.flipHBtn.addEventListener('click', () => this.handleComplexAction('flipH'));
        this.mirrorHLeftBtn.addEventListener('click', () => this.handleComplexAction('mirrorHLeft'));
        this.mirrorHRightBtn.addEventListener('click', () => this.handleComplexAction('mirrorHRight'));
        
        this.resetTransformBtn.addEventListener('click', () => this.onSimpleAction('reset')); 
    }

    handleTranslateChange(axis, e) {
        // ... (Same as before)
        const value = parseInt(e.target.value);
        this.state[axis] = value;
        const valueSpan = axis === 'translateX' ? this.translateXValue : this.translateYValue;
        valueSpan.textContent = `${value}px`;
        this.onStateChange(this.state);
    }

    handleScaleChange(e) {
        // ... (Same as before)
        const value = parseInt(e.target.value);
        this.state.scale = value / 100;
        this.scaleValue.textContent = `${value}%`;
        this.onStateChange(this.state);
    }
    
    handleComplexAction(action) {
        this.resetSliders(); // Clear transform state before committing a destructive change
        this.onStateChange({ translateX: 0, translateY: 0, scale: 1 });
        
        const { width, height } = this.mutator.getSpriteDimensions();

        switch(action) {
            case 'flipH':
                // The module defines the canvas context manipulation
                this.mutator.commitContextTransform((ctx, tempCanvas) => {
                    ctx.translate(width, 0); 
                    ctx.scale(-1, 1);       
                    ctx.drawImage(tempCanvas, 0, 0);
                });
                break;
            case 'mirrorHLeft':
                // The module defines the pixel mutation
                this.mutator.commitPixelDataMutation(imageData => 
                    TransformModule.applyMirrorTransform(imageData, 'left', width, height)
                );
                break;
            case 'mirrorHRight':
                // The module defines the pixel mutation
                this.mutator.commitPixelDataMutation(imageData => 
                    TransformModule.applyMirrorTransform(imageData, 'right', width, height)
                );
                break;
        }
    }

    resetSliders() {
        // ... (Same as before)
        this.state = { translateX: 0, translateY: 0, scale: 1 };
        this.translateXSlider.value = 0;
        this.translateXValue.textContent = '0px';
        this.translateYSlider.value = 0;
        this.translateYValue.textContent = '0px';
        this.scaleSlider.value = 100;
        this.scaleValue.textContent = '100%';
    }

    /**
     * Static function to perform the pixel-level mirror.
     * @param {ImageData} imageData - The current image data object to mutate.
     * @param {'left'|'right'} side - Which side to mirror from.
     */
    static applyMirrorTransform(imageData, side, width, height) {
        const pixels = imageData.data;
        const halfWidth = Math.floor(width / 2);
        let changed = false;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < halfWidth; x++) {
                const srcX = side === 'left' ? x : width - 1 - x;
                const destX = side === 'left' ? width - 1 - x : x;
                
                const srcIndex = (y * width + srcX) * 4;
                const destIndex = (y * width + destX) * 4;
                
                // Copy pixel data [R, G, B, A]
                for(let i = 0; i < 4; i++) {
                    pixels[destIndex + i] = pixels[srcIndex + i];
                }
                changed = true;
            }
        }
        return changed; 
    }
}
