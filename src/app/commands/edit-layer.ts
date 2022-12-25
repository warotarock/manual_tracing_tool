import { CommandBase } from "../command"
import { int, Lists } from "../common-logics"
import { SubToolContext } from "../context"
import { AutoFillLayer, DocumentData, DrawLineTypeID, EyesSymmetryInputSideID, FillAreaTypeID,
  GroupLayer, ImageFileReferenceLayer, Layer, LayerTypeID, PointBrushFillLayer,
  PosingLayer, SurroundingFillLayer, VectorLayerGeometryTypeID, VectorLayer,
  VectorLayerGeometry,
  VectorLayerKeyframe, VectorLayerReferenceLayer, VectorStrokeDrawingUnit, VectorStrokeGroup
} from "../document-data"

export class Command_Layer_CommandBase extends CommandBase {

  rootLayer: Layer = null

  currentLayer: Layer = null
  currentLayerParent: Layer = null
  currentLayerIndex = -1

  previousLayer: Layer = null
  previousLayerParent: Layer = null
  previousLayerIndex = -1

  nextLayer: Layer = null
  nextLayerParent: Layer = null
  nextLayerIndex = -1

  removeFrom_ParentLayer: Layer = null
  removeFrom_OldChildLayerList: Layer[] = null
  removeFrom_NewChildLayerList: Layer[] = null

  insertTo_ParentLayer: Layer = null
  insertTo_Layer_OldChildLayerList: Layer[] = null
  insertTo_Layer_NewChildLayerList: Layer[] = null

  reselect_layer: Layer = null

  isAvailable(_ctx: SubToolContext): boolean { // @virtual

    return false
  }

  setPrameters(documentData: DocumentData, currentLayer: Layer, currentLayerParent: Layer, previousLayer: Layer, previousLayerParent: Layer, nextLayer: Layer, nextLayerParent: Layer) {

    this.rootLayer = documentData.rootLayer

    this.currentLayer = currentLayer
    this.currentLayerParent = currentLayerParent
    this.currentLayerIndex = this.findChildLayerIndex(currentLayer)

    this.previousLayer = previousLayer
    this.previousLayerParent = previousLayerParent
    this.previousLayerIndex = this.findChildLayerIndex(previousLayer)

    this.nextLayer = nextLayer
    this.nextLayerParent = nextLayerParent
    this.nextLayerIndex = this.findChildLayerIndex(nextLayer)

    if (this.currentLayerIndex < 0 || this.currentLayerIndex >= currentLayerParent.childLayers.length) {
      throw new Error('ERROR 0000: Current layer index is invalid when setting command parameters')
    }
  }

  protected findChildLayerIndex(childLayer: Layer): int {

    if (childLayer == null || childLayer.runtime.parentLayer == null) {

      return -1
    }

    for (let i = 0; i < childLayer.runtime.parentLayer.childLayers.length; i++) {

      if (childLayer.runtime.parentLayer.childLayers[i] == childLayer) {

        return i
      }
    }

    return -1
  }

  protected isFirstChildLayer(parentLayer: Layer, childLayer: Layer): boolean {

    return (parentLayer.childLayers.length > 0 && parentLayer.childLayers[0] == childLayer)
  }

  protected isLastChildLayer(parentLayer: Layer, childLayer: Layer): boolean {

    return (parentLayer.childLayers.length > 0 && parentLayer.childLayers[parentLayer.childLayers.length - 1] == childLayer)
  }

  protected isContainerLayer(layer: Layer): boolean {

    return (Layer.isRootLayer(layer) || GroupLayer.isGroupLayer(layer))
  }

