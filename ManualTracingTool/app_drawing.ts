
namespace ManualTracingTool {

    export class App_Drawing extends App_View implements MainEditorDrawer {

        // Resources

        drawStyle = new ToolDrawingStyle();

        systemImage: ImageResource = null;
        subToolImages = new List<ImageResource>();
        layerButtonImage: ImageResource = null;

        // Work variable

        chestInvMat4 = mat4.create();
        hipsInvMat4 = mat4.create();

        editOtherLayerLineColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);

        tempEditorLinePointColor1 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        tempEditorLinePointColor2 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

        layerPickingPositions = [[0.0, 0.0], [0.0, -2.0], [2.0, 0.0], [0.0, 2.0], [-2.0, 0.0]];

        // Common drawing methods

        protected clearWindow(canvasWindow: CanvasWindow) {

            this.canvasRender.setContext(canvasWindow);

            this.canvasRender.clearRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height);
        }

        private drawButtonBackground(layoutArea: RectangleLayoutArea, isSelected: boolean) {

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

        private drawButtonImage(layoutArea: RectangleLayoutArea) {

            let srcWidth = 64.0;
            let srcHeight = 64.0;
            let srcX = 0.0;
            let srcY = (<int>layoutArea.iconID - 1) * srcHeight;
            let dstX = layoutArea.left;
            let dstY = layoutArea.top;
            let scale = 1.0;
            let dstWidth = layoutArea.getWidth() * scale;
            let dstHeight = layoutArea.getHeight() * scale;

            let srcImage = this.layerButtonImage;

            this.canvasRender.drawImage(srcImage.image.imageData
                , srcX, srcY, srcWidth, srcHeight
                , dstX, dstY, dstWidth, dstHeight);
        }

        // Document

        protected drawExportImage(canvasWindow: CanvasWindow) { // @virtual

        }

        // MainEditorDrawer implementations

        drawMouseCursor() { // @implements MainEditorDrawer

            this.canvasRender.beginPath();

            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));

            this.canvasRender.circle(
                this.mainWindow.toolMouseEvent.location[0]
                , this.mainWindow.toolMouseEvent.location[1]
                , this.getCurrentViewScaleLineWidth(this.toolContext.mouseCursorRadius)
            );

            this.canvasRender.stroke();
        }

        drawMouseCursorCircle(radius: float) { // @implements MainEditorDrawer

            this.canvasRender.beginPath();

            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));

            this.canvasRender.circle(
                this.mainWindow.toolMouseEvent.location[0]
                , this.mainWindow.toolMouseEvent.location[1]
                , radius
            );

            this.canvasRender.stroke();
        }

        drawEditorEditLineStroke(line: VectorLine) { // @implements MainEditorDrawer

            this.drawEditLineStroke(line);
        }

        drawEditorVectorLineStroke(line: VectorLine, color: Vec4, strokeWidthBolding: float, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

            this.drawVectorLineStroke(line, color, 1.0, strokeWidthBolding, useAdjustingLocation, false);
        }

        drawEditorVectorLinePoints(line: VectorLine, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

            this.drawVectorLinePoints(line, color, useAdjustingLocation);
        }

        drawEditorVectorLinePoint(point: LinePoint, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

            this.drawVectorLinePoint(point, color, useAdjustingLocation);
        }

        drawEditorVectorLineSegment(line: VectorLine, startIndex: int, endIndex: int, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

            this.drawVectorLineSegment(line, startIndex, endIndex, 1.0, 0.0, useAdjustingLocation);
        }

        // Main window

        protected drawMainWindow(canvasWindow: CanvasWindow, redrawActiveLayerOnly: boolean) { // @virtual
        }

        protected drawLayer(viewKeyFrameLayer: ViewKeyframeLayer, documentData: DocumentData, isExporting: boolean, currentLayerOnly: boolean, isModalToolRunning: boolean) {

            let layer = viewKeyFrameLayer.layer;

            if (VectorLayer.isVectorLayer(layer)) {

                let vectorLayer = <VectorLayer>layer;
                this.drawVectorLayer(vectorLayer, viewKeyFrameLayer.vectorLayerKeyframe.geometry, documentData, isExporting, isModalToolRunning);
            }
            else if (layer.type == LayerTypeID.groupLayer) {

                // No drawing
            }
            else if (layer.type == LayerTypeID.posingLayer) {

                // No drawing
            }
            else if (layer.type == LayerTypeID.imageFileReferenceLayer) {

                let ifrLayer = <ImageFileReferenceLayer>layer;
                this.drawImageFileReferenceLayer(ifrLayer, isModalToolRunning);
            }
        }

        protected drawLayerForEditMode(viewKeyFrameLayer: ViewKeyframeLayer, currentLayerOnly: boolean, documentData: DocumentData, isModalToolRunning: boolean) {

            let layer = viewKeyFrameLayer.layer;

            if (VectorLayer.isVectorLayer(layer)) {

                let vectorLayer = <VectorLayer>layer;
                this.drawVectorLayerForEditMode(vectorLayer, viewKeyFrameLayer.vectorLayerKeyframe.geometry, documentData, isModalToolRunning);
            }
        }

        protected drawVectorLayer(layer: VectorLayer, geometry: VectorLayerGeometry, documentData: DocumentData, isExporting: boolean, isModalToolRunning: boolean) {

            let context = this.toolContext;
            let env = this.toolEnv;

            let isSelectedLayer = (layer.isSelected);
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

                    if (layer.fillAreaType != FillAreaTypeID.none) {

                        this.drawVectorLineFill(line, fillColor, useAdjustingLocation, continuousFill);

                        continuousFill = line.continuousFill;
                    }
                }

                if (layer.drawLineType != DrawLineTypeID.none) {

                    for (let line of group.lines) {

                        this.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation, isExporting);
                    }
                }
            }
        }

        protected drawVectorLayerForEditMode(layer: VectorLayer, geometry: VectorLayerGeometry, documentData: DocumentData, isModalToolRunning: boolean) {

            let context = this.toolContext;

            let isSelectedLayer = (layer.isSelected);

            // drawing parameters
            let widthRate = context.document.lineWidthBiasRate;

            let lineColor = this.getLineColor(layer, documentData);
            let fillColor = this.getFillColor(layer, documentData);

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

                        if (this.toolContext.operationUnitID == OperationUnitID.linePoint) {

                            this.drawVectorLineStroke(line, lineColor, widthRate, 0.0, useAdjustingLocation, false);

                            this.drawVectorLinePoints(line, lineColor, useAdjustingLocation);
                        }
                        else if (this.toolContext.operationUnitID == OperationUnitID.line
                            || this.toolContext.operationUnitID == OperationUnitID.lineSegment) {

                            let color: Vec3;
                            if ((line.isSelected && line.modifyFlag != VectorLineModifyFlagID.selectedToUnselected)
                                || line.modifyFlag == VectorLineModifyFlagID.unselectedToSelected) {

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

        protected drawVectorLineStroke(line: VectorLine, color: Vec4, strokeWidthBiasRate: float, strokeWidthBolding: float, useAdjustingLocation: boolean, isExporting: boolean) {

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

        protected drawVectorLinePoints(line: VectorLine, color: Vec4, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

            if (line.points.length == 0) {
                return;
            }

            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));

            // make color darker or lighter than original to visible on line color
            ColorLogic.rgbToHSV(this.tempEditorLinePointColor1, color);
            if (this.tempEditorLinePointColor1[2] > 0.5) {

                this.tempEditorLinePointColor1[2] -= this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            else {

                this.tempEditorLinePointColor1[2] += this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            ColorLogic.hsvToRGB(this.tempEditorLinePointColor2, this.tempEditorLinePointColor1);

            for (let point of line.points) {

                this.drawVectorLinePoint(point, this.tempEditorLinePointColor2, useAdjustingLocation);
            }
        }

        protected lineWidthAdjust(width: float) {

            //return Math.floor(width * 5) / 5;
            return width;
        }

        protected drawVectorLineFill(line: VectorLine, color: Vec4, useAdjustingLocation: boolean, isFillContinuing: boolean) {

            if (line.points.length <= 1) {
                return;
            }

            if (!isFillContinuing) {

                this.canvasRender.setLineCap(CanvasRenderLineCap.round)
                this.canvasRender.beginPath()
                this.canvasRender.setFillColorV(color);
            }

            let startIndex = 0;
            let endIndex = line.points.length - 1;

            // search first visible point
            let firstIndex = -1;
            for (let i = startIndex; i <= endIndex; i++) {

                let point = line.points[i];

                if (point.modifyFlag != LinePointModifyFlagID.delete) {

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

                if (point.modifyFlag == LinePointModifyFlagID.delete) {

                    continue;
                }

                let location = (useAdjustingLocation ? point.adjustingLocation : point.location);
                this.canvasRender.lineTo(location[0], location[1]);
            }

            if (!line.continuousFill) {

                this.canvasRender.fill();
            }
        }

        protected drawVectorLineSegment(line: VectorLine, startIndex: int, endIndex: int, strokeWidthBiasRate: float, strokeWidthBolding: float, useAdjustingLocation: boolean) { // @implements MainEditorDrawer

            if (line.points.length < 2) {
                return;
            }

            //line.points[0].lengthFrom = 0.0;
            //line.points[0].lengthTo = 0.5;
            //line.points[line.points.length - 2].lineWidth = 2.3;
            //line.points[line.points.length - 2].lengthFrom = 0.3;
            //line.points[line.points.length - 2].lengthTo = 0.6;

            this.canvasRender.setLineCap(CanvasRenderLineCap.round)

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

        protected drawVectorLinePoint(point: LinePoint, color: Vec4, useAdjustingLocation: boolean) {

            let viewScale = this.canvasRender.getViewScale();

            this.canvasRender.beginPath()

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

        protected drawEditLineStroke(line: VectorLine) {

            this.drawVectorLineStroke(line, this.drawStyle.editingLineColor, 1.0, 2.0, false, false);
        }

        protected drawEditLinePoints(canvasWindow: CanvasWindow, line: VectorLine, color: Vec4) {

            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));

            this.canvasRender.setStrokeColorV(color);
            this.canvasRender.setFillColorV(color);

            for (let point of line.points) {

                this.drawVectorLinePoint(point, color, false);
            }
        }

        protected getLineColor(layer: VectorLayer, documentData: DocumentData) {

            let color: Vec4;
            if (layer.drawLineType == DrawLineTypeID.layerColor) {

                color = layer.layerColor;
            }
            else if (layer.drawLineType == DrawLineTypeID.palletColor) {

                let palletColor = documentData.palletColors[layer.line_PalletColorIndex];
                color = palletColor.color;
            }
            else {

                color = layer.layerColor;
            }

            return color;
        }

        protected getFillColor(layer: VectorLayer, documentData: DocumentData) {

            let color: Vec4;
            if (layer.fillAreaType == FillAreaTypeID.fillColor) {

                color = layer.fillColor;
            }
            else if (layer.fillAreaType == FillAreaTypeID.palletColor) {

                let palletColor = documentData.palletColors[layer.fill_PalletColorIndex];
                color = palletColor.color;
            }
            else {

                color = layer.fillColor;
            }

            return color;
        }

        protected getCurrentViewScaleLineWidth(width: float) {

            return width / this.canvasRender.getViewScale();
        }

        protected getViewScaledSize(width: float) {

            return width / this.canvasRender.getViewScale();
        }

        protected drawImageFileReferenceLayer(layer: ImageFileReferenceLayer, isModalToolRunning: boolean) {

            if (layer.imageResource == null
                || layer.imageResource.image == null
                || layer.imageResource.image.imageData == null) {

                return;
            }

            let image = layer.imageResource.image.imageData;

            let isModal = isModalToolRunning;

            let location = (isModal ? layer.adjustingLocation : layer.location);
            let rotation = (isModal ? layer.adjustingRotation[0] : layer.rotation[0]);
            let scale = (isModal ? layer.adjustingScale : layer.scale);

            mat4.identity(this.tempMat4);
            mat4.translate(this.tempMat4, this.tempMat4, location);
            mat4.rotateZ(this.tempMat4, this.tempMat4, rotation);
            mat4.scale(this.tempMat4, this.tempMat4, scale);

            this.canvasRender.setLocalTransForm(this.tempMat4);

            this.canvasRender.setGlobalAlpha(layer.layerColor[3]);

            this.canvasRender.drawImage(image
                , 0.0, 0.0
                , image.width, image.height
                , 0.0, 0.0
                , image.width, image.height
            );

            this.canvasRender.cancelLocalTransForm();
            this.canvasRender.setGlobalAlpha(1.0);
        }

        protected pickLayer(canvasWindow: CanvasWindow, viewKeyframe: ViewKeyframe, pickLocationX: float, pickLocationY: float): Layer {

            let documentData = this.toolContext.document;

            let pickedLayer = null;
            for (let viewKeyframeLayer of viewKeyframe.layers) {

                let layer = viewKeyframeLayer.layer;

                if (!layer.isHierarchicalVisible || !VectorLayer.isVectorLayer(layer)) {
                    continue;
                }

                let vectorLayer = <VectorLayer>layer;

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

        private operatorCurosrLineDash = [2.0, 2.0];
        private operatorCurosrLineDashScaled = [0.0, 0.0];
        private operatorCurosrLineDashNone = [];

        protected drawOperatorCursor() {

            this.canvasRender.beginPath();

            this.canvasRender.setStrokeColorV(this.drawStyle.operatorCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));

            let viewScale = this.getViewScaledSize(1.0);

            this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
            this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
            this.canvasRender.setLineDash(this.operatorCurosrLineDashScaled);

            this.canvasRender.circle(
                this.toolContext.operatorCursor.location[0]
                , this.toolContext.operatorCursor.location[1]
                , this.toolContext.operatorCursor.radius * viewScale
            );

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

        // WebGL window

        protected drawWebGLWindow(webglWindow: CanvasWindow, layerWindowItems: List<LayerWindowItem>, mainWindow: CanvasWindow, pickingWindow: CanvasWindow) {

            let env = this.toolEnv;

            this.webGLRender.setViewport(0.0, 0.0, webglWindow.width, webglWindow.height);
            this.posing3dView.clear(env);

            mainWindow.copyTransformTo(pickingWindow);
            mainWindow.copyTransformTo(webglWindow);

            if (env.currentPosingLayer != null && env.currentPosingLayer.isHierarchicalVisible
                && this.toolContext.mainToolID == MainToolID.posing
            ) {

                let posingLayer = env.currentPosingLayer;

                this.posing3dView.prepareDrawingStructures(posingLayer);
                //this.posing3dView.drawPickingImage(posingLayer, env);
                //pickingWindow.context.clearRect(0, 0, pickingWindow.width, pickingWindow.height);
                //pickingWindow.context.drawImage(webglWindow.canvas, 0, 0, webglWindow.width, webglWindow.height);

                //this.posing3dView.clear(env);
                this.posing3dView.drawManipulaters(posingLayer, env);
            }

            for (let index = layerWindowItems.length - 1; index >= 0; index--) {

                let item = layerWindowItems[index];

                if (item.layer.type != LayerTypeID.posingLayer) {
                    continue;
                }

                let posingLayer = <PosingLayer>item.layer;

                this.posing3dView.prepareDrawingStructures(posingLayer);
                this.posing3dView.drawPosingModel(posingLayer, env);
            }
        }

        // Layer window

        protected layerWindow_CaluculateLayout(wnd: LayerWindow) { // @override

            // layer item buttons
            wnd.layerWindowLayoutArea.copyRectangle(wnd);
            wnd.layerWindowLayoutArea.bottom = wnd.height - 1.0;

            this.layerWindow_CaluculateLayout_CommandButtons(wnd, wnd.layerWindowLayoutArea);

            if (wnd.layerWindowCommandButtons.length > 0) {

                let lastButton = wnd.layerWindowCommandButtons[wnd.layerWindowCommandButtons.length - 1];
                wnd.layerWindowLayoutArea.top = lastButton.getHeight() + 1.0;// lastButton.bottom + 1.0;
            }

            // layer items
            this.layerWindow_CaluculateLayout_LayerWindowItem(wnd, wnd.layerWindowLayoutArea);
        }

        protected layerWindow_CaluculateLayout_CommandButtons(wnd: LayerWindow, layoutArea: RectangleLayoutArea) {

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

        protected layerWindow_CaluculateLayout_LayerWindowItem(wnd: LayerWindow, layoutArea: RectangleLayoutArea) {

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

        protected drawLayerWindow(wnd: LayerWindow) {

            this.canvasRender.setContext(wnd);

            this.drawLayerWindow_LayerItems(wnd);

            this.drawLayerWindow_LayerWindowButtons(wnd);
        }

        protected drawLayerWindow_LayerWindowButtons(wnd: LayerWindow) {

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

        protected drawLayerWindow_LayerItems(wnd: LayerWindow) {

            for (let item of wnd.layerWindowItems) {

                this.drawLayerWindowItem(item, wnd.layerItemFontSize);
            }
        }

        protected drawLayerWindowItem(item: LayerWindowItem, fontSize: float) {

            let layer = item.layer;

            let left = item.left;
            let top = item.top;
            let bottom = item.bottom;

            let itemWidth = item.getWidth();
            let itemHeight = item.getHeight();

            let bottomMargin = itemHeight * 0.3;

            let depthOffset = 10.0 * item.hierarchyDepth;

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
            let srcImage = this.systemImage.image;
            let iconIndex = (item.layer.isVisible ? 0.0 : 1.0);
            let srcWidth = srcImage.width * 0.125;
            let srcHeight = srcImage.height * 0.125;
            let srcX = srcWidth * iconIndex;
            let srcY = srcImage.height * 0.25;
            let dstX = item.marginLeft;
            let dstY = top + item.marginTop;
            let dstWidth = item.visibilityIconWidth;
            let dstHeigh = item.visibilityIconWidth;
            this.canvasRender.drawImage(this.systemImage.image.imageData
                , srcX, srcY, srcWidth, srcHeight
                , dstX, dstY, dstWidth, dstHeigh);

            // Text
            this.canvasRender.setFontSize(fontSize);
            this.canvasRender.setFillColor(0.0, 0.0, 0.0, 1.0);
            this.canvasRender.fillText(layer.name, item.textLeft + depthOffset, bottom - bottomMargin);
        }

        // Timeline window

        protected drawTimeLineWindow_CommandButtons(wnd: TimeLineWindow, animationPlaying: boolean) {

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

        protected drawTimeLineWindow_TimeLine(wnd: TimeLineWindow, documentData: DocumentData, viewKeyframes: List<ViewKeyframe>, currentVectorLayer: VectorLayer) {

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

                let viewKeyFrame = ViewKeyframe.findViewKeyframe(viewKeyframes, aniSetting.currentTimeFrame);
                let layerIndex = -1;
                if (viewKeyFrame != null) {

                    layerIndex = ViewKeyframe.findViewKeyframeLayerIndex(viewKeyFrame, currentVectorLayer);
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

        protected palletSelector_CaluculateLayout() {

            this.palletSelector_CaluculateLayout_CommandButtons();

            this.palletSelector_CaluculateLayout_PalletItems();
        }

        private palletSelector_CaluculateLayout_CommandButtons() {

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

        private palletSelector_CaluculateLayout_PalletItems() {

            let wnd = this.palletSelectorWindow;
            let context = this.toolContext;
            let env = this.toolEnv;

            let x = wnd.leftMargin;
            let y = wnd.commandButtonsBottom;
            let itemWidth = wnd.itemWidth * wnd.itemScale;
            let itemHeight = wnd.itemHeight * wnd.itemScale;

            let viewWidth = wnd.width;

            wnd.itemAreas = new List<RectangleLayoutArea>();

            for (let palletColorIndex = 0; palletColorIndex < DocumentData.maxPalletColors; palletColorIndex++) {

                let layoutArea = new RectangleLayoutArea();
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

        protected drawPalletSelectorWindow_CommandButtons(wnd: PalletSelectorWindow) {

            for (let layoutArea of wnd.commandButtonAreas) {

                let isSelected = (<int>wnd.currentTargetID == layoutArea.index);

                this.drawButtonBackground(layoutArea, isSelected);

                this.drawButtonImage(layoutArea);
            }
        }

        protected drawPalletSelectorWindow_PalletItems(wnd: PalletSelectorWindow, documentData: DocumentData, currentVectorLayer: VectorLayer) {

            this.canvasRender.setContext(wnd);

            let viewWidth = wnd.width;

            let currentPalletColorIndex = -1;
            if (currentVectorLayer != null) {

                if (wnd.currentTargetID == PalletSelectorWindowButtonID.lineColor) {

                    currentPalletColorIndex = currentVectorLayer.line_PalletColorIndex;
                }
                else if (wnd.currentTargetID == PalletSelectorWindowButtonID.fillColor) {

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

        // ColorMixer window

        private hsv = vec4.create();

        protected drawColorMixerWindow_SetInputControls() {

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

                Maths.rgbToHSV(this.hsv, color[0], color[1], color[2])

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
    }
}
