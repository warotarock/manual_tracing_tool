import { float } from '../logics/conversion'
import { InputSideID, JointPartDrawingUnit, PosingData, PosingLayer, PosingModel } from '../document_data'
import { Maths } from '../logics/math'
import { CanvasWindow } from '../render/render2d'
import { RenderImage, RenderModel, RenderShader, WebGLRender, WebGLRenderBlendType } from '../render/render3d'
import { DocumentContext } from '../context/document_context'
import { SubToolID } from '../tool/sub_tool'

export class ImageResource {

  fileName: string = null
  image = new RenderImage()
  isGLTexture = false
  cssImageClassName = ''

  loaded = false

  set({ fileName, cssImageClassName, isGLTexture }: { fileName?: string, cssImageClassName?: string, isGLTexture?: boolean }) {

    if (fileName) {

      this.fileName = fileName
    }

    if (cssImageClassName) {

      this.cssImageClassName = cssImageClassName
    }

    if (isGLTexture) {

      this.isGLTexture = isGLTexture
    }

    return this
  }
}

export class ModelResource {

  modelName: string = null
  model = new RenderModel()
}

export class ModelFile {

  fileName: string = null
  modelResources: ModelResource[] = []
  modelResourceDictionary = new Map<string, ModelResource>()
  posingModelDictionary = new Map<string, PosingModel>()
  loaded = false

  file(fileName: string): ModelFile {

    this.fileName = fileName

    return this
  }
}

enum DrawImageType {

  visualImage = 1,
  depthImage = 2
}

export class Posing3DView {

  render: WebGLRender = null
  webglWindow: CanvasWindow = null
  //pickingWindow: PickingWindow = null
  posingFigureShader = new PosingFigureShader()
  depthShader = new DepthShader()

  imageResurces: ImageResource[] = []

  axisModel: ModelResource = null
  zTestShpereModel: ModelResource = null
  zTestShpereEdgeModel: ModelResource = null
  headModel: ModelResource = null
  chestModel: ModelResource = null
  leftSholderModel: ModelResource = null
  rightSholderModel: ModelResource = null
  hipsModel: ModelResource = null
  leftArm1Model: ModelResource = null
  leftArm2Model: ModelResource = null
  rightArm1Model: ModelResource = null
  rightArm2Model: ModelResource = null
  leftLeg1Model: ModelResource = null
  leftLeg2Model: ModelResource = null
  rightLeg1Model: ModelResource = null
  rightLeg2Model: ModelResource = null

  eyeLocation = vec3.create()
  lookatLocation = vec3.create()
  upVector = vec3.create()

  modelMatrix = mat4.create()
  normalMatrix = mat4.create()
  viewMatrix = mat4.create()
  modelViewMatrix = mat4.create()
  projectionMatrix = mat4.create()
  projectionInvMatrix = mat4.create()
  cameraMatrix = mat4.create()

  real3DProjectionMatrix = mat4.create()

  locationMatrix = mat4.create()
  tempVec3 = vec3.create()
  invProjectedVec3 = vec3.create()
  tmpMatrix = mat4.create()
  screenLocation = vec3.create()

  initialize(render: WebGLRender, webglWindow: CanvasWindow) {

    this.render = render
    this.webglWindow = webglWindow
    //this.pickingWindow = pickingWindow

    this.render.initializeShader(this.posingFigureShader)
    this.render.initializeShader(this.depthShader)

    this.render.setShader(this.depthShader)
    //this.depthShader.setMaxDepth(pickingWindow.maxDepth)
  }

