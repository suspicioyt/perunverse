import { debounce, hexToRgba } from './utils.js';

export class ToolManager {
    constructor(canvasManager, layerManager) {
        this.canvasManager = canvasManager;
        this.layerManager = layerManager;
        this.currentTool = 'brush';
        this.isDrawing = false;
        this.points = [];
        this.startX = 0;
        this.startY = 0;
        this.colorPicker = document.getElementById('colorPicker');
        this.brushSize = document.getElementById('brushSize');
        this.brushType = document.getElementById('brushType');
        this.brushFlow = document.getElementById('brushFlow');
    }

    init() {
        if (!this.canvasManager.canvas || !this.canvasManager.previewCanvas || !this.colorPicker || !this.brushSize || !this.brushType || !this.brushFlow) {
            console.error('ToolManager initialization failed: Missing required elements', {
                mainCanvas: !!this.canvasManager.canvas,
                previewCanvas: !!this.canvasManager.previewCanvas,
                colorPicker: !!this.colorPicker,
                brushSize: !!this.brushSize,
                brushType: !!this.brushType,
                brushFlow: !!this.brushFlow
            });
            return;
        }
        console.log('Initializing ToolManager');
        const canvas = this.canvasManager.canvas;
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', debounce((e) => this.handleMouseMove(e), 5));
        canvas.addEventListener('mouseup', () => this.handleMouseUp());
        canvas.addEventListener('mouseout', () => this.handleMouseUp());
        this.setupInputListeners();
        this.updateBrushPreview();
    }

    setupInputListeners() {
        this.brushSize.addEventListener('input', () => this.updateBrushPreview());
        this.brushType.addEventListener('change', () => this.updateBrushPreview());
        this.brushFlow.addEventListener('input', () => this.updateBrushPreview());
        this.colorPicker.addEventListener('input', () => this.updateBrushPreview());
    }

    setTool(tool) {
        this.currentTool = tool;
        console.log('Tool set to:', tool);
        this.canvasManager.redraw();
    }

    handleMouseDown(e) {
        if (!this.layerManager.currentLayer || !this.layerManager.currentLayer.ctx) {
            console.warn('Cannot start drawing: No current layer or context');
            return;
        }
        this.isDrawing = true;
        this.points = [];
        const { x, y } = this.getMousePos(e);
        this.startX = x;
        this.startY = y;
        this.points.push({ x, y });
        console.log('Start drawing:', { tool: this.currentTool, x, y });

        if (this.currentTool === 'fill') {
            this.floodFill(x, y, hexToRgba(this.colorPicker.value));
            this.layerManager.saveState('Wypełnienie');
            this.isDrawing = false;
            this.canvasManager.redraw();
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing || !this.layerManager.currentLayer || !this.layerManager.currentLayer.ctx) {
            console.log('Draw skipped:', { isDrawing: this.isDrawing, currentLayer: !!this.layerManager.currentLayer });
            return;
        }
        const { x, y } = this.getMousePos(e);
        this.points.push({ x, y });
        const ctx = this.layerManager.currentLayer.ctx;
        const previewCtx = this.canvasManager.previewCtx;
        previewCtx.clearRect(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);

        ctx.save();
        if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.drawBrushStroke(ctx);
            console.log('Drawing brush/eraser on layer:', this.layerManager.currentLayer.id, { points: this.points.length });
        } else if (this.currentTool === 'line') {
            this.drawLinePreview(previewCtx, x, y);
        } else if (this.currentTool === 'rect') {
            this.drawRectPreview(previewCtx, x, y);
        } else if (this.currentTool === 'circle') {
            this.drawCirclePreview(previewCtx, x, y);
        }
        ctx.restore();

