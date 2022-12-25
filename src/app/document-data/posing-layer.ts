import { float } from "../common-logics"
import { ModelResource } from "../posing3d"
import { SubToolID } from "../tool"
import { Layer, LayerTypeID, Layer_RuntimeProperty } from "./layer"
import { VectorStroke } from "./vector_layer"

export class PosingModel {

  // Head to body
  headSphereSize = 0.12 // 14cm
  headTwistSphereSize = 0.18 //
  headCenterLocation = vec3.fromValues(0.0, 0.0, 0.0)
  headTopLocation = vec3.fromValues(0.0, 0.0, 0.0)
  headTopToNeckVector = vec3.fromValues(0.0, 0.0, 0.0)

  bodySphereSize = 0.30 // 44cm
  bodySphereLocation = vec3.fromValues(0.0, -0.03, -0.19)
  neckSphereLocation = vec3.fromValues(0.0, -0.03, -0.17)

  shoulderSphereLocation = vec3.fromValues(0.0, -0.03, -0.17)

  bodyRotationSphereSize = 0.15 // 11cm
  bodyRotationSphereLocation = vec3.fromValues(0.0, 0.0, -0.31)

  hipsSphereSize = 0.30 // 44cm

  // Arms
  leftArm1Location = vec3.fromValues(-0.130, 0.0, -0.05)
  rightArm1Location = vec3.fromValues(+0.130, 0.0, -0.05)

  leftArm1HeadLocation = vec3.fromValues(0.0, 0.0, -0.27)
  rightArm1HeadLocation = vec3.fromValues(0.0, 0.0, -0.27)

  leftArm2HeadLocation = vec3.fromValues(0.0, 0.0, -0.27)
  rightArm2HeadLocation = vec3.fromValues(0.0, 0.0, -0.27)

  // Legs
  leftLeg1Location = vec3.fromValues(-0.11, 0.0, -0.46)
  rightLeg1Location = vec3.fromValues(+0.11, 0.0, -0.46)

  leftLeg1HeadLocation = vec3.fromValues(0.0, 0.0, -0.39)
  rightLeg1HeadLocation = vec3.fromValues(0.0, 0.0, -0.39)

  leftLeg2HeadLocation = vec3.fromValues(0.0, 0.0, -0.39)
  rightLeg2HeadLocation = vec3.fromValues(0.0, 0.0, -0.39)

  // runtime
  chestModelConvertMatrix = mat4.create()
  hipsModelConvertMatrix = mat4.create()
}

export class PosingModelBoneInputSetting {

  inputName = ''
  inputType = '' //  baseSize, direction
  modelName = ''
  dependentInputName = ''
}

export enum InputSideID {
  none = 0,
  front = 1,
  back = 2
}

export class PosingInputData {

  inputDone = false

  // runtime
  parentMatrix: Mat4 = null
  hitTestSphereRadius: float = 0.0
}

export class HeadLocationInputData extends PosingInputData {

  center = vec3.fromValues(0.0, 0.0, 0.0)
  radius = 0.0
  editLine: VectorStroke = null

  matrix = mat4.create()

  headMatrix = mat4.create()
  bodyRootMatrix = mat4.create()
}

export class DirectionInputData extends PosingInputData {

  inputSideID = InputSideID.front
  inputLocation = vec3.fromValues(0.0, 0.0, 0.0)
  inputLocation2D = vec3.fromValues(0.0, 0.0, 0.0)

  directionInputDone = false
  rollInputDone = false
  rollInputLocation = vec3.fromValues(0.0, 0.0, 0.0)
  rollInputAngle = 0.0

  matrix = mat4.create()
}

export class HeadRotationInputData extends DirectionInputData {

  neckSphereMatrix = mat4.create()
}

export class HeadTwistInputData extends DirectionInputData {

  tempInputLocation = vec3.fromValues(0.0, 0.0, 0.0)
}

export class BodyLocationInputData extends DirectionInputData {

  bodyMatrix = mat4.create()

  rotationCenterMatrix = mat4.create()

  leftArm1RootMatrix = mat4.create()
  rightArm1RootMatrix = mat4.create()
  leftLeg1RootMatrix = mat4.create()
  rightLeg1RootMatrix = mat4.create()
}

export class BodyRotationInputData extends DirectionInputData {

  inputSideID = InputSideID.front
  inputLocation = vec3.fromValues(0.0, 0.0, 0.0)

  matrix = mat4.create()
}

export class JointPartInputData extends DirectionInputData {

  childJointRootMatrix = mat4.create()
}

export class PosingData {

  real3DViewHalfWidth = 1.0
  real3DViewMeterPerPixel = 1.0
  real3DModelDistance = 2.0

  rootMatrix = mat4.create()

  headMatrix = mat4.create()
  headTopMatrix = mat4.create()
  neckSphereMatrix = mat4.create()

  chestRootMatrix = mat4.create()
  chestMatrix = mat4.create()

  shoulderRootMatrix = mat4.create()

  hipsRootMatrix = mat4.create()
  hipsMatrix = mat4.create()

  bodyRotationCenterMatrix = mat4.create()

  leftArm1RootMatrix = mat4.create()
  rightArm1RootMatrix = mat4.create()
  leftLeg1RootMatrix = mat4.create()
  rightLeg1RootMatrix = mat4.create()

  headLocationInputData = new HeadLocationInputData()
  headRotationInputData = new JointPartInputData()
  headTwistInputData = new HeadTwistInputData()

  bodyLocationInputData = new JointPartInputData()
  bodyRotationInputData = new BodyRotationInputData()

  hipsLocationInputData = new JointPartInputData()

  leftShoulderLocationInputData = new JointPartInputData()
  rightShoulderLocationInputData = new JointPartInputData()

  leftArm1LocationInputData = new JointPartInputData()
  leftArm2LocationInputData = new JointPartInputData()

  rightArm1LocationInputData = new JointPartInputData()
  rightArm2LocationInputData = new JointPartInputData()

  leftLeg1LocationInputData = new JointPartInputData()
  leftLeg2LocationInputData = new JointPartInputData()

  rightLeg1LocationInputData = new JointPartInputData()
  rightLeg2LocationInputData = new JointPartInputData()
}

export class JointPartDrawingUnit {

  name = ""

  targetData: DirectionInputData = null

  dependentInputData: PosingInputData = null

  subToolID: SubToolID

  drawModel = true
  modelResource: ModelResource = null
  modelConvertMatrix: Mat4 = null
  visualModelAlpha = 1.0
  hitTestSphereAlpha = 0.5
}

export class PosingLayer_RuntimeProperty extends Layer_RuntimeProperty {

  drawingUnits: JointPartDrawingUnit[] = null
}

export class PosingLayer extends Layer {

  type = LayerTypeID.posingLayer

  posingModel = new PosingModel()
  posingData = new PosingData()

  // runtime
  runtime = new PosingLayer_RuntimeProperty()

  static isPosingLayer(layer: Layer): boolean {

    return (
      layer != null
      && layer.type == LayerTypeID.posingLayer
    )
  }
}
