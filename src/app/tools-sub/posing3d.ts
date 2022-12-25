import { SubToolContext, SubToolDrawingContext } from '../context'
import { DirectionInputData, InputSideID, PosingData, VectorPoint, VectorStroke } from '../document-data'
import { VectorStrokeLogic } from '../document-logic'
import { float, int, Maths } from '../common-logics'
import { ModalToolBase, ToolPointerEvent } from '../tool'

export class Tool_Posing3d_ToolBase extends ModalToolBase {

  inputOptionButtonCount = 1

  editPoint: VectorPoint = null
  editLine: VectorStroke = null

  getOptionButtonState(_buttonIndex: int, _ctx: SubToolContext): InputSideID { // @virtual

    return InputSideID.none
  }

  protected getInputData(_ctx: SubToolContext): DirectionInputData { // @virtual

    throw new Error('ERROR 1001:Tool_Posing3d_ToolBase: not implemented!')
  }

  protected copyInputLocationToPoint(e: ToolPointerEvent) {

    if (this.editPoint == null) {

      this.editPoint = new VectorPoint()
    }

    vec3.copy(this.editPoint.location, e.location)
  }

  protected copyInputLocationToLine(e: ToolPointerEvent) {

    if (this.editLine == null) {

      this.editLine = new VectorStroke()
    }

    const point = new VectorPoint()
    vec3.copy(point.location, e.location)
    vec3.copy(point.adjustingLocation, e.location)

    this.editLine.points.push(point)
  }
}

export class Tool_Posing3d_PointInputToolBase extends Tool_Posing3d_ToolBase {

  private tempTargetLocation = vec3.create()

  inputOptionButtonCount = 1

  optionButton_Click(buttonIndex: int, ctx: SubToolContext): boolean { // @override

    if (ctx.currentPosingData != null) {

      const inputData = this.getInputData(ctx)

      if (buttonIndex == 0) {

        if (inputData.inputSideID == InputSideID.front) {
          inputData.inputSideID = InputSideID.back
        }
        else {
          inputData.inputSideID = InputSideID.front
        }

        return true
      }
    }

    return false
  }

  getOptionButtonState(_buttonIndex: int, ctx: SubToolContext): InputSideID { // @override

    if (ctx.currentPosingData != null) {

      const inputData = this.getInputData(ctx)

      return inputData.inputSideID
    }
    else {

      return InputSideID.none
    }
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.currentPosingData == null) {
      return
    }

    if (!e.isLeftButtonPressing) {
      return
    }

    this.execute(e, ctx)

    ctx.tool.startModalTool(this.subtoolID)
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.currentPosingData == null) {
      return
    }

    ctx.setRedrawEditorWindow()

    if (!e.isLeftButtonPressing) {
      return
    }

    this.execute(e, ctx)
  }

  mouseUp(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.tool.endModalTool()
  }

  protected execute(e: ToolPointerEvent, ctx: SubToolContext) {

    const inputData = this.getInputData(ctx)
    ctx.posing3DLogic.calculateInputLocation3D(
      this.tempTargetLocation
      , e.location
      , inputData.inputSideID
      , inputData
      , ctx.currentPosingData
      , ctx.posing3DView
    )

    this.executeCommand(
      this.tempTargetLocation,
      e.location,
      e,
      ctx
    )
  }

  protected executeCommand(_inputLocation: Vec3, _inputLocation2D: Vec3, _e: ToolPointerEvent, _ctx: SubToolContext) { // @virtual

    throw new Error('ERROR 1002:Tool_Posing3d_ToolBase: not implemented!')
  }
}

export class Tool_Posing3d_LineInputToolBase extends Tool_Posing3d_ToolBase {

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.currentPosingData == null) {
      return
    }

    if (!e.isLeftButtonPressing) {
      return
    }

    this.editLine = new VectorStroke()

    this.copyInputLocationToLine(e)

    ctx.tool.startModalTool(this.subtoolID)
}

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.currentPosingData == null) {
      return
    }

    if (this.editLine == null) {
      return
    }

    if (!e.isLeftButtonPressing) {
      return
    }

    ctx.setRedrawEditorWindow()

    this.copyInputLocationToLine(e)
  }

  mouseUp(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.tool.endModalTool()

    if (ctx.currentPosingData == null) {
      return
    }

    if (e.isLeftButtonReleased) {

      if (this.editLine == null) {
        return
      }

      VectorStrokeLogic.calculateParameters(this.editLine)

      if (this.editLine.points.length <= 1 || this.editLine.runtime.totalLength < 1) {
        return
      }

      this.calculateHeadLoacation(ctx)

      return
    }
  }

  protected calculateHeadLoacation(_ctx: SubToolContext) { // @virtual
  }
}