        this.layerManager.currentLayer.needsUpdate = true;
        this.canvasManager.redraw();
    }

    handleMouseUp() {
        if (!this.isDrawing || !this.layerManager.currentLayer || !this.layerManager.currentLayer.ctx) {
            console.log('Stop drawing skipped:', { isDrawing: this.isDrawing, currentLayer: !!this.layerManager.currentLayer });
            return;
        }
        this.isDrawing = false;
        const ctx = this.layerManager.currentLayer.ctx;
        this.canvasManager.previewCanvas.classList.remove('active');
        this.canvasManager.previewCtx.clearRect(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);

        ctx.save();
        if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.drawBrushStroke(ctx);
            this.layerManager.saveState(this.currentTool === 'brush' ? 'Rysowanie' : 'Wymazywanie');
        } else if (this.currentTool === 'line') {
            this.drawLine(ctx);
            this.layerManager.saveState('Linia');
        } else if (this.currentTool === 'rect') {
            this.drawRect(ctx);
            this.layerManager.saveState('Prostokąt');
        } else if (this.currentTool === 'circle') {
            this.drawCircle(ctx);
            this.layerManager.saveState('Koło');
        }
        ctx.restore();

        this.points = [];
        this.layerManager.currentLayer.needsUpdate = true;
        this.canvasManager.redraw();
        console.log('Stopped drawing on layer:', this.layerManager.currentLayer.id, { tool: this.currentTool });
    }

    drawBrushStroke(ctx) {
        if (this.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = this.currentTool === 'brush' ? this.colorPicker.value : '#ffffff';
        ctx.lineWidth = this.brushSize.value;
        ctx.lineCap = this.brushType.value === 'square' ? 'square' : 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.brushFlow.value;
        ctx.globalCompositeOperation = this.currentTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length - 1; i++) {
            const xc = (this.points[i].x + this.points[i + 1].x) / 2;
            const yc = (this.points[i].y + this.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
        }
        ctx.stroke();
    }

    drawLinePreview(previewCtx, x, y) {
        this.canvasManager.previewCanvas.classList.add('active');
        previewCtx.beginPath();
        previewCtx.strokeStyle = this.colorPicker.value;
        previewCtx.lineWidth = this.brushSize.value;
        previewCtx.moveTo(this.startX, this.startY);
        previewCtx.lineTo(x, y);
        previewCtx.stroke();
    }

    drawLine(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.colorPicker.value;
        ctx.lineWidth = this.brushSize.value;
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
        ctx.stroke();
    }

    drawRectPreview(previewCtx, x, y) {
        this.canvasManager.previewCanvas.classList.add('active');
        previewCtx.beginPath();
        previewCtx.strokeStyle = this.colorPicker.value;
        previewCtx.lineWidth = this.brushSize.value;
        const width = x - this.startX;
        const height = y - this.startY;
        previewCtx.rect(this.startX, this.startY, width, height);
        previewCtx.stroke();
    }

    drawRect(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.colorPicker.value;
        ctx.lineWidth = this.brushSize.value;
        const width = this.points[this.points.length - 1].x - this.startX;
        const height = this.points[this.points.length - 1].y - this.startY;
        ctx.rect(this.startX, this.startY, width, height);
        ctx.stroke();
    }

    drawCirclePreview(previewCtx, x, y) {
        this.canvasManager.previewCanvas.classList.add('active');
        previewCtx.beginPath();
        previewCtx.strokeStyle = this.colorPicker.value;
        previewCtx.lineWidth = this.brushSize.value;
        const radius = Math.sqrt((x - this.startX) ** 2 + (y - this.startY) ** 2);
        previewCtx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
        previewCtx.stroke();
    }

    drawCircle(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.colorPicker.value;
        ctx.lineWidth = this.brushSize.value;
        const radius = Math.sqrt(
            (this.points[this.points.length - 1].x - this.startX) ** 2 +
            (this.points[this.points.length - 1].y - this.startY) ** 2
        );
        ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    floodFill(x, y, fillColor) {
        x = Math.floor(x);
        y = Math.floor(y);
        const ctx = this.layerManager.currentLayer.ctx;
        if (!ctx) {
            console.warn('No context for flood fill');
            return;
        }
        const imageData = ctx.getImageData(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);
        const data = imageData.data;
        const targetColor = this.getPixelColor(data, x, y);
        if (this.colorsMatch(targetColor, fillColor)) return;

        const stack = [[x, y]];
        while (stack.length) {
            const [cx, cy] = stack.pop();
            const pos = (cy * this.canvasManager.canvas.width + cx) * 4;
            if (!this.colorsMatch(this.getPixelColor(data, cx, cy), targetColor)) continue;

            data[pos] = fillColor[0];
            data[pos + 1] = fillColor[1];
            data[pos + 2] = fillColor[2];
            data[pos + 3] = fillColor[3];

            if (cx + 1 < this.canvasManager.canvas.width) stack.push([cx + 1, cy]);
            if (cx - 1 >= 0) stack.push([cx - 1, cy]);
            if (cy + 1 < this.canvasManager.canvas.height) stack.push([cx, cy + 1]);
            if (cy - 1 >= 0) stack.push([cx, cy - 1]);
        }
        ctx.putImageData(imageData, 0, 0);
        this.layerManager.currentLayer.needsUpdate = true;
        this.canvasManager.redraw();
        console.log('Flood fill applied on layer:', this.layerManager.currentLayer.id);
    }

    getMousePos(e) {
        const canvas = this.canvasManager.canvas;
        if (!canvas) {
            console.warn('Canvas not available for mouse position');
            return { x: 0, y: 0 };
        }
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn('Invalid canvas dimensions:', rect);
            return { x: 0, y: 0 };
        }
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        return { x, y };
    }

    getPixelColor(data, x, y) {
        const pos = (Math.floor(y) * this.canvasManager.canvas.width + Math.floor(x)) * 4;
        return [data[pos], data[pos + 1], data[pos + 2], data[pos + 3]];
    }

    colorsMatch(c1, c2) {
        return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
    }

    updateBrushPreview() {
        const preview = document.getElementById('brushPreview');
        if (!preview) {
            console.warn('Brush preview element not found');
            return;
        }
        preview.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 30;
        const pctx = canvas.getContext('2d');
        pctx.beginPath();
        pctx.strokeStyle = this.colorPicker.value;
        pctx.lineWidth = this.brushSize.value;
        pctx.lineCap = this.brushType.value === 'square' ? 'square' : 'round';
        pctx.globalAlpha = this.brushFlow.value;
        pctx.moveTo(10, 15);
        pctx.lineTo(90, 15);
        pctx.stroke();
        preview.appendChild(canvas);
    }
}