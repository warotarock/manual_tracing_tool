
namespace ManualTracingTool {

    export class App_Tool extends App_Drawing {

        // Integrated tool system

        mainTools = new List<MainTool>();

        currentTool: ToolBase = null;
        currentViewKeyframe: ViewKeyframe = null;
        previousKeyframe: ViewKeyframe = null;
        nextKeyframe: ViewKeyframe = null;

        //layerCommands = new List<Command_Layer_CommandBase>(LayerWindowButtonID.IDCount);

        // Modal tools
        currentModalTool: ModalToolBase = null;
        modalBeforeTool: ToolBase = null;
        vectorLayer_ModalTools = List<ModalToolBase>(<int>ModalToolID.countOfID);
        imageFileReferenceLayer_ModalTools = List<ModalToolBase>(<int>ModalToolID.countOfID);

        // Document setting tools
        tool_EditDocumentFrame = new Tool_EditDocumentFrame();

        // Selection tools
        selectionTools = List<ToolBase>(<int>OperationUnitID.countOfID);
        tool_LinePointBrushSelect = new Tool_Select_BrushSelect_LinePoint();
        tool_LineSegmentBrushSelect = new Tool_Select_BrushSelect_LineSegment();
        tool_LineBrushSelect = new Tool_Select_BrushSelect_Line();
        tool_SelectAllPoints = new Tool_Select_All_LinePoint();

        // File reference layer tools
        tool_EditImageFileReference = new Tool_EditImageFileReference();
        tool_Transform_ReferenceImage_GrabMove = new Tool_Transform_ReferenceImage_GrabMove();
        tool_Transform_ReferenceImage_Rotate = new Tool_Transform_ReferenceImage_Rotate();
        tool_Transform_ReferenceImage_Scale = new Tool_Transform_ReferenceImage_Scale();

        // Transform tools
        tool_Transform_Lattice_GrabMove = new Tool_Transform_Lattice_GrabMove();
        tool_Transform_Lattice_Rotate = new Tool_Transform_Lattice_Rotate();
        tool_Transform_Lattice_Scale = new Tool_Transform_Lattice_Scale();
        tool_EditModeMain = new Tool_EditModeMain();

        // Drawing tools
        tool_DrawLine = new Tool_DrawLine();
        //tool_AddPoint = new Tool_AddPoint();
        tool_ScratchLine = new Tool_ScratchLine();
        tool_ExtrudeLine = new Tool_ScratchLineDraw();
        tool_OverWriteLineWidth = new Tool_OverWriteLineWidth();
        tool_ScratchLineWidth = new Tool_ScratchLineWidth();
        tool_ResampleSegment = new Tool_Resample_Segment();
        //tool_DeletePoints_BrushSelect = new Tool_DeletePoints_BrushSelect();
        tool_DeletePoints_BrushSelect = new Tool_DeletePoints_DivideLine();
        tool_EditLinePointWidth_BrushSelect = new Tool_HideLinePoint_BrushSelect();

        hittest_Line_IsCloseTo = new HitTest_Line_IsCloseToMouse();

        // Posing tools
        posing3DLogic = new Posing3DLogic();
        tool_Posing3d_LocateHead = new Tool_Posing3d_LocateHead();
        tool_Posing3d_RotateHead = new Tool_Posing3d_RotateHead();
        tool_Posing3d_LocateBody = new Tool_Posing3d_LocateBody();
        tool_Posing3d_LocateHips = new Tool_Posing3d_LocateHips();
        tool_Posing3d_LocateLeftShoulder = new Tool_Posing3d_LocateLeftShoulder();
        tool_Posing3d_LocateRightShoulder = new Tool_Posing3d_LocateRightShoulder();
        tool_Posing3d_LocateLeftArm1 = new Tool_Posing3d_LocateLeftArm1();
        tool_Posing3d_LocateLeftArm2 = new Tool_Posing3d_LocateLeftArm2();
        tool_Posing3d_LocateRightArm1 = new Tool_Posing3d_LocateRightArm1();
        tool_Posing3d_LocateRightArm2 = new Tool_Posing3d_LocateRightArm2();
        tool_Posing3d_LocateLeftLeg1 = new Tool_Posing3d_LocateLeftLeg1();
        tool_Posing3d_LocateLeftLeg2 = new Tool_Posing3d_LocateLeftLeg2();
        tool_Posing3d_LocateRightLeg1 = new Tool_Posing3d_LocateRightLeg1();
        tool_Posing3d_LocateRightLeg2 = new Tool_Posing3d_LocateRightLeg2();
        imageResurces = new List<ImageResource>();
        modelFile = new ModelFile();
        modelResources = new List<ModelResource>();

