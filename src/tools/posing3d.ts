import { int, float } from '../base/conversion';
import {
  Layer, VectorPoint,
  VectorStroke,
  InputSideID,
  DirectionInputData,
  PosingData,
} from '../base/data';

import {
  ModalToolBase,
  ToolEnvironment,
  ToolMouseEvent,
  ToolDrawingEnvironment
} from '../base/tool';

import { Logic_Edit_Line } from '../logics/edit_vector_layer';

import { Maths } from '../logics/math';

export class Tool_Posing3d_ToolBase extends ModalToolBase {

  inputOptionButtonCount = 1;

  editPoint: VectorPoint = null;
  editLine: VectorStroke = null;

  getOptionButtonState(buttonIndex: int, env: ToolEnvironment): InputSideID { // @virtual

    return InputSideID.none;
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData { // @virtual

    throw ('Tool_Posing3d_ToolBase: not implemented!');
  }

  protected copyInputLocationToPoint(e: ToolMouseEvent) {

    if (this.editPoint == null) {

      this.editPoint = new VectorPoint();
    }

    vec3.copy(this.editPoint.location, e.location);
  }

  protected copyInputLocationToLine(e: ToolMouseEvent) {

    if (this.editLine == null) {

      this.editLine = new VectorStroke();
    }

    let point = new VectorPoint();
    vec3.copy(point.location, e.location);
    vec3.copy(point.adjustingLocation, e.location);

    this.editLine.points.push(point);
  }
}

export class Tool_Posing3d_PointInputToolBase extends Tool_Posing3d_ToolBase {

  private tempTargetLocation = vec3.create();

  inputOptionButtonCount = 1;

  optionButton_Click(buttonIndex: int, env: ToolEnvironment): boolean { // @override

    if (env.currentPosingData != null) {

      let inputData = this.getInputData(env);

      if (buttonIndex == 0) {

        if (inputData.inputSideID == InputSideID.front) {
          inputData.inputSideID = InputSideID.back;
        }
        else {
          inputData.inputSideID = InputSideID.front;
        }

        return true;
      }
    }

    return false;
  }

  getOptionButtonState(buttonIndex: int, env: ToolEnvironment): InputSideID { // @override

    if (env.currentPosingData != null) {

      let inputData = this.getInputData(env);

      return inputData.inputSideID;
    }
    else {

      return InputSideID.none;
    }
  }

  mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    if (!e.isLeftButtonPressing()) {
      return;
    }

    this.execute(e, env);
  }

  mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    env.setRedrawEditorWindow();

    if (!e.isLeftButtonPressing()) {
      return;
    }

    this.execute(e, env);
  }

  protected execute(e: ToolMouseEvent, env: ToolEnvironment) {

    let inputData = this.getInputData(env);
    env.posing3DLogic.calculateInputLocation3D(
      this.tempTargetLocation
      , e.location
      , inputData.inputSideID
      , inputData
      , env.currentPosingData
      , env.posing3DView
    );

    this.executeCommand(
      this.tempTargetLocation,
      e.location,
      e,
      env
    );
  }

  protected executeCommand(inputLocation: Vec3, inputLocation2D: Vec3, e: ToolMouseEvent, env: ToolEnvironment) { // @virtual

    throw ('Tool_Posing3d_ToolBase: not implemented!');
  }
}

export class Tool_Posing3d_LineInputToolBase extends Tool_Posing3d_ToolBase {

  mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    if (e.isLeftButtonPressing()) {

      this.editLine = new VectorStroke();

      this.copyInputLocationToLine(e);

      return;
    }
  }

  mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    if (this.editLine == null) {
      return;
    }

    if (!e.isLeftButtonPressing()) {
      return;
    }

    env.setRedrawEditorWindow();

    this.copyInputLocationToLine(e);
  }

  mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    if (e.isLeftButtonReleased()) {

      if (this.editLine == null) {
        return;
      }

      Logic_Edit_Line.calculateParameters(this.editLine);

      if (this.editLine.points.length <= 1 || this.editLine.totalLength < 1) {
        return;
      }

      this.executeCommand(env);

      return;
    }
  }

  protected executeCommand(env: ToolEnvironment) { // @virtual
  }
}