enum JointPartInputMode {

  none, directionInput, rollInput
}

export class Tool_Posing3d_JointPartInputToolBase extends Tool_Posing3d_PointInputToolBase {

  protected enableDirectionInput = true
  protected enableRollInput = true

  protected jointPartInputMode = JointPartInputMode.none
  protected mouseOnInputMode = JointPartInputMode.none
  protected inputLocation = vec3.create()
  protected relativeMouseLocation = vec3.create()
  protected rollInputRelativeLocation = vec3.create()
  protected rollInputCenterLocation = vec3.create()
  protected rollInputLocation = vec3.fromValues(0.0, 0.0, 0.0)
  protected inputAdditionalAngle = 0.0
  protected inputStartAngle = 0.0
  protected inputEndAngle = 0.0
  protected inputStartLocation = vec3.create()
  protected beforeEditMatrix = mat4.create()
  protected beforeEditAngle = 0.0

  protected tmpMatrix = mat4.create()
  protected tmpVec3 = vec3.create()
  protected vecZ = vec3.create()
  protected direction = vec3.create()
  protected location3D = vec3.create()
  protected location3DTo = vec3.create()
  protected location2D = vec3.create()
  protected location2DTo = vec3.create()
  protected location2DHead = vec3.create()
  protected partCenterLocation = vec3.create()
  protected rollInputCenterLocation2D = vec3.create()
  protected locationFront = vec3.create()
  protected locationBack = vec3.create()

  protected getInputModeForMouseLocation(resultRelativeMouseLocation: Vec3, ctx: SubToolContext): JointPartInputMode {

    const inputData = this.getInputData(ctx)

    const circleRadius = this.getBoneInputCircleRadius(ctx) * ctx.drawStyle.posing3DBoneInputCircleHitRadius

    if (!inputData.inputDone) {

      return JointPartInputMode.directionInput
    }
    else {

      if (inputData.inputDone && inputData.directionInputDone) {

        ctx.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, inputData.inputLocation, ctx.currentPosingData)
        const distance = vec3.distance(ctx.mouseCursorLocation, this.location2D)

        if (resultRelativeMouseLocation != null) {

          vec3.subtract(resultRelativeMouseLocation, this.location2D, ctx.mouseCursorLocation)
        }

        if (distance <= circleRadius) {

          return JointPartInputMode.directionInput
        }
        else {

          return JointPartInputMode.rollInput
        }
      }
    }