  protected executeLayerSwap(parentLayer: Layer, swapIndex1: int, swapIndex2: int, ctx: SubToolContext) {

    if (swapIndex1 < 0 || swapIndex1 >= parentLayer.childLayers.length) {
      throw new Error('ERROR 0000: Index 1 is out of range when swapping layers')
    }

    if (swapIndex2 < 0 || swapIndex2 >= parentLayer.childLayers.length) {
      throw new Error('ERROR 0000: Index 2 is out of range when swapping layers')
    }

    this.insertTo_ParentLayer = parentLayer

    this.insertTo_Layer_OldChildLayerList = parentLayer.childLayers

    this.insertTo_Layer_NewChildLayerList = Lists.clone(parentLayer.childLayers)

    const swapItem = this.insertTo_Layer_NewChildLayerList[swapIndex1]
    this.insertTo_Layer_NewChildLayerList[swapIndex1] = this.insertTo_Layer_NewChildLayerList[swapIndex2]
    this.insertTo_Layer_NewChildLayerList[swapIndex2] = swapItem

    parentLayer.childLayers = this.insertTo_Layer_NewChildLayerList

    this.reselect_layer = swapItem
  }

  protected executeLayerInsertToCurrent(layer: Layer, ctx: SubToolContext) {

    let parentLayer: Layer
    let insertIndex: int
    if (GroupLayer.isGroupLayer(this.currentLayer)) {

      parentLayer = this.currentLayer
      insertIndex = 0
    }
    else {

      parentLayer = this.currentLayerParent
      insertIndex = this.currentLayerIndex
    }

    this.executeLayerInsert(parentLayer, insertIndex, layer, ctx)
  }

  protected executeLayerInsert(parentLayer: Layer, insertIndex: int, layer: Layer, ctx: SubToolContext) {

    this.insertLayer(parentLayer, insertIndex, layer)

    this.reselect_layer = layer
  }

  protected insertLayer(parentLayer: Layer, insertIndex: int, layer: Layer) {

    this.insertTo_ParentLayer = parentLayer

    this.insertTo_Layer_OldChildLayerList = parentLayer.childLayers

    this.insertTo_Layer_NewChildLayerList = Lists.clone(parentLayer.childLayers)

    if (insertIndex < this.insertTo_Layer_NewChildLayerList.length) {

      Lists.insertAt(this.insertTo_Layer_NewChildLayerList, insertIndex, layer)
    }
    else {

      this.insertTo_Layer_NewChildLayerList.push(layer)
    }

    parentLayer.childLayers = this.insertTo_Layer_NewChildLayerList

    layer.runtime.parentLayer = parentLayer
  }

  protected executeLayerRemove(parentLayer: Layer, removeIndex: int, ctx: SubToolContext) {

    this.removeFrom_ParentLayer = parentLayer

    this.removeFrom_OldChildLayerList = parentLayer.childLayers

    this.removeFrom_NewChildLayerList = Lists.clone(parentLayer.childLayers)

    Lists.removeAt(this.removeFrom_NewChildLayerList, removeIndex)

    parentLayer.childLayers = this.removeFrom_NewChildLayerList

    if (this.previousLayer != null) {

      this.reselect_layer = this.previousLayer
    }
    else if (this.nextLayer != null) {

      this.reselect_layer = this.nextLayer
    }
  }

  protected executeCurrentLayerRemove(ctx: SubToolContext) {

    this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, ctx)
  }

  undo(ctx: SubToolContext) { // @override

    if (this.insertTo_ParentLayer != null) {

      this.insertTo_ParentLayer.childLayers = this.insertTo_Layer_OldChildLayerList

      ctx.unsetCurrentLayer() // Needs before update layer structure
    }

    if (this.removeFrom_ParentLayer != null) {

      this.removeFrom_ParentLayer.childLayers = this.removeFrom_OldChildLayerList
    }

    this.refferenceUpdate.undoReplacedReferences()

    ctx.updateLayerStructure() // Needs update before change selection of layer

    ctx.tool.selectLayer(this.currentLayer)

    ctx.setRedrawMainWindowEditorWindow()
  }

  redo(ctx: SubToolContext) { // @override

    if (this.insertTo_ParentLayer != null) {

      this.insertTo_ParentLayer.childLayers = this.insertTo_Layer_NewChildLayerList
    }

    if (this.removeFrom_ParentLayer != null) {

      this.removeFrom_ParentLayer.childLayers = this.removeFrom_NewChildLayerList

      ctx.unsetCurrentLayer() // Needs before update layer structure
    }

    this.refferenceUpdate.redoReplacedReferences()

    ctx.updateLayerStructure() // Needs update before change selection of layer

    ctx.tool.selectLayer(this.reselect_layer)

    ctx.setRedrawMainWindowEditorWindow()
  }
}

