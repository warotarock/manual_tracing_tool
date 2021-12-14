import { int, Lists } from "../logics/conversion"
import { Layer, DocumentData, GroupLayer, VectorLayer, DrawLineTypeID, FillAreaTypeID, VectorKeyframe, VectorGeometry,
  VectorDrawingUnit, VectorStrokeGroup, VectorLayerReferenceLayer, AutoFillLayer, ImageFileReferenceLayer,
  PosingLayer, EyesSymmetryInputSideID } from "../document_data"
import { CommandBase } from "../command/command"
import { SubToolContext } from "../context/subtool_context"

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

  newLayer: Layer = null

  isAvailable(_ctx: SubToolContext): boolean { // @virtual

    return false
  }

  setPrameters(documentData: DocumentData, currentLayer: Layer, currentLayerParent: Layer, previousLayer: Layer, previousLayerParent: Layer, nextLayer: Layer, nextLayerParent: Layer) {

    this.rootLayer = documentData.rootLayer

    this.currentLayer = currentLayer
    this.currentLayerParent = currentLayerParent
    this.currentLayerIndex = this.findChildLayerIndex(currentLayerParent, currentLayer)

    this.previousLayer = previousLayer
    this.previousLayerParent = previousLayerParent
    this.previousLayerIndex = this.findChildLayerIndex(previousLayerParent, previousLayer)

    this.nextLayer = nextLayer
    this.nextLayerParent = nextLayerParent
    this.nextLayerIndex = this.findChildLayerIndex(nextLayerParent, nextLayer)
  }

  private findChildLayerIndex(parentLayer: Layer, childLayer: Layer): int {

    if (parentLayer == null || childLayer == null) {

      return -1
    }

    for (let i = 0; i < parentLayer.childLayers.length; i++) {

      if (parentLayer.childLayers[i] == childLayer) {

        return i
      }
    }

    return -1
  }

  protected isContainerLayer(layer: Layer): boolean {

    return (Layer.isRootLayer(layer) || GroupLayer.isGroupLayer(layer))
  }

  protected executeLayerSwap(parentLayer: Layer, swapIndex1: int, swapIndex2: int, ctx: SubToolContext) {

    this.insertTo_ParentLayer = parentLayer

    this.insertTo_Layer_OldChildLayerList = parentLayer.childLayers

    this.insertTo_Layer_NewChildLayerList = Lists.clone(parentLayer.childLayers)

    const swapItem = this.insertTo_Layer_NewChildLayerList[swapIndex1]
    this.insertTo_Layer_NewChildLayerList[swapIndex1] = this.insertTo_Layer_NewChildLayerList[swapIndex2]
    this.insertTo_Layer_NewChildLayerList[swapIndex2] = swapItem

    parentLayer.childLayers = this.insertTo_Layer_NewChildLayerList

    ctx.updateLayerStructure()
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

    layer.parentLayer = parentLayer

    ctx.updateLayerStructure()

    this.newLayer = layer
    ctx.setCurrentLayer(layer)
  }

  protected executeLayerRemove(parentLayer: Layer, removeIndex: int, ctx: SubToolContext) {

    this.removeFrom_ParentLayer = parentLayer

    this.removeFrom_OldChildLayerList = parentLayer.childLayers

    this.removeFrom_NewChildLayerList = Lists.clone(parentLayer.childLayers)

    Lists.removeAt(this.removeFrom_NewChildLayerList, removeIndex)

    parentLayer.childLayers = this.removeFrom_NewChildLayerList

    if (this.previousLayer != null) {

      ctx.setCurrentLayer(this.previousLayer)
    }
    else if (this.nextLayer != null) {

      ctx.setCurrentLayer(this.nextLayer)
    }

    ctx.updateLayerStructure()
  }

  undo(ctx: SubToolContext) { // @override

    if (this.insertTo_ParentLayer != null) {

      this.insertTo_ParentLayer.childLayers = this.insertTo_Layer_OldChildLayerList
    }

    if (this.removeFrom_ParentLayer != null) {

      this.removeFrom_ParentLayer.childLayers = this.removeFrom_OldChildLayerList
    }

    this.undoReplacedReferences()

    ctx.setCurrentLayer(this.currentLayer)

    ctx.updateLayerStructure()

    ctx.setRedrawMainWindowEditorWindow()
  }

  redo(ctx: SubToolContext) { // @override

    if (this.insertTo_ParentLayer != null) {

      this.insertTo_ParentLayer.childLayers = this.insertTo_Layer_NewChildLayerList
    }

    if (this.removeFrom_ParentLayer != null) {

      this.removeFrom_ParentLayer.childLayers = this.removeFrom_NewChildLayerList
    }

    this.redoReplacedReferences()

    ctx.updateLayerStructure()

    if (this.newLayer != null) {

      ctx.setCurrentLayer(this.newLayer)
    }

    ctx.setRedrawMainWindowEditorWindow()
  }
}

export class Command_Layer_AddVectorLayerToCurrentPosition extends Command_Layer_CommandBase {

  createForFillColor = false

  newLayer: VectorLayer = null

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    this.newLayer = new VectorLayer()

