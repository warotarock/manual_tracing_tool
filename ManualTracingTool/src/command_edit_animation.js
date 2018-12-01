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
    var Command_Animation_KeyframeListEditData = /** @class */ (function () {
        function Command_Animation_KeyframeListEditData() {
            this.layer = null;
            this.oldKeyFrames = null;
            this.newKeyFrames = null;
        }
        return Command_Animation_KeyframeListEditData;
    }());
    var Command_Animation_InsertKeyframeAllLayer = /** @class */ (function (_super) {
        __extends(Command_Animation_InsertKeyframeAllLayer, _super);
        function Command_Animation_InsertKeyframeAllLayer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.frame = 0;
            _this.editDatas = new List();
            return _this;
        }
        Command_Animation_InsertKeyframeAllLayer.prototype.prepareEditData = function (env) {
            var layers = new List();
            ManualTracingTool.Layer.collectLayerRecursive(layers, env.document.rootLayer);
            var targetFrame = this.frame;
            for (var _i = 0, layers_1 = layers; _i < layers_1.length; _i++) {
                var layer = layers_1[_i];
                if (layer.type != ManualTracingTool.LayerTypeID.vectorLayer) {
                    continue;
                }
                var vectorLayer = layer;
                // Search index to insert and last keyframe
                var keyframeIndex = ManualTracingTool.VectorLayer.findLastKeyframeIndex(vectorLayer, targetFrame);
                if (keyframeIndex == -1) {
                    continue;
                }
                var last_KeyFrame = vectorLayer.keyframes[keyframeIndex];
                // Crete keyframe and insert
                var newKeyframe = new ManualTracingTool.VectorLayerKeyframe();
                newKeyframe.frame = targetFrame;
                if (last_KeyFrame != null) {
                    newKeyframe.geometry = JSON.parse(JSON.stringify(last_KeyFrame.geometry));
                }
                else {
                    newKeyframe.geometry = new ManualTracingTool.VectorLayerGeometry();
                }
                var newKeyFrames = ListClone(vectorLayer.keyframes);
                if (keyframeIndex + 1 < newKeyFrames.length) {
                    ListInsertAt(newKeyFrames, keyframeIndex + 1, newKeyframe);
                }
                else {
                    newKeyFrames.push(newKeyframe);
                }
                var editData = new Command_Animation_KeyframeListEditData();
                editData.layer = vectorLayer;
                editData.oldKeyFrames = vectorLayer.keyframes;
                editData.newKeyFrames = newKeyFrames;
                this.editDatas.push(editData);
            }
            return this.isAvailable(env);
        };
        Command_Animation_InsertKeyframeAllLayer.prototype.isAvailable = function (env) {
            return (this.editDatas.length > 0);
        };
        Command_Animation_InsertKeyframeAllLayer.prototype.execute = function (env) {
            this.redo(env);
        };
        Command_Animation_InsertKeyframeAllLayer.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editDatas; _i < _a.length; _i++) {
                var editData = _a[_i];
                editData.layer.keyframes = editData.oldKeyFrames;
            }
            env.updateLayerStructure();
        };
        Command_Animation_InsertKeyframeAllLayer.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editDatas; _i < _a.length; _i++) {
                var editData = _a[_i];
                editData.layer.keyframes = editData.newKeyFrames;
            }
            env.updateLayerStructure();
        };
        return Command_Animation_InsertKeyframeAllLayer;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Animation_InsertKeyframeAllLayer = Command_Animation_InsertKeyframeAllLayer;
    var Command_Animation_DeleteKeyframeAllLayer = /** @class */ (function (_super) {
        __extends(Command_Animation_DeleteKeyframeAllLayer, _super);
        function Command_Animation_DeleteKeyframeAllLayer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.frame = 0;
            _this.editDatas = new List();
            return _this;
        }
        Command_Animation_DeleteKeyframeAllLayer.prototype.prepareEditData = function (env) {
            var layers = new List();
            ManualTracingTool.Layer.collectLayerRecursive(layers, env.document.rootLayer);
            var targetFrame = this.frame;
            for (var _i = 0, layers_2 = layers; _i < layers_2.length; _i++) {
                var layer = layers_2[_i];
                if (layer.type != ManualTracingTool.LayerTypeID.vectorLayer) {
                    continue;
                }
                var vectorLayer = layer;
                // Search index to insert and last keyframe
                var keyframeIndex = ManualTracingTool.VectorLayer.findLastKeyframeIndex(vectorLayer, targetFrame);
                if (keyframeIndex == -1) {
                    continue;
                }
                var last_KeyFrame = vectorLayer.keyframes[keyframeIndex];
                if (last_KeyFrame.frame != targetFrame) {
                    continue;
                }
                var newKeyFrames = ListClone(vectorLayer.keyframes);
                ListRemoveAt(newKeyFrames, keyframeIndex);
                var editData = new Command_Animation_KeyframeListEditData();
                editData.layer = vectorLayer;
                editData.oldKeyFrames = vectorLayer.keyframes;
                editData.newKeyFrames = newKeyFrames;
                this.editDatas.push(editData);
            }
            return this.isAvailable(env);
        };
        Command_Animation_DeleteKeyframeAllLayer.prototype.isAvailable = function (env) {
            return (this.editDatas.length > 0);
        };
        Command_Animation_DeleteKeyframeAllLayer.prototype.execute = function (env) {
            this.redo(env);
        };
        Command_Animation_DeleteKeyframeAllLayer.prototype.undo = function (env) {
            for (var _i = 0, _a = this.editDatas; _i < _a.length; _i++) {
                var editData = _a[_i];
                editData.layer.keyframes = editData.oldKeyFrames;
            }
            env.updateLayerStructure();
        };
        Command_Animation_DeleteKeyframeAllLayer.prototype.redo = function (env) {
            for (var _i = 0, _a = this.editDatas; _i < _a.length; _i++) {
                var editData = _a[_i];
                editData.layer.keyframes = editData.newKeyFrames;
            }
            env.updateLayerStructure();
        };
        return Command_Animation_DeleteKeyframeAllLayer;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Animation_DeleteKeyframeAllLayer = Command_Animation_DeleteKeyframeAllLayer;
})(ManualTracingTool || (ManualTracingTool = {}));
