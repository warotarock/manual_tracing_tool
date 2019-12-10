var ManualTracingTool;
(function (ManualTracingTool) {
    class App_Tool extends ManualTracingTool.App_Drawing {
        constructor() {
            super();
            // Integrated tool system
            this.mainTools = new List();
            this.currentTool = null;
            this.currentViewKeyframe = null;
            this.previousKeyframe = null;
            this.nextKeyframe = null;
            //layerCommands = new List<Command_Layer_CommandBase>(LayerWindowButtonID.IDCount);
            // Modal tools
            this.currentModalTool = null;
            this.modalBeforeTool = null;
            this.vectorLayer_ModalTools = List(ManualTracingTool.ModalToolID.countOfID);
            this.imageFileReferenceLayer_ModalTools = List(ManualTracingTool.ModalToolID.countOfID);
            // Document setting tools
            this.tool_EditDocumentFrame = new ManualTracingTool.Tool_EditDocumentFrame();
            // Selection tools
            this.selectionTools = List(ManualTracingTool.OperationUnitID.countOfID);
            this.tool_LinePointBrushSelect = new ManualTracingTool.Tool_Select_BrushSelect_LinePoint();
            this.tool_LineSegmentBrushSelect = new ManualTracingTool.Tool_Select_BrushSelect_LineSegment();
            this.tool_LineBrushSelect = new ManualTracingTool.Tool_Select_BrushSelect_Line();
            this.tool_SelectAllPoints = new ManualTracingTool.Tool_Select_All_LinePoint();
            // File reference layer tools
            this.tool_EditImageFileReference = new ManualTracingTool.Tool_EditImageFileReference();
            this.tool_Transform_ReferenceImage_GrabMove = new ManualTracingTool.Tool_Transform_ReferenceImage_GrabMove();
            this.tool_Transform_ReferenceImage_Rotate = new ManualTracingTool.Tool_Transform_ReferenceImage_Rotate();
            this.tool_Transform_ReferenceImage_Scale = new ManualTracingTool.Tool_Transform_ReferenceImage_Scale();
            // Transform tools
            this.tool_Transform_Lattice_GrabMove = new ManualTracingTool.Tool_Transform_Lattice_GrabMove();
            this.tool_Transform_Lattice_Rotate = new ManualTracingTool.Tool_Transform_Lattice_Rotate();
            this.tool_Transform_Lattice_Scale = new ManualTracingTool.Tool_Transform_Lattice_Scale();
            this.tool_EditModeMain = new ManualTracingTool.Tool_EditModeMain();
            // Drawing tools
            this.tool_DrawLine = new ManualTracingTool.Tool_DrawLine();
            //tool_AddPoint = new Tool_AddPoint();
            this.tool_ScratchLine = new ManualTracingTool.Tool_ScratchLine();
            this.tool_ExtrudeLine = new ManualTracingTool.Tool_ScratchLineDraw();
            this.tool_OverWriteLineWidth = new ManualTracingTool.Tool_OverWriteLineWidth();
            this.tool_ScratchLineWidth = new ManualTracingTool.Tool_ScratchLineWidth();
            this.tool_ResampleSegment = new ManualTracingTool.Tool_Resample_Segment();
            //tool_DeletePoints_BrushSelect = new Tool_DeletePoints_BrushSelect();
            this.tool_DeletePoints_BrushSelect = new ManualTracingTool.Tool_DeletePoints_DivideLine();
            this.tool_EditLinePointWidth_BrushSelect = new ManualTracingTool.Tool_HideLinePoint_BrushSelect();
            this.hittest_Line_IsCloseTo = new ManualTracingTool.HitTest_Line_IsCloseToMouse();
            // Posing tools
            this.posing3DLogic = new ManualTracingTool.Posing3DLogic();
            this.tool_Posing3d_LocateHead = new ManualTracingTool.Tool_Posing3d_LocateHead();
            this.tool_Posing3d_RotateHead = new ManualTracingTool.Tool_Posing3d_RotateHead();
            this.tool_Posing3d_LocateBody = new ManualTracingTool.Tool_Posing3d_LocateBody();
            this.tool_Posing3d_LocateHips = new ManualTracingTool.Tool_Posing3d_LocateHips();
            this.tool_Posing3d_LocateLeftShoulder = new ManualTracingTool.Tool_Posing3d_LocateLeftShoulder();
            this.tool_Posing3d_LocateRightShoulder = new ManualTracingTool.Tool_Posing3d_LocateRightShoulder();
            this.tool_Posing3d_LocateLeftArm1 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm1();
            this.tool_Posing3d_LocateLeftArm2 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm2();
            this.tool_Posing3d_LocateRightArm1 = new ManualTracingTool.Tool_Posing3d_LocateRightArm1();
            this.tool_Posing3d_LocateRightArm2 = new ManualTracingTool.Tool_Posing3d_LocateRightArm2();
            this.tool_Posing3d_LocateLeftLeg1 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg1();
            this.tool_Posing3d_LocateLeftLeg2 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg2();
            this.tool_Posing3d_LocateRightLeg1 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg1();
            this.tool_Posing3d_LocateRightLeg2 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg2();
            this.imageResurces = new List();
            this.modelFile = new ManualTracingTool.ModelFile();
            this.modelResources = new List();
            this.modelFile.file('models.json');
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('texture01.png').tex(true));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('system_image01.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image01.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image02.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image03.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('layerbar_image01.png'));
            this.systemImage = this.imageResurces[1];
            this.subToolImages.push(this.imageResurces[2]);
            this.subToolImages.push(this.imageResurces[3]);
            this.subToolImages.push(this.imageResurces[4]);
            this.layerButtonImage = this.imageResurces[5];
        }
        initializeTools() {
            // Resoures
            this.posing3dView.storeResources(this.modelFile, this.imageResurces);
            // Constructs main tools and sub tools structure
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.none));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.drawLine)
                .subTool(this.tool_DrawLine, this.subToolImages[1], 0)
                .subTool(this.tool_ExtrudeLine, this.subToolImages[1], 2)
                .subTool(this.tool_DeletePoints_BrushSelect, this.subToolImages[1], 5)
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
        }
        // Tools and context operations
        updateFooterMessage() {
            let context = this.toolContext;
            let modeText = '';
            if (this.toolEnv.isDrawMode()) {
                modeText = 'DrawMode';
            }
            else if (this.toolEnv.isEditMode()) {
                modeText = 'SelectMode';
            }
            let toolText = '';
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
            this.footerText = modeText + ' ' + toolText;
            this.footerText = this.currentTool.helpText;
        }
        setCurrentEditMode(editModeID) {
            var env = this.toolEnv;
            let context = this.toolContext;
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
        }
        getCurrentMainTool() {
            return this.mainTools[this.toolContext.mainToolID];
        }
        getCurrentTool() {
            return this.currentTool;
        }
        setCurrentMainToolForCurentLayer() {
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
        }
        setCurrentMainTool(id) {
            var env = this.toolEnv;
            let context = this.toolContext;
            let isChanged = (context.mainToolID != id);
            context.mainToolID = id;
            if (env.isDrawMode()) {
                context.drawMode_MainToolID = id;
            }
            let mainTool = this.getCurrentMainTool();
            this.setCurrentSubTool(mainTool.currentSubToolIndex);
            if (isChanged) {
                this.subtoolWindow.viewLocation[1] = 0.0;
                this.subtoolWindow_CollectViewItems();
                this.subtoolWindow_CaluculateLayout(this.subtoolWindow);
                this.activateCurrentTool();
                this.toolEnv.setRedrawHeaderWindow();
                this.updateFooterMessage();
            }
        }
        setCurrentSubTool(subToolIndex) {
            this.cancelModalTool();
            let mainTool = this.getCurrentMainTool();
            if (this.toolContext.mainToolID != subToolIndex) {
                this.toolContext.redrawFooterWindow = true;
            }
            mainTool.currentSubToolIndex = subToolIndex;
            this.toolContext.subToolIndex = subToolIndex;
            this.currentTool = mainTool.subTools[subToolIndex];
        }
        setCurrentOperationUnitID(operationUnitID) {
            this.toolContext.operationUnitID = operationUnitID;
        }
        updateContextCurrentRefferences() {
            let viewKeyframe = this.currentViewKeyframe;
            let currentLayer = this.toolContext.currentLayer;
            if (currentLayer != null && ManualTracingTool.VectorLayer.isVectorLayer(currentLayer) && viewKeyframe != null) {
                let viewKeyframeLayer = ManualTracingTool.ViewKeyframe.findViewKeyframeLayer(viewKeyframe, currentLayer);
                let geometry = viewKeyframeLayer.vectorLayerKeyframe.geometry;
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
                let posingLayer = currentLayer;
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
                let imageFileReferenceLayer = currentLayer;
                this.toolContext.currentImageFileReferenceLayer = imageFileReferenceLayer;
            }
            else {
                this.toolContext.currentImageFileReferenceLayer = null;
            }
        }
        setCurrentLayer(layer) {
            this.unselectAllLayer();
            if (layer != null) {
                this.setLayerSelection(layer, true);
            }
            this.toolContext.currentLayer = layer;
            this.updateContextCurrentRefferences();
            this.setCurrentMainToolForCurentLayer();
            this.activateCurrentTool();
        }
        setCurrentFrame(frame) {
            let context = this.toolContext;
            let aniSetting = context.document.animationSettingData;
            let viewKeyframes = this.viewLayerContext.keyframes;
            aniSetting.currentTimeFrame = frame;
            // Find current keyframe for frame
            if (aniSetting.currentTimeFrame < 0) {
                aniSetting.currentTimeFrame = 0;
            }
            if (aniSetting.currentTimeFrame > aniSetting.maxFrame) {
                aniSetting.currentTimeFrame = aniSetting.maxFrame;
            }
            let keyframeIndex = ManualTracingTool.ViewKeyframe.findViewKeyframeIndex(viewKeyframes, aniSetting.currentTimeFrame);
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
        }
        unselectAllLayer() {
            for (let item of this.layerWindow.layerWindowItems) {
                item.layer.isSelected = false;
                item.layer.isHierarchicalSelected = false;
            }
        }
        setLayerSelection(layer, isSelected) {
            layer.isSelected = isSelected;
        }
        setLayerVisiblity(layer, isVisible) {
            layer.isVisible = isVisible;
        }
        activateCurrentTool() {
            if (this.currentTool != null) {
                this.toolContext.needsDrawOperatorCursor = this.currentTool.isEditTool;
                this.currentTool.onActivated(this.toolEnv);
            }
        }
        startModalTool(modalTool) {
            if (modalTool == null) {
                return;
            }
            let available = modalTool.prepareModal(this.mainWindow.toolMouseEvent, this.toolEnv);
            if (!available) {
                return;
            }
            modalTool.startModal(this.toolEnv);
            this.modalBeforeTool = this.currentTool;
            this.currentModalTool = modalTool;
            this.currentTool = modalTool;
        }
        endModalTool() {
            this.toolEnv.updateContext();
            this.currentModalTool.endModal(this.toolEnv);
            this.setModalToolBefore();
            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.activateCurrentTool();
        }
        cancelModalTool() {
            if (!this.isModalToolRunning()) {
                return;
            }
            this.toolEnv.updateContext();
            this.currentModalTool.cancelModal(this.toolEnv);
            this.setModalToolBefore();
            this.activateCurrentTool();
        }
        setModalToolBefore() {
            this.currentTool = this.modalBeforeTool;
            this.currentModalTool = null;
            this.modalBeforeTool = null;
        }
        isModalToolRunning() {
            return (this.currentModalTool != null);
        }
        collectEditTargetViewKeyframeLayers() {
            let editableKeyframeLayers = new List();
            // Collects layers
            if (this.currentViewKeyframe != null) {
                for (let viewKeyframeLayer of this.currentViewKeyframe.layers) {
                    let layer = viewKeyframeLayer.layer;
                    if (ManualTracingTool.Layer.isSelected(layer) && ManualTracingTool.Layer.isVisible(layer)) {
                        editableKeyframeLayers.push(viewKeyframeLayer);
                    }
                }
            }
            return editableKeyframeLayers;
        }
        // Common functions
        setLayerCommandParameters(layerCommand, currentLayerWindowItem) {
            // Collects layer items for command
            let currentLayer = currentLayerWindowItem.layer;
            let currentLayerParent = currentLayerWindowItem.parentLayer;
            let previousLayer = null;
            let previousLayerParent = null;
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
            let nextLayer = null;
            let nextLayerParent = null;
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
        }
        executeLayerCommand(layerCommand) {
            let currentLayerWindowItem = this.layerWindow_FindCurrentItem();
            if (currentLayerWindowItem == null) {
                return;
            }
            this.setLayerCommandParameters(layerCommand, currentLayerWindowItem);
            if (layerCommand.isAvailable(this.toolEnv)) {
                layerCommand.execute(this.toolEnv);
                this.toolContext.commandHistory.addCommand(layerCommand);
            }
        }
        startVectorLayerModalTool(modalToolID) {
            let modalTool = this.vectorLayer_ModalTools[modalToolID];
            if (modalTool == null) {
                return;
            }
            this.startModalTool(modalTool);
        }
        startImageFileReferenceLayerModalTool(modalToolID) {
            let modalTool = this.imageFileReferenceLayer_ModalTools[modalToolID];
            if (modalTool == null) {
                return;
            }
            this.startModalTool(modalTool);
        }
        selectNextOrPreviousLayer(selectNext) {
            let item = this.layerWindow_FindCurrentItem();
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
        }
    }
    ManualTracingTool.App_Tool = App_Tool;
})(ManualTracingTool || (ManualTracingTool = {}));
