
namespace ManualTracingTool {

    export class Command_Layer_CommandBase extends CommandBase {

        currentLayer: Layer = null;
        currentLayerParent: Layer = null;
        currentLayerIndex = -1;

        previousLayer: Layer = null;
        previousLayerParent: Layer = null;
        previousLayerIndex = -1;

        nextLayer: Layer = null;
        nextLayerParent: Layer = null;
        nextLayerIndex = -1;

        removeFrom_ParentLayer: Layer = null;
        removeFrom_OldChildLayerList: List<Layer> = null;
        removeFrom_NewChildLayerList: List<Layer> = null;

        insertTo_ParentLayer: Layer = null;
        insertTo_Layer_OldChildLayerList: List<Layer> = null;
        insertTo_Layer_NewChildLayerList: List<Layer> = null;

        newLayer: Layer = null;

        isAvailable(env: ToolEnvironment): boolean { // @virtual

            return false;
        }

        setPrameters(currentLayer: Layer, currentLayerParent: Layer, previousLayer: Layer, previousLayerParent: Layer, nextLayer: Layer, nextLayerParent: Layer) {

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

        private findChildLayerIndex(parentLayer: Layer, childLayer: Layer): int {

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

        protected isContainerLayer(layer: Layer): boolean {

            return (layer.type == LayerTypeID.rootLayer
                || layer.type == LayerTypeID.groupLayer);
        }

        protected executeLayerSwap(parentLayer: Layer, swapIndex1: int, swapIndex2: int, env: ToolEnvironment) {

            this.insertTo_ParentLayer = parentLayer;

            this.insertTo_Layer_OldChildLayerList = parentLayer.childLayers;

            this.insertTo_Layer_NewChildLayerList = ListClone(parentLayer.childLayers);

            let swapItem = this.insertTo_Layer_NewChildLayerList[swapIndex1];
            this.insertTo_Layer_NewChildLayerList[swapIndex1] = this.insertTo_Layer_NewChildLayerList[swapIndex2];
            this.insertTo_Layer_NewChildLayerList[swapIndex2] = swapItem;

            parentLayer.childLayers = this.insertTo_Layer_NewChildLayerList;

            env.updateLayerStructure();
        }

        protected executeLayerInsertToCurrent(layer: Layer, env: ToolEnvironment) {

            let parentLayer: Layer;
            let insertIndex: int;
            if (this.currentLayer.type == LayerTypeID.groupLayer) {

                parentLayer = this.currentLayer;
                insertIndex = 0;
            }
            else {

                parentLayer = this.currentLayerParent;
                insertIndex = this.currentLayerIndex;
            }

            this.executeLayerInsert(parentLayer, insertIndex, layer, env);
        }

        protected executeLayerInsert(parentLayer: Layer, insertIndex: int, layer: Layer, env: ToolEnvironment) {

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

        protected executeLayerRemove(parentLayer: Layer, removeIndex: int, env: ToolEnvironment) {

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

        protected execute(env: ToolEnvironment) { // @override

            this.executeCommand(env);

            env.setRedrawMainWindowEditorWindow();
        }

        undo(env: ToolEnvironment) { // @override

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

        redo(env: ToolEnvironment) { // @override

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

    export class Command_Layer_AddVectorLayerToCurrentPosition extends Command_Layer_CommandBase {

        createForFillColor = false;

        newLayer: VectorLayer = null;

        isAvailable(env: ToolEnvironment): boolean { // @override

            if (this.currentLayerParent == null) {

                return false;
            }

            if (!this.isContainerLayer(this.currentLayerParent)) {

                return false;
            }

            return true;
        }

        executeCommand(env: ToolEnvironment) { // @override

            this.newLayer = new VectorLayer();

            if (!this.createForFillColor) {

                this.newLayer.name = 'new line layer';
            }
            else {

                this.newLayer.name = 'new fill layer';
                this.newLayer.drawLineType = DrawLineTypeID.none;
                this.newLayer.fillAreaType = FillAreaTypeID.paletteColor;
            }

            let keyFrame = new VectorLayerKeyframe();
            keyFrame.geometry = new VectorLayerGeometry();
            this.newLayer.keyframes.push(keyFrame);

            let group = new VectorGroup();
            keyFrame.geometry.groups.push(group);

            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }

    export class Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {

        newLayer: VectorLayerReferenceLayer = null;

        isAvailable(env: ToolEnvironment): boolean { // @override

            if (this.currentLayerParent == null) {

                return false;
            }

            if (!this.isContainerLayer(this.currentLayerParent)) {

                return false;
            }

            if (this.currentLayer == null || this.currentLayer.type != LayerTypeID.vectorLayer) {

                return false;
            }

            return true;
        }

        executeCommand(env: ToolEnvironment) { // @override

            this.newLayer = new VectorLayerReferenceLayer();
            this.newLayer.name = 'new ref layer';

            this.newLayer.referenceLayer = <VectorLayer>(this.currentLayer);
            this.newLayer.keyframes = this.newLayer.referenceLayer.keyframes;

            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }

    export class Command_Layer_AddGroupLayerToCurrentPosition extends Command_Layer_CommandBase {

        newLayer: GroupLayer = null;

        isAvailable(env: ToolEnvironment): boolean { // @override

            if (this.currentLayerParent == null) {

                return false;
            }

            if (!this.isContainerLayer(this.currentLayerParent)) {

                return false;
            }

            return true;
        }

        executeCommand(env: ToolEnvironment) { // @override

            this.newLayer = new GroupLayer();
            this.newLayer.name = 'new group';

            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }

    export class Command_Layer_AddImageFileReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {

        newLayer: ImageFileReferenceLayer = null;

        isAvailable(env: ToolEnvironment): boolean { // @override

            if (this.currentLayerParent == null) {

                return false;
            }

            if (!this.isContainerLayer(this.currentLayerParent)) {

                return false;
            }

            return true;
        }

        executeCommand(env: ToolEnvironment) { // @override

            this.newLayer = new ImageFileReferenceLayer();
            this.newLayer.name = 'new file';

            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }

    export class Command_Layer_AddPosingLayerToCurrentPosition extends Command_Layer_CommandBase {

        newLayer: PosingLayer = null;

        isAvailable(env: ToolEnvironment): boolean { // @override

            if (this.currentLayerParent == null) {

                return false;
            }

            if (!this.isContainerLayer(this.currentLayerParent)) {

                return false;
            }

            return true;
        }

        executeCommand(env: ToolEnvironment) { // @override

            this.newLayer = new PosingLayer();
            this.newLayer.name = 'new posing';

            this.newLayer.posingModel = env.getPosingModelByName('dummy_skin');

            this.executeLayerInsertToCurrent(this.newLayer, env);
        }
    }

    export class Command_Layer_Delete extends Command_Layer_CommandBase {

        isAvailable(env: ToolEnvironment): boolean { // @override

            if (this.currentLayerParent == null) {

                return false;
            }

            if (this.currentLayerParent.type == LayerTypeID.rootLayer && this.currentLayerParent.childLayers.length == 1) {

                return false;
            }

            return true;
        }

        executeCommand(env: ToolEnvironment) { // @override

            this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, env);

            if (this.previousLayer != null) {

                env.setCurrentLayer(this.previousLayer);
            }
            else if (this.nextLayer != null) {

                env.setCurrentLayer(this.nextLayer);
            }
        }
    }

    export class Command_Layer_MoveUp extends Command_Layer_CommandBase {

        isAvailable(env: ToolEnvironment): boolean { // @override

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

        executeCommand(env: ToolEnvironment) { // @override

            if (this.previousLayer.type == LayerTypeID.groupLayer) {

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

    export class Command_Layer_MoveDown extends Command_Layer_MoveUp {

        isAvailable(env: ToolEnvironment): boolean { // @override

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

        executeCommand(env: ToolEnvironment) { // @override

            if (this.nextLayer.type == LayerTypeID.groupLayer) {

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
}
