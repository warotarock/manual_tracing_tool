var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    var Main_Drawing = /** @class */ (function (_super) {
        __extends(Main_Drawing, _super);
        function Main_Drawing() {
            // Drawings
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.operatorCurosrLineDash = [2.0, 2.0];
            _this.operatorCurosrLineDashScaled = [0.0, 0.0];
            _this.operatorCurosrLineDashNone = [];
            // Subtool window drawing
            _this.subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            _this.subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5);
            return _this;
        }
        Main_Drawing.prototype.draw = function () {
            this.toolEnv.updateContext();
            if (this.footerText != this.footerTextBefore) {
                this.getElement('footer').innerHTML = this.footerText;
                this.footerTextBefore = this.footerText;
            }
            if (this.toolContext.redrawMainWindow) {
                this.toolContext.redrawMainWindow = false;
                this.clearWindow(this.mainWindow);
                this.drawMainWindow(this.mainWindow);
                if (this.selectCurrentLayerAnimationTime > 0.0) {
                    this.toolEnv.setRedrawMainWindow();
                }
            }
            if (this.toolContext.redrawEditorWindow) {
                this.toolContext.redrawEditorWindow = false;
                this.clearWindow(this.editorWindow);
                this.drawEditorWindow(this.editorWindow, this.mainWindow);
            }
            if (this.toolContext.redrawLayerWindow) {
                this.toolContext.redrawLayerWindow = false;
                this.clearWindow(this.layerWindow);
                this.drawLayerWindow(this.layerWindow);
            }
            if (this.toolContext.redrawSubtoolWindow) {
                this.toolContext.redrawSubtoolWindow = false;
                this.clearWindow(this.subtoolWindow);
                this.subtoolWindow_Draw(this.subtoolWindow);
            }
            if (this.toolContext.redrawTimeLineWindow) {
                this.toolContext.redrawTimeLineWindow = false;
                this.clearWindow(this.timeLineWindow);
                this.drawTimeLineWindow(this.timeLineWindow);
            }
            if (this.toolContext.redrawWebGLWindow) {
                this.toolContext.redrawWebGLWindow = false;
                this.drawWebGLWindow(this.mainWindow, this.webglWindow, this.pickingWindow);
            }
            if (this.toolContext.redrawHeaderWindow) {
                this.toolContext.redrawHeaderWindow = false;
                this.updateHeaderButtons();
            }
            if (this.toolContext.redrawFooterWindow) {
                this.toolContext.redrawFooterWindow = false;
                this.updateFooterMessage();
            }
        };
        // Main window drawing
        Main_Drawing.prototype.clearWindow = function (canvasWindow) {
            this.canvasRender.setContext(canvasWindow);
            this.canvasRender.clearRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height);
        };
        Main_Drawing.prototype.drawMainWindow = function (canvasWindow) {
            if (this.currentKeyframe == null) {
                return;
            }
            var currentLayerOnly = (this.selectCurrentLayerAnimationTime > 0.0);
            var env = this.toolEnv;
            this.canvasRender.setContext(canvasWindow);
            var viewKeyframe = this.currentKeyframe;
            for (var i = viewKeyframe.layers.length - 1; i >= 0; i--) {
                var viewKeyFrameLayer = viewKeyframe.layers[i];
                this.drawLayer(viewKeyFrameLayer, currentLayerOnly, this.document);
            }
            if (env.isEditMode()) {
                for (var i = viewKeyframe.layers.length - 1; i >= 0; i--) {
                    var viewKeyFrameLayer = viewKeyframe.layers[i];
                    this.drawLayerForEditMode(viewKeyFrameLayer, currentLayerOnly, this.document);
                }
            }
        };
        Main_Drawing.prototype.drawLayer = function (viewKeyFrameLayer, currentLayerOnly, documentData) {
            var layer = viewKeyFrameLayer.layer;
            if (!layer.isVisible && !currentLayerOnly) {
                return;
            }
            if (currentLayerOnly && layer != this.selectCurrentLayerAnimationLayer) {
                return;
            }
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                var vectorLayer = layer;
                this.drawVectorLayer(vectorLayer, viewKeyFrameLayer.vectorLayerKeyframe.geometry, documentData);
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                // No drawing
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                // No drawing
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
                this.drawImageFileReferenceLayer(ifrLayer);
            }
        };
        Main_Drawing.prototype.drawLayerForEditMode = function (viewKeyFrameLayer, currentLayerOnly, documentData) {
            var layer = viewKeyFrameLayer.layer;
            if (!layer.isVisible && !currentLayerOnly) {
                return;
            }
            if (currentLayerOnly) {
                return;
            }
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                var vectorLayer = layer;
                this.drawVectorLayerForEditMode(vectorLayer, viewKeyFrameLayer.vectorLayerKeyframe.geometry, documentData);
            }
        };
        Main_Drawing.prototype.drawVectorLayer = function (layer, geometry, documentData) {
            var context = this.toolContext;
            var env = this.toolEnv;
            var isSelectedLayer = (layer.isSelected);
            // drawing parameters
            var widthRate = context.document.lineWidthBiasRate;
            var lineColor = this.getLineColor(layer, documentData);
            var fillColor = this.getFillColor(layer, documentData);
            vec4.copy(this.editOtherLayerLineColor, lineColor);
            this.editOtherLayerLineColor[3] *= 0.3;
            // drawing geometry lines
            var useAdjustingLocation = this.isModalToolRunning();
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
                if (env.isDrawMode() && layer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                    for (var _d = 0, _e = group.lines; _d < _e.length; _d++) {
                        var line = _e[_d];
                        this.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation);
                    }
                }
            }
        };
        Main_Drawing.prototype.drawVectorLayerForEditMode = function (layer, geometry, documentData) {
            var context = this.toolContext;
            var isSelectedLayer = (layer.isSelected);
            // drawing parameters
            var widthRate = context.document.lineWidthBiasRate;
            var lineColor = this.getLineColor(layer, documentData);
            var fillColor = this.getFillColor(layer, documentData);
            // drawing geometry lines
            var useAdjustingLocation = this.isModalToolRunning();
            for (var _i = 0, _a = geometry.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (!isSelectedLayer) {
                        if (layer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                            this.drawVectorLineStroke(line, this.editOtherLayerLineColor, widthRate, 0.0, useAdjustingLocation);
                        }
                    }
                    else {
                        if (this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.linePoint) {
                            this.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation);
                            this.drawVectorLinePoints(line, lineColor, useAdjustingLocation);
                        }
                        else if (this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.line
                            || this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.lineSegment) {
                            var color = void 0;
                            if ((line.isSelected && line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.selectedToUnselected)
                                || line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.unselectedToSelected) {
                                color = this.drawStyle.selectedVectorLineColor;
                            }
                            else {
                                color = lineColor;
                            }
                            var lineWidthBolding = (line.isCloseToMouse ? 2.0 : 0.0);
                            this.drawVectorLineStroke(line, color, widthRate, lineWidthBolding, useAdjustingLocation);
                        }
                    }
                }
            }
        };
        Main_Drawing.prototype.drawVectorLineStroke = function (line, color, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation) {
            if (line.points.length == 0) {
                return;
            }
            this.canvasRender.setStrokeColorV(color);
            this.drawVectorLineSegment(line, 0, line.points.length - 1, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation);
        };
        Main_Drawing.prototype.drawVectorLinePoints = function (line, color, useAdjustingLocation) {
            if (line.points.length == 0) {
                return;
            }
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            // make color darker or lighter than original to visible on line color
            ManualTracingTool.ColorLogic.rgbToHSV(this.tempEditorLinePointColor1, color);
            if (this.tempEditorLinePointColor1[2] > 0.5) {
                this.tempEditorLinePointColor1[2] -= this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            else {
                this.tempEditorLinePointColor1[2] += this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            ManualTracingTool.ColorLogic.hsvToRGB(this.tempEditorLinePointColor2, this.tempEditorLinePointColor1);
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.drawVectorLinePoint(point, this.tempEditorLinePointColor2, useAdjustingLocation);
            }
        };
        Main_Drawing.prototype.lineWidthAdjust = function (width) {
            return Math.floor(width * 5) / 5;
        };
        Main_Drawing.prototype.drawVectorLineFill = function (line, color, useAdjustingLocation, isFillContinuing) {
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
        Main_Drawing.prototype.drawVectorLineSegment = function (line, startIndex, endIndex, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation) {
            this.canvasRender.setLineCap(ManualTracingTool.CanvasRenderLineCap.round);
            for (var pointIndex = startIndex; pointIndex <= endIndex;) {
                // search first visible point
                var segmentStartIndex = -1;
                for (var index = pointIndex; index <= endIndex; index++) {
                    var point = line.points[index];
                    var isNotDeleted = (point.modifyFlag != ManualTracingTool.LinePointModifyFlagID.delete);
                    var lineWidth = (useAdjustingLocation ? point.adjustingLineWidth : point.lineWidth);
                    var isVisibleWidth = (lineWidth > 0.0);
                    if (isNotDeleted && isVisibleWidth) {
                        segmentStartIndex = index;
                        break;
                    }
                }
                if (segmentStartIndex == -1) {
                    break;
                }
                var firstPoint = line.points[segmentStartIndex];
                var currentLineWidth = this.lineWidthAdjust(useAdjustingLocation ? firstPoint.adjustingLineWidth : firstPoint.lineWidth);
                // search end index of the segment
                var segmentEndIndex = segmentStartIndex;
                for (var index = segmentStartIndex + 1; index <= endIndex; index++) {
                    var point = line.points[index];
                    var isNotDeleted = (point.modifyFlag != ManualTracingTool.LinePointModifyFlagID.delete);
                    var lineWidth = this.lineWidthAdjust(useAdjustingLocation ? point.adjustingLineWidth : point.lineWidth);
                    var isVisibleWidth = (lineWidth > 0.0);
                    var isSameLineWidth = (lineWidth == currentLineWidth);
                    segmentEndIndex = index;
                    if (isNotDeleted && isVisibleWidth && isSameLineWidth) {
                        continue;
                    }
                    else {
                        break;
                    }
                }
                if (segmentEndIndex == segmentStartIndex) {
                    break;
                }
                // draw segment
                this.canvasRender.beginPath();
                this.canvasRender.setStrokeWidth(currentLineWidth * strokeWidthBiasRate + this.getCurrentViewScaleLineWidth(strokeWidthBolding));
                var firstLocaton = (useAdjustingLocation ? firstPoint.adjustingLocation : firstPoint.location);
                this.canvasRender.moveTo(firstLocaton[0], firstLocaton[1]);
                for (var index = segmentStartIndex + 1; index <= segmentEndIndex; index++) {
                    var point = line.points[index];
                    var location_2 = (useAdjustingLocation ? point.adjustingLocation : point.location);
                    this.canvasRender.lineTo(location_2[0], location_2[1]);
                }
                this.canvasRender.stroke();
                // next step
                pointIndex = segmentEndIndex;
            }
        };
        Main_Drawing.prototype.drawVectorLinePoint = function (point, color, useAdjustingLocation) {
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
        Main_Drawing.prototype.drawEditLineStroke = function (line) {
            this.drawVectorLineStroke(line, this.drawStyle.editingLineColor, 1.0, 2.0, false);
        };
        Main_Drawing.prototype.drawEditLinePoints = function (canvasWindow, line, color) {
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.setStrokeColorV(color);
            this.canvasRender.setFillColorV(color);
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.drawVectorLinePoint(point, color, false);
            }
        };
        Main_Drawing.prototype.getLineColor = function (layer, documentData) {
            var color;
            if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.layerColor) {
                color = layer.layerColor;
            }
            else if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.palletColor) {
                var palletColor = documentData.palletColos[layer.line_PalletColorIndex];
                color = palletColor.color;
            }
            else {
                color = layer.layerColor;
            }
            return color;
        };
        Main_Drawing.prototype.getFillColor = function (layer, documentData) {
            var color;
            if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.fillColor) {
                color = layer.fillColor;
            }
            else if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.palletColor) {
                var palletColor = documentData.palletColos[layer.fill_PalletColorIndex];
                color = palletColor.color;
            }
            else {
                color = layer.fillColor;
            }
            return color;
        };
        Main_Drawing.prototype.getCurrentViewScaleLineWidth = function (width) {
            return width / this.canvasRender.getViewScale();
        };
        Main_Drawing.prototype.getViewScaledSize = function (width) {
            return width / this.canvasRender.getViewScale();
        };
        Main_Drawing.prototype.drawImageFileReferenceLayer = function (layer) {
            if (layer.imageResource == null
                || layer.imageResource.image == null
                || layer.imageResource.image.imageData == null) {
                return;
            }
            var image = layer.imageResource.image.imageData;
            var isModal = this.isModalToolRunning();
            var location = (isModal ? layer.adjustingLocation : layer.location);
            var rotation = (isModal ? layer.adjustingRotation[0] : layer.rotation[0]);
            var scale = (isModal ? layer.adjustingScale : layer.scale);
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
        Main_Drawing.prototype.layerPicking = function (canvasWindow, pickLocationX, pickLocationY) {
            if (this.layerWindowItems == null || this.currentKeyframe == null) {
                return null;
            }
            var documentData = this.toolContext.document;
            var viewKeyframe = this.currentKeyframe;
            var pickedLayer = null;
            for (var _i = 0, _a = viewKeyframe.layers; _i < _a.length; _i++) {
                var viewKeyframeLayer = _a[_i];
                var layer = viewKeyframeLayer.layer;
                if (!layer.isVisible || !ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                    continue;
                }
                var vectorLayer = layer;
                this.clearWindow(canvasWindow);
                this.canvasRender.setContext(canvasWindow);
                this.drawVectorLayer(vectorLayer, viewKeyframeLayer.vectorLayerKeyframe.geometry, documentData);
                this.canvasRender.pickColor(this.tempColor4, canvasWindow, pickLocationX, pickLocationY);
                if (this.tempColor4[3] > 0.0) {
                    pickedLayer = layer;
                    break;
                }
            }
            this.drawMainWindow(this.mainWindow);
            return pickedLayer;
        };
        // Editor window drawing
        Main_Drawing.prototype.drawEditorWindow = function (editorWindow, mainWindow) {
            var context = this.toolContext;
            mainWindow.updateViewMatrix();
            mainWindow.copyTransformTo(editorWindow);
            this.canvasRender.setContext(editorWindow);
            if (this.toolEnv.needsDrawOperatorCursor()) {
                this.drawOperatorCursor();
            }
            if (this.toolEnv.isDrawMode()) {
                if (this.currentTool == this.tool_DrawLine) {
                    if (this.tool_DrawLine.editLine != null) {
                        this.drawEditLineStroke(this.tool_DrawLine.editLine);
                    }
                }
                else if (context.mainToolID == ManualTracingTool.MainToolID.posing) {
                    //for (let subtool of this.mainTools[<int>MainToolID.posing].subTools) {
                    //    let posingTools = <Tool_Posing3d_ToolBase>subtool;
                    //    if (posingTools.editLine != null) {
                    //        this.drawRawLine(editorWindow, posingTools.editLine);
                    //    }
                    //}
                    if (this.currentTool == this.tool_Posing3d_LocateHead
                        && this.tool_Posing3d_LocateHead.editLine != null) {
                        this.drawEditLineStroke(this.tool_Posing3d_LocateHead.editLine);
                    }
                }
            }
            if (this.currentTool != null) {
                this.toolEnv.updateContext();
                this.toolDrawEnv.setVariables(editorWindow);
                this.currentTool.onDrawEditor(this.toolEnv, this.toolDrawEnv);
            }
        };
        Main_Drawing.prototype.drawOperatorCursor = function () {
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
        // MainEditorDrawer implementations
        Main_Drawing.prototype.drawMouseCursor = function () {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.circle(this.mainWindow.toolMouseEvent.location[0], this.mainWindow.toolMouseEvent.location[1], this.getCurrentViewScaleLineWidth(this.toolContext.mouseCursorRadius));
            this.canvasRender.stroke();
        };
        Main_Drawing.prototype.drawEditorEditLineStroke = function (line) {
            this.drawEditLineStroke(line);
        };
        Main_Drawing.prototype.drawEditorVectorLineStroke = function (line, color, strokeWidthBolding, useAdjustingLocation) {
            this.drawVectorLineStroke(line, color, 1.0, strokeWidthBolding, useAdjustingLocation);
        };
        Main_Drawing.prototype.drawEditorVectorLinePoints = function (line, color, useAdjustingLocation) {
            this.drawVectorLinePoints(line, color, useAdjustingLocation);
        };
        Main_Drawing.prototype.drawEditorVectorLinePoint = function (point, color, useAdjustingLocation) {
            this.drawVectorLinePoint(point, color, useAdjustingLocation);
        };
        Main_Drawing.prototype.drawEditorVectorLineSegment = function (line, startIndex, endIndex, useAdjustingLocation) {
            this.drawVectorLineSegment(line, startIndex, endIndex, 1.0, 0.0, useAdjustingLocation);
        };
        // WebGL window drawing
        Main_Drawing.prototype.drawWebGLWindow = function (mainWindow, webglWindow, pickingWindow) {
            var env = this.toolEnv;
            this.webGLRender.setViewport(0.0, 0.0, webglWindow.width, webglWindow.height);
            this.posing3dView.clear(env);
            mainWindow.copyTransformTo(pickingWindow);
            mainWindow.copyTransformTo(webglWindow);
            if (env.currentPosingLayer != null && env.currentPosingLayer.isVisible
                && this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing) {
                var posingLayer = env.currentPosingLayer;
                this.posing3dView.prepareDrawingStructures(posingLayer);
                //this.posing3dView.drawPickingImage(posingLayer, env);
                //pickingWindow.context.clearRect(0, 0, pickingWindow.width, pickingWindow.height);
                //pickingWindow.context.drawImage(webglWindow.canvas, 0, 0, webglWindow.width, webglWindow.height);
                //this.posing3dView.clear(env);
                this.posing3dView.drawManipulaters(posingLayer, env);
            }
            for (var index = this.layerWindowItems.length - 1; index >= 0; index--) {
                var item = this.layerWindowItems[index];
                if (item.layer.type != ManualTracingTool.LayerTypeID.posingLayer) {
                    continue;
                }
                var posingLayer = item.layer;
                this.posing3dView.prepareDrawingStructures(posingLayer);
                this.posing3dView.drawPosingModel(posingLayer, env);
            }
        };
        // Layer window drawing
        Main_Drawing.prototype.drawLayerWindow = function (layerWindow) {
            this.canvasRender.setContext(layerWindow);
            this.drawLayerWindow_LayerItems(layerWindow);
            this.drawLayerWindow_LayerWindowButtons(layerWindow);
        };
        Main_Drawing.prototype.drawLayerWindow_LayerWindowButtons = function (layerWindow) {
            this.caluculateLayerWindowLayout_CommandButtons(layerWindow, this.layerWindowLayoutArea);
            if (this.layerWindowCommandButtons.length > 0) {
                var button = this.layerWindowCommandButtons[0];
                this.canvasRender.setFillColorV(this.drawStyle.layerWindowBackgroundColor);
                this.canvasRender.fillRect(0.0, button.top, layerWindow.width - 1, button.getHeight());
            }
            for (var _i = 0, _a = this.layerWindowCommandButtons; _i < _a.length; _i++) {
                var button = _a[_i];
                this.drawLayerWindow_LayerWindowButton(button);
            }
        };
        Main_Drawing.prototype.drawLayerWindow_LayerWindowButton = function (button) {
            var srcWidth = 64.0;
            var srcHeight = 64.0;
            var srcX = 0.0;
            var srcY = (button.buttonID - 1) * srcHeight;
            var dstX = button.left;
            var dstY = button.top;
            var scale = 1.0;
            var dstWidth = button.getWidth() * scale;
            var dstHeight = button.getHeight() * scale;
            var srcImage = this.layerButtonImage;
            this.canvasRender.drawImage(srcImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight);
        };
        Main_Drawing.prototype.drawLayerWindow_LayerItems = function (layerWindow) {
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                this.drawLayerWindowItem(item, layerWindow.layerItemFontSize);
            }
        };
        Main_Drawing.prototype.drawLayerWindowItem = function (item, fontSize) {
            var layer = item.layer;
            var left = item.left;
            var top = item.top;
            var bottom = item.bottom;
            var itemWidth = item.getWidth();
            var itemHeight = item.getHeight();
            var bottomMargin = itemHeight * 0.3;
            var depthOffset = 10.0 * item.hierarchyDepth;
            if (layer.isSelected && layer == this.toolContext.currentLayer) {
                this.canvasRender.setFillColorV(this.drawStyle.layerWindowItemActiveLayerColor);
            }
            else if (layer.isSelected) {
                this.canvasRender.setFillColorV(this.drawStyle.layerWindowItemSelectedColor);
            }
            else {
                this.canvasRender.setFillColorV(this.drawStyle.layerWindowBackgroundColor);
            }
            this.canvasRender.fillRect(left, top, itemWidth, itemHeight);
            // Visible/Unvisible icon
            var srcImage = this.systemImage.image;
            var iconIndex = (item.layer.isVisible ? 0.0 : 1.0);
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
        Main_Drawing.prototype.subtoolWindow_Draw = function (subtoolWindow) {
            this.canvasRender.setContext(subtoolWindow);
            var context = this.toolContext;
            var currentMainTool = this.getCurrentMainTool();
            var scale = subtoolWindow.subToolItemScale;
            var fullWidth = subtoolWindow.width - 1;
            var unitWidth = subtoolWindow.subToolItemUnitWidth;
            var unitHeight = subtoolWindow.subToolItemUnitHeight;
            var lastY = 0.0;
            for (var _i = 0, _a = this.subToolViewItems; _i < _a.length; _i++) {
                var viewItem = _a[_i];
                var tool = viewItem.tool;
                var srcImage = tool.toolBarImage;
                if (srcImage == null) {
                    continue;
                }
                var srcY = tool.toolBarImageIndex * unitHeight;
                var dstY = viewItem.top;
                // Draw subtool image
                if (tool == this.currentTool) {
                    this.canvasRender.setFillColorV(this.subToolItemSelectedColor);
                }
                else {
                    this.canvasRender.setFillColorV(this.drawStyle.layerWindowBackgroundColor);
                }
                this.canvasRender.fillRect(0, dstY, fullWidth, unitHeight * scale);
                if (tool.isAvailable(this.toolEnv)) {
                    this.canvasRender.setGlobalAlpha(1.0);
                }
                else {
                    this.canvasRender.setGlobalAlpha(0.5);
                }
                this.canvasRender.drawImage(srcImage.image.imageData, 0, srcY, unitWidth, unitHeight, 0, dstY, unitWidth * scale, unitHeight * scale);
                // Draw subtool option buttons
                for (var _b = 0, _c = viewItem.buttons; _b < _c.length; _b++) {
                    var button = _c[_b];
                    var buttonWidth = 128 * scale;
                    var buttonHeight = 128 * scale;
                    button.left = unitWidth * scale * 0.8;
                    button.top = dstY;
                    button.right = button.left + buttonWidth - 1;
                    button.bottom = button.top + buttonHeight - 1;
                    var inpuSideID = tool.getInputSideID(button.index, this.toolEnv);
                    if (inpuSideID == ManualTracingTool.InputSideID.front) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 0, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                    else if (inpuSideID == ManualTracingTool.InputSideID.back) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 128, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                }
                this.canvasRender.setStrokeWidth(0.0);
                this.canvasRender.setStrokeColorV(this.subToolItemSeperatorLineColor);
                this.canvasRender.drawLine(0, dstY, fullWidth, dstY);
                lastY = dstY + unitHeight * scale;
            }
            this.canvasRender.setGlobalAlpha(1.0);
            this.canvasRender.drawLine(0, lastY, fullWidth, lastY);
        };
        // TimeLine window drawing
        Main_Drawing.prototype.drawTimeLineWindow = function (wnd) {
            var context = this.toolContext;
            var env = this.toolEnv;
            var aniSetting = context.document.animationSettingData;
            var left = wnd.getTimeLineLeft();
            var right = wnd.getTimeLineRight();
            var bottom = wnd.height;
            var frameUnitWidth = wnd.getFrameUnitWidth(aniSetting);
            var frameNumberHeight = 16.0;
            var frameLineBottom = wnd.height - 1.0 - frameNumberHeight;
            var frameLineHeight = 10.0;
            var secondFrameLineHeight = 30.0;
            // Control buttons
            {
                var srcX = 0;
                var srcY = 196;
                var srcW = 128;
                var srcH = 128;
                var dstW = 45;
                var dstH = 45;
                var dstX = left / 2 - dstW / 2 + 1;
                var dstY = wnd.height / 2 - dstH / 2 + 1;
                if (context.animationPlaying) {
                    srcX = 128;
                }
                this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
            }
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
            for (var _i = 0, _a = this.viewLayerContext.keyframes; _i < _a.length; _i++) {
                var viewKeyframe = _a[_i];
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
            if (env.currentVectorLayer != null) {
                var viewKeyFrame = this.findViewKeyFrame(aniSetting.currentTimeFrame);
                var layerIndex = -1;
                if (viewKeyFrame != null) {
                    layerIndex = this.findViewKeyframeLayerIndex(viewKeyFrame, env.currentVectorLayer);
                }
                if (layerIndex != -1) {
                    for (var _b = 0, _c = this.viewLayerContext.keyframes; _b < _c.length; _b++) {
                        var viewKeyframe = _c[_b];
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
        return Main_Drawing;
    }(ManualTracingTool.Main_View));
    ManualTracingTool.Main_Drawing = Main_Drawing;
})(ManualTracingTool || (ManualTracingTool = {}));