    return JointPartInputMode.none
  }

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.currentPosingData == null) {
      return
    }

    if (!e.isLeftButtonPressing) {
      return
    }

    ctx.setRedrawEditorWindow()

    const jointPartInputMode = this.getInputModeForMouseLocation(this.relativeMouseLocation, ctx)

    if (jointPartInputMode == JointPartInputMode.rollInput) {

      const inputData = this.getInputData(ctx)
      ctx.posing3DLogic.calculateInputLocation3D(
        inputData.rollInputLocation
        , e.location
        , InputSideID.front
        , inputData
        , ctx.currentPosingData
        , ctx.posing3DView
      )

      this.calculateInputParams(inputData.rollInputLocation, inputData.matrix)
      this.inputStartAngle = this.calculateAngle(inputData.rollInputLocation, inputData.matrix)
      this.beforeEditAngle = inputData.rollInputAngle
      mat4.copy(this.beforeEditMatrix, inputData.matrix)
      vec3.copy(this.inputStartLocation, inputData.rollInputLocation)
    }

    if (jointPartInputMode != JointPartInputMode.none) {

      this.jointPartInputMode = jointPartInputMode

      this.execute(e, ctx)

      ctx.tool.startModalTool(this.subtoolID)
    }
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.currentPosingData == null) {
      return
    }

    const jointPartInputMode = this.getInputModeForMouseLocation(null, ctx)

    if (jointPartInputMode != this.mouseOnInputMode) {
      this.mouseOnInputMode = jointPartInputMode
      ctx.setRedrawEditorWindow()
    }

    if (!e.isLeftButtonPressing) {
      return
    }

    if (this.jointPartInputMode == JointPartInputMode.directionInput) {

      this.execute(e, ctx)
    }
    else if (this.jointPartInputMode == JointPartInputMode.rollInput) {

      const inputData = this.getInputData(ctx)
      ctx.posing3DLogic.calculateInputLocation3D(
        inputData.rollInputLocation
        , e.location
        , InputSideID.front
        , inputData
        , ctx.currentPosingData
        , ctx.posing3DView
      )

      this.execute(e, ctx)
    }
  }

  mouseUp(_e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.tool.endModalTool()

    this.jointPartInputMode = JointPartInputMode.none

    ctx.setRedrawWebGLWindow()
    ctx.setRedrawEditorWindow()
  }

  protected getBoneInputCircleRadius(ctx: SubToolContext): float {

    return ctx.getViewScaledLength(ctx.drawStyle.posing3DBoneInputCircleRadius)
  }

  onDrawEditor(ctx: SubToolContext, drawing: SubToolDrawingContext) { // @override

    const inputData = this.getInputData(ctx)

    if (!inputData.inputDone) {
      return
    }

    const circleRadius = this.getBoneInputCircleRadius(ctx)

    Maths.copyTranslation(this.partCenterLocation, inputData.matrix)

    if (this.enableDirectionInput && inputData.directionInputDone) {

      ctx.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, inputData.inputLocation, ctx.currentPosingData)
      const strokeWidth = (this.mouseOnInputMode == JointPartInputMode.directionInput) ? 4.0 : 2.0
      drawing.drawCircle(this.location2D, circleRadius, ctx.getViewScaledLength(strokeWidth), drawing.style.posing3DBoneHeadColor)
    }

    if (this.jointPartInputMode == JointPartInputMode.directionInput) {

      ctx.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, this.partCenterLocation, ctx.currentPosingData)

      vec3.subtract(this.direction, inputData.inputLocation, this.partCenterLocation)
      vec3.scale(this.direction, vec3.normalize(this.direction, this.direction), inputData.hitTestSphereRadius)
      vec3.add(this.location3DTo, this.partCenterLocation, this.direction)
      ctx.posing3DView.calculate2DLocationFrom3DLocation(this.location2DHead, this.location3DTo, ctx.currentPosingData)

      ctx.posing3DView.calculate2DLocationFrom3DLocation(this.location2DTo, inputData.inputLocation, ctx.currentPosingData)

      drawing.drawLine(this.location2D, this.location2DHead, ctx.getViewScaledLength(4.0), drawing.style.posing3DBoneGrayColor)
      drawing.drawLine(this.location2DHead, this.location2DTo, ctx.getViewScaledLength(2.0), drawing.style.posing3DBoneGrayColor)

      drawing.drawCircle(this.location2D, ctx.getViewScaledLength(2.0), ctx.getViewScaledLength(4.0), drawing.style.posing3DBoneGrayColor)
      drawing.drawCircle(this.location2DHead, ctx.getViewScaledLength(2.0), ctx.getViewScaledLength(4.0), drawing.style.posing3DBoneGrayColor)
    }

    if (this.jointPartInputMode == JointPartInputMode.rollInput) {

      // const depth = ctx.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, this.rollInputCenterLocation, ctx.currentPosingData)

      vec3.transformMat4(this.location3D, vec3.set(this.tmpVec3, 1.0, 0.0, 0.0), this.beforeEditMatrix)

      mat4.invert(this.tmpMatrix, this.beforeEditMatrix)
      vec3.transformMat4(this.location3D, inputData.rollInputLocation, this.tmpMatrix)

      const unitAngle = 5
      for (let count = 0; count <= 360; count += unitAngle) {

        this.calculateRingRotated2DLocation(this.location2D,
          this.location3D, this.beforeEditMatrix, Math.PI * 2 * count / 360, ctx.currentPosingData, ctx, this.tmpVec3)

        this.calculateRingRotated2DLocation(this.location2DTo,
          this.location3D, this.beforeEditMatrix, Math.PI * 2 * (count + unitAngle) / 360, ctx.currentPosingData, ctx, this.tmpVec3)

        ctx.posing3DLogic.calculateInputLocation3DForDoubleSide(
          this.locationFront,
          this.locationBack,
          this.location2D,
          this.partCenterLocation,
          inputData.hitTestSphereRadius,
          ctx.currentPosingData,
          ctx.posing3DView
        )

        if (vec3.distance(this.locationFront, this.tmpVec3) < vec3.distance(this.locationBack, this.tmpVec3)) {

          drawing.drawLine(this.location2D, this.location2DTo, ctx.getViewScaledLength(1.0), drawing.style.posing3DHelperGrayColor1)
        }
        else {

          drawing.drawLine(this.location2D, this.location2DTo, ctx.getViewScaledLength(1.0), drawing.style.posing3DHelperGrayColor2)
        }
      }

      {
        const piePoints: number[][] = []
        ctx.posing3DView.calculate2DLocationFrom3DLocation(this.rollInputCenterLocation2D, this.rollInputCenterLocation, ctx.currentPosingData)
        piePoints.push([this.rollInputCenterLocation2D[0], this.rollInputCenterLocation2D[1], 0.0])

        this.calculateRingRotated2DLocation(this.location2D, this.location3D, this.beforeEditMatrix, 0.0, ctx.currentPosingData, ctx, this.tmpVec3)
        drawing.beginPath(this.location2D)
        for (let count = 0; count <= 100; count += 10) {

          this.calculateRingRotated2DLocation(this.location2D,
            this.location3D, this.beforeEditMatrix, -this.inputAdditionalAngle * count / 100, ctx.currentPosingData, ctx, this.tmpVec3)

          drawing.lineTo(this.location2D)

          piePoints.push([this.location2D[0], this.location2D[1], 0.0])
        }
        drawing.stroke(ctx.getViewScaledLength(3.0), drawing.style.posing3DHelperGrayColor2)

        piePoints.push([this.rollInputCenterLocation2D[0], this.rollInputCenterLocation2D[1], 0.0])
        this.fillArea(piePoints, drawing.style.posing3DHelperGrayColor2, drawing)

        drawing.drawLine(this.location2D, this.rollInputCenterLocation2D, ctx.getViewScaledLength(1.0), drawing.style.posing3DHelperGrayColor1)
      }

      ctx.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, this.rollInputCenterLocation, ctx.currentPosingData)
      ctx.posing3DView.calculate2DLocationFrom3DLocation(this.location2DTo, inputData.rollInputLocation, ctx.currentPosingData)
      drawing.drawLine(this.location2D, this.location2DTo, ctx.getViewScaledLength(3.0), drawing.style.posing3DBoneGrayColor)
      drawing.drawCircle(this.location2DTo, ctx.getViewScaledLength(5.0), ctx.getViewScaledLength(4.0), drawing.style.posing3DBoneGrayColor)

      // drawEnv.style.posing3DBoneForwardColor
    }
  }

  private fillArea(frontPoints: number[][], color: Vec4, drawing: SubToolDrawingContext) {

    if (frontPoints.length <= 2) {
      return
    }

    drawing.beginPath()
    drawing.moveTo(frontPoints[0])

    for (let index = 1; index < frontPoints.length; index++) {

      drawing.lineTo(frontPoints[index])
    }

    drawing.fill(color)
  }

  private calculateInputParams(location: Vec3, parentMatrix: Mat4) {

    mat4.invert(this.tmpMatrix, parentMatrix)
    vec3.transformMat4(this.rollInputRelativeLocation, location, this.tmpMatrix)

    vec3.set(this.vecZ, 0.0, 0.0, this.rollInputRelativeLocation[2])
    vec3.transformMat4(this.rollInputCenterLocation, this.vecZ, parentMatrix)
  }

  private calculateAngle(location: Vec3, parentMatrix: Mat4): float {

    mat4.invert(this.tmpMatrix, parentMatrix)
    vec3.transformMat4(this.tmpVec3, location, this.tmpMatrix)

    return Math.atan2(this.tmpVec3[1], this.tmpVec3[0])
  }

  private calculateRingRotated3DLocation(result: Vec3, location: Vec3, parentMatrix: Mat4, angle: float) {

    mat4.rotateZ(this.tmpMatrix, parentMatrix, angle)
    vec3.transformMat4(result, location, this.tmpMatrix)
  }

  private calculateRingRotated2DLocation(result: Vec3, location: Vec3, parentMatrix: Mat4, angle: float, posingData: PosingData, ctx: SubToolContext, tempVec3: Vec3): float {

    this.calculateRingRotated3DLocation(tempVec3, location, parentMatrix, angle)
    const depth = ctx.posing3DView.calculate2DLocationFrom3DLocation(result, this.tmpVec3, posingData)

    return depth
  }

  protected execute(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    vec3.add(this.location2D, e.location, this.relativeMouseLocation)

    const inputData = this.getInputData(ctx)
    ctx.posing3DLogic.calculateInputLocation3D(
      this.inputLocation
      , this.location2D
      , InputSideID.front
      , inputData
      , ctx.currentPosingData
      , ctx.posing3DView
    )

    this.executeCommand(this.inputLocation, this.location2D, e, ctx)
  }

  protected executeCommand(inputLocation: Vec3, inputLocation2D: Vec3, _e: ToolPointerEvent, ctx: SubToolContext) { // @override

    const inputData = this.getInputData(ctx)

    // Set inputs
    if (this.jointPartInputMode == JointPartInputMode.directionInput) {

      vec3.copy(inputData.inputLocation, inputLocation)
      vec3.copy(inputData.inputLocation2D, inputLocation2D)
      inputData.inputDone = true
      inputData.directionInputDone = true
    }
    else if (this.jointPartInputMode == JointPartInputMode.rollInput) {

      this.calculateInputParams(inputData.rollInputLocation, this.beforeEditMatrix)

      this.inputEndAngle = this.calculateAngle(inputData.rollInputLocation, this.beforeEditMatrix)
      this.inputAdditionalAngle = Maths.getRoundedAngle(this.inputEndAngle - this.inputStartAngle)

      inputData.rollInputAngle = this.beforeEditAngle + this.inputAdditionalAngle

      inputData.rollInputDone = true
    }

    // Calculate
    ctx.posing3DLogic.calculateAll(ctx.currentPosingData, ctx.currentPosingModel, ctx.posing3DView)

    this.updateAdditionalPart(inputData.inputLocation, ctx)

    ctx.setRedrawWebGLWindow()
    ctx.setRedrawEditorWindow()
    ctx.setRedrawRibbonUI()
  }

  protected updateAdditionalPart(_inputLocation: Vec3, _ctx: SubToolContext) { // @virtual

  }
}

