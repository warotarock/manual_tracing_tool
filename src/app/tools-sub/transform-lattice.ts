import { SubToolContext, SubToolDrawingContext } from '../context'
import { Layer } from '../document-data'
import { VectorPointLogic } from '../document-logic'
import { float, int, Logic_Points, RectangleArea } from '../common-logics'
import { ModalToolBase, ToolPointerEvent } from '../tool'
import { ShortcutCommandID } from '../user-setting'

export enum LatticePointEditTypeID {

  none, horizontalOnly, verticalOnly, allDirection
}

export class LatticePoint {

  latticePointEditType = LatticePointEditTypeID.none
  baseLocation = vec3.fromValues(0.0, 0.0, 0.0)
  location = vec3.fromValues(0.0, 0.0, 0.0)
  displayBaseLocationOffset = vec3.fromValues(0.0, 0.0, 0.0)
  displayOffset = vec3.fromValues(0.0, 0.0, 0.0)
  displayLocation = vec3.fromValues(0.0, 0.0, 0.0)
}

export class LatticeEdge {

  partIndex = -1
  latticePointFrom: LatticePoint = null
  latticePointTo: LatticePoint = null
  pointIndexFrom = 0
  pointIndexTo = 0
  mouseOver = false
}

export enum SelectedLatticePartID {

  none, latticePoint, latticeEdge
}

export enum LatticeStateID {

  invalid = 0,
  initialState = 1,
  modified = 2,
}

export enum TransformType {

  none = 0,
  grabMove = 1,
  rotate = 2,
  scale = 3
}

export enum TransformLockType {

  none = 0,
  x = 1,
  y = 2,
}

export enum TransformModifyType {

  none = 0,
  zero = 1,
  slow = 2,
  one = 3,
}

interface HandleKeyDownForTransformModifyingOption {

  g?: boolean
  r?: boolean
  s?: boolean
  x?: boolean
  y?: boolean
  zero?: boolean
  one?: boolean
  shift?: boolean
  key: string
  ctx: SubToolContext
}

export class Tool_Transform_Lattice extends ModalToolBase {

  isEditTool = true // @override

  allEdgeSelection = false // @virtual

  latticeState = LatticeStateID.invalid
  bound_contentArea = new RectangleArea()
  inner_contentArea = new RectangleArea()

  latticePoints: LatticePoint[] = null
  latticeEdges: LatticeEdge[] = null
  latticePointCount = 4

  transformType = TransformType.none
  transformLockType = TransformLockType.none
  transformModifyType = TransformModifyType.none
  transformCalculator: ITool_Transform_Lattice_Calculator = null
  grabMove_Calculator = new GrabMove_Calculator()
  rotate_Calculator = new Rotate_Calculator()
  scale_Calculator = new Scale_Calculator()

  mouseOver_SelectedLatticePart = SelectedLatticePartID.none
  mouseOver_PartIndex = -1
  mouseOver_PartIndexTo = -1

  dLocation = vec3.create()
  offset = vec3.create()
  offsetScale = vec3.create()
  offsetMatrix = mat4.create()

  constructor() {
    super()

    this.createLatticePoints()
  }

