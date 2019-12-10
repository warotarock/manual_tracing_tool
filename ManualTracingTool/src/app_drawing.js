var ManualTracingTool;
(function (ManualTracingTool) {
    class App_Drawing extends ManualTracingTool.App_View {
        constructor() {
            super(...arguments);
            this.canvasRender = new ManualTracingTool.CanvasRender();
            this.drawGPURender = new WebGLRender();
            this.polyLineShader = new PolyLineShader();
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
            // Pallet modal drawing
            this.colorW = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            this.colorB = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        }
        initializeDrawingDevices() {
            this.canvasRender.setContext(this.layerWindow);
            this.canvasRender.setFontSize(18.0);
            if (this.posing3DViewRender.initializeWebGL(this.webglWindow.canvas)) {
                alert('�R�c�|�[�W���O�@�\���������ł��܂���ł����B');
            }
            //this.pickingWindow.initializeContext();
            this.posing3dView.initialize(this.posing3DViewRender, this.webglWindow, null);
            if (this.drawGPURender.initializeWebGL(this.drawGPUWindow.canvas)) {
                alert('�R�c�`��@�\���������ł��܂���ł����B');
            }
            try {
                this.drawGPURender.initializeShader(this.polyLineShader);
            }
            catch (errorMessage) {
                alert('�V�F�[�_�̏������Ɏ��s���܂����B' + errorMessage);
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
            let lineColor = this.getLineColor(layer, documentData);
            if (env.isEditMode()) {
                vec4.copy(this.editOtherLayerLineColor, lineColor);
                this.editOtherLayerLineColor[3] *= 0.3;
                lineColor = this.editOtherLayerLineColor;
            }
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
            let useAdjustingLocation = isModalToolRunning;
            let fillColor = this.getFillColor(layer, documentData);
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
            let lineColor = this.getLineColor(layer, documentData);
            let fillColor = this.getFillColor(layer, documentData);
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
            let isSelectedLayer = ManualTracingTool.Layer.isSelected(layer);
            // drawing parameters
            let widthRate = context.document.lineWidthBiasRate;
            let lineColor = this.getLineColor(layer, documentData);
            // drawing geometry lines
            let useAdjustingLocation = isModalToolRunning;
            for (let group of geometry.groups) {
                for (let line of group.lines) {
                    if (!isSelectedLayer) {
                        //if (layer.drawLineType != DrawLineTypeID.none) {
                        //    this.drawVectorLineStroke(line, this.editOtherLayerLineColor, widthRate, 0.0, useAdjustingLocation);
                        //}
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
        getLineColor(layer, documentData) {
            let color;
            if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.layerColor) {
                color = layer.layerColor;
            }
            else if (layer.drawLineType == ManualTracingTool.DrawLineTypeID.palletColor) {
                let palletColor = documentData.palletColors[layer.line_PalletColorIndex];
                color = palletColor.color;
            }
            else {
                color = layer.layerColor;
            }
            return color;
        }
        getFillColor(layer, documentData) {
            let color;
            if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.fillColor) {
                color = layer.fillColor;
            }
            else if (layer.fillAreaType == ManualTracingTool.FillAreaTypeID.palletColor) {
                let palletColor = documentData.palletColors[layer.fill_PalletColorIndex];
                color = palletColor.color;
            }
            else {
                color = layer.fillColor;
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
        renderClearBuffer() {
            let wnd = this.drawGPUWindow;
            let render = this.drawGPURender;
            render.setViewport(0.0, 0.0, wnd.width, wnd.height);
            render.setDepthTest(true);
            render.setCulling(true);
            render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0);
        }
        renderForeground_VectorLayer(canvasWindow, viewKeyFrameLayer, documentData, useAdjustingLocation) {
            let render = this.drawGPURender;
            let wnd = canvasWindow;
            let keyframe = viewKeyFrameLayer.vectorLayerKeyframe;
            render.setViewport(0.0, 0.0, wnd.width, wnd.height);
            // Calculate camera matrix
            vec3.set(this.lookatLocation, 0.0, 0.0, 0.0);
            vec3.set(this.upVector, 0.0, 1.0, 0.0);
            vec3.set(this.eyeLocation, 0.0, 0.0, 1.0);
            mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector);
            let aspect = wnd.height / wnd.width;
            let orthoWidth = wnd.width / 2 / wnd.viewScale * aspect; // TODO: �v�Z���������i�Ȃ����c�������ɓ����l���|���Ȃ��ƍ���Ȃ��j�̂Ō�Ō�������
            mat4.ortho(this.projectionMatrix, -orthoWidth, orthoWidth, orthoWidth, -orthoWidth, 0.1, 1.0);
            wnd.caluclateGLViewMatrix(this.tmpMatrix);
            mat4.multiply(this.projectionMatrix, this.tmpMatrix, this.projectionMatrix);
            render.setDepthTest(false);
            render.setCulling(false);
            render.setShader(this.polyLineShader);
            // Set shader parameters
            vec3.set(this.modelLocation, 0.0, 0.0, 0.0);
            mat4.identity(this.modelMatrix);
            mat4.translate(this.modelMatrix, this.modelMatrix, this.modelLocation);
            mat4.multiply(this.modelViewMatrix, this.viewMatrix, this.modelMatrix);
            this.polyLineShader.setModelViewMatrix(this.modelViewMatrix);
            this.polyLineShader.setProjectionMatrix(this.projectionMatrix);
            for (let group of keyframe.geometry.groups) {
                // Calculate line point buffer data
                group.buffer.isStored = false;
                if (!group.buffer.isStored) {
                    this.logic_GPULine.copyGroupPointDataToBuffer(group, documentData.lineWidthBiasRate, useAdjustingLocation);
                    this.logic_GPULine.calculateLinePointEdges(group.buffer);
                    let vertexUnitSize = this.polyLineShader.getVertexUnitSize();
                    let vertexCount = this.polyLineShader.getVertexCount(group.buffer.pointCount); // �{���͕ӂ̐������ł悢�̂Ŏ኱���ʂ͐����邪�A�v�Z���ȒP�ɂ��邽�߂���ł悢���Ƃɂ���
                    this.logic_GPULine.allocateBuffer(group.buffer, vertexCount, vertexUnitSize, render.gl);
                    this.logic_GPULine.calculateBufferData_PloyLine(group.buffer);
                    if (group.buffer.usedDataArraySize > 0) {
                        this.logic_GPULine.bufferData(group.buffer, render.gl);
                    }
                }
                // Draw lines
                if (group.buffer.isStored) {
                    this.polyLineShader.setBuffers(group.buffer.buffer);
                    let drawCount = this.polyLineShader.getDrawArrayTryanglesCount(group.buffer.usedDataArraySize);
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
        // PalletSelector window
        palletSelector_CaluculateLayout() {
            this.palletSelector_CaluculateLayout_CommandButtons();
            this.palletSelector_CaluculateLayout_PalletItems();
        }
        palletSelector_CaluculateLayout_CommandButtons() {
            let wnd = this.palletSelectorWindow;
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
        palletSelector_CaluculateLayout_PalletItems() {
            let wnd = this.palletSelectorWindow;
            let context = this.toolContext;
            let env = this.toolEnv;
            let x = wnd.leftMargin;
            let y = wnd.commandButtonsBottom;
            let itemWidth = wnd.itemWidth * wnd.itemScale;
            let itemHeight = wnd.itemHeight * wnd.itemScale;
            let viewWidth = wnd.width;
            wnd.itemAreas = new List();
            for (let palletColorIndex = 0; palletColorIndex < ManualTracingTool.DocumentData.maxPalletColors; palletColorIndex++) {
                let layoutArea = new ManualTracingTool.RectangleLayoutArea();
                layoutArea.index = palletColorIndex;
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
        drawPalletSelectorWindow_CommandButtons(wnd) {
            for (let layoutArea of wnd.commandButtonAreas) {
                let isSelected = (wnd.currentTargetID == layoutArea.index);
                this.drawButtonBackground(layoutArea, isSelected);
                this.drawButtonImage(layoutArea);
            }
        }
        drawPalletSelectorWindow_PalletItems(wnd, documentData, currentVectorLayer) {
            this.canvasRender.setContext(wnd);
            let viewWidth = wnd.width;
            let currentPalletColorIndex = -1;
            if (currentVectorLayer != null) {
                if (wnd.currentTargetID == ManualTracingTool.PalletSelectorWindowButtonID.lineColor) {
                    currentPalletColorIndex = currentVectorLayer.line_PalletColorIndex;
                }
                else if (wnd.currentTargetID == ManualTracingTool.PalletSelectorWindowButtonID.fillColor) {
                    currentPalletColorIndex = currentVectorLayer.fill_PalletColorIndex;
                }
            }
            for (let layoutArea of wnd.itemAreas) {
                let palletColorIndex = layoutArea.index;
                if (palletColorIndex > documentData.palletColors.length) {
                    break;
                }
                let x = layoutArea.left;
                let y = layoutArea.top;
                let itemWidth = layoutArea.getWidth() - wnd.itemRightMargin;
                let itemHeight = layoutArea.getHeight() - wnd.itemBottomMargin;
                let palletColor = documentData.palletColors[palletColorIndex];
                this.canvasRender.setFillColorV(palletColor.color);
                this.canvasRender.setStrokeColorV(this.drawStyle.palletSelectorItemEdgeColor);
                this.canvasRender.fillRect(x + 0.5, y + 0.5, itemWidth, itemHeight);
                this.canvasRender.setStrokeWidth(1.0);
                this.canvasRender.drawRectangle(x + 0.5, y + 0.5, itemWidth, itemHeight);
                if (palletColorIndex == currentPalletColorIndex) {
                    this.canvasRender.setStrokeWidth(1.5);
                    this.canvasRender.drawRectangle(x + 0.5 - 1.0, y + 0.5 - 1.0, itemWidth + 2.0, itemHeight + 2.0);
                }
            }
        }
        drawColorMixerWindow_SetInputControls() {
            let wnd = this.palletSelectorWindow;
            let context = this.toolContext;
            let env = this.toolEnv;
            let documentData = context.document;
            let color = this.getPalletSelectorWindow_CurrentColor();
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
        drawPalletColorMixer(wnd) {
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
    class PolyLineShader extends RenderShader {
        constructor() {
            super(...arguments);
            this.aPosition = -1;
            this.aAlpha = -1;
        }
        getVertexUnitSize() {
            return (2 // ���_�̈ʒu vec2
                + 1 // �s�����x float
            );
        }
        getVertexCount(pointCount) {
            return (pointCount - 1) * (2 + 2) * 3; // �ӂ̐� * �����Q�|���S���{�E���Q�|���S�� * 3���_
        }
        getDrawArrayTryanglesCount(bufferSize) {
            return bufferSize / this.getVertexUnitSize();
        }
        initializeVertexSourceCode() {
            this.vertexShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

attribute vec2 aPosition;
attribute float aAlpha;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

varying float vAlpha;

void main(void) {

	   gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 0.5, 1.0);
	   vAlpha = aAlpha;
}
`;
        }
        initializeFragmentSourceCode() {
            this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

varying float vAlpha;

void main(void) {

    gl_FragColor = vec4(0.0, 0.0, 0.0, vAlpha);
}
`;
        }
        initializeAttributes() {
            this.initializeAttributes_RenderShader();
            this.initializeAttributes_PosingFigureShader();
        }
        initializeAttributes_PosingFigureShader() {
            let gl = this.gl;
            this.uPMatrix = this.getUniformLocation('uPMatrix');
            this.uMVMatrix = this.getUniformLocation('uMVMatrix');
            this.aPosition = this.getAttribLocation('aPosition');
            this.aAlpha = this.getAttribLocation('aAlpha');
        }
        setBuffers(vertexBuffer) {
            let gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            this.enableVertexAttributes();
            this.resetVertexAttribPointerOffset();
            let vertexDataStride = 4 * this.getVertexUnitSize();
            this.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, vertexDataStride);
            this.vertexAttribPointer(this.aAlpha, 1, gl.FLOAT, vertexDataStride);
        }
    }
    ManualTracingTool.PolyLineShader = PolyLineShader;
})(ManualTracingTool || (ManualTracingTool = {}));