// Each tools

export class Tool_Posing3d_LocateHead extends Tool_Posing3d_LineInputToolBase {

  helpText = 'マウスでクリックすると頭の位置が決まり、さらにドラッグするとスケールが変更できます。<br />次の操作に移るには画面右のパネルの「頭の向き」をクリックします。'

  inputOptionButtonCount = 0

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
    )
  }

  tempVec3 = vec3.fromValues(0.0, 0.0, 0.0)
  centerLocation = vec3.fromValues(0.0, 0.0, 0.0)
  centerLocation3D = vec3.fromValues(0.0, 0.0, 0.0)
  subLocation = vec3.fromValues(0.0, 0.0, 0.0)
  inputRadius = 0.0
  inputRadiusAdjustRate = 1.0
  minInputRadius = 5.0

  mouseDown(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.currentPosingData == null) {
      return
    }

    if (!e.isLeftButtonPressing) {
      return
    }

    this.calculateHeadLoacation(ctx)

    ctx.tool.startModalTool(this.subtoolID)
  }

  prepareModal(e: ToolPointerEvent, ctx: SubToolContext): boolean { // @override

    if (ctx.currentPosingData == null) {
      return false
    }

    vec3.copy(this.centerLocation, e.location)
    this.inputRadius = this.minInputRadius

    return true
  }

  mouseMove(e: ToolPointerEvent, ctx: SubToolContext) { // @override

    if (ctx.currentPosingData == null) {
      return
    }

    if (!e.isLeftButtonPressing || !ctx.tool.isModalToolRunning()) {
      return
    }

    vec3.subtract(this.subLocation, e.location, this.centerLocation)
    this.inputRadius = vec3.length(this.subLocation)
    if (this.inputRadius < this.minInputRadius) {

      this.inputRadius = this.minInputRadius
    }

    this.calculateHeadLoacation(ctx)
  }

  mouseUp(_e: ToolPointerEvent, ctx: SubToolContext) { // @override

    ctx.tool.endModalTool()

    if (ctx.currentPosingData == null) {
      return
    }

    if (!ctx.tool.isModalToolRunning()) {
      return
    }

    ctx.tool.endModalTool()
  }

  protected calculateHeadLoacation(ctx: SubToolContext) {

    /*
    // Center of head sphere
    //let locationCountSum = 0.0
    vec3.set(this.centerLocationSum, 0.0, 0.0, 0.0)
    //let lastLength = 0.0
    let totalCount = 0.0
    for (let point of this.editLine.points) {

        //let segmentLength = point.totalLength - lastLength
        //vec3.scale(this.tempVec3, point.location, segmentLength / this.editLine.totalLength)
        //vec3.add(this.centerLocationSum, this.centerLocationSum, this.tempVec3)
        //lastLength = point.totalLength

        vec3.add(this.centerLocationSum, this.centerLocationSum, point.location)
        totalCount += 1
    }

    if (totalCount > 0) {

        vec3.scale(this.centerLocationSum, this.centerLocationSum, 1 / totalCount)
    }
    */

    //console.log('頭の配置')
    //console.log(this.centerLocationSum)

    /*
    // Radius
    let radiusSum = 0.0
    //let lastLength2 = 0.0
    let totalCount2 = 0.0
    for (let point of this.editLine.points) {

        //let segmentLength = point.totalLength - lastLength2
        //vec3.subtract(this.subLocation, point.location, this.centerLocationSum)
        //radiusSum += vec3.length(this.subLocation) * (segmentLength / this.editLine.totalLength)
        //lastLength2 = point.totalLength

        vec3.subtract(this.subLocation, point.location, this.centerLocationSum)
        radiusSum += vec3.length(this.subLocation)
        totalCount2 += 1
    }

    if (totalCount2 > 0) {

        radiusSum *= 1 / totalCount2
    }

    //console.log(radiusSum)
    */

    const posingData = ctx.currentPosingData

    const radiusSum = this.inputRadius * this.inputRadiusAdjustRate

    // Expects model is located 2.0m away from camera at first, then calculate zoom rate as real3DViewHalfWidth
    //     headSphereSize[m] / real3DViewHalfWidth[m] = radiusSum[px] / real2DViewWidth[px]
    //     real3DViewHalfWidth[m] / headSphereSize[m] = real2DViewWidth[px] / radiusSum[px]
    //     real3DViewHalfWidth[m]                     = (real2DViewWidth[px] / radiusSum[px]) * headSphereSize[m]
    const real2DViewWidth = ctx.mainWindow.height / 2
    posingData.real3DViewHalfWidth = (real2DViewWidth / radiusSum) * ctx.currentPosingModel.headSphereSize
    posingData.real3DViewMeterPerPixel = posingData.real3DViewHalfWidth / real2DViewWidth

    // debug
    //posingData.viewZoomRate = ctx.currentPosingModel.headSphereSize / 50.0
    //this.centerLocationSum[0] = ctx.mainWindow.width / 2 + radiusSum
    //this.centerLocationSum[0] = ctx.mainWindow.width / 2
    //this.centerLocationSum[1] = ctx.mainWindow.height / 2
    //for (let point of this.editLine.points) {
    //    point.location[0] = this.centerLocationSum[0]
    //    point.adjustedLocation[0] = this.centerLocationSum[0]
    //}
    // debug

    //console.log(this.centerLocation)

    {
      const inputData = posingData.headLocationInputData

      ctx.posing3DView.calculate3DLocationFrom2DLocation(
        this.centerLocation3D
        , this.centerLocation
        , posingData.real3DModelDistance
        , posingData)

      vec3.copy(inputData.center, this.centerLocation3D)
      inputData.radius = radiusSum
      inputData.editLine = this.editLine
      inputData.inputDone = true
    }

    ctx.posing3DLogic.calculateHeadLocation(posingData, ctx.currentPosingModel)

    {
      const inputData = posingData.headRotationInputData

      vec3.set(this.tempVec3, 0.0, 0.0, inputData.hitTestSphereRadius)
      vec3.transformMat4(inputData.inputLocation, this.tempVec3, inputData.parentMatrix)
      ctx.posing3DView.calculate2DLocationFrom3DLocation(
        inputData.inputLocation2D, inputData.inputLocation, posingData
      )

      inputData.directionInputDone = true

      inputData.rollInputAngle = 0.0
      inputData.rollInputDone = false
    }

    ctx.setRedrawWebGLWindow()
    ctx.setRedrawRibbonUI()
  }
}

