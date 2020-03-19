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
    var MainToolID;
    (function (MainToolID) {
        MainToolID[MainToolID["none"] = 0] = "none";
        MainToolID[MainToolID["drawLine"] = 1] = "drawLine";
        MainToolID[MainToolID["posing"] = 2] = "posing";
        MainToolID[MainToolID["imageReferenceLayer"] = 3] = "imageReferenceLayer";
        MainToolID[MainToolID["misc"] = 4] = "misc";
        MainToolID[MainToolID["edit"] = 5] = "edit";
    })(MainToolID = ManualTracingTool.MainToolID || (ManualTracingTool.MainToolID = {}));
    var DrawLineToolSubToolID;
    (function (DrawLineToolSubToolID) {
        DrawLineToolSubToolID[DrawLineToolSubToolID["drawLine"] = 0] = "drawLine";
        DrawLineToolSubToolID[DrawLineToolSubToolID["extrudeLine"] = 1] = "extrudeLine";
        DrawLineToolSubToolID[DrawLineToolSubToolID["deletePointBrush"] = 2] = "deletePointBrush";
        DrawLineToolSubToolID[DrawLineToolSubToolID["editLinePointWidth_BrushSelect"] = 3] = "editLinePointWidth_BrushSelect";
        DrawLineToolSubToolID[DrawLineToolSubToolID["scratchLine"] = 4] = "scratchLine";
        DrawLineToolSubToolID[DrawLineToolSubToolID["overWriteLineWidth"] = 5] = "overWriteLineWidth";
        DrawLineToolSubToolID[DrawLineToolSubToolID["scratchLineWidth"] = 6] = "scratchLineWidth";
    })(DrawLineToolSubToolID = ManualTracingTool.DrawLineToolSubToolID || (ManualTracingTool.DrawLineToolSubToolID = {}));
    var EditModeSubToolID;
    (function (EditModeSubToolID) {
        EditModeSubToolID[EditModeSubToolID["mainEditTool"] = 0] = "mainEditTool";
    })(EditModeSubToolID = ManualTracingTool.EditModeSubToolID || (ManualTracingTool.EditModeSubToolID = {}));
    var ModalToolID;
    (function (ModalToolID) {
        ModalToolID[ModalToolID["none"] = 0] = "none";
        ModalToolID[ModalToolID["grabMove"] = 1] = "grabMove";
        ModalToolID[ModalToolID["rotate"] = 2] = "rotate";
        ModalToolID[ModalToolID["scale"] = 3] = "scale";
        ModalToolID[ModalToolID["latticeMove"] = 4] = "latticeMove";
        ModalToolID[ModalToolID["countOfID"] = 5] = "countOfID";
    })(ModalToolID = ManualTracingTool.ModalToolID || (ManualTracingTool.ModalToolID = {}));
    var Posing3DSubToolID;
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
    var EditModeID;
    (function (EditModeID) {
        EditModeID[EditModeID["editMode"] = 1] = "editMode";
        EditModeID[EditModeID["drawMode"] = 2] = "drawMode";
    })(EditModeID = ManualTracingTool.EditModeID || (ManualTracingTool.EditModeID = {}));
    var OperationUnitID;
    (function (OperationUnitID) {
        OperationUnitID[OperationUnitID["none"] = 0] = "none";
        OperationUnitID[OperationUnitID["linePoint"] = 1] = "linePoint";
        OperationUnitID[OperationUnitID["lineSegment"] = 2] = "lineSegment";
        OperationUnitID[OperationUnitID["line"] = 3] = "line";
        OperationUnitID[OperationUnitID["layer"] = 4] = "layer";
        OperationUnitID[OperationUnitID["countOfID"] = 5] = "countOfID";
    })(OperationUnitID = ManualTracingTool.OperationUnitID || (ManualTracingTool.OperationUnitID = {}));
    var OpenFileDialogTargetID;
    (function (OpenFileDialogTargetID) {
        OpenFileDialogTargetID[OpenFileDialogTargetID["none"] = 0] = "none";
        OpenFileDialogTargetID[OpenFileDialogTargetID["openDocument"] = 1] = "openDocument";
        OpenFileDialogTargetID[OpenFileDialogTargetID["saveDocument"] = 2] = "saveDocument";
        OpenFileDialogTargetID[OpenFileDialogTargetID["imageFileReferenceLayerFilePath"] = 3] = "imageFileReferenceLayerFilePath";
    })(OpenFileDialogTargetID = ManualTracingTool.OpenFileDialogTargetID || (ManualTracingTool.OpenFileDialogTargetID = {}));
    var ToolBaseWindow = /** @class */ (function (_super) {
        __extends(ToolBaseWindow, _super);
        function ToolBaseWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.toolMouseEvent = new ToolMouseEvent();
            _this.dragBeforeViewLocation = vec3.create();
            return _this;
        }
        ToolBaseWindow.prototype.startMouseDragging = function () {
            this.toolMouseEvent.startMouseDragging();
            vec3.copy(this.dragBeforeViewLocation, this.viewLocation);
        };
        ToolBaseWindow.prototype.endMouseDragging = function () {
            this.toolMouseEvent.endMouseDragging();
        };
        return ToolBaseWindow;
    }(ManualTracingTool.CanvasWindow));
    ManualTracingTool.ToolBaseWindow = ToolBaseWindow;
    var PickingWindow = /** @class */ (function (_super) {
        __extends(PickingWindow, _super);
        function PickingWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxDepth = 4.0;
            return _this;
        }
        return PickingWindow;
    }(ManualTracingTool.CanvasWindow));
    ManualTracingTool.PickingWindow = PickingWindow;
    var OperatorCursor = /** @class */ (function () {
        function OperatorCursor() {
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
            this.radius = 15.0;
        }
        return OperatorCursor;
    }());
    ManualTracingTool.OperatorCursor = OperatorCursor;
    var LatticePointEditTypeID;
    (function (LatticePointEditTypeID) {
        LatticePointEditTypeID[LatticePointEditTypeID["none"] = 0] = "none";
        LatticePointEditTypeID[LatticePointEditTypeID["horizontalOnly"] = 1] = "horizontalOnly";
        LatticePointEditTypeID[LatticePointEditTypeID["verticalOnly"] = 2] = "verticalOnly";
        LatticePointEditTypeID[LatticePointEditTypeID["allDirection"] = 3] = "allDirection";
    })(LatticePointEditTypeID = ManualTracingTool.LatticePointEditTypeID || (ManualTracingTool.LatticePointEditTypeID = {}));
    var LatticePoint = /** @class */ (function () {
        function LatticePoint() {
            this.latticePointEditType = LatticePointEditTypeID.none;
            this.baseLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
        }
        return LatticePoint;
    }());
    ManualTracingTool.LatticePoint = LatticePoint;
    var ViewKeyframeLayer = /** @class */ (function () {
        function ViewKeyframeLayer() {
            this.layer = null;
            this.vectorLayerKeyframe = null;
        }
        ViewKeyframeLayer.prototype.hasKeyframe = function () {
            return (this.vectorLayerKeyframe != null);
        };
        ViewKeyframeLayer.forEachGroup = function (viewKeyframeLayers, loopBodyFunction) {
            for (var _i = 0, viewKeyframeLayers_1 = viewKeyframeLayers; _i < viewKeyframeLayers_1.length; _i++) {
                var viewKeyframeLayer = viewKeyframeLayers_1[_i];
                if (viewKeyframeLayer.vectorLayerKeyframe == null) {
                    continue;
                }
                for (var _a = 0, _b = viewKeyframeLayer.vectorLayerKeyframe.geometry.groups; _a < _b.length; _a++) {
                    var group = _b[_a];
                    loopBodyFunction(group);
                }
            }
        };
        ViewKeyframeLayer.forEachGeometry = function (viewKeyframeLayers, loopBodyFunction) {
            for (var _i = 0, viewKeyframeLayers_2 = viewKeyframeLayers; _i < viewKeyframeLayers_2.length; _i++) {
                var viewKeyframeLayer = viewKeyframeLayers_2[_i];
                if (viewKeyframeLayer.vectorLayerKeyframe == null) {
                    continue;
                }
                loopBodyFunction(viewKeyframeLayer.vectorLayerKeyframe.geometry);
            }
        };
        ViewKeyframeLayer.forEachLayerAndGroup = function (viewKeyframeLayers, loopBodyFunction) {
            for (var _i = 0, viewKeyframeLayers_3 = viewKeyframeLayers; _i < viewKeyframeLayers_3.length; _i++) {
                var viewKeyframeLayer = viewKeyframeLayers_3[_i];
                if (viewKeyframeLayer.vectorLayerKeyframe == null) {
                    continue;
                }
                for (var _a = 0, _b = viewKeyframeLayer.vectorLayerKeyframe.geometry.groups; _a < _b.length; _a++) {
                    var group = _b[_a];
                    loopBodyFunction(viewKeyframeLayer.layer, group);
                }
            }
        };
        return ViewKeyframeLayer;
    }());
    ManualTracingTool.ViewKeyframeLayer = ViewKeyframeLayer;
    var ViewKeyframe = /** @class */ (function () {
        function ViewKeyframe() {
            this.frame = 0;
            this.layers = new List();
        }
        ViewKeyframe.findViewKeyframe = function (viewKeyframes, frame) {
            var keyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, frame);
            if (keyframeIndex != -1) {
                return viewKeyframes[keyframeIndex];
            }
            else {
                return null;
            }
        };
        ViewKeyframe.findViewKeyframeIndex = function (viewKeyframes, frame) {
            var resultIndex = 0;
            for (var index = 0; index < viewKeyframes.length; index++) {
                if (viewKeyframes[index].frame > frame) {
                    break;
                }
                resultIndex = index;
            }
            return resultIndex;
        };
        ViewKeyframe.findViewKeyframeLayerIndex = function (viewKeyFrame, layer) {
            for (var index = 0; index < viewKeyFrame.layers.length; index++) {
                if (viewKeyFrame.layers[index].layer == layer) {
                    return index;
                }
            }
            return -1;
        };
        ViewKeyframe.findViewKeyframeLayer = function (viewKeyFrame, layer) {
            var index = this.findViewKeyframeLayerIndex(viewKeyFrame, layer);
            if (index != -1) {
                return viewKeyFrame.layers[index];
            }
            else {
                return null;
            }
        };
        return ViewKeyframe;
    }());
    ManualTracingTool.ViewKeyframe = ViewKeyframe;
    var ViewLayerContext = /** @class */ (function () {
        function ViewLayerContext() {
            this.keyframes = null;
        }
        return ViewLayerContext;
    }());
    ManualTracingTool.ViewLayerContext = ViewLayerContext;
    var DrawPassBuffer = /** @class */ (function () {
        function DrawPassBuffer() {
            this.canvas = null;
            this.glTexture = null;
            this.width = 0;
            this.height = 0;
        }
        return DrawPassBuffer;
    }());
    ManualTracingTool.DrawPassBuffer = DrawPassBuffer;
    var TempVirtualLayerTypeID;
    (function (TempVirtualLayerTypeID) {
        TempVirtualLayerTypeID[TempVirtualLayerTypeID["none"] = 0] = "none";
        TempVirtualLayerTypeID[TempVirtualLayerTypeID["normal"] = 1] = "normal";
        TempVirtualLayerTypeID[TempVirtualLayerTypeID["virtualGroup"] = 2] = "virtualGroup";
    })(TempVirtualLayerTypeID = ManualTracingTool.TempVirtualLayerTypeID || (ManualTracingTool.TempVirtualLayerTypeID = {}));
    var TempVirtualLayer = /** @class */ (function () {
        function TempVirtualLayer() {
            this.type = TempVirtualLayerTypeID.none;
            this.layer = null;
            this.children = new List();
        }
        return TempVirtualLayer;
    }());
    ManualTracingTool.TempVirtualLayer = TempVirtualLayer;
    var DrawPathOperationTypeID;
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
    var DrawPathStep = /** @class */ (function () {
        function DrawPathStep() {
            this._debugText = '';
            this.layer = null;
            this.viewKeyframeLayer = null;
            this.operationType = DrawPathOperationTypeID.none;
            this.compositeOperation = 'source-over';
        }
        DrawPathStep.prototype.setType = function (operationType) {
            this.operationType = operationType;
            this._debugText = DrawPathOperationTypeID[operationType];
        };
        return DrawPathStep;
    }());
    ManualTracingTool.DrawPathStep = DrawPathStep;
    var DrawPathModeID;
    (function (DrawPathModeID) {
        DrawPathModeID[DrawPathModeID["none"] = 0] = "none";
        DrawPathModeID[DrawPathModeID["editor"] = 1] = "editor";
        DrawPathModeID[DrawPathModeID["editorPreview"] = 2] = "editorPreview";
        DrawPathModeID[DrawPathModeID["export"] = 3] = "export";
    })(DrawPathModeID = ManualTracingTool.DrawPathModeID || (ManualTracingTool.DrawPathModeID = {}));
    var DrawPathContext = /** @class */ (function () {
        function DrawPathContext() {
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
        DrawPathContext.prototype.clearDrawingStates = function () {
            this.lastDrawPathIndex = -1;
            if (this.bufferStack.length > 0) {
                this.bufferStack = new List();
            }
        };
        DrawPathContext.prototype.resetLazyDrawProcess = function () {
            this.lazyDraw_ProcessedIndex = -1;
            this.lazyDraw_LastResetTime = Platform.getCurrentTime();
        };
        DrawPathContext.prototype.getCurrentBuffer = function () {
            if (this.bufferStack.length == 0) {
                throw ('バッファスタックがありません。');
            }
            return this.bufferStack[this.bufferStack.length - 1];
        };
        DrawPathContext.prototype.isFullRendering = function () {
            return (this.drawPathModeID == DrawPathModeID.editorPreview
                || this.drawPathModeID == DrawPathModeID.export);
        };
        DrawPathContext.prototype.isLazyDrawBigining = function () {
            return (this.lazyDraw_ProcessedIndex == -1);
        };
        DrawPathContext.prototype.isLazyDrawFinished = function () {
            return (this.lazyDraw_ProcessedIndex >= this.steps.length - 1) && !this.needsLazyRedraw;
        };
        DrawPathContext.prototype.isLazyDrawWaiting = function () {
            return (!this.isLazyDrawFinished()
                && this.lazyDraw_LastResetTime + this.lazyDraw_WaitTime > Platform.getCurrentTime());
        };
        DrawPathContext.prototype.isLastDrawExist = function () {
            return (this.lastDrawPathIndex != -1);
        };
        return DrawPathContext;
    }());
    ManualTracingTool.DrawPathContext = DrawPathContext;
    var ToolClipboard = /** @class */ (function () {
        function ToolClipboard() {
            this.copy_VectorGroup = null;
        }
        return ToolClipboard;
    }());
    ManualTracingTool.ToolClipboard = ToolClipboard;
    var ToolContext = /** @class */ (function () {
        function ToolContext() {
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
            this.drawCPUOnly = true;
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
        return ToolContext;
    }());
    ManualTracingTool.ToolContext = ToolContext;
    var ToolEnvironment = /** @class */ (function () {
        function ToolEnvironment(toolContext) {
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
        ToolEnvironment.prototype.updateContext = function () {
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
        };
        ToolEnvironment.prototype.setRedrawHeaderWindow = function () {
            this.toolContext.redrawHeaderWindow = true;
        };
        ToolEnvironment.prototype.setRedrawMainWindow = function () {
            this.toolContext.redrawMainWindow = true;
            this.toolContext.redrawCurrentLayer = false;
        };
        ToolEnvironment.prototype.setRedrawCurrentLayer = function () {
            if (!this.toolContext.redrawMainWindow) {
                this.toolContext.redrawCurrentLayer = true;
            }
            this.toolContext.redrawMainWindow = true;
        };
        ToolEnvironment.prototype.setRedrawEditorWindow = function () {
            this.toolContext.redrawEditorWindow = true;
        };
        ToolEnvironment.prototype.setRedrawMainWindowEditorWindow = function () {
            this.setRedrawMainWindow();
            this.setRedrawEditorWindow();
            this.setRedrawWebGLWindow();
        };
        ToolEnvironment.prototype.setRedrawLayerWindow = function () {
            this.toolContext.redrawLayerWindow = true;
            this.toolContext.redrawPaletteSelectorWindow = true;
            this.toolContext.redrawColorMixerWindow = true;
        };
        ToolEnvironment.prototype.updateLayerStructure = function () {
            this.toolContext.mainEditor.updateLayerStructure();
            this.setRedrawLayerWindow();
            this.setRedrawTimeLineWindow();
            this.setRedrawMainWindowEditorWindow();
        };
        ToolEnvironment.prototype.setRedrawSubtoolWindow = function () {
            this.toolContext.redrawSubtoolWindow = true;
        };
        ToolEnvironment.prototype.setRedrawTimeLineWindow = function () {
            this.toolContext.redrawTimeLineWindow = true;
        };
        ToolEnvironment.prototype.setRedrawColorSelectorWindow = function () {
            this.toolContext.redrawPaletteSelectorWindow = true;
        };
        ToolEnvironment.prototype.setRedrawColorMixerWindow = function () {
            this.toolContext.redrawColorMixerWindow = true;
        };
        ToolEnvironment.prototype.setRedrawWebGLWindow = function () {
            this.toolContext.redrawWebGLWindow = true;
        };
        ToolEnvironment.prototype.setRedrawAllWindows = function () {
            this.setRedrawMainWindowEditorWindow();
            this.setRedrawSubtoolWindow();
            this.setRedrawLayerWindow();
            this.setRedrawTimeLineWindow();
            this.setRedrawColorSelectorWindow();
            this.setRedrawWebGLWindow();
        };
        ToolEnvironment.prototype.setLazyRedraw = function () {
            this.toolContext.lazy_DrawPathContext.needsLazyRedraw = true;
        };
        ToolEnvironment.prototype.isAnyModifierKeyPressing = function () {
            return (this.toolContext.shiftKey || this.toolContext.altKey || this.toolContext.ctrlKey);
        };
        ToolEnvironment.prototype.isShiftKeyPressing = function () {
            return (this.toolContext.shiftKey);
        };
        ToolEnvironment.prototype.isCtrlKeyPressing = function () {
            return (this.toolContext.ctrlKey);
        };
        ToolEnvironment.prototype.isAltKeyPressing = function () {
            return (this.toolContext.altKey);
        };
        ToolEnvironment.prototype.isDrawMode = function () {
            return (this.toolContext.editMode == EditModeID.drawMode);
        };
        ToolEnvironment.prototype.isEditMode = function () {
            return (this.toolContext.editMode == EditModeID.editMode);
        };
        ToolEnvironment.prototype.isCurrentLayerVectorLayer = function () {
            return (this.currentVectorLayer != null);
        };
        ToolEnvironment.prototype.isCurrentLayerPosingLayer = function () {
            return (this.currentPosingLayer != null);
        };
        ToolEnvironment.prototype.isCurrentLayerImageFileReferenceLayer = function () {
            return (this.currentImageFileReferenceLayer != null);
        };
        ToolEnvironment.prototype.isCurrentLayerContainerLayer = function () {
            return (this.currentLayer.type == ManualTracingTool.LayerTypeID.groupLayer);
        };
        ToolEnvironment.prototype.needsDrawOperatorCursor = function () {
            return (this.isEditMode() || this.toolContext.needsDrawOperatorCursor);
        };
        ToolEnvironment.prototype.setCurrentOperationUnitID = function (operationUnitID) {
            this.toolContext.mainEditor.setCurrentOperationUnitID(operationUnitID);
        };
        ToolEnvironment.prototype.setCurrentLayer = function (layer) {
            this.toolContext.mainEditor.setCurrentLayer(layer);
        };
        ToolEnvironment.prototype.setCurrentVectorLine = function (line, group) {
            this.toolContext.currentVectorLine = line;
            this.currentVectorLine = line;
            this.toolContext.currentVectorGroup = group;
            this.currentVectorGroup = group;
        };
        ToolEnvironment.prototype.getCurrentLayerLineColor = function () {
            var color = null;
            if (this.currentVectorLayer != null) {
                if (this.currentVectorLayer.drawLineType == ManualTracingTool.DrawLineTypeID.paletteColor) {
                    color = this.toolContext.document.paletteColors[this.currentVectorLayer.line_PaletteColorIndex].color;
                }
                else {
                    color = this.currentVectorLayer.layerColor;
                }
            }
            return color;
        };
        ToolEnvironment.prototype.getCurrentLayerFillColor = function () {
            var color = null;
            if (this.currentVectorLayer != null) {
                if (this.currentVectorLayer.fillAreaType == ManualTracingTool.FillAreaTypeID.paletteColor) {
                    color = this.toolContext.document.paletteColors[this.currentVectorLayer.fill_PaletteColorIndex].color;
                }
                else {
                    color = this.currentVectorLayer.fillColor;
                }
            }
            return color;
        };
        ToolEnvironment.prototype.startModalTool = function (modalTool) {
            this.toolContext.mainEditor.startModalTool(modalTool);
        };
        ToolEnvironment.prototype.endModalTool = function () {
            this.toolContext.mainEditor.endModalTool();
        };
        ToolEnvironment.prototype.cancelModalTool = function () {
            this.toolContext.mainEditor.cancelModalTool();
        };
        ToolEnvironment.prototype.isModalToolRunning = function () {
            return this.toolContext.mainEditor.isModalToolRunning();
        };
        ToolEnvironment.prototype.openFileDialog = function (targetID) {
            this.toolContext.mainEditor.openFileDialog(targetID);
        };
        ToolEnvironment.prototype.openDocumentSettingDialog = function () {
            this.toolContext.mainEditor.openDocumentSettingDialog();
        };
        ToolEnvironment.prototype.startLoadingCurrentDocumentResources = function () {
            this.toolContext.mainEditor.startLoadingDocumentResourcesProcess(this.toolContext.document);
        };
        ToolEnvironment.prototype.getViewScaledLength = function (length) {
            return length / this.viewScale;
        };
        ToolEnvironment.prototype.getViewScaledDrawLineUnitLength = function () {
            var resamplingUnitLength = this.getViewScaledLength(this.toolContext.resamplingUnitLength);
            if (resamplingUnitLength > this.toolContext.resamplingUnitLength) {
                resamplingUnitLength = this.toolContext.resamplingUnitLength;
            }
            return resamplingUnitLength;
        };
        ToolEnvironment.prototype.collectEditTargetViewKeyframeLayers = function () {
            return this.toolContext.mainEditor.collectEditTargetViewKeyframeLayers();
        };
        ToolEnvironment.prototype.getPosingModelByName = function (name) {
            return this.toolContext.mainEditor.getPosingModelByName(name);
        };
        return ToolEnvironment;
    }());
    ManualTracingTool.ToolEnvironment = ToolEnvironment;
    var ToolDrawingStyle = /** @class */ (function () {
        function ToolDrawingStyle() {
            this.selectedButtonColor = vec4.fromValues(0.90, 0.90, 1.0, 1.0);
            this.linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.testColor = vec4.fromValues(0.0, 0.7, 0.0, 1.0);
            this.sampledPointColor = vec4.fromValues(0.0, 0.5, 1.0, 0.3);
            this.extrutePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.editingLineColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
            this.selectedVectorLineColor = vec4.fromValues(1.0, 0.5, 0.0, 0.8);
            this.linePointVisualBrightnessAdjustRate = 0.3;
            this.editModeOtherLayerAlphaAdjustRate = 0.3;
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
            this.paletteSelectorItemSelectedColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
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
        return ToolDrawingStyle;
    }());
    ManualTracingTool.ToolDrawingStyle = ToolDrawingStyle;
    var ToolDrawingEnvironment = /** @class */ (function () {
        function ToolDrawingEnvironment() {
            this.canvasWindow = null;
            this.editorDrawer = null;
            this.render = null;
            this.style = null;
        }
        ToolDrawingEnvironment.prototype.setEnvironment = function (editorDrawer, render, style) {
            this.editorDrawer = editorDrawer;
            this.render = render;
            this.style = style;
        };
        ToolDrawingEnvironment.prototype.setVariables = function (canvasWindow) {
            this.canvasWindow = canvasWindow;
        };
        ToolDrawingEnvironment.prototype.drawLine = function (locationFrom, locationTo, strokeWidth, color) {
            this.render.setStrokeColorV(color);
            this.render.setStrokeWidth(strokeWidth);
            this.render.beginPath();
            this.render.moveTo(locationFrom[0], locationFrom[1]);
            this.render.lineTo(locationTo[0], locationTo[1]);
            this.render.stroke();
        };
        ToolDrawingEnvironment.prototype.drawCircle = function (center, raduis, strokeWidth, color) {
            this.render.setStrokeColorV(color);
            this.render.setStrokeWidth(strokeWidth);
            this.render.beginPath();
            this.render.circle(center[0], center[1], raduis);
            this.render.stroke();
        };
        return ToolDrawingEnvironment;
    }());
    ManualTracingTool.ToolDrawingEnvironment = ToolDrawingEnvironment;
    var ToolMouseEvent = /** @class */ (function () {
        function ToolMouseEvent() {
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
        ToolMouseEvent.prototype.isLeftButtonPressing = function () {
            return (this.button == 0 && this.buttons != 0);
        };
        ToolMouseEvent.prototype.isRightButtonPressing = function () {
            return (this.button == 2 && this.buttons != 0);
        };
        ToolMouseEvent.prototype.isCenterButtonPressing = function () {
            return (this.button == 1 && this.buttons != 0);
        };
        ToolMouseEvent.prototype.isLeftButtonReleased = function () {
            return (this.buttons == 0);
        };
        ToolMouseEvent.prototype.isRightButtonReleased = function () {
            return (this.buttons == 0);
        };
        ToolMouseEvent.prototype.isCenterButtonReleased = function () {
            return (this.buttons == 0);
        };
        ToolMouseEvent.prototype.hundleDoubleClick = function (offsetX, offsetY) {
            var _this = this;
            if (this.clickCount == 0) {
                this.clickCount++;
                this.lastClickedOffset[0] = offsetX;
                this.lastClickedOffset[1] = offsetY;
                setTimeout(function () {
                    _this.clickCount = 0;
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
        };
        ToolMouseEvent.prototype.startMouseDragging = function () {
            this.isMouseDragging = true;
            vec3.copy(this.mouseDownLocation, this.location);
            vec3.set(this.mouseMovedVector, 0.0, 0.0, 0.0);
            vec3.set(this.mouseDownOffset, this.offsetX, this.offsetY, 0.0);
            vec3.set(this.mouseMovedOffset, 0.0, 0.0, 0.0);
        };
        ToolMouseEvent.prototype.processMouseDragging = function () {
            if (!this.isMouseDragging) {
                return;
            }
            vec3.subtract(this.mouseMovedVector, this.mouseDownLocation, this.location);
            vec3.set(this.tempVec3, this.offsetX, this.offsetY, 0.0);
            vec3.subtract(this.mouseMovedOffset, this.mouseDownOffset, this.tempVec3);
        };
        ToolMouseEvent.prototype.endMouseDragging = function () {
            this.isMouseDragging = false;
        };
        return ToolMouseEvent;
    }());
    ManualTracingTool.ToolMouseEvent = ToolMouseEvent;
    var ToolBase = /** @class */ (function () {
        function ToolBase() {
            this.helpText = ''; // @virtual
            this.isEditTool = false; // @virtual
            this.toolBarImage = null;
            this.toolBarImageIndex = 0;
        }
        ToolBase.prototype.isAvailable = function (env) {
            return true;
        };
        ToolBase.prototype.mouseDown = function (e, env) {
        };
        ToolBase.prototype.mouseMove = function (e, env) {
        };
        ToolBase.prototype.mouseUp = function (e, env) {
        };
        ToolBase.prototype.keydown = function (e, env) {
            return false;
        };
        ToolBase.prototype.onActivated = function (env) {
        };
        ToolBase.prototype.onDrawEditor = function (env, drawEnv) {
        };
        ToolBase.prototype.toolWindowItemClick = function (env) {
        };
        ToolBase.prototype.toolWindowItemDoubleClick = function (e, env) {
        };
        ToolBase.prototype.onOpenFile = function (filePath, env) {
        };
        return ToolBase;
    }());
    ManualTracingTool.ToolBase = ToolBase;
    var ModalToolBase = /** @class */ (function (_super) {
        __extends(ModalToolBase, _super);
        function ModalToolBase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ModalToolBase.prototype.prepareModal = function (e, env) {
            return true;
        };
        ModalToolBase.prototype.startModal = function (env) {
            env.setRedrawEditorWindow();
        };
        ModalToolBase.prototype.endModal = function (env) {
            env.setRedrawEditorWindow();
        };
        ModalToolBase.prototype.cancelModal = function (env) {
            env.setRedrawMainWindowEditorWindow();
        };
        return ModalToolBase;
    }(ToolBase));
    ManualTracingTool.ModalToolBase = ModalToolBase;
    var MainTool = /** @class */ (function () {
        function MainTool() {
            this.mainToolID = MainToolID.none;
            this.subTools = new List();
            this.currentSubToolIndex = 0;
        }
        MainTool.prototype.id = function (mainToolID) {
            this.mainToolID = mainToolID;
            return this;
        };
        MainTool.prototype.subTool = function (tool, toolBarImage, toolBarImageIndex) {
            tool.toolBarImage = toolBarImage;
            tool.toolBarImageIndex = toolBarImageIndex;
            this.subTools.push(tool);
            return this;
        };
        return MainTool;
    }());
    ManualTracingTool.MainTool = MainTool;
})(ManualTracingTool || (ManualTracingTool = {}));