  mouseAnchorLocation = vec3.create()

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.currentLayer != null
      && Layer.isEditTarget(ctx.currentLayer)
    )
  }

  onActivated(ctx: SubToolContext) { // @override

    this.latticeState = LatticeStateID.invalid
    this.mouseOver_SelectedLatticePart = SelectedLatticePartID.none

    const available = this.prepareLatticePoints(ctx)

    if (available) {

      this.latticeState = LatticeStateID.initialState
    }
    else {

      this.latticeState = LatticeStateID.invalid
    }
  }

  // Preparing for operation

  prepareModal(e: ToolPointerEvent, ctx: SubToolContext): boolean { // @override

    this.clearEditData()

    this.latticeState = LatticeStateID.invalid
    this.transformLockType = TransformLockType.none
    this.transformModifyType = TransformModifyType.none

    if (!this.checkTarget(ctx)) {
      return false
    }

    // Create lattie points
    if (this.latticePoints == null) {

      this.createLatticePoints()
    }

    // Current cursor location
    vec3.copy(this.mouseAnchorLocation, e.location)

    // Caluclate surrounding rectangle of all selected points
    const available = this.prepareLatticePoints(ctx)

    if (!available) {
      this.latticeState = LatticeStateID.invalid
      return false
    }

    ctx.tool.updateOperationOriginByPoints(this.latticePoints)

    this.latticeState = LatticeStateID.initialState

    this.setLatticeLocation(ctx)

    this.selectTransformCalculator(ctx)

    // Create edit info
    this.prepareEditData(ctx)

    this.prepareModalExt(ctx)

    return this.existsEditData()
  }

  protected createLatticePoints() {

    this.latticePoints = []

    for (let i = 0; i < this.latticePointCount; i++) {

      this.latticePoints.push(new LatticePoint())
    }

    this.latticeEdges = []

    for (let i = 0; i < this.latticePoints.length; i++) {

      const edge = new LatticeEdge()
      edge.partIndex = i
      edge.pointIndexFrom = i
      edge.pointIndexTo = (i + 1) % this.latticePoints.length
      edge.latticePointFrom = this.latticePoints[edge.pointIndexFrom]
      edge.latticePointTo = this.latticePoints[edge.pointIndexTo]

      this.latticeEdges.push(edge)
    }
  }

  protected setLatticePointsByRectangle(bound_area: RectangleArea, inner_area: RectangleArea) {

    vec3.set(this.latticePoints[0].baseLocation, inner_area.left, inner_area.top, 0.0)
    vec3.set(this.latticePoints[1].baseLocation, inner_area.right, inner_area.top, 0.0)
    vec3.set(this.latticePoints[2].baseLocation, inner_area.right, inner_area.bottom, 0.0)
    vec3.set(this.latticePoints[3].baseLocation, inner_area.left, inner_area.bottom, 0.0)

    const leftBound_offset = bound_area.left - inner_area.left
    const topBound_offset = bound_area.top - inner_area.top
    const rightBound_offset = bound_area.right - inner_area.right
    const bottomBound_offset = bound_area.bottom - inner_area.bottom
    vec3.set(this.latticePoints[0].displayBaseLocationOffset, leftBound_offset, topBound_offset, 0.0)
    vec3.set(this.latticePoints[1].displayBaseLocationOffset, rightBound_offset, topBound_offset, 0.0)
    vec3.set(this.latticePoints[2].displayBaseLocationOffset, rightBound_offset, bottomBound_offset, 0.0)
    vec3.set(this.latticePoints[3].displayBaseLocationOffset, leftBound_offset, bottomBound_offset, 0.0)

    this.resetLatticePointLocationToBaseLocation()
  }

  protected setLatticePointOffsetsByRectangle() {

    vec3.set(this.latticePoints[0].displayOffset, -1.0, -1.0, 0.0)
    vec3.set(this.latticePoints[1].displayOffset, 1.0, -1.0, 0.0)
    vec3.set(this.latticePoints[2].displayOffset, 1.0, 1.0, 0.0)
    vec3.set(this.latticePoints[3].displayOffset, -1.0, 1.0, 0.0)
  }

  protected resetLatticePointLocationToBaseLocation() {

    for (const latticePoint of this.latticePoints) {

      vec3.copy(latticePoint.location, latticePoint.baseLocation)
    }
  }

  protected applytLatticePointBaseLocation() {

    for (const latticePoint of this.latticePoints) {

      vec3.copy(latticePoint.baseLocation, latticePoint.location)
    }
  }

  // Preparing for operation (Override methods)

  protected checkTarget(_ctx: SubToolContext): boolean { // @virtual

    return (this.transformType != TransformType.none)
  }

  protected prepareLatticePoints(_ctx: SubToolContext): boolean { // @virtual

    this.setLatticePointsByRectangle(this.bound_contentArea, this.inner_contentArea)

    return this.existsEditData()
  }

  protected setLatticeLocation(ctx: SubToolContext) { // @virtual

    this.setLatticePointOffsetsByRectangle()

    this.resetLatticePointLocationToBaseLocation()
  }

  protected clearEditData() { // @virtual
  }

  protected selectTransformCalculator(_ctx: SubToolContext) { // @virtual
  }

  protected prepareEditData(_ctx: SubToolContext) { // @virtual
  }

  protected prepareModalExt(_ctx: SubToolContext) { // @override
  }

  protected existsEditData(): boolean { // @virtual

    return false
  }

  // Lattice transforma operation functions

  protected setLatticeAffineTransform(transformType: TransformType, ctx: SubToolContext) {

    for (const latticePoint of this.latticePoints) {

      latticePoint.latticePointEditType = LatticePointEditTypeID.allDirection
    }

    if (transformType == TransformType.grabMove) {

      this.transformType = TransformType.grabMove
      this.transformCalculator = this.grabMove_Calculator
    }
    else if (transformType == TransformType.rotate) {

      this.transformType = TransformType.rotate
      this.transformCalculator = this.rotate_Calculator
    }
    else if (transformType == TransformType.scale) {

      this.transformType = TransformType.scale
      this.transformCalculator = this.scale_Calculator
    }

    this.transformCalculator.prepare(ctx)
  }

  protected startLatticeAffineTransform(transformType: TransformType, isContinueEdit: boolean, ctx: SubToolContext) {

    this.setLatticeAffineTransform(transformType, ctx)

    vec3.copy(this.mouseAnchorLocation, ctx.mouseCursorLocation)

    if (isContinueEdit) {

      this.applytLatticePointBaseLocation()
    }
    else {

      ctx.tool.startModalTool(this.subtoolID)
    }
  }

  protected startLatticeTransform(ctx: SubToolContext) {

    for (const latticePoint of this.latticePoints) {

      latticePoint.latticePointEditType = LatticePointEditTypeID.none
    }

    if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticePoint) {

      let sidePointIndexH = -1
      let sidePointIndexV = -1
      if (this.mouseOver_PartIndex == 0) {

        sidePointIndexH = 3
        sidePointIndexV = 1
      }
      else if (this.mouseOver_PartIndex == 1) {

        sidePointIndexH = 2
        sidePointIndexV = 0
      }
      else if (this.mouseOver_PartIndex == 2) {

        sidePointIndexH = 1
        sidePointIndexV = 3
      }
      else if (this.mouseOver_PartIndex == 3) {

        sidePointIndexH = 0
        sidePointIndexV = 2
      }

      this.latticePoints[this.mouseOver_PartIndex].latticePointEditType = LatticePointEditTypeID.allDirection
      this.latticePoints[sidePointIndexH].latticePointEditType = LatticePointEditTypeID.horizontalOnly
      this.latticePoints[sidePointIndexV].latticePointEditType = LatticePointEditTypeID.verticalOnly

      this.transformType = TransformType.grabMove
      this.transformCalculator = this.grabMove_Calculator
      this.latticeState = LatticeStateID.initialState

      this.transformCalculator.prepare(ctx)

      ctx.tool.startModalTool(this.subtoolID)
    }

    else if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticeEdge) {

      let latticePointEditType: LatticePointEditTypeID
      if (this.mouseOver_PartIndex == 0 || this.mouseOver_PartIndex == 2) {

        latticePointEditType = LatticePointEditTypeID.verticalOnly
      }
      else {

        latticePointEditType = LatticePointEditTypeID.horizontalOnly
      }

      this.latticePoints[this.mouseOver_PartIndex].latticePointEditType = latticePointEditType
      this.latticePoints[this.mouseOver_PartIndexTo].latticePointEditType = latticePointEditType

      this.transformType = TransformType.grabMove
      this.transformCalculator = this.grabMove_Calculator
      this.latticeState = LatticeStateID.initialState

      this.transformCalculator.prepare(ctx)

      ctx.tool.startModalTool(this.subtoolID)
    }
  }

  protected endTransform(ctx: SubToolContext) {

    this.processTransform(ctx)

    this.executeCommand(ctx)

    this.transformType = TransformType.none
    this.transformCalculator = null

    ctx.tool.endModalTool()
  }

  protected cancelTransform(ctx: SubToolContext) {

    this.transformType = TransformType.none
    this.transformCalculator = null

    ctx.tool.cancelModalTool()
  }

  // Operation inputs

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (!ctx.tool.isModalToolRunning() && e.isLeftButtonPressing) {

      this.processMouseOver(e, ctx)

      this.startLatticeTransform(ctx)
    }
    else {

      if (e.isRightButtonPressing) {

        this.cancelTransform(ctx)
      }
    }
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.tool.isModalToolRunning()) {

      // Move lattice points

      this.processLatticePointMouseMove(ctx)

      // Transform edit data

      this.processTransform(ctx)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }
    else {

      this.processMouseOver(e, ctx)

      ctx.setRedrawEditorWindow() // redraw cursor
    }
  }

  protected processMouseOver(e: ToolPointerEvent, ctx: SubToolContext) {

    this.mouseOver_SelectedLatticePart = SelectedLatticePartID.none
    this.mouseOver_PartIndex = -1
    this.mouseOver_PartIndexTo = -1

    for (const edge of this.latticeEdges) {

      edge.mouseOver = false
    }

    const hitedPointIndex = this.getMouseOverLatticePointIndex(e, ctx)

    if (hitedPointIndex != -1) {

      this.mouseOver_SelectedLatticePart = SelectedLatticePartID.latticePoint
      this.mouseOver_PartIndex = hitedPointIndex
    }
    else {

      const hitedEdge = this.getMouseOverLatticeEdgeIndex(e, ctx)

      if (hitedEdge != null) {

        this.mouseOver_SelectedLatticePart = SelectedLatticePartID.latticeEdge
        this.mouseOver_PartIndex = hitedEdge.pointIndexFrom
        this.mouseOver_PartIndexTo = hitedEdge.pointIndexTo

        if (this.allEdgeSelection) {

          for (const edge of this.latticeEdges) {

            edge.mouseOver = true
          }
        }
        else {

          hitedEdge.mouseOver = true
        }
      }
    }
  }

  protected getMouseOverLatticePointIndex(e: ToolPointerEvent, ctx: SubToolContext): int {

    let resultIndex = -1

    const scaledHitRadius = ctx.getViewScaledLength(ctx.drawStyle.latticePointHitRadius)

    for (let index = 0; index < this.latticePoints.length; index++) {

      const latticePoint = this.latticePoints[index]

      const distance = vec3.distance(latticePoint.displayLocation, e.location)

      if (distance <= scaledHitRadius) {

        resultIndex = index
        break
      }
    }

    return resultIndex
  }

  protected getMouseOverLatticeEdgeIndex(e: ToolPointerEvent, ctx: SubToolContext): LatticeEdge {

    let hitedEdge: LatticeEdge = null

    const scaledHitRadius = ctx.getViewScaledLength(ctx.drawStyle.latticePointHitRadius)

    for (const edge of this.latticeEdges) {

      const distance = Logic_Points.pointToLineSegment_SorroundingDistance(
        edge.latticePointFrom.displayLocation,
        edge.latticePointTo.displayLocation,
        e.location)

      if (distance <= scaledHitRadius) {

        hitedEdge = edge
        break
      }
    }

    return hitedEdge
  }

  keydown(key: string, commandID: ShortcutCommandID, ctx: SubToolContext): boolean { // @override

    if (!ctx.tool.isModalToolRunning()) {

      if (ctx.isShiftKeyPressing()) {

        if (commandID == ShortcutCommandID.edit_grabMove) {

          this.startLatticeAffineTransform(TransformType.grabMove, false, ctx)
          return true
        }

        if (commandID == ShortcutCommandID.edit_rotate) {

          this.startLatticeAffineTransform(TransformType.rotate, false, ctx)
          return true
        }

        if (commandID == ShortcutCommandID.edit_scale) {

          this.startLatticeAffineTransform(TransformType.scale, false, ctx)
          return true
        }
      }
    }
    else {

      if (commandID == ShortcutCommandID.edit_fix) {

        this.endTransform(ctx)
        return true
      }

      if (commandID == ShortcutCommandID.edit_cancel) {

        this.cancelTransform(ctx)
        return true
      }

      if (this.handleKeyDownForTransformModifying({
        g: true, r: true, s: true, x: true, y: true, zero: true, one: true, shift: true,
        key, ctx
      })) {

        return true;
      }
    }

    return false
  }

  handleKeyDownForTransformModifying({
    g = false, r = false, s = false, x = false, y = false, zero = false, one = false, shift = false,
    key, ctx
  }: HandleKeyDownForTransformModifyingOption): boolean {

    if (g && key == 'g') {

      this.startLatticeAffineTransform(TransformType.grabMove, true, ctx)
      return true
    }
    else if (r && key == 'r') {

      this.startLatticeAffineTransform(TransformType.rotate, true, ctx)
      return true
    }
    else if (s && key == 's') {

      this.startLatticeAffineTransform(TransformType.scale, true, ctx)
      return true
    }
    else if (x && key == 'x') {

      if (this.transformLockType != TransformLockType.x) {

        this.transformLockType = TransformLockType.x
      }
      else {

        this.transformLockType = TransformLockType.none
      }

      this.processLatticePointMouseMove(ctx)
      this.processTransform(ctx)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }
    else if (y && key == 'y') {

      if (this.transformLockType != TransformLockType.y) {

        this.transformLockType = TransformLockType.y
      }
      else {

        this.transformLockType = TransformLockType.none
      }

      this.processLatticePointMouseMove(ctx)
      this.processTransform(ctx)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }
    else if (zero && key == '0') {

      if (this.transformModifyType != TransformModifyType.zero) {

        this.transformModifyType = TransformModifyType.zero
      }
      else {

        this.transformModifyType = TransformModifyType.none
      }

      this.processLatticePointMouseMove(ctx)
      this.processTransform(ctx)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }
    else if (one && key == '1') {

      if (this.transformModifyType != TransformModifyType.one) {

        this.transformModifyType = TransformModifyType.one
      }
      else {

        this.transformModifyType = TransformModifyType.none
      }

      this.processLatticePointMouseMove(ctx)
      this.processTransform(ctx)

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }
    else if (shift && key == 'Shift') {

      if (this.transformModifyType != TransformModifyType.slow) {

        this.transformModifyType = TransformModifyType.slow
      }
      else {

        this.transformModifyType = TransformModifyType.none
      }

      ctx.setRedrawCurrentLayer()
      ctx.setRedrawEditorWindow()
    }

    return false
  }

  mouseUp(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.tool.isModalToolRunning()) {

      if (e.isLeftButtonReleased) {

        if (this.latticeState == LatticeStateID.modified) {

          this.endTransform(ctx)
        }
      }
    }
  }

  protected processLatticePointMouseMove(ctx: SubToolContext) {

    this.transformCalculator.transformLockType = this.transformLockType
    this.transformCalculator.transformModifyType = this.transformModifyType
    this.transformCalculator.processLatticePointMouseMove(this.latticePoints, ctx)

    this.latticeState = LatticeStateID.modified
  }

  // Operation process implementation (Override methods)

  protected processTransform(_ctx: SubToolContext) { // @virtual

  }

  protected executeCommand(_ctx: SubToolContext) { // @virtual
  }

  // Drawing

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    if (this.latticeState == LatticeStateID.invalid) {
      return
    }

    if (this.latticeState == LatticeStateID.initialState) {

      this.setLatticeLocation(ctx)
    }

    this.calculateLatticeRectangleDisplayLocation(ctx)

    this.drawLatticeRectangle(ctx, drawing)
    this.drawLatticePoints(ctx, drawing)
  }

  private operatorCurosrLineDash = [2.0, 2.0]
  private operatorCurosrLineDashScaled = [0.0, 0.0]
  private operatorCurosrLineDashNone = []

  protected drawLatticeRectangle(ctx: SubToolContext, drawing: SubToolDrawingContext) {

    if (this.latticePoints == null) {
      return
    }

    drawing.render.setStrokeColorV(drawing.style.modalToolSelectedAreaLineColor)
    drawing.render.setStrokeWidth(ctx.getViewScaledLength(1.0))

    // Set dash
    const viewScale = ctx.getViewScaledLength(1.0)
    this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale
    this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale

    // Draw lattice line

    drawing.render.setStrokeColorV(drawing.style.modalToolSelectedAreaLineColor)

    for (const edge of this.latticeEdges) {

      if (edge.mouseOver) {

        drawing.render.setStrokeWidth(ctx.getViewScaledLength(3.0))
        drawing.render.setLineDash(this.operatorCurosrLineDashNone)
      }
      else {

        drawing.render.setStrokeWidth(ctx.getViewScaledLength(1.0))
        drawing.render.setLineDash(this.operatorCurosrLineDashScaled)
      }

      drawing.render.beginPath()

      drawing.render.moveToV(edge.latticePointFrom.displayLocation)
      drawing.render.lineToV(edge.latticePointTo.displayLocation)

      drawing.render.stroke()
    }

    drawing.render.setLineDash(this.operatorCurosrLineDashNone)
  }

  protected drawLatticePoints(ctx: SubToolContext, drawing: SubToolDrawingContext) {

    // Draw lattice

    for (const latticePoint of this.latticePoints) {

      this.drawLatticePoint(latticePoint, 1.0, ctx, drawing)
    }

    if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticePoint) {

      const latticePoint = this.latticePoints[this.mouseOver_PartIndex]

      this.drawLatticePoint(latticePoint, 3.0, ctx, drawing)
    }
  }

  drawLatticePoint(latticePoint: LatticePoint, lineWidth: float, ctx: SubToolContext, drawing: SubToolDrawingContext) {

    drawing.render.beginPath()

    drawing.render.setStrokeColorV(drawing.style.modalToolSelectedAreaLineColor)
    drawing.render.setStrokeWidth(ctx.getViewScaledLength(lineWidth))

    drawing.render.circle(
      latticePoint.displayLocation[0], latticePoint.displayLocation[1]
      , ctx.getViewScaledLength(drawing.style.latticePointRadius)
    )

    drawing.render.stroke()
  }

  // Calculation for basic rectangle method

  protected calculateLatticeRectangleDisplayLocation(ctx: SubToolContext) {

    const paddingScale = ctx.getViewScaledLength(ctx.drawStyle.latticePointPadding)

    const angle = this.calculateLatticeRectangleAngle(this.dLocation)

    mat4.identity(this.offsetMatrix)
    mat4.rotateZ(this.offsetMatrix, this.offsetMatrix, angle)

    for (const latticePoint of this.latticePoints) {

      vec3.set(this.offsetScale,
        latticePoint.displayBaseLocationOffset[0] + latticePoint.displayOffset[0] * paddingScale,
        latticePoint.displayBaseLocationOffset[1] + latticePoint.displayOffset[1] * paddingScale,
        0.0
      )
      // vec3.set(this.offsetScale,
      //   latticePoint.displayBaseLocationOffset[0],
      //   latticePoint.displayBaseLocationOffset[1],
      //   0.0
      // )

      vec3.transformMat4(this.offset, this.offsetScale, this.offsetMatrix)
      vec3.add(latticePoint.displayLocation, latticePoint.location, this.offset)
    }
  }

  protected calculateLatticeRectangleAngle(outDirection: Vec3) {

    vec3.subtract(outDirection, this.latticePoints[1].location, this.latticePoints[0].location)
    const angle = Math.atan2(outDirection[1], outDirection[0])

    return angle
  }

  protected calculateLatticeRectangleWidth(outDirection: Vec3) {

    vec3.subtract(outDirection, this.latticePoints[0].location, this.latticePoints[1].location)
    const length = vec3.length(outDirection)

    return length
  }

  protected calculateLatticeRectangleHeight(outDirection: Vec3) {

    vec3.subtract(outDirection, this.latticePoints[0].location, this.latticePoints[3].location)
    const length = vec3.length(outDirection)

    return length
  }

  protected existsLatticeRectangleArea(): boolean {

    return this.bound_contentArea.isValidArea()
  }
}

