var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var App_Drawing = /** @class */ (function (_super) {
        __extends(App_Drawing, _super);
        function App_Drawing() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.canvasRender = new ManualTracingTool.CanvasRender();
            _this.drawGPURender = new WebGLRender();
            _this.polyLineShader = new PolyLineShader();
            _this.bezierLineShader = new BezierLineShader();
            _this.bezierDistanceLineShader = new BezierDistanceLineShader();
            _this.lineShader = _this.bezierDistanceLineShader;
            //lineShader: GPULineShader = this.polyLineShader;
            _this.posing3DViewRender = new WebGLRender();
            _this.posing3dView = new ManualTracingTool.Posing3DView();
            _this.logic_GPULine = new ManualTracingTool.Logic_GPULine();
            // Resources
            _this.drawStyle = new ManualTracingTool.ToolDrawingStyle();
            _this.systemImage = null;
            _this.subToolImages = new List();
            _this.layerButtonImage = null;
            // Work variable
            _this.chestInvMat4 = mat4.create();
            _this.hipsInvMat4 = mat4.create();
            _this.editOtherLayerLineColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);
            _this.editOtherLayerFillColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);
            _this.tempEditorLinePointColor1 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            _this.tempEditorLinePointColor2 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            _this.layerPickingPositions = [[0.0, 0.0], [0.0, -2.0], [2.0, 0.0], [0.0, 2.0], [-2.0, 0.0]];
            _this.scale = vec3.create();
            _this.eyeLocation = vec3.create();
            _this.lookatLocation = vec3.create();
            _this.upVector = vec3.create();
            _this.modelLocation = vec3.create();
            _this.modelMatrix = mat4.create();
            _this.viewMatrix = mat4.create();
            _this.modelViewMatrix = mat4.create();
            _this.projectionMatrix = mat4.create();
            _this.tmpMatrix = mat4.create();
            _this.operatorCurosrLineDash = [2.0, 2.0];
            _this.operatorCurosrLineDashScaled = [0.0, 0.0];
            _this.operatorCurosrLineDashNone = [];
            // ColorMixer window
            _this.hsv = vec4.create();
            // Palette modal drawing
            _this.colorW = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            _this.colorB = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            return _this;
        }
        App_Drawing.prototype.initializeDrawingDevices = function () {
            this.canvasRender.setContext(this.layerWindow);
            this.canvasRender.setFontSize(18.0);
            if (this.posing3DViewRender.initializeWebGL(this.webglWindow.canvas, true)) {
                alert('３Ｄポージング機能を初期化できませんでした。');
            }
            //this.pickingWindow.initializeContext();
            this.posing3dView.initialize(this.posing3DViewRender, this.webglWindow, null);
            if (this.drawGPURender.initializeWebGL(this.drawGPUWindow.canvas, false)) {
                alert('３Ｄ描画機能を初期化できませんでした。');
            }
            try {
                this.drawGPURender.initializeShader(this.polyLineShader);
                this.drawGPURender.initializeShader(this.bezierLineShader);
                this.drawGPURender.initializeShader(this.bezierDistanceLineShader);
            }
            catch (errorMessage) {
                alert('シェーダの初期化に失敗しました。' + errorMessage);
            }
        };
        // Common drawing methods
        App_Drawing.prototype.clearWindow = function (canvasWindow) {
            this.canvasRender.setContext(canvasWindow);
            this.canvasRender.resetTransform();
            this.canvasRender.clearRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height);
            this.canvasRender.setTransform(canvasWindow);
        };
        App_Drawing.prototype.drawFullWindowImage = function (dstWindow, srcWindow) {
            this.canvasRender.setContext(dstWindow);
            this.canvasRender.resetTransform();
            this.canvasRender.drawImage(srcWindow.canvas, 0, 0, srcWindow.width, srcWindow.height, 0, 0, dstWindow.width, dstWindow.height);
            this.canvasRender.setTransform(dstWindow);
        };
        App_Drawing.prototype.drawButtonBackground = function (layoutArea, isSelected) {
            var dstX = layoutArea.left;
            var dstY = layoutArea.top;
            var scale = 1.0;
            var dstWidth = layoutArea.getWidth() * scale;
            var dstHeight = layoutArea.getHeight() * scale;
            if (isSelected) {
                this.canvasRender.setFillColorV(this.toolDrawEnv.style.selectedButtonColor);
                this.canvasRender.fillRect(dstX, dstY, dstWidth, dstHeight);
            }
        };
        App_Drawing.prototype.drawButtonImage = function (layoutArea) {
            var srcWidth = 64.0;
            var srcHeight = 64.0;
            var srcX = 0.0;
            var srcY = (layoutArea.iconID - 1) * srcHeight;
            var dstX = layoutArea.left;
            var dstY = layoutArea.top;
            var scale = 1.0;
            var dstWidth = layoutArea.getWidth() * scale;
            var dstHeight = layoutArea.getHeight() * scale;
            var srcImage = this.layerButtonImage;
            this.canvasRender.drawImage(srcImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight);
        };
        // Document
        App_Drawing.prototype.drawExportImage = function (canvasWindow) {
        };
        // MainEditorDrawer implementations
        App_Drawing.prototype.drawMouseCursor = function () {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.circle(this.mainWindow.toolMouseEvent.location[0], this.mainWindow.toolMouseEvent.location[1], this.getCurrentViewScaleLineWidth(this.toolContext.mouseCursorRadius));
            this.canvasRender.stroke();
        };
        App_Drawing.prototype.drawMouseCursorCircle = function (radius) {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.circle(this.mainWindow.toolMouseEvent.location[0], this.mainWindow.toolMouseEvent.location[1], radius);
            this.canvasRender.stroke();
        };
        App_Drawing.prototype.drawEditorEditLineStroke = function (line) {
            this.drawEditLineStroke(line);
        };
        App_Drawing.prototype.drawEditorVectorLineStroke = function (line, color, strokeWidthBolding, useAdjustingLocation) {
            this.drawVectorLineStroke(line, color, 1.0, strokeWidthBolding, useAdjustingLocation, false);
        };
        App_Drawing.prototype.drawEditorVectorLinePoints = function (line, color, useAdjustingLocation) {
            this.drawVectorLinePoints(line, color, useAdjustingLocation);
        };
        App_Drawing.prototype.drawEditorVectorLinePoint = function (point, color, useAdjustingLocation) {
            this.drawVectorLinePoint(point, color, useAdjustingLocation);
        };
        App_Drawing.prototype.drawEditorVectorLineSegment = function (line, startIndex, endIndex, useAdjustingLocation) {
            this.drawVectorLineSegment(line, startIndex, endIndex, 1.0, 0.0, useAdjustingLocation);
        };
        // Main window
        App_Drawing.prototype.drawMainWindow = function (canvasWindow, redrawActiveLayerOnly) {
        };
        App_Drawing.prototype.drawForeground = function (viewKeyFrameLayer, documentData, isExporting, isModalToolRunning) {
            var layer = viewKeyFrameLayer.layer;
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                var vectorLayer = layer;
                var geometry = viewKeyFrameLayer.vectorLayerKeyframe.geometry;
                this.drawForeground_VectorLayer(vectorLayer, geometry, documentData, isExporting, isModalToolRunning);
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
                this.drawForeground_ImageFileReferenceLayer(ifrLayer, isModalToolRunning);
            }
        };
        App_Drawing.prototype.drawForeground_VectorLayer = function (layer, geometry, documentData, isExporting, isModalToolRunning) {
            var env = this.toolEnv;
            var useAdjustingLocation = isModalToolRunning;
            var widthRate = documentData.lineWidthBiasRate;
            var lineColor = this.getLineColor(layer, documentData, env, true);
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                if (layer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                    for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                        var line = _c[_b];
                        this.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation, isExporting);
                    }
                }
            }
        };
        App_Drawing.prototype.drawForeground_ImageFileReferenceLayer = function (layer, isModalToolRunning) {
            if (layer.imageResource == null
                || layer.imageResource.image == null
                || layer.imageResource.image.imageData == null) {
                return;
            }
            var image = layer.imageResource.image.imageData;
            var location = (isModalToolRunning ? layer.adjustingLocation : layer.location);
            var rotation = (isModalToolRunning ? layer.adjustingRotation[0] : layer.rotation[0]);
            var scale = (isModalToolRunning ? layer.adjustingScale : layer.scale);
            mat4.identity(this.tempMat4);
            mat4.translate(this.tempMat4, this.tempMat4, location);
            mat4.rotateZ(this.tempMat4, this.tempMat4, rotation);
            mat4.scale(this.tempMat4, this.tempMat4, scale);
            this.canvasRender.setLocalTransForm(this.tempMat4);
            this.canvasRender.setGlobalAlpha(layer.layerColor[3]);
            this.canvasRender.drawImage(image, 0.0, 0.0, image.width, image.height, 0.0, 0.0, image.width, image.height);
            this.canvasRender.cancelLocalTransForm();
            this.canvasRender.setGlobalAlpha(1.0);
        };
        App_Drawing.prototype.drawBackground = function (viewKeyFrameLayer, documentData, isExporting, isModalToolRunning) {
            var layer = viewKeyFrameLayer.layer;
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                var vectorLayer = layer;
                var geometry = viewKeyFrameLayer.vectorLayerKeyframe.geometry;
                this.drawBackground_VectorLayer(vectorLayer, geometry, documentData, isExporting, isModalToolRunning);
            }
        };
        App_Drawing.prototype.drawBackground_VectorLayer = function (layer, geometry, documentData, isExporting, isModalToolRunning) {
            var env = this.toolEnv;
            var useAdjustingLocation = isModalToolRunning;
            var isSelectedLayer = ManualTracingTool.Layer.isSelected(layer);
            var fillColor = this.getFillColor(layer, documentData, env, !isSelectedLayer);
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                var continuousFill = false;
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (layer.fillAreaType != ManualTracingTool.FillAreaTypeID.none) {
                        this.drawVectorLineFill(line, fillColor, useAdjustingLocation, continuousFill);
                        continuousFill = line.continuousFill;
                    }
                }
            }
        };
        App_Drawing.prototype.drawLayerByCanvas = function (viewKeyFrameLayer, documentData, isExporting, isModalToolRunning) {
            var layer = viewKeyFrameLayer.layer;
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                var vectorLayer = layer;
                this.drawVectorLayer(vectorLayer, viewKeyFrameLayer.vectorLayerKeyframe.geometry, documentData, isExporting, isModalToolRunning);
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
                this.drawForeground_ImageFileReferenceLayer(ifrLayer, isModalToolRunning);
            }
            else {
                // No drawing
            }
        };
        App_Drawing.prototype.drawVectorLayer = function (layer, geometry, documentData, isExporting, isModalToolRunning) {
            var context = this.toolContext;
            var env = this.toolEnv;
            var isSelectedLayer = ManualTracingTool.Layer.isSelected(layer);
            var isEditMode = env.isEditMode();
            // drawing parameters
            var widthRate = context.document.lineWidthBiasRate;
            var lineColor = this.getLineColor(layer, documentData, env, true);
            var fillColor = this.getFillColor(layer, documentData, env, true);
            vec4.copy(this.editOtherLayerLineColor, lineColor);
            this.editOtherLayerLineColor[3] *= 0.3;
            if (isEditMode) {
                lineColor = this.editOtherLayerLineColor;
            }
            // drawing geometry lines
            var useAdjustingLocation = isModalToolRunning;
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                var continuousFill = false;
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (layer.fillAreaType != ManualTracingTool.FillAreaTypeID.none) {
                        this.drawVectorLineFill(line, fillColor, useAdjustingLocation, continuousFill);
                        continuousFill = line.continuousFill;
                    }
                }
            }
            for (var _d = 0, _e = geometry.groups; _d < _e.length; _d++) {
                var group = _e[_d];
                if (layer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                    for (var _f = 0, _g = group.lines; _f < _g.length; _f++) {
                        var line = _g[_f];
                        this.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation, isExporting);
                    }
                }
            }
        };
        App_Drawing.prototype.drawVectorLayerForEditMode = function (layer, geometry, documentData, drawStrokes, drawPoints, isModalToolRunning) {
            var context = this.toolContext;
            var env = this.toolEnv;
            var isSelectedLayer = ManualTracingTool.Layer.isSelected(layer);
            // drawing parameters
            var widthRate = context.document.lineWidthBiasRate;
            var lineColor = this.getLineColor(layer, documentData, env, !isSelectedLayer);
            // drawing geometry lines
            var useAdjustingLocation = isModalToolRunning;
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (!isSelectedLayer) {
                        if (layer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                            this.drawVectorLineStroke(line, this.editOtherLayerLineColor, widthRate, 0.0, useAdjustingLocation, false);
                        }
                    }
                    else {
                        if (this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.linePoint) {
                            if (drawStrokes) {
                                this.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation, false);
                            }
                            if (drawPoints) {
                                this.drawVectorLinePoints(line, lineColor, useAdjustingLocation);
                            }
                        }
                        else if (this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.line
                            || this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.lineSegment) {
                            if (drawStrokes) {
                                var color = void 0;
                                if ((line.isSelected && line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.selectedToUnselected)
                                    || line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.unselectedToSelected) {
                                    color = this.drawStyle.selectedVectorLineColor;
                                }
                                else {
                                    color = lineColor;
                                }
                                var lineWidthBolding = (line.isCloseToMouse ? 2.0 : 0.0);
                                this.drawVectorLineStroke(line, color, widthRate, lineWidthBolding, useAdjustingLocation, false);
                            }
                        }
                    }
                }
            }
        };
        App_Drawing.prototype.drawVectorLineStroke = function (line, color, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation, isExporting) {
            if (line.points.length == 0) {
                return;
            }
            if (!isExporting
                && (line.range != 0.0 && !this.canvasRender.isInViewRectangle(line.left, line.top, line.right, line.bottom, line.range))
            //&& this.toolEnv.isShiftKeyPressing() // for clipping test
            ) {
                return;
            }
            this.canvasRender.setStrokeColorV(color);
            this.drawVectorLineSegment(line, 0, line.points.length - 1, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation);
        };
        App_Drawing.prototype.drawVectorLinePoints = function (line, color, useAdjustingLocation) {
            if (line.points.length == 0) {
                return;
            }
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            // make color darker or lighter than original to visible on line color
            ManualTracingTool.ColorLogic.rgbToHSVv(this.tempEditorLinePointColor1, color);
            if (this.tempEditorLinePointColor1[2] > 0.5) {
                this.tempEditorLinePointColor1[2] -= this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            else {
                this.tempEditorLinePointColor1[2] += this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            ManualTracingTool.ColorLogic.hsvToRGBv(this.tempEditorLinePointColor2, this.tempEditorLinePointColor1);
            this.tempEditorLinePointColor2[3] = color[3];
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.drawVectorLinePoint(point, this.tempEditorLinePointColor2, useAdjustingLocation);
            }
        };
        App_Drawing.prototype.lineWidthAdjust = function (width) {
            //return Math.floor(width * 5) / 5;
            return width;
        };
        App_Drawing.prototype.drawVectorLineFill = function (line, color, useAdjustingLocation, isFillContinuing) {
            if (line.points.length <= 1) {
                return;
            }
            if (!isFillContinuing) {
                this.canvasRender.setLineCap(ManualTracingTool.CanvasRenderLineCap.round);
                this.canvasRender.beginPath();
                this.canvasRender.setFillColorV(color);
            }
            var startIndex = 0;
            var endIndex = line.points.length - 1;
            // search first visible point
            var firstIndex = -1;
            for (var i = startIndex; i <= endIndex; i++) {
                var point = line.points[i];
                if (point.modifyFlag != ManualTracingTool.LinePointModifyFlagID.delete) {
                    firstIndex = i;
                    break;
                }
            }
            if (firstIndex == -1) {
                return;
            }
            // set first location
            var firstPoint = line.points[firstIndex];
            var firstLocation = (useAdjustingLocation ? firstPoint.adjustingLocation : firstPoint.location);
            if (isFillContinuing) {
                this.canvasRender.lineTo(firstLocation[0], firstLocation[1]);
            }
            else {
                this.canvasRender.moveTo(firstLocation[0], firstLocation[1]);
            }
            var currentLineWidth = this.lineWidthAdjust(firstPoint.lineWidth);
            this.canvasRender.setStrokeWidth(currentLineWidth);
            for (var i = 1; i < line.points.length; i++) {
                var point = line.points[i];
                if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.delete) {
                    continue;
                }
                var location_1 = (useAdjustingLocation ? point.adjustingLocation : point.location);
                this.canvasRender.lineTo(location_1[0], location_1[1]);
            }
            if (!line.continuousFill) {
                this.canvasRender.fill();
            }
        };
        App_Drawing.prototype.drawVectorLineSegment = function (line, startIndex, endIndex, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation) {
            if (line.points.length < 2) {
                return;
            }
            //line.points[0].lengthFrom = 0.0;
            //line.points[0].lengthTo = 0.5;
            //line.points[line.points.length - 2].lineWidth = 2.3;
            //line.points[line.points.length - 2].lengthFrom = 0.3;
            //line.points[line.points.length - 2].lengthTo = 0.6;
            this.canvasRender.setLineCap(ManualTracingTool.CanvasRenderLineCap.round);
            var firstPoint = line.points[startIndex];
            var currentLineWidth = -1.0;
            var strokeStarted = false;
            var drawingRemainging = false;
            for (var pointIndex = startIndex; pointIndex < endIndex;) {
                var fromPoint = line.points[pointIndex];
                var fromLocation = (useAdjustingLocation ? fromPoint.adjustingLocation : fromPoint.location);
                var toPoint = line.points[pointIndex + 1];
                var toLocation = (useAdjustingLocation ? toPoint.adjustingLocation : toPoint.location);
                var lineWidth = (useAdjustingLocation ? fromPoint.adjustingLineWidth : fromPoint.lineWidth);
                var isVisibleWidth = (lineWidth > 0.0);
                //let isVisibleSegment = (fromPoint.lengthFrom != 0.0 || fromPoint.lengthTo != 0.0);
                var lengthFrom = (useAdjustingLocation ? fromPoint.adjustingLengthFrom : 1.0);
                var lengthTo = (useAdjustingLocation ? fromPoint.adjustingLengthTo : 0.0);
                if (lineWidth != currentLineWidth) {
                    if (drawingRemainging) {
                        this.canvasRender.stroke();
                        strokeStarted = false;
                        drawingRemainging = false;
                    }
                    this.canvasRender.setStrokeWidth(lineWidth * strokeWidthBiasRate + this.getCurrentViewScaleLineWidth(strokeWidthBolding));
                    currentLineWidth = lineWidth;
                }
                if (lengthFrom == 1.0) {
                    // draw segment's full length
                    if (!strokeStarted) {
                        this.canvasRender.beginPath();
                        this.canvasRender.moveTo(fromLocation[0], fromLocation[1]);
                    }
                    this.canvasRender.lineTo(toLocation[0], toLocation[1]);
                    strokeStarted = true;
                    drawingRemainging = true;
                }
                else {
                    // draw segment's from-side part
                    if (lengthFrom > 0.0) {
                        if (!strokeStarted) {
                            this.canvasRender.beginPath();
                            this.canvasRender.moveTo(fromLocation[0], fromLocation[1]);
                        }
                        vec3.lerp(this.toLocation, fromLocation, toLocation, lengthFrom);
                        this.canvasRender.lineTo(this.toLocation[0], this.toLocation[1]);
                        this.canvasRender.stroke();
                        strokeStarted = false;
                        drawingRemainging = false;
                    }
                    // draw segment's to-side part
                    if (lengthTo > 0.0 && lengthTo < 1.0) {
                        if (drawingRemainging) {
                            this.canvasRender.stroke();
                        }
                        vec3.lerp(this.fromLocation, fromLocation, toLocation, lengthTo);
                        this.canvasRender.beginPath();
                        this.canvasRender.moveTo(this.fromLocation[0], this.fromLocation[1]);
                        this.canvasRender.lineTo(toLocation[0], toLocation[1]);
                        strokeStarted = true;
                        drawingRemainging = true;
                    }
                }
                pointIndex++;
            }
            if (drawingRemainging) {
                this.canvasRender.stroke();
            }
        };
        App_Drawing.prototype.drawVectorLinePoint = function (point, color, useAdjustingLocation) {
            var viewScale = this.canvasRender.getViewScale();
            this.canvasRender.beginPath();
            var radius = this.drawStyle.generalLinePointRadius / viewScale;
            if (point.isSelected) {
                radius = this.drawStyle.selectedLinePointRadius / viewScale;
                this.canvasRender.setStrokeColorV(this.drawStyle.selectedVectorLineColor);
                this.canvasRender.setFillColorV(this.drawStyle.selectedVectorLineColor);
            }
            else {
                this.canvasRender.setStrokeColorV(color);
                this.canvasRender.setFillColorV(color);
            }
            if (useAdjustingLocation) {
                this.canvasRender.circle(point.adjustingLocation[0], point.adjustingLocation[1], radius);
            }
            else {
                this.canvasRender.circle(point.location[0], point.location[1], radius);
            }
            this.canvasRender.fill();
        };
        App_Drawing.prototype.drawEditLineStroke = function (line) {
            this.drawVectorLineStroke(line, this.drawStyle.editingLineColor, 1.0, 2.0, false, false);
        };
        App_Drawing.prototype.drawEditLinePoints = function (canvasWindow, line, color) {
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.setStrokeColorV(color);
            this.canvasRender.setFillColorV(color);
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.drawVectorLinePoint(point, color, false);
            }
        };
        App_Drawing.prototype.getLineColor = function (layer, documentData, env, hideWhenEditMode) {
            var color;
            if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.layerColor) {
                color = layer.layerColor;
            }
            else if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.paletteColor) {
                var paletteColor = documentData.paletteColors[layer.line_PaletteColorIndex];
                color = paletteColor.color;
            }
            else {
                color = layer.layerColor;
            }
            if (hideWhenEditMode && env.isEditMode()) {
                vec4.copy(this.editOtherLayerLineColor, color);
                this.editOtherLayerLineColor[3] *= env.drawStyle.editModeOtherLayerAlphaAdjustRate;
                color = this.editOtherLayerLineColor;
            }
            return color;
        };
        App_Drawing.prototype.getFillColor = function (layer, documentData, env, hideWhenEditMode) {
            var color;
            if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.fillColor) {
                color = layer.fillColor;
            }
            else if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.paletteColor) {
                var paletteColor = documentData.paletteColors[layer.fill_PaletteColorIndex];
                color = paletteColor.color;
            }
            else {
                color = layer.fillColor;
            }
            if (hideWhenEditMode && env.isEditMode()) {
                vec4.copy(this.editOtherLayerLineColor, color);
                this.editOtherLayerLineColor[3] *= env.drawStyle.editModeOtherLayerAlphaAdjustRate;
                color = this.editOtherLayerLineColor;
            }
            return color;
        };
        App_Drawing.prototype.getCurrentViewScaleLineWidth = function (width) {
            return width / this.canvasRender.getViewScale();
        };
        App_Drawing.prototype.getViewScaledSize = function (width) {
            return width / this.canvasRender.getViewScale();
        };
        App_Drawing.prototype.pickLayer = function (canvasWindow, viewKeyframe, pickLocationX, pickLocationY) {
            var documentData = this.toolContext.document;
            var pickedLayer = null;
            for (var _i = 0, _a = viewKeyframe.layers; _i < _a.length; _i++) {
                var viewKeyframeLayer = _a[_i];
                var layer = viewKeyframeLayer.layer;
                if (!ManualTracingTool.Layer.isVisible(layer) || !ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                    continue;
                }
                var vectorLayer = layer;
                this.clearWindow(canvasWindow);
                this.canvasRender.setContext(canvasWindow);
                this.drawVectorLayer(vectorLayer, viewKeyframeLayer.vectorLayerKeyframe.geometry, documentData, false, false);
                this.canvasRender.pickColor(this.tempColor4, canvasWindow, pickLocationX, pickLocationY);
                if (this.tempColor4[3] > 0.0) {
                    pickedLayer = layer;
                    break;
                }
            }
            this.drawMainWindow(this.mainWindow, false);
            return pickedLayer;
        };
        App_Drawing.prototype.drawOperatorCursor = function () {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.operatorCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            var viewScale = this.getViewScaledSize(1.0);
            this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
            this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
            this.canvasRender.setLineDash(this.operatorCurosrLineDashScaled);
            this.canvasRender.circle(this.toolContext.operatorCursor.location[0], this.toolContext.operatorCursor.location[1], this.toolContext.operatorCursor.radius * viewScale);
            this.canvasRender.stroke();
            var centerX = this.toolContext.operatorCursor.location[0];
            var centerY = this.toolContext.operatorCursor.location[1];
            var clossBeginPosition = this.toolContext.operatorCursor.radius * viewScale * 1.5;
            var clossEndPosition = this.toolContext.operatorCursor.radius * viewScale * 0.5;
            this.canvasRender.drawLine(centerX - clossBeginPosition, centerY, centerX - clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX + clossBeginPosition, centerY, centerX + clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX, centerY - clossBeginPosition, centerX, centerY - clossEndPosition);
            this.canvasRender.drawLine(centerX, centerY + clossBeginPosition, centerX, centerY + clossEndPosition);
            this.canvasRender.setLineDash(this.operatorCurosrLineDashNone);
        };
        // Rendering
        App_Drawing.prototype.renderClearBuffer = function (wnd) {
            var render = this.drawGPURender;
            render.setViewport(0.0, 0.0, wnd.width, wnd.height);
            render.setDepthTest(true);
            render.setCulling(true);
            render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);
        };
        App_Drawing.prototype.renderForeground_VectorLayer = function (wnd, viewKeyFrameLayer, documentData, useAdjustingLocation) {
            var env = this.toolEnv;
            var render = this.drawGPURender;
            var shader = this.lineShader;
            var keyframe = viewKeyFrameLayer.vectorLayerKeyframe;
            var layer = viewKeyFrameLayer.layer;
            render.setViewport(0.0, 0.0, wnd.width, wnd.height);
            // Calculate camera matrix
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 1.0, 0.0);
            vec3.set(this.eyeLocation, 0.0, 0.0, 1.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            var aspect = wnd.height / wnd.width;
            var orthoWidth = wnd.width / 2 / wnd.viewScale * aspect; // TODO: 計算が怪しい（なぜか縦横両方に同じ値を掛けないと合わない）ので後で検討する
            mat4.ortho(this.projectionMatrix, -orthoWidth, orthoWidth, orthoWidth, -orthoWidth, 0.1, 1.0);
            wnd.caluclateGLViewMatrix(this.tmpMatrix);
            mat4.multiply(this.projectionMatrix, this.tmpMatrix, this.projectionMatrix);
            render.setDepthTest(false);
            render.setCulling(false);
            render.setShader(shader);
            // Set shader parameters
            vec3.set(this.modelLocation, 0.0, 0.0, 0.0);
            mat4.identity(this.modelMatrix);
            mat4.translate(this.modelMatrix, this.modelMatrix, this.modelLocation);
            mat4.multiply(this.modelViewMatrix, this.viewMatrix, this.modelMatrix);
            shader.setModelViewMatrix(this.modelViewMatrix);
            shader.setProjectionMatrix(this.projectionMatrix);
            var lineColor = this.getLineColor(layer, documentData, env, false);
            //if (env.isEditMode()) {
            //    vec4.copy(this.editOtherLayerLineColor, lineColor);
            //    this.editOtherLayerLineColor[3] *= 0.3;
            //    lineColor = this.editOtherLayerLineColor;
            //}
            for (var _i = 0, _a = keyframe.geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                // Calculate line point buffer data
                if (!group.buffer.isStored) {
                    console.log("Calculate line point buffer data");
                    this.logic_GPULine.copyGroupPointDataToBuffer(group, documentData.lineWidthBiasRate, useAdjustingLocation);
                    var vertexUnitSize = shader.getVertexUnitSize();
                    var vertexCount = shader.getVertexCount(group.buffer.pointCount, group.buffer.lines.length); // 本当は辺の数だけでよいので若干無駄は生じるが、計算を簡単にするためこれでよいことにする
                    this.logic_GPULine.allocateBuffer(group.buffer, vertexCount, vertexUnitSize, render.gl);
                    shader.calculateBufferData(group.buffer, this.logic_GPULine);
                    if (group.buffer.usedDataArraySize > 0) {
                        this.logic_GPULine.bufferData(group.buffer, render.gl);
                    }
                }
                // Draw lines
                if (group.buffer.isStored) {
                    this.lineShader.setBuffers(group.buffer.buffer, lineColor);
                    var drawCount = this.lineShader.getDrawArrayTryanglesCount(group.buffer.usedDataArraySize);
                    render.drawArrayTryangles(drawCount);
                }
            }
        };
        // WebGL window
        App_Drawing.prototype.drawPosing3DView = function (webglWindow, layerWindowItems, mainWindow, pickingWindow) {
            var env = this.toolEnv;
            this.posing3DViewRender.setViewport(0.0, 0.0, webglWindow.width, webglWindow.height);
            this.posing3dView.clear(env);
            //mainWindow.copyTransformTo(pickingWindow);
            mainWindow.copyTransformTo(webglWindow);
            for (var _i = 0, layerWindowItems_1 = layerWindowItems; _i < layerWindowItems_1.length; _i++) {
                var item = layerWindowItems_1[_i];
                if (item.layer.type != ManualTracingTool.LayerTypeID.posingLayer) {
                    continue;
                }
                var posingLayer = item.layer;
                this.posing3dView.prepareDrawingStructures(posingLayer);
            }
            if (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing) {
                var posingLayer = env.currentPosingLayer;
                // this.posing3dView.prepareDrawingStructures(posingLayer);
                //this.posing3dView.drawPickingImage(posingLayer, env);
                //pickingWindow.context.clearRect(0, 0, pickingWindow.width, pickingWindow.height);
                //pickingWindow.context.drawImage(webglWindow.canvas, 0, 0, webglWindow.width, webglWindow.height);
                //this.posing3dView.clear(env);
                this.posing3dView.drawManipulaters(posingLayer, env);
            }
            for (var index = layerWindowItems.length - 1; index >= 0; index--) {
                var item = layerWindowItems[index];
                if (item.layer.type != ManualTracingTool.LayerTypeID.posingLayer) {
                    continue;
                }
                var posingLayer = item.layer;
                //this.posing3dView.prepareDrawingStructures(posingLayer);
                this.posing3dView.drawPosingModel(posingLayer, env);
            }
        };
        // Layer window
        App_Drawing.prototype.layerWindow_CaluculateLayout = function (wnd) {
            // layer item buttons
            wnd.layerWindowLayoutArea.copyRectangle(wnd);
            wnd.layerWindowLayoutArea.bottom = wnd.height - 1.0;
            this.layerWindow_CaluculateLayout_CommandButtons(wnd, wnd.layerWindowLayoutArea);
            if (wnd.layerWindowCommandButtons.length > 0) {
                var lastButton = wnd.layerWindowCommandButtons[wnd.layerWindowCommandButtons.length - 1];
                wnd.layerWindowLayoutArea.top = lastButton.getHeight() + 1.0; // lastButton.bottom + 1.0;
            }
            // layer items
            this.layerWindow_CaluculateLayout_LayerWindowItem(wnd, wnd.layerWindowLayoutArea);
        };
        App_Drawing.prototype.layerWindow_CaluculateLayout_CommandButtons = function (wnd, layoutArea) {
            var x = layoutArea.left;
            var y = wnd.viewLocation[1]; // layoutArea.top;
            var unitWidth = wnd.layerItemButtonWidth * wnd.layerItemButtonScale;
            var unitHeight = wnd.layerItemButtonHeight * wnd.layerItemButtonScale;
            wnd.layerCommandButtonButtom = unitHeight + 1.0;
            for (var _i = 0, _a = wnd.layerWindowCommandButtons; _i < _a.length; _i++) {
                var button = _a[_i];
                button.left = x;
                button.right = x + unitWidth - 1;
                button.top = y;
                button.bottom = y + unitHeight - 1;
                x += unitWidth;
                wnd.layerItemButtonButtom = button.bottom + 1.0;
            }
        };
        App_Drawing.prototype.layerWindow_CaluculateLayout_LayerWindowItem = function (wnd, layoutArea) {
            var currentY = layoutArea.top;
            var itemHeight = wnd.layerItemHeight;
            var margine = itemHeight * 0.1;
            var iconWidth = (itemHeight - margine * 2);
            var textLeftMargin = itemHeight * 0.3;
            for (var _i = 0, _a = wnd.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.left = 0.0;
                item.top = currentY;
                item.right = wnd.width - 1;
                item.bottom = currentY + itemHeight - 1;
                item.marginLeft = margine;
                item.marginTop = margine;
                item.marginRight = margine;
                item.marginBottom = margine;
                item.visibilityIconWidth = iconWidth;
                item.textLeft = item.left + margine + iconWidth + textLeftMargin;
                currentY += itemHeight;
            }
            wnd.layerItemsBottom = currentY;
        };
        App_Drawing.prototype.drawLayerWindow = function (wnd) {
            this.canvasRender.setContext(wnd);
            this.drawLayerWindow_LayerItems(wnd);
            this.drawLayerWindow_LayerWindowButtons(wnd);
        };
        App_Drawing.prototype.drawLayerWindow_LayerWindowButtons = function (wnd) {
            this.layerWindow_CaluculateLayout_CommandButtons(wnd, wnd.layerWindowLayoutArea);
            if (wnd.layerWindowCommandButtons.length > 0) {
                var button = wnd.layerWindowCommandButtons[0];
                this.canvasRender.setFillColorV(this.drawStyle.layerWindowBackgroundColor);
                this.canvasRender.fillRect(0.0, button.top, wnd.width - 1, button.getHeight());
            }
            for (var _i = 0, _a = wnd.layerWindowCommandButtons; _i < _a.length; _i++) {
                var button = _a[_i];
                this.drawButtonImage(button);
            }
        };
        App_Drawing.prototype.drawLayerWindow_LayerItems = function (wnd) {
            for (var _i = 0, _a = wnd.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                this.drawLayerWindowItem(item, wnd.layerItemFontSize);
            }
        };
        App_Drawing.prototype.drawLayerWindowItem = function (item, fontSize) {
            var layer = item.layer;
            var left = item.left;
            var top = item.top;
            var bottom = item.bottom;
            var itemWidth = item.getWidth();
            var itemHeight = item.getHeight();
            var bottomMargin = itemHeight * 0.3;
            var depthOffset = 10.0 * item.hierarchyDepth;
            if (ManualTracingTool.Layer.isSelected(layer) && layer == this.toolContext.currentLayer) {
                this.canvasRender.setFillColorV(this.drawStyle.layerWindowItemActiveLayerColor);
            }
            else if (ManualTracingTool.Layer.isSelected(layer)) {
                this.canvasRender.setFillColorV(this.drawStyle.layerWindowItemSelectedColor);
            }
            else {
                this.canvasRender.setFillColorV(this.drawStyle.layerWindowBackgroundColor);
            }
            this.canvasRender.fillRect(left, top, itemWidth, itemHeight);
            // Visible/Unvisible icon
            var srcImage = this.systemImage.image;
            var iconIndex = (ManualTracingTool.Layer.isVisible(item.layer) ? 0.0 : 1.0);
            var srcWidth = srcImage.width * 0.125;
            var srcHeight = srcImage.height * 0.125;
            var srcX = srcWidth * iconIndex;
            var srcY = srcImage.height * 0.25;
            var dstX = item.marginLeft;
            var dstY = top + item.marginTop;
            var dstWidth = item.visibilityIconWidth;
            var dstHeigh = item.visibilityIconWidth;
            this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeigh);
            // Text
            this.canvasRender.setFontSize(fontSize);
            this.canvasRender.setFillColor(0.0, 0.0, 0.0, 1.0);
            this.canvasRender.fillText(layer.name, item.textLeft + depthOffset, bottom - bottomMargin);
        };
        // Timeline window
        App_Drawing.prototype.drawTimeLineWindow_CommandButtons = function (wnd, animationPlaying) {
            // Play / Stop
            {
                var srcX = 0;
                var srcY = 196;
                var srcW = 128;
                var srcH = 128;
                var dstW = 45;
                var dstH = 45;
                var dstX = wnd.getTimeLineLeft() / 2 - dstW / 2 + 1;
                var dstY = wnd.height / 2 - dstH / 2 + 1;
                if (animationPlaying) {
                    srcX = 128;
                }
                this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
            }
        };
        App_Drawing.prototype.drawTimeLineWindow_TimeLine = function (wnd, documentData, viewKeyframes, currentVectorLayer) {
            var aniSetting = documentData.animationSettingData;
            var left = wnd.getTimeLineLeft();
            var right = wnd.getTimeLineRight();
            var bottom = wnd.height;
            var frameUnitWidth = wnd.getFrameUnitWidth(aniSetting);
            var frameNumberHeight = 16.0;
            var frameLineBottom = wnd.height - 1.0 - frameNumberHeight;
            var frameLineHeight = 10.0;
            var secondFrameLineHeight = 30.0;
            // Current frame
            var currentFrameX = left - aniSetting.timeLineWindowViewLocationX + aniSetting.currentTimeFrame * frameUnitWidth;
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setFillColorV(this.drawStyle.timeLineCurrentFrameColor);
            this.canvasRender.fillRect(currentFrameX, 0.0, frameUnitWidth, bottom);
            //aniSetting.maxFrame = 60;
            //aniSetting.loopStartFrame = 10;
            //aniSetting.loopEndFrame = 24;
            // Document keyframes
            var minFrame = wnd.getFrameByLocation(left, aniSetting);
            if (minFrame < 0) {
                minFrame = 0;
            }
            var maxFrame = wnd.getFrameByLocation(right, aniSetting);
            if (maxFrame > aniSetting.maxFrame) {
                maxFrame = aniSetting.maxFrame;
            }
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setFillColorV(this.drawStyle.timeLineKeyFrameColor);
            for (var _i = 0, viewKeyframes_1 = viewKeyframes; _i < viewKeyframes_1.length; _i++) {
                var viewKeyframe = viewKeyframes_1[_i];
                var frame = viewKeyframe.frame;
                if (frame < minFrame) {
                    continue;
                }
                if (frame > maxFrame) {
                    break;
                }
                var frameX = wnd.getFrameLocation(frame, aniSetting);
                this.canvasRender.fillRect(frameX, 0.0, frameUnitWidth - 1.0, frameLineBottom);
            }
            // Loop part
            this.canvasRender.setFillColorV(this.drawStyle.timeLineOutOfLoopingColor);
            {
                var frameX = wnd.getFrameLocation(aniSetting.loopStartFrame, aniSetting);
                if (frameX > left) {
                    this.canvasRender.fillRect(left, 0.0, frameX - left, bottom);
                }
            }
            {
                var frameX = wnd.getFrameLocation(aniSetting.loopEndFrame, aniSetting);
                if (frameX < right) {
                    this.canvasRender.fillRect(frameX, 0.0, right - frameX, bottom);
                }
            }
            // Layer keyframes
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setFillColorV(this.drawStyle.timeLineLayerKeyFrameColor);
            if (currentVectorLayer != null) {
                var viewKeyFrame = ManualTracingTool.ViewKeyframe.findViewKeyframe(viewKeyframes, aniSetting.currentTimeFrame);
                var layerIndex = -1;
                if (viewKeyFrame != null) {
                    layerIndex = ManualTracingTool.ViewKeyframe.findViewKeyframeLayerIndex(viewKeyFrame, currentVectorLayer);
                }
                if (layerIndex != -1) {
                    for (var _a = 0, viewKeyframes_2 = viewKeyframes; _a < viewKeyframes_2.length; _a++) {
                        var viewKeyframe = viewKeyframes_2[_a];
                        var frame = viewKeyframe.frame;
                        if (frame < minFrame) {
                            continue;
                        }
                        if (frame > maxFrame) {
                            break;
                        }
                        var viewKeyFrameLayer = viewKeyframe.layers[layerIndex];
                        if (viewKeyFrameLayer.vectorLayerKeyframe.frame == frame) {
                            var frameX = wnd.getFrameLocation(frame, aniSetting);
                            this.canvasRender.fillRect(frameX + 2.0, 0.0, frameUnitWidth - 5.0, frameLineBottom);
                        }
                    }
                }
            }
            // Left panel
            this.canvasRender.setGlobalAlpha(1.0);
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setStrokeColorV(this.drawStyle.timeLineUnitFrameColor);
            this.canvasRender.drawLine(left, 0.0, left, wnd.height);
            // Frame measure
            {
                var x = left;
                for (var frame = minFrame; frame <= maxFrame; frame++) {
                    if (frame % aniSetting.animationFrameParSecond == 0 || frame == maxFrame) {
                        this.canvasRender.drawLine(x, frameLineBottom - secondFrameLineHeight, x, frameLineBottom);
                    }
                    this.canvasRender.drawLine(x, frameLineBottom - frameLineHeight, x, frameLineBottom);
                    x += frameUnitWidth;
                }
            }
            this.canvasRender.drawLine(left, frameLineBottom, right, frameLineBottom);
        };
        // PaletteSelector window
        App_Drawing.prototype.paletteSelector_CaluculateLayout = function () {
            this.paletteSelector_CaluculateLayout_CommandButtons();
            this.paletteSelector_CaluculateLayout_PaletteItems();
        };
        App_Drawing.prototype.paletteSelector_CaluculateLayout_CommandButtons = function () {
            var wnd = this.paletteSelectorWindow;
            var context = this.toolContext;
            var env = this.toolEnv;
            var x = 0.0;
            var y = 0.0;
            var unitWidth = wnd.buttonWidth * wnd.buttonScale;
            var unitHeight = wnd.buttonHeight * wnd.buttonScale;
            for (var _i = 0, _a = wnd.commandButtonAreas; _i < _a.length; _i++) {
                var layoutArea = _a[_i];
                layoutArea.left = x;
                layoutArea.top = y;
                layoutArea.right = x + unitWidth - 1;
                layoutArea.bottom = y + unitHeight - 1;
                x += unitWidth;
            }
            wnd.commandButtonsBottom = y + unitHeight + wnd.buttonBottomMargin;
        };
        App_Drawing.prototype.paletteSelector_CaluculateLayout_PaletteItems = function () {
            var wnd = this.paletteSelectorWindow;
            var context = this.toolContext;
            var env = this.toolEnv;
            var x = wnd.leftMargin;
            var y = wnd.commandButtonsBottom;
            var itemWidth = wnd.itemWidth * wnd.itemScale;
            var itemHeight = wnd.itemHeight * wnd.itemScale;
            var viewWidth = wnd.width;
            wnd.itemAreas = new List();
            for (var paletteColorIndex = 0; paletteColorIndex < ManualTracingTool.DocumentData.maxPaletteColors; paletteColorIndex++) {
                var layoutArea = new ManualTracingTool.RectangleLayoutArea();
                layoutArea.index = paletteColorIndex;
                layoutArea.left = x;
                layoutArea.top = y;
                layoutArea.right = x + itemWidth + wnd.itemRightMargin - 1;
                layoutArea.bottom = y + itemHeight + wnd.itemBottomMargin - 1;
                wnd.itemAreas.push(layoutArea);
                x += itemWidth + wnd.itemRightMargin;
                if (x + itemWidth >= viewWidth - wnd.rightMargin) {
                    x = wnd.leftMargin;
                    y += itemHeight + wnd.itemBottomMargin;
                }
            }
        };
        App_Drawing.prototype.drawPaletteSelectorWindow_CommandButtons = function (wnd) {
            for (var _i = 0, _a = wnd.commandButtonAreas; _i < _a.length; _i++) {
                var layoutArea = _a[_i];
                var isSelected = (wnd.currentTargetID == layoutArea.index);
                this.drawButtonBackground(layoutArea, isSelected);
                this.drawButtonImage(layoutArea);
            }
        };
        App_Drawing.prototype.drawPaletteSelectorWindow_PaletteItems = function (wnd, documentData, currentVectorLayer) {
            this.canvasRender.setContext(wnd);
            var viewWidth = wnd.width;
            var currentPaletteColorIndex = -1;
            if (currentVectorLayer != null) {
                if (wnd.currentTargetID == ManualTracingTool.PaletteSelectorWindowButtonID.lineColor) {
                    currentPaletteColorIndex = currentVectorLayer.line_PaletteColorIndex;
                }
                else if (wnd.currentTargetID == ManualTracingTool.PaletteSelectorWindowButtonID.fillColor) {
                    currentPaletteColorIndex = currentVectorLayer.fill_PaletteColorIndex;
                }
            }
            for (var _i = 0, _a = wnd.itemAreas; _i < _a.length; _i++) {
                var layoutArea = _a[_i];
                var paletteColorIndex = layoutArea.index;
                if (paletteColorIndex > documentData.paletteColors.length) {
                    break;
                }
                var x = layoutArea.left;
                var y = layoutArea.top;
                var itemWidth = layoutArea.getWidth() - wnd.itemRightMargin;
                var itemHeight = layoutArea.getHeight() - wnd.itemBottomMargin;
                var paletteColor = documentData.paletteColors[paletteColorIndex];
                this.canvasRender.setFillColorV(paletteColor.color);
                this.canvasRender.setStrokeColorV(this.drawStyle.paletteSelectorItemEdgeColor);
                this.canvasRender.fillRect(x + 0.5, y + 0.5, itemWidth, itemHeight);
                this.canvasRender.setStrokeWidth(1.0);
                this.canvasRender.drawRectangle(x + 0.5, y + 0.5, itemWidth, itemHeight);
                if (paletteColorIndex == currentPaletteColorIndex) {
                    this.canvasRender.setStrokeColorV(this.drawStyle.paletteSelectorItemSelectedColor);
                    this.canvasRender.setStrokeWidth(2.5);
                    this.canvasRender.drawRectangle(x + 0.5 - 2.0, y + 0.5 - 2.0, itemWidth + 4.0, itemHeight + 4.0);
                }
            }
        };
        App_Drawing.prototype.drawColorMixerWindow_SetInputControls = function () {
            var wnd = this.paletteSelectorWindow;
            var context = this.toolContext;
            var env = this.toolEnv;
            var documentData = context.document;
            var color = this.getPaletteSelectorWindow_CurrentColor();
            if (color != null) {
                this.setColorMixerValue(this.ID.colorMixer_red, color[0]);
                this.setColorMixerValue(this.ID.colorMixer_green, color[1]);
                this.setColorMixerValue(this.ID.colorMixer_blue, color[2]);
                this.setColorMixerValue(this.ID.colorMixer_alpha, color[3]);
                ManualTracingTool.ColorLogic.rgbToHSVv(this.hsv, color);
                this.setColorMixerValue(this.ID.colorMixer_hue, this.hsv[0]);
                this.setColorMixerValue(this.ID.colorMixer_sat, this.hsv[1]);
                this.setColorMixerValue(this.ID.colorMixer_val, this.hsv[2]);
            }
            else {
                this.setColorMixerValue(this.ID.colorMixer_red, 0.0);
                this.setColorMixerValue(this.ID.colorMixer_green, 0.0);
                this.setColorMixerValue(this.ID.colorMixer_blue, 0.0);
                this.setColorMixerValue(this.ID.colorMixer_alpha, 0.0);
                this.setColorMixerValue(this.ID.colorMixer_hue, 0.0);
                this.setColorMixerValue(this.ID.colorMixer_sat, 0.0);
                this.setColorMixerValue(this.ID.colorMixer_val, 0.0);
            }
        };
        App_Drawing.prototype.drawPaletteColorMixer = function (wnd) {
            var width = wnd.width;
            var height = wnd.height;
            var left = 0.0;
            var top = 0.0;
            var right = width - 1.0;
            var bottom = height - 1.0;
            //let minRadius = 10.0;
            //let maxRadius = width * 1.0;
            this.canvasRender.setContext(wnd);
            this.canvasRender.setBlendMode(ManualTracingTool.CanvasRenderBlendMode.default);
            this.canvasRender.setFillColorV(this.colorW);
            this.canvasRender.fillRect(0.0, 0.0, width, height);
            //this.canvasRender.setBlendMode(CanvasRenderBlendMode.add);
            //this.canvasRender.setFillRadialGradient(left, top, minRadius, maxRadius, this.color11, this.color12);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);
            //this.canvasRender.setFillRadialGradient(right, top, minRadius, maxRadius, this.color21, this.color22);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);
            //this.canvasRender.setFillRadialGradient(right, bottom, minRadius, maxRadius, this.color31, this.color32);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);
            //this.canvasRender.setFillRadialGradient(left, bottom, minRadius, maxRadius, this.color41, this.color42);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);
            //this.canvasRender.setBlendMode(CanvasRenderBlendMode.default);
            //this.canvasRender.setBlendMode(CanvasRenderBlendMode.default);
            //this.canvasRender.setFillLinearGradient(left, top, left, bottom, this.colorW, this.colorB);
            //this.canvasRender.fillRect(0.0, 0.0, width, height);
            this.canvasRender.setBlendMode(ManualTracingTool.CanvasRenderBlendMode.default);
            var divisionW = 40.0;
            var divisionH = 25.0;
            var unitWidth = Math.floor(width / divisionW);
            var unitHeight = Math.floor(height / divisionH);
            var drawX = 0.0;
            for (var x = 0; x <= divisionW; x++) {
                var drawY = 0.0;
                for (var y = 1; y <= divisionH; y++) {
                    var h = x / divisionW;
                    var s = 0.0;
                    var v = 0.0;
                    var iy = y / divisionH;
                    if (iy <= 0.5) {
                        s = iy * 2.0;
                        v = 1.0;
                    }
                    else {
                        s = 1.0;
                        v = 1.0 - (iy - 0.5) * 2.0;
                    }
                    ManualTracingTool.ColorLogic.hsvToRGB(this.tempColor4, h, s, v);
                    this.tempColor4[3] = 1.0;
                    this.canvasRender.setFillColorV(this.tempColor4);
                    this.canvasRender.fillRect(drawX, drawY, unitWidth, unitHeight);
                    drawY += unitHeight;
                }
                drawX += unitWidth;
            }
            this.canvasRender.setBlendMode(ManualTracingTool.CanvasRenderBlendMode.default);
        };
        return App_Drawing;
    }(ManualTracingTool.App_View));
    ManualTracingTool.App_Drawing = App_Drawing;
    var GPULineShader = /** @class */ (function (_super) {
        __extends(GPULineShader, _super);
        function GPULineShader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        GPULineShader.prototype.getVertexUnitSize = function () {
            return -1;
        };
        GPULineShader.prototype.getVertexCount = function (pointCount, lineCount) {
            return -1;
        };
        GPULineShader.prototype.getDrawArrayTryanglesCount = function (bufferSize) {
            return bufferSize / this.getVertexUnitSize();
        };
        GPULineShader.prototype.setBuffers = function (buffer, color) {
        };
        GPULineShader.prototype.calculateBufferData = function (buffer, logic_GPULine) {
        };
        return GPULineShader;
    }(RenderShader));
    var PolyLineShader = /** @class */ (function (_super) {
        __extends(PolyLineShader, _super);
        function PolyLineShader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.uColor = null;
            _this.aPosition = -1;
            return _this;
        }
        PolyLineShader.prototype.getVertexUnitSize = function () {
            return (2 // 頂点の位置 vec2
            );
        };
        PolyLineShader.prototype.getVertexCount = function (pointCount, lineCount) {
            return (pointCount - 1) * (2 + 2) * 3; // 辺の数 * 左側２ポリゴン＋右側２ポリゴン * 3頂点
        };
        PolyLineShader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = "\n\n" + this.floatPrecisionDefinitionCode + "\n\nattribute vec2 aPosition;\n\nuniform mat4 uPMatrix;\nuniform mat4 uMVMatrix;\n\nvoid main(void) {\n\n\t   gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);\n}\n";
        };
        PolyLineShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = "\n\n" + this.floatPrecisionDefinitionCode + "\n\nuniform vec4 uColor;\n\nvoid main(void) {\n\n    gl_FragColor = uColor;\n}\n";
        };
        PolyLineShader.prototype.initializeAttributes = function () {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PolyLineShader();
        };
        PolyLineShader.prototype.initializeAttributes_PolyLineShader = function () {
            this.uColor = this.getUniformLocation('uColor');
            this.aPosition = this.getAttribLocation('aPosition');
        };
        PolyLineShader.prototype.setBuffers = function (buffer, color) {
            var gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();
            gl.uniform4fv(this.uColor, color);
            var vertexDataStride = 4 * this.getVertexUnitSize();
            this.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, vertexDataStride);
        };
        PolyLineShader.prototype.calculateBufferData = function (buffer, logic_GPULine) {
            logic_GPULine.calculateLinePointEdges(buffer);
            logic_GPULine.calculateBufferData_PloyLine(buffer);
        };
        return PolyLineShader;
    }(GPULineShader));
    ManualTracingTool.PolyLineShader = PolyLineShader;
    var BezierLineShader = /** @class */ (function (_super) {
        __extends(BezierLineShader, _super);
        function BezierLineShader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.uColor = null;
            _this.aPosition = -1;
            _this.aLocalPosition = -1;
            _this.aLinePoint1 = -1;
            _this.aControlPoint1 = -1;
            _this.aLinePoint2 = -1;
            _this.aControlPoint2 = -1;
            _this.aLinePoint1R = -1;
            _this.aControlPoint1R = -1;
            _this.aLinePoint2R = -1;
            _this.aControlPoint2R = -1;
            _this.aWidth = -1;
            return _this;
        }
        // private aAlpha = -1;
        BezierLineShader.prototype.getVertexUnitSize = function () {
            return (2 // 頂点位置 vec2
                + 3 // ローカル空間座標 vec3 (x, y, t)
                + 2 // 頂点１ vec2
                + 2 // 制御点１ vec2
                + 2 // 制御点２ vec2
                + 2 // 頂点２ vec2
                + 2 // 頂点１R vec2
                + 2 // 制御点１R vec2
                + 2 // 制御点２R vec2
                + 2 // 頂点２R vec2
                + 2 // 太さ vec2 (from, to)
            //+ 2 // 不透明度 vec2 (from, to)
            );
        };
        BezierLineShader.prototype.getVertexCount = function (pointCount, lineCount) {
            return (pointCount - 1) * (4 + 4) * 3; // 辺の数 * (左側４ポリゴン＋右側４ポリゴン) * 3頂点
        };
        BezierLineShader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = "\n\n" + this.floatPrecisionDefinitionCode + "\n\nattribute vec2 aPosition;\nattribute vec3 aLocalPosition;\n\nattribute vec2 aLinePoint1;\nattribute vec2 aControlPoint1;\nattribute vec2 aControlPoint2;\nattribute vec2 aLinePoint2;\n\nattribute vec2 aLinePoint1R;\nattribute vec2 aControlPoint1R;\nattribute vec2 aControlPoint2R;\nattribute vec2 aLinePoint2R;\n\nattribute vec2 aWidth;\n// attribute vec2 aAlpha;\n\nuniform mat4 uPMatrix;\nuniform mat4 uMVMatrix;\n\nvarying vec3 vLocalPosition;\n\nvarying vec2 vLinePoint1;\nvarying vec2 vControlPoint1;\nvarying vec2 vControlPoint2;\nvarying vec2 vLinePoint2;\n\nvarying vec2 vLinePoint1R;\nvarying vec2 vControlPoint1R;\nvarying vec2 vControlPoint2R;\nvarying vec2 vLinePoint2R;\n\nvarying vec2 vWidth;\n// varying vec2 vAlpha;\n\nvoid main(void) {\n\n    gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);\n\n    vLocalPosition = aLocalPosition;\n\n    vLinePoint1 = aLinePoint1;\n    vControlPoint1 = aControlPoint1;\n    vControlPoint2 = aControlPoint2;\n    vLinePoint2 = aLinePoint2;\n\n    vLinePoint1R = aLinePoint1R;\n    vControlPoint1R = aControlPoint1R;\n    vControlPoint2R = aControlPoint2R;\n    vLinePoint2R = aLinePoint2R;\n\n    vWidth = aWidth;\n    // vAlpha = aAlpha;\n}\n";
        };
        BezierLineShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = "\n\n" + this.floatPrecisionDefinitionCode + "\n\nfloat cubeRoot(float x) {\n\n    float res = pow(abs(x), 1.0 / 3.0);\n    return (x >= 0.0) ? res : -res;\n}\n\nvoid solveQuadraticEquation(out vec3 solution, float a, float b, float c) {\n\n    float d;\n    float x1;\n    float x2;\n\n    if (a == 0.0) {\n\n        solution[0] = -c / b;\n        solution[1] = -1.0;\n        return;\n    }\n\n    d = b * b - 4.0 * a * c;\n\n    if (d > 0.0) {\n\n        if (b < 0.0) {\n\n            x1 = (-b - sqrt(d)) / 2.0 / a;\n            x2 = -b / a - x1;\n        }\n        else {\n\n            x1 = (-b + sqrt(d)) / 2.0 / a;\n            x2 = -b / a - x1;\n        }\n\n        solution[0] = x1;\n        solution[1]= x2;\n    }\n    else if (d == 0.0) {\n\n        solution[0] = -b / 2.0 / a;\n        solution[1] = -1.0;\n    }\n    else {\n\n        // imaginary root\n    }\n}\n\nvoid solveCubicEquation(out vec3 solution, float a, float b, float c, float d) {\n\n    float PI = 3.14159265358979323846264;\n    float p;\n    float q;\n    float t;\n    float a3;\n    float b3;\n\n    if (a == 0.0) {;\n        solveQuadraticEquation(solution, b, c, d);\n        return;\n    }\n\n    b /= 3.0 * a;\n    c /= a;\n    d /= a;\n    p = b * b - c / 3.0;\n    q = (b * (c - 2.0 * b * b) - d) / 2.0;\n\n    a = q * q - p * p * p;\n\n    if (a == 0.0) {\n  \n        q = cubeRoot(q);\n        solution[0] = 2.0 * q - b;\n        solution[1] = -q - b;\n        solution[2] = -1.0;\n    }\n    else if (a > 0.0) {\n\n        float sign = 1.0;\n        if (q <= 0.0) { sign = -1.0; }\n        a3 = cubeRoot(q + (sign) * sqrt(a));\n        b3 = p / a3;\n        solution[0] = a3 + b3 - b;\n        solution[1] = -1.0;\n        solution[2] = -1.0;\n    }\n    else {\n  \n        a = 2.0 * sqrt(p);\n        t = acos(q / (p * a / 2.0));\n        solution[0] = a * cos(t / 3.0) - b;\n        solution[1] = a * cos((t + 2.0 * PI) / 3.0) - b;\n        solution[2] = a * cos((t + 4.0 * PI) / 3.0) - b;\n    }\n}\n\nfloat calcBezierTimeInSection(float x1, float x2, float x3, float x4, float targetX) {\n\n    vec3 solution = vec3(0.0, 0.0, 0.0);\n    float a = x4 - 3.0 * (x3 - x2) - x1;\n    float b = 3.0 * (x3 - 2.0 * x2 + x1);\n    float c = 3.0 * (x2 - x1);\n    float d = x1 - targetX;\n\n    solveCubicEquation(solution, a, b, c, d);\n\n    if (solution[0] >= -0.1 && solution[0] <= 1.0) {\n\n        return solution[0];\n    }\n    else if (solution[1] >= 0.0 && solution[1] <= 1.0) {\n\n        return solution[1];\n    }\n    else if (solution[2] >= 0.0 && solution[2] <= 1.0) {\n\n        return solution[2];\n    }\n    else {\n\n        return -1.0;\n    }\n}\n\nfloat calcInterpolationBezier(float x1, float x2, float x3, float x4, float t) {\n\n    return (1.0 - t) * (1.0 - t) * (1.0 - t) * x1 +\n        3.0 * (1.0 - t) * (1.0 - t) * t * x2 +\n        3.0 * (1.0 - t) * t * t * x3 +\n        t * t * t * x4;\n}\n\nuniform vec4 uColor;\n\nvarying vec3 vLocalPosition;\n\nvarying vec2 vLinePoint1;\nvarying vec2 vControlPoint1;\nvarying vec2 vControlPoint2;\nvarying vec2 vLinePoint2;\n\nvarying vec2 vLinePoint1R;\nvarying vec2 vControlPoint1R;\nvarying vec2 vControlPoint2R;\nvarying vec2 vLinePoint2R;\n\nvarying vec2 vWidth;\n// varying vec2 vAlpha;\n\nvoid main(void) {\n\n    float t1 = calcBezierTimeInSection(\n        vLinePoint1.x,\n        vControlPoint1.x,\n        vControlPoint2.x,\n        vLinePoint2.x,\n        vLocalPosition.x\n    );\n\n    float y1;\n\n    if (t1 >= 0.0) {\n\n        y1 = calcInterpolationBezier(\n            vLinePoint1.y,\n            vControlPoint1.y,\n            vControlPoint2.y,\n            vLinePoint2.y,\n            t1\n        );\n    }\n    else {\n\n        y1 = vLocalPosition.y + 1.0;\n    }\n\n    float t2 = calcBezierTimeInSection(\n        vLinePoint1R.x,\n        vControlPoint1R.x,\n        vControlPoint2R.x,\n        vLinePoint2R.x,\n        vLocalPosition.x\n    );\n\n    float y2;\n\n    if (t2 >= 0.0) {\n\n        y2 = calcInterpolationBezier(\n            vLinePoint1R.y,\n            vControlPoint1R.y,\n            vControlPoint2R.y,\n            vLinePoint2R.y,\n            t2\n        );\n    }\n    else {\n\n        y2 = vLocalPosition.y - 1.0;\n    }\n\n    float col = (vLocalPosition.y <= y1 && vLocalPosition.y >= y2)? 1.0 : 0.0;\n\n    gl_FragColor = vec4(uColor.rgb, col * uColor.a);\n//    gl_FragColor = vec4(0.0, 0.0, 0.0, col * mix(vAlpha[0], vAlpha[1], vLocalPosition.z));\n//    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);\n}\n";
        };
        BezierLineShader.prototype.initializeAttributes = function () {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PolyLineShader();
        };
        BezierLineShader.prototype.initializeAttributes_PolyLineShader = function () {
            this.uColor = this.getUniformLocation('uColor');
            this.aPosition = this.getAttribLocation('aPosition');
            this.aLocalPosition = this.getAttribLocation('aLocalPosition');
            this.aLinePoint1 = this.getAttribLocation('aLinePoint1');
            this.aControlPoint1 = this.getAttribLocation('aControlPoint1');
            this.aControlPoint2 = this.getAttribLocation('aControlPoint2');
            this.aLinePoint2 = this.getAttribLocation('aLinePoint2');
            this.aLinePoint1R = this.getAttribLocation('aLinePoint1R');
            this.aControlPoint1R = this.getAttribLocation('aControlPoint1R');
            this.aControlPoint2R = this.getAttribLocation('aControlPoint2R');
            this.aLinePoint2R = this.getAttribLocation('aLinePoint2R');
            this.aWidth = this.getAttribLocation('aWidth');
            // this.aAlpha = this.getAttribLocation('aAlpha');
        };
        BezierLineShader.prototype.setBuffers = function (buffer, color) {
            var gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();
            gl.uniform4fv(this.uColor, color);
            var vertexDataStride = 4 * this.getVertexUnitSize();
            this.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLocalPosition, 3, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLinePoint1, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aControlPoint1, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aControlPoint2, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLinePoint2, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLinePoint1R, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aControlPoint1R, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aControlPoint2R, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLinePoint2R, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aWidth, 2, gl.FLOAT, vertexDataStride);
            // this.vertexAttribPointer(this.aAlpha, 2, gl.FLOAT, vertexDataStride);
        };
        BezierLineShader.prototype.calculateBufferData = function (buffer, logic_GPULine) {
            logic_GPULine.calculateLinePointEdges(buffer);
            logic_GPULine.calculateLinePointBezierLocation(buffer);
            logic_GPULine.calculateControlPointVertexLocations(buffer);
            logic_GPULine.calculateBufferData_BezierLine(buffer);
        };
        return BezierLineShader;
    }(GPULineShader));
    ManualTracingTool.BezierLineShader = BezierLineShader;
    var BezierDistanceLineShader = /** @class */ (function (_super) {
        __extends(BezierDistanceLineShader, _super);
        function BezierDistanceLineShader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.uColor = null;
            _this.aPosition = -1;
            _this.aLocalPosition = -1;
            _this.aLinePoint1 = -1;
            _this.aControlPoint1 = -1;
            _this.aLinePoint2 = -1;
            _this.aControlPoint2 = -1;
            _this.aLinePoint1R = -1;
            _this.aControlPoint1R = -1;
            _this.aLinePoint2R = -1;
            _this.aControlPoint2R = -1;
            _this.aWidth = -1;
            return _this;
        }
        // private aAlpha = -1;
        BezierDistanceLineShader.prototype.getVertexUnitSize = function () {
            return (2 // 頂点位置 vec2
                + 3 // ローカル空間座標 vec3 (x, y, t)
                + 2 // 頂点１ vec2
                + 2 // 制御点１ vec2
                + 2 // 制御点２ vec2
                + 2 // 頂点２ vec2
                + 2 // 頂点１R vec2
                + 2 // 制御点１R vec2
                + 2 // 制御点２R vec2
                + 2 // 頂点２R vec2
                + 2 // 太さ vec2 (from, to)
            //+ 2 // 不透明度 vec2 (from, to)
            );
        };
        BezierDistanceLineShader.prototype.getVertexCount = function (pointCount, lineCount) {
            return (pointCount - 1) * (4 + 4) * 3 + lineCount * (2 + 2) * 3; // 辺の数 * (左側４ポリゴン＋右側４ポリゴン) * 3頂点 + (線端用２ポリゴン＊２)* 3頂点
        };
        BezierDistanceLineShader.prototype.initializeVertexSourceCode = function () {
            this.vertexShaderSourceCode = "\n\n" + this.floatPrecisionDefinitionCode + "\n\nattribute vec2 aPosition;\nattribute vec3 aLocalPosition;\n\nattribute vec2 aLinePoint1;\nattribute vec2 aControlPoint1;\nattribute vec2 aControlPoint2;\nattribute vec2 aLinePoint2;\n\nattribute vec2 aLinePoint1R;\nattribute vec2 aControlPoint1R;\nattribute vec2 aControlPoint2R;\nattribute vec2 aLinePoint2R;\n\nattribute vec2 aWidth;\n// attribute vec2 aAlpha;\n\nuniform mat4 uPMatrix;\nuniform mat4 uMVMatrix;\n\nvarying vec3 vLocalPosition;\n\nvarying vec2 vLinePoint1;\nvarying vec2 vControlPoint1;\nvarying vec2 vControlPoint2;\nvarying vec2 vLinePoint2;\n\nvarying vec2 vLinePoint1R;\nvarying vec2 vControlPoint1R;\nvarying vec2 vControlPoint2R;\nvarying vec2 vLinePoint2R;\n\nvarying vec2 vWidth;\n// varying vec2 vAlpha;\n\nvoid main(void) {\n\n    gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);\n\n    vLocalPosition = aLocalPosition;\n\n    vLinePoint1 = aLinePoint1;\n    vControlPoint1 = aControlPoint1;\n    vControlPoint2 = aControlPoint2;\n    vLinePoint2 = aLinePoint2;\n\n    vLinePoint1R = aLinePoint1R;\n    vControlPoint1R = aControlPoint1R;\n    vControlPoint2R = aControlPoint2R;\n    vLinePoint2R = aLinePoint2R;\n\n    vWidth = aWidth;\n    // vAlpha = aAlpha;\n}\n";
        };
        BezierDistanceLineShader.prototype.initializeFragmentSourceCode = function () {
            this.fragmentShaderSourceCode = "\n\n" + this.floatPrecisionDefinitionCode + "\n\n// From https://www.shadertoy.com/view/4sXyDr\n\n#define CLAMP\n\nfloat distanceBezier(vec2 p, vec2 P0, vec2 P1, vec2 P2, vec2 P3, out float t)\n{\n    // Cubic Bezier curve\n    vec2 A = -P0 + 3.0 * P1 - 3.0 * P2 + P3;\n    vec2 B = 3.0 * (P0 - 2.0 * P1 + P2);\n    vec2 C = 3.0 * (P1 - P0);\n    vec2 D = P0;\n    \n    float a5 =  6.0 * dot(A, A);\n    float a4 = 10.0 * dot(A, B);\n    float a3 =  8.0 * dot(A, C)     + 4.0 * dot(B, B);\n    float a2 =  6.0 * dot(A, D - p) + 6.0 * dot(B, C);\n    float a1 =  4.0 * dot(B, D - p) + 2.0 * dot(C, C);\n    float a0 =  2.0 * dot(C, D - p);\n    \n    // calculate distances to the control points\n    float d0 = length(p - P0);\n    float d1 = length(p - P1);\n    float d2 = length(p - P2);\n    float d3 = length(p - P3);\n    float d = min(d0, min(d1, min(d2, d3)));\n    \n    // Choose initial value of t\n    //float t;\n    if (abs(d3 - d) < 1.0e-5) {\n        t = 1.0;\n    }\n    else if (abs(d0 - d) < 1.0e-5) {\n        t = 0.0;\n    }\n    else {\n        t = 0.5;\n    }\n        \n\t// iteration\n    for (int i = 0; i < 10; i++) {\n\n        float t2 = t*t;\n        float t3 = t2*t;\n        float t4 = t3*t;\n        float t5 = t4*t;\n        \n        float f = a5*t5 + a4*t4 + a3*t3 + a2*t2 + a1*t + a0;\n        float df = 5.0*a5*t4 + 4.0*a4*t3 + 3.0*a3*t2 + 2.0*a2*t + a1;\n        \n        t = t - f/df;\n    }\n    \n    // clamp to edge of bezier segment\n#ifdef CLAMP\n    t = clamp(t, 0.0, 1.0);\n#endif\n    \n    // get the point on the curve\n    vec2 P = A*t*t*t + B*t*t + C*t + D;\n        \n    // return distance to the point on the curve\n    return min(length(p - P), min(d0, d3));\n}\n\nuniform vec4 uColor;\n\nvarying vec3 vLocalPosition;\n\nvarying vec2 vLinePoint1;\nvarying vec2 vControlPoint1;\nvarying vec2 vControlPoint2;\nvarying vec2 vLinePoint2;\n\nvarying vec2 vLinePoint1R;\nvarying vec2 vControlPoint1R;\nvarying vec2 vControlPoint2R;\nvarying vec2 vLinePoint2R;\n\nvarying vec2 vWidth;\n// varying vec2 vAlpha;\n\nvoid main(void) {\n\n\tvec2 p  = vLocalPosition.xy;\n    vec2 P0 = vLinePoint1;\n    vec2 P1 = vControlPoint1;\n    vec2 P2 = vControlPoint2;\n    vec2 P3 = vLinePoint2;\n    \n    float t;\n    float distance = distanceBezier(p, P0, P1, P2, P3, t);\n    float width = mix(vWidth.x, vWidth.y, t);\n    \n    if (distance > width) {\n\n\t\tdiscard;\n    }\n\telse {\n\n        float col = 1.0 - smoothstep(width - 0.08, width, distance);\n        //float col = distance * 0.1;\n\n        //gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);\n        //gl_FragColor = vec4(vLocalPosition.z, 0.0, 0.0, col);\n        //gl_FragColor = vec4(vWidth.y, 0.0, 0.0, col * uColor.a * 0.9 + 0.1);\n        gl_FragColor = vec4(uColor.rgb, col * uColor.a * 0.9 + 0.1);\n    }\n}\n";
        };
        BezierDistanceLineShader.prototype.initializeAttributes = function () {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PolyLineShader();
        };
        BezierDistanceLineShader.prototype.initializeAttributes_PolyLineShader = function () {
            this.uColor = this.getUniformLocation('uColor');
            this.aPosition = this.getAttribLocation('aPosition');
            this.aLocalPosition = this.getAttribLocation('aLocalPosition');
            this.aLinePoint1 = this.getAttribLocation('aLinePoint1');
            this.aControlPoint1 = this.getAttribLocation('aControlPoint1');
            this.aControlPoint2 = this.getAttribLocation('aControlPoint2');
            this.aLinePoint2 = this.getAttribLocation('aLinePoint2');
            this.aLinePoint1R = this.getAttribLocation('aLinePoint1R');
            this.aControlPoint1R = this.getAttribLocation('aControlPoint1R');
            this.aControlPoint2R = this.getAttribLocation('aControlPoint2R');
            this.aLinePoint2R = this.getAttribLocation('aLinePoint2R');
            this.aWidth = this.getAttribLocation('aWidth');
            // this.aAlpha = this.getAttribLocation('aAlpha');
        };
        BezierDistanceLineShader.prototype.setBuffers = function (buffer, color) {
            var gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();
            gl.uniform4fv(this.uColor, color);
            var vertexDataStride = 4 * this.getVertexUnitSize();
            this.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLocalPosition, 3, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLinePoint1, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aControlPoint1, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aControlPoint2, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLinePoint2, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLinePoint1R, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aControlPoint1R, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aControlPoint2R, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aLinePoint2R, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aWidth, 2, gl.FLOAT, vertexDataStride);
            // this.vertexAttribPointer(this.aAlpha, 2, gl.FLOAT, vertexDataStride);
        };
        BezierDistanceLineShader.prototype.calculateBufferData = function (buffer, logic_GPULine) {
            logic_GPULine.calculateLinePointEdges(buffer);
            logic_GPULine.calculateLinePointBezierLocation(buffer);
            logic_GPULine.calculateControlPointVertexLocations(buffer);
            logic_GPULine.calculateBufferData_BezierLine(buffer);
        };
        return BezierDistanceLineShader;
    }(GPULineShader));
    ManualTracingTool.BezierDistanceLineShader = BezierDistanceLineShader;
})(ManualTracingTool || (ManualTracingTool = {}));