enum JointPartInputMode {

  none, directionInput, rollInput
}

export class Tool_Posing3d_JointPartInputToolBase extends Tool_Posing3d_PointInputToolBase {

  protected enableDirectionInput = true;
  protected enableRollInput = true;

  protected jointPartInputMode = JointPartInputMode.none;
  protected mouseOnInputMode = JointPartInputMode.none;
  protected inputLocation = vec3.create();
  protected relativeMouseLocation = vec3.create();
  protected rollInputRelativeLocation = vec3.create();
  protected rollInputCenterLocation = vec3.create();
  protected rollInputLocation = vec3.fromValues(0.0, 0.0, 0.0);
  protected inputAdditionalAngle = 0.0;
  protected inputStartAngle = 0.0;
  protected inputEndAngle = 0.0;
  protected inputStartLocation = vec3.create();
  protected beforeEditMatrix = mat4.create();
  protected beforeEditAngle = 0.0;

  protected tmpMatrix = mat4.create();
  protected tmpVec3 = vec3.create();
  protected vecZ = vec3.create();
  protected direction = vec3.create();
  protected location3D = vec3.create();
  protected location3DTo = vec3.create();
  protected location2D = vec3.create();
  protected location2DTo = vec3.create();
  protected location2DHead = vec3.create();
  protected partCenterLocation = vec3.create();
  protected rollInputCenterLocation2D = vec3.create();
  protected locationFront = vec3.create();
  protected locationBack = vec3.create();

  protected getInputModeForMouseLocation(resultRelativeMouseLocation: Vec3, env: ToolEnvironment): JointPartInputMode {

    let inputData = this.getInputData(env);

    let circleRadius = this.getBoneInputCircleRadius(env) * env.drawStyle.posing3DBoneInputCircleHitRadius;

    if (!inputData.inputDone) {

      return JointPartInputMode.directionInput;
    }
    else {

      if (inputData.inputDone && inputData.directionInputDone) {

        env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, inputData.inputLocation, env.currentPosingData);
        let distance = vec3.distance(env.mouseCursorLocation, this.location2D);

        if (resultRelativeMouseLocation != null) {

          vec3.subtract(resultRelativeMouseLocation, this.location2D, env.mouseCursorLocation);
        }

        if (distance <= circleRadius) {

          return JointPartInputMode.directionInput;
        }
        else {

          return JointPartInputMode.rollInput;
        }
      }
    }

