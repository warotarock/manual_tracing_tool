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
    var App_Tool = /** @class */ (function (_super) {
        __extends(App_Tool, _super);
        function App_Tool() {
            var _this = _super.call(this) || this;
            // Integrated tool system
            _this.mainTools = new List();
            _this.currentTool = null;
            _this.currentViewKeyframe = null;
            _this.previousKeyframe = null;
            _this.nextKeyframe = null;
            //layerCommands = new List<Command_Layer_CommandBase>(LayerWindowButtonID.IDCount);
            // Modal tools
            _this.currentModalTool = null;
            _this.modalBeforeTool = null;
            _this.vectorLayer_ModalTools = List(ManualTracingTool.ModalToolID.countOfID);
            _this.imageFileReferenceLayer_ModalTools = List(ManualTracingTool.ModalToolID.countOfID);
            // Document setting tools
            _this.tool_EditDocumentFrame = new ManualTracingTool.Tool_EditDocumentFrame();
            // Selection tools
            _this.selectionTools = List(ManualTracingTool.OperationUnitID.countOfID);
            _this.tool_LinePointBrushSelect = new ManualTracingTool.Tool_Select_BrushSelect_LinePoint();
            _this.tool_LineSegmentBrushSelect = new ManualTracingTool.Tool_Select_BrushSelect_LineSegment();
            _this.tool_LineBrushSelect = new ManualTracingTool.Tool_Select_BrushSelect_Line();
            _this.tool_SelectAllPoints = new ManualTracingTool.Tool_Select_All_LinePoint();
            // File reference layer tools
            _this.tool_EditImageFileReference = new ManualTracingTool.Tool_EditImageFileReference();
            _this.tool_Transform_ReferenceImage_GrabMove = new ManualTracingTool.Tool_Transform_ReferenceImage_GrabMove();
            _this.tool_Transform_ReferenceImage_Rotate = new ManualTracingTool.Tool_Transform_ReferenceImage_Rotate();
            _this.tool_Transform_ReferenceImage_Scale = new ManualTracingTool.Tool_Transform_ReferenceImage_Scale();
            // Transform tools
            _this.tool_Transform_Lattice_GrabMove = new ManualTracingTool.Tool_Transform_Lattice_GrabMove();
            _this.tool_Transform_Lattice_Rotate = new ManualTracingTool.Tool_Transform_Lattice_Rotate();
            _this.tool_Transform_Lattice_Scale = new ManualTracingTool.Tool_Transform_Lattice_Scale();
            _this.tool_EditModeMain = new ManualTracingTool.Tool_EditModeMain();
            // Drawing tools
            _this.tool_DrawLine = new ManualTracingTool.Tool_DrawLine();
            //tool_AddPoint = new Tool_AddPoint();
            _this.tool_ScratchLine = new ManualTracingTool.Tool_ScratchLine();
            _this.tool_ExtrudeLine = new ManualTracingTool.Tool_ScratchLineDraw();
            _this.tool_OverWriteLineWidth = new ManualTracingTool.Tool_OverWriteLineWidth();
            _this.tool_ScratchLineWidth = new ManualTracingTool.Tool_ScratchLineWidth();
            _this.tool_ResampleSegment = new ManualTracingTool.Tool_Resample_Segment();
            //tool_DeletePoints_BrushSelect = new Tool_DeletePoints_BrushSelect();
            _this.tool_DeletePoints_DivideLine = new ManualTracingTool.Tool_DeletePoints_DivideLine();
            _this.tool_EditLinePointWidth_BrushSelect = new ManualTracingTool.Tool_HideLinePoint_BrushSelect();
            _this.hittest_Line_IsCloseTo = new ManualTracingTool.HitTest_Line_IsCloseToMouse();
            // Posing tools
            _this.posing3DLogic = new ManualTracingTool.Posing3DLogic();
            _this.tool_Posing3d_LocateHead = new ManualTracingTool.Tool_Posing3d_LocateHead();
            _this.tool_Posing3d_RotateHead = new ManualTracingTool.Tool_Posing3d_RotateHead();
            _this.tool_Posing3d_LocateBody = new ManualTracingTool.Tool_Posing3d_LocateBody();
            _this.tool_Posing3d_LocateHips = new ManualTracingTool.Tool_Posing3d_LocateHips();
            _this.tool_Posing3d_LocateLeftShoulder = new ManualTracingTool.Tool_Posing3d_LocateLeftShoulder();
            _this.tool_Posing3d_LocateRightShoulder = new ManualTracingTool.Tool_Posing3d_LocateRightShoulder();
            _this.tool_Posing3d_LocateLeftArm1 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm1();
            _this.tool_Posing3d_LocateLeftArm2 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm2();
            _this.tool_Posing3d_LocateRightArm1 = new ManualTracingTool.Tool_Posing3d_LocateRightArm1();
            _this.tool_Posing3d_LocateRightArm2 = new ManualTracingTool.Tool_Posing3d_LocateRightArm2();
            _this.tool_Posing3d_LocateLeftLeg1 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg1();
            _this.tool_Posing3d_LocateLeftLeg2 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg2();
            _this.tool_Posing3d_LocateRightLeg1 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg1();
            _this.tool_Posing3d_LocateRightLeg2 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg2();
            _this.imageResurces = new List();
            _this.modelFile = new ManualTracingTool.ModelFile();
            _this.modelResources = new List();
            _this.modelFile.file('models.json');
            _this.imageResurces.push(new ManualTracingTool.ImageResource().file('texture01.png').tex(true));
            _this.imageResurces.push(new ManualTracingTool.ImageResource().file('system_image01.png').cssImage('image-splite-system'));
            _this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image01.png').cssImage('image-splite-document'));
            _this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image02.png').cssImage('image-splite-subtool'));
            _this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image03.png').cssImage('image-splite-posing3d'));
            _this.imageResurces.push(new ManualTracingTool.ImageResource().file('layerbar_image01.png'));
            _this.systemImage = _this.imageResurces[1];
            _this.subToolImages.push(_this.imageResurces[2]);
            _this.subToolImages.push(_this.imageResurces[3]);
            _this.subToolImages.push(_this.imageResurces[4]);
            _this.layerButtonImage = _this.imageResurces[5];
            return _this;
        }
        App_Tool.prototype.initializeTools = function () {
            // Resoures
            this.posing3dView.storeResources(this.modelFile, this.imageResurces);
            // Constructs main tools and sub tools structure
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.none));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.drawLine)
                .subTool(this.tool_DrawLine, this.subToolImages[1], 0)
                .subTool(this.tool_ExtrudeLine, this.subToolImages[1], 2)
                .subTool(this.tool_DeletePoints_DivideLine, this.subToolImages[1], 5)
                .subTool(this.tool_EditLinePointWidth_BrushSelect, this.subToolImages[1], 6)
                .subTool(this.tool_ScratchLine, this.subToolImages[1], 1)
                .subTool(this.tool_OverWriteLineWidth, this.subToolImages[1], 3)
                .subTool(this.tool_ScratchLineWidth, this.subToolImages[1], 3));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.posing)
                .subTool(this.tool_Posing3d_LocateHead, this.subToolImages[2], 0)
                .subTool(this.tool_Posing3d_RotateHead, this.subToolImages[2], 1)
                .subTool(this.tool_Posing3d_LocateBody, this.subToolImages[2], 2)
                .subTool(this.tool_Posing3d_LocateHips, this.subToolImages[2], 3)
                .subTool(this.tool_Posing3d_LocateLeftShoulder, this.subToolImages[2], 4)
                .subTool(this.tool_Posing3d_LocateLeftArm1, this.subToolImages[2], 4)
                .subTool(this.tool_Posing3d_LocateLeftArm2, this.subToolImages[2], 5)
                .subTool(this.tool_Posing3d_LocateRightShoulder, this.subToolImages[2], 6)
                .subTool(this.tool_Posing3d_LocateRightArm1, this.subToolImages[2], 6)
                .subTool(this.tool_Posing3d_LocateRightArm2, this.subToolImages[2], 7)
                .subTool(this.tool_Posing3d_LocateLeftLeg1, this.subToolImages[2], 8)
                .subTool(this.tool_Posing3d_LocateLeftLeg2, this.subToolImages[2], 9)
                .subTool(this.tool_Posing3d_LocateRightLeg1, this.subToolImages[2], 10)
                .subTool(this.tool_Posing3d_LocateRightLeg2, this.subToolImages[2], 11));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.imageReferenceLayer)
                .subTool(this.tool_EditImageFileReference, this.subToolImages[0], 1));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.misc)
                .subTool(this.tool_EditDocumentFrame, this.subToolImages[0], 2));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.edit)
                .subTool(this.tool_LineBrushSelect, this.subToolImages[2], 0)
                .subTool(this.tool_LineSegmentBrushSelect, this.subToolImages[2], 0)
                .subTool(this.tool_LinePointBrushSelect, this.subToolImages[2], 0)
                .subTool(this.tool_EditModeMain, this.subToolImages[2], 0)
                .subTool(this.tool_ResampleSegment, this.subToolImages[1], 4));
            // Modal tools
            this.vectorLayer_ModalTools[ManualTracingTool.ModalToolID.none] = null;
            this.vectorLayer_ModalTools[ManualTracingTool.ModalToolID.grabMove] = this.tool_Transform_Lattice_GrabMove;
            this.vectorLayer_ModalTools[ManualTracingTool.ModalToolID.rotate] = this.tool_Transform_Lattice_Rotate;
            this.vectorLayer_ModalTools[ManualTracingTool.ModalToolID.scale] = this.tool_Transform_Lattice_Scale;
            this.imageFileReferenceLayer_ModalTools[ManualTracingTool.ModalToolID.none] = null;
            this.imageFileReferenceLayer_ModalTools[ManualTracingTool.ModalToolID.grabMove] = this.tool_Transform_ReferenceImage_GrabMove;
            this.imageFileReferenceLayer_ModalTools[ManualTracingTool.ModalToolID.rotate] = this.tool_Transform_ReferenceImage_Rotate;
            this.imageFileReferenceLayer_ModalTools[ManualTracingTool.ModalToolID.scale] = this.tool_Transform_ReferenceImage_Scale;
            // Selection tools
            this.selectionTools[ManualTracingTool.OperationUnitID.none] = null;
            this.selectionTools[ManualTracingTool.OperationUnitID.linePoint] = this.tool_LinePointBrushSelect;
            this.selectionTools[ManualTracingTool.OperationUnitID.lineSegment] = this.tool_LineSegmentBrushSelect;
            this.selectionTools[ManualTracingTool.OperationUnitID.line] = this.tool_LineBrushSelect;
            //this.currentTool = this.tool_DrawLine;
            //this.currentTool = this.tool_AddPoint;
            //this.currentTool = this.tool_ScratchLine;
            this.currentTool = this.tool_Posing3d_LocateHead;
        };
        // Tools and context operations
        App_Tool.prototype.updateFooterMessage = function () {
            {
                var context = this.toolContext;
                var modeText = '';
                if (this.toolEnv.isDrawMode()) {
                    modeText = 'DrawMode';
                }
                else if (this.toolEnv.isEditMode()) {
                    modeText = 'SelectMode';
                }
                var toolText = '';
                if (this.toolEnv.isDrawMode()) {
                    if (this.currentTool == this.tool_DrawLine) {
                        toolText = 'Draw line';
                    }
                    else if (this.currentTool == this.tool_ScratchLine) {
                        toolText = 'Scratch line';
                    }
                    else if (this.currentTool == this.tool_Posing3d_LocateHead) {
                        toolText = 'Posing(Head location)';
                    }
                }
                else if (this.toolEnv.isEditMode()) {
                    toolText = '';
                }
                // console.log(modeText, toolText);
            }
            this.footerText = this.currentTool.helpText;
            this.toolContext.redrawFooterWindow = true;
        };
        App_Tool.prototype.setCurrentEditMode = function (editModeID) {
            var env = this.toolEnv;
            var context = this.toolContext;
            context.editMode = editModeID;
            if (env.isDrawMode()) {
                this.setCurrentMainTool(context.drawMode_MainToolID);
            }
            else {
                this.setCurrentMainTool(context.editMode_MainToolID);
            }
            this.updateFooterMessage();
            env.setRedrawHeaderWindow();
            env.setRedrawMainWindowEditorWindow();
            env.setRedrawSubtoolWindow();
        };
        App_Tool.prototype.getCurrentMainTool = function () {
            return this.mainTools[this.toolContext.mainToolID];
        };
        App_Tool.prototype.getCurrentTool = function () {
            return this.currentTool;
        };
        App_Tool.prototype.setCurrentMainToolForCurentLayer = function () {
            var env = this.toolEnv;
            env.updateContext();
            if (env.isDrawMode()) {
                if (env.isCurrentLayerVectorLayer()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                }
                else if (env.isCurrentLayerPosingLayer()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.posing);
                }
                else if (env.isCurrentLayerImageFileReferenceLayer()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.imageReferenceLayer);
                }
            }
            else {
                this.setCurrentMainTool(ManualTracingTool.MainToolID.edit);
            }
        };
        App_Tool.prototype.setCurrentMainTool = function (id) {
            var env = this.toolEnv;
            var context = this.toolContext;
            var isChanged = (context.mainToolID != id);
            context.mainToolID = id;
            if (env.isDrawMode()) {
                context.drawMode_MainToolID = id;
            }
            var mainTool = this.getCurrentMainTool();
            this.setCurrentSubTool(mainTool.currentSubToolIndex);
            if (isChanged) {
                //this.subtoolWindow.viewLocation[1] = 0.0;
                this.subtoolWindow_CollectViewItems();
                //this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
                this.activateCurrentTool();
                this.toolEnv.setRedrawHeaderWindow();
                this.updateFooterMessage();
                this.updateUISubToolWindow();
            }
        };
        App_Tool.prototype.setCurrentSubTool = function (subToolIndex) {
            var env = this.toolEnv;
            this.cancelModalTool();
            var mainTool = this.getCurrentMainTool();
            mainTool.currentSubToolIndex = subToolIndex;
            this.toolContext.subToolIndex = subToolIndex;
            this.currentTool = mainTool.subTools[subToolIndex];
            env.setRedrawSubtoolWindow();
            this.updateUISubToolWindow();
            this.updateFooterMessage();
        };
        App_Tool.prototype.updateUISubToolWindow = function (forceRedraw) {
            if (forceRedraw === void 0) { forceRedraw = false; }
            if (forceRedraw) {
                this.uiSubToolWindowRef.update(this.subToolViewItems.slice(), this.toolContext.subToolIndex);
            }
            else {
                this.uiSubToolWindowRef.update(this.subToolViewItems, this.toolContext.subToolIndex);
            }
        };
        App_Tool.prototype.setCurrentOperationUnitID = function (operationUnitID) {
            this.toolContext.operationUnitID = operationUnitID;
        };
        App_Tool.prototype.updateContextCurrentRefferences = function () {
            var viewKeyframe = this.currentViewKeyframe;
            var currentLayer = this.toolContext.currentLayer;
            this.toolContext.currentVectorLine = null;
            if (currentLayer != null && ManualTracingTool.VectorLayer.isVectorLayer(currentLayer) && viewKeyframe != null) {
                var viewKeyframeLayer = ManualTracingTool.ViewKeyframe.findViewKeyframeLayer(viewKeyframe, currentLayer);
                var geometry = viewKeyframeLayer.vectorLayerKeyframe.geometry;
                this.toolContext.currentVectorLayer = currentLayer;
                this.toolContext.currentVectorGeometry = geometry;
                this.toolContext.currentVectorGroup = geometry.groups[0];
            }
            else {
                this.toolContext.currentVectorLayer = null;
                this.toolContext.currentVectorGeometry = null;
                this.toolContext.currentVectorGroup = null;
            }
            if (currentLayer != null && currentLayer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                var posingLayer = currentLayer;
                this.toolContext.currentPosingLayer = posingLayer;
                this.toolContext.currentPosingData = posingLayer.posingData;
                this.toolContext.currentPosingModel = posingLayer.posingModel;
            }
            else {
                this.toolContext.currentPosingLayer = null;
                this.toolContext.currentPosingData = null;
                this.toolContext.currentPosingModel = null;
            }
            if (currentLayer != null && currentLayer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var imageFileReferenceLayer = currentLayer;
                this.toolContext.currentImageFileReferenceLayer = imageFileReferenceLayer;
            }
            else {
                this.toolContext.currentImageFileReferenceLayer = null;
            }
        };
        App_Tool.prototype.setCurrentLayer = function (layer) {
            this.unselectAllLayer();
            if (layer != null) {
                this.setLayerSelection(layer, true);
            }
            this.toolContext.currentLayer = layer;
            this.updateContextCurrentRefferences();
            this.setCurrentMainToolForCurentLayer();
            this.paletteSelector_SetCurrentModeForCurrentLayer();
            this.activateCurrentTool();
        };
        App_Tool.prototype.setCurrentFrame = function (frame) {
            var context = this.toolContext;
            var aniSetting = context.document.animationSettingData;
            var viewKeyframes = this.viewLayerContext.keyframes;
            aniSetting.currentTimeFrame = frame;
            // Find current keyframe for frame
            if (aniSetting.currentTimeFrame < 0) {
                aniSetting.currentTimeFrame = 0;
            }
            if (aniSetting.currentTimeFrame > aniSetting.maxFrame) {
                aniSetting.currentTimeFrame = aniSetting.maxFrame;
            }
            var keyframeIndex = ManualTracingTool.ViewKeyframe.findViewKeyframeIndex(viewKeyframes, aniSetting.currentTimeFrame);
            if (keyframeIndex != -1) {
                this.currentViewKeyframe = viewKeyframes[keyframeIndex];
                if (keyframeIndex - 1 >= 0) {
                    this.previousKeyframe = viewKeyframes[keyframeIndex - 1];
                }
                else {
                    this.previousKeyframe = null;
                }
                if (keyframeIndex + 1 < viewKeyframes.length) {
                    this.nextKeyframe = viewKeyframes[keyframeIndex + 1];
                }
                else {
                    this.nextKeyframe = null;
                }
            }
            // Update tool context
            this.updateContextCurrentRefferences();
        };
        App_Tool.prototype.unselectAllLayer = function () {
            for (var _i = 0, _a = this.layerWindow.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.layer.isSelected = false;
                item.layer.isHierarchicalSelected = false;
            }
        };
        App_Tool.prototype.setLayerSelection = function (layer, isSelected) {
            layer.isSelected = isSelected;
        };
        App_Tool.prototype.setLayerVisiblity = function (layer, isVisible) {
            layer.isVisible = isVisible;
        };
        App_Tool.prototype.activateCurrentTool = function () {
            if (this.currentTool != null) {
                this.toolContext.needsDrawOperatorCursor = this.currentTool.isEditTool;
                this.currentTool.onActivated(this.toolEnv);
            }
        };
        App_Tool.prototype.startModalTool = function (modalTool) {
            if (modalTool == null) {
                return;
            }
            var available = modalTool.prepareModal(this.mainWindow.toolMouseEvent, this.toolEnv);
            if (!available) {
                return;
            }
            modalTool.startModal(this.toolEnv);
            this.modalBeforeTool = this.currentTool;
            this.currentModalTool = modalTool;
            this.currentTool = modalTool;
        };
        App_Tool.prototype.endModalTool = function () {
            this.toolEnv.updateContext();
            this.currentModalTool.endModal(this.toolEnv);
            this.setModalToolBefore();
            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.activateCurrentTool();
        };
        App_Tool.prototype.cancelModalTool = function () {
            if (!this.isModalToolRunning()) {
                return;
            }
            this.toolEnv.updateContext();
            this.currentModalTool.cancelModal(this.toolEnv);
            this.setModalToolBefore();
            this.activateCurrentTool();
        };
        App_Tool.prototype.setModalToolBefore = function () {
            this.currentTool = this.modalBeforeTool;
            this.currentModalTool = null;
            this.modalBeforeTool = null;
        };
        App_Tool.prototype.isModalToolRunning = function () {
            return (this.currentModalTool != null);
        };
        App_Tool.prototype.collectEditTargetViewKeyframeLayers = function () {
            var editableKeyframeLayers = new List();
            // Collects layers
            if (this.currentViewKeyframe != null) {
                for (var _i = 0, _a = this.currentViewKeyframe.layers; _i < _a.length; _i++) {
                    var viewKeyframeLayer = _a[_i];
                    var layer = viewKeyframeLayer.layer;
                    if (ManualTracingTool.Layer.isEditTarget(layer)) {
                        editableKeyframeLayers.push(viewKeyframeLayer);
                    }
                }
            }
            return editableKeyframeLayers;
        };
        // Common functions
        App_Tool.prototype.setLayerCommandParameters = function (layerCommand, currentLayerWindowItem) {
            // Collects layer items for command
            var currentLayer = currentLayerWindowItem.layer;
            var currentLayerParent = currentLayerWindowItem.parentLayer;
            var previousLayer = null;
            var previousLayerParent = null;
            if (currentLayerWindowItem.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                if (currentLayerWindowItem.previousSiblingItem != null) {
                    previousLayer = currentLayerWindowItem.previousSiblingItem.layer;
                    previousLayerParent = currentLayerWindowItem.previousSiblingItem.parentLayer;
                }
            }
            else {
                if (currentLayerWindowItem.previousItem != null) {
                    previousLayer = currentLayerWindowItem.previousItem.layer;
                    previousLayerParent = currentLayerWindowItem.previousItem.parentLayer;
                }
            }
            var nextLayer = null;
            var nextLayerParent = null;
            if (currentLayerWindowItem.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                if (currentLayerWindowItem.nextSiblingItem != null) {
                    nextLayer = currentLayerWindowItem.nextSiblingItem.layer;
                    nextLayerParent = currentLayerWindowItem.nextSiblingItem.parentLayer;
                }
            }
            else {
                if (currentLayerWindowItem.nextItem != null) {
                    nextLayer = currentLayerWindowItem.nextItem.layer;
                    nextLayerParent = currentLayerWindowItem.nextItem.parentLayer;
                }
            }
            layerCommand.setPrameters(currentLayer, currentLayerParent, previousLayer, previousLayerParent, nextLayer, nextLayerParent);
        };
        App_Tool.prototype.executeLayerCommand = function (layerCommand) {
            var currentLayerWindowItem = this.layerWindow_FindCurrentItem();
            if (currentLayerWindowItem == null) {
                return;
            }
            this.setLayerCommandParameters(layerCommand, currentLayerWindowItem);
            if (layerCommand.isAvailable(this.toolEnv)) {
                layerCommand.executeCommand(this.toolEnv);
                this.toolContext.commandHistory.addCommand(layerCommand);
            }
        };
        App_Tool.prototype.startVectorLayerModalTool = function (modalToolID) {
            var modalTool = this.vectorLayer_ModalTools[modalToolID];
            if (modalTool == null) {
                return;
            }
            this.startModalTool(modalTool);
        };
        App_Tool.prototype.startImageFileReferenceLayerModalTool = function (modalToolID) {
            var modalTool = this.imageFileReferenceLayer_ModalTools[modalToolID];
            if (modalTool == null) {
                return;
            }
            this.startModalTool(modalTool);
        };
        App_Tool.prototype.selectNextOrPreviousLayer = function (selectNext) {
            var item = this.layerWindow_FindCurrentItem();
            if (selectNext) {
                if (item.nextItem != null) {
                    this.setCurrentLayer(item.nextItem.layer);
                }
            }
            else {
                if (item.previousItem != null) {
                    this.setCurrentLayer(item.previousItem.layer);
                }
            }
        };
        return App_Tool;
    }(ManualTracingTool.App_Drawing));
    ManualTracingTool.App_Tool = App_Tool;
})(ManualTracingTool || (ManualTracingTool = {}));
