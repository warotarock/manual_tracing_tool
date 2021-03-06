﻿import { List, int, ListClone, ListInsertAt, ListRemoveAt } from "../base/conversion";
import { CommandBase } from "../base/command";
import { ToolEnvironment } from "../base/tool";
import {
  Layer, LayerTypeID, DrawLineTypeID, FillAreaTypeID,
  VectorLayer, VectorKeyframe, VectorGeometry, VectorStrokeGroup,
  VectorLayerReferenceLayer,
  GroupLayer,
  ImageFileReferenceLayer,
  PosingLayer,
  AutoFillLayer,
  VectorDrawingUnit,
  DocumentData,
  EyesSymmetryInputSideID
} from "../base/data";

export class Command_Layer_CommandBase extends CommandBase {

  rootLayer: Layer = null;

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

  setPrameters(documentData: DocumentData, currentLayer: Layer, currentLayerParent: Layer, previousLayer: Layer, previousLayerParent: Layer, nextLayer: Layer, nextLayerParent: Layer) {

    this.rootLayer = documentData.rootLayer;

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

    return (Layer.isRootLayer(layer) || GroupLayer.isGroupLayer(layer));
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
    if (GroupLayer.isGroupLayer(this.currentLayer)) {

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

  undo(env: ToolEnvironment) { // @override

    if (this.insertTo_ParentLayer != null) {

      this.insertTo_ParentLayer.childLayers = this.insertTo_Layer_OldChildLayerList;
    }

    if (this.removeFrom_ParentLayer != null) {

      this.removeFrom_ParentLayer.childLayers = this.removeFrom_OldChildLayerList;
    }

    this.undoReplacedReferences();

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

    this.redoReplacedReferences();

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

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false;
    }

    return true;
  }

  execute(env: ToolEnvironment) { // @override

    this.newLayer = new VectorLayer();

    if (!this.createForFillColor) {

      this.newLayer.name = 'new line layer';
      this.newLayer.drawLineType = DrawLineTypeID.paletteColor;
      this.newLayer.fillAreaType = FillAreaTypeID.none;
    }
    else {

      this.newLayer.name = 'new fill layer';
      this.newLayer.drawLineType = DrawLineTypeID.none;
      this.newLayer.fillAreaType = FillAreaTypeID.paletteColor;
    }

    let keyFrame = new VectorKeyframe();
    keyFrame.geometry = new VectorGeometry();
    this.newLayer.keyframes.push(keyFrame);

    const unit = new VectorDrawingUnit();
    unit.groups.push(new VectorStrokeGroup());

    keyFrame.geometry.units.push(unit);

    this.executeLayerInsertToCurrent(this.newLayer, env);
  }
}

export class Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: VectorLayerReferenceLayer = null;

  isAvailable(env: ToolEnvironment): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false;
    }

    if (!VectorLayer.isVectorLayerWithOwnData(this.currentLayer)) {

      return false;
    }

    return true;
  }

  execute(env: ToolEnvironment) { // @override

    this.newLayer = new VectorLayerReferenceLayer();
    this.newLayer.name = 'new ref layer';

    this.newLayer.referenceLayer = <VectorLayer>(this.currentLayer);
    this.newLayer.keyframes = this.newLayer.referenceLayer.keyframes;

    this.executeLayerInsertToCurrent(this.newLayer, env);
  }
}

export class Command_Layer_AddAutoFillLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: VectorLayer = null;

  isAvailable(env: ToolEnvironment): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false;
    }

    return true;
  }

  execute(env: ToolEnvironment) { // @override

    this.newLayer = new AutoFillLayer();

    this.newLayer.name = 'new auto fill layer';
    this.newLayer.drawLineType = DrawLineTypeID.paletteColor;
    this.newLayer.fillAreaType = FillAreaTypeID.none;

    let keyFrame = new VectorKeyframe();
    keyFrame.geometry = new VectorGeometry();
    this.newLayer.keyframes.push(keyFrame);

    const unit = new VectorDrawingUnit();
    unit.groups.push(new VectorStrokeGroup());

    keyFrame.geometry.units.push(unit);

    this.executeLayerInsertToCurrent(this.newLayer, env);
  }
}

