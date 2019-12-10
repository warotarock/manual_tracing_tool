var ManualTracingTool;
(function (ManualTracingTool) {
    class CanvasWindow {
        constructor() {
            this.canvas = null;
            this.context = null;
            this.width = 0.0;
            this.height = 0.0;
            this.viewLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.centerLocationRate = vec3.fromValues(0.0, 0.0, 0.0);
            this.viewScale = 1.0;
            this.viewRotation = 0.0;
            this.mirrorX = false;
            this.mirrorY = false;
            this.maxViewScale = 30.0;
            this.minViewScale = 0.1;
            this.transformMatrix = mat4.create();
            this.tempVec3 = vec3.create();
            this.tmpMatrix = mat4.create();
        }
        createCanvas() {
            this.canvas = document.createElement('canvas');
        }
        releaseCanvas() {
            let canvas = this.canvas;
            this.canvas = null;
            return canvas;
        }
        setCanvasSize(width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.width = width;
            this.height = height;
        }
        initializeContext() {
            this.context = this.canvas.getContext('2d');
        }
        copyTransformTo(targetWindow) {
            vec3.copy(targetWindow.viewLocation, this.viewLocation);
            vec3.copy(targetWindow.centerLocationRate, this.centerLocationRate);
            targetWindow.viewScale = this.viewScale;
            targetWindow.viewRotation = this.viewRotation;
            targetWindow.mirrorX = this.mirrorX;
            targetWindow.mirrorY = this.mirrorY;
            mat4.copy(targetWindow.transformMatrix, this.transformMatrix);
        }
        addViewScale(addScale) {
            this.viewScale *= addScale;
            if (this.viewScale >= this.maxViewScale) {
                this.viewScale = this.maxViewScale;
            }
            if (this.viewScale <= this.minViewScale) {
                this.viewScale = this.minViewScale;
            }
        }
        updateViewMatrix() {
            this.caluclateViewMatrix(this.transformMatrix);
        }
        caluclateViewMatrix(result) {
            mat4.identity(result);
            mat4.translate(result, result, vec3.set(this.tempVec3, this.width * this.centerLocationRate[0], this.height * this.centerLocationRate[0], 0.0));
            mat4.scale(result, result, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0));
            if (this.mirrorX) {
                mat4.scale(result, result, vec3.set(this.tempVec3, -1.0, 1.0, 1.0));
            }
            if (this.mirrorY) {
                mat4.scale(result, result, vec3.set(this.tempVec3, 1.0, -1.0, 1.0));
            }
            mat4.rotateZ(result, result, this.viewRotation * Math.PI / 180.0);
            mat4.translate(result, result, vec3.set(this.tempVec3, -this.viewLocation[0], -this.viewLocation[1], 0.0));
        }
        caluclateGLViewMatrix(result) {
            let wnd = this;
            let viewScale = wnd.viewScale;
            let aspect = wnd.height / wnd.width;
            let real2DViewHalfWidth = wnd.width / 2 / viewScale;
            let real2DViewHalfHeight = wnd.height / 2 / viewScale;
            let viewOffsetX = -(wnd.viewLocation[0]) / real2DViewHalfWidth; // Normalize to fit to ortho matrix range (0.0-1.0)
            let viewOffsetY = (wnd.viewLocation[1]) / real2DViewHalfHeight;
            mat4.identity(this.tmpMatrix);
            mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, aspect, 1.0, 1.0));
            if (wnd.mirrorX) {
                mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, -1.0, 1.0, 1.0));
            }
            if (wnd.mirrorY) {
                mat4.scale(this.tmpMatrix, this.tmpMatrix, vec3.set(this.tempVec3, 1.0, -1.0, 1.0));
            }
            mat4.rotateZ(this.tmpMatrix, this.tmpMatrix, -wnd.viewRotation * Math.PI / 180.0);
            mat4.translate(result, this.tmpMatrix, vec3.set(this.tempVec3, viewOffsetX / aspect, viewOffsetY, 0.0));
        }
        calculateViewUnitMatrix(result) {
            mat4.identity(result);
            mat4.scale(result, result, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0));
            mat4.rotateZ(result, result, this.viewRotation * Math.PI / 180.0);
        }
    }
    ManualTracingTool.CanvasWindow = CanvasWindow;
    let CanvasRenderBlendMode;
    (function (CanvasRenderBlendMode) {
        CanvasRenderBlendMode[CanvasRenderBlendMode["default"] = 0] = "default";
        CanvasRenderBlendMode[CanvasRenderBlendMode["alphaOver"] = 1] = "alphaOver";
        CanvasRenderBlendMode[CanvasRenderBlendMode["add"] = 2] = "add";
        CanvasRenderBlendMode[CanvasRenderBlendMode["color"] = 3] = "color";
        CanvasRenderBlendMode[CanvasRenderBlendMode["luminosity"] = 4] = "luminosity";
    })(CanvasRenderBlendMode = ManualTracingTool.CanvasRenderBlendMode || (ManualTracingTool.CanvasRenderBlendMode = {}));
    let CanvasRenderLineCap;
    (function (CanvasRenderLineCap) {
        CanvasRenderLineCap[CanvasRenderLineCap["butt"] = 0] = "butt";
        CanvasRenderLineCap[CanvasRenderLineCap["round"] = 1] = "round";
        CanvasRenderLineCap[CanvasRenderLineCap["square"] = 2] = "square";
    })(CanvasRenderLineCap = ManualTracingTool.CanvasRenderLineCap || (ManualTracingTool.CanvasRenderLineCap = {}));
    class CanvasRender {
        constructor() {
            this.context = null;
            this.currentTransform = mat4.create();
            this.tempVec3 = vec3.create();
            this.tempMat = mat4.create();
            this.viewWidth = 1.0;
            this.viewHeight = 1.0;
            this.viewScale = 1.0;
            this.viewCenterX = 0.0;
            this.viewCenterY = 0.0;
            this.viewRange = 1.0;
        }
        setContext(canvasWindow) {
            this.context = canvasWindow.context;
            this.viewWidth = canvasWindow.width;
            this.viewHeight = canvasWindow.height;
            this.viewScale = canvasWindow.viewScale;
            this.viewCenterX = canvasWindow.viewLocation[0];
            this.viewCenterY = canvasWindow.viewLocation[1];
            this.viewRange = Math.sqrt(Math.pow(this.viewWidth * 0.5, 2) + Math.pow(this.viewHeight * 0.5, 2)) / this.viewScale;
            canvasWindow.updateViewMatrix();
            this.setContextTransformByWindow(canvasWindow);
        }
        getViewScale() {
            return this.viewScale;
        }
        resetTransform() {
            mat4.identity(this.tempMat);
            this.setContextTransform(this.tempMat);
        }
        setTransform(canvasWindow) {
            canvasWindow.updateViewMatrix();
            this.setContextTransformByWindow(canvasWindow);
        }
        setLocalTransForm(matrix) {
            mat4.multiply(this.tempMat, this.currentTransform, matrix);
            this.setContextTransform(this.tempMat);
        }
        cancelLocalTransForm() {
            this.setContextTransform(this.currentTransform);
        }
        setContextTransformByWindow(canvasWindow) {
            mat4.copy(this.currentTransform, canvasWindow.transformMatrix);
            this.setContextTransform(canvasWindow.transformMatrix);
        }
        setContextTransform(matrix) {
            this.context.setTransform(matrix[0], matrix[1], matrix[4], matrix[5], matrix[12], matrix[13]);
        }
        isInViewRectangle(left, top, right, bottom, range) {
            let centerX = (right + left) * 0.5;
            let centerY = (bottom + top) * 0.5;
            let distance = Math.sqrt(Math.pow(centerX - this.viewCenterX, 2) + Math.pow(centerY - this.viewCenterY, 2));
            return ((distance - range) < this.viewRange);
        }
        setCompositeOperation(operationText) {
            this.context.globalCompositeOperation = operationText;
        }
        clearRect(left, top, width, height) {
            this.context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
            this.context.clearRect(left, top, width, height);
        }
        getColorStyleText(r, g, b, a) {
            return 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a).toFixed(2) + ')';
        }
        getColorStyleTextV(color) {
            return this.getColorStyleText(color[0], color[1], color[2], color[3]);
        }
        setFillColor(r, g, b, a) {
            this.context.fillStyle = this.getColorStyleText(r, g, b, a);
        }
        setFillColorV(color) {
            this.setFillColor(color[0], color[1], color[2], color[3]);
        }
        setFillLinearGradient(x0, y0, x1, y1, color1, color2) {
            var grad = this.context.createLinearGradient(x0, y0, x1, y1);
            grad.addColorStop(0.0, this.getColorStyleTextV(color1));
            grad.addColorStop(1.0, this.getColorStyleTextV(color2));
            this.context.fillStyle = grad;
        }
        setFillRadialGradient(x, y, r1, r2, color1, color2) {
            var grad = this.context.createRadialGradient(x, y, r1, x, y, r2);
            grad.addColorStop(0.0, this.getColorStyleTextV(color1));
            grad.addColorStop(1.0, this.getColorStyleTextV(color2));
            this.context.fillStyle = grad;
        }
        fillRect(left, top, width, height) {
            this.context.fillRect(left, top, width, height);
        }
        setStrokeWidth(width) {
            this.context.lineWidth = width;
        }
        setStrokeColor(r, g, b, a) {
            this.context.strokeStyle = this.getColorStyleText(r, g, b, a);
        }
        setStrokeColorV(color) {
            this.setStrokeColor(color[0], color[1], color[2], color[3]);
        }
        setLineDash(segments) {
            this.context.setLineDash(segments);
        }
        setGlobalAlpha(a) {
            this.context.globalAlpha = a;
        }
        setBlendMode(blendMode) {
            if (blendMode == CanvasRenderBlendMode.default || blendMode == CanvasRenderBlendMode.alphaOver) {
                this.context.globalCompositeOperation = 'source-over';
            }
            else if (blendMode == CanvasRenderBlendMode.add) {
                this.context.globalCompositeOperation = 'lighter';
            }
            else if (blendMode == CanvasRenderBlendMode.luminosity) {
                this.context.globalCompositeOperation = 'luminosity';
            }
            else if (blendMode == CanvasRenderBlendMode.color) {
                this.context.globalCompositeOperation = 'color';
            }
        }
        setLineCap(lineCap) {
            this.context.lineCap = (CanvasRenderLineCap[lineCap]);
        }
        beginPath() {
            this.context.beginPath();
        }
        stroke() {
            this.context.stroke();
        }
        fill() {
            this.context.fill();
        }
        moveTo(x, y) {
            this.context.moveTo(x, y);
        }
        lineTo(x, y) {
            this.context.lineTo(x, y);
        }
        circle(x, y, radius) {
            this.context.arc(x, y, radius, 0.0, Math.PI * 2.0);
        }
        setFontSize(height) {
            this.context.font = height.toFixed(0) + "px 'ＭＳ Ｐゴシック'";
        }
        fillText(text, x, y) {
            this.context.fillText(text, x, y);
        }
        drawLine(x1, y1, x2, y2) {
            this.context.beginPath();
            this.context.moveTo(x1, y1);
            this.context.lineTo(x2, y2);
            this.context.stroke();
        }
        drawRectangle(x, y, width, height) {
            this.context.beginPath();
            this.context.strokeRect(x, y, width, height);
            this.context.stroke();
        }
        drawImage(image, srcX, srcY, srcW, srcH, dstX, detY, dstW, dstH) {
            this.context.drawImage(image, srcX, srcY, srcW, srcH, dstX, detY, dstW, dstH);
        }
        pickColor(outColor, canvasWindow, x, y) {
            let imageData = canvasWindow.context.getImageData(Math.floor(x), Math.floor(y), 1, 1);
            vec4.set(outColor, imageData.data[0] / 255.0, imageData.data[1] / 255.0, imageData.data[2] / 255.0, imageData.data[3] / 255.0);
        }
    }
    ManualTracingTool.CanvasRender = CanvasRender;
})(ManualTracingTool || (ManualTracingTool = {}));
