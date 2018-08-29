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
    // Base layer class
    var LayerTypeID;
    (function (LayerTypeID) {
        LayerTypeID[LayerTypeID["none"] = 0] = "none";
        LayerTypeID[LayerTypeID["rootLayer"] = 1] = "rootLayer";
        LayerTypeID[LayerTypeID["vectorLayer"] = 2] = "vectorLayer";
        LayerTypeID[LayerTypeID["groupLayer"] = 3] = "groupLayer";
        LayerTypeID[LayerTypeID["imageFileReferenceLayer"] = 4] = "imageFileReferenceLayer";
        LayerTypeID[LayerTypeID["posingLayer"] = 5] = "posingLayer";
    })(LayerTypeID = ManualTracingTool.LayerTypeID || (ManualTracingTool.LayerTypeID = {}));
    var Layer = /** @class */ (function () {
        function Layer() {
            this.type = LayerTypeID.none;
            this.name = null;
            this.isVisible = true;
            this.isSelected = false;
            this.childLayers = List();
            this.layerColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        }
        return Layer;
    }());
    ManualTracingTool.Layer = Layer;
    // Vector layer
    var LinePointModifyFlagID;
    (function (LinePointModifyFlagID) {
        LinePointModifyFlagID[LinePointModifyFlagID["none"] = 0] = "none";
        LinePointModifyFlagID[LinePointModifyFlagID["selectedToUnselected"] = 1] = "selectedToUnselected";
        LinePointModifyFlagID[LinePointModifyFlagID["unselectedToSelected"] = 2] = "unselectedToSelected";
        LinePointModifyFlagID[LinePointModifyFlagID["delete"] = 3] = "delete";
    })(LinePointModifyFlagID = ManualTracingTool.LinePointModifyFlagID || (ManualTracingTool.LinePointModifyFlagID = {}));
    var LinePoint = /** @class */ (function () {
        function LinePoint() {
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
            this.lineWidth = 1.0;
            this.isSelected = false;
            // runtime
            this.modifyFlag = LinePointModifyFlagID.none;
            this.tempLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
            this.adjustingLineWidth = 0.0;
            this.totalLength = 0.0;
            this.curvature = 0.0;
        }
        return LinePoint;
    }());
    ManualTracingTool.LinePoint = LinePoint;
    var VectorLineModifyFlagID;
    (function (VectorLineModifyFlagID) {
        VectorLineModifyFlagID[VectorLineModifyFlagID["none"] = 0] = "none";
        VectorLineModifyFlagID[VectorLineModifyFlagID["selectedToUnselected"] = 1] = "selectedToUnselected";
        VectorLineModifyFlagID[VectorLineModifyFlagID["unselectedToSelected"] = 2] = "unselectedToSelected";
        VectorLineModifyFlagID[VectorLineModifyFlagID["delete"] = 3] = "delete";
        VectorLineModifyFlagID[VectorLineModifyFlagID["deletePoints"] = 4] = "deletePoints";
        VectorLineModifyFlagID[VectorLineModifyFlagID["transform"] = 5] = "transform";
        VectorLineModifyFlagID[VectorLineModifyFlagID["reampling"] = 6] = "reampling";
    })(VectorLineModifyFlagID = ManualTracingTool.VectorLineModifyFlagID || (ManualTracingTool.VectorLineModifyFlagID = {}));
    var VectorLine = /** @class */ (function () {
        function VectorLine() {
            this.points = new List();
            this.isCloseToMouse = false;
            this.isEditTarget = false;
            this.isSelected = false;
            this.strokeWidth = 1.0;
            // runtime
            this.modifyFlag = VectorLineModifyFlagID.none;
            this.left = 999999.0;
            this.top = 999999.0;
            this.right = -999999.0;
            this.bottom = -999999.0;
            this.totalLength = 0.0;
        }
        return VectorLine;
    }());
    ManualTracingTool.VectorLine = VectorLine;
    var VectorGroupModifyFlagID;
    (function (VectorGroupModifyFlagID) {
        VectorGroupModifyFlagID[VectorGroupModifyFlagID["none"] = 0] = "none";
        VectorGroupModifyFlagID[VectorGroupModifyFlagID["modifyLines"] = 1] = "modifyLines";
        VectorGroupModifyFlagID[VectorGroupModifyFlagID["deleteLines"] = 2] = "deleteLines";
        VectorGroupModifyFlagID[VectorGroupModifyFlagID["delete"] = 3] = "delete";
    })(VectorGroupModifyFlagID = ManualTracingTool.VectorGroupModifyFlagID || (ManualTracingTool.VectorGroupModifyFlagID = {}));
    var VectorGroup = /** @class */ (function () {
        function VectorGroup() {
            this.lines = new List();
            this.isSelected = false;
            // runtime
            this.modifyFlag = VectorGroupModifyFlagID.none;
            this.linePointModifyFlag = VectorGroupModifyFlagID.none;
        }
        return VectorGroup;
    }());
    ManualTracingTool.VectorGroup = VectorGroup;
    var DrawLineTypeID;
    (function (DrawLineTypeID) {
        DrawLineTypeID[DrawLineTypeID["none"] = 1] = "none";
        DrawLineTypeID[DrawLineTypeID["solid"] = 2] = "solid";
    })(DrawLineTypeID = ManualTracingTool.DrawLineTypeID || (ManualTracingTool.DrawLineTypeID = {}));
    var FillAreaTypeID;
    (function (FillAreaTypeID) {
        FillAreaTypeID[FillAreaTypeID["none"] = 1] = "none";
        FillAreaTypeID[FillAreaTypeID["byFillColor"] = 2] = "byFillColor";
    })(FillAreaTypeID = ManualTracingTool.FillAreaTypeID || (ManualTracingTool.FillAreaTypeID = {}));
    var VectorLayer = /** @class */ (function (_super) {
        __extends(VectorLayer, _super);
        function VectorLayer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.type = LayerTypeID.vectorLayer;
            _this.groups = new List();
            _this.drawLineType = DrawLineTypeID.solid;
            _this.fillAreaType = FillAreaTypeID.none;
            _this.fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            return _this;
        }
        return VectorLayer;
    }(Layer));
    ManualTracingTool.VectorLayer = VectorLayer;
    // Group layer
    var GroupLayer = /** @class */ (function (_super) {
        __extends(GroupLayer, _super);
        function GroupLayer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.type = LayerTypeID.groupLayer;
            return _this;
        }
        return GroupLayer;
    }(Layer));
    ManualTracingTool.GroupLayer = GroupLayer;
    // Image file reference layer
    var ImageFileReferenceLayer = /** @class */ (function (_super) {
        __extends(ImageFileReferenceLayer, _super);
        function ImageFileReferenceLayer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.type = LayerTypeID.imageFileReferenceLayer;
            _this.imageFilePath = null;
            _this.location = vec3.fromValues(0.0, 0.0, 0.0);
            _this.rotation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.scale = vec3.fromValues(1.0, 1.0, 1.0);
            // runtime
            _this.imageResource = null;
            _this.adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.adjustingRotation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.adjustingScale = vec3.fromValues(1.0, 1.0, 1.0);
            return _this;
        }
        return ImageFileReferenceLayer;
    }(Layer));
    ManualTracingTool.ImageFileReferenceLayer = ImageFileReferenceLayer;
    // Posing
    var PosingModel = /** @class */ (function () {
        function PosingModel() {
            // Head to body
            this.headSphereSize = 0.17; // 14cm
            this.headTwistSphereSize = 0.26; //
            this.bodySphereSize = 0.44; // 44cm
            this.bodySphereLocation = vec3.fromValues(0.0, -0.03, -0.15);
            this.neckSphereLocation = vec3.fromValues(0.0, -0.03, -0.13);
            this.bodyRotationSphereSize = 0.22; // 11cm
            this.bodyRotationSphereLocation = vec3.fromValues(0.0, 0.0, -0.31);
            // Arms
            this.leftArm1Location = vec3.fromValues(-0.135, 0.0, -0.05);
            this.rightArm1Location = vec3.fromValues(+0.135, 0.0, -0.05);
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
        }
        return PosingModel;
    }());
    ManualTracingTool.PosingModel = PosingModel;
    var InputSideID;
    (function (InputSideID) {
        InputSideID[InputSideID["none"] = 0] = "none";
        InputSideID[InputSideID["front"] = 1] = "front";
        InputSideID[InputSideID["back"] = 2] = "back";
    })(InputSideID = ManualTracingTool.InputSideID || (ManualTracingTool.InputSideID = {}));
    var PosingInputData = /** @class */ (function () {
        function PosingInputData() {
            this.inputDone = false;
        }
        return PosingInputData;
    }());
    ManualTracingTool.PosingInputData = PosingInputData;
    var HeadLocationInputData = /** @class */ (function (_super) {
        __extends(HeadLocationInputData, _super);
        function HeadLocationInputData() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.center = vec3.fromValues(0.0, 0.0, 0.0);
            _this.radius = 0.0;
            _this.editLine = null;
            _this.matrix = mat4.create();
            _this.headMatrix = mat4.create();
            _this.bodyRootMatrix = mat4.create();
            _this.neckSphereMatrix = mat4.create();
            return _this;
        }
        return HeadLocationInputData;
    }(PosingInputData));
    ManualTracingTool.HeadLocationInputData = HeadLocationInputData;
    var HeadRotationInputData = /** @class */ (function (_super) {
        __extends(HeadRotationInputData, _super);
        function HeadRotationInputData() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.inputSideID = InputSideID.front;
            _this.inputLocation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.editLine = null;
            _this.matrix = mat4.create();
            return _this;
        }
        return HeadRotationInputData;
    }(PosingInputData));
    ManualTracingTool.HeadRotationInputData = HeadRotationInputData;
    var DirectionInputData = /** @class */ (function (_super) {
        __extends(DirectionInputData, _super);
        function DirectionInputData() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.inputSideID = InputSideID.front;
            _this.inputLocation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.editLine = null;
            _this.matrix = mat4.create();
            return _this;
        }
        return DirectionInputData;
    }(PosingInputData));
    ManualTracingTool.DirectionInputData = DirectionInputData;
    var BodyLocationInputData = /** @class */ (function (_super) {
        __extends(BodyLocationInputData, _super);
        function BodyLocationInputData() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.bodyMatrix = mat4.create();
            _this.rotationCenterMatrix = mat4.create();
            _this.leftArm1RootMatrix = mat4.create();
            _this.rightArm1RootMatrix = mat4.create();
            _this.leftLeg1RootMatrix = mat4.create();
            _this.rightLeg1RootMatrix = mat4.create();
            return _this;
        }
        return BodyLocationInputData;
    }(DirectionInputData));
    ManualTracingTool.BodyLocationInputData = BodyLocationInputData;
    var BodyRotationInputData = /** @class */ (function (_super) {
        __extends(BodyRotationInputData, _super);
        function BodyRotationInputData() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.inputSideID = InputSideID.front;
            _this.inputLocation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.editLine = null;
            _this.matrix = mat4.create();
            return _this;
        }
        return BodyRotationInputData;
    }(PosingInputData));
    ManualTracingTool.BodyRotationInputData = BodyRotationInputData;
    var JointPartInputData = /** @class */ (function (_super) {
        __extends(JointPartInputData, _super);
        function JointPartInputData() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.childJointRootMatrix = mat4.create();
            return _this;
        }
        return JointPartInputData;
    }(DirectionInputData));
    ManualTracingTool.JointPartInputData = JointPartInputData;
    var PosingData = /** @class */ (function () {
        function PosingData() {
            this.real3DViewHalfWidth = 1.0;
            this.headLocationInputData = new HeadLocationInputData();
            this.headRotationInputData = new HeadRotationInputData();
            this.headTwistInputData = new HeadRotationInputData();
            this.bodyLocationInputData = new BodyLocationInputData();
            this.bodyRotationInputData = new BodyRotationInputData();
            this.leftArm1LocationInputData = new JointPartInputData();
            this.leftArm2LocationInputData = new JointPartInputData();
            this.rightArm1LocationInputData = new JointPartInputData();
            this.rightArm2LocationInputData = new JointPartInputData();
            this.leftLeg1LocationInputData = new JointPartInputData();
            this.leftLeg2LocationInputData = new JointPartInputData();
            this.rightLeg1LocationInputData = new JointPartInputData();
            this.rightLeg2LocationInputData = new JointPartInputData();
        }
        return PosingData;
    }());
    ManualTracingTool.PosingData = PosingData;
    var PosingLayer = /** @class */ (function (_super) {
        __extends(PosingLayer, _super);
        function PosingLayer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.type = LayerTypeID.posingLayer;
            _this.posingModel = new PosingModel();
            _this.posingData = new PosingData();
            return _this;
        }
        return PosingLayer;
    }(Layer));
    ManualTracingTool.PosingLayer = PosingLayer;
    // Document
    var DocumentData = /** @class */ (function () {
        function DocumentData() {
            this.loaded = false;
            this.rootLayer = new Layer();
            this.documentFrame = vec4.fromValues(-512.0, -512.0, 512.0, 512.0);
        }
        return DocumentData;
    }());
    ManualTracingTool.DocumentData = DocumentData;
})(ManualTracingTool || (ManualTracingTool = {}));
