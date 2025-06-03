import { CONFIG } from './config.js';
import { debounce } from './utils.js';

export class CanvasManager {
    constructor(layerManager) {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas?.getContext('2d', { willReadFrequently: true });
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas?.getContext('2d');
        this.layerManager = layerManager;
        this.compositeCache = null;
    }

    init() {
        if (!this.canvas || !this.ctx || !this.previewCanvas || !this.previewCtx) {
            console.error('Canvas elements or contexts not found');
            return;
        }
        console.log('Initializing CanvasManager');
        this.resize();
        window.addEventListener('resize', debounce(() => this.resize(), 100));
        this.redraw();
    }

    resize() {
        if (!this.canvas || !this.previewCanvas) return;
        const aspectRatio = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.8;
        this.canvas.width = Math.min(maxWidth, maxHeight * aspectRatio);
        this.canvas.height = this.canvas.width / aspectRatio;
        this.previewCanvas.width = this.canvas.width;
        this.previewCanvas.height = this.canvas.height;
        console.log('Resizing canvas to:', { width: this.canvas.width, height: this.canvas.height });

        this.layerManager.layers.forEach(layer => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = layer.canvas.width;
            tempCanvas.height = layer.canvas.height;
            tempCanvas.getContext('2d').drawImage(layer.canvas, 0, 0);
            layer.canvas.width = this.canvas.width;
            layer.canvas.height = this.canvas.height;
            layer.ctx = layer.canvas.getContext('2d', { willReadFrequently: true });
            layer.ctx.drawImage(tempCanvas, 0, 0, this.canvas.width, this.canvas.height);
            layer.needsUpdate = true;
        });
        this.compositeCache = null;
        this.redraw();
    }

    redraw() {
        if (!this.ctx || !this.canvas) {
            console.error('Cannot redraw: Canvas context or element missing');
            return;
        }
        console.log('Redrawing canvas, layers:', this.layerManager.layers.length);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const needsRedraw = this.layerManager.layers.some(layer => layer.needsUpdate) || !this.compositeCache;
        if (!needsRedraw) {
            console.log('Using cached composite');
            this.ctx.drawImage(this.compositeCache, 0, 0);
            return;
        }

        this.compositeCache = document.createElement('canvas');
        this.compositeCache.width = this.canvas.width;
        this.compositeCache.height = this.canvas.height;
        const cacheCtx = this.compositeCache.getContext('2d');
        cacheCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.layerManager.layers.forEach((layer, index) => {
            if (layer.visible && layer.opacity > 0) {
                console.log(`Rendering layer ${index}:`, { id: layer.id, opacity: layer.opacity, blendMode: layer.blendMode });
                cacheCtx.save();
                cacheCtx.globalAlpha = layer.opacity;
                cacheCtx.globalCompositeOperation = layer.blendMode;
                cacheCtx.drawImage(layer.canvas, 0, 0);
                cacheCtx.restore();
            } else {
                console.log(`Skipping layer ${index}:`, { id: layer.id, visible: layer.visible, opacity: layer.opacity });
            }
        });

        this.ctx.drawImage(this.compositeCache, 0, 0);
        this.layerManager.layers.forEach(layer => {
            if (layer.needsUpdate) {
                console.log(`Layer ${layer.id} updated`);
                layer.needsUpdate = false;
            }
        });
    }

    clear() {
        console.log('Clearing all layers');
        this.layerManager.layers.forEach(layer => layer.clear());
        this.compositeCache = null;
        this.redraw();
    }
}