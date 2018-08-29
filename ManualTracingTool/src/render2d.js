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
            this.maxViewScale = 30.0;
            this.minViewScale = 0.1;
            this.transformMatrix = mat4.create();
            this.tempVec3 = vec3.create();
        }
        CanvasWindow.prototype.copyTransformTo = function (targetWindow) {
            vec3.copy(targetWindow.viewLocation, this.viewLocation);
            vec3.copy(targetWindow.centerLocationRate, this.centerLocationRate);
            targetWindow.viewScale = this.viewScale;
            targetWindow.viewRotation = this.viewRotation;
            mat4.copy(targetWindow.transformMatrix, this.transformMatrix);
        };
        CanvasWindow.prototype.addViewScale = function (addScale) {
            this.viewScale += addScale;
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
        CanvasWindow.prototype.caluclateViewMatrix = function (mat) {
            mat4.identity(mat);
            mat4.translate(mat, mat, vec3.set(this.tempVec3, this.width * this.centerLocationRate[0], this.height * this.centerLocationRate[0], 1.0));
            mat4.scale(mat, mat, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0));
            mat4.rotateZ(mat, mat, this.viewRotation * Math.PI / 180.0);
            //mat4.translate(mat, mat, vec3.set(this.tempVec3, -this.width / 2, -this.height / 2, 0.0));
            mat4.translate(mat, mat, vec3.set(this.tempVec3, -this.viewLocation[0], -this.viewLocation[1], 0.0));
        };
        CanvasWindow.prototype.calculateViewUnitMatrix = function (out) {
            mat4.identity(out);
            mat4.scale(out, out, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0));
            mat4.rotateZ(out, out, this.viewRotation * Math.PI / 180.0);
        };
        return CanvasWindow;
    }());
    ManualTracingTool.CanvasWindow = CanvasWindow;
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
            this.viewScale = 1.0;
        }
        CanvasRender.prototype.setContext = function (canvasWindow) {
            this.context = canvasWindow.context;
            this.viewScale = canvasWindow.viewScale;
            canvasWindow.updateViewMatrix();
            this.updateContextTransformByWindow(canvasWindow);
        };
        CanvasRender.prototype.getViewScale = function () {
            return this.viewScale;
        };
        CanvasRender.prototype.setTransform = function (canvasWindow) {
            canvasWindow.updateViewMatrix();
            this.updateContextTransformByWindow(canvasWindow);
        };
        CanvasRender.prototype.setLocalTransForm = function (matrix) {
            mat4.multiply(this.tempMat, this.currentTransform, matrix);
            this.updateContextTransform(this.tempMat);
        };
        CanvasRender.prototype.cancelLocalTransForm = function () {
            this.updateContextTransform(this.currentTransform);
        };
        CanvasRender.prototype.updateContextTransformByWindow = function (canvasWindow) {
            mat4.copy(this.currentTransform, canvasWindow.transformMatrix);
            this.updateContextTransform(canvasWindow.transformMatrix);
        };
        CanvasRender.prototype.updateContextTransform = function (matrix) {
            this.context.setTransform(matrix[0], matrix[1], matrix[4], matrix[5], matrix[12], matrix[13]);
        };
        CanvasRender.prototype.clearRect = function (left, top, width, height) {
            this.context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
            this.context.clearRect(left, top, width, height);
        };
        CanvasRender.prototype.setFillColor = function (r, g, b, a) {
            this.context.fillStyle = 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a).toFixed(2) + ')';
        };
        CanvasRender.prototype.setFillColorV = function (color) {
            this.setFillColor(color[0], color[1], color[2], color[3]);
        };
        CanvasRender.prototype.fillRect = function (left, top, width, height) {
            this.context.fillRect(left, top, width, height);
        };
        CanvasRender.prototype.setStrokeWidth = function (width) {
            this.context.lineWidth = width;
        };
        CanvasRender.prototype.setStrokeColor = function (r, g, b, a) {
            this.context.strokeStyle = 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a).toFixed(2) + ')';
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
        CanvasRender.prototype.setLineCap = function (lineCap) {
            this.context.lineCap = CanvasRenderLineCap[lineCap];
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
        CanvasRender.prototype.drawImage = function (image, srcX, srcY, srcW, srcH, dstX, detY, dstW, dstH) {
            this.context.drawImage(image, srcX, srcY, srcW, srcH, dstX, detY, dstW, dstH);
        };
        return CanvasRender;
    }());
    ManualTracingTool.CanvasRender = CanvasRender;
})(ManualTracingTool || (ManualTracingTool = {}));
