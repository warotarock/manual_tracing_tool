var ManualTracingTool;
(function (ManualTracingTool) {
    // Setting
    class LocalSetting {
        constructor() {
            this.exportPath = null;
            this.lastUsedFilePaths = new List();
            this.maxLastUsedFilePaths = 5;
            this.referenceDirectoryPath = null;
            this.currentDirectoryPath = null;
        }
    }
    ManualTracingTool.LocalSetting = LocalSetting;
    // Color
    class PalletColor {
        constructor() {
            this.color = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
        }
    }
    ManualTracingTool.PalletColor = PalletColor;
    // Base layer class
    let LayerTypeID;
    (function (LayerTypeID) {
        LayerTypeID[LayerTypeID["none"] = 0] = "none";
        LayerTypeID[LayerTypeID["rootLayer"] = 1] = "rootLayer";
        LayerTypeID[LayerTypeID["vectorLayer"] = 2] = "vectorLayer";
        LayerTypeID[LayerTypeID["groupLayer"] = 3] = "groupLayer";
        LayerTypeID[LayerTypeID["imageFileReferenceLayer"] = 4] = "imageFileReferenceLayer";
        LayerTypeID[LayerTypeID["posingLayer"] = 5] = "posingLayer";
        LayerTypeID[LayerTypeID["vectorLayerReferenceLayer"] = 6] = "vectorLayerReferenceLayer";
    })(LayerTypeID = ManualTracingTool.LayerTypeID || (ManualTracingTool.LayerTypeID = {}));
    class Layer {
        constructor() {
            this.type = LayerTypeID.none;
            this.name = null;
            this.isVisible = true;
            this.isSelected = false;
            this.isRenderTarget = true;
            this.isMaskedByBelowLayer = false;
            this.childLayers = new List();
            this.layerColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            // runtime
            this.isHierarchicalSelected = true;
            this.isHierarchicalVisible = true;
            this.bufferCanvasWindow = null;
        }
        static collectLayerRecursive(result, parentLayer) {
            for (let layer of parentLayer.childLayers) {
                result.push(layer);
                if (layer.childLayers.length > 0) {
                    Layer.collectLayerRecursive(result, layer);
                }
            }
        }
        static updateHierarchicalStatesRecursive(parentLayer) {
            for (let layer of parentLayer.childLayers) {
                layer.isHierarchicalSelected = layer.isSelected || Layer.isSelected(parentLayer);
                layer.isHierarchicalVisible = layer.isVisible && Layer.isVisible(parentLayer);
                if (layer.childLayers.length > 0) {
                    Layer.updateHierarchicalStatesRecursive(layer);
                }
            }
        }
        static isSelected(layer) {
            return (layer.isSelected || layer.isHierarchicalSelected);
        }
        static isVisible(layer) {
            return (layer.isVisible && layer.isHierarchicalVisible);
        }
    }
    ManualTracingTool.Layer = Layer;
    // Vector layer
    let LinePointModifyFlagID;
    (function (LinePointModifyFlagID) {
        LinePointModifyFlagID[LinePointModifyFlagID["none"] = 0] = "none";
        LinePointModifyFlagID[LinePointModifyFlagID["selectedToUnselected"] = 1] = "selectedToUnselected";
        LinePointModifyFlagID[LinePointModifyFlagID["unselectedToSelected"] = 2] = "unselectedToSelected";
        LinePointModifyFlagID[LinePointModifyFlagID["delete"] = 3] = "delete";
        LinePointModifyFlagID[LinePointModifyFlagID["edit"] = 4] = "edit";
    })(LinePointModifyFlagID = ManualTracingTool.LinePointModifyFlagID || (ManualTracingTool.LinePointModifyFlagID = {}));
    class LinePoint {
        constructor() {
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
            this.lineWidth = 1.0;
            this.isSelected = false;
            // runtime
            this.modifyFlag = LinePointModifyFlagID.none;
            this.tempLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.adjustingLineWidth = 0.0;
            this.adjustingLengthFrom = 1.0; // end position to draw segment of side of from-point (0.0 - 1.0)
            this.adjustingLengthTo = 0.0; // start position to draw segment of side of to-point (0.0 - 1.0)
            this.totalLength = 0.0;
            this.curvature = 0.0;
        }
        static clone(srcPoint) {
            let point = new LinePoint();
            vec3.copy(point.location, srcPoint.location);
            point.lineWidth = srcPoint.lineWidth;
            vec3.copy(point.adjustingLocation, point.location);
            point.adjustingLineWidth = point.lineWidth;
            return point;
        }
    }
    ManualTracingTool.LinePoint = LinePoint;
    let VectorLineModifyFlagID;
    (function (VectorLineModifyFlagID) {
        VectorLineModifyFlagID[VectorLineModifyFlagID["none"] = 0] = "none";
        VectorLineModifyFlagID[VectorLineModifyFlagID["selectedToUnselected"] = 1] = "selectedToUnselected";
        VectorLineModifyFlagID[VectorLineModifyFlagID["unselectedToSelected"] = 2] = "unselectedToSelected";
        VectorLineModifyFlagID[VectorLineModifyFlagID["delete"] = 3] = "delete";
        VectorLineModifyFlagID[VectorLineModifyFlagID["deletePoints"] = 4] = "deletePoints";
        VectorLineModifyFlagID[VectorLineModifyFlagID["deleteLine"] = 5] = "deleteLine";
        VectorLineModifyFlagID[VectorLineModifyFlagID["edit"] = 6] = "edit";
        VectorLineModifyFlagID[VectorLineModifyFlagID["transform"] = 7] = "transform";
        VectorLineModifyFlagID[VectorLineModifyFlagID["resampling"] = 8] = "resampling";
    })(VectorLineModifyFlagID = ManualTracingTool.VectorLineModifyFlagID || (ManualTracingTool.VectorLineModifyFlagID = {}));
    class VectorLine {
        constructor() {
            this.points = new List();
            this.continuousFill = false;
            this.isSelected = false;
            // runtime
            this.modifyFlag = VectorLineModifyFlagID.none;
            this.isCloseToMouse = false;
            this.left = 999999.0;
            this.top = 999999.0;
            this.right = -999999.0;
            this.bottom = -999999.0;
            this.range = 0.0;
            this.totalLength = 0.0;
        }
    }
    ManualTracingTool.VectorLine = VectorLine;
    let VectorGroupModifyFlagID;
    (function (VectorGroupModifyFlagID) {
        VectorGroupModifyFlagID[VectorGroupModifyFlagID["none"] = 0] = "none";
        VectorGroupModifyFlagID[VectorGroupModifyFlagID["modifyLines"] = 1] = "modifyLines";
        VectorGroupModifyFlagID[VectorGroupModifyFlagID["deleteLines"] = 2] = "deleteLines";
        VectorGroupModifyFlagID[VectorGroupModifyFlagID["delete"] = 3] = "delete";
        VectorGroupModifyFlagID[VectorGroupModifyFlagID["edit"] = 4] = "edit";
    })(VectorGroupModifyFlagID = ManualTracingTool.VectorGroupModifyFlagID || (ManualTracingTool.VectorGroupModifyFlagID = {}));
    class VectorGroup {
        constructor() {
            this.lines = new List();
            this.isSelected = false;
            // runtime
            this.modifyFlag = VectorGroupModifyFlagID.none;
            this.linePointModifyFlag = VectorGroupModifyFlagID.none;
            this.buffer = new ManualTracingTool.GPUVertexBuffer();
        }
    }
    ManualTracingTool.VectorGroup = VectorGroup;
    class VectorLayerGeometry {
        constructor() {
            this.groups = new List();
        }
    }
    ManualTracingTool.VectorLayerGeometry = VectorLayerGeometry;
    class VectorLayerKeyframe {
        constructor() {
            this.frame = 0;
            this.geometry = null;
        }
    }
    ManualTracingTool.VectorLayerKeyframe = VectorLayerKeyframe;
    let DrawLineTypeID;
    (function (DrawLineTypeID) {
        DrawLineTypeID[DrawLineTypeID["none"] = 1] = "none";
        DrawLineTypeID[DrawLineTypeID["layerColor"] = 2] = "layerColor";
        DrawLineTypeID[DrawLineTypeID["palletColor"] = 3] = "palletColor";
    })(DrawLineTypeID = ManualTracingTool.DrawLineTypeID || (ManualTracingTool.DrawLineTypeID = {}));
    let FillAreaTypeID;
    (function (FillAreaTypeID) {
        FillAreaTypeID[FillAreaTypeID["none"] = 1] = "none";
        FillAreaTypeID[FillAreaTypeID["fillColor"] = 2] = "fillColor";
        FillAreaTypeID[FillAreaTypeID["palletColor"] = 3] = "palletColor";
    })(FillAreaTypeID = ManualTracingTool.FillAreaTypeID || (ManualTracingTool.FillAreaTypeID = {}));
    class VectorLayer extends Layer {
        constructor() {
            super();
            this.type = LayerTypeID.vectorLayer;
            this.keyframes = new List();
            this.drawLineType = DrawLineTypeID.palletColor;
            this.fillAreaType = FillAreaTypeID.none;
            this.fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            this.line_PalletColorIndex = 0;
            this.fill_PalletColorIndex = 1;
            let key = new VectorLayerKeyframe();
            key.frame = 0;
            key.geometry = new VectorLayerGeometry();
            this.keyframes.push(key);
        }
        static isVectorLayer(layer) {
            return (layer.type == LayerTypeID.vectorLayer
                || layer.type == LayerTypeID.vectorLayerReferenceLayer);
        }
        static findLastKeyframeIndex(vectorLayer, targetFrame) {
            let keyframeIndex = -1;
            for (let index = 0; index < vectorLayer.keyframes.length; index++) {
                let keyframe = vectorLayer.keyframes[index];
                if (keyframe.frame == targetFrame) {
                    keyframeIndex = index;
                    break;
                }
                if (keyframe.frame > targetFrame) {
                    break;
                }
                keyframeIndex = index;
            }
            return keyframeIndex;
        }
    }
    ManualTracingTool.VectorLayer = VectorLayer;
    class VectorLayerReferenceLayer extends VectorLayer {
        constructor() {
            super(...arguments);
            this.type = LayerTypeID.vectorLayerReferenceLayer;
            this.referenceLayer = null;
        }
    }
    ManualTracingTool.VectorLayerReferenceLayer = VectorLayerReferenceLayer;
    // Group layer
    class GroupLayer extends Layer {
        constructor() {
            super(...arguments);
            this.type = LayerTypeID.groupLayer;
        }
    }
    ManualTracingTool.GroupLayer = GroupLayer;
    // Image file reference layer
    class ImageFileReferenceLayer extends Layer {
        constructor() {
            super(...arguments);
            this.type = LayerTypeID.imageFileReferenceLayer;
            this.imageFilePath = null;
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
            this.rotation = vec3.fromValues(0.0, 0.0, 0.0);
            this.scale = vec3.fromValues(1.0, 1.0, 1.0);
            // runtime
            this.imageResource = null;
            this.imageLoading = false;
            this.adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.adjustingRotation = vec3.fromValues(0.0, 0.0, 0.0);
            this.adjustingScale = vec3.fromValues(1.0, 1.0, 1.0);
        }
    }
    ManualTracingTool.ImageFileReferenceLayer = ImageFileReferenceLayer;
    // Posing
    class PosingModel {
        constructor() {
            // Head to body
            this.headSphereSize = 0.12; // 14cm
            this.headTwistSphereSize = 0.18; //
            this.headCenterLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.headTopLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.headTopToNeckVector = vec3.fromValues(0.0, 0.0, 0.0);
            this.bodySphereSize = 0.30; // 44cm
            this.bodySphereLocation = vec3.fromValues(0.0, -0.03, -0.19);
            this.neckSphereLocation = vec3.fromValues(0.0, -0.03, -0.17);
            this.shoulderSphereLocation = vec3.fromValues(0.0, -0.03, -0.17);
            this.bodyRotationSphereSize = 0.15; // 11cm
            this.bodyRotationSphereLocation = vec3.fromValues(0.0, 0.0, -0.31);
            this.hipsSphereSize = 0.30; // 44cm
            // Arms
            this.leftArm1Location = vec3.fromValues(-0.130, 0.0, -0.05);
            this.rightArm1Location = vec3.fromValues(+0.130, 0.0, -0.05);
            this.leftArm1HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);
            this.rightArm1HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);
            this.leftArm2HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);
            this.rightArm2HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);
            // Legs
            this.leftLeg1Location = vec3.fromValues(-0.11, 0.0, -0.46);
            this.rightLeg1Location = vec3.fromValues(+0.11, 0.0, -0.46);
            this.leftLeg1HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);
            this.rightLeg1HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);
            this.leftLeg2HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);
            this.rightLeg2HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);
            // runtime
            this.chestModelConvertMatrix = mat4.create();
            this.hipsModelConvertMatrix = mat4.create();
        }
    }
    ManualTracingTool.PosingModel = PosingModel;
    class PosingModelBoneInputSetting {
        constructor() {
            this.inputName = '';
            this.inputType = ''; //  baseSize, direction
            this.modelName = '';
            this.dependentInputName = '';
        }
    }
    ManualTracingTool.PosingModelBoneInputSetting = PosingModelBoneInputSetting;
    let InputSideID;
    (function (InputSideID) {
        InputSideID[InputSideID["none"] = 0] = "none";
        InputSideID[InputSideID["front"] = 1] = "front";
        InputSideID[InputSideID["back"] = 2] = "back";
    })(InputSideID = ManualTracingTool.InputSideID || (ManualTracingTool.InputSideID = {}));
    class PosingInputData {
        constructor() {
            this.inputDone = false;
            // runtime
            this.parentMatrix = null;
            this.hitTestSphereRadius = 0.0;
        }
    }
    ManualTracingTool.PosingInputData = PosingInputData;
    class HeadLocationInputData extends PosingInputData {
        constructor() {
            super(...arguments);
            this.center = vec3.fromValues(0.0, 0.0, 0.0);
            this.radius = 0.0;
            this.editLine = null;
            this.matrix = mat4.create();
            this.headMatrix = mat4.create();
            this.bodyRootMatrix = mat4.create();
        }
    }
    ManualTracingTool.HeadLocationInputData = HeadLocationInputData;
    class DirectionInputData extends PosingInputData {
        constructor() {
            super(...arguments);
            this.inputSideID = InputSideID.front;
            this.inputLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.inputLocation2D = vec3.fromValues(0.0, 0.0, 0.0);
            this.directionInputDone = false;
            this.rollInputDone = false;
            this.rollInputLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.rollInputAngle = 0.0;
            this.matrix = mat4.create();
        }
    }
    ManualTracingTool.DirectionInputData = DirectionInputData;
    class HeadRotationInputData extends DirectionInputData {
        constructor() {
            super(...arguments);
            this.neckSphereMatrix = mat4.create();
        }
    }
    ManualTracingTool.HeadRotationInputData = HeadRotationInputData;
    class HeadTwistInputData extends DirectionInputData {
        constructor() {
            super(...arguments);
            this.tempInputLocation = vec3.fromValues(0.0, 0.0, 0.0);
        }
    }
    ManualTracingTool.HeadTwistInputData = HeadTwistInputData;
    class BodyLocationInputData extends DirectionInputData {
        constructor() {
            super(...arguments);
            this.bodyMatrix = mat4.create();
            this.rotationCenterMatrix = mat4.create();
            this.leftArm1RootMatrix = mat4.create();
            this.rightArm1RootMatrix = mat4.create();
            this.leftLeg1RootMatrix = mat4.create();
            this.rightLeg1RootMatrix = mat4.create();
        }
    }
    ManualTracingTool.BodyLocationInputData = BodyLocationInputData;
    class BodyRotationInputData extends DirectionInputData {
        constructor() {
            super(...arguments);
            this.inputSideID = InputSideID.front;
            this.inputLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.matrix = mat4.create();
        }
    }
    ManualTracingTool.BodyRotationInputData = BodyRotationInputData;
    class JointPartInputData extends DirectionInputData {
        constructor() {
            super(...arguments);
            this.childJointRootMatrix = mat4.create();
        }
    }
    ManualTracingTool.JointPartInputData = JointPartInputData;
    class PosingData {
        constructor() {
            this.real3DViewHalfWidth = 1.0;
            this.rootMatrix = mat4.create();
            this.headMatrix = mat4.create();
            this.headTopMatrix = mat4.create();
            this.neckSphereMatrix = mat4.create();
            this.chestRootMatrix = mat4.create();
            this.chestMatrix = mat4.create();
            this.shoulderRootMatrix = mat4.create();
            this.hipsRootMatrix = mat4.create();
            this.hipsMatrix = mat4.create();
            this.bodyRotationCenterMatrix = mat4.create();
            this.leftArm1RootMatrix = mat4.create();
            this.rightArm1RootMatrix = mat4.create();
            this.leftLeg1RootMatrix = mat4.create();
            this.rightLeg1RootMatrix = mat4.create();
            this.headLocationInputData = new HeadLocationInputData();
            this.headRotationInputData = new JointPartInputData();
            this.headTwistInputData = new HeadTwistInputData();
            this.bodyLocationInputData = new JointPartInputData();
            this.bodyRotationInputData = new BodyRotationInputData();
            this.hipsLocationInputData = new JointPartInputData();
            this.leftShoulderLocationInputData = new JointPartInputData();
            this.rightShoulderLocationInputData = new JointPartInputData();
            this.leftArm1LocationInputData = new JointPartInputData();
            this.leftArm2LocationInputData = new JointPartInputData();
            this.rightArm1LocationInputData = new JointPartInputData();
            this.rightArm2LocationInputData = new JointPartInputData();
            this.leftLeg1LocationInputData = new JointPartInputData();
            this.leftLeg2LocationInputData = new JointPartInputData();
            this.rightLeg1LocationInputData = new JointPartInputData();
            this.rightLeg2LocationInputData = new JointPartInputData();
        }
    }
    ManualTracingTool.PosingData = PosingData;
    class JointPartDrawingUnit {
        constructor() {
            this.name = "";
            this.targetData = null;
            this.dependentInputData = null;
            this.drawModel = true;
            this.modelResource = null;
            this.modelConvertMatrix = null;
            this.visualModelAlpha = 1.0;
            this.hitTestSphereAlpha = 0.5;
        }
    }
    ManualTracingTool.JointPartDrawingUnit = JointPartDrawingUnit;
    class PosingLayer extends Layer {
        constructor() {
            super(...arguments);
            this.type = LayerTypeID.posingLayer;
            this.posingModel = new PosingModel();
            this.posingData = new PosingData();
            // runtime
            this.drawingUnits = null;
        }
    }
    ManualTracingTool.PosingLayer = PosingLayer;
    // Animation
    class AnimationSettingData {
        constructor() {
            this.animationFrameParSecond = 24;
            this.loopStartFrame = 0;
            this.loopEndFrame = 24;
            this.maxFrame = 24;
            this.currentTimeFrame = 10.0;
            this.timeLineWindowScale = 1.0;
            this.timeLineWindowScaleMax = 10.0;
            this.timeLineWindowViewLocationX = 0.0;
        }
    }
    ManualTracingTool.AnimationSettingData = AnimationSettingData;
    // Document
    let defaultColors = [
        vec4.fromValues(0.0, 0.0, 0.0, 1.0),
        vec4.fromValues(1.0, 1.0, 1.0, 1.0),
        vec4.fromValues(0.5, 0.0, 0.0, 1.0),
        vec4.fromValues(0.0, 0.5, 0.0, 1.0),
        vec4.fromValues(0.3, 0.3, 0.8, 1.0),
        // Anime skin standard
        vec4.fromValues(250 / 255.0, 221 / 255.0, 189 / 255.0, 1.0),
        vec4.fromValues(220 / 255.0, 167 / 255.0, 125 / 255.0, 1.0),
        // Anime skin cool
        vec4.fromValues(249 / 255.0, 239 / 255.0, 229 / 255.0, 1.0),
        vec4.fromValues(216 / 255.0, 177 / 255.0, 170 / 255.0, 1.0),
        vec4.fromValues(198 / 255.0, 155 / 255.0, 148 / 255.0, 1.0),
    ];
    let DocumentFileType;
    (function (DocumentFileType) {
        DocumentFileType[DocumentFileType["none"] = 0] = "none";
        DocumentFileType[DocumentFileType["json"] = 1] = "json";
        DocumentFileType[DocumentFileType["ora"] = 2] = "ora";
    })(DocumentFileType = ManualTracingTool.DocumentFileType || (ManualTracingTool.DocumentFileType = {}));
    class DocumentData {
        // This class must be created by this function for JSON.parse
        constructor() {
            this.rootLayer = new Layer();
            this.documentFrame = vec4.fromValues(-960.0, -540.0, 959.0, 539.0);
            this.defaultViewScale = 1.0;
            this.lineWidthBiasRate = 1.0;
            this.exportBackGroundType = DocumentBackGroundTypeID.lastPalletColor;
            this.palletColors = new List();
            this.animationSettingData = new AnimationSettingData();
            this.loaded = false;
            this.hasErrorOnLoading = false;
            DocumentData.initializeDefaultPalletColors(this);
        }
        static initializeDefaultPalletColors(documentData) {
            documentData.palletColors = new List();
            for (let color of defaultColors) {
                let palletColor = new PalletColor();
                vec4.copy(palletColor.color, color);
                documentData.palletColors.push(palletColor);
            }
            while (documentData.palletColors.length < DocumentData.maxPalletColors) {
                let palletColor = new PalletColor();
                vec4.set(palletColor.color, 1.0, 1.0, 1.0, 1.0);
                documentData.palletColors.push(palletColor);
            }
        }
        static getDocumentLayout(documentData) {
            let frameLeft = Math.floor(documentData.documentFrame[0]);
            let frameTop = Math.floor(documentData.documentFrame[1]);
            let documentWidth = Math.floor(documentData.documentFrame[2]) - frameLeft + 1;
            let documentHeight = Math.floor(documentData.documentFrame[3]) - frameTop + 1;
            return { left: frameLeft, top: frameTop, width: documentWidth, height: documentHeight };
        }
    }
    DocumentData.maxPalletColors = 50;
    ManualTracingTool.DocumentData = DocumentData;
    class DocumentDataSaveInfo {
        constructor() {
            this.layers = new List();
            this.layerID = 0;
            this.layerDictionary = new Dictionary();
            this.modelFile = null;
        }
        addLayer(layer) {
            layer.ID = this.layerID;
            this.layers.push(layer);
            this.layerID++;
        }
        collectLayer(layer) {
            if (layer.ID == undefined) {
                return;
            }
            this.layerDictionary[layer.ID] = layer;
            delete layer.ID;
        }
    }
    ManualTracingTool.DocumentDataSaveInfo = DocumentDataSaveInfo;
    let DocumentBackGroundTypeID;
    (function (DocumentBackGroundTypeID) {
        DocumentBackGroundTypeID[DocumentBackGroundTypeID["lastPalletColor"] = 1] = "lastPalletColor";
        DocumentBackGroundTypeID[DocumentBackGroundTypeID["transparent"] = 2] = "transparent";
    })(DocumentBackGroundTypeID = ManualTracingTool.DocumentBackGroundTypeID || (ManualTracingTool.DocumentBackGroundTypeID = {}));
})(ManualTracingTool || (ManualTracingTool = {}));