    return JointPartInputMode.none;
  }

  mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    if (!e.isLeftButtonPressing()) {
      return;
    }

    env.setRedrawEditorWindow();

    let jointPartInputMode = this.getInputModeForMouseLocation(this.relativeMouseLocation, env);

    if (jointPartInputMode == JointPartInputMode.rollInput) {

      let inputData = this.getInputData(env);
      env.posing3DLogic.calculateInputLocation3D(
        inputData.rollInputLocation
        , e.location
        , InputSideID.front
        , inputData
        , env.currentPosingData
        , env.posing3DView
      );

      this.calculateInputParams(inputData.rollInputLocation, inputData.matrix);
      this.inputStartAngle = this.calculateAngle(inputData.rollInputLocation, inputData.matrix);
      this.beforeEditAngle = inputData.rollInputAngle;
      mat4.copy(this.beforeEditMatrix, inputData.matrix);
      vec3.copy(this.inputStartLocation, inputData.rollInputLocation);
    }

    if (jointPartInputMode != JointPartInputMode.none) {

      this.jointPartInputMode = jointPartInputMode;

      this.execute(e, env);
    }
  }

  mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    let jointPartInputMode = this.getInputModeForMouseLocation(null, env);

    if (jointPartInputMode != this.mouseOnInputMode) {
      this.mouseOnInputMode = jointPartInputMode;
      env.setRedrawEditorWindow();
    }

    if (!e.isLeftButtonPressing()) {
      return;
    }

    if (this.jointPartInputMode == JointPartInputMode.directionInput) {

      this.execute(e, env);
    }
    else if (this.jointPartInputMode == JointPartInputMode.rollInput) {

      let inputData = this.getInputData(env);
      env.posing3DLogic.calculateInputLocation3D(
        inputData.rollInputLocation
        , e.location
        , InputSideID.front
        , inputData
        , env.currentPosingData
        , env.posing3DView
      );

      this.execute(e, env);
    }
  }

  mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    this.jointPartInputMode = JointPartInputMode.none;

    env.setRedrawWebGLWindow();
    env.setRedrawEditorWindow();
  }

  protected getBoneInputCircleRadius(env: ToolEnvironment): float {

    return env.getViewScaledLength(env.drawStyle.posing3DBoneInputCircleRadius);
  }

  onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

    let inputData = this.getInputData(env);

    if (!inputData.inputDone) {
      return;
    }

    let circleRadius = this.getBoneInputCircleRadius(env);

    Maths.copyTranslation(this.partCenterLocation, inputData.matrix);

    if (this.enableDirectionInput && inputData.directionInputDone) {

      env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, inputData.inputLocation, env.currentPosingData);
      let strokeWidth = (this.mouseOnInputMode == JointPartInputMode.directionInput) ? 4.0 : 2.0;
      drawEnv.drawCircle(this.location2D, circleRadius, env.getViewScaledLength(strokeWidth), drawEnv.style.posing3DBoneHeadColor);
    }

    if (this.jointPartInputMode == JointPartInputMode.directionInput) {

      env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, this.partCenterLocation, env.currentPosingData);

      vec3.subtract(this.direction, inputData.inputLocation, this.partCenterLocation);
      vec3.scale(this.direction, vec3.normalize(this.direction, this.direction), inputData.hitTestSphereRadius);
      vec3.add(this.location3DTo, this.partCenterLocation, this.direction);
      env.posing3DView.calculate2DLocationFrom3DLocation(this.location2DHead, this.location3DTo, env.currentPosingData);

      env.posing3DView.calculate2DLocationFrom3DLocation(this.location2DTo, inputData.inputLocation, env.currentPosingData);

      drawEnv.drawLine(this.location2D, this.location2DHead, env.getViewScaledLength(4.0), drawEnv.style.posing3DBoneGrayColor);
      drawEnv.drawLine(this.location2DHead, this.location2DTo, env.getViewScaledLength(2.0), drawEnv.style.posing3DBoneGrayColor);

      drawEnv.drawCircle(this.location2D, env.getViewScaledLength(2.0), env.getViewScaledLength(4.0), drawEnv.style.posing3DBoneGrayColor);
      drawEnv.drawCircle(this.location2DHead, env.getViewScaledLength(2.0), env.getViewScaledLength(4.0), drawEnv.style.posing3DBoneGrayColor);
    }

    if (this.jointPartInputMode == JointPartInputMode.rollInput) {

      const depth = env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, this.rollInputCenterLocation, env.currentPosingData);

      vec3.transformMat4(this.location3D, vec3.set(this.tmpVec3, 1.0, 0.0, 0.0), this.beforeEditMatrix);

      mat4.invert(this.tmpMatrix, this.beforeEditMatrix);
      vec3.transformMat4(this.location3D, inputData.rollInputLocation, this.tmpMatrix);

      const unitAngle = 5;
      for (let count = 0; count <= 360; count += unitAngle) {

        this.calculateRingRotated2DLocation(this.location2D,
          this.location3D, this.beforeEditMatrix, Math.PI * 2 * count / 360, env.currentPosingData, env, this.tmpVec3);

        this.calculateRingRotated2DLocation(this.location2DTo,
          this.location3D, this.beforeEditMatrix, Math.PI * 2 * (count + unitAngle) / 360, env.currentPosingData, env, this.tmpVec3);

        env.posing3DLogic.calculateInputLocation3DWSide(
          this.locationFront,
          this.locationBack,
          this.location2D,
          this.partCenterLocation,
          inputData.hitTestSphereRadius,
          env.currentPosingData,
          env.posing3DView
        );

        if (vec3.distance(this.locationFront, this.tmpVec3) < vec3.distance(this.locationBack, this.tmpVec3)) {

          drawEnv.drawLine(this.location2D, this.location2DTo, env.getViewScaledLength(1.0), drawEnv.style.posing3DHelperGrayColor1);
        }
        else {

          drawEnv.drawLine(this.location2D, this.location2DTo, env.getViewScaledLength(1.0), drawEnv.style.posing3DHelperGrayColor2);
        }
      }

      {
        const piePoints: number[][] = [];
        env.posing3DView.calculate2DLocationFrom3DLocation(this.rollInputCenterLocation2D, this.rollInputCenterLocation, env.currentPosingData);
        piePoints.push([this.rollInputCenterLocation2D[0], this.rollInputCenterLocation2D[1], 0.0]);

        this.calculateRingRotated2DLocation(this.location2D, this.location3D, this.beforeEditMatrix, 0.0, env.currentPosingData, env, this.tmpVec3);
        drawEnv.beginPath(this.location2D);
        for (let count = 0; count <= 100; count += 10) {

          this.calculateRingRotated2DLocation(this.location2D,
            this.location3D, this.beforeEditMatrix, -this.inputAdditionalAngle * count / 100, env.currentPosingData, env, this.tmpVec3);

          drawEnv.lineTo(this.location2D);

          piePoints.push([this.location2D[0], this.location2D[1], 0.0]);
        }
        drawEnv.stroke(env.getViewScaledLength(3.0), drawEnv.style.posing3DHelperGrayColor2);

        piePoints.push([this.rollInputCenterLocation2D[0], this.rollInputCenterLocation2D[1], 0.0]);
        this.fillArea(piePoints, drawEnv.style.posing3DHelperGrayColor2, drawEnv);

        drawEnv.drawLine(this.location2D, this.rollInputCenterLocation2D, env.getViewScaledLength(1.0), drawEnv.style.posing3DHelperGrayColor1);
      }

      env.posing3DView.calculate2DLocationFrom3DLocation(this.location2D, this.rollInputCenterLocation, env.currentPosingData);
      env.posing3DView.calculate2DLocationFrom3DLocation(this.location2DTo, inputData.rollInputLocation, env.currentPosingData);
      drawEnv.drawLine(this.location2D, this.location2DTo, env.getViewScaledLength(3.0), drawEnv.style.posing3DBoneGrayColor);
      drawEnv.drawCircle(this.location2DTo, env.getViewScaledLength(5.0), env.getViewScaledLength(4.0), drawEnv.style.posing3DBoneGrayColor);

      // drawEnv.style.posing3DBoneForwardColor
    }
  }

  private fillArea(frontPoints: number[][], color: Vec4, drawEnv: ToolDrawingEnvironment) {

    if (frontPoints.length <= 2) {
      return;
    }

    drawEnv.beginPath();
    drawEnv.moveTo(frontPoints[0]);

    for (let index = 1; index < frontPoints.length; index++) {

      drawEnv.lineTo(frontPoints[index]);
    }

    drawEnv.fill(color);
  }

  private calculateInputParams(location: Vec3, parentMatrix: Mat4) {

    mat4.invert(this.tmpMatrix, parentMatrix);
    vec3.transformMat4(this.rollInputRelativeLocation, location, this.tmpMatrix);

    vec3.set(this.vecZ, 0.0, 0.0, this.rollInputRelativeLocation[2]);
    vec3.transformMat4(this.rollInputCenterLocation, this.vecZ, parentMatrix);
  }

  private calculateAngle(location: Vec3, parentMatrix: Mat4): float {

    mat4.invert(this.tmpMatrix, parentMatrix);
    vec3.transformMat4(this.tmpVec3, location, this.tmpMatrix);

    return Math.atan2(this.tmpVec3[1], this.tmpVec3[0]);
  }

  private calculateRingRotated3DLocation(result: Vec3, location: Vec3, parentMatrix: Mat4, angle: float) {

    mat4.rotateZ(this.tmpMatrix, parentMatrix, angle);
    vec3.transformMat4(result, location, this.tmpMatrix);
  }

  private calculateRingRotated2DLocation(result: Vec3, location: Vec3, parentMatrix: Mat4, angle: float, posingData: PosingData, env: ToolEnvironment, tempVec3: Vec3): float {

    this.calculateRingRotated3DLocation(tempVec3, location, parentMatrix, angle);
    const depth = env.posing3DView.calculate2DLocationFrom3DLocation(result, this.tmpVec3, posingData);

    return depth;
  }

  protected execute(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    vec3.add(this.location2D, e.location, this.relativeMouseLocation);

    let inputData = this.getInputData(env);
    env.posing3DLogic.calculateInputLocation3D(
      this.inputLocation
      , this.location2D
      , InputSideID.front
      , inputData
      , env.currentPosingData
      , env.posing3DView
    );

    this.executeCommand(this.inputLocation, this.location2D, e, env);
  }

  protected executeCommand(inputLocation: Vec3, inputLocation2D: Vec3, e: ToolMouseEvent, env: ToolEnvironment) { // @override

    let inputData = this.getInputData(env);

    // Set inputs
    if (this.jointPartInputMode == JointPartInputMode.directionInput) {

      vec3.copy(inputData.inputLocation, inputLocation);
      vec3.copy(inputData.inputLocation2D, inputLocation2D);
      inputData.inputDone = true;
      inputData.directionInputDone = true;
    }
    else if (this.jointPartInputMode == JointPartInputMode.rollInput) {

      this.calculateInputParams(inputData.rollInputLocation, this.beforeEditMatrix);

      this.inputEndAngle = this.calculateAngle(inputData.rollInputLocation, this.beforeEditMatrix);
      this.inputAdditionalAngle = Maths.getRoundedAngle(this.inputEndAngle - this.inputStartAngle);

      inputData.rollInputAngle = this.beforeEditAngle + this.inputAdditionalAngle;

      inputData.rollInputDone = true;
    }

    // Calculate
    env.posing3DLogic.calculateAll(env.currentPosingData, env.currentPosingModel, env.posing3DView);

    this.updateAdditionalPart(inputData.inputLocation, env);

    env.setRedrawWebGLWindow();
    env.setRedrawEditorWindow();
    env.setRedrawSubtoolWindow();
  }

  protected updateAdditionalPart(inputLocation: Vec3, env: ToolEnvironment) { // @virtual

  }
}