export class Tool_Posing3d_RotateHead extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '画面に表示された球のどこかをクリックすると頭の向きが決まります。<br />画面右のパネルで「手前」となっているボタンをクリックすると奥側を指定できるようになります。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && ctx.currentPosingData.headLocationInputData.inputDone
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData { // @override

    return ctx.currentPosingData.headRotationInputData
  }
}

export class Tool_Posing3d_LocateBody extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '半透明の球のどこかをクリックすると頭の向きを正面として胴が配置されます。<br />少し外側をクリックすると画面に対して真横を指定できます。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && ctx.currentPosingData.headLocationInputData.inputDone
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData { // @override

    return ctx.currentPosingData.bodyLocationInputData
  }
}

export class Tool_Posing3d_LocateHips extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '腰を配置します。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && ctx.currentPosingData.bodyLocationInputData.inputDone
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData { // @override

    return ctx.currentPosingData.hipsLocationInputData
  }
}

export class Tool_Posing3d_LocateLeftShoulder extends Tool_Posing3d_JointPartInputToolBase {

  helpText = 'ヒジの位置を指定して肩を配置します。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && (ctx.currentPosingData.bodyLocationInputData.inputDone || ctx.currentPosingData.bodyRotationInputData.inputDone)
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData { // @override

    return ctx.currentPosingData.leftShoulderLocationInputData
  }
}