export class Command_Layer_CreateDefaultDocumentLayers extends Command_Layer_CommandBase {

  executeWithoutRedraw(documentData: DocumentData, ctx: SubToolContext) {

    const rootLayer = documentData.rootLayer
    rootLayer.type = LayerTypeID.rootLayer

    {
      const layer1 = new VectorLayer()
      layer1.name = ctx.document.getNewLayerName(LayerTypeID.vectorLayer, true)
      layer1.runtime.parentLayer = rootLayer

      const unit = new VectorStrokeDrawingUnit()
      unit.groups.push(new VectorStrokeGroup())

      const keyfarame = new VectorLayerKeyframe(VectorLayerGeometry.getGeometryTypeForLayer(layer1))
      keyfarame.geometry.units.push(unit)

      layer1.keyframes.push(keyfarame)

      this.insertLayer(rootLayer, 0, layer1)
    }
  }
}

export class Command_Layer_AddVectorLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer_layerType = LayerTypeID.none

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    switch (this.newLayer_layerType) {

      case LayerTypeID.vectorLayer:
        {
          const newLayer = new VectorLayer()
          newLayer.name = ctx.document.getNewLayerName(newLayer.type)
          newLayer.drawLineType = DrawLineTypeID.paletteColor
          newLayer.fillAreaType = FillAreaTypeID.none
          newLayer.keyframes.push(VectorLayerKeyframe.createWithDefaultGeometry(VectorLayerGeometryTypeID.strokes))
          this.executeLayerInsertToCurrent(newLayer, ctx)
        }
        break

      case LayerTypeID.surroundingFillLayer:
        {
          const newLayer = new SurroundingFillLayer()
          newLayer.name = ctx.document.getNewLayerName(newLayer.type)
          newLayer.drawLineType = DrawLineTypeID.none
          newLayer.fillAreaType = FillAreaTypeID.paletteColor
          newLayer.keyframes.push(VectorLayerKeyframe.createWithDefaultGeometry(VectorLayerGeometryTypeID.surroundingFill))
          this.executeLayerInsertToCurrent(newLayer, ctx)
        }
        break

      case LayerTypeID.pointBrushFillLayer:
        {
          const newLayer = new PointBrushFillLayer()
          newLayer.name = ctx.document.getNewLayerName(newLayer.type)
          newLayer.drawLineType = DrawLineTypeID.paletteColor
          newLayer.fillAreaType = FillAreaTypeID.none
          newLayer.keyframes.push(VectorLayerKeyframe.createWithDefaultGeometry(VectorLayerGeometryTypeID.pointBrushFill))
          this.executeLayerInsertToCurrent(newLayer, ctx)
        }
        break
    }

    this.redo(ctx)
  }
}

export class Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    if (!VectorLayer.isVectorLayerWithOwnData(this.currentLayer)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    const newLayer = new VectorLayerReferenceLayer()
    newLayer.name = ctx.document.getNewLayerName(newLayer.type)

    newLayer.runtime.referenceLayer = <VectorLayer>(this.currentLayer)
    newLayer.keyframes = newLayer.runtime.referenceLayer.keyframes

    this.executeLayerInsertToCurrent(newLayer, ctx)

    this.redo(ctx)
  }
}

export class Command_Layer_AddAutoFillLayerToCurrentPosition extends Command_Layer_CommandBase {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    const newLayer = new AutoFillLayer()
    newLayer.name = ctx.document.getNewLayerName(newLayer.type)

    this.executeLayerInsertToCurrent(newLayer, ctx)

    this.redo(ctx)
  }
}

export class Command_Layer_AddGroupLayerToCurrentPosition extends Command_Layer_CommandBase {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    const newLayer = new GroupLayer()
    newLayer.name = ctx.document.getNewLayerName(newLayer.type)

    this.executeLayerInsertToCurrent(newLayer, ctx)

    this.redo(ctx)
  }
}