// Each tools

export class Tool_Posing3d_LocateHead extends Tool_Posing3d_LineInputToolBase {

  helpText = 'マウスでクリックすると頭の位置が決まり、さらにドラッグするとスケールが変更できます。<br />次の操作に移るには画面右のパネルの「頭の向き」をクリックします。';

  inputOptionButtonCount = 0;

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
    );
  }

  tempVec3 = vec3.fromValues(0.0, 0.0, 0.0);
  centerLocation = vec3.fromValues(0.0, 0.0, 0.0);
  centerLocation3D = vec3.fromValues(0.0, 0.0, 0.0);
  subLocation = vec3.fromValues(0.0, 0.0, 0.0);
  inputRadius = 0.0;
  inputRadiusAdjustRate = 1.0;
  minInputRadius = 5.0;

  mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    if (e.isLeftButtonPressing()) {

      env.startModalTool(this);

      this.executeCommand(env);
    }
  }

  prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

    if (env.currentPosingData == null) {
      return false;
    }

    vec3.copy(this.centerLocation, e.location);
    this.inputRadius = this.minInputRadius;

    return true;
  }

  mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    if (!e.isLeftButtonPressing() || !env.isModalToolRunning()) {
      return;
    }

    vec3.subtract(this.subLocation, e.location, this.centerLocation);
    this.inputRadius = vec3.length(this.subLocation);
    if (this.inputRadius < this.minInputRadius) {

      this.inputRadius = this.minInputRadius;
    }

    this.executeCommand(env);
  }

  mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    if (env.currentPosingData == null) {
      return;
    }

    if (!env.isModalToolRunning()) {
      return;
    }

    env.endModalTool();
  }

  protected executeCommand(env: ToolEnvironment) {

    /*
    // Center of head sphere
    //let locationCountSum = 0.0;
    vec3.set(this.centerLocationSum, 0.0, 0.0, 0.0);
    //let lastLength = 0.0;
    let totalCount = 0.0;
    for (let point of this.editLine.points) {

        //let segmentLength = point.totalLength - lastLength;
        //vec3.scale(this.tempVec3, point.location, segmentLength / this.editLine.totalLength);
        //vec3.add(this.centerLocationSum, this.centerLocationSum, this.tempVec3);
        //lastLength = point.totalLength;

        vec3.add(this.centerLocationSum, this.centerLocationSum, point.location);
        totalCount += 1;
    }

    if (totalCount > 0) {

        vec3.scale(this.centerLocationSum, this.centerLocationSum, 1 / totalCount);
    }
    */

    //console.log('頭の配置');
    //console.log(this.centerLocationSum);

    /*
    // Radius
    let radiusSum = 0.0;
    //let lastLength2 = 0.0;
    let totalCount2 = 0.0;
    for (let point of this.editLine.points) {

        //let segmentLength = point.totalLength - lastLength2;
        //vec3.subtract(this.subLocation, point.location, this.centerLocationSum);
        //radiusSum += vec3.length(this.subLocation) * (segmentLength / this.editLine.totalLength);
        //lastLength2 = point.totalLength;

        vec3.subtract(this.subLocation, point.location, this.centerLocationSum);
        radiusSum += vec3.length(this.subLocation);
        totalCount2 += 1;
    }

    if (totalCount2 > 0) {

        radiusSum *= 1 / totalCount2;
    }

    //console.log(radiusSum);
    */

    const posingData = env.currentPosingData;

    let radiusSum = this.inputRadius * this.inputRadiusAdjustRate;

    // Expects model is located 2.0m away from camera at first, then calculate zoom rate as real3DViewHalfWidth
    //     headSphereSize[m] / real3DViewHalfWidth[m] = radiusSum[px] / real2DViewWidth[px]
    //     real3DViewHalfWidth[m] / headSphereSize[m] = real2DViewWidth[px] / radiusSum[px]
    //     real3DViewHalfWidth[m]                     = (real2DViewWidth[px] / radiusSum[px]) * headSphereSize[m]
    let real2DViewWidth = env.mainWindow.height / 2;
    posingData.real3DViewHalfWidth = (real2DViewWidth / radiusSum) * env.currentPosingModel.headSphereSize;
    posingData.real3DViewMeterPerPixel = posingData.real3DViewHalfWidth / real2DViewWidth;

    // debug
    //posingData.viewZoomRate = env.currentPosingModel.headSphereSize / 50.0;
    //this.centerLocationSum[0] = env.mainWindow.width / 2 + radiusSum;
    //this.centerLocationSum[0] = env.mainWindow.width / 2;
    //this.centerLocationSum[1] = env.mainWindow.height / 2;
    //for (let point of this.editLine.points) {
    //    point.location[0] = this.centerLocationSum[0];
    //    point.adjustedLocation[0] = this.centerLocationSum[0];
    //}
    // debug

    //console.log(this.centerLocation);

    {
      const inputData = posingData.headLocationInputData;

      env.posing3DView.calculate3DLocationFrom2DLocation(
        this.centerLocation3D
        , this.centerLocation
        , posingData.real3DModelDistance
        , posingData);

      vec3.copy(inputData.center, this.centerLocation3D);
      inputData.radius = radiusSum;
      inputData.editLine = this.editLine;
      inputData.inputDone = true;
    }

    env.posing3DLogic.calculateHeadLocation(posingData, env.currentPosingModel);

    {
      const inputData = posingData.headRotationInputData;

      vec3.set(this.tempVec3, 0.0, 0.0, inputData.hitTestSphereRadius);
      vec3.transformMat4(inputData.inputLocation, this.tempVec3, inputData.parentMatrix);
      env.posing3DView.calculate2DLocationFrom3DLocation(
        inputData.inputLocation2D, inputData.inputLocation, posingData
      );

      inputData.directionInputDone = true;

      inputData.rollInputAngle = 0.0;
      inputData.rollInputDone = false;
    }

    env.setRedrawWebGLWindow();
    env.setRedrawSubtoolWindow();
  }
}

