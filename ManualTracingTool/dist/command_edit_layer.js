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
    var Command_Layer_CommandBase = /** @class */ (function (_super) {
        __extends(Command_Layer_CommandBase, _super);
        function Command_Layer_CommandBase() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.currentLayer = null;
            _this.currentLayerParent = null;
            _this.currentLayerIndex = -1;
            _this.previousLayer = null;
            _this.previousLayerParent = null;
            _this.previousLayerIndex = -1;
            _this.nextLayer = null;
            _this.nextLayerParent = null;
            _this.nextLayerIndex = -1;
            _this.removeFrom_ParentLayer = null;
            _this.removeFrom_OldChildLayerList = null;
            _this.removeFrom_NewChildLayerList = null;
            _this.insertTo_ParentLayer = null;
            _this.insertTo_Layer_OldChildLayerList = null;
            _this.insertTo_Layer_NewChildLayerList = null;
            _this.newLayer = null;
            return _this;
        }
        Command_Layer_CommandBase.prototype.isAvailable = function (env) {
            return false;
        };
        Command_Layer_CommandBase.prototype.setPrameters = function (currentLayer, currentLayerParent, previousLayer, previousLayerParent, nextLayer, nextLayerParent) {
            this.currentLayer = currentLayer;
            this.currentLayerParent = currentLayerParent;
            this.currentLayerIndex = this.findChildLayerIndex(currentLayerParent, currentLayer);
            this.previousLayer = previousLayer;
            this.previousLayerParent = previousLayerParent;
            this.previousLayerIndex = this.findChildLayerIndex(previousLayerParent, previousLayer);
            this.nextLayer = nextLayer;
            this.nextLayerParent = nextLayerParent;
            this.nextLayerIndex = this.findChildLayerIndex(nextLayerParent, nextLayer);
        };
        Command_Layer_CommandBase.prototype.findChildLayerIndex = function (parentLayer, childLayer) {
            if (parentLayer == null || childLayer == null) {
                return -1;
            }
            for (var i = 0; i < parentLayer.childLayers.length; i++) {
                if (parentLayer.childLayers[i] == childLayer) {
                    return i;
                }
            }
            return -1;
        };
        Command_Layer_CommandBase.prototype.isContainerLayer = function (layer) {
            return (layer.type == ManualTracingTool.LayerTypeID.rootLayer
                || layer.type == ManualTracingTool.LayerTypeID.groupLayer);
        };
        Command_Layer_CommandBase.prototype.executeLayerSwap = function (parentLayer, swapIndex1, swapIndex2, env) {
            this.insertTo_ParentLayer = parentLayer;
            this.insertTo_Layer_OldChildLayerList = parentLayer.childLayers;
            this.insertTo_Layer_NewChildLayerList = ListClone(parentLayer.childLayers);
            var swapItem = this.insertTo_Layer_NewChildLayerList[swapIndex1];
            this.insertTo_Layer_NewChildLayerList[swapIndex1] = this.insertTo_Layer_NewChildLayerList[swapIndex2];
            this.insertTo_Layer_NewChildLayerList[swapIndex2] = swapItem;
            parentLayer.childLayers = this.insertTo_Layer_NewChildLayerList;
            env.updateLayerStructure();
        };
        Command_Layer_CommandBase.prototype.executeLayerInsertToCurrent = function (layer, env) {
            var parentLayer;
            var insertIndex;
            if (this.currentLayer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                parentLayer = this.currentLayer;
                insertIndex = 0;
            }
            else {
                parentLayer = this.currentLayerParent;
                insertIndex = this.currentLayerIndex;
            }
            this.executeLayerInsert(parentLayer, insertIndex, layer, env);
        };
        Command_Layer_CommandBase.prototype.executeLayerInsert = function (parentLayer, insertIndex, layer, env) {
            this.insertTo_ParentLayer = parentLayer;
            this.insertTo_Layer_OldChildLayerList = parentLayer.childLayers;
            this.insertTo_Layer_NewChildLayerList = ListClone(parentLayer.childLayers);
            if (insertIndex < this.insertTo_Layer_NewChildLayerList.length) {
                ListInsertAt(this.insertTo_Layer_NewChildLayerList, insertIndex, layer);
            }
            else {
                this.insertTo_Layer_NewChildLayerList.push(layer);
            }
            parentLayer.childLayers = this.insertTo_Layer_NewChildLayerList;
            env.updateLayerStructure();
            this.newLayer = layer;
            env.setCurrentLayer(layer);
        };
        Command_Layer_CommandBase.prototype.executeLayerRemove = function (parentLayer, removeIndex, env) {
            this.removeFrom_ParentLayer = parentLayer;
            this.removeFrom_OldChildLayerList = parentLayer.childLayers;
            this.removeFrom_NewChildLayerList = ListClone(parentLayer.childLayers);
            ListRemoveAt(this.removeFrom_NewChildLayerList, removeIndex);
            parentLayer.childLayers = this.removeFrom_NewChildLayerList;
            env.setCurrentLayer(null);
            env.updateLayerStructure();
            if (this.previousLayer != null) {
                env.setCurrentLayer(this.previousLayer);
            }
            else if (this.nextLayer != null) {
                env.setCurrentLayer(this.nextLayer);
            }
        };
        Command_Layer_CommandBase.prototype.undo = function (env) {
            if (this.insertTo_ParentLayer != null) {
                this.insertTo_ParentLayer.childLayers = this.insertTo_Layer_OldChildLayerList;
            }
            if (this.removeFrom_ParentLayer != null) {
                this.removeFrom_ParentLayer.childLayers = this.removeFrom_OldChildLayerList;
            }
            env.setCurrentLayer(null);
            env.updateLayerStructure();
            if (this.currentLayer != null) {
                env.setCurrentLayer(this.currentLayer);
            }
            env.setRedrawMainWindowEditorWindow();
        };
        Command_Layer_CommandBase.prototype.redo = function (env) {
            if (this.insertTo_ParentLayer != null) {
                this.insertTo_ParentLayer.childLayers = this.insertTo_Layer_NewChildLayerList;
            }
            if (this.removeFrom_ParentLayer != null) {
                this.removeFrom_ParentLayer.childLayers = this.removeFrom_NewChildLayerList;
            }
            env.updateLayerStructure();
            if (this.newLayer != null) {
                env.setCurrentLayer(this.newLayer);
            }
            env.setRedrawMainWindowEditorWindow();
        };
        return Command_Layer_CommandBase;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Layer_CommandBase = Command_Layer_CommandBase;
    var Command_Layer_AddVectorLayerToCurrentPosition = /** @class */ (function (_super) {
        __extends(Command_Layer_AddVectorLayerToCurrentPosition, _super);
        function Command_Layer_AddVectorLayerToCurrentPosition() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.createForFillColor = false;
            _this.newLayer = null;
            return _this;
        }
        Command_Layer_AddVectorLayerToCurrentPosition.prototype.isAvailable = function (env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            return true;
        };
        Command_Layer_AddVectorLayerToCurrentPosition.prototype.execute = function (env) {
            this.newLayer = new ManualTracingTool.VectorLayer();
            if (!this.createForFillColor) {
                this.newLayer.name = 'new line layer';
                this.newLayer.drawLineType = ManualTracingTool.DrawLineTypeID.paletteColor;
                this.newLayer.fillAreaType = ManualTracingTool.FillAreaTypeID.none;
            }
            else {
                this.newLayer.name = 'new fill layer';
                this.newLayer.drawLineType = ManualTracingTool.DrawLineTypeID.none;
                this.newLayer.fillAreaType = ManualTracingTool.FillAreaTypeID.paletteColor;
            }
            var keyFrame = new ManualTracingTool.VectorLayerKeyframe();
            keyFrame.geometry = new ManualTracingTool.VectorLayerGeometry();
            this.newLayer.keyframes.push(keyFrame);
            var group = new ManualTracingTool.VectorGroup();
            keyFrame.geometry.groups.push(group);
            this.executeLayerInsertToCurrent(this.newLayer, env);
        };
        return Command_Layer_AddVectorLayerToCurrentPosition;
    }(Command_Layer_CommandBase));
    ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition = Command_Layer_AddVectorLayerToCurrentPosition;
    var Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition = /** @class */ (function (_super) {
        __extends(Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition, _super);
        function Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.newLayer = null;
            return _this;
        }
        Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition.prototype.isAvailable = function (env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            if (this.currentLayer == null || this.currentLayer.type != ManualTracingTool.LayerTypeID.vectorLayer) {
                return false;
            }
            return true;
        };
        Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition.prototype.execute = function (env) {
            this.newLayer = new ManualTracingTool.VectorLayerReferenceLayer();
            this.newLayer.name = 'new ref layer';
            this.newLayer.referenceLayer = (this.currentLayer);
            this.newLayer.keyframes = this.newLayer.referenceLayer.keyframes;
            this.executeLayerInsertToCurrent(this.newLayer, env);
        };
        return Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition;
    }(Command_Layer_CommandBase));
    ManualTracingTool.Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition = Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition;
    var Command_Layer_AddGroupLayerToCurrentPosition = /** @class */ (function (_super) {
        __extends(Command_Layer_AddGroupLayerToCurrentPosition, _super);
        function Command_Layer_AddGroupLayerToCurrentPosition() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.newLayer = null;
            return _this;
        }
        Command_Layer_AddGroupLayerToCurrentPosition.prototype.isAvailable = function (env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            return true;
        };
        Command_Layer_AddGroupLayerToCurrentPosition.prototype.execute = function (env) {
            this.newLayer = new ManualTracingTool.GroupLayer();
            this.newLayer.name = 'new group';
            this.executeLayerInsertToCurrent(this.newLayer, env);
        };
        return Command_Layer_AddGroupLayerToCurrentPosition;
    }(Command_Layer_CommandBase));
    ManualTracingTool.Command_Layer_AddGroupLayerToCurrentPosition = Command_Layer_AddGroupLayerToCurrentPosition;
    var Command_Layer_AddImageFileReferenceLayerToCurrentPosition = /** @class */ (function (_super) {
        __extends(Command_Layer_AddImageFileReferenceLayerToCurrentPosition, _super);
        function Command_Layer_AddImageFileReferenceLayerToCurrentPosition() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.newLayer = null;
            return _this;
        }
        Command_Layer_AddImageFileReferenceLayerToCurrentPosition.prototype.isAvailable = function (env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            return true;
        };
        Command_Layer_AddImageFileReferenceLayerToCurrentPosition.prototype.execute = function (env) {
            this.newLayer = new ManualTracingTool.ImageFileReferenceLayer();
            this.newLayer.name = 'new file';
            this.executeLayerInsertToCurrent(this.newLayer, env);
        };
        return Command_Layer_AddImageFileReferenceLayerToCurrentPosition;
    }(Command_Layer_CommandBase));
    ManualTracingTool.Command_Layer_AddImageFileReferenceLayerToCurrentPosition = Command_Layer_AddImageFileReferenceLayerToCurrentPosition;
    var Command_Layer_AddPosingLayerToCurrentPosition = /** @class */ (function (_super) {
        __extends(Command_Layer_AddPosingLayerToCurrentPosition, _super);
        function Command_Layer_AddPosingLayerToCurrentPosition() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.newLayer = null;
            return _this;
        }
        Command_Layer_AddPosingLayerToCurrentPosition.prototype.isAvailable = function (env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            return true;
        };
        Command_Layer_AddPosingLayerToCurrentPosition.prototype.execute = function (env) {
            this.newLayer = new ManualTracingTool.PosingLayer();
            this.newLayer.name = 'new posing';
            this.newLayer.posingModel = env.getPosingModelByName('dummy_skin');
            this.executeLayerInsertToCurrent(this.newLayer, env);
        };
        return Command_Layer_AddPosingLayerToCurrentPosition;
    }(Command_Layer_CommandBase));
    ManualTracingTool.Command_Layer_AddPosingLayerToCurrentPosition = Command_Layer_AddPosingLayerToCurrentPosition;
    var Command_Layer_Delete = /** @class */ (function (_super) {
        __extends(Command_Layer_Delete, _super);
        function Command_Layer_Delete() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Command_Layer_Delete.prototype.isAvailable = function (env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (this.currentLayerParent.type == ManualTracingTool.LayerTypeID.rootLayer && this.currentLayerParent.childLayers.length == 1) {
                return false;
            }
            return true;
        };
        Command_Layer_Delete.prototype.execute = function (env) {
            this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, env);
            if (this.previousLayer != null) {
                env.setCurrentLayer(this.previousLayer);
            }
            else if (this.nextLayer != null) {
                env.setCurrentLayer(this.nextLayer);
            }
        };
        return Command_Layer_Delete;
    }(Command_Layer_CommandBase));
    ManualTracingTool.Command_Layer_Delete = Command_Layer_Delete;
    var Command_Layer_MoveUp = /** @class */ (function (_super) {
        __extends(Command_Layer_MoveUp, _super);
        function Command_Layer_MoveUp() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Command_Layer_MoveUp.prototype.isAvailable = function (env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            if (this.previousLayer == null) {
                return false;
            }
            return true;
        };
        Command_Layer_MoveUp.prototype.execute = function (env) {
            if (this.previousLayer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                if (this.previousLayer == this.currentLayerParent) {
                    this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, env);
                    this.executeLayerInsert(this.previousLayerParent, this.previousLayerIndex, this.currentLayer, env);
                }
                else {
                    this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, env);
                    this.executeLayerInsert(this.previousLayer, this.previousLayer.childLayers.length, this.currentLayer, env);
                }
            }
            else if (this.previousLayerParent == this.currentLayerParent) {
                this.executeLayerSwap(this.currentLayerParent, this.currentLayerIndex, this.currentLayerIndex - 1, env);
                env.setCurrentLayer(this.currentLayer);
            }
            else {
                this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, env);
                this.executeLayerInsert(this.previousLayerParent, this.previousLayerIndex, this.currentLayer, env);
            }
        };
        return Command_Layer_MoveUp;
    }(Command_Layer_CommandBase));
    ManualTracingTool.Command_Layer_MoveUp = Command_Layer_MoveUp;
    var Command_Layer_MoveDown = /** @class */ (function (_super) {
        __extends(Command_Layer_MoveDown, _super);
        function Command_Layer_MoveDown() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Command_Layer_MoveDown.prototype.isAvailable = function (env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            if (this.nextLayer == null) {
                return false;
            }
            return true;
        };
        Command_Layer_MoveDown.prototype.execute = function (env) {
            if (this.nextLayer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, env);
                this.executeLayerInsert(this.nextLayer, 0, this.currentLayer, env);
            }
            else if (this.currentLayerParent == this.nextLayerParent) {
                this.executeLayerSwap(this.currentLayerParent, this.currentLayerIndex, this.currentLayerIndex + 1, env);
                env.setCurrentLayer(this.currentLayer);
            }
            else {
                this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, env);
                this.executeLayerInsert(this.nextLayerParent, this.nextLayerIndex, this.currentLayer, env);
            }
        };
        return Command_Layer_MoveDown;
    }(Command_Layer_MoveUp));
    ManualTracingTool.Command_Layer_MoveDown = Command_Layer_MoveDown;
})(ManualTracingTool || (ManualTracingTool = {}));
