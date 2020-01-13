var ManualTracingTool;
(function (ManualTracingTool) {
    class App_Drawing extends ManualTracingTool.App_View {
        constructor() {
            super(...arguments);
            this.canvasRender = new ManualTracingTool.CanvasRender();
            this.drawGPURender = new WebGLRender();
            this.polyLineShader = new PolyLineShader();
            this.bezierLineShader = new BezierLineShader();
            this.bezierDistanceLineShader = new BezierDistanceLineShader();
            this.lineShader = this.bezierDistanceLineShader;
            //lineShader: GPULineShader = this.polyLineShader;
            this.posing3DViewRender = new WebGLRender();
            this.posing3dView = new ManualTracingTool.Posing3DView();
            this.logic_GPULine = new ManualTracingTool.Logic_GPULine();
            // Resources
            this.drawStyle = new ManualTracingTool.ToolDrawingStyle();
            this.systemImage = null;
            this.subToolImages = new List();
            this.layerButtonImage = null;
            // Work variable
            this.chestInvMat4 = mat4.create();
            this.hipsInvMat4 = mat4.create();
            this.editOtherLayerLineColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);
            this.editOtherLayerFillColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);
            this.tempEditorLinePointColor1 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.tempEditorLinePointColor2 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.layerPickingPositions = [[0.0, 0.0], [0.0, -2.0], [2.0, 0.0], [0.0, 2.0], [-2.0, 0.0]];
            this.scale = vec3.create();
            this.eyeLocation = vec3.create();
            this.lookatLocation = vec3.create();
            this.upVector = vec3.create();
            this.modelLocation = vec3.create();
            this.modelMatrix = mat4.create();
            this.viewMatrix = mat4.create();
            this.modelViewMatrix = mat4.create();
            this.projectionMatrix = mat4.create();
            this.tmpMatrix = mat4.create();
            this.operatorCurosrLineDash = [2.0, 2.0];
            this.operatorCurosrLineDashScaled = [0.0, 0.0];
            this.operatorCurosrLineDashNone = [];
            // ColorMixer window
            this.hsv = vec4.create();
            // Palette modal drawing
            this.colorW = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            this.colorB = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        }
        initializeDrawingDevices() {
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
        }
        // Common drawing methods
        clearWindow(canvasWindow) {
            this.canvasRender.setContext(canvasWindow);
            this.canvasRender.resetTransform();
            this.canvasRender.clearRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height);
            this.canvasRender.setTransform(canvasWindow);
        }
        drawFullWindowImage(dstWindow, srcWindow) {
            this.canvasRender.setContext(dstWindow);
            this.canvasRender.resetTransform();
            this.canvasRender.drawImage(srcWindow.canvas, 0, 0, srcWindow.width, srcWindow.height, 0, 0, dstWindow.width, dstWindow.height);
            this.canvasRender.setTransform(dstWindow);
        }
        drawButtonBackground(layoutArea, isSelected) {
            let dstX = layoutArea.left;
            let dstY = layoutArea.top;
            let scale = 1.0;
            let dstWidth = layoutArea.getWidth() * scale;
            let dstHeight = layoutArea.getHeight() * scale;
            if (isSelected) {
                this.canvasRender.setFillColorV(this.toolDrawEnv.style.selectedButtonColor);
                this.canvasRender.fillRect(dstX, dstY, dstWidth, dstHeight);
            }
        }
        drawButtonImage(layoutArea) {
            let srcWidth = 64.0;
            let srcHeight = 64.0;
            let srcX = 0.0;
            let srcY = (layoutArea.iconID - 1) * srcHeight;
            let dstX = layoutArea.left;
            let dstY = layoutArea.top;
            let scale = 1.0;
            let dstWidth = layoutArea.getWidth() * scale;
            let dstHeight = layoutArea.getHeight() * scale;
            let srcImage = this.layerButtonImage;
            this.canvasRender.drawImage(srcImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight);
        }
        // Document
        drawExportImage(canvasWindow) {
        }
        // MainEditorDrawer implementations
        drawMouseCursor() {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.circle(this.mainWindow.toolMouseEvent.location[0], this.mainWindow.toolMouseEvent.location[1], this.getCurrentViewScaleLineWidth(this.toolContext.mouseCursorRadius));
            this.canvasRender.stroke();
        }
        drawMouseCursorCircle(radius) {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.circle(this.mainWindow.toolMouseEvent.location[0], this.mainWindow.toolMouseEvent.location[1], radius);
            this.canvasRender.stroke();
        }
        drawEditorEditLineStroke(line) {
            this.drawEditLineStroke(line);
        }
        drawEditorVectorLineStroke(line, color, strokeWidthBolding, useAdjustingLocation) {
            this.drawVectorLineStroke(line, color, 1.0, strokeWidthBolding, useAdjustingLocation, false);
        }
        drawEditorVectorLinePoints(line, color, useAdjustingLocation) {
            this.drawVectorLinePoints(line, color, useAdjustingLocation);
        }
        drawEditorVectorLinePoint(point, color, useAdjustingLocation) {
            this.drawVectorLinePoint(point, color, useAdjustingLocation);
        }
        drawEditorVectorLineSegment(line, startIndex, endIndex, useAdjustingLocation) {
            this.drawVectorLineSegment(line, startIndex, endIndex, 1.0, 0.0, useAdjustingLocation);
        }
        // Main window
        drawMainWindow(canvasWindow, redrawActiveLayerOnly) {
        }
        drawForeground(viewKeyFrameLayer, documentData, isExporting, isModalToolRunning) {
            let layer = viewKeyFrameLayer.layer;
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                let vectorLayer = layer;
                let geometry = viewKeyFrameLayer.vectorLayerKeyframe.geometry;
                this.drawForeground_VectorLayer(vectorLayer, geometry, documentData, isExporting, isModalToolRunning);
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                let ifrLayer = layer;
                this.drawForeground_ImageFileReferenceLayer(ifrLayer, isModalToolRunning);
            }
        }
        drawForeground_VectorLayer(layer, geometry, documentData, isExporting, isModalToolRunning) {
            let env = this.toolEnv;
            let useAdjustingLocation = isModalToolRunning;
            let widthRate = documentData.lineWidthBiasRate;
            let lineColor = this.getLineColor(layer, documentData, env, true);
            for (let group of geometry.groups) {
                if (layer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                    for (let line of group.lines) {
                        this.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation, isExporting);
                    }
                }
            }
        }
        drawForeground_ImageFileReferenceLayer(layer, isModalToolRunning) {
            if (layer.imageResource == null
                || layer.imageResource.image == null
                || layer.imageResource.image.imageData == null) {
                return;
            }
            let image = layer.imageResource.image.imageData;
            let location = (isModalToolRunning ? layer.adjustingLocation : layer.location);
            let rotation = (isModalToolRunning ? layer.adjustingRotation[0] : layer.rotation[0]);
            let scale = (isModalToolRunning ? layer.adjustingScale : layer.scale);
            mat4.identity(this.tempMat4);
            mat4.translate(this.tempMat4, this.tempMat4, location);
            mat4.rotateZ(this.tempMat4, this.tempMat4, rotation);
            mat4.scale(this.tempMat4, this.tempMat4, scale);
            this.canvasRender.setLocalTransForm(this.tempMat4);
            this.canvasRender.setGlobalAlpha(layer.layerColor[3]);
            this.canvasRender.drawImage(image, 0.0, 0.0, image.width, image.height, 0.0, 0.0, image.width, image.height);
            this.canvasRender.cancelLocalTransForm();
            this.canvasRender.setGlobalAlpha(1.0);
        }
        drawBackground(viewKeyFrameLayer, documentData, isExporting, isModalToolRunning) {
            let layer = viewKeyFrameLayer.layer;
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                let vectorLayer = layer;
                let geometry = viewKeyFrameLayer.vectorLayerKeyframe.geometry;
                this.drawBackground_VectorLayer(vectorLayer, geometry, documentData, isExporting, isModalToolRunning);
            }
        }
        drawBackground_VectorLayer(layer, geometry, documentData, isExporting, isModalToolRunning) {
            let env = this.toolEnv;
            let useAdjustingLocation = isModalToolRunning;
            let fillColor = this.getFillColor(layer, documentData, env, true);
            for (let group of geometry.groups) {
                let continuousFill = false;
                for (let line of group.lines) {
                    if (layer.fillAreaType != ManualTracingTool.FillAreaTypeID.none) {
                        this.drawVectorLineFill(line, fillColor, useAdjustingLocation, continuousFill);
                        continuousFill = line.continuousFill;
                    }
                }
            }
        }
        drawLayerByCanvas(viewKeyFrameLayer, documentData, isExporting, isModalToolRunning) {
            let layer = viewKeyFrameLayer.layer;
            if (ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                let vectorLayer = layer;
                this.drawVectorLayer(vectorLayer, viewKeyFrameLayer.vectorLayerKeyframe.geometry, documentData, isExporting, isModalToolRunning);
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                let ifrLayer = layer;
                this.drawForeground_ImageFileReferenceLayer(ifrLayer, isModalToolRunning);
            }
            else {
                // No drawing
            }
        }
        drawVectorLayer(layer, geometry, documentData, isExporting, isModalToolRunning) {
            let context = this.toolContext;
            let env = this.toolEnv;
            let isSelectedLayer = ManualTracingTool.Layer.isSelected(layer);
            let isEditMode = env.isEditMode();
            // drawing parameters
            let widthRate = context.document.lineWidthBiasRate;
            let lineColor = this.getLineColor(layer, documentData, env, true);
            let fillColor = this.getFillColor(layer, documentData, env, true);
            vec4.copy(this.editOtherLayerLineColor, lineColor);
            this.editOtherLayerLineColor[3] *= 0.3;
            if (isEditMode) {
                lineColor = this.editOtherLayerLineColor;
            }
            // drawing geometry lines
            let useAdjustingLocation = isModalToolRunning;
            for (let group of geometry.groups) {
                let continuousFill = false;
                for (let line of group.lines) {
                    if (layer.fillAreaType != ManualTracingTool.FillAreaTypeID.none) {
                        this.drawVectorLineFill(line, fillColor, useAdjustingLocation, continuousFill);
                        continuousFill = line.continuousFill;
                    }
                }
            }
            for (let group of geometry.groups) {
                if (layer.drawLineType != ManualTracingTool.DrawLineTypeID.none) {
                    for (let line of group.lines) {
                        this.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation, isExporting);
                    }
                }
            }
        }
        drawVectorLayerForEditMode(layer, geometry, documentData, drawStrokes, drawPoints, isModalToolRunning) {
            let context = this.toolContext;
            let env = this.toolEnv;
            let isSelectedLayer = ManualTracingTool.Layer.isSelected(layer);
            // drawing parameters
            let widthRate = context.document.lineWidthBiasRate;
            let lineColor = this.getLineColor(layer, documentData, env, !isSelectedLayer);
            // drawing geometry lines
            let useAdjustingLocation = isModalToolRunning;
            for (let group of geometry.groups) {
                for (let line of group.lines) {
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
                                let color;
                                if ((line.isSelected && line.modifyFlag != ManualTracingTool.VectorLineModifyFlagID.selectedToUnselected)
                                    || line.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.unselectedToSelected) {
                                    color = this.drawStyle.selectedVectorLineColor;
                                }
                                else {
                                    color = lineColor;
                                }
                                let lineWidthBolding = (line.isCloseToMouse ? 2.0 : 0.0);
                                this.drawVectorLineStroke(line, color, widthRate, lineWidthBolding, useAdjustingLocation, false);
                            }
                        }
                    }
                }
            }
        }
        drawVectorLineStroke(line, color, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation, isExporting) {
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
        }
        drawVectorLinePoints(line, color, useAdjustingLocation) {
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
            for (let point of line.points) {
                this.drawVectorLinePoint(point, this.tempEditorLinePointColor2, useAdjustingLocation);
            }
        }
        lineWidthAdjust(width) {
            //return Math.floor(width * 5) / 5;
            return width;
        }
        drawVectorLineFill(line, color, useAdjustingLocation, isFillContinuing) {
            if (line.points.length <= 1) {
                return;
            }
            if (!isFillContinuing) {
                this.canvasRender.setLineCap(ManualTracingTool.CanvasRenderLineCap.round);
                this.canvasRender.beginPath();
                this.canvasRender.setFillColorV(color);
            }
            let startIndex = 0;
            let endIndex = line.points.length - 1;
            // search first visible point
            let firstIndex = -1;
            for (let i = startIndex; i <= endIndex; i++) {
                let point = line.points[i];
                if (point.modifyFlag != ManualTracingTool.LinePointModifyFlagID.delete) {
                    firstIndex = i;
                    break;
                }
            }
            if (firstIndex == -1) {
                return;
            }
            // set first location
            let firstPoint = line.points[firstIndex];
            let firstLocation = (useAdjustingLocation ? firstPoint.adjustingLocation : firstPoint.location);
            if (isFillContinuing) {
                this.canvasRender.lineTo(firstLocation[0], firstLocation[1]);
            }
            else {
                this.canvasRender.moveTo(firstLocation[0], firstLocation[1]);
            }
            let currentLineWidth = this.lineWidthAdjust(firstPoint.lineWidth);
            this.canvasRender.setStrokeWidth(currentLineWidth);
            for (let i = 1; i < line.points.length; i++) {
                let point = line.points[i];
                if (point.modifyFlag == ManualTracingTool.LinePointModifyFlagID.delete) {
                    continue;
                }
                let location = (useAdjustingLocation ? point.adjustingLocation : point.location);
                this.canvasRender.lineTo(location[0], location[1]);
            }
            if (!line.continuousFill) {
                this.canvasRender.fill();
            }
        }
        drawVectorLineSegment(line, startIndex, endIndex, strokeWidthBiasRate, strokeWidthBolding, useAdjustingLocation) {
            if (line.points.length < 2) {
                return;
            }
            //line.points[0].lengthFrom = 0.0;
            //line.points[0].lengthTo = 0.5;
            //line.points[line.points.length - 2].lineWidth = 2.3;
            //line.points[line.points.length - 2].lengthFrom = 0.3;
            //line.points[line.points.length - 2].lengthTo = 0.6;
            this.canvasRender.setLineCap(ManualTracingTool.CanvasRenderLineCap.round);
            let firstPoint = line.points[startIndex];
            let currentLineWidth = -1.0;
            let strokeStarted = false;
            let drawingRemainging = false;
            for (let pointIndex = startIndex; pointIndex < endIndex;) {
                let fromPoint = line.points[pointIndex];
                let fromLocation = (useAdjustingLocation ? fromPoint.adjustingLocation : fromPoint.location);
                let toPoint = line.points[pointIndex + 1];
                let toLocation = (useAdjustingLocation ? toPoint.adjustingLocation : toPoint.location);
                let lineWidth = (useAdjustingLocation ? fromPoint.adjustingLineWidth : fromPoint.lineWidth);
                let isVisibleWidth = (lineWidth > 0.0);
                //let isVisibleSegment = (fromPoint.lengthFrom != 0.0 || fromPoint.lengthTo != 0.0);
                let lengthFrom = (useAdjustingLocation ? fromPoint.adjustingLengthFrom : 1.0);
                let lengthTo = (useAdjustingLocation ? fromPoint.adjustingLengthTo : 0.0);
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
        }
        drawVectorLinePoint(point, color, useAdjustingLocation) {
            let viewScale = this.canvasRender.getViewScale();
            this.canvasRender.beginPath();
            let radius = this.drawStyle.generalLinePointRadius / viewScale;
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
        }
        drawEditLineStroke(line) {
            this.drawVectorLineStroke(line, this.drawStyle.editingLineColor, 1.0, 2.0, false, false);
        }
        drawEditLinePoints(canvasWindow, line, color) {
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.setStrokeColorV(color);
            this.canvasRender.setFillColorV(color);
            for (let point of line.points) {
                this.drawVectorLinePoint(point, color, false);
            }
        }
        getLineColor(layer, documentData, env, hideWhenEditMode) {
            let color;
            if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.layerColor) {
                color = layer.layerColor;
            }
            else if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.paletteColor) {
                let paletteColor = documentData.paletteColors[layer.line_PaletteColorIndex];
                color = paletteColor.color;
            }
            else {
                color = layer.layerColor;
            }
            if (hideWhenEditMode && env.isEditMode()) {
                vec4.copy(this.editOtherLayerLineColor, color);
                this.editOtherLayerLineColor[3] *= 0.3;
                color = this.editOtherLayerLineColor;
            }
            return color;
        }
        getFillColor(layer, documentData, env, hideWhenEditMode) {
            let color;
            if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.fillColor) {
                color = layer.fillColor;
            }
            else if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.paletteColor) {
                let paletteColor = documentData.paletteColors[layer.fill_PaletteColorIndex];
                color = paletteColor.color;
            }
            else {
                color = layer.fillColor;
            }
            if (hideWhenEditMode && env.isEditMode()) {
                vec4.copy(this.editOtherLayerLineColor, color);
                this.editOtherLayerLineColor[3] *= 0.3;
                color = this.editOtherLayerLineColor;
            }
            return color;
        }
        getCurrentViewScaleLineWidth(width) {
            return width / this.canvasRender.getViewScale();
        }
        getViewScaledSize(width) {
            return width / this.canvasRender.getViewScale();
        }
        pickLayer(canvasWindow, viewKeyframe, pickLocationX, pickLocationY) {
            let documentData = this.toolContext.document;
            let pickedLayer = null;
            for (let viewKeyframeLayer of viewKeyframe.layers) {
                let layer = viewKeyframeLayer.layer;
                if (!ManualTracingTool.Layer.isVisible(layer) || !ManualTracingTool.VectorLayer.isVectorLayer(layer)) {
                    continue;
                }
                let vectorLayer = layer;
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
        }
        drawOperatorCursor() {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.operatorCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            let viewScale = this.getViewScaledSize(1.0);
            this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
            this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
            this.canvasRender.setLineDash(this.operatorCurosrLineDashScaled);
            this.canvasRender.circle(this.toolContext.operatorCursor.location[0], this.toolContext.operatorCursor.location[1], this.toolContext.operatorCursor.radius * viewScale);
            this.canvasRender.stroke();
            let centerX = this.toolContext.operatorCursor.location[0];
            let centerY = this.toolContext.operatorCursor.location[1];
            let clossBeginPosition = this.toolContext.operatorCursor.radius * viewScale * 1.5;
            let clossEndPosition = this.toolContext.operatorCursor.radius * viewScale * 0.5;
            this.canvasRender.drawLine(centerX - clossBeginPosition, centerY, centerX - clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX + clossBeginPosition, centerY, centerX + clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX, centerY - clossBeginPosition, centerX, centerY - clossEndPosition);
            this.canvasRender.drawLine(centerX, centerY + clossBeginPosition, centerX, centerY + clossEndPosition);
            this.canvasRender.setLineDash(this.operatorCurosrLineDashNone);
        }
        // Rendering
        renderClearBuffer(wnd) {
            let render = this.drawGPURender;
            render.setViewport(0.0, 0.0, wnd.width, wnd.height);
            render.setDepthTest(true);
            render.setCulling(true);
            render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);
        }
        renderForeground_VectorLayer(wnd, viewKeyFrameLayer, documentData, useAdjustingLocation) {
            let env = this.toolEnv;
            let render = this.drawGPURender;
            let shader = this.lineShader;
            let keyframe = viewKeyFrameLayer.vectorLayerKeyframe;
            let layer = viewKeyFrameLayer.layer;
            render.setViewport(0.0, 0.0, wnd.width, wnd.height);
            // Calculate camera matrix
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 1.0, 0.0);
            vec3.set(this.eyeLocation, 0.0, 0.0, 1.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            let aspect = wnd.height / wnd.width;
            let orthoWidth = wnd.width / 2 / wnd.viewScale * aspect; // TODO: 計算が怪しい（なぜか縦横両方に同じ値を掛けないと合わない）ので後で検討する
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
            let lineColor = this.getLineColor(layer, documentData, env, false);
            //if (env.isEditMode()) {
            //    vec4.copy(this.editOtherLayerLineColor, lineColor);
            //    this.editOtherLayerLineColor[3] *= 0.3;
            //    lineColor = this.editOtherLayerLineColor;
            //}
            for (let group of keyframe.geometry.groups) {
                // Calculate line point buffer data
                if (!group.buffer.isStored) {
                    console.log(`Calculate line point buffer data`);
                    this.logic_GPULine.copyGroupPointDataToBuffer(group, documentData.lineWidthBiasRate, useAdjustingLocation);
                    let vertexUnitSize = shader.getVertexUnitSize();
                    let vertexCount = shader.getVertexCount(group.buffer.pointCount); // 本当は辺の数だけでよいので若干無駄は生じるが、計算を簡単にするためこれでよいことにする
                    this.logic_GPULine.allocateBuffer(group.buffer, vertexCount, vertexUnitSize, render.gl);
                    shader.calculateBufferData(group.buffer, this.logic_GPULine);
                    if (group.buffer.usedDataArraySize > 0) {
                        this.logic_GPULine.bufferData(group.buffer, render.gl);
                    }
                }
                // Draw lines
                if (group.buffer.isStored) {
                    this.lineShader.setBuffers(group.buffer.buffer, lineColor);
                    let drawCount = this.lineShader.getDrawArrayTryanglesCount(group.buffer.usedDataArraySize);
                    render.drawArrayTryangles(drawCount);
                }
            }
        }
        // WebGL window
        drawPosing3DView(webglWindow, layerWindowItems, mainWindow, pickingWindow) {
            let env = this.toolEnv;
            this.posing3DViewRender.setViewport(0.0, 0.0, webglWindow.width, webglWindow.height);
            this.posing3dView.clear(env);
            //mainWindow.copyTransformTo(pickingWindow);
            mainWindow.copyTransformTo(webglWindow);
            for (let item of layerWindowItems) {
                if (item.layer.type != ManualTracingTool.LayerTypeID.posingLayer) {
                    continue;
                }
                let posingLayer = item.layer;
                this.posing3dView.prepareDrawingStructures(posingLayer);
            }
            if (env.currentPosingLayer != null && ManualTracingTool.Layer.isVisible(env.currentPosingLayer)
                && this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing) {
                let posingLayer = env.currentPosingLayer;
                // this.posing3dView.prepareDrawingStructures(posingLayer);
                //this.posing3dView.drawPickingImage(posingLayer, env);
                //pickingWindow.context.clearRect(0, 0, pickingWindow.width, pickingWindow.height);
                //pickingWindow.context.drawImage(webglWindow.canvas, 0, 0, webglWindow.width, webglWindow.height);
                //this.posing3dView.clear(env);
                this.posing3dView.drawManipulaters(posingLayer, env);
            }
            for (let index = layerWindowItems.length - 1; index >= 0; index--) {
                let item = layerWindowItems[index];
                if (item.layer.type != ManualTracingTool.LayerTypeID.posingLayer) {
                    continue;
                }
                let posingLayer = item.layer;
                //this.posing3dView.prepareDrawingStructures(posingLayer);
                this.posing3dView.drawPosingModel(posingLayer, env);
            }
        }
        // Layer window
        layerWindow_CaluculateLayout(wnd) {
            // layer item buttons
            wnd.layerWindowLayoutArea.copyRectangle(wnd);
            wnd.layerWindowLayoutArea.bottom = wnd.height - 1.0;
            this.layerWindow_CaluculateLayout_CommandButtons(wnd, wnd.layerWindowLayoutArea);
            if (wnd.layerWindowCommandButtons.length > 0) {
                let lastButton = wnd.layerWindowCommandButtons[wnd.layerWindowCommandButtons.length - 1];
                wnd.layerWindowLayoutArea.top = lastButton.getHeight() + 1.0; // lastButton.bottom + 1.0;
            }
            // layer items
            this.layerWindow_CaluculateLayout_LayerWindowItem(wnd, wnd.layerWindowLayoutArea);
        }
        layerWindow_CaluculateLayout_CommandButtons(wnd, layoutArea) {
            let x = layoutArea.left;
            let y = wnd.viewLocation[1]; // layoutArea.top;
            let unitWidth = wnd.layerItemButtonWidth * wnd.layerItemButtonScale;
            let unitHeight = wnd.layerItemButtonHeight * wnd.layerItemButtonScale;
            wnd.layerCommandButtonButtom = unitHeight + 1.0;
            for (let button of wnd.layerWindowCommandButtons) {
                button.left = x;
                button.right = x + unitWidth - 1;
                button.top = y;
                button.bottom = y + unitHeight - 1;
                x += unitWidth;
                wnd.layerItemButtonButtom = button.bottom + 1.0;
            }
        }
        layerWindow_CaluculateLayout_LayerWindowItem(wnd, layoutArea) {
            let currentY = layoutArea.top;
            let itemHeight = wnd.layerItemHeight;
            let margine = itemHeight * 0.1;
            let iconWidth = (itemHeight - margine * 2);
            let textLeftMargin = itemHeight * 0.3;
            for (let item of wnd.layerWindowItems) {
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
        }
        drawLayerWindow(wnd) {
            this.canvasRender.setContext(wnd);
            this.drawLayerWindow_LayerItems(wnd);
            this.drawLayerWindow_LayerWindowButtons(wnd);
        }
        drawLayerWindow_LayerWindowButtons(wnd) {
            this.layerWindow_CaluculateLayout_CommandButtons(wnd, wnd.layerWindowLayoutArea);
            if (wnd.layerWindowCommandButtons.length > 0) {
                let button = wnd.layerWindowCommandButtons[0];
                this.canvasRender.setFillColorV(this.drawStyle.layerWindowBackgroundColor);
                this.canvasRender.fillRect(0.0, button.top, wnd.width - 1, button.getHeight());
            }
            for (let button of wnd.layerWindowCommandButtons) {
                this.drawButtonImage(button);
            }
        }
        drawLayerWindow_LayerItems(wnd) {
            for (let item of wnd.layerWindowItems) {
                this.drawLayerWindowItem(item, wnd.layerItemFontSize);
            }
        }
        drawLayerWindowItem(item, fontSize) {
            let layer = item.layer;
            let left = item.left;
            let top = item.top;
            let bottom = item.bottom;
            let itemWidth = item.getWidth();
            let itemHeight = item.getHeight();
            let bottomMargin = itemHeight * 0.3;
            let depthOffset = 10.0 * item.hierarchyDepth;
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
            let srcImage = this.systemImage.image;
            let iconIndex = (ManualTracingTool.Layer.isVisible(item.layer) ? 0.0 : 1.0);
            let srcWidth = srcImage.width * 0.125;
            let srcHeight = srcImage.height * 0.125;
            let srcX = srcWidth * iconIndex;
            let srcY = srcImage.height * 0.25;
            let dstX = item.marginLeft;
            let dstY = top + item.marginTop;
            let dstWidth = item.visibilityIconWidth;
            let dstHeigh = item.visibilityIconWidth;
            this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeigh);
            // Text
            this.canvasRender.setFontSize(fontSize);
            this.canvasRender.setFillColor(0.0, 0.0, 0.0, 1.0);
            this.canvasRender.fillText(layer.name, item.textLeft + depthOffset, bottom - bottomMargin);
        }
        // Timeline window
        drawTimeLineWindow_CommandButtons(wnd, animationPlaying) {
            // Play / Stop
            {
                let srcX = 0;
                let srcY = 196;
                let srcW = 128;
                let srcH = 128;
                let dstW = 45;
                let dstH = 45;
                let dstX = wnd.getTimeLineLeft() / 2 - dstW / 2 + 1;
                let dstY = wnd.height / 2 - dstH / 2 + 1;
                if (animationPlaying) {
                    srcX = 128;
                }
                this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
            }
        }
        drawTimeLineWindow_TimeLine(wnd, documentData, viewKeyframes, currentVectorLayer) {
            let aniSetting = documentData.animationSettingData;
            let left = wnd.getTimeLineLeft();
            let right = wnd.getTimeLineRight();
            let bottom = wnd.height;
            let frameUnitWidth = wnd.getFrameUnitWidth(aniSetting);
            let frameNumberHeight = 16.0;
            let frameLineBottom = wnd.height - 1.0 - frameNumberHeight;
            let frameLineHeight = 10.0;
            let secondFrameLineHeight = 30.0;
            // Current frame
            let currentFrameX = left - aniSetting.timeLineWindowViewLocationX + aniSetting.currentTimeFrame * frameUnitWidth;
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setFillColorV(this.drawStyle.timeLineCurrentFrameColor);
            this.canvasRender.fillRect(currentFrameX, 0.0, frameUnitWidth, bottom);
            //aniSetting.maxFrame = 60;
            //aniSetting.loopStartFrame = 10;
            //aniSetting.loopEndFrame = 24;
            // Document keyframes
            let minFrame = wnd.getFrameByLocation(left, aniSetting);
            if (minFrame < 0) {
                minFrame = 0;
            }
            let maxFrame = wnd.getFrameByLocation(right, aniSetting);
            if (maxFrame > aniSetting.maxFrame) {
                maxFrame = aniSetting.maxFrame;
            }
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setFillColorV(this.drawStyle.timeLineKeyFrameColor);
            for (let viewKeyframe of viewKeyframes) {
                let frame = viewKeyframe.frame;
                if (frame < minFrame) {
                    continue;
                }
                if (frame > maxFrame) {
                    break;
                }
                let frameX = wnd.getFrameLocation(frame, aniSetting);
                this.canvasRender.fillRect(frameX, 0.0, frameUnitWidth - 1.0, frameLineBottom);
            }
            // Loop part
            this.canvasRender.setFillColorV(this.drawStyle.timeLineOutOfLoopingColor);
            {
                let frameX = wnd.getFrameLocation(aniSetting.loopStartFrame, aniSetting);
                if (frameX > left) {
                    this.canvasRender.fillRect(left, 0.0, frameX - left, bottom);
                }
            }
            {
                let frameX = wnd.getFrameLocation(aniSetting.loopEndFrame, aniSetting);
                if (frameX < right) {
                    this.canvasRender.fillRect(frameX, 0.0, right - frameX, bottom);
                }
            }
            // Layer keyframes
            this.canvasRender.setStrokeWidth(1.0);
            this.canvasRender.setFillColorV(this.drawStyle.timeLineLayerKeyFrameColor);
            if (currentVectorLayer != null) {
                let viewKeyFrame = ManualTracingTool.ViewKeyframe.findViewKeyframe(viewKeyframes, aniSetting.currentTimeFrame);
                let layerIndex = -1;
                if (viewKeyFrame != null) {
                    layerIndex = ManualTracingTool.ViewKeyframe.findViewKeyframeLayerIndex(viewKeyFrame, currentVectorLayer);
                }
                if (layerIndex != -1) {
                    for (let viewKeyframe of viewKeyframes) {
                        let frame = viewKeyframe.frame;
                        if (frame < minFrame) {
                            continue;
                        }
                        if (frame > maxFrame) {
                            break;
                        }
                        let viewKeyFrameLayer = viewKeyframe.layers[layerIndex];
                        if (viewKeyFrameLayer.vectorLayerKeyframe.frame == frame) {
                            let frameX = wnd.getFrameLocation(frame, aniSetting);
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
                let x = left;
                for (let frame = minFrame; frame <= maxFrame; frame++) {
                    if (frame % aniSetting.animationFrameParSecond == 0 || frame == maxFrame) {
                        this.canvasRender.drawLine(x, frameLineBottom - secondFrameLineHeight, x, frameLineBottom);
                    }
                    this.canvasRender.drawLine(x, frameLineBottom - frameLineHeight, x, frameLineBottom);
                    x += frameUnitWidth;
                }
            }
            this.canvasRender.drawLine(left, frameLineBottom, right, frameLineBottom);
        }
        // PaletteSelector window
        paletteSelector_CaluculateLayout() {
            this.paletteSelector_CaluculateLayout_CommandButtons();
            this.paletteSelector_CaluculateLayout_PaletteItems();
        }
        paletteSelector_CaluculateLayout_CommandButtons() {
            let wnd = this.paletteSelectorWindow;
            let context = this.toolContext;
            let env = this.toolEnv;
            let x = 0.0;
            let y = 0.0;
            let unitWidth = wnd.buttonWidth * wnd.buttonScale;
            let unitHeight = wnd.buttonHeight * wnd.buttonScale;
            for (let layoutArea of wnd.commandButtonAreas) {
                layoutArea.left = x;
                layoutArea.top = y;
                layoutArea.right = x + unitWidth - 1;
                layoutArea.bottom = y + unitHeight - 1;
                x += unitWidth;
            }
            wnd.commandButtonsBottom = y + unitHeight + wnd.buttonBottomMargin;
        }
        paletteSelector_CaluculateLayout_PaletteItems() {
            let wnd = this.paletteSelectorWindow;
            let context = this.toolContext;
            let env = this.toolEnv;
            let x = wnd.leftMargin;
            let y = wnd.commandButtonsBottom;
            let itemWidth = wnd.itemWidth * wnd.itemScale;
            let itemHeight = wnd.itemHeight * wnd.itemScale;
            let viewWidth = wnd.width;
            wnd.itemAreas = new List();
            for (let paletteColorIndex = 0; paletteColorIndex < ManualTracingTool.DocumentData.maxPaletteColors; paletteColorIndex++) {
                let layoutArea = new ManualTracingTool.RectangleLayoutArea();
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
        }
        drawPaletteSelectorWindow_CommandButtons(wnd) {
            for (let layoutArea of wnd.commandButtonAreas) {
                let isSelected = (wnd.currentTargetID == layoutArea.index);
                this.drawButtonBackground(layoutArea, isSelected);
                this.drawButtonImage(layoutArea);
            }
        }
        drawPaletteSelectorWindow_PaletteItems(wnd, documentData, currentVectorLayer) {
            this.canvasRender.setContext(wnd);
            let viewWidth = wnd.width;
            let currentPaletteColorIndex = -1;
            if (currentVectorLayer != null) {
                if (wnd.currentTargetID == ManualTracingTool.PaletteSelectorWindowButtonID.lineColor) {
                    currentPaletteColorIndex = currentVectorLayer.line_PaletteColorIndex;
                }
                else if (wnd.currentTargetID == ManualTracingTool.PaletteSelectorWindowButtonID.fillColor) {
                    currentPaletteColorIndex = currentVectorLayer.fill_PaletteColorIndex;
                }
            }
            for (let layoutArea of wnd.itemAreas) {
                let paletteColorIndex = layoutArea.index;
                if (paletteColorIndex > documentData.paletteColors.length) {
                    break;
                }
                let x = layoutArea.left;
                let y = layoutArea.top;
                let itemWidth = layoutArea.getWidth() - wnd.itemRightMargin;
                let itemHeight = layoutArea.getHeight() - wnd.itemBottomMargin;
                let paletteColor = documentData.paletteColors[paletteColorIndex];
                this.canvasRender.setFillColorV(paletteColor.color);
                this.canvasRender.setStrokeColorV(this.drawStyle.paletteSelectorItemEdgeColor);
                this.canvasRender.fillRect(x + 0.5, y + 0.5, itemWidth, itemHeight);
                this.canvasRender.setStrokeWidth(1.0);
                this.canvasRender.drawRectangle(x + 0.5, y + 0.5, itemWidth, itemHeight);
                if (paletteColorIndex == currentPaletteColorIndex) {
                    this.canvasRender.setStrokeWidth(1.5);
                    this.canvasRender.drawRectangle(x + 0.5 - 1.0, y + 0.5 - 1.0, itemWidth + 2.0, itemHeight + 2.0);
                }
            }
        }
        drawColorMixerWindow_SetInputControls() {
            let wnd = this.paletteSelectorWindow;
            let context = this.toolContext;
            let env = this.toolEnv;
            let documentData = context.document;
            let color = this.getPaletteSelectorWindow_CurrentColor();
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
        }
        drawPaletteColorMixer(wnd) {
            let width = wnd.width;
            let height = wnd.height;
            let left = 0.0;
            let top = 0.0;
            let right = width - 1.0;
            let bottom = height - 1.0;
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
            let divisionW = 40.0;
            let divisionH = 25.0;
            let unitWidth = Math.floor(width / divisionW);
            let unitHeight = Math.floor(height / divisionH);
            let drawX = 0.0;
            for (let x = 0; x <= divisionW; x++) {
                let drawY = 0.0;
                for (let y = 1; y <= divisionH; y++) {
                    let h = x / divisionW;
                    let s = 0.0;
                    let v = 0.0;
                    let iy = y / divisionH;
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
        }
    }
    ManualTracingTool.App_Drawing = App_Drawing;
    class GPULineShader extends RenderShader {
        getVertexUnitSize() {
            return -1;
        }
        getVertexCount(pointCount) {
            return -1;
        }
        getDrawArrayTryanglesCount(bufferSize) {
            return bufferSize / this.getVertexUnitSize();
        }
        setBuffers(buffer, color) {
        }
        calculateBufferData(buffer, logic_GPULine) {
        }
    }
    class PolyLineShader extends GPULineShader {
        constructor() {
            super(...arguments);
            this.uColor = null;
            this.aPosition = -1;
        }
        getVertexUnitSize() {
            return (2 // 頂点の位置 vec2
            );
        }
        getVertexCount(pointCount) {
            return (pointCount - 1) * (2 + 2) * 3; // 辺の数 * 左側２ポリゴン＋右側２ポリゴン * 3頂点
        }
        initializeVertexSourceCode() {
            this.vertexShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

attribute vec2 aPosition;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

void main(void) {

	   gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);
}
`;
        }
        initializeFragmentSourceCode() {
            this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

uniform vec4 uColor;

void main(void) {

    gl_FragColor = uColor;
}
`;
        }
        initializeAttributes() {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PolyLineShader();
        }
        initializeAttributes_PolyLineShader() {
            this.uColor = this.getUniformLocation('uColor');
            this.aPosition = this.getAttribLocation('aPosition');
        }
        setBuffers(buffer, color) {
            let gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();
            gl.uniform4fv(this.uColor, color);
            let vertexDataStride = 4 * this.getVertexUnitSize();
            this.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, vertexDataStride);
        }
        calculateBufferData(buffer, logic_GPULine) {
            logic_GPULine.calculateLinePointEdges(buffer);
            logic_GPULine.calculateBufferData_PloyLine(buffer);
        }
    }
    ManualTracingTool.PolyLineShader = PolyLineShader;
    class BezierLineShader extends GPULineShader {
        constructor() {
            super(...arguments);
            this.uColor = null;
            this.aPosition = -1;
            this.aLocalPosition = -1;
            this.aLinePoint1 = -1;
            this.aControlPoint1 = -1;
            this.aLinePoint2 = -1;
            this.aControlPoint2 = -1;
            this.aLinePoint1R = -1;
            this.aControlPoint1R = -1;
            this.aLinePoint2R = -1;
            this.aControlPoint2R = -1;
            this.aWidth = -1;
        }
        // private aAlpha = -1;
        getVertexUnitSize() {
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
        }
        getVertexCount(pointCount) {
            return (pointCount - 1) * (4 + 4) * 3; // 辺の数 * (左側４ポリゴン＋右側４ポリゴン) * 3頂点
        }
        initializeVertexSourceCode() {
            this.vertexShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

attribute vec2 aPosition;
attribute vec3 aLocalPosition;

attribute vec2 aLinePoint1;
attribute vec2 aControlPoint1;
attribute vec2 aControlPoint2;
attribute vec2 aLinePoint2;

attribute vec2 aLinePoint1R;
attribute vec2 aControlPoint1R;
attribute vec2 aControlPoint2R;
attribute vec2 aLinePoint2R;

attribute vec2 aWidth;
// attribute vec2 aAlpha;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

varying vec3 vLocalPosition;

varying vec2 vLinePoint1;
varying vec2 vControlPoint1;
varying vec2 vControlPoint2;
varying vec2 vLinePoint2;

varying vec2 vLinePoint1R;
varying vec2 vControlPoint1R;
varying vec2 vControlPoint2R;
varying vec2 vLinePoint2R;

varying vec2 vWidth;
// varying vec2 vAlpha;

void main(void) {

    gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);

    vLocalPosition = aLocalPosition;

    vLinePoint1 = aLinePoint1;
    vControlPoint1 = aControlPoint1;
    vControlPoint2 = aControlPoint2;
    vLinePoint2 = aLinePoint2;

    vLinePoint1R = aLinePoint1R;
    vControlPoint1R = aControlPoint1R;
    vControlPoint2R = aControlPoint2R;
    vLinePoint2R = aLinePoint2R;

    vWidth = aWidth;
    // vAlpha = aAlpha;
}
`;
        }
        initializeFragmentSourceCode() {
            this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

float cubeRoot(float x) {

    float res = pow(abs(x), 1.0 / 3.0);
    return (x >= 0.0) ? res : -res;
}

void solveQuadraticEquation(out vec3 solution, float a, float b, float c) {

    float d;
    float x1;
    float x2;

    if (a == 0.0) {

        solution[0] = -c / b;
        solution[1] = -1.0;
        return;
    }

    d = b * b - 4.0 * a * c;

    if (d > 0.0) {

        if (b < 0.0) {

            x1 = (-b - sqrt(d)) / 2.0 / a;
            x2 = -b / a - x1;
        }
        else {

            x1 = (-b + sqrt(d)) / 2.0 / a;
            x2 = -b / a - x1;
        }

        solution[0] = x1;
        solution[1]= x2;
    }
    else if (d == 0.0) {

        solution[0] = -b / 2.0 / a;
        solution[1] = -1.0;
    }
    else {

        // imaginary root
    }
}

void solveCubicEquation(out vec3 solution, float a, float b, float c, float d) {

    float PI = 3.14159265358979323846264;
    float p;
    float q;
    float t;
    float a3;
    float b3;

    if (a == 0.0) {;
        solveQuadraticEquation(solution, b, c, d);
        return;
    }

    b /= 3.0 * a;
    c /= a;
    d /= a;
    p = b * b - c / 3.0;
    q = (b * (c - 2.0 * b * b) - d) / 2.0;

    a = q * q - p * p * p;

    if (a == 0.0) {
  
        q = cubeRoot(q);
        solution[0] = 2.0 * q - b;
        solution[1] = -q - b;
        solution[2] = -1.0;
    }
    else if (a > 0.0) {

        float sign = 1.0;
        if (q <= 0.0) { sign = -1.0; }
        a3 = cubeRoot(q + (sign) * sqrt(a));
        b3 = p / a3;
        solution[0] = a3 + b3 - b;
        solution[1] = -1.0;
        solution[2] = -1.0;
    }
    else {
  
        a = 2.0 * sqrt(p);
        t = acos(q / (p * a / 2.0));
        solution[0] = a * cos(t / 3.0) - b;
        solution[1] = a * cos((t + 2.0 * PI) / 3.0) - b;
        solution[2] = a * cos((t + 4.0 * PI) / 3.0) - b;
    }
}

float calcBezierTimeInSection(float x1, float x2, float x3, float x4, float targetX) {

    vec3 solution = vec3(0.0, 0.0, 0.0);
    float a = x4 - 3.0 * (x3 - x2) - x1;
    float b = 3.0 * (x3 - 2.0 * x2 + x1);
    float c = 3.0 * (x2 - x1);
    float d = x1 - targetX;

    solveCubicEquation(solution, a, b, c, d);

    if (solution[0] >= -0.1 && solution[0] <= 1.0) {

        return solution[0];
    }
    else if (solution[1] >= 0.0 && solution[1] <= 1.0) {

        return solution[1];
    }
    else if (solution[2] >= 0.0 && solution[2] <= 1.0) {

        return solution[2];
    }
    else {

        return -1.0;
    }
}

float calcInterpolationBezier(float x1, float x2, float x3, float x4, float t) {

    return (1.0 - t) * (1.0 - t) * (1.0 - t) * x1 +
        3.0 * (1.0 - t) * (1.0 - t) * t * x2 +
        3.0 * (1.0 - t) * t * t * x3 +
        t * t * t * x4;
}

uniform vec4 uColor;

varying vec3 vLocalPosition;

varying vec2 vLinePoint1;
varying vec2 vControlPoint1;
varying vec2 vControlPoint2;
varying vec2 vLinePoint2;

varying vec2 vLinePoint1R;
varying vec2 vControlPoint1R;
varying vec2 vControlPoint2R;
varying vec2 vLinePoint2R;

varying vec2 vWidth;
// varying vec2 vAlpha;

void main(void) {

    float t1 = calcBezierTimeInSection(
        vLinePoint1.x,
        vControlPoint1.x,
        vControlPoint2.x,
        vLinePoint2.x,
        vLocalPosition.x
    );

    float y1;

    if (t1 >= 0.0) {

        y1 = calcInterpolationBezier(
            vLinePoint1.y,
            vControlPoint1.y,
            vControlPoint2.y,
            vLinePoint2.y,
            t1
        );
    }
    else {

        y1 = vLocalPosition.y + 1.0;
    }

    float t2 = calcBezierTimeInSection(
        vLinePoint1R.x,
        vControlPoint1R.x,
        vControlPoint2R.x,
        vLinePoint2R.x,
        vLocalPosition.x
    );

    float y2;

    if (t2 >= 0.0) {

        y2 = calcInterpolationBezier(
            vLinePoint1R.y,
            vControlPoint1R.y,
            vControlPoint2R.y,
            vLinePoint2R.y,
            t2
        );
    }
    else {

        y2 = vLocalPosition.y - 1.0;
    }

    float col = (vLocalPosition.y <= y1 && vLocalPosition.y >= y2)? 1.0 : 0.0;

    gl_FragColor = vec4(uColor.rgb, col * uColor.a);
//    gl_FragColor = vec4(0.0, 0.0, 0.0, col * mix(vAlpha[0], vAlpha[1], vLocalPosition.z));
//    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);
}
`;
        }
        initializeAttributes() {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PolyLineShader();
        }
        initializeAttributes_PolyLineShader() {
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
        }
        setBuffers(buffer, color) {
            let gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();
            gl.uniform4fv(this.uColor, color);
            let vertexDataStride = 4 * this.getVertexUnitSize();
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
        }
        calculateBufferData(buffer, logic_GPULine) {
            logic_GPULine.calculateLinePointEdges(buffer);
            logic_GPULine.calculateLinePointBezierLocation(buffer);
            logic_GPULine.calculateControlPointVertexLocations(buffer);
            logic_GPULine.calculateBufferData_BezierLine(buffer);
        }
    }
    ManualTracingTool.BezierLineShader = BezierLineShader;
    class BezierDistanceLineShader extends GPULineShader {
        constructor() {
            super(...arguments);
            this.uColor = null;
            this.aPosition = -1;
            this.aLocalPosition = -1;
            this.aLinePoint1 = -1;
            this.aControlPoint1 = -1;
            this.aLinePoint2 = -1;
            this.aControlPoint2 = -1;
            this.aLinePoint1R = -1;
            this.aControlPoint1R = -1;
            this.aLinePoint2R = -1;
            this.aControlPoint2R = -1;
            this.aWidth = -1;
        }
        // private aAlpha = -1;
        getVertexUnitSize() {
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
        }
        getVertexCount(pointCount) {
            return (pointCount - 1) * (4 + 4) * 3 + (2 + 2) * 3; // 辺の数 * (左側４ポリゴン＋右側４ポリゴン) * 3頂点 + (線端用２ポリゴン＊２)* 3頂点
        }
        initializeVertexSourceCode() {
            this.vertexShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

attribute vec2 aPosition;
attribute vec3 aLocalPosition;

attribute vec2 aLinePoint1;
attribute vec2 aControlPoint1;
attribute vec2 aControlPoint2;
attribute vec2 aLinePoint2;

attribute vec2 aLinePoint1R;
attribute vec2 aControlPoint1R;
attribute vec2 aControlPoint2R;
attribute vec2 aLinePoint2R;

attribute vec2 aWidth;
// attribute vec2 aAlpha;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

varying vec3 vLocalPosition;

varying vec2 vLinePoint1;
varying vec2 vControlPoint1;
varying vec2 vControlPoint2;
varying vec2 vLinePoint2;

varying vec2 vLinePoint1R;
varying vec2 vControlPoint1R;
varying vec2 vControlPoint2R;
varying vec2 vLinePoint2R;

varying vec2 vWidth;
// varying vec2 vAlpha;

void main(void) {

    gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);

    vLocalPosition = aLocalPosition;

    vLinePoint1 = aLinePoint1;
    vControlPoint1 = aControlPoint1;
    vControlPoint2 = aControlPoint2;
    vLinePoint2 = aLinePoint2;

    vLinePoint1R = aLinePoint1R;
    vControlPoint1R = aControlPoint1R;
    vControlPoint2R = aControlPoint2R;
    vLinePoint2R = aLinePoint2R;

    vWidth = aWidth;
    // vAlpha = aAlpha;
}
`;
        }
        initializeFragmentSourceCode() {
            this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

// From https://www.shadertoy.com/view/4sXyDr

#define CLAMP

float distanceBezier(vec2 p, vec2 P0, vec2 P1, vec2 P2, vec2 P3, out float t)
{
    // Cubic Bezier curve
    vec2 A = -P0 + 3.0 * P1 - 3.0 * P2 + P3;
    vec2 B = 3.0 * (P0 - 2.0 * P1 + P2);
    vec2 C = 3.0 * (P1 - P0);
    vec2 D = P0;
    
    float a5 =  6.0 * dot(A, A);
    float a4 = 10.0 * dot(A, B);
    float a3 =  8.0 * dot(A, C)     + 4.0 * dot(B, B);
    float a2 =  6.0 * dot(A, D - p) + 6.0 * dot(B, C);
    float a1 =  4.0 * dot(B, D - p) + 2.0 * dot(C, C);
    float a0 =  2.0 * dot(C, D - p);
    
    // calculate distances to the control points
    float d0 = length(p - P0);
    float d1 = length(p - P1);
    float d2 = length(p - P2);
    float d3 = length(p - P3);
    float d = min(d0, min(d1, min(d2, d3)));
    
    // Choose initial value of t
    //float t;
    if (abs(d3 - d) < 1.0e-5) {
        t = 1.0;
    }
    else if (abs(d0 - d) < 1.0e-5) {
        t = 0.0;
    }
    else {
        t = 0.5;
    }
        
	// iteration
    for (int i = 0; i < 10; i++) {

        float t2 = t*t;
        float t3 = t2*t;
        float t4 = t3*t;
        float t5 = t4*t;
        
        float f = a5*t5 + a4*t4 + a3*t3 + a2*t2 + a1*t + a0;
        float df = 5.0*a5*t4 + 4.0*a4*t3 + 3.0*a3*t2 + 2.0*a2*t + a1;
        
        t = t - f/df;
    }
    
    // clamp to edge of bezier segment
#ifdef CLAMP
    t = clamp(t, 0.0, 1.0);
#endif
    
    // get the point on the curve
    vec2 P = A*t*t*t + B*t*t + C*t + D;
        
    // return distance to the point on the curve
    return min(length(p - P), min(d0, d3));
}

uniform vec4 uColor;

varying vec3 vLocalPosition;

varying vec2 vLinePoint1;
varying vec2 vControlPoint1;
varying vec2 vControlPoint2;
varying vec2 vLinePoint2;

varying vec2 vLinePoint1R;
varying vec2 vControlPoint1R;
varying vec2 vControlPoint2R;
varying vec2 vLinePoint2R;

varying vec2 vWidth;
// varying vec2 vAlpha;

void main(void) {

	vec2 p  = vLocalPosition.xy;
    vec2 P0 = vLinePoint1;
    vec2 P1 = vControlPoint1;
    vec2 P2 = vControlPoint2;
    vec2 P3 = vLinePoint2;
    
    float t;
    float distance = distanceBezier(p, P0, P1, P2, P3, t);
    float width = mix(vWidth.x, vWidth.y, t);
    
    if (distance > width) {

		discard;
    }
	else {

        float col = 1.0 - smoothstep(width - 0.08, width, distance);
        //float col = distance * 0.1;

        gl_FragColor = vec4(uColor.rgb, col * uColor.a * 0.9 + 0.1);
        //gl_FragColor = vec4(0.0, 0.0, 0.0, col * mix(vAlpha[0], vAlpha[1], vLocalPosition.z));
        //gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);
        //gl_FragColor = vec4(vWidth.y, 0.0, 0.0, col * uColor.a * 0.9 + 0.1);
    }
}
`;
        }
        initializeAttributes() {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PolyLineShader();
        }
        initializeAttributes_PolyLineShader() {
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
        }
        setBuffers(buffer, color) {
            let gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();
            gl.uniform4fv(this.uColor, color);
            let vertexDataStride = 4 * this.getVertexUnitSize();
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
        }
        calculateBufferData(buffer, logic_GPULine) {
            logic_GPULine.calculateLinePointEdges(buffer);
            logic_GPULine.calculateLinePointBezierLocation(buffer);
            logic_GPULine.calculateControlPointVertexLocations(buffer);
            logic_GPULine.calculateBufferData_BezierLine(buffer);
        }
    }
    ManualTracingTool.BezierDistanceLineShader = BezierDistanceLineShader;
})(ManualTracingTool || (ManualTracingTool = {}));