export class Tool_Posing3d_RotateHead extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '画面に表示された球のどこかをクリックすると頭の向きが決まります。<br />画面右のパネルで「手前」となっているボタンをクリックすると奥側を指定できるようになります。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && env.currentPosingData.headLocationInputData.inputDone
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

    return env.currentPosingData.headRotationInputData;
  }
}

export class Tool_Posing3d_LocateBody extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '半透明の球のどこかをクリックすると頭の向きを正面として胴が配置されます。<br />少し外側をクリックすると画面に対して真横を指定できます。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && env.currentPosingData.headLocationInputData.inputDone
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

    return env.currentPosingData.bodyLocationInputData;
  }
}

export class Tool_Posing3d_LocateHips extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '腰を配置します。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && env.currentPosingData.bodyLocationInputData.inputDone
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

    return env.currentPosingData.hipsLocationInputData;
  }
}

export class Tool_Posing3d_LocateLeftShoulder extends Tool_Posing3d_JointPartInputToolBase {

  helpText = 'ヒジの位置を指定して肩を配置します。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && (env.currentPosingData.bodyLocationInputData.inputDone || env.currentPosingData.bodyRotationInputData.inputDone)
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

    return env.currentPosingData.leftShoulderLocationInputData;
  }
}

