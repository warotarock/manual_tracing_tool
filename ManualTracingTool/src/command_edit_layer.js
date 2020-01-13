var ManualTracingTool;
(function (ManualTracingTool) {
    class Command_Layer_CommandBase extends ManualTracingTool.CommandBase {
        constructor() {
            super(...arguments);
            this.currentLayer = null;
            this.currentLayerParent = null;
            this.currentLayerIndex = -1;
            this.previousLayer = null;
            this.previousLayerParent = null;
            this.previousLayerIndex = -1;
            this.nextLayer = null;
            this.nextLayerParent = null;
            this.nextLayerIndex = -1;
            this.removeFrom_ParentLayer = null;
            this.removeFrom_OldChildLayerList = null;
            this.removeFrom_NewChildLayerList = null;
            this.insertTo_ParentLayer = null;
            this.insertTo_Layer_OldChildLayerList = null;
            this.insertTo_Layer_NewChildLayerList = null;
            this.newLayer = null;
        }
        isAvailable(env) {
            return false;
        }
        setPrameters(currentLayer, currentLayerParent, previousLayer, previousLayerParent, nextLayer, nextLayerParent) {
            this.currentLayer = currentLayer;
            this.currentLayerParent = currentLayerParent;
            this.currentLayerIndex = this.findChildLayerIndex(currentLayerParent, currentLayer);
            this.previousLayer = previousLayer;
            this.previousLayerParent = previousLayerParent;
            this.previousLayerIndex = this.findChildLayerIndex(previousLayerParent, previousLayer);
            this.nextLayer = nextLayer;
            this.nextLayerParent = nextLayerParent;
            this.nextLayerIndex = this.findChildLayerIndex(nextLayerParent, nextLayer);
        }
        findChildLayerIndex(parentLayer, childLayer) {
            if (parentLayer == null || childLayer == null) {
                return -1;
            }
            for (let i = 0; i < parentLayer.childLayers.length; i++) {
                if (parentLayer.childLayers[i] == childLayer) {
                    return i;
                }
            }
            return -1;
        }
        isContainerLayer(layer) {
            return (layer.type == ManualTracingTool.LayerTypeID.rootLayer
                || layer.type == ManualTracingTool.LayerTypeID.groupLayer);
        }
        executeLayerSwap(parentLayer, swapIndex1, swapIndex2, env) {
            this.insertTo_ParentLayer = parentLayer;
            this.insertTo_Layer_OldChildLayerList = parentLayer.childLayers;
            this.insertTo_Layer_NewChildLayerList = ListClone(parentLayer.childLayers);
            let swapItem = this.insertTo_Layer_NewChildLayerList[swapIndex1];
            this.insertTo_Layer_NewChildLayerList[swapIndex1] = this.insertTo_Layer_NewChildLayerList[swapIndex2];
            this.insertTo_Layer_NewChildLayerList[swapIndex2] = swapItem;
            parentLayer.childLayers = this.insertTo_Layer_NewChildLayerList;
            env.updateLayerStructure();
        }
        executeLayerInsertToCurrent(layer, env) {
            let parentLayer;
            let insertIndex;
            if (this.currentLayer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                parentLayer = this.currentLayer;
                insertIndex = 0;
            }
            else {
                parentLayer = this.currentLayerParent;
                insertIndex = this.currentLayerIndex;
            }
            this.executeLayerInsert(parentLayer, insertIndex, layer, env);
        }
        executeLayerInsert(parentLayer, insertIndex, layer, env) {
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
        }
        executeLayerRemove(parentLayer, removeIndex, env) {
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
        }
        undo(env) {
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
        }
        redo(env) {
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
        }
    }
    ManualTracingTool.Command_Layer_CommandBase = Command_Layer_CommandBase;
    class Command_Layer_AddVectorLayerToCurrentPosition extends Command_Layer_CommandBase {
        constructor() {
            super(...arguments);
            this.createForFillColor = false;
            this.newLayer = null;
        }
        isAvailable(env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            return true;
        }
        execute(env) {
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
            let keyFrame = new ManualTracingTool.VectorLayerKeyframe();
            keyFrame.geometry = new ManualTracingTool.VectorLayerGeometry();
            this.newLayer.keyframes.push(keyFrame);
            let group = new ManualTracingTool.VectorGroup();
            keyFrame.geometry.groups.push(group);
            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }
    ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition = Command_Layer_AddVectorLayerToCurrentPosition;
    class Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {
        constructor() {
            super(...arguments);
            this.newLayer = null;
        }
        isAvailable(env) {
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
        }
        execute(env) {
            this.newLayer = new ManualTracingTool.VectorLayerReferenceLayer();
            this.newLayer.name = 'new ref layer';
            this.newLayer.referenceLayer = (this.currentLayer);
            this.newLayer.keyframes = this.newLayer.referenceLayer.keyframes;
            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }
    ManualTracingTool.Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition = Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition;
    class Command_Layer_AddGroupLayerToCurrentPosition extends Command_Layer_CommandBase {
        constructor() {
            super(...arguments);
            this.newLayer = null;
        }
        isAvailable(env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            return true;
        }
        execute(env) {
            this.newLayer = new ManualTracingTool.GroupLayer();
            this.newLayer.name = 'new group';
            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }
    ManualTracingTool.Command_Layer_AddGroupLayerToCurrentPosition = Command_Layer_AddGroupLayerToCurrentPosition;
    class Command_Layer_AddImageFileReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {
        constructor() {
            super(...arguments);
            this.newLayer = null;
        }
        isAvailable(env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            return true;
        }
        execute(env) {
            this.newLayer = new ManualTracingTool.ImageFileReferenceLayer();
            this.newLayer.name = 'new file';
            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }
    ManualTracingTool.Command_Layer_AddImageFileReferenceLayerToCurrentPosition = Command_Layer_AddImageFileReferenceLayerToCurrentPosition;
    class Command_Layer_AddPosingLayerToCurrentPosition extends Command_Layer_CommandBase {
        constructor() {
            super(...arguments);
            this.newLayer = null;
        }
        isAvailable(env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (!this.isContainerLayer(this.currentLayerParent)) {
                return false;
            }
            return true;
        }
        execute(env) {
            this.newLayer = new ManualTracingTool.PosingLayer();
            this.newLayer.name = 'new posing';
            this.newLayer.posingModel = env.getPosingModelByName('dummy_skin');
            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }
    ManualTracingTool.Command_Layer_AddPosingLayerToCurrentPosition = Command_Layer_AddPosingLayerToCurrentPosition;
    class Command_Layer_Delete extends Command_Layer_CommandBase {
        isAvailable(env) {
            if (this.currentLayerParent == null) {
                return false;
            }
            if (this.currentLayerParent.type == ManualTracingTool.LayerTypeID.rootLayer && this.currentLayerParent.childLayers.length == 1) {
                return false;
            }
            return true;
        }
        execute(env) {
            this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, env);
            if (this.previousLayer != null) {
                env.setCurrentLayer(this.previousLayer);
            }
            else if (this.nextLayer != null) {
                env.setCurrentLayer(this.nextLayer);
            }
        }
    }
    ManualTracingTool.Command_Layer_Delete = Command_Layer_Delete;
    class Command_Layer_MoveUp extends Command_Layer_CommandBase {
        isAvailable(env) {
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
        }
        execute(env) {
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
        }
    }
    ManualTracingTool.Command_Layer_MoveUp = Command_Layer_MoveUp;
    class Command_Layer_MoveDown extends Command_Layer_MoveUp {
        isAvailable(env) {
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
        }
        execute(env) {
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
        }
    }
    ManualTracingTool.Command_Layer_MoveDown = Command_Layer_MoveDown;
})(ManualTracingTool || (ManualTracingTool = {}));