export interface ITool_Transform_Lattice_Calculator {

  transformLockType: TransformLockType
  transformModifyType: TransformModifyType

  prepare(ctx: SubToolContext)
  processLatticePointMouseMove(latticePoints: LatticePoint[], ctx: SubToolContext)
}

export class GrabMove_Calculator implements ITool_Transform_Lattice_Calculator {

  transformLockType =  TransformLockType.none
  transformModifyType = TransformModifyType.none

  integerValueOnly = false

  private lastLocation = vec3.create()
  private moveAmount = vec3.create()
  private dLocation = vec3.create()

  prepare(ctx: SubToolContext) { // @implements ITool_Transform_Lattice_Calculator

    vec3.copy(this.lastLocation, ctx.mouseCursorLocation)
    vec3.set(this.moveAmount, 0.0, 0.0, 0.0)
  }

  processLatticePointMouseMove(latticePoints: LatticePoint[], ctx: SubToolContext) { // @implements ITool_Transform_Lattice_Calculator

    vec3.subtract(this.dLocation, ctx.mouseCursorLocation, this.lastLocation)

    if (this.transformModifyType == TransformModifyType.slow) {

      vec3.scale(this.dLocation, this.dLocation, 0.25)
    }

    vec3.add(this.moveAmount, this.moveAmount, this.dLocation)
    vec3.copy(this.lastLocation, ctx.mouseCursorLocation)

    for (const latticePoint of latticePoints) {

      let moveAmountX = 0.0
      let moveAmountY = 0.0

      if (latticePoint.latticePointEditType == LatticePointEditTypeID.horizontalOnly) {

        moveAmountX =  this.moveAmount[0]
      }
      else if (latticePoint.latticePointEditType == LatticePointEditTypeID.verticalOnly) {

        moveAmountY = this.moveAmount[1]
      }
      else if (latticePoint.latticePointEditType == LatticePointEditTypeID.allDirection) {

        if (this.transformLockType != TransformLockType.y) {

          moveAmountX =  this.moveAmount[0]
        }

        if (this.transformLockType != TransformLockType.x) {

          moveAmountY = this.moveAmount[1]
        }
      }

      latticePoint.location[0] = latticePoint.baseLocation[0] + moveAmountX
      latticePoint.location[1] = latticePoint.baseLocation[1] + moveAmountY

      if (this.integerValueOnly) {

        latticePoint.location[0] = Math.floor(latticePoint.location[0])
        latticePoint.location[1] = Math.floor(latticePoint.location[1])
      }
    }
  }
}

