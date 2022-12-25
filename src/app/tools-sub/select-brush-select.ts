import { CommandBase } from '../command'
import { Lists } from '../common-logics'
import { SubToolContext, SubToolDrawingContext } from '../context'
import { VectorLayer, VectorLayerGeometry } from '../document-data'
import {
  ISelector_VectorLayer, SelectionEditMode, Selector_StrokeSegment_BrushSelect,
  Selector_VectorPoint_BrushSelect, Selector_VectorStroke_BrushSelect, VectorLayerSelectionInfo,
  VectorPointSelectionInfo, VectorStrokeSelectionInfo
} from '../document-logic'
import { ModalToolBase, OperationUnitID, ToolPointerEvent } from '../tool'
import { ViewKeyframeLayer } from '../view'

export class Tool_BrushSelectLinePointBase extends ModalToolBase {

  helpText = '左クリックで選択を追加、Altキーを押しながらで選択を解除します。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。'
  isEditTool = true // @override
  usesHitTestToSelect = true // @override

  brushSelector: ISelector_VectorLayer = null // @virtual

  viewKeyframeLayers: ViewKeyframeLayer[] = null

  isAvailable(ctx: SubToolContext): boolean { // @override

    return ctx.isCurrentLayerEditbaleLayer()
  }

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    if (!this.isAvailable(ctx)) {
      return
    }

    drawing.editorDrawer.drawPointerCursor(this.getSelectionRadius(ctx))
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!this.isAvailable(ctx)) {
      return
    }

    if (e.isLeftButtonPressing) {

      this.startSelection(e, ctx)
      this.processSelection(e, ctx)

      ctx.tool.startModalTool(this.subtoolID)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    // console.log(`mouseMove (${e.location[0]} ${e.location[1]})`)

    if (!this.isAvailable(ctx)) {
      return
    }

    if (ctx.tool.isModalToolRunning()) {

      this.processSelection(e, ctx)
      ctx.setRedrawCurrentLayer()
    }
    else {

      // show hitting to stroke
      const isHitChanged = ctx.tool.visualHittestToStrokes(e.location, ctx.toolBaseViewRadius)
      if (isHitChanged) {
        ctx.setRedrawCurrentLayer()
      }
    }

    // redraw cursor
    ctx.setRedrawEditorWindow()
  }

  mouseUp(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.tool.endModalTool()

    if (!this.isAvailable(ctx)) {
      return
    }

    this.endSelection(ctx)

    ctx.setRedrawCurrentLayer()

    ctx.setRedrawEditorWindow()
  }

  private startSelection(e: ToolPointerEvent, ctx: SubToolContext) {

    this.viewKeyframeLayers = ctx.main.collectVectorViewKeyframeLayersForEdit()

    this.onStartSelection(e, ctx)

    this.brushSelector.startProcess()
  }

  protected getSelectionRadius(ctx: SubToolContext) { // @virtual

    return ctx.toolBaseViewRadius
  }

  protected onStartSelection(_e: ToolPointerEvent, _ctx: SubToolContext) { // @virtual
  }

  private processSelection(e: ToolPointerEvent, ctx: SubToolContext) {

    if (this.viewKeyframeLayers == null) {

      return null
    }

    // console.log(`processSelection (${e.location[0]} ${e.location[1]})`)

    ViewKeyframeLayer.forEachVectorGeometry(this.viewKeyframeLayers, (geometry: VectorLayerGeometry, layer: VectorLayer) => {

      this.brushSelector.processGeometry(
        layer,
        geometry,
        e.location,
        this.getSelectionRadius(ctx)
      )
    })

    this.afterProcessSelection(ctx)
  }

  afterProcessSelection(ctx: SubToolContext) { // @virtual
  }

  private endSelection(ctx: SubToolContext) {

    this.brushSelector.endProcess()

    this.viewKeyframeLayers = null

    if (!this.existsResults()) {
      return
    }

    this.executeCommand(ctx)
  }

  protected existsResults(): boolean { // @virtual

    return (this.brushSelector.selectionInfo.selectedStrokess.length != 0
      || this.brushSelector.selectionInfo.selectedPoints.length != 0)
  }

  protected executeCommand(_ctx: SubToolContext) { // @virtual

  }
}

export class Tool_Select_BrushSelect extends Tool_BrushSelectLinePointBase {

  strokeSelector = new Selector_VectorStroke_BrushSelect()
  segmentSelector = new Selector_StrokeSegment_BrushSelect()
  pointSelector = new Selector_VectorPoint_BrushSelect()

  brushSelector: ISelector_VectorLayer = this.strokeSelector // @override

  hasClearedBeforeSelection = false

  protected onStartSelection(_e: ToolPointerEvent, ctx: SubToolContext) { // @override

    switch (ctx.operationUnitID) {

      case OperationUnitID.stroke:
        this.brushSelector = this.strokeSelector
        break

      case OperationUnitID.strokeSegment:
        this.brushSelector = this.segmentSelector
        break

      case OperationUnitID.strokePoint:
        this.brushSelector = this.pointSelector
        break
    }

    if (ctx.isCtrlKeyPressing()) {

      this.brushSelector.editMode = SelectionEditMode.toggle
    }
    else if (ctx.isAltKeyPressing()) {

      this.brushSelector.editMode = SelectionEditMode.setUnselected
    }
    else {

      this.brushSelector.editMode = SelectionEditMode.setSelected
    }

    this.hasClearedBeforeSelection = false

    if (!ctx.isAnyModifierKeyPressing()) {

      this.hasClearedBeforeSelection = ctx.tool.executeClearSelection()
    }
  }

  cancelModal(ctx: SubToolContext) { // @override

    for (const selPoint of this.brushSelector.selectionInfo.selectedPoints) {

      selPoint.point.isSelected = selPoint.selectStateBefore
    }

    this.brushSelector.endProcess()

    ctx.setRedrawMainWindowEditorWindow()
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    const command = new Command_Select()
    command.selectionInfo = this.brushSelector.selectionInfo

    if (this.hasClearedBeforeSelection) {

      command.isContinued = true
    }

    ctx.commandHistory.executeCommand(command, ctx)
  }
}

export class Command_Select extends CommandBase {

  selectionInfo: VectorLayerSelectionInfo = null

  private selectedLines: VectorStrokeSelectionInfo[] = null
  private selectedPoints: VectorPointSelectionInfo[] = null

  execute(_ctx: SubToolContext) { // @override

    // Selection process has done while inputting
    // so not required execute this.redo(ctx)

    this.selectedLines = Lists.clone(this.selectionInfo.selectedStrokess)
    this.selectedPoints = Lists.clone(this.selectionInfo.selectedPoints)
  }

  undo(_ctx: SubToolContext) { // @override

    for (const selPoint of this.selectedPoints) {

      selPoint.point.isSelected = selPoint.selectStateBefore
    }

    for (const selLine of this.selectedLines) {

      selLine.stroke.isSelected = selLine.selectStateBefore
    }
  }

  redo(_ctx: SubToolContext) { // @override

    for (const selPoint of this.selectedPoints) {

      selPoint.point.isSelected = selPoint.selectStateAfter
    }

    for (const selLine of this.selectedLines) {

      selLine.stroke.isSelected = selLine.selectStateAfter
    }
  }
}