    if (!this.createForFillColor) {

      this.newLayer.name = 'new line layer'
      this.newLayer.drawLineType = DrawLineTypeID.paletteColor
      this.newLayer.fillAreaType = FillAreaTypeID.none
    }
    else {

      this.newLayer.name = 'new fill layer'
      this.newLayer.drawLineType = DrawLineTypeID.none
      this.newLayer.fillAreaType = FillAreaTypeID.paletteColor
    }

    const keyFrame = new VectorKeyframe()
    keyFrame.geometry = new VectorGeometry()
    this.newLayer.keyframes.push(keyFrame)

    const unit = new VectorDrawingUnit()
    unit.groups.push(new VectorStrokeGroup())

    keyFrame.geometry.units.push(unit)

    this.executeLayerInsertToCurrent(this.newLayer, ctx)
  }
}

export class Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: VectorLayerReferenceLayer = null

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

    this.newLayer = new VectorLayerReferenceLayer()
    this.newLayer.name = 'new ref layer'

    this.newLayer.referenceLayer = <VectorLayer>(this.currentLayer)
    this.newLayer.keyframes = this.newLayer.referenceLayer.keyframes

    this.executeLayerInsertToCurrent(this.newLayer, ctx)
  }
}

export class Command_Layer_AddAutoFillLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: AutoFillLayer = null

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    this.newLayer = new AutoFillLayer()

    this.newLayer.name = 'new auto fill layer'

    this.executeLayerInsertToCurrent(this.newLayer, ctx)
  }
}

export class Command_Layer_AddGroupLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: GroupLayer = null

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    this.newLayer = new GroupLayer()
    this.newLayer.name = 'new group'

    this.executeLayerInsertToCurrent(this.newLayer, ctx)
  }
}

export class Command_Layer_AddImageFileReferenceLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: ImageFileReferenceLayer = null

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    this.newLayer = new ImageFileReferenceLayer()
    this.newLayer.name = 'new file'

    this.executeLayerInsertToCurrent(this.newLayer, ctx)
  }
}

export class Command_Layer_AddPosingLayerToCurrentPosition extends Command_Layer_CommandBase {

  newLayer: PosingLayer = null

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    this.newLayer = new PosingLayer()
    this.newLayer.name = 'new posing'

    this.newLayer.posingModel = ctx.getPosingModelByName('dummy_skin')

    this.executeLayerInsertToCurrent(this.newLayer, ctx)
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

    this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, ctx)

    this.replaceReferenceRecursive(this.rootLayer, this.currentLayer, null)

    if (this.previousLayer != null) {

      ctx.setCurrentLayer(this.previousLayer)
    }
    else if (this.nextLayer != null) {

      ctx.setCurrentLayer(this.nextLayer)
    }
  }
}

export class Command_Layer_MoveUp extends Command_Layer_CommandBase {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    if (this.previousLayer == null) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    if (GroupLayer.isGroupLayer(this.previousLayer)) {

      if (this.previousLayer == this.currentLayerParent) {

        this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, ctx)
        this.executeLayerInsert(this.previousLayerParent, this.previousLayerIndex, this.currentLayer, ctx)
      }
      else {

        this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, ctx)
        this.executeLayerInsert(this.previousLayer, this.previousLayer.childLayers.length, this.currentLayer, ctx)
      }
    }
    else if (this.previousLayerParent == this.currentLayerParent) {

      this.executeLayerSwap(this.currentLayerParent, this.currentLayerIndex, this.currentLayerIndex - 1, ctx)
      ctx.setCurrentLayer(this.currentLayer)
    }
    else {

      this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, ctx)
      this.executeLayerInsert(this.previousLayerParent, this.previousLayerParent.childLayers.length, this.currentLayer, ctx)
    }
  }
}

export class Command_Layer_MoveDown extends Command_Layer_MoveUp {

  isAvailable(_ctx: SubToolContext): boolean { // @override

    if (!this.isContainerLayer(this.currentLayerParent)) {

      return false
    }

    if (this.nextLayer == null) {

      return false
    }

    return true
  }

  execute(ctx: SubToolContext) { // @override

    if (GroupLayer.isGroupLayer(this.nextLayer)) {

      this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, ctx)
      this.executeLayerInsert(this.nextLayer, 0, this.currentLayer, ctx)
    }
    else if (this.currentLayerParent == this.nextLayerParent) {

      this.executeLayerSwap(this.currentLayerParent, this.currentLayerIndex, this.currentLayerIndex + 1, ctx)
      ctx.setCurrentLayer(this.currentLayer)
    }
    else {

      this.executeLayerRemove(this.currentLayerParent, this.currentLayerIndex, ctx)
      this.executeLayerInsert(this.nextLayerParent, this.nextLayerIndex, this.currentLayer, ctx)
    }
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
    this.old_posingLayer = ctx.currentVectorLayer.posingLayer

    this.redo(ctx)
  }

  undo(ctx: SubToolContext) { // @virtual

    this.layer.eyesSymmetryEnabled = this.old_enableEyesSymmetry
    this.layer.eyesSymmetryInputSide = this.old_eyesSymmetryInputSide
    this.layer.posingLayer = this.old_posingLayer

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

      this.layer.posingLayer = this.new_posingLayer

      ctx.setRedrawLayerWindow()
      ctx.setRedrawMainWindowEditorWindow()
    }
  }
}