export class Tool_Posing3d_LocateRightShoulder extends Tool_Posing3d_LocateLeftShoulder {

  protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

    return env.currentPosingData.rightShoulderLocationInputData;
  }
}

export class Tool_Posing3d_LocateLeftArm1 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = 'ヒジの位置を指定して上腕を配置します。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && (env.currentPosingData.bodyLocationInputData.inputDone || env.currentPosingData.bodyRotationInputData.inputDone)
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData { // @override

    return env.currentPosingData.leftArm1LocationInputData;
  }

  protected updateAdditionalPart(inputLocation: Vec3, env: ToolEnvironment) { // @override

    env.currentPosingData.leftShoulderLocationInputData.inputDone = true;
  }
}

export class Tool_Posing3d_LocateRightArm1 extends Tool_Posing3d_LocateLeftArm1 {

  helpText = 'ヒジの位置を指定して上腕を配置します。';

  protected getInputData(env: ToolEnvironment): DirectionInputData {

    return env.currentPosingData.rightArm1LocationInputData;
  }

  protected updateAdditionalPart(inputLocation: Vec3, env: ToolEnvironment) { // @override

    env.currentPosingData.rightShoulderLocationInputData.inputDone = true;
  }
}

export class Tool_Posing3d_LocateLeftLeg1 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = 'ヒザの位置を指定して上脚を配置します。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && env.currentPosingData.hipsLocationInputData.inputDone
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData {

    return env.currentPosingData.leftLeg1LocationInputData;
  }

  protected executeCommandExt(env: ToolEnvironment) { // @override

    env.currentPosingData.leftShoulderLocationInputData.inputDone = true;
  }
}

