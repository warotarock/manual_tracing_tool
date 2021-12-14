import { CommandBase } from '../command/command'
import { Lists } from '../logics/conversion'
import { Layer, VectorGeometry, VectorLayer } from '../document_data'
import { OperationUnitID } from '../tool/constants'
import { ISelector_BrushSelect, LineSelectionInfo, PointSelectionInfo, SelectionEditMode, Selector_LinePoint_BrushSelect,
  Selector_LineSegment_BrushSelect, Selector_Line_BrushSelect, VectorLayerEditorSelectionInfo
} from '../logics/selector'
import { ModalToolBase } from '../tool/sub_tool'
import { SubToolContext } from '../context/subtool_context'
import { SubToolDrawingContext } from '../context/subtool_drawing_context'
import { ToolPointerEvent } from '../tool/tool_pointer_event'
import { ViewKeyframeLayer } from '../view/view_keyframe'

export class Tool_BrushSelectLinePointBase extends ModalToolBase {

  helpText = '左クリックで選択を追加、Altキーを押しながらで選択を解除します。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。'
  isEditTool = true // @override

  logic_Selector: ISelector_BrushSelect = null // @virtual

  viewKeyframeLayers: ViewKeyframeLayer[] = null

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerVectorLayer()
      && Layer.isEditTarget(ctx.currentLayer)
    )
  }

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    if (!this.isAvailable(ctx)) {
      return
    }

    drawing.editorDrawer.drawMouseCursorCircle(this.getSelectionRadius(ctx))
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!this.isAvailable(ctx)) {
      return
    }

    if (e.isLeftButtonPressing()) {

      this.startSelection(e, ctx)
      this.processSelection(e, ctx)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    // console.log(`mouseMove (${e.location[0]} ${e.location[1]})`)

    if (!this.isAvailable(ctx)) {
      return
    }

    if (ctx.isModalToolRunning()) {

      if (e.isLeftButtonPressing()) {

        this.processSelection(e, ctx)
        ctx.setRedrawCurrentLayer()
      }
    }

    // redraw cursor
    ctx.setRedrawEditorWindow()
  }

  mouseUp(_e: ToolPointerEvent, ctx: SubToolContext) { // @override

    //if (ctx.currentVectorLayer == null) {
    //    return
    //}
    if (!this.isAvailable(ctx)) {
      return
    }

    if (ctx.isModalToolRunning()) {

      this.endSelection(ctx)

      ctx.setRedrawCurrentLayer()
    }

    ctx.setRedrawEditorWindow()
  }

  private startSelection(e: ToolPointerEvent, ctx: SubToolContext) {

    if (ctx.isCtrlKeyPressing()) {

      this.logic_Selector.editMode = SelectionEditMode.toggle
    }
    else if (ctx.isAltKeyPressing()) {

      this.logic_Selector.editMode = SelectionEditMode.setUnselected
    }
    else {

      this.logic_Selector.editMode = SelectionEditMode.setSelected
    }

    this.viewKeyframeLayers = ctx.collectVectorViewKeyframeLayersForEdit()

    this.onStartSelection(e, ctx)

    this.logic_Selector.startProcess()

    ctx.startModalTool(this.subtoolID)
  }

  protected getSelectionRadius(ctx: SubToolContext) { // @virtual

    return ctx.mouseCursorViewRadius
  }

  protected onStartSelection(_e: ToolPointerEvent, _ctx: SubToolContext) { // @virtual

  }

  private processSelection(e: ToolPointerEvent, ctx: SubToolContext) {

    if (this.viewKeyframeLayers == null) {

      return null
    }

    // console.log(`processSelection (${e.location[0]} ${e.location[1]})`)

    ViewKeyframeLayer.forEachGeometry(this.viewKeyframeLayers, (geometry: VectorGeometry) => {

      this.logic_Selector.processGeometry(
        geometry,
        e.location,
        this.getSelectionRadius(ctx)
      )
    })
  }

  private endSelection(ctx: SubToolContext) {

    this.logic_Selector.endProcess()

    ctx.endModalTool()

    if (!this.existsResults()) {

      return
    }

    this.executeCommand(ctx)

    this.viewKeyframeLayers = null
  }

  protected existsResults(): boolean { // @virtual

    return (this.logic_Selector.selectionInfo.selectedLines.length != 0
      || this.logic_Selector.selectionInfo.selectedPoints.length != 0)
  }

  protected executeCommand(_ctx: SubToolContext) { // @virtual

  }
}

export class Tool_Select_BrushSelect_LinePoint extends Tool_BrushSelectLinePointBase {

  logic_Selector: ISelector_BrushSelect = new Selector_LinePoint_BrushSelect() // @override

  toolWindowItemClick(ctx: SubToolContext) { // @override

    ctx.setCurrentOperationUnitID(OperationUnitID.linePoint)
    ctx.setRedrawCurrentLayer()
  }

  prepareModal(_e: ToolPointerEvent, _ctx: SubToolContext): boolean { // @override

    return true
  }

  cancelModal(ctx: SubToolContext) { // @override

    for (const selPoint of this.logic_Selector.selectionInfo.selectedPoints) {

      selPoint.point.isSelected = selPoint.selectStateBefore
    }

    this.logic_Selector.endProcess()

    ctx.setRedrawMainWindowEditorWindow()
  }

  protected executeCommand(ctx: SubToolContext) { // @override

    const command = new Command_Select()
    command.selectionInfo = this.logic_Selector.selectionInfo

    ctx.commandHistory.executeCommand(command, ctx)
  }
}

export class Tool_Select_BrushSelect_Line extends Tool_Select_BrushSelect_LinePoint {

  logic_Selector: ISelector_BrushSelect = new Selector_Line_BrushSelect() // @override

  toolWindowItemClick(ctx: SubToolContext) { // @override

    ctx.setCurrentOperationUnitID(OperationUnitID.line)
    ctx.setRedrawCurrentLayer()
  }
}

export class Tool_Select_BrushSelect_LineSegment extends Tool_Select_BrushSelect_LinePoint {

  logic_Selector: ISelector_BrushSelect = new Selector_LineSegment_BrushSelect() // @override

  toolWindowItemClick(ctx: SubToolContext) { // @override

    ctx.setCurrentOperationUnitID(OperationUnitID.lineSegment)
    ctx.setRedrawCurrentLayer()
  }
}

export class Command_Select extends CommandBase {

  selectionInfo: VectorLayerEditorSelectionInfo = null

  private selectedLines: LineSelectionInfo[] = null
  private selectedPoints: PointSelectionInfo[] = null

  execute(ctx: SubToolContext) { // @override

    // Selection process has done while inputting
    // so not required execute this.redo(ctx)

    this.selectedLines = Lists.clone(this.selectionInfo.selectedLines)
    this.selectedPoints = Lists.clone(this.selectionInfo.selectedPoints)

    if (this.selectedLines.length > 0) {

      const firstLine = this.selectedLines[0]
      ctx.setCurrentVectorLine(firstLine.line, ctx.currentVectorGroup)
    }
  }

  undo(_ctx: SubToolContext) { // @override

    for (const selPoint of this.selectedPoints) {

      selPoint.point.isSelected = selPoint.selectStateBefore
    }

    for (const selLine of this.selectedLines) {

      selLine.line.isSelected = selLine.selectStateBefore
    }
  }

  redo(_ctx: SubToolContext) { // @override

    for (const selPoint of this.selectedPoints) {

      selPoint.point.isSelected = selPoint.selectStateAfter
    }

    for (const selLine of this.selectedLines) {

      selLine.line.isSelected = selLine.selectStateAfter
    }
  }
}