export class Rotate_Calculator implements ITool_Transform_Lattice_Calculator {

  transformLockType: TransformLockType.none
  transformModifyType = TransformModifyType.none

  private lastAngle = 0.0
  private rotationAmount = 0.0

  private dLocation = vec3.create()
  private direction = vec3.create()
  private centerLocation = vec3.create()
  private rotationMatrix = mat4.create()

  prepare(ctx: SubToolContext) { // @implements ITool_Transform_Lattice_Calculator

    this.lastAngle = this.calulateInputAngle(ctx)
    this.rotationAmount = 0.0
  }

  private calulateInputAngle(ctx: SubToolContext): float {

    vec3.subtract(this.direction, ctx.mouseCursorLocation, ctx.getOperationOriginLocation())
    const angle = Math.atan2(this.direction[1], this.direction[0])

    return angle
  }

  processLatticePointMouseMove(latticePoints: LatticePoint[], ctx: SubToolContext) { // @implements ITool_Transform_Lattice_Calculator

    const inputedAngle = this.calulateInputAngle(ctx)
    let movedAngle = inputedAngle - this.lastAngle
    if (movedAngle >= Math.PI) {
      movedAngle -= Math.PI * 2
    }
    if (movedAngle <= -Math.PI) {
      movedAngle += Math.PI * 2
    }

    if (this.transformModifyType == TransformModifyType.slow) {

      movedAngle *= 0.25
    }

    this.rotationAmount += movedAngle
    this.lastAngle = inputedAngle

    vec3.copy(this.centerLocation, ctx.getOperationOriginLocation())
    vec3.scale(this.dLocation, this.centerLocation, -1.0)

    mat4.identity(this.rotationMatrix)
    mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation)
    mat4.rotateZ(this.rotationMatrix, this.rotationMatrix, this.rotationAmount)
    mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation)

    for (const latticePoint of latticePoints) {

      vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix)
    }
  }
}