export class Tool_Posing3d_LocateRightShoulder extends Tool_Posing3d_LocateLeftShoulder {

  protected getInputData(ctx: SubToolContext): DirectionInputData { // @override

    return ctx.currentPosingData.rightShoulderLocationInputData
  }
}

export class Tool_Posing3d_LocateLeftArm1 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = 'ヒジの位置を指定して上腕を配置します。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && (ctx.currentPosingData.bodyLocationInputData.inputDone || ctx.currentPosingData.bodyRotationInputData.inputDone)
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData { // @override

    return ctx.currentPosingData.leftArm1LocationInputData
  }

  protected updateAdditionalPart(_inputLocation: Vec3, ctx: SubToolContext) { // @override

    ctx.currentPosingData.leftShoulderLocationInputData.inputDone = true
  }
}

export class Tool_Posing3d_LocateRightArm1 extends Tool_Posing3d_LocateLeftArm1 {

  helpText = 'ヒジの位置を指定して上腕を配置します。'

  protected getInputData(ctx: SubToolContext): DirectionInputData {

    return ctx.currentPosingData.rightArm1LocationInputData
  }

  protected updateAdditionalPart(_inputLocation: Vec3, ctx: SubToolContext) { // @override

    ctx.currentPosingData.rightShoulderLocationInputData.inputDone = true
  }
}

