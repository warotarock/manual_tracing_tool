var ManualTracingTool;
(function (ManualTracingTool) {
    let MainToolID;
    (function (MainToolID) {
        MainToolID[MainToolID["none"] = 0] = "none";
        MainToolID[MainToolID["drawLine"] = 1] = "drawLine";
        MainToolID[MainToolID["posing"] = 2] = "posing";
        MainToolID[MainToolID["imageReferenceLayer"] = 3] = "imageReferenceLayer";
        MainToolID[MainToolID["misc"] = 4] = "misc";
        MainToolID[MainToolID["edit"] = 5] = "edit";
    })(MainToolID = ManualTracingTool.MainToolID || (ManualTracingTool.MainToolID = {}));
    let DrawLineToolSubToolID;
    (function (DrawLineToolSubToolID) {
        DrawLineToolSubToolID[DrawLineToolSubToolID["drawLine"] = 0] = "drawLine";
        DrawLineToolSubToolID[DrawLineToolSubToolID["extrudeLine"] = 1] = "extrudeLine";
        DrawLineToolSubToolID[DrawLineToolSubToolID["deletePointBrush"] = 2] = "deletePointBrush";
        DrawLineToolSubToolID[DrawLineToolSubToolID["editLinePointWidth_BrushSelect"] = 3] = "editLinePointWidth_BrushSelect";
        DrawLineToolSubToolID[DrawLineToolSubToolID["scratchLine"] = 4] = "scratchLine";
        DrawLineToolSubToolID[DrawLineToolSubToolID["overWriteLineWidth"] = 5] = "overWriteLineWidth";
        DrawLineToolSubToolID[DrawLineToolSubToolID["scratchLineWidth"] = 6] = "scratchLineWidth";
    })(DrawLineToolSubToolID = ManualTracingTool.DrawLineToolSubToolID || (ManualTracingTool.DrawLineToolSubToolID = {}));
    let EditModeSubToolID;
    (function (EditModeSubToolID) {
        EditModeSubToolID[EditModeSubToolID["mainEditTool"] = 0] = "mainEditTool";
    })(EditModeSubToolID = ManualTracingTool.EditModeSubToolID || (ManualTracingTool.EditModeSubToolID = {}));
    let ModalToolID;
    (function (ModalToolID) {
        ModalToolID[ModalToolID["none"] = 0] = "none";
        ModalToolID[ModalToolID["grabMove"] = 1] = "grabMove";
        ModalToolID[ModalToolID["rotate"] = 2] = "rotate";
        ModalToolID[ModalToolID["scale"] = 3] = "scale";
        ModalToolID[ModalToolID["latticeMove"] = 4] = "latticeMove";
        ModalToolID[ModalToolID["countOfID"] = 5] = "countOfID";
    })(ModalToolID = ManualTracingTool.ModalToolID || (ManualTracingTool.ModalToolID = {}));
    let Posing3DSubToolID;
    (function (Posing3DSubToolID) {
        Posing3DSubToolID[Posing3DSubToolID["locateHead"] = 0] = "locateHead";
        Posing3DSubToolID[Posing3DSubToolID["rotateHead"] = 1] = "rotateHead";
        Posing3DSubToolID[Posing3DSubToolID["locateBody"] = 2] = "locateBody";
        Posing3DSubToolID[Posing3DSubToolID["rotateBody"] = 3] = "rotateBody";
        Posing3DSubToolID[Posing3DSubToolID["locateLeftShoulder"] = 4] = "locateLeftShoulder";
        Posing3DSubToolID[Posing3DSubToolID["locateLeftArm1"] = 5] = "locateLeftArm1";
        Posing3DSubToolID[Posing3DSubToolID["locateLeftArm2"] = 6] = "locateLeftArm2";
        Posing3DSubToolID[Posing3DSubToolID["locateRightShoulder"] = 7] = "locateRightShoulder";
        Posing3DSubToolID[Posing3DSubToolID["locateRightArm1"] = 8] = "locateRightArm1";
        Posing3DSubToolID[Posing3DSubToolID["locateRightArm2"] = 9] = "locateRightArm2";
        Posing3DSubToolID[Posing3DSubToolID["locateLeftLeg1"] = 10] = "locateLeftLeg1";
        Posing3DSubToolID[Posing3DSubToolID["locateLeftLeg2"] = 11] = "locateLeftLeg2";
        Posing3DSubToolID[Posing3DSubToolID["locateRightLeg1"] = 12] = "locateRightLeg1";
        Posing3DSubToolID[Posing3DSubToolID["locateRightLeg2"] = 13] = "locateRightLeg2";
        Posing3DSubToolID[Posing3DSubToolID["twistHead"] = 14] = "twistHead";
    })(Posing3DSubToolID = ManualTracingTool.Posing3DSubToolID || (ManualTracingTool.Posing3DSubToolID = {}));
    let EditModeID;
    (function (EditModeID) {
        EditModeID[EditModeID["editMode"] = 1] = "editMode";
        EditModeID[EditModeID["drawMode"] = 2] = "drawMode";
    })(EditModeID = ManualTracingTool.EditModeID || (ManualTracingTool.EditModeID = {}));
    let OperationUnitID;
    (function (OperationUnitID) {
        OperationUnitID[OperationUnitID["none"] = 0] = "none";
        OperationUnitID[OperationUnitID["linePoint"] = 1] = "linePoint";
        OperationUnitID[OperationUnitID["lineSegment"] = 2] = "lineSegment";
        OperationUnitID[OperationUnitID["line"] = 3] = "line";
        OperationUnitID[OperationUnitID["layer"] = 4] = "layer";
        OperationUnitID[OperationUnitID["countOfID"] = 5] = "countOfID";
    })(OperationUnitID = ManualTracingTool.OperationUnitID || (ManualTracingTool.OperationUnitID = {}));
    let OpenFileDialogTargetID;
    (function (OpenFileDialogTargetID) {
        OpenFileDialogTargetID[OpenFileDialogTargetID["none"] = 0] = "none";
        OpenFileDialogTargetID[OpenFileDialogTargetID["openDocument"] = 1] = "openDocument";
        OpenFileDialogTargetID[OpenFileDialogTargetID["saveDocument"] = 2] = "saveDocument";
        OpenFileDialogTargetID[OpenFileDialogTargetID["imageFileReferenceLayerFilePath"] = 3] = "imageFileReferenceLayerFilePath";
    })(OpenFileDialogTargetID = ManualTracingTool.OpenFileDialogTargetID || (ManualTracingTool.OpenFileDialogTargetID = {}));
    class ToolBaseWindow extends ManualTracingTool.CanvasWindow {
        constructor() {
            super(...arguments);
            this.toolMouseEvent = new ToolMouseEvent();
            this.dragBeforeViewLocation = vec3.create();
        }
        startMouseDragging() {
            this.toolMouseEvent.startMouseDragging();
            vec3.copy(this.dragBeforeViewLocation, this.viewLocation);
        }
        endMouseDragging() {
            this.toolMouseEvent.endMouseDragging();
        }
    }
    ManualTracingTool.ToolBaseWindow = ToolBaseWindow;
    class PickingWindow extends ManualTracingTool.CanvasWindow {
        constructor() {
            super(...arguments);
            this.maxDepth = 4.0;
        }
    }
    ManualTracingTool.PickingWindow = PickingWindow;
    class OperatorCursor {
        constructor() {
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
            this.radius = 15.0;
        }
    }
    ManualTracingTool.OperatorCursor = OperatorCursor;
    let LatticePointEditTypeID;
    (function (LatticePointEditTypeID) {
        LatticePointEditTypeID[LatticePointEditTypeID["none"] = 0] = "none";
        LatticePointEditTypeID[LatticePointEditTypeID["horizontalOnly"] = 1] = "horizontalOnly";
        LatticePointEditTypeID[LatticePointEditTypeID["verticalOnly"] = 2] = "verticalOnly";
        LatticePointEditTypeID[LatticePointEditTypeID["allDirection"] = 3] = "allDirection";
    })(LatticePointEditTypeID = ManualTracingTool.LatticePointEditTypeID || (ManualTracingTool.LatticePointEditTypeID = {}));
    class LatticePoint {
        constructor() {
            this.latticePointEditType = LatticePointEditTypeID.none;
            this.baseLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
        }
    }
    ManualTracingTool.LatticePoint = LatticePoint;
    class ViewKeyframeLayer {
        constructor() {
            this.layer = null;
            this.vectorLayerKeyframe = null;
        }
        hasKeyframe() {
            return (this.vectorLayerKeyframe != null);
        }
        static forEachGroup(viewKeyframeLayers, loopBodyFunction) {
            for (let viewKeyframeLayer of viewKeyframeLayers) {
                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {
                    loopBodyFunction(group);
                }
            }
        }
        static forEachLayerAndGroup(viewKeyframeLayers, loopBodyFunction) {
            for (let viewKeyframeLayer of viewKeyframeLayers) {
                for (let group of viewKeyframeLayer.vectorLayerKeyframe.geometry.groups) {
                    loopBodyFunction(viewKeyframeLayer.layer, group);
                }
            }
        }
    }
    ManualTracingTool.ViewKeyframeLayer = ViewKeyframeLayer;
    class ViewKeyframe {
        constructor() {
            this.frame = 0;
            this.layers = new List();
        }
        static findViewKeyframe(viewKeyframes, frame) {
            let keyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, frame);
            if (keyframeIndex != -1) {
                return viewKeyframes[keyframeIndex];
            }
            else {
                return null;
            }
        }
        static findViewKeyframeIndex(viewKeyframes, frame) {
            let resultIndex = 0;
            for (let index = 0; index < viewKeyframes.length; index++) {
                if (viewKeyframes[index].frame > frame) {
                    break;
                }
                resultIndex = index;
            }
            return resultIndex;
        }
        static findViewKeyframeLayerIndex(viewKeyFrame, layer) {
            for (let index = 0; index < viewKeyFrame.layers.length; index++) {
                if (viewKeyFrame.layers[index].layer == layer) {
                    return index;
                }
            }
            return -1;
        }
        static findViewKeyframeLayer(viewKeyFrame, layer) {
            let index = this.findViewKeyframeLayerIndex(viewKeyFrame, layer);
            if (index != -1) {
                return viewKeyFrame.layers[index];
            }
            else {
                return null;
            }
        }
    }
    ManualTracingTool.ViewKeyframe = ViewKeyframe;
    class ViewLayerContext {
        constructor() {
            this.keyframes = null;
        }
    }
    ManualTracingTool.ViewLayerContext = ViewLayerContext;
    class DrawPassBuffer {
        constructor() {
            this.canvas = null;
            this.glTexture = null;
            this.width = 0;
            this.height = 0;
        }
    }
    ManualTracingTool.DrawPassBuffer = DrawPassBuffer;
    let TempVirtualLayerTypeID;
    (function (TempVirtualLayerTypeID) {
        TempVirtualLayerTypeID[TempVirtualLayerTypeID["none"] = 0] = "none";
        TempVirtualLayerTypeID[TempVirtualLayerTypeID["normal"] = 1] = "normal";
        TempVirtualLayerTypeID[TempVirtualLayerTypeID["virtualGroup"] = 2] = "virtualGroup";
    })(TempVirtualLayerTypeID = ManualTracingTool.TempVirtualLayerTypeID || (ManualTracingTool.TempVirtualLayerTypeID = {}));
    class TempVirtualLayer {
        constructor() {
            this.type = TempVirtualLayerTypeID.none;
            this.layer = null;
            this.children = new List();
        }
    }
    ManualTracingTool.TempVirtualLayer = TempVirtualLayer;
    let DrawPathOperationTypeID;
    (function (DrawPathOperationTypeID) {
        DrawPathOperationTypeID[DrawPathOperationTypeID["none"] = 0] = "none";
        DrawPathOperationTypeID[DrawPathOperationTypeID["beginDrawing"] = 1] = "beginDrawing";
        DrawPathOperationTypeID[DrawPathOperationTypeID["endDrawing"] = 2] = "endDrawing";
        DrawPathOperationTypeID[DrawPathOperationTypeID["drawForeground"] = 3] = "drawForeground";
        DrawPathOperationTypeID[DrawPathOperationTypeID["drawBackground"] = 4] = "drawBackground";
        DrawPathOperationTypeID[DrawPathOperationTypeID["prepareRendering"] = 5] = "prepareRendering";
        DrawPathOperationTypeID[DrawPathOperationTypeID["flushRendering"] = 6] = "flushRendering";
        DrawPathOperationTypeID[DrawPathOperationTypeID["prepareBuffer"] = 7] = "prepareBuffer";
        DrawPathOperationTypeID[DrawPathOperationTypeID["flushBuffer"] = 8] = "flushBuffer";
    })(DrawPathOperationTypeID = ManualTracingTool.DrawPathOperationTypeID || (ManualTracingTool.DrawPathOperationTypeID = {}));
    class DrawPathStep {
        constructor() {
            this._debugText = '';
            this.layer = null;
            this.viewKeyframeLayer = null;
            this.operationType = DrawPathOperationTypeID.none;
            this.compositeOperation = 'source-over';
        }
        setType(operationType) {
            this.operationType = operationType;
            this._debugText = DrawPathOperationTypeID[operationType];
        }
    }
    ManualTracingTool.DrawPathStep = DrawPathStep;
    let DrawPathModeID;
    (function (DrawPathModeID) {
        DrawPathModeID[DrawPathModeID["none"] = 0] = "none";
        DrawPathModeID[DrawPathModeID["editor"] = 1] = "editor";
        DrawPathModeID[DrawPathModeID["editorPreview"] = 2] = "editorPreview";
        DrawPathModeID[DrawPathModeID["export"] = 3] = "export";
    })(DrawPathModeID = ManualTracingTool.DrawPathModeID || (ManualTracingTool.DrawPathModeID = {}));
    class DrawPathContext {
        constructor() {
            this.steps = new List();
            this.activeDrawPathStartIndex = -1;
            this.activeDrawPathEndIndex = -1;
            this.lazyDraw_ProcessedIndex = -1;
            this.lazyDraw_LastResetTime = 0;
            this.lazyDraw_LimitTime = 100;
            this.lazyDraw_MaxTime = 100000;
            this.lazyDraw_WaitTime = 500;
            this.lazyDraw_Buffer = null;
            this.drawPathModeID = DrawPathModeID.none;
            this.isModalToolRunning = false;
            this.currentLayerOnly = false;
            this.startIndex = 0;
            this.endIndex = 0;
            this.lastDrawPathIndex = -1;
            this.bufferStack = new List();
            this.needsLazyRedraw = false;
        }
        clearDrawingStates() {
            this.lastDrawPathIndex = -1;
            if (this.bufferStack.length > 0) {
                this.bufferStack = new List();
            }
        }
        resetLazyDrawProcess() {
            this.lazyDraw_ProcessedIndex = -1;
            this.lazyDraw_LastResetTime = Platform.getCurrentTime();
        }
        getCurrentBuffer() {
            if (this.bufferStack.length == 0) {
                throw ('バッファスタックがありません。');
            }
            return this.bufferStack[this.bufferStack.length - 1];
        }
        isFullRendering() {
            return (this.drawPathModeID == DrawPathModeID.editorPreview
                || this.drawPathModeID == DrawPathModeID.export);
        }
        isLazyDrawBigining() {
            return (this.lazyDraw_ProcessedIndex == -1);
        }
        isLazyDrawFinished() {
            return (this.lazyDraw_ProcessedIndex >= this.steps.length - 1) && !this.needsLazyRedraw;
        }
        isLazyDrawWaiting() {
            return (!this.isLazyDrawFinished()
                && this.lazyDraw_LastResetTime + this.lazyDraw_WaitTime > Platform.getCurrentTime());
        }
        isLastDrawExist() {
            return (this.lastDrawPathIndex != -1);
        }
    }
    ManualTracingTool.DrawPathContext = DrawPathContext;
    class ToolClipboard {
        constructor() {
            this.copy_VectorGroup = null;
        }
    }
    ManualTracingTool.ToolClipboard = ToolClipboard;
    class ToolContext {
        constructor() {
            this.mainEditor = null;
            this.drawStyle = null;
            this.commandHistory = null;
            this.document = null;
            this.clipboard = new ToolClipboard();
            this.mainWindow = null;
            this.pickingWindow = null;
            this.posing3DView = null;
            this.posing3DLogic = null;
            this.lazy_DrawPathContext = null;
            this.mainToolID = MainToolID.none;
            this.subToolIndex = 0;
            this.editMode = EditModeID.drawMode;
            this.drawMode_MainToolID = MainToolID.drawLine;
            this.editMode_MainToolID = MainToolID.edit;
            this.needsDrawOperatorCursor = false;
            this.operationUnitID = OperationUnitID.line;
            this.drawLineBaseWidth = 1.0;
            this.drawLineMinWidth = 0.1;
            this.drawCPUOnly = false;
            this.currentLayer = null;
            this.currentVectorLayer = null;
            this.currentVectorGeometry = null;
            this.currentVectorGroup = null;
            this.currentVectorLine = null;
            this.currentPosingLayer = null;
            this.currentPosingModel = null;
            this.currentPosingData = null;
            this.currentImageFileReferenceLayer = null;
            this.redrawMainWindow = false;
            this.redrawCurrentLayer = false;
            this.redrawEditorWindow = false;
            this.redrawLayerWindow = false;
            this.redrawSubtoolWindow = false;
            this.redrawTimeLineWindow = false;
            this.redrawWebGLWindow = false;
            this.redrawHeaderWindow = false;
            this.redrawFooterWindow = false;
            this.redrawPaletteSelectorWindow = false;
            this.redrawColorMixerWindow = false;
            this.mouseCursorRadius = 12.0;
            this.resamplingUnitLength = 8.0;
            this.operatorCursor = new OperatorCursor();
            this.shiftKey = false;
            this.altKey = false;
            this.ctrlKey = false;
            this.animationPlaying = false;
            this.animationPlayingFPS = 24;
        }
    }
    ManualTracingTool.ToolContext = ToolContext;
    class ToolEnvironment {
        constructor(toolContext) {
            this.toolContext = null;
            this.drawStyle = null;
            this.mainToolID = MainToolID.posing;
            this.subToolIndex = 0;
            this.editMode = EditModeID.drawMode;
            this.drawMode_MainToolID = MainToolID.drawLine;
            this.editMode_MainToolID = MainToolID.edit;
            this.operationUnitID = OperationUnitID.linePoint;
            this.commandHistory = null;
            this.operatorCursor = null;
            this.document = null;
            this.clipboard = null;
            this.drawLineBaseWidth = 1.0;
            this.drawLineMinWidth = 1.0;
            this.currentLayer = null;
            this.currentVectorLayer = null;
            this.currentVectorGeometry = null;
            this.currentVectorGroup = null;
            this.currentVectorLine = null;
            this.currentPosingLayer = null;
            this.currentPosingModel = null;
            this.currentPosingData = null;
            this.currentImageFileReferenceLayer = null;
            this.mainWindow = null;
            this.pickingWindow = null;
            this.posing3DView = null;
            this.posing3DLogic = null;
            this.viewScale = 0.0;
            this.mouseCursorViewRadius = 0.0;
            this.mouseCursorLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.toolContext = toolContext;
        }
        updateContext() {
            this.mainToolID = this.toolContext.mainToolID;
            this.subToolIndex = this.toolContext.subToolIndex;
            this.editMode = this.toolContext.editMode;
            this.drawMode_MainToolID = this.toolContext.drawMode_MainToolID;
            this.editMode_MainToolID = this.toolContext.editMode_MainToolID;
            this.operationUnitID = this.toolContext.operationUnitID;
            this.commandHistory = this.toolContext.commandHistory;
            this.operatorCursor = this.toolContext.operatorCursor;
            //this.latticePoints = this.toolContext.latticePoints;
            //this.rectangleArea = this.toolContext.rectangleArea;
            this.document = this.toolContext.document;
            this.clipboard = this.toolContext.clipboard;
            this.drawLineBaseWidth = this.toolContext.drawLineBaseWidth;
            this.drawLineMinWidth = this.toolContext.drawLineMinWidth;
            this.currentLayer = this.toolContext.currentLayer;
            //this.editableKeyframeLayers = this.toolContext.editableKeyframeLayers;
            this.currentVectorLayer = this.toolContext.currentVectorLayer;
            this.currentVectorGeometry = this.toolContext.currentVectorGeometry;
            this.currentVectorGroup = this.toolContext.currentVectorGroup;
            this.currentVectorLine = this.toolContext.currentVectorLine;
            if (this.toolContext.currentVectorLine != null) {
                if (this.toolContext.currentVectorLine.modifyFlag == ManualTracingTool.VectorLineModifyFlagID.delete) {
                    this.toolContext.currentVectorLine = null;
                    this.currentVectorLine = null;
                }
            }
            this.currentPosingLayer = this.toolContext.currentPosingLayer;
            this.currentPosingModel = this.toolContext.currentPosingModel;
            this.currentPosingData = this.toolContext.currentPosingData;
            this.currentImageFileReferenceLayer = this.toolContext.currentImageFileReferenceLayer;
            this.mainWindow = this.toolContext.mainWindow;
            this.pickingWindow = this.toolContext.pickingWindow;
            this.posing3DView = this.toolContext.posing3DView;
            this.posing3DLogic = this.toolContext.posing3DLogic;
            this.viewScale = this.toolContext.mainWindow.viewScale;
            this.drawStyle = this.toolContext.drawStyle;
            this.mouseCursorViewRadius = this.getViewScaledLength(this.toolContext.mouseCursorRadius);
        }
        setRedrawHeaderWindow() {
            this.toolContext.redrawHeaderWindow = true;
        }
        setRedrawMainWindow() {
            this.toolContext.redrawMainWindow = true;
            this.toolContext.redrawCurrentLayer = false;
        }
        setRedrawCurrentLayer() {
            if (!this.toolContext.redrawMainWindow) {
                this.toolContext.redrawCurrentLayer = true;
            }
            this.toolContext.redrawMainWindow = true;
        }
        setRedrawEditorWindow() {
            this.toolContext.redrawEditorWindow = true;
        }
        setRedrawMainWindowEditorWindow() {
            this.setRedrawMainWindow();
            this.setRedrawEditorWindow();
            this.setRedrawWebGLWindow();
        }
        setRedrawLayerWindow() {
            this.toolContext.redrawLayerWindow = true;
            this.toolContext.redrawPaletteSelectorWindow = true;
            this.toolContext.redrawColorMixerWindow = true;
        }
        updateLayerStructure() {
            this.toolContext.mainEditor.updateLayerStructure();
            this.setRedrawLayerWindow();
            this.setRedrawTimeLineWindow();
            this.setRedrawMainWindowEditorWindow();
        }
        setRedrawSubtoolWindow() {
            this.toolContext.redrawSubtoolWindow = true;
        }
        setRedrawTimeLineWindow() {
            this.toolContext.redrawTimeLineWindow = true;
        }
        setRedrawColorSelectorWindow() {
            this.toolContext.redrawPaletteSelectorWindow = true;
        }
        setRedrawColorMixerWindow() {
            this.toolContext.redrawColorMixerWindow = true;
        }
        setRedrawWebGLWindow() {
            this.toolContext.redrawWebGLWindow = true;
        }
        setRedrawAllWindows() {
            this.setRedrawMainWindowEditorWindow();
            this.setRedrawSubtoolWindow();
            this.setRedrawLayerWindow();
            this.setRedrawTimeLineWindow();
            this.setRedrawColorSelectorWindow();
            this.setRedrawWebGLWindow();
        }
        setLazyRedraw() {
            this.toolContext.lazy_DrawPathContext.needsLazyRedraw = true;
        }
        isAnyModifierKeyPressing() {
            return (this.toolContext.shiftKey || this.toolContext.altKey || this.toolContext.ctrlKey);
        }
        isShiftKeyPressing() {
            return (this.toolContext.shiftKey);
        }
        isCtrlKeyPressing() {
            return (this.toolContext.ctrlKey);
        }
        isAltKeyPressing() {
            return (this.toolContext.altKey);
        }
        isDrawMode() {
            return (this.toolContext.editMode == EditModeID.drawMode);
        }
        isEditMode() {
            return (this.toolContext.editMode == EditModeID.editMode);
        }
        isCurrentLayerVectorLayer() {
            return (this.currentVectorLayer != null);
        }
        isCurrentLayerPosingLayer() {
            return (this.currentPosingLayer != null);
        }
        isCurrentLayerImageFileReferenceLayer() {
            return (this.currentImageFileReferenceLayer != null);
        }
        needsDrawOperatorCursor() {
            return (this.isEditMode() || this.toolContext.needsDrawOperatorCursor);
        }
        setCurrentOperationUnitID(operationUnitID) {
            this.toolContext.mainEditor.setCurrentOperationUnitID(operationUnitID);
        }
        setCurrentLayer(layer) {
            this.toolContext.mainEditor.setCurrentLayer(layer);
        }
        setCurrentVectorLine(line, isEditTarget) {
            this.toolContext.currentVectorLine = line;
            this.currentVectorLine = line;
        }
        getCurrentLayerLineColor() {
            let color = null;
            if (this.currentVectorLayer != null) {
                if (this.currentVectorLayer.drawLineType == ManualTracingTool.DrawLineTypeID.paletteColor) {
                    color = this.toolContext.document.paletteColors[this.currentVectorLayer.line_PaletteColorIndex].color;
                }
                else {
                    color = this.currentVectorLayer.layerColor;
                }
            }
            return color;
        }
        getCurrentLayerFillColor() {
            let color = null;
            if (this.currentVectorLayer != null) {
                if (this.currentVectorLayer.fillAreaType == ManualTracingTool.FillAreaTypeID.paletteColor) {
                    color = this.toolContext.document.paletteColors[this.currentVectorLayer.fill_PaletteColorIndex].color;
                }
                else {
                    color = this.currentVectorLayer.fillColor;
                }
            }
            return color;
        }
        startModalTool(modalTool) {
            this.toolContext.mainEditor.startModalTool(modalTool);
        }
        endModalTool() {
            this.toolContext.mainEditor.endModalTool();
        }
        cancelModalTool() {
            this.toolContext.mainEditor.cancelModalTool();
        }
        isModalToolRunning() {
            return this.toolContext.mainEditor.isModalToolRunning();
        }
        openFileDialog(targetID) {
            this.toolContext.mainEditor.openFileDialog(targetID);
        }
        openDocumentSettingDialog() {
            this.toolContext.mainEditor.openDocumentSettingDialog();
        }
        startLoadingCurrentDocumentResources() {
            this.toolContext.mainEditor.startLoadingDocumentResourcesProcess(this.toolContext.document);
        }
        getViewScaledLength(length) {
            return length / this.viewScale;
        }
        getViewScaledDrawLineUnitLength() {
            let resamplingUnitLength = this.getViewScaledLength(this.toolContext.resamplingUnitLength);
            if (resamplingUnitLength > this.toolContext.resamplingUnitLength) {
                resamplingUnitLength = this.toolContext.resamplingUnitLength;
            }
            return resamplingUnitLength;
        }
        collectEditTargetViewKeyframeLayers() {
            return this.toolContext.mainEditor.collectEditTargetViewKeyframeLayers();
        }
        getPosingModelByName(name) {
            return this.toolContext.mainEditor.getPosingModelByName(name);
        }
    }
    ManualTracingTool.ToolEnvironment = ToolEnvironment;
    class ToolDrawingStyle {
        constructor() {
            this.selectedButtonColor = vec4.fromValues(0.90, 0.90, 1.0, 1.0);
            this.linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.testColor = vec4.fromValues(0.0, 0.7, 0.0, 1.0);
            this.sampledPointColor = vec4.fromValues(0.0, 0.5, 1.0, 1.0);
            this.extrutePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.editingLineColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
            this.selectedVectorLineColor = vec4.fromValues(1.0, 0.5, 0.0, 0.8);
            this.linePointVisualBrightnessAdjustRate = 0.3;
            this.mouseCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);
            this.operatorCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);
            this.modalToolSelectedAreaLineColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);
            this.latticePointRadius = 4.0;
            this.latticePointHitRadius = 10.0;
            this.latticePointPadding = 8.0;
            this.layerWindowBackgroundColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            this.layerWindowItemActiveLayerColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            this.layerWindowItemSelectedColor = vec4.fromValues(0.95, 0.95, 1.0, 1.0);
            this.paletteSelectorItemEdgeColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.timeLineUnitFrameColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
            this.timeLineCurrentFrameColor = vec4.fromValues(0.2, 1.0, 0.2, 0.5);
            this.timeLineKeyFrameColor = vec4.fromValues(0.0, 0.0, 1.0, 0.1);
            this.timeLineLayerKeyFrameColor = vec4.fromValues(0.8, 0.8, 0.0, 1.0);
            this.timeLineOutOfLoopingColor = vec4.fromValues(0.0, 0.0, 0.0, 0.1);
            this.posing3DBoneGrayColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
            this.posing3DBoneHeadColor = vec4.fromValues(0.2, 0.2, 1.0, 1.0);
            this.posing3DBoneForwardColor = vec4.fromValues(0.2, 1.0, 0.2, 1.0);
            this.posing3DBoneInputCircleRadius = 15.0;
            this.posing3DBoneInputCircleHitRadius = 1.8;
            this.generalLinePointRadius = 2.0;
            this.selectedLinePointRadius = 3.0;
            this.viewZoomAdjustingSpeedRate = 0.2;
        }
    }
    ManualTracingTool.ToolDrawingStyle = ToolDrawingStyle;
    class ToolDrawingEnvironment {
        constructor() {
            this.canvasWindow = null;
            this.editorDrawer = null;
            this.render = null;
            this.style = null;
        }
        setEnvironment(editorDrawer, render, style) {
            this.editorDrawer = editorDrawer;
            this.render = render;
            this.style = style;
        }
        setVariables(canvasWindow) {
            this.canvasWindow = canvasWindow;
        }
        drawLine(locationFrom, locationTo, strokeWidth, color) {
            this.render.setStrokeColorV(color);
            this.render.setStrokeWidth(strokeWidth);
            this.render.beginPath();
            this.render.moveTo(locationFrom[0], locationFrom[1]);
            this.render.lineTo(locationTo[0], locationTo[1]);
            this.render.stroke();
        }
        drawCircle(center, raduis, strokeWidth, color) {
            this.render.setStrokeColorV(color);
            this.render.setStrokeWidth(strokeWidth);
            this.render.beginPath();
            this.render.circle(center[0], center[1], raduis);
            this.render.stroke();
        }
    }
    ManualTracingTool.ToolDrawingEnvironment = ToolDrawingEnvironment;
    class ToolMouseEvent {
        constructor() {
            this.button = 0;
            this.buttons = 0;
            this.offsetX = 0.0;
            this.offsetY = 0.0;
            this.wheelDelta = 0.0;
            this.isMouseDragging = false;
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
            this.mouseDownLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.mouseMovedVector = vec3.fromValues(0.0, 0.0, 0.0);
            this.clickCount = 0;
            this.lastClickedOffset = vec3.fromValues(0.0, 0.0, 0.0);
            this.mouseDownOffset = vec3.fromValues(0.0, 0.0, 0.0);
            this.mouseMovedOffset = vec3.fromValues(0.0, 0.0, 0.0);
            this.tempVec3 = vec3.fromValues(0.0, 0.0, 0.0);
        }
        isLeftButtonPressing() {
            return (this.button == 0 && this.buttons != 0);
        }
        isRightButtonPressing() {
            return (this.button == 2 && this.buttons != 0);
        }
        isCenterButtonPressing() {
            return (this.button == 1 && this.buttons != 0);
        }
        isLeftButtonReleased() {
            return (this.buttons == 0);
        }
        isRightButtonReleased() {
            return (this.buttons == 0);
        }
        isCenterButtonReleased() {
            return (this.buttons == 0);
        }
        hundleDoubleClick(offsetX, offsetY) {
            if (this.clickCount == 0) {
                this.clickCount++;
                this.lastClickedOffset[0] = offsetX;
                this.lastClickedOffset[1] = offsetY;
                setTimeout(() => {
                    this.clickCount = 0;
                }, 350);
                return false;
            }
            else {
                this.clickCount = 0;
                if (Math.pow(offsetX - this.lastClickedOffset[0], 2)
                    + Math.pow(offsetY - this.lastClickedOffset[1], 2) < 9.0) {
                    return true;
                }
                else {
                    return false;
                }
            }
        }
        startMouseDragging() {
            this.isMouseDragging = true;
            vec3.copy(this.mouseDownLocation, this.location);
            vec3.set(this.mouseMovedVector, 0.0, 0.0, 0.0);
            vec3.set(this.mouseDownOffset, this.offsetX, this.offsetY, 0.0);
            vec3.set(this.mouseMovedOffset, 0.0, 0.0, 0.0);
        }
        processMouseDragging() {
            if (!this.isMouseDragging) {
                return;
            }
            vec3.subtract(this.mouseMovedVector, this.mouseDownLocation, this.location);
            vec3.set(this.tempVec3, this.offsetX, this.offsetY, 0.0);
            vec3.subtract(this.mouseMovedOffset, this.mouseDownOffset, this.tempVec3);
        }
        endMouseDragging() {
            this.isMouseDragging = false;
        }
    }
    ManualTracingTool.ToolMouseEvent = ToolMouseEvent;
    class ToolBase {
        constructor() {
            this.helpText = ''; // @virtual
            this.isEditTool = false; // @virtual
            this.toolBarImage = null;
            this.toolBarImageIndex = 0;
        }
        isAvailable(env) {
            return true;
        }
        mouseDown(e, env) {
        }
        mouseMove(e, env) {
        }
        mouseUp(e, env) {
        }
        keydown(e, env) {
            return false;
        }
        onActivated(env) {
        }
        onDrawEditor(env, drawEnv) {
        }
        toolWindowItemClick(e, env) {
        }
        toolWindowItemDoubleClick(e, env) {
        }
        onOpenFile(filePath, env) {
        }
    }
    ManualTracingTool.ToolBase = ToolBase;
    class ModalToolBase extends ToolBase {
        prepareModal(e, env) {
            return true;
        }
        startModal(env) {
            env.setRedrawEditorWindow();
        }
        endModal(env) {
            env.setRedrawEditorWindow();
        }
        cancelModal(env) {
            env.setRedrawMainWindowEditorWindow();
        }
    }
    ManualTracingTool.ModalToolBase = ModalToolBase;
    class MainTool {
        constructor() {
            this.mainToolID = MainToolID.none;
            this.subTools = new List();
            this.currentSubToolIndex = 0;
        }
        id(mainToolID) {
            this.mainToolID = mainToolID;
            return this;
        }
        subTool(tool, toolBarImage, toolBarImageIndex) {
            tool.toolBarImage = toolBarImage;
            tool.toolBarImageIndex = toolBarImageIndex;
            this.subTools.push(tool);
            return this;
        }
    }
    ManualTracingTool.MainTool = MainTool;
})(ManualTracingTool || (ManualTracingTool = {}));