export class Scale_Calculator implements ITool_Transform_Lattice_Calculator {

  transformLockType: TransformLockType.none
  transformModifyType = TransformModifyType.none

  integerValueOnly = false

  private initialDistance = 0.0
  private lastDistance = 0.0
  private scalingAmount = 0.0

  private dLocation = vec3.create()
  private direction = vec3.create()
  private centerLocation = vec3.create()
  private rotationMatrix = mat4.create()
  private scaling = vec3.create()

  prepare(ctx: SubToolContext) { // @implements ITool_Transform_Lattice_Calculator

    this.initialDistance = this.calulateDistance(ctx)

    if (this.initialDistance == 0.0) {

      this.initialDistance = 1.0
    }

    this.lastDistance = this.initialDistance
    this.scalingAmount = 1.0
  }

  calulateDistance(ctx: SubToolContext): float {

    vec3.subtract(this.direction, ctx.mouseCursorLocation, ctx.getOperationOriginLocation())

    const distance = vec3.length(this.direction)

    return distance
  }

  processLatticePointMouseMove(latticePoints: LatticePoint[], ctx: SubToolContext) { // @implements ITool_Transform_Lattice_Calculator

    if (latticePoints.length == 0) {
      return
    }

    const distance = this.calulateDistance(ctx)
    let movedDistance = distance - this.lastDistance

    if (this.transformModifyType == TransformModifyType.slow) {

      movedDistance *= 0.25
    }

    this.scalingAmount += movedDistance / this.initialDistance
    this.lastDistance = distance

    vec3.set(this.scaling, 1.0, 1.0, 1.0)

    const scale = this.scalingAmount

    const firstLatticePoint = latticePoints[0]
    if (firstLatticePoint.latticePointEditType == LatticePointEditTypeID.horizontalOnly) {

      this.scaling[0] = scale
    }
    else if (firstLatticePoint.latticePointEditType == LatticePointEditTypeID.verticalOnly) {

      this.scaling[1] = scale
    }
    else if (firstLatticePoint.latticePointEditType == LatticePointEditTypeID.allDirection) {

      if (this.transformLockType == TransformLockType.none) {

        vec3.set(this.scaling, scale, scale, 1.0)
      }
      else if (this.transformLockType == TransformLockType.x) {

        if (this.transformModifyType == TransformModifyType.zero) {
          vec3.set(this.scaling, 0.0, 1.0, 1.0)
        }
        else {
          vec3.set(this.scaling, scale, 1.0, 1.0)
        }
      }
      else if (this.transformLockType == TransformLockType.y) {

        if (this.transformModifyType == TransformModifyType.zero) {
          vec3.set(this.scaling, 1.0, 0.0, 1.0)
        }
        else {
          vec3.set(this.scaling, 1.0, scale, 1.0)
        }
      }
    }

    vec3.copy(this.centerLocation, ctx.getOperationOriginLocation())
    vec3.scale(this.dLocation, this.centerLocation, -1.0)

    mat4.identity(this.rotationMatrix)
    mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation)
    mat4.scale(this.rotationMatrix, this.rotationMatrix, this.scaling)
    mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation)

    for (const latticePoint of latticePoints) {

      vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix)
    }
  }
}