export class Command_Layer_AddGroupLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: GroupLayer = null;

  isAvailable(env: ToolEnvironment): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false;
    }

    return true;
  }

  execute(env: ToolEnvironment) { // @override

    this.newLayer = new GroupLayer();
    this.newLayer.name = 'new group';

    this.executeLayerInsertToCurrent(this.newLayer, env);
  }
}

export class Command_Layer_AddImageFileReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: ImageFileReferenceLayer = null;

  isAvailable(env: ToolEnvironment): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false;
    }

    return true;
  }

  execute(env: ToolEnvironment) { // @override

    this.newLayer = new ImageFileReferenceLayer();
    this.newLayer.name = 'new file';

    this.executeLayerInsertToCurrent(this.newLayer, env);
  }
}

export class Command_Layer_AddPosingLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: PosingLayer = null;

  isAvailable(env: ToolEnvironment): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false;
    }

    return true;
  }

  execute(env: ToolEnvironment) { // @override

    this.newLayer = new PosingLayer();
    this.newLayer.name = 'new posing';

    this.newLayer.posingModel = env.getPosingModelByName('dummy_skin');

    this.executeLayerInsertToCurrent(this.newLayer, env);
  }
}

export class Command_Layer_Delete extends Command_Layer_CommandBase {

  isAvailable(env: ToolEnvironment): boolean { // @override

    if (Layer.isRootLayer(this.currentLayerParent) && this.currentLayerParent.childLayers.length == 1) {

      return false;
    }

    return true;
  }

  execute(env: ToolEnvironment) { // @override

    this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, env);

    this.replaceReferenceRecursive(this.rootLayer, this.currentLayer, null);

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

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false;
    }

    if (this.previousLayer == null) {

      return false;
    }

    return true;
  }

  execute(env: ToolEnvironment) { // @override

    if (GroupLayer.isGroupLayer(this.previousLayer)) {

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

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false;
    }

    if (this.nextLayer == null) {

      return false;
    }

    return true;
  }

  execute(env: ToolEnvironment) { // @override

    if (GroupLayer.isGroupLayer(this.nextLayer)) {

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

export class Command_VectorLayer_SetProperty extends CommandBase {

  layer: VectorLayer;
  new_enableEyesSymmetry: boolean;
  new_posingLayer: PosingLayer;
  new_eyesSymmetryInputSide: EyesSymmetryInputSideID;

  old_enableEyesSymmetry: boolean;
  old_posingLayer: PosingLayer;
  old_eyesSymmetryInputSide: EyesSymmetryInputSideID;

  isAvailable(env: ToolEnvironment): boolean {

    if (this.layer) {

      return true;
    }

    return false;
  }

  execute(env: ToolEnvironment) { // @virtual

    this.old_enableEyesSymmetry = env.currentVectorLayer.eyesSymmetryEnabled;
    this.old_eyesSymmetryInputSide = env.currentVectorLayer.eyesSymmetryInputSide;
    this.old_posingLayer = env.currentVectorLayer.posingLayer;

    this.redo(env);
  }

  undo(env: ToolEnvironment) { // @virtual

    this.layer.eyesSymmetryEnabled = this.old_enableEyesSymmetry;
    this.layer.eyesSymmetryInputSide = this.old_eyesSymmetryInputSide;
    this.layer.posingLayer = this.old_posingLayer;

    // console.log('undo', this.layer.enableEyesSymmetry, this.layer.posingLayer ? this.layer.posingLayer.name : null);

    env.setRedrawLayerWindow();
  }

  redo(env: ToolEnvironment) { // @virtual

    // console.log('execute', this.new_enableEyesSymmetry, this.new_posingLayer ? this.new_posingLayer.name : null);

    if (this.new_enableEyesSymmetry !== undefined) {

      this.layer.eyesSymmetryEnabled = this.new_enableEyesSymmetry;

      env.setRedrawLayerWindow();
      env.setRedrawMainWindowEditorWindow();
    }

    if (this.new_eyesSymmetryInputSide !== undefined) {

      this.layer.eyesSymmetryInputSide = this.new_eyesSymmetryInputSide;

      env.setRedrawLayerWindow();
      env.setRedrawMainWindowEditorWindow();
    }

    if (this.new_posingLayer !== undefined) {

      this.layer.posingLayer = this.new_posingLayer;

      env.setRedrawLayerWindow();
      env.setRedrawMainWindowEditorWindow();
    }
  }
}