  storeResources(modelFile: ModelFile, imageResurces: ImageResource[]) {

    this.axisModel = modelFile.modelResourceDictionary.get('Axis')
    this.zTestShpereModel = modelFile.modelResourceDictionary.get('ZTestSphere')
    this.zTestShpereEdgeModel = modelFile.modelResourceDictionary.get('ZTestSphereEdge')

    this.headModel = modelFile.modelResourceDictionary.get('Head02')
    this.chestModel = modelFile.modelResourceDictionary.get('Chest')
    this.leftSholderModel = modelFile.modelResourceDictionary.get('LeftShoulder')
    this.rightSholderModel = modelFile.modelResourceDictionary.get('LeftShoulder')
    this.hipsModel = modelFile.modelResourceDictionary.get('Hips')

    this.leftArm1Model = modelFile.modelResourceDictionary.get('Arm1')
    this.leftArm2Model = modelFile.modelResourceDictionary.get('Arm1')
    this.rightArm1Model = modelFile.modelResourceDictionary.get('Arm1')
    this.rightArm2Model = modelFile.modelResourceDictionary.get('Arm1')

    this.leftLeg1Model = modelFile.modelResourceDictionary.get('Leg1')
    this.leftLeg2Model = modelFile.modelResourceDictionary.get('Leg2')
    this.rightLeg1Model = modelFile.modelResourceDictionary.get('Leg1')
    this.rightLeg2Model = modelFile.modelResourceDictionary.get('Leg2')

    this.imageResurces.push(imageResurces[0])
  }

  buildDrawingStructures(posingLayer: PosingLayer) {

    const posingData = posingLayer.posingData
    const posingModel = posingLayer.posingModel

    const drawingUnits: JointPartDrawingUnit[] = []

    // Head top to neck
    {
      const unit = new JointPartDrawingUnit()
      unit.name = "headLocationInputData"
      unit.targetData = posingData.headRotationInputData
      unit.dependentInputData = posingData.headLocationInputData
      unit.subToolID = SubToolID.p3d_rotateHead
      unit.modelResource = this.headModel
      unit.drawModel = false
      unit.targetData.parentMatrix = posingData.neckSphereMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.headTopToNeckVector)
      drawingUnits.push(unit)
    }

    // Chest and hips
    {
      const unit = new JointPartDrawingUnit()
      unit.name = "bodyLocationInputData"
      unit.targetData = posingData.bodyLocationInputData
      unit.dependentInputData = posingData.headLocationInputData
      unit.modelConvertMatrix = posingModel.chestModelConvertMatrix
      unit.subToolID = SubToolID.p3d_locateBody
      unit.modelResource = this.chestModel
      unit.targetData.parentMatrix = posingData.chestRootMatrix
      unit.targetData.hitTestSphereRadius = posingModel.bodySphereSize
      drawingUnits.push(unit)
    }

    {
      const unit = new JointPartDrawingUnit()
      unit.name = "hipsLocationInputData"
      unit.targetData = posingData.hipsLocationInputData
      unit.dependentInputData = posingData.bodyLocationInputData
      unit.modelConvertMatrix = posingModel.hipsModelConvertMatrix
      unit.subToolID = SubToolID.p3d_locateHips
      unit.modelResource = this.hipsModel
      unit.targetData.parentMatrix = posingData.hipsRootMatrix
      unit.targetData.hitTestSphereRadius = posingModel.hipsSphereSize
      drawingUnits.push(unit)
    }