export class Command_Layer_AddImageFileReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    const newLayer = new ImageFileReferenceLayer()
    newLayer.name = ctx.document.getNewLayerName(newLayer.type)

    this.executeLayerInsertToCurrent(newLayer, ctx)

    this.redo(ctx)
  }
}

export class Command_Layer_AddPosingLayerToCurrentPosition extends Command_Layer_CommandBase {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    const newLayer = new PosingLayer()
    newLayer.name = ctx.document.getNewLayerName(newLayer.type)

    newLayer.posingModel = ctx.main.getPosingModelByName('dummy_skin')

    this.executeLayerInsertToCurrent(newLayer, ctx)

    this.redo(ctx)
  }
}

export class Command_Layer_Delete extends Command_Layer_CommandBase {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (Layer.isRootLayer(this.currentLayerParent) && this.currentLayerParent.childLayers.length == 1) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    this.executeCurrentLayerRemove(ctx)

    this.refferenceUpdate.set(this.rootLayer, this.currentLayer, null)

    this.redo(ctx)
  }
}

enum LayerMoveOperationTypeID {
  none,
  moveUpToParent,
  insertToLayer,
  insertToLayerParent,
  swapOrder
}

export class Command_Layer_MoveUp extends Command_Layer_CommandBase {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    return (this.getOperationType() != LayerMoveOperationTypeID.none)
  }

  getOperationType(): LayerMoveOperationTypeID {

    if (this.currentLayerParent.type != LayerTypeID.rootLayer
      && this.isFirstChildLayer(this.currentLayerParent, this.currentLayer)) {

      // 現在のレイヤーが親レイヤー配下の先頭である場合、一つ上のレイヤーに移動
      return LayerMoveOperationTypeID.moveUpToParent
    }

    if (GroupLayer.isGroupLayer(this.previousLayer) && this.previousLayer.isListExpanded) {

      // 上のレイヤーがグループレイヤーの場合、グループの末尾にレイヤーを挿入（リストが閉じている場合は除く）
      return LayerMoveOperationTypeID.insertToLayer
    }

    if (this.previousLayerParent != null && this.previousLayerParent != this.currentLayerParent) {

      // 上のレイヤーが別の親レイヤー配下の場合、その親レイヤーの末尾にレイヤーを挿入
      return LayerMoveOperationTypeID.insertToLayerParent
    }

    if (this.previousLayerParent != null && this.previousLayerParent == this.currentLayerParent) {

      // 上のレイヤーが同じ親レイヤー配下の場合、順番を入れ替える
      return LayerMoveOperationTypeID.swapOrder
    }

    return LayerMoveOperationTypeID.none
  }

  execute(ctx: SubToolContext) { // @override

    const operationType = this.getOperationType()

    switch (operationType) {

      case LayerMoveOperationTypeID.moveUpToParent:
        this.executeCurrentLayerRemove(ctx)
        this.executeLayerInsert(this.currentLayerParent.runtime.parentLayer, this.findChildLayerIndex(this.currentLayerParent), this.currentLayer, ctx)
        break

      case LayerMoveOperationTypeID.insertToLayer:
        this.executeCurrentLayerRemove(ctx)
        this.executeLayerInsert(this.previousLayer, this.previousLayer.childLayers.length, this.currentLayer, ctx)
        break

      case LayerMoveOperationTypeID.insertToLayerParent:
        this.executeCurrentLayerRemove(ctx)
        this.executeLayerInsert(this.previousLayerParent, this.previousLayerParent.childLayers.length, this.currentLayer, ctx)
        break

      case LayerMoveOperationTypeID.swapOrder:
        this.executeLayerSwap(this.currentLayerParent, this.currentLayerIndex, this.currentLayerIndex - 1, ctx)
        break
    }

    this.redo(ctx)
  }
}