        constructor() {

            super();

            this.modelFile.file('models.json');

            this.imageResurces.push(new ImageResource().file('texture01.png').tex(true));
            this.imageResurces.push(new ImageResource().file('system_image01.png'));
            this.imageResurces.push(new ImageResource().file('toolbar_image01.png'));
            this.imageResurces.push(new ImageResource().file('toolbar_image02.png'));
            this.imageResurces.push(new ImageResource().file('toolbar_image03.png'));
            this.imageResurces.push(new ImageResource().file('layerbar_image01.png'));

            this.systemImage = this.imageResurces[1];
            this.subToolImages.push(this.imageResurces[2]);
            this.subToolImages.push(this.imageResurces[3]);
            this.subToolImages.push(this.imageResurces[4]);
            this.layerButtonImage = this.imageResurces[5];
        }

        protected initializeTools() {

            // Resoures
            this.posing3dView.storeResources(this.modelFile, this.imageResurces);

            // Constructs main tools and sub tools structure
            this.mainTools.push(
                new MainTool().id(MainToolID.none)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.drawLine)
                    .subTool(this.tool_DrawLine, this.subToolImages[1], 0)
                    .subTool(this.tool_ExtrudeLine, this.subToolImages[1], 2)
                    .subTool(this.tool_DeletePoints_BrushSelect, this.subToolImages[1], 5)
                    .subTool(this.tool_EditLinePointWidth_BrushSelect, this.subToolImages[1], 6)
                    .subTool(this.tool_ScratchLine, this.subToolImages[1], 1)
                    .subTool(this.tool_OverWriteLineWidth, this.subToolImages[1], 3)
                    .subTool(this.tool_ScratchLineWidth, this.subToolImages[1], 3)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.posing)
                    .subTool(this.tool_Posing3d_LocateHead, this.subToolImages[2], 0)
                    .subTool(this.tool_Posing3d_RotateHead, this.subToolImages[2], 1)
                    .subTool(this.tool_Posing3d_LocateBody, this.subToolImages[2], 2)
                    .subTool(this.tool_Posing3d_LocateHips, this.subToolImages[2], 3)
                    .subTool(this.tool_Posing3d_LocateLeftShoulder, this.subToolImages[2], 6)
                    .subTool(this.tool_Posing3d_LocateLeftArm1, this.subToolImages[2], 6)
                    .subTool(this.tool_Posing3d_LocateLeftArm2, this.subToolImages[2], 7)
                    .subTool(this.tool_Posing3d_LocateRightShoulder, this.subToolImages[2], 4)
                    .subTool(this.tool_Posing3d_LocateRightArm1, this.subToolImages[2], 4)
                    .subTool(this.tool_Posing3d_LocateRightArm2, this.subToolImages[2], 5)
                    .subTool(this.tool_Posing3d_LocateLeftLeg1, this.subToolImages[2], 8)
                    .subTool(this.tool_Posing3d_LocateLeftLeg2, this.subToolImages[2], 9)
                    .subTool(this.tool_Posing3d_LocateRightLeg1, this.subToolImages[2], 10)
                    .subTool(this.tool_Posing3d_LocateRightLeg2, this.subToolImages[2], 11)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.imageReferenceLayer)
                    .subTool(this.tool_EditImageFileReference, this.subToolImages[0], 1)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.misc)
                    .subTool(this.tool_EditDocumentFrame, this.subToolImages[0], 2)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.edit)
                    .subTool(this.tool_LineBrushSelect, this.subToolImages[2], 0)
                    .subTool(this.tool_LineSegmentBrushSelect, this.subToolImages[2], 0)
                    .subTool(this.tool_LinePointBrushSelect, this.subToolImages[2], 0)
                    .subTool(this.tool_EditModeMain, this.subToolImages[2], 0)
                    .subTool(this.tool_ResampleSegment, this.subToolImages[1], 4)
            );

            // Modal tools
            this.vectorLayer_ModalTools[<int>ModalToolID.none] = null;
            this.vectorLayer_ModalTools[<int>ModalToolID.grabMove] = this.tool_Transform_Lattice_GrabMove;
            this.vectorLayer_ModalTools[<int>ModalToolID.rotate] = this.tool_Transform_Lattice_Rotate;
            this.vectorLayer_ModalTools[<int>ModalToolID.scale] = this.tool_Transform_Lattice_Scale;

            this.imageFileReferenceLayer_ModalTools[<int>ModalToolID.none] = null;
            this.imageFileReferenceLayer_ModalTools[<int>ModalToolID.grabMove] = this.tool_Transform_ReferenceImage_GrabMove;
            this.imageFileReferenceLayer_ModalTools[<int>ModalToolID.rotate] = this.tool_Transform_ReferenceImage_Rotate;
            this.imageFileReferenceLayer_ModalTools[<int>ModalToolID.scale] = this.tool_Transform_ReferenceImage_Scale;

            // Selection tools
            this.selectionTools[<int>OperationUnitID.none] = null;
            this.selectionTools[<int>OperationUnitID.linePoint] = this.tool_LinePointBrushSelect;
            this.selectionTools[<int>OperationUnitID.lineSegment] = this.tool_LineSegmentBrushSelect;
            this.selectionTools[<int>OperationUnitID.line] = this.tool_LineBrushSelect;

            //this.currentTool = this.tool_DrawLine;
            //this.currentTool = this.tool_AddPoint;
            //this.currentTool = this.tool_ScratchLine;
            this.currentTool = this.tool_Posing3d_LocateHead;
        }

        // Tools and context operations

        protected updateFooterMessage() {

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

        protected setCurrentEditMode(editModeID: EditModeID) {

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

        protected getCurrentMainTool(): MainTool { // @override

            return this.mainTools[<int>this.toolContext.mainToolID];
        }

        protected getCurrentTool(): ToolBase { // @override

            return this.currentTool;
        }

        protected setCurrentMainToolForCurentLayer() {

            var env = this.toolEnv;
            env.updateContext();

            if (env.isDrawMode()) {

                if (env.isCurrentLayerVectorLayer()) {

                    this.setCurrentMainTool(MainToolID.drawLine);

                }
                else if (env.isCurrentLayerPosingLayer()) {

                    this.setCurrentMainTool(MainToolID.posing);
                }
                else if (env.isCurrentLayerImageFileReferenceLayer()) {

                    this.setCurrentMainTool(MainToolID.imageReferenceLayer);
                }
            }
            else {

                this.setCurrentMainTool(MainToolID.edit);
            }
        }

        protected setCurrentMainTool(id: MainToolID) {

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

                this.toolEnv.setRedrawHeaderWindow()
                this.updateFooterMessage();
            }
        }

        protected setCurrentSubTool(subToolIndex: int) {

            this.cancelModalTool();

            let mainTool = this.getCurrentMainTool();

            if (this.toolContext.mainToolID != subToolIndex) {

                this.toolContext.redrawFooterWindow = true;
            }

            mainTool.currentSubToolIndex = subToolIndex;

            this.toolContext.subToolIndex = subToolIndex;

            this.currentTool = mainTool.subTools[subToolIndex];
        }

        public setCurrentOperationUnitID(operationUnitID: OperationUnitID) { // @implements MainEditor

            this.toolContext.operationUnitID = operationUnitID;
        }

        protected updateContextCurrentRefferences() {

            let viewKeyframe = this.currentViewKeyframe;
            let currentLayer = this.toolContext.currentLayer;

            if (currentLayer != null && VectorLayer.isVectorLayer(currentLayer) && viewKeyframe != null) {

                let viewKeyframeLayer = ViewKeyframe.findViewKeyframeLayer(viewKeyframe, currentLayer);
                let geometry = viewKeyframeLayer.vectorLayerKeyframe.geometry;

                this.toolContext.currentVectorLayer = <VectorLayer>currentLayer;
                this.toolContext.currentVectorGeometry = geometry;
                this.toolContext.currentVectorGroup = geometry.groups[0];
            }
            else {

                this.toolContext.currentVectorLayer = null;
                this.toolContext.currentVectorGeometry = null;
                this.toolContext.currentVectorGroup = null;
            }

            if (currentLayer != null && currentLayer.type == LayerTypeID.posingLayer) {

                let posingLayer = <PosingLayer>currentLayer;

                this.toolContext.currentPosingLayer = posingLayer;
                this.toolContext.currentPosingData = posingLayer.posingData;
                this.toolContext.currentPosingModel = posingLayer.posingModel;
            }
            else {

                this.toolContext.currentPosingLayer = null;
                this.toolContext.currentPosingData = null;
                this.toolContext.currentPosingModel = null;
            }

            if (currentLayer != null && currentLayer.type == LayerTypeID.imageFileReferenceLayer) {

                let imageFileReferenceLayer = <ImageFileReferenceLayer>currentLayer;

                this.toolContext.currentImageFileReferenceLayer = imageFileReferenceLayer;
            }
            else {

                this.toolContext.currentImageFileReferenceLayer = null;
            }

        }

        public setCurrentLayer(layer: Layer) { // @implements MainEditor

            this.unselectAllLayer();

            if (layer != null) {

                this.setLayerSelection(layer, true);
            }

            this.toolContext.currentLayer = layer;

            this.updateContextCurrentRefferences();

            this.setCurrentMainToolForCurentLayer();

            this.activateCurrentTool();
        }

        public setCurrentFrame(frame: int) { // @implements MainEditor

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

            let keyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, aniSetting.currentTimeFrame);

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

        protected unselectAllLayer() {

            for (let item of this.layerWindow.layerWindowItems) {

                item.layer.isSelected = false;
                item.layer.isHierarchicalSelected = false;
            }
        }

        protected setLayerSelection(layer: Layer, isSelected: boolean) {

            layer.isSelected = isSelected;
        }

        protected setLayerVisiblity(layer: Layer, isVisible: boolean) {

            layer.isVisible = isVisible;
        }

        protected activateCurrentTool() {

            if (this.currentTool != null) {

                this.toolContext.needsDrawOperatorCursor = this.currentTool.isEditTool;

                this.currentTool.onActivated(this.toolEnv);
            }
        }

        public startModalTool(modalTool: ModalToolBase) { // @implements MainEditor

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

        public endModalTool() { // @implements MainEditor

            this.toolEnv.updateContext();
            this.currentModalTool.endModal(this.toolEnv);

            this.setModalToolBefore();

            this.toolEnv.setRedrawMainWindowEditorWindow();

            this.activateCurrentTool();
        }

        public cancelModalTool() { // @implements MainEditor

            if (!this.isModalToolRunning()) {

                return;
            }

            this.toolEnv.updateContext();
            this.currentModalTool.cancelModal(this.toolEnv);

            this.setModalToolBefore();

            this.activateCurrentTool();
        }

        protected setModalToolBefore() {

            this.currentTool = this.modalBeforeTool;
            this.currentModalTool = null;
            this.modalBeforeTool = null;
        }

        public isModalToolRunning(): boolean { // @implements MainEditor

            return (this.currentModalTool != null);
        }

        public collectEditTargetViewKeyframeLayers(): List<ViewKeyframeLayer> { // @implements MainEditor

            let editableKeyframeLayers = new List<ViewKeyframeLayer>();

            // Collects layers

            if (this.currentViewKeyframe != null) {

                for (let viewKeyframeLayer of this.currentViewKeyframe.layers) {

                    let layer = viewKeyframeLayer.layer;

                    if (Layer.isSelected(layer) && Layer.isVisible(layer)) {

                        editableKeyframeLayers.push(viewKeyframeLayer);
                    }
                }
            }

            return editableKeyframeLayers;
        }

        // Common functions

        protected setLayerCommandParameters(layerCommand: Command_Layer_CommandBase, currentLayerWindowItem: LayerWindowItem) {

            // Collects layer items for command
            let currentLayer: Layer = currentLayerWindowItem.layer;
            let currentLayerParent: Layer = currentLayerWindowItem.parentLayer;

            let previousLayer: Layer = null;
            let previousLayerParent: Layer = null;
            if (currentLayerWindowItem.layer.type == LayerTypeID.groupLayer) {

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

            let nextLayer: Layer = null;
            let nextLayerParent: Layer = null;
            if (currentLayerWindowItem.layer.type == LayerTypeID.groupLayer) {

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

            layerCommand.setPrameters(
                currentLayer
                , currentLayerParent
                , previousLayer
                , previousLayerParent
                , nextLayer
                , nextLayerParent
            );
        }

        protected executeLayerCommand(layerCommand: Command_Layer_CommandBase) {

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

        protected startVectorLayerModalTool(modalToolID: ModalToolID) {

            let modalTool = this.vectorLayer_ModalTools[<int>modalToolID];

            if (modalTool == null) {

                return;
            }

            this.startModalTool(modalTool);
        }

        protected startImageFileReferenceLayerModalTool(modalToolID: ModalToolID) {

            let modalTool = this.imageFileReferenceLayer_ModalTools[<int>modalToolID];

            if (modalTool == null) {

                return;
            }

            this.startModalTool(modalTool);
        }

        protected selectNextOrPreviousLayer(selectNext: boolean) {

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
}
