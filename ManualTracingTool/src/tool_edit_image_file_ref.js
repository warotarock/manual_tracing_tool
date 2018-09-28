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
    var Tool_EditImageFileReference = /** @class */ (function (_super) {
        __extends(Tool_EditImageFileReference, _super);
        function Tool_EditImageFileReference() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.helpText = 'Oキーで画像ファイルを開きます。';
            return _this;
        }
        Tool_EditImageFileReference.prototype.isAvailable = function (env) {
            return (env.currentImageFileReferenceLayer != null);
        };
        Tool_EditImageFileReference.prototype.keydown = function (e, env) {
            if (e.key == 'o') {
                env.openFileDialog(ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath);
            }
        };
        Tool_EditImageFileReference.prototype.toolWindowItemDoubleClick = function (e, env) {
            env.openFileDialog(ManualTracingTool.OpenFileDialogTargetID.imageFileReferenceLayerFilePath);
        };
        Tool_EditImageFileReference.prototype.onOpenFile = function (filePath, env) {
            if (env.currentImageFileReferenceLayer != null) {
                if (env.currentImageFileReferenceLayer.imageFilePath != filePath) {
                    this.executeCommand(filePath, env);
                }
            }
        };
        Tool_EditImageFileReference.prototype.executeCommand = function (filePath, env) {
            var command = new Command_LoadReferenceImageToLayer();
            command.targetLayer = env.currentImageFileReferenceLayer;
            command.newFilePath = filePath;
            command.execute(env);
            env.commandHistory.addCommand(command);
        };
        return Tool_EditImageFileReference;
    }(ManualTracingTool.ToolBase));
    ManualTracingTool.Tool_EditImageFileReference = Tool_EditImageFileReference;
    var Command_LoadReferenceImageToLayer = /** @class */ (function (_super) {
        __extends(Command_LoadReferenceImageToLayer, _super);
        function Command_LoadReferenceImageToLayer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetLayer = null;
            _this.oldFilePath = null;
            _this.newFilePath = null;
            return _this;
        }
        Command_LoadReferenceImageToLayer.prototype.execute = function (env) {
            this.errorCheck();
            this.oldFilePath = this.targetLayer.imageFilePath;
            this.redo(env);
        };
        Command_LoadReferenceImageToLayer.prototype.undo = function (env) {
            this.targetLayer.imageFilePath = this.oldFilePath;
            this.targetLayer.imageResource.loaded = false;
            env.startLoadingCurrentDocumentResources();
        };
        Command_LoadReferenceImageToLayer.prototype.redo = function (env) {
            this.targetLayer.imageFilePath = this.newFilePath;
            this.targetLayer.imageResource.loaded = false;
            env.startLoadingCurrentDocumentResources();
        };
        Command_LoadReferenceImageToLayer.prototype.errorCheck = function () {
            if (this.targetLayer == null) {
                throw ('Command_LoadReferenceImageToLayer: layer is null!');
            }
            if (StringIsNullOrEmpty(this.newFilePath)) {
                throw ('Command_LoadReferenceImageToLayer: new file path is empty!');
            }
        };
        return Command_LoadReferenceImageToLayer;
    }(ManualTracingTool.CommandBase));
    var Tool_Transform_ReferenceImage = /** @class */ (function (_super) {
        __extends(Tool_Transform_ReferenceImage, _super);
        function Tool_Transform_ReferenceImage() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.imageSize = vec3.create();
            _this.pointLocation = vec3.create();
            _this.transformMatrix = mat4.create();
            _this.dLocation = vec3.create();
            return _this;
        }
        Tool_Transform_ReferenceImage.prototype.checkTarget = function (e, env) {
            if (env.currentImageFileReferenceLayer == null) {
                return false;
            }
            return true;
        };
        Tool_Transform_ReferenceImage.prototype.prepareLatticePoints = function (env) {
            var image = env.currentImageFileReferenceLayer.imageResource.image;
            // calculate matrix
            mat4.identity(this.transformMatrix);
            mat4.translate(this.transformMatrix, this.transformMatrix, env.currentImageFileReferenceLayer.location);
            var angle = env.currentImageFileReferenceLayer.rotation[0];
            mat4.rotateZ(this.transformMatrix, this.transformMatrix, angle);
            vec3.set(this.imageSize, image.width, image.height, 0.0);
            mat4.scale(this.transformMatrix, this.transformMatrix, this.imageSize);
            mat4.scale(this.transformMatrix, this.transformMatrix, env.currentImageFileReferenceLayer.scale);
            // calculate lattice points
            vec3.set(this.pointLocation, 0.0, 0.0, 0.0);
            vec3.transformMat4(this.latticePoints[0].baseLocation, this.pointLocation, this.transformMatrix);
            vec3.set(this.pointLocation, 1.0, 0.0, 0.0);
            vec3.transformMat4(this.latticePoints[1].baseLocation, this.pointLocation, this.transformMatrix);
            vec3.set(this.pointLocation, 1.0, 1.0, 0.0);
            vec3.transformMat4(this.latticePoints[2].baseLocation, this.pointLocation, this.transformMatrix);
            vec3.set(this.pointLocation, 0.0, 1.0, 0.0);
            vec3.transformMat4(this.latticePoints[3].baseLocation, this.pointLocation, this.transformMatrix);
            this.resetLatticePointLocationToBaseLocation();
            return true;
        };
        Tool_Transform_ReferenceImage.prototype.createEditData = function (e, env) {
        };
        Tool_Transform_ReferenceImage.prototype.processTransform = function (env) {
            var image = env.currentImageFileReferenceLayer.imageResource.image;
            // location
            vec3.copy(env.currentImageFileReferenceLayer.adjustingLocation, this.latticePoints[0].location);
            // scale
            vec3.subtract(this.dLocation, this.latticePoints[0].location, this.latticePoints[3].location);
            var scaleH = vec3.length(this.dLocation) / image.height;
            vec3.subtract(this.dLocation, this.latticePoints[0].location, this.latticePoints[1].location);
            var scaleW = vec3.length(this.dLocation) / image.width;
            vec3.set(env.currentImageFileReferenceLayer.adjustingScale, scaleW, scaleH, 0.0);
            // angle
            vec3.subtract(this.dLocation, this.latticePoints[1].location, this.latticePoints[0].location);
            var angle = Math.atan2(this.dLocation[1], this.dLocation[0]);
            env.currentImageFileReferenceLayer.adjustingRotation[0] = angle;
        };
        Tool_Transform_ReferenceImage.prototype.executeCommand = function (env) {
            // Execute the command
            var command = new Command_Transform_ReferenceImage();
            command.targetLayer = env.currentImageFileReferenceLayer;
            vec3.copy(command.newLocation, command.targetLayer.adjustingLocation);
            vec3.copy(command.newRotation, command.targetLayer.adjustingRotation);
            vec3.copy(command.newScale, command.targetLayer.adjustingScale);
            command.execute(env);
            env.commandHistory.addCommand(command);
        };
        return Tool_Transform_ReferenceImage;
    }(ManualTracingTool.Tool_Transform_Lattice));
    var Command_Transform_ReferenceImage = /** @class */ (function (_super) {
        __extends(Command_Transform_ReferenceImage, _super);
        function Command_Transform_ReferenceImage() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.targetLayer = null;
            _this.newLocation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.newRotation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.newScale = vec3.fromValues(1.0, 1.0, 1.0);
            _this.oldLocation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.oldRotation = vec3.fromValues(0.0, 0.0, 0.0);
            _this.oldScale = vec3.fromValues(1.0, 1.0, 1.0);
            return _this;
        }
        Command_Transform_ReferenceImage.prototype.execute = function (env) {
            this.errorCheck();
            vec3.copy(this.oldLocation, this.targetLayer.location);
            vec3.copy(this.oldRotation, this.targetLayer.rotation);
            vec3.copy(this.oldScale, this.targetLayer.scale);
            this.redo(env);
        };
        Command_Transform_ReferenceImage.prototype.undo = function (env) {
            vec3.copy(this.targetLayer.location, this.oldLocation);
            vec3.copy(this.targetLayer.rotation, this.oldRotation);
            vec3.copy(this.targetLayer.scale, this.oldScale);
        };
        Command_Transform_ReferenceImage.prototype.redo = function (env) {
            vec3.copy(this.targetLayer.location, this.newLocation);
            vec3.copy(this.targetLayer.rotation, this.newRotation);
            vec3.copy(this.targetLayer.scale, this.newScale);
        };
        Command_Transform_ReferenceImage.prototype.errorCheck = function () {
            if (this.targetLayer == null) {
                throw ('Command_LoadReferenceImageToLayer: layer is null!');
            }
        };
        return Command_Transform_ReferenceImage;
    }(ManualTracingTool.CommandBase));
    var Tool_Transform_ReferenceImage_GrabMove = /** @class */ (function (_super) {
        __extends(Tool_Transform_ReferenceImage_GrabMove, _super);
        function Tool_Transform_ReferenceImage_GrabMove() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.calcer = new ManualTracingTool.Tool_Transform_Lattice_Calcer_GrabMove();
            return _this;
        }
        Tool_Transform_ReferenceImage_GrabMove.prototype.processLatticePointMouseMove = function (e, env) {
            this.calcer.processLatticePointMouseMove(this.latticePoints, this.mouseAnchorLocation, e);
        };
        return Tool_Transform_ReferenceImage_GrabMove;
    }(Tool_Transform_ReferenceImage));
    ManualTracingTool.Tool_Transform_ReferenceImage_GrabMove = Tool_Transform_ReferenceImage_GrabMove;
    var Tool_Transform_ReferenceImage_Rotate = /** @class */ (function (_super) {
        __extends(Tool_Transform_ReferenceImage_Rotate, _super);
        function Tool_Transform_ReferenceImage_Rotate() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.calcer = new ManualTracingTool.Tool_Transform_Lattice_Calcer_Rotate();
            return _this;
        }
        Tool_Transform_ReferenceImage_Rotate.prototype.prepareModalExt = function (e, env) {
            this.calcer.prepareModalExt(e, env);
        };
        Tool_Transform_ReferenceImage_Rotate.prototype.processLatticePointMouseMove = function (e, env) {
            this.calcer.processLatticePointMouseMove(this.latticePoints, e, env);
        };
        return Tool_Transform_ReferenceImage_Rotate;
    }(Tool_Transform_ReferenceImage));
    ManualTracingTool.Tool_Transform_ReferenceImage_Rotate = Tool_Transform_ReferenceImage_Rotate;
    var Tool_Transform_ReferenceImage_Scale = /** @class */ (function (_super) {
        __extends(Tool_Transform_ReferenceImage_Scale, _super);
        function Tool_Transform_ReferenceImage_Scale() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.calcer = new ManualTracingTool.Tool_Transform_Lattice_Calcer_Scale();
            return _this;
        }
        Tool_Transform_ReferenceImage_Scale.prototype.prepareModalExt = function (e, env) {
            this.calcer.prepareModalExt(e, env);
        };
        Tool_Transform_ReferenceImage_Scale.prototype.processLatticePointMouseMove = function (e, env) {
            this.calcer.processLatticePointMouseMove(this.latticePoints, e, env);
        };
        return Tool_Transform_ReferenceImage_Scale;
    }(Tool_Transform_ReferenceImage));
    ManualTracingTool.Tool_Transform_ReferenceImage_Scale = Tool_Transform_ReferenceImage_Scale;
})(ManualTracingTool || (ManualTracingTool = {}));
