import { CONFIG } from './config.js';
import { showFeedback } from './utils.js';

export class Layer {
    constructor(id) {
        this.id = id;
        this.canvas = document.createElement('canvas');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        console.log('Initialized layer:', { id, width: this.canvas.width, height: this.canvas.height });
        this.visible = true;
        this.opacity = 1;
        this.blendMode = 'source-over';
        this.needsUpdate = true;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.needsUpdate = true;
        console.log('Cleared layer:', this.id);
    }
}

export class LayerManager {
    constructor(canvasManager, uiManager) {
        this.canvasManager = canvasManager;
        this.uiManager = uiManager;
        this.layers = [];
        this.currentLayer = null;
        this.undoStack = [];
        this.redoStack = [];
        this.layerCounter = 1;
        this.addLayer(); // Initialize with one layer
    }

    addLayer() {
        const layer = new Layer(`Warstwa ${this.layerCounter++}`);
        this.layers.push(layer);
        this.currentLayer = layer;
        console.log('Added layer:', layer.id, 'Current layer:', this.currentLayer.id);
        this.saveState('Nowa warstwa');
        this.uiManager.updateLayerPanel();
        this.canvasManager.redraw();
    }

    deleteLayer(index) {
        if (this.layers.length <= 1) {
            showFeedback('Nie można usunąć jedynej warstwy');
            return;
        }
        const [deletedLayer] = this.layers.splice(index, 1);
        console.log('Deleted layer:', deletedLayer.id);
        this.currentLayer = this.layers[Math.min(index, this.layers.length - 1)];
        this.saveState('Usunięcie warstwy');
        this.uiManager.updateLayerPanel();
        this.canvasManager.redraw();
    }

    renameLayer(index, newName) {
        if (newName.trim()) {
            this.layers[index].id = newName.trim();
            console.log('Renamed layer:', { index, newName });
            this.saveState('Zmiana nazwy warstwy');
            this.uiManager.updateLayerPanel();
            this.canvasManager.redraw();
        }
    }

    saveState(action) {
        const state = this.layers.map(layer => ({
            id: layer.id,
            canvas: layer.canvas.toDataURL(),
            visible: layer.visible,
            opacity: layer.opacity,
            blendMode: layer.blendMode,
        }));
        this.undoStack.push({ layers: state, action });
        if (this.undoStack.length > CONFIG.MAX_UNDO) this.undoStack.shift();
        this.redoStack = [];
        this.uiManager.updateHistoryPanel();
        console.log('Saved state:', action);
    }

    undo() {
        if (this.undoStack.length < 2) return;
        this.redoStack.push(this.undoStack.pop());
        const state = this.undoStack[this.undoStack.length - 1];
        this.restoreState(state);
        showFeedback('Cofnięto');
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this.restoreState(state);
        showFeedback('Ponowiono');
    }

    restoreState(state) {
        this.layers = [];
        state.layers.forEach(layerData => {
            const layer = new Layer(layerData.id);
            layer.visible = layerData.visible;
            layer.opacity = layerData.opacity;
            layer.blendMode = layerData.blendMode;
            const img = new Image();
            img.onload = () => {
                layer.ctx.drawImage(img, 0, 0);
                layer.needsUpdate = true;
                this.canvasManager.redraw();
            };
            img.src = layerData.canvas;
            this.layers.push(layer);
        });
        this.currentLayer = this.layers[this.layers.length - 1] || null;
        this.uiManager.updateLayerPanel();
        this.uiManager.updateHistoryPanel();
        this.canvasManager.redraw();
        console.log('Restored state:', state.action);
    }
}