export class Tool_Posing3d_LocateLeftLeg1 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = 'ヒザの位置を指定して上脚を配置します。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && ctx.currentPosingData.hipsLocationInputData.inputDone
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData {

    return ctx.currentPosingData.leftLeg1LocationInputData
  }

  protected executeCommandExt(ctx: SubToolContext) { // @override

    ctx.currentPosingData.leftShoulderLocationInputData.inputDone = true
  }
}

export class Tool_Posing3d_LocateRightLeg1 extends Tool_Posing3d_LocateLeftLeg1 {

  helpText = 'ヒザの位置を指定して上脚を配置します。'

  protected getInputData(ctx: SubToolContext): DirectionInputData {

    return ctx.currentPosingData.rightLeg1LocationInputData
  }
}

export class Tool_Posing3d_LocateLeftArm2 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '手首の位置を指定して下腕を配置します。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && ctx.currentPosingData.leftArm1LocationInputData.inputDone
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData {

    return ctx.currentPosingData.leftArm2LocationInputData
  }
}

export class Tool_Posing3d_LocateRightArm2 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '手首の位置を指定して下腕を配置します。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && ctx.currentPosingData.rightArm1LocationInputData.inputDone
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData {

    return ctx.currentPosingData.rightArm2LocationInputData
  }
}

export class Tool_Posing3d_LocateLeftLeg2 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '足首の位置を指定して下脚を配置します。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && ctx.currentPosingData.leftLeg1LocationInputData.inputDone
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData {

    return ctx.currentPosingData.leftLeg2LocationInputData
  }
}

export class Tool_Posing3d_LocateRightLeg2 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '足首の位置を指定して下脚を配置します。'

  isAvailable(ctx: SubToolContext): boolean { // @override

    return (
      ctx.isCurrentLayerPosingLayer()
      && ctx.currentPosingData != null
      && ctx.currentPosingData.rightLeg1LocationInputData.inputDone
    )
  }

  protected getInputData(ctx: SubToolContext): DirectionInputData {

    return ctx.currentPosingData.rightLeg2LocationInputData
  }
}
