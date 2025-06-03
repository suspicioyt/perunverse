import { CanvasManager } from './canvas.js';
import { LayerManager, Layer } from './layers.js';
import { ToolManager } from './tools.js';
import { UIManager } from './ui.js';
import { showFeedback } from './utils.js';

const canvasManager = new CanvasManager();
const uiManager = new UIManager(null);
const layerManager = new LayerManager(canvasManager, uiManager);
uiManager.layerManager = layerManager;
const toolManager = new ToolManager(canvasManager, layerManager);

function init() {
    console.log('Initializing app');
    canvasManager.init();
    toolManager.init();
    if (!layerManager.currentLayer) {
        layerManager.addLayer();
    }
    document.addEventListener('keydown', handleShortcuts);
    showFeedback('Witaj w Grok 3!');

    document.querySelectorAll('#toolbar button[data-tool]').forEach(button => {
        button.addEventListener('click', () => {
            const tool = button.dataset.tool;
            toolManager.setTool(tool);
        });
    });
    document.querySelector('#clearBtn').addEventListener('click', clearCanvas);
    document.querySelector('#undoBtn').addEventListener('click', undo);
    document.querySelector('#redoBtn').addEventListener('click', redo);
    document.querySelector('#addLayerBtn').addEventListener('click', addLayer);
    document.querySelector('#themeToggle').addEventListener('click', toggleTheme);
    document.querySelector('#fullscreenBtn').addEventListener('click', toggleFullscreen);
}

function setTool(tool) {
    toolManager.setTool(tool);
}

function addLayer() {
    layerManager.addLayer();
}

function clearCanvas() {
    canvasManager.clear();
    layerManager.saveState('Wyczyść płótno');
}

function undo() {
    layerManager.undo();
}

function redo() {
    layerManager.redo();
}

function revertToHistory(index) {
    while (layerManager.undoStack.length - 1 > index) {
        layerManager.redoStack.push(layerManager.undoStack.pop());
    }
    layerManager.restoreState(layerManager.undoStack[layerManager.undoStack.length - 1]);
}

function toggleLayerVisibility(index) {
    layerManager.layers[index].visible = !layerManager.layers[index].visible;
    layerManager.layers[index].needsUpdate = true;
    canvasManager.redraw();
    layerManager.saveState('Zmiana widoczności warstwy');
}

function changeLayerOpacity(index, value) {
    layerManager.layers[index].opacity = parseFloat(value);
    layerManager.layers[index].needsUpdate = true;
    canvasManager.redraw();
    layerManager.saveState('Zmiana przezroczystości warstwy');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    showFeedback('Motyw zmieniony');
}

function handleShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
            e.preventDefault();
            undo();
        }
        if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) {
            e.preventDefault();
            redo();
        }
        if (e.shiftKey && e.key === 'N') {
            e.preventDefault();
            clearCanvas();
        }
        if (e.shiftKey && e.key === 'L') {
            e.preventDefault();
            addLayer();
        }
    } else {
        switch (e.key.toLowerCase()) {
            case 'b': setTool('brush'); break;
            case 'e': setTool('eraser'); break;
            case 'g': setTool('fill'); break;
            case 'l': setTool('line'); break;
            case 'r': setTool('rect'); break;
            case 'c': setTool('circle'); break;
        }
    }
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
}

window.grok3 = {
    setTool,
    addLayer,
    clearCanvas,
    undo,
    redo,
    revertToHistory,
    toggleLayerVisibility,
    changeLayerOpacity,
    toggleFullscreen,
    toggleTheme
};

document.addEventListener('DOMContentLoaded', () => {
    init();
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
});