export class Tool_Posing3d_LocateRightLeg1 extends Tool_Posing3d_LocateLeftLeg1 {

  helpText = 'ヒザの位置を指定して上脚を配置します。';

  protected getInputData(env: ToolEnvironment): DirectionInputData {

    return env.currentPosingData.rightLeg1LocationInputData;
  }
}

export class Tool_Posing3d_LocateLeftArm2 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '手首の位置を指定して下腕を配置します。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && env.currentPosingData.leftArm1LocationInputData.inputDone
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData {

    return env.currentPosingData.leftArm2LocationInputData;
  }
}

export class Tool_Posing3d_LocateRightArm2 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '手首の位置を指定して下腕を配置します。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && env.currentPosingData.rightArm1LocationInputData.inputDone
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData {

    return env.currentPosingData.rightArm2LocationInputData;
  }
}

export class Tool_Posing3d_LocateLeftLeg2 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '足首の位置を指定して下脚を配置します。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && env.currentPosingData.leftLeg1LocationInputData.inputDone
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData {

    return env.currentPosingData.leftLeg2LocationInputData;
  }
}

export class Tool_Posing3d_LocateRightLeg2 extends Tool_Posing3d_JointPartInputToolBase {

  helpText = '足首の位置を指定して下脚を配置します。';

  isAvailable(env: ToolEnvironment): boolean { // @override

    return (
      env.currentPosingLayer != null && Layer.isVisible(env.currentPosingLayer)
      && env.currentPosingData != null
      && env.currentPosingData.rightLeg1LocationInputData.inputDone
    );
  }

  protected getInputData(env: ToolEnvironment): DirectionInputData {

    return env.currentPosingData.rightLeg2LocationInputData;
  }
}