    // Left arms
    {
      const unit = new JointPartDrawingUnit()
      unit.name = "leftShoulderLocationInputData"
      unit.targetData = posingData.leftShoulderLocationInputData
      unit.dependentInputData = posingData.bodyLocationInputData
      unit.subToolID = SubToolID.p3d_locateLeftShoulder
      unit.modelResource = this.leftSholderModel
      unit.targetData.parentMatrix = posingData.shoulderRootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftArm1Location)
      drawingUnits.push(unit)
    }

    {
      const unit = new JointPartDrawingUnit()
      unit.name = "leftArm1LocationInputData"
      unit.targetData = posingData.leftArm1LocationInputData
      unit.dependentInputData = posingData.bodyLocationInputData
      unit.subToolID = SubToolID.p3d_locateLeftArm1
      unit.modelResource = this.leftArm1Model
      unit.targetData.parentMatrix = posingData.leftArm1RootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftArm1HeadLocation)
      drawingUnits.push(unit)
    }

    {
      const unit = new JointPartDrawingUnit()
      unit.name = "leftArm2LocationInputData"
      unit.targetData = posingData.leftArm2LocationInputData
      unit.dependentInputData = posingData.leftArm1LocationInputData
      unit.subToolID = SubToolID.p3d_locateLeftArm2
      unit.modelResource = this.leftArm2Model
      unit.targetData.parentMatrix = posingData.leftArm1LocationInputData.childJointRootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftArm2HeadLocation)
      drawingUnits.push(unit)
    }

    // Right arm
    {
      const unit = new JointPartDrawingUnit()
      unit.name = "rightShoulderLocationInputData"
      unit.targetData = posingData.rightShoulderLocationInputData
      unit.dependentInputData = posingData.bodyLocationInputData
      unit.subToolID = SubToolID.p3d_locateRightShoulder
      unit.modelResource = this.rightSholderModel
      unit.targetData.parentMatrix = posingData.shoulderRootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightArm1Location)
      drawingUnits.push(unit)
    }

    {
      const unit = new JointPartDrawingUnit()
      unit.name = "rightArm1LocationInputData"
      unit.targetData = posingData.rightArm1LocationInputData
      unit.dependentInputData = posingData.bodyLocationInputData
      unit.subToolID = SubToolID.p3d_locateRightArm1
      unit.modelResource = this.rightArm1Model
      unit.targetData.parentMatrix = posingData.rightArm1RootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightArm1HeadLocation)
      drawingUnits.push(unit)
    }

    {
      const unit = new JointPartDrawingUnit()
      unit.name = "rightArm2LocationInputData"
      unit.targetData = posingData.rightArm2LocationInputData
      unit.dependentInputData = posingData.rightArm1LocationInputData
      unit.subToolID = SubToolID.p3d_locateRightArm2
      unit.modelResource = this.rightArm2Model
      unit.targetData.parentMatrix = posingData.rightArm1LocationInputData.childJointRootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightArm2HeadLocation)
      drawingUnits.push(unit)
    }

    // Left leg
    {
      const unit = new JointPartDrawingUnit()
      unit.name = "leftLeg1LocationInputData"
      unit.targetData = posingData.leftLeg1LocationInputData
      unit.dependentInputData = posingData.bodyLocationInputData
      unit.subToolID = SubToolID.p3d_locateLeftLeg1
      unit.modelResource = this.leftLeg1Model
      unit.targetData.parentMatrix = posingData.leftLeg1RootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftLeg1HeadLocation)
      drawingUnits.push(unit)
    }

    {
      const unit = new JointPartDrawingUnit()
      unit.name = "rightLeg2LocationInputData"
      unit.targetData = posingData.leftLeg2LocationInputData
      unit.dependentInputData = posingData.leftLeg1LocationInputData
      unit.subToolID = SubToolID.p3d_locateLeftLeg2
      unit.modelResource = this.leftLeg2Model
      unit.targetData.parentMatrix = posingData.leftLeg1LocationInputData.childJointRootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.leftLeg2HeadLocation)
      drawingUnits.push(unit)
    }

    // Right leg
    {
      const unit = new JointPartDrawingUnit()
      unit.name = "rightLeg1LocationInputData"
      unit.targetData = posingData.rightLeg1LocationInputData
      unit.dependentInputData = posingData.bodyLocationInputData
      unit.subToolID = SubToolID.p3d_locateRightLeg1
      unit.modelResource = this.rightLeg1Model
      unit.targetData.parentMatrix = posingData.rightLeg1RootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightLeg1HeadLocation)
      drawingUnits.push(unit)
    }

    {
      const unit = new JointPartDrawingUnit()
      unit.name = "rightLeg2LocationInputData"
      unit.targetData = posingData.rightLeg2LocationInputData
      unit.dependentInputData = posingData.rightLeg1LocationInputData
      unit.subToolID = SubToolID.p3d_locateRightLeg2
      unit.modelResource = this.rightLeg2Model
      unit.targetData.parentMatrix = posingData.rightLeg1LocationInputData.childJointRootMatrix
      unit.targetData.hitTestSphereRadius = vec3.length(posingModel.rightLeg2HeadLocation)
      drawingUnits.push(unit)
    }

    // Head twist
    {
      const unit = new JointPartDrawingUnit()
      unit.name = "headTwistInputData"
      unit.targetData = posingData.headTwistInputData
      unit.dependentInputData = posingData.headRotationInputData
      unit.subToolID = SubToolID.p3d_twistHead
      unit.drawModel = false
      unit.targetData.parentMatrix = posingData.neckSphereMatrix
      unit.targetData.hitTestSphereRadius = posingModel.headTwistSphereSize
      drawingUnits.push(unit)
    }

    posingLayer.drawingUnits = drawingUnits
  }

  clear() {

    this.render.setDepthTest(true)
    this.render.setCulling(true)
    this.render.clearColorBufferDepthBuffer(0.0, 0.0, 0.0, 0.0)
  }

  prepareDrawingStructures(posingLayer: PosingLayer) {

    if (posingLayer.drawingUnits == null) {

      this.buildDrawingStructures(posingLayer)
    }
  }

  drawManipulaters(posingLayer: PosingLayer, ctx: DocumentContext) {

    const posingData = posingLayer.posingData

    this.caluculateCameraMatrix(posingData)

    // Draws input manipulaters

    this.drawHeadSphere(DrawImageType.visualImage, posingLayer, ctx)

    for (const drawingUnit of posingLayer.drawingUnits) {

      if (ctx.subtoolID == drawingUnit.subToolID) {

        //this.drawAxis(drawingUnit.parentMatrix, 0.3, 0.5, ctx)

        this.drawSphere(DrawImageType.visualImage
          , drawingUnit.targetData.inputSideID
          , drawingUnit.targetData.parentMatrix
          , drawingUnit.targetData.hitTestSphereRadius
          , posingLayer
          , ctx)
      }
    }
  }

  drawPosingModel(posingLayer: PosingLayer, ctx: DocumentContext) {

    const posingData = posingLayer.posingData

    this.caluculateCameraMatrix(posingData)

    this.render.clearDepthBuffer()

    if (this.isHeadDrawable(posingData)) {

      this.setShaderParameters(posingData.headMatrix, false, this.posingFigureShader)
      this.posingFigureShader.setAlpha(posingLayer.layerColor[3])
      this.drawModel(this.posingFigureShader, this.headModel.model, this.imageResurces[0].image)
    }

    if (this.isBodyDrawable(posingData)) {

      //mat4.multiply(this.tmpMatrix, posingData.bodyLocationInputData.bodyMatrix, posingModel.chestModelConvertMatrix)
      //this.setShaderParameters(this.tmpMatrix, false, this.posingFigureShader)
      //this.posingFigureShader.setAlpha(1.0)
      //this.drawModel(this.chestModel.model, this.imageResurces[0].image)

      //mat4.multiply(this.tmpMatrix, posingData.chestMatrix, posingModel.hipsModelConvertMatrix)
      //this.setShaderParameters(this.tmpMatrix, false, this.posingFigureShader)
      //this.posingFigureShader.setAlpha(1.0)
      //this.drawModel(this.hipsModel.model, this.imageResurces[0].image)

      const debugDraw = false
      if (debugDraw) {
        this.drawAxis(posingData.leftArm1RootMatrix, 0.1, 0.5)
        this.drawAxis(posingData.rightArm1RootMatrix, 0.1, 0.5)
        this.drawAxis(posingData.leftLeg1RootMatrix, 0.1, 0.5)
        this.drawAxis(posingData.rightLeg1RootMatrix, 0.1, 0.5)
      }
    }

    for (const drawingUnit of posingLayer.drawingUnits) {

      if (drawingUnit.drawModel && drawingUnit.targetData.inputDone) {

        if (drawingUnit.modelConvertMatrix != null) {

          mat4.multiply(this.tmpMatrix, drawingUnit.targetData.matrix, drawingUnit.modelConvertMatrix)
        }
        else {

          mat4.copy(this.tmpMatrix, drawingUnit.targetData.matrix)
        }

        this.setShaderParameters(this.tmpMatrix, false, this.posingFigureShader)
        this.posingFigureShader.setAlpha(drawingUnit.visualModelAlpha * posingLayer.layerColor[3])
        this.drawModel(this.posingFigureShader, drawingUnit.modelResource.model, this.imageResurces[0].image)

        //this.drawAxis(drawingUnit.targetData.matrix, 0.2, 0.5, ctx)
      }
    }
  }

  drawPickingImage(posingLayer: PosingLayer, ctx: DocumentContext) {

    this.render.setBlendType(WebGLRenderBlendType.src)

    this.drawHeadSphere(DrawImageType.depthImage, posingLayer, ctx)

    this.drawBodySphere(DrawImageType.depthImage, posingLayer, ctx)

    this.drawBodyRotationSphere(DrawImageType.depthImage, posingLayer, ctx)

    for (const drawingUnit of posingLayer.drawingUnits) {

      if (ctx.subtoolID == drawingUnit.subToolID) {

        this.drawSphere(DrawImageType.depthImage
          , drawingUnit.targetData.inputSideID
          , drawingUnit.targetData.parentMatrix
          , drawingUnit.targetData.hitTestSphereRadius
          , posingLayer
          , ctx)
      }
    }

    this.render.setBlendType(WebGLRenderBlendType.blend)
  }

  getCurrentDrawingUnit(ctx: DocumentContext): JointPartDrawingUnit {

    for (const drawingUnit of ctx.currentPosingLayer.drawingUnits) {

      if (ctx.subtoolID == drawingUnit.subToolID) {

        return drawingUnit
      }
    }

    return null
  }

  private drawHeadSphere(drawImageType: DrawImageType, posingLayer: PosingLayer, ctx: DocumentContext) {

    const posingData = posingLayer.posingData
    const posingModel = posingLayer.posingModel

    const needsDrawing = (
      posingData != null
      && posingData.headLocationInputData.inputDone
      && ctx.subtoolID == SubToolID.p3d_locateHead
    )

    if (!needsDrawing) {
      return
    }

    mat4.copy(this.locationMatrix, posingData.rootMatrix)
    const scale = posingModel.headSphereSize
    mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale))

    if (drawImageType == DrawImageType.visualImage) {

      this.drawZTestSphere(this.locationMatrix, posingData.headRotationInputData.inputSideID, ctx)
    }
    else {

      this.render.clearDepthBuffer()

      this.drawZTestSphereDepth(this.locationMatrix, posingData.headRotationInputData.inputSideID)
    }
  }

  private drawBodySphere(drawImageType: DrawImageType, posingLayer: PosingLayer, ctx: DocumentContext) {

    const posingData = posingLayer.posingData
    const posingModel = posingLayer.posingModel

    const needsDrawing = (
      posingData != null
      && posingData.headLocationInputData.inputDone
      && ctx.subtoolID == SubToolID.p3d_locateBody
    )

    if (!needsDrawing) {
      return
    }

    Maths.copyTranslation(this.tempVec3, posingData.chestRootMatrix)
    mat4.identity(this.tmpMatrix)
    mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3)

    const scale = posingModel.bodySphereSize
    mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale))

    if (drawImageType == DrawImageType.visualImage) {

      this.drawZTestSphere(this.locationMatrix, posingData.bodyLocationInputData.inputSideID, ctx)
    }
    else {

      this.render.clearDepthBuffer()

      this.drawZTestSphereDepth(this.locationMatrix, posingData.bodyLocationInputData.inputSideID)
    }
  }

  private drawBodyRotationSphere(drawImageType: DrawImageType, posingLayer: PosingLayer, ctx: DocumentContext) {

    const posingData = posingLayer.posingData
    const posingModel = posingLayer.posingModel

    const needsDrawing = (
      posingData != null
      && posingData.bodyLocationInputData.inputDone
      && ctx.subtoolID == SubToolID.p3d_locateHips
    )

    if (!needsDrawing) {
      return
    }

    Maths.copyTranslation(this.tempVec3, posingData.bodyRotationCenterMatrix)
    mat4.identity(this.tmpMatrix)
    mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3)

    const scale = posingModel.bodyRotationSphereSize
    mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale))

    if (drawImageType == DrawImageType.visualImage) {

      this.drawZTestSphere(this.locationMatrix, posingData.bodyRotationInputData.inputSideID, ctx)
    }
    else {

      this.render.clearDepthBuffer()

      this.drawZTestSphereDepth(this.locationMatrix, posingData.bodyRotationInputData.inputSideID)
    }
  }

  private drawSphere(drawImageType: DrawImageType, inputSideID: InputSideID, rootMatrix: Mat4, scale: float, posingLayer: PosingLayer, ctx: DocumentContext) {

    Maths.copyTranslation(this.tempVec3, rootMatrix)
    mat4.identity(this.tmpMatrix)
    mat4.translate(this.locationMatrix, this.tmpMatrix, this.tempVec3)

    mat4.scale(this.locationMatrix, this.locationMatrix, vec3.set(this.tempVec3, scale, scale, scale))

    if (drawImageType == DrawImageType.visualImage) {

      this.drawZTestSphere(this.locationMatrix, inputSideID, ctx)
    }
    else {

      this.render.clearDepthBuffer()

      this.drawZTestSphereDepth(this.locationMatrix, inputSideID)
    }
  }

  private isHeadDrawable(posingData: PosingData): boolean {

    return (posingData != null
      && (posingData.headLocationInputData.inputDone
        || posingData.headRotationInputData.inputDone))
  }

  private isBodyDrawable(posingData: PosingData): boolean {

    return (posingData != null
      && posingData.bodyLocationInputData.inputDone
    )
  }

  private isLeftArm1Drawable(posingData: PosingData): boolean {

    return (posingData != null
      && posingData.leftArm1LocationInputData.inputDone
    )
  }

  private isRightArm1Drawable(posingData: PosingData): boolean {

    return (posingData != null
      && posingData.rightArm1LocationInputData.inputDone
    )
  }

  private isLeftLeg1Drawable(posingData: PosingData): boolean {

    return (posingData != null
      && posingData.leftLeg1LocationInputData.inputDone
    )
  }

  private isRightLeg1Drawable(posingData: PosingData): boolean {

    return (posingData != null
      && posingData.rightLeg1LocationInputData.inputDone
    )
  }

  private setShaderParameters(locationMatrix: Mat4, flipSide: boolean, shader: PosingFigureShader) {

    mat4.copy(this.modelMatrix, locationMatrix)

    const wnd = this.webglWindow
    const cullingBackFace = !wnd.mirrorX

    if (flipSide) {

      mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.tempVec3, 1.0, -1.0, 1.0))
      //cullingBackFace = !cullingBackFace
    }

    this.render.setCullingBackFace(cullingBackFace)

    mat4.multiply(this.modelViewMatrix, this.viewMatrix, this.modelMatrix)

    mat4.copy(this.normalMatrix, this.modelViewMatrix)
    this.normalMatrix[12] = 0.0
    this.normalMatrix[13] = 0.0
    this.normalMatrix[14] = 0.0

    if (flipSide) {

      mat4.scale(this.normalMatrix, this.normalMatrix, vec3.set(this.tempVec3, -1.0, -1.0, -1.0))
    }

    this.render.setShader(shader)

    shader.setProjectionMatrix(this.projectionMatrix)
    shader.setModelViewMatrix(this.modelViewMatrix)
    shader.setNormalMatrix(this.normalMatrix)
  }

  private drawZTestSphere(locationMatrix: Mat4, inputSideID: InputSideID, ctx: DocumentContext) {

    const modelResource: ModelResource = this.zTestShpereModel

    const flipSide = (inputSideID == InputSideID.back)
    this.setShaderParameters(locationMatrix, flipSide, this.posingFigureShader)

    if (this.isHeadDrawable(ctx.currentPosingData)) {
      this.posingFigureShader.setAlpha(0.3)
    }
    else {
      this.posingFigureShader.setAlpha(0.8)
    }

    this.drawModel(this.posingFigureShader, modelResource.model, this.imageResurces[0].image)

    this.render.setCullingBackFace(true)
  }

  private drawZTestSphereDepth(locationMatrix: Mat4, inputSideID: InputSideID) {

    const flipSide = (inputSideID == InputSideID.back)
    this.setShaderParameters(locationMatrix, flipSide, this.depthShader)

    this.drawModel(this.depthShader, this.zTestShpereModel.model, this.imageResurces[0].image)

    this.drawModel(this.depthShader, this.zTestShpereEdgeModel.model, this.imageResurces[0].image)
  }

  private drawAxis(locationMatrix: Mat4, scale: float, alpha: float) {

    mat4.copy(this.modelMatrix, locationMatrix)
    mat4.scale(this.modelMatrix, this.modelMatrix, vec3.set(this.tempVec3, scale, scale, scale))

    this.setShaderParameters(this.modelMatrix, false, this.posingFigureShader)

    this.posingFigureShader.setAlpha(alpha)

    this.drawModel(this.posingFigureShader, this.axisModel.model, this.imageResurces[0].image)
  }

  private drawModel(shader: PosingFigureShader, model: RenderModel, image: RenderImage) {

    shader.setBuffers(model, [image])

    this.render.activeTexture(image)

    this.render.drawElements(model)
  }

  private caluculateCameraMatrix(posingData: PosingData) {

    const wnd = this.webglWindow
    const real3DViewHalfWidth = posingData.real3DViewMeterPerPixel * (wnd.height / 2.0)

    // Camera position
    vec3.set(this.lookatLocation, 0.0, -1.0, 0.0)
    vec3.set(this.upVector, 0.0, 0.0, 1.0)
    vec3.set(this.eyeLocation, 0.0, 0.0, 0.0)

    // 2D scale
    const viewScale = wnd.viewScale

    // Projection
    const orthoWidth = real3DViewHalfWidth / viewScale
    mat4.ortho(this.real3DProjectionMatrix, -real3DViewHalfWidth, real3DViewHalfWidth, -real3DViewHalfWidth, real3DViewHalfWidth, 0.1, 10.0)
    mat4.ortho(this.projectionMatrix, -orthoWidth, orthoWidth, -orthoWidth, orthoWidth, 0.1, 10.0)

    // 2D rendering
    wnd.caluclateGLViewMatrix(this.tmpMatrix)
    mat4.multiply(this.projectionMatrix, this.tmpMatrix, this.projectionMatrix)

    mat4.invert(this.projectionInvMatrix, this.projectionMatrix)

    mat4.lookAt(this.viewMatrix, this.eyeLocation, this.lookatLocation, this.upVector)

    mat4.invert(this.cameraMatrix, this.viewMatrix)
  }

  calculate3DLocationFrom2DLocation(result: Vec3, real2DLocation: Vec3, depth: float, posingData: PosingData) {

    const wnd = this.webglWindow

    this.caluculateCameraMatrix(posingData) // TODO: 毎回実行する必要はないため高速化を考える

    vec3.transformMat4(this.screenLocation, real2DLocation, wnd.transformMatrix)

    const viewHalfWidth = wnd.width / 2
    const viewHalfHeight = wnd.height / 2
    this.screenLocation[0] = (this.screenLocation[0] - viewHalfWidth) / viewHalfWidth
    this.screenLocation[1] = -(this.screenLocation[1] - viewHalfHeight) / viewHalfHeight
    this.screenLocation[2] = 0.0

    vec3.transformMat4(this.invProjectedVec3, this.screenLocation, this.projectionInvMatrix)
    this.invProjectedVec3[2] = -depth

    vec3.transformMat4(result, this.invProjectedVec3, this.cameraMatrix)
  }

  calculate2DLocationFrom3DLocation(result: Vec3, real3DLocation: Vec3, posingData: PosingData): float {

    const wnd = this.webglWindow

    this.caluculateCameraMatrix(posingData) // TODO: 毎回実行する必要はないため高速化を考える

    vec3.transformMat4(result, real3DLocation, this.viewMatrix)

    const depth = result[2]

    vec3.transformMat4(result, result, this.real3DProjectionMatrix)

    result[0] *= (wnd.height / 2.0)
    result[1] *= -(wnd.height / 2.0)

    return depth
  }

  pick3DLocationFromDepthImage(result: Vec3, location2d: Vec3, posingData: PosingData, pickingWindow: CanvasWindow, maxDepth: float): boolean {

    vec3.transformMat4(this.tempVec3, location2d, pickingWindow.transformMatrix)

    if (this.tempVec3[0] < 0 || this.tempVec3[0] >= pickingWindow.width
      || this.tempVec3[1] < 0 || this.tempVec3[1] >= pickingWindow.height) {

      return false
    }

    const imageData = pickingWindow.context.getImageData(Math.floor(this.tempVec3[0]), Math.floor(this.tempVec3[1]), 1, 1)
    const r = imageData.data[0]
    const g = imageData.data[1]
    const b = imageData.data[2]

    if (r == 0 && g == 0 && b == 0) {

      return false
    }

    let depth = (r / 255) + (g / Math.pow(255, 2)) + (b / Math.pow(255, 3))

    depth *= maxDepth

    this.calculate3DLocationFrom2DLocation(result, location2d, depth, posingData)

    return true
  }
}

