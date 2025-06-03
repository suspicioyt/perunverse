export class UIManager {
    constructor(layerManager) {
        this.layerManager = layerManager;
        this.layerPanel = document.getElementById('layerPanel');
        this.historyPanel = document.getElementById('historyPanel');
    }

    updateLayerPanel() {
        if (!this.layerPanel) return;
        this.layerPanel.innerHTML = '<h4 class="panel-title">Warstwy</h4>';
        this.layerManager.layers.slice().reverse().forEach((layer, index) => {
            const div = document.createElement('div');
            div.className = `layer ${layer === this.layerManager.currentLayer ? 'active' : ''}`;
            div.draggable = true;
            div.dataset.index = this.layerManager.layers.length - 1 - index;
            div.innerHTML = `
                <span class="layer-name">${layer.id}</span>
                <span class="layer-controls">
                    <input type="checkbox" ${layer.visible ? 'checked' : ''} onchange="grok3.toggleLayerVisibility(${this.layerManager.layers.length - 1 - index})">
                    <input type="range" min="0" max="1" step="0.01" value="${layer.opacity}" onchange="grok3.changeLayerOpacity(${this.layerManager.layers.length - 1 - index}, this.value)">
                </span>
            `;
            div.onclick = (e) => {
                if (!e.target.matches('input')) {
                    this.layerManager.currentLayer = layer;
                    this.updateLayerPanel();
                }
            };
            div.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', div.dataset.index);
            };
            div.ondragover = (e) => e.preventDefault();
            div.ondrop = (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = parseInt(div.dataset.index);
                const [movedLayer] = this.layerManager.layers.splice(fromIndex, 1);
                this.layerManager.layers.splice(toIndex, 0, movedLayer);
                this.updateLayerPanel();
                this.layerManager.canvasManager.redraw();
                this.layerManager.saveState('Zmiana kolejności warstw');
            };
            this.layerPanel.appendChild(div);
        });
    }

    updateHistoryPanel() {
        if (!this.historyPanel) return;
        this.historyPanel.innerHTML = '<h4>Historia</h4>';
        this.layerManager.undoStack.slice().reverse().forEach((state, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.textContent = state.action;
            div.onclick = () => grok3.revertToHistory(this.layerManager.undoStack.length - 1 - index);
            this.historyPanel.appendChild(div);
        });
    }
}