export class Command_Layer_MoveDown extends Command_Layer_MoveUp {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    return (this.getOperationType() != LayerMoveOperationTypeID.none)
  }

  getOperationType(): LayerMoveOperationTypeID {

    if (this.currentLayerParent.type != LayerTypeID.rootLayer
      && this.isLastChildLayer(this.currentLayerParent, this.currentLayer)) {

      // 現在のレイヤーが親レイヤー配下の末尾である場合、一つ上のレイヤーに移動
      return LayerMoveOperationTypeID.moveUpToParent
    }

    if (GroupLayer.isGroupLayer(this.nextLayer) && this.nextLayer.isListExpanded) {

      // 下のレイヤーがグループレイヤーの場合、グループの末尾にレイヤーを挿入（リストが閉じている場合は除く）
      return LayerMoveOperationTypeID.insertToLayer
    }

    if (this.nextLayerParent != null && this.nextLayerParent == this.currentLayerParent) {

      // 下のレイヤーが同じ親レイヤー配下の場合、順番を入れ替える
      return LayerMoveOperationTypeID.swapOrder
    }

    return LayerMoveOperationTypeID.none
  }

  execute(ctx: SubToolContext) { // @override

    const operationType = this.getOperationType()

    switch (operationType) {

      case LayerMoveOperationTypeID.moveUpToParent:
        this.executeCurrentLayerRemove(ctx)
        this.executeLayerInsert(this.currentLayerParent.runtime.parentLayer, this.findChildLayerIndex(this.currentLayerParent) + 1, this.currentLayer, ctx)
        break

      case LayerMoveOperationTypeID.insertToLayer:
        this.executeCurrentLayerRemove(ctx)
        this.executeLayerInsert(this.nextLayer, 0, this.currentLayer, ctx)
        break

      case LayerMoveOperationTypeID.swapOrder:
        this.executeLayerSwap(this.currentLayerParent, this.currentLayerIndex, this.currentLayerIndex + 1, ctx)
        break
    }

    this.redo(ctx)
  }
}

export class Command_VectorLayer_SetProperty extends CommandBase {

  layer: VectorLayer
  new_enableEyesSymmetry: boolean
  new_posingLayer: PosingLayer
  new_eyesSymmetryInputSide: EyesSymmetryInputSideID

  old_enableEyesSymmetry: boolean
  old_posingLayer: PosingLayer
  old_eyesSymmetryInputSide: EyesSymmetryInputSideID

  isAvailable(_ctx: SubToolContext): boolean {

    if (this.layer) {

      return true
    }

    return false
  }

  execute(ctx: SubToolContext) { // @virtual

    this.old_enableEyesSymmetry = ctx.currentVectorLayer.eyesSymmetryEnabled
    this.old_eyesSymmetryInputSide = ctx.currentVectorLayer.eyesSymmetryInputSide
    this.old_posingLayer = ctx.currentVectorLayer.runtime.posingLayer

    this.redo(ctx)
  }

  undo(ctx: SubToolContext) { // @virtual

    this.layer.eyesSymmetryEnabled = this.old_enableEyesSymmetry
    this.layer.eyesSymmetryInputSide = this.old_eyesSymmetryInputSide
    this.layer.runtime.posingLayer = this.old_posingLayer

    // console.log('undo', this.layer.enableEyesSymmetry, this.layer.posingLayer ? this.layer.posingLayer.name : null)

    ctx.setRedrawLayerWindow()
  }

  redo(ctx: SubToolContext) { // @virtual

    // console.log('execute', this.new_enableEyesSymmetry, this.new_posingLayer ? this.new_posingLayer.name : null)

    if (this.new_enableEyesSymmetry !== undefined) {

      this.layer.eyesSymmetryEnabled = this.new_enableEyesSymmetry

      ctx.setRedrawLayerWindow()
      ctx.setRedrawMainWindowEditorWindow()
    }

    if (this.new_eyesSymmetryInputSide !== undefined) {

      this.layer.eyesSymmetryInputSide = this.new_eyesSymmetryInputSide

      ctx.setRedrawLayerWindow()
      ctx.setRedrawMainWindowEditorWindow()
    }

    if (this.new_posingLayer !== undefined) {

      this.layer.runtime.posingLayer = this.new_posingLayer

      ctx.setRedrawLayerWindow()
      ctx.setRedrawMainWindowEditorWindow()
    }
  }
}