export class PosingFigureShader extends RenderShader {

  protected aPosition = -1
  protected aNormal = -1
  protected aTexCoord = -1

  protected uTexture0: WebGLUniformLocation = null
  protected uNormalMatrix: WebGLUniformLocation = null
  protected uAlpha: WebGLUniformLocation = null

  initializeVertexSourceCode() {

    this.vertexShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uNormalMatrix;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;

void main(void) {

  gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);

  vPosition = (uMVMatrix * vec4(aPosition, 1.0)).xyz;
  vNormal = (uNormalMatrix * vec4(aNormal, 1.0)).xyz;
  vTexCoord = aTexCoord;
}
`
  }

  initializeFragmentSourceCode() {

    this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;

uniform sampler2D uTexture0;
uniform float uAlpha;

void main(void) {

  vec3  directionalLight = normalize(vec3(0.0, 1.0, 1.0));

  vec3  nnormal = normalize(vNormal);
  float directional = clamp(dot(nnormal, directionalLight), 0.0, 1.0);

  vec3  viewVec = normalize(vPosition);
  float specular = pow(max(dot(nnormal, normalize(directionalLight - viewVec)), 0.0), 5.0);

  vec4 texColor = texture2D(uTexture0, vTexCoord);
  gl_FragColor = vec4(texColor.rgb * 0.2 + texColor.rgb * directional * 0.8, texColor.a * uAlpha);

}
`
  }

  initializeAttributes() {

    this.initializeAttributes_RenderShader()
    this.initializeAttributes_PosingFigureShader()
  }

  initializeAttributes_PosingFigureShader() {

    this.aPosition = this.getAttribLocation('aPosition')
    this.aNormal = this.getAttribLocation('aNormal')
    this.aTexCoord = this.getAttribLocation('aTexCoord')

    this.uTexture0 = this.getUniformLocation('uTexture0')

    this.uNormalMatrix = this.getUniformLocation('uNormalMatrix')
    this.uAlpha = this.getUniformLocation('uAlpha')
  }

  setBuffers(model: RenderModel, images: RenderImage[]) {

    if (this.isDisabled()) {
      return
    }

    const gl = this.gl

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer)

    this.enableVertexAttributes()
    this.resetVertexAttribPointerOffset()

    this.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, model.vertexDataStride)
    this.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, model.vertexDataStride)
    this.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, model.vertexDataStride)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, images[0].texture)
    gl.uniform1i(this.uTexture0, 0)
  }

  setNormalMatrix(matrix: Mat4) {

    if (this.isDisabled()) {
      return
    }

    this.gl.uniformMatrix4fv(this.uNormalMatrix, false, matrix)
  }

  setAlpha(alpha: float) {

    if (this.isDisabled()) {
      return
    }

    this.gl.uniform1f(this.uAlpha, alpha)
  }
}

export class DepthShader extends PosingFigureShader {

  uMaxDepth: WebGLUniformLocation = null

  initializeFragmentSourceCode() {

    this.fragmentShaderSourceCode = `

${this.floatPrecisionDefinitionCode}

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;

uniform sampler2D uTexture0;

uniform float uMaxDepth;
uniform float uAlpha;

void main(void) {

  float z1 = (-vPosition.z) / uMaxDepth * 255.0;
  float z2 = fract(z1) * 255.0;
  float z3 = fract(z2) * 255.0;

  float r = floor(z1) / 255.0;
  float g = floor(z2) / 255.0;
  float b = floor(z3) / 255.0;

  gl_FragColor = vec4(r, g, b , 1.0);
}
`
  }

  initializeAttributes() {

    this.initializeAttributes_RenderShader()
    this.initializeAttributes_PosingFigureShader()
    this.initializeAttributes_DepthShader()
  }

  initializeAttributes_DepthShader() {

    this.uMaxDepth = this.getUniformLocation('uMaxDepth')
  }

  setMaxDepth(depth: float) {

    if (this.isDisabled()) {
      return
    }

    this.gl.uniform1f(this.uMaxDepth, depth)
  }
}
