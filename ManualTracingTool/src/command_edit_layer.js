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
    var Command_Layer_CommandBase = (function (_super) {
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
        Command_Layer_CommandBase.prototype.errorCheck = function (layer) {
            if (this.currentLayerIndex == -1) {
                throw ('Command_Layer_AddVectorLayerToPrevious: invalid current layer!');
            }
            return false;
        };
        Command_Layer_CommandBase.prototype.executeLayerSwap = function (parentLayer, swapIndex1, swapIndex2) {
            this.insertTo_ParentLayer = parentLayer;
            this.insertTo_Layer_OldChildLayerList = parentLayer.childLayers;
            this.insertTo_Layer_NewChildLayerList = ListClone(parentLayer.childLayers);
            var swapItem = this.insertTo_Layer_NewChildLayerList[swapIndex1];
            this.insertTo_Layer_NewChildLayerList[swapIndex1] = this.insertTo_Layer_NewChildLayerList[swapIndex2];
            this.insertTo_Layer_NewChildLayerList[swapIndex2] = swapItem;
            parentLayer.childLayers = this.insertTo_Layer_NewChildLayerList;
        };
        Command_Layer_CommandBase.prototype.executeLayerInsert = function (parentLayer, insertIndex, childLayer) {
            this.insertTo_ParentLayer = parentLayer;
            this.insertTo_Layer_OldChildLayerList = parentLayer.childLayers;
            this.insertTo_Layer_NewChildLayerList = ListClone(parentLayer.childLayers);
            ListInsertAt(this.insertTo_Layer_NewChildLayerList, insertIndex, childLayer);
            parentLayer.childLayers = this.insertTo_Layer_NewChildLayerList;
        };
        Command_Layer_CommandBase.prototype.executeLayerRemove = function (parentLayer, removeIndex) {
            this.removeFrom_ParentLayer = parentLayer;
            this.removeFrom_OldChildLayerList = parentLayer.childLayers;
            this.removeFrom_NewChildLayerList = ListClone(parentLayer.childLayers);
            ListRemoveAt(this.removeFrom_NewChildLayerList, removeIndex);
            parentLayer.childLayers = this.removeFrom_NewChildLayerList;
        };
        Command_Layer_CommandBase.prototype.undo = function (env) {
            if (this.insertTo_ParentLayer != null) {
                this.insertTo_ParentLayer.childLayers = this.insertTo_Layer_OldChildLayerList;
            }
            if (this.removeFrom_ParentLayer != null) {
                this.removeFrom_ParentLayer.childLayers = this.removeFrom_OldChildLayerList;
            }
            env.setRedrawMainWindowEditorWindow();
            env.setUpadateLayerWindowItems();
        };
        Command_Layer_CommandBase.prototype.redo = function (env) {
            if (this.insertTo_ParentLayer != null) {
                this.insertTo_ParentLayer.childLayers = this.insertTo_Layer_NewChildLayerList;
            }
            if (this.removeFrom_ParentLayer != null) {
                this.removeFrom_ParentLayer.childLayers = this.removeFrom_NewChildLayerList;
            }
            env.setRedrawMainWindowEditorWindow();
            env.setUpadateLayerWindowItems();
        };
        Command_Layer_CommandBase.prototype.execute = function (env) {
            this.executeCommand(env);
            env.setRedrawMainWindowEditorWindow();
            env.setUpadateLayerWindowItems();
        };
        Command_Layer_CommandBase.prototype.executeCommand = function (env) {
        };
        return Command_Layer_CommandBase;
    }(ManualTracingTool.CommandBase));
    ManualTracingTool.Command_Layer_CommandBase = Command_Layer_CommandBase;
    var Command_Layer_AddVectorLayerToCurrentPosition = (function (_super) {
        __extends(Command_Layer_AddVectorLayerToCurrentPosition, _super);
        function Command_Layer_AddVectorLayerToCurrentPosition() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
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
        Command_Layer_AddVectorLayerToCurrentPosition.prototype.executeCommand = function (env) {
            this.newLayer = new ManualTracingTool.VectorLayer();
            this.newLayer.name = 'new layer';
            if (this.currentLayer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                this.executeLayerInsert(this.currentLayer, 0, this.newLayer);
            }
            else {
                this.executeLayerInsert(this.currentLayerParent, this.currentLayerIndex, this.newLayer);
            }
            env.setCurrentLayer(this.newLayer);
        };
        return Command_Layer_AddVectorLayerToCurrentPosition;
    }(Command_Layer_CommandBase));
    ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition = Command_Layer_AddVectorLayerToCurrentPosition;
    var Command_Layer_Delete = (function (_super) {
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
        Command_Layer_Delete.prototype.executeCommand = function (env) {
            this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex);
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
    var Command_Layer_MoveUp = (function (_super) {
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
        Command_Layer_MoveUp.prototype.executeCommand = function (env) {
            if (this.currentLayerParent == this.previousLayerParent) {
                this.executeLayerSwap(this.currentLayerParent, this.currentLayerIndex, this.currentLayerIndex - 1);
            }
            else {
                this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex);
                this.executeLayerInsert(this.previousLayerParent, this.previousLayerIndex, this.currentLayer);
            }
            env.setCurrentLayer(this.currentLayer);
        };
        return Command_Layer_MoveUp;
    }(Command_Layer_CommandBase));
    ManualTracingTool.Command_Layer_MoveUp = Command_Layer_MoveUp;
    var Command_Layer_MoveDown = (function (_super) {
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
        Command_Layer_MoveDown.prototype.executeCommand = function (env) {
            if (this.currentLayerParent == this.nextLayerParent) {
                this.executeLayerSwap(this.currentLayerParent, this.currentLayerIndex, this.currentLayerIndex + 1);
            }
            else {
                this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex);
                this.executeLayerInsert(this.nextLayerParent, this.nextLayerIndex, this.currentLayer);
            }
            env.setCurrentLayer(this.currentLayer);
        };
        return Command_Layer_MoveDown;
    }(Command_Layer_MoveUp));
    ManualTracingTool.Command_Layer_MoveDown = Command_Layer_MoveDown;
})(ManualTracingTool || (ManualTracingTool = {}));