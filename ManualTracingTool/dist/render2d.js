var ManualTracingTool;
(function (ManualTracingTool) {
    var CanvasWindow = /** @class */ (function () {
        function CanvasWindow() {
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
        CanvasWindow.prototype.createCanvas = function () {
            this.canvas = document.createElement('canvas');
        };
        CanvasWindow.prototype.releaseCanvas = function () {
            var canvas = this.canvas;
            this.canvas = null;
            return canvas;
        };
        CanvasWindow.prototype.setCanvasSize = function (width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.width = width;
            this.height = height;
        };
        CanvasWindow.prototype.initializeContext = function () {
            this.context = this.canvas.getContext('2d');
        };
        CanvasWindow.prototype.copyTransformTo = function (targetWindow) {
            vec3.copy(targetWindow.viewLocation, this.viewLocation);
            vec3.copy(targetWindow.centerLocationRate, this.centerLocationRate);
            targetWindow.viewScale = this.viewScale;
            targetWindow.viewRotation = this.viewRotation;
            targetWindow.mirrorX = this.mirrorX;
            targetWindow.mirrorY = this.mirrorY;
            mat4.copy(targetWindow.transformMatrix, this.transformMatrix);
        };
        CanvasWindow.prototype.addViewScale = function (addScale) {
            this.viewScale *= addScale;
            if (this.viewScale >= this.maxViewScale) {
                this.viewScale = this.maxViewScale;
            }
            if (this.viewScale <= this.minViewScale) {
                this.viewScale = this.minViewScale;
            }
        };
        CanvasWindow.prototype.updateViewMatrix = function () {
            this.caluclateViewMatrix(this.transformMatrix);
        };
        CanvasWindow.prototype.caluclateViewMatrix = function (result) {
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
        };
        CanvasWindow.prototype.caluclateGLViewMatrix = function (result) {
            var wnd = this;
            var viewScale = wnd.viewScale;
            var aspect = wnd.height / wnd.width;
            var real2DViewHalfWidth = wnd.width / 2 / viewScale;
            var real2DViewHalfHeight = wnd.height / 2 / viewScale;
            var viewOffsetX = -(wnd.viewLocation[0]) / real2DViewHalfWidth; // Normalize to fit to ortho matrix range (0.0-1.0)
            var viewOffsetY = (wnd.viewLocation[1]) / real2DViewHalfHeight;
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
        };
        CanvasWindow.prototype.calculateViewUnitMatrix = function (result) {
            mat4.identity(result);
            mat4.scale(result, result, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0));
            mat4.rotateZ(result, result, this.viewRotation * Math.PI / 180.0);
        };
        return CanvasWindow;
    }());
    ManualTracingTool.CanvasWindow = CanvasWindow;
    var CanvasRenderBlendMode;
    (function (CanvasRenderBlendMode) {
        CanvasRenderBlendMode[CanvasRenderBlendMode["default"] = 0] = "default";
        CanvasRenderBlendMode[CanvasRenderBlendMode["alphaOver"] = 1] = "alphaOver";
        CanvasRenderBlendMode[CanvasRenderBlendMode["add"] = 2] = "add";
        CanvasRenderBlendMode[CanvasRenderBlendMode["color"] = 3] = "color";
        CanvasRenderBlendMode[CanvasRenderBlendMode["luminosity"] = 4] = "luminosity";
    })(CanvasRenderBlendMode = ManualTracingTool.CanvasRenderBlendMode || (ManualTracingTool.CanvasRenderBlendMode = {}));
    var CanvasRenderLineCap;
    (function (CanvasRenderLineCap) {
        CanvasRenderLineCap[CanvasRenderLineCap["butt"] = 0] = "butt";
        CanvasRenderLineCap[CanvasRenderLineCap["round"] = 1] = "round";
        CanvasRenderLineCap[CanvasRenderLineCap["square"] = 2] = "square";
    })(CanvasRenderLineCap = ManualTracingTool.CanvasRenderLineCap || (ManualTracingTool.CanvasRenderLineCap = {}));
    var CanvasRender = /** @class */ (function () {
        function CanvasRender() {
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
        CanvasRender.prototype.setContext = function (canvasWindow) {
            this.context = canvasWindow.context;
            this.viewWidth = canvasWindow.width;
            this.viewHeight = canvasWindow.height;
            this.viewScale = canvasWindow.viewScale;
            this.viewCenterX = canvasWindow.viewLocation[0];
            this.viewCenterY = canvasWindow.viewLocation[1];
            this.viewRange = Math.sqrt(Math.pow(this.viewWidth * 0.5, 2) + Math.pow(this.viewHeight * 0.5, 2)) / this.viewScale;
            canvasWindow.updateViewMatrix();
            this.setContextTransformByWindow(canvasWindow);
        };
        CanvasRender.prototype.getViewScale = function () {
            return this.viewScale;
        };
        CanvasRender.prototype.resetTransform = function () {
            mat4.identity(this.tempMat);
            this.setContextTransform(this.tempMat);
        };
        CanvasRender.prototype.setTransform = function (canvasWindow) {
            canvasWindow.updateViewMatrix();
            this.setContextTransformByWindow(canvasWindow);
        };
        CanvasRender.prototype.setLocalTransForm = function (matrix) {
            mat4.multiply(this.tempMat, this.currentTransform, matrix);
            this.setContextTransform(this.tempMat);
        };
        CanvasRender.prototype.cancelLocalTransForm = function () {
            this.setContextTransform(this.currentTransform);
        };
        CanvasRender.prototype.setContextTransformByWindow = function (canvasWindow) {
            mat4.copy(this.currentTransform, canvasWindow.transformMatrix);
            this.setContextTransform(canvasWindow.transformMatrix);
        };
        CanvasRender.prototype.setContextTransform = function (matrix) {
            CanvasRender.setContextTransformToCanvas(this.context, matrix);
        };
        CanvasRender.setContextTransformToCanvas = function (context, matrix) {
            context.setTransform(matrix[0], matrix[1], matrix[4], matrix[5], matrix[12], matrix[13]);
        };
        CanvasRender.prototype.isInViewRectangle = function (left, top, right, bottom, range) {
            var centerX = (right + left) * 0.5;
            var centerY = (bottom + top) * 0.5;
            var distance = Math.sqrt(Math.pow(centerX - this.viewCenterX, 2) + Math.pow(centerY - this.viewCenterY, 2));
            return ((distance - range) < this.viewRange);
        };
        CanvasRender.prototype.setCompositeOperation = function (operationText) {
            this.context.globalCompositeOperation = operationText;
        };
        CanvasRender.prototype.clearRect = function (left, top, width, height) {
            this.context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
            this.context.clearRect(left, top, width, height);
        };
        CanvasRender.prototype.getColorStyleText = function (r, g, b, a) {
            return 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a).toFixed(2) + ')';
        };
        CanvasRender.prototype.getColorStyleTextV = function (color) {
            return this.getColorStyleText(color[0], color[1], color[2], color[3]);
        };
        CanvasRender.prototype.setFillColor = function (r, g, b, a) {
            this.context.fillStyle = this.getColorStyleText(r, g, b, a);
        };
        CanvasRender.prototype.setFillColorV = function (color) {
            this.setFillColor(color[0], color[1], color[2], color[3]);
        };
        CanvasRender.prototype.setFillLinearGradient = function (x0, y0, x1, y1, color1, color2) {
            var grad = this.context.createLinearGradient(x0, y0, x1, y1);
            grad.addColorStop(0.0, this.getColorStyleTextV(color1));
            grad.addColorStop(1.0, this.getColorStyleTextV(color2));
            this.context.fillStyle = grad;
        };
        CanvasRender.prototype.setFillRadialGradient = function (x, y, r1, r2, color1, color2) {
            var grad = this.context.createRadialGradient(x, y, r1, x, y, r2);
            grad.addColorStop(0.0, this.getColorStyleTextV(color1));
            grad.addColorStop(1.0, this.getColorStyleTextV(color2));
            this.context.fillStyle = grad;
        };
        CanvasRender.prototype.fillRect = function (left, top, width, height) {
            this.context.fillRect(left, top, width, height);
        };
        CanvasRender.prototype.setStrokeWidth = function (width) {
            this.context.lineWidth = width;
        };
        CanvasRender.prototype.setStrokeColor = function (r, g, b, a) {
            this.context.strokeStyle = this.getColorStyleText(r, g, b, a);
        };
        CanvasRender.prototype.setStrokeColorV = function (color) {
            this.setStrokeColor(color[0], color[1], color[2], color[3]);
        };
        CanvasRender.prototype.setLineDash = function (segments) {
            this.context.setLineDash(segments);
        };
        CanvasRender.prototype.setGlobalAlpha = function (a) {
            this.context.globalAlpha = a;
        };
        CanvasRender.prototype.setBlendMode = function (blendMode) {
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
        };
        CanvasRender.prototype.setLineCap = function (lineCap) {
            this.context.lineCap = (CanvasRenderLineCap[lineCap]);
        };
        CanvasRender.prototype.beginPath = function () {
            this.context.beginPath();
        };
        CanvasRender.prototype.stroke = function () {
            this.context.stroke();
        };
        CanvasRender.prototype.fill = function () {
            this.context.fill();
        };
        CanvasRender.prototype.moveTo = function (x, y) {
            this.context.moveTo(x, y);
        };
        CanvasRender.prototype.lineTo = function (x, y) {
            this.context.lineTo(x, y);
        };
        CanvasRender.prototype.circle = function (x, y, radius) {
            this.context.arc(x, y, radius, 0.0, Math.PI * 2.0);
        };
        CanvasRender.prototype.setFontSize = function (height) {
            this.context.font = height.toFixed(0) + "px 'ＭＳ Ｐゴシック'";
        };
        CanvasRender.prototype.fillText = function (text, x, y) {
            this.context.fillText(text, x, y);
        };
        CanvasRender.prototype.drawLine = function (x1, y1, x2, y2) {
            this.context.beginPath();
            this.context.moveTo(x1, y1);
            this.context.lineTo(x2, y2);
            this.context.stroke();
        };
        CanvasRender.prototype.drawRectangle = function (x, y, width, height) {
            this.context.beginPath();
            this.context.strokeRect(x, y, width, height);
            this.context.stroke();
        };
        CanvasRender.prototype.drawImage = function (image, srcX, srcY, srcW, srcH, dstX, detY, dstW, dstH) {
            this.context.drawImage(image, srcX, srcY, srcW, srcH, dstX, detY, dstW, dstH);
        };
        CanvasRender.prototype.pickColor = function (outColor, canvasWindow, x, y) {
            var imageData = canvasWindow.context.getImageData(Math.floor(x), Math.floor(y), 1, 1);
            vec4.set(outColor, imageData.data[0] / 255.0, imageData.data[1] / 255.0, imageData.data[2] / 255.0, imageData.data[3] / 255.0);
        };
        return CanvasRender;
    }());
    ManualTracingTool.CanvasRender = CanvasRender;
})(ManualTracingTool || (ManualTracingTool = {}));
