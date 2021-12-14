import { float, int } from './logics/conversion'
import { AutoFillLayer, DocumentBackGroundTypeID, DocumentData, ImageFileReferenceLayer, Layer, VectorLayer } from './document_data'
import { OperationUnitID } from './tool/constants'
import { ToolDrawingStyle } from "./drawing/drawing_style"
import { Logic_GPULine } from './logics/gpu_line'
import { Platform } from '../platform/platform'
import { Posing3DView } from './posing3d/posing3d_view'
import { CanvasRender, CanvasWindow } from './render/render2d'
import { WebGLRender } from './render/render3d'
import { DrawingEyesSymmetryLogic } from './drawing/drawing_eyes_symmetry'
import { DrawingImageFileReferenceLayerLogic } from './drawing/drawing_image_file_reference_layer'
import { DrawingPosing3DLogic } from './drawing/drawing_posing3d'
import { DrawingStrokeLogic } from './drawing/drawing_stroke'
import { DrawingVectorLayerLogic } from './drawing/drawing_vector_layer'
import { DrawPathContext, DrawPathOperationTypeID, DrawPathModeID, DrawPathStep } from './drawing/draw_path'
import { DrawPathBufferingLogic } from './drawing/draw_path_buffering'
import { DrawPathCollectingLogic } from './drawing/draw_path_collecting'
import { MainCanvasEditorDrawer } from './editor/editor_drawer'
import { OperatorCursorLogic } from './editor/operator_cursor'
import { BezierDistanceLineShader, BezierLineShader, GPULineShader, PolyLineShader } from './rendering/rendering_shaders'
import { RenderingVectorLayerLogic } from './rendering/rendering_vector_layer'
import { ViewKeyframeLayer, ViewKeyframe } from './view/view_keyframe'
import { App_View } from '../app/view'

export class App_Drawing {

  // Sub logics

  drawingStroke = new DrawingStrokeLogic()
  editorDrawer = new MainCanvasEditorDrawer()
  operatorCursor = new OperatorCursorLogic()
  drawingVectorLayer = new DrawingVectorLayerLogic()
  drawingIFRLayer = new DrawingImageFileReferenceLayerLogic()
  drawingEyesSymmetry = new DrawingEyesSymmetryLogic()
  drawingPosing3D = new DrawingPosing3DLogic()
  renderingVectorLayer = new RenderingVectorLayerLogic()

  drawGPURender = new WebGLRender()
  polyLineShader = new PolyLineShader()
  bezierLineShader = new BezierLineShader()
  bezierDistanceLineShader = new BezierDistanceLineShader()
  lineShader: GPULineShader = this.bezierDistanceLineShader

  posing3DViewRender = new WebGLRender()
  posing3DView = new Posing3DView()

  logic_GPULine = new Logic_GPULine()

  drawPathCollecting = new DrawPathCollectingLogic()
  drawPathBuffering = new DrawPathBufferingLogic()
  drawPath_logging = false

  currentViewKeyframe: ViewKeyframe = null
  previousKeyframe: ViewKeyframe = null
  nextKeyframe: ViewKeyframe = null

  drawPathContext = new DrawPathContext()
  lazy_DrawPathContext = new DrawPathContext()

  canvasRender = new CanvasRender()
  drawStyle = new ToolDrawingStyle()

  layerPickingPositions = [[0.0, 0.0], [0.0, -2.0], [2.0, 0.0], [0.0, 2.0], [-2.0, 0.0]]

  private appView: App_View = null

  private tempColor4 = vec4.create()

  link(appView: App_View) {

    this.appView = appView
    this.drawingStroke.link(this.canvasRender, this.drawStyle)
    this.editorDrawer.link(this.canvasRender, this.drawStyle, this.drawingStroke, this.appView.mainWindow)
    this.operatorCursor.link(this.canvasRender, this.drawStyle, this.drawingStroke)
    this.drawingVectorLayer.link(this.drawStyle, this.drawingStroke)
    this.drawingIFRLayer.link(this.canvasRender)
    this.drawingEyesSymmetry.link(this.canvasRender, this.drawStyle, this.drawingStroke)
    this.drawingPosing3D.link(this.posing3DViewRender, this.posing3DView)
    this.renderingVectorLayer.link(this.drawGPURender, this.lineShader, this.drawingVectorLayer, this.logic_GPULine)
  }

  // Initializing

  initializeDrawingDevices(webglWindow: CanvasWindow, drawGPUWindow: CanvasWindow) {

    // this.canvasRender.setContext(this.layerWindow)
    // this.canvasRender.setFontSize(18.0)

    if (this.posing3DViewRender.initializeWebGL(webglWindow.canvas, true)) {

      console.log('３Ｄポージング機能を初期化できませんでした。')
    }

    //this.pickingWindow.initializeContext()

    this.posing3DView.initialize(this.posing3DViewRender, webglWindow)

    if (this.drawGPURender.initializeWebGL(drawGPUWindow.canvas, false)) {

      console.log('３Ｄ描画機能を初期化できませんでした。')
    }

    try {

      this.drawGPURender.initializeShader(this.polyLineShader)
      this.drawGPURender.initializeShader(this.bezierLineShader)
      this.drawGPURender.initializeShader(this.bezierDistanceLineShader)
    }
    catch (errorMessage) {

      console.log('シェーダの初期化に失敗しました。' + errorMessage)
    }
  }

  // Common drawing methods

  clearWindow(canvasWindow: CanvasWindow) {

    this.canvasRender.setContext(canvasWindow)

    this.canvasRender.resetTransform()

    this.canvasRender.clearRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height)

    this.canvasRender.cancelLocalTransform()
  }

  drawFullWindowImage(dstWindow: CanvasWindow, srcWindow: CanvasWindow) {

    this.canvasRender.setContext(dstWindow)

    this.canvasRender.resetTransform()

    this.canvasRender.drawImage(srcWindow.canvas
      , 0, 0, srcWindow.width, srcWindow.height
      , 0, 0, dstWindow.width, dstWindow.height)

    this.canvasRender.cancelLocalTransform()
  }

  // Document drawing

  drawForeground(
    viewKeyFrameLayer: ViewKeyframeLayer,
    documentData: DocumentData,
    isExporting: boolean,
    isModalToolRunning: boolean,
    isEditMode: boolean
  ) {

    const layer = viewKeyFrameLayer.layer

    if (VectorLayer.isVectorLayer(layer)) {

      const vectorLayer = <VectorLayer>layer

      this.drawingVectorLayer.drawForeground(
        vectorLayer,
        viewKeyFrameLayer.vectorLayerKeyframe.geometry,
        documentData,
        isEditMode,
        isExporting,
        isModalToolRunning
      )

      if (vectorLayer.eyesSymmetryEnabled && vectorLayer.eyesSymmetryGeometry != null) {

        this.drawingVectorLayer.drawForeground(
          vectorLayer,
          vectorLayer.eyesSymmetryGeometry,
          documentData,
          isEditMode,
          isExporting,
          isModalToolRunning
        )
      }
    }
    else if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      const ifrLayer = <ImageFileReferenceLayer>layer

      this.drawingIFRLayer.drawImageFileReferenceLayer(ifrLayer, isModalToolRunning)
    }
  }

  drawBackground(
    viewKeyFrameLayer: ViewKeyframeLayer,
    documentData: DocumentData,
    isExporting: boolean,
    isModalToolRunning: boolean,
    isEditMode: boolean
  ) {

    const layer = viewKeyFrameLayer.layer

    if (VectorLayer.isVectorLayer(layer)) {

      const vectorLayer = <VectorLayer>layer
      const geometry = viewKeyFrameLayer.vectorLayerKeyframe.geometry

      this.drawingVectorLayer.drawBackground(
        vectorLayer,
        geometry,
        documentData,
        Layer.isSelected(layer),
        isEditMode,
        isExporting,
        isModalToolRunning
      )
    }
    else if (AutoFillLayer.isAutoFillLayer(layer)) {

      const autoFillLayer = <AutoFillLayer>layer
      const geometry = autoFillLayer.geometry

      this.drawingVectorLayer.drawBackground(
        autoFillLayer,
        geometry,
        documentData,
        Layer.isSelected(layer),
        isEditMode,
        isExporting,
        isModalToolRunning
      )
    }
  }

  drawForegroundForEditMode(
    vectorLayer: VectorLayer,
    viewKeyFrameLayer: ViewKeyframeLayer,
    documentData: DocumentData,
    operationUnitID: OperationUnitID,
    drawStrokes: boolean,
    drawPoints: boolean,
    isModalToolRunning: boolean,
    isEditMode: boolean
  ) {

    const isSelectedLayer = Layer.isSelected(vectorLayer)

    this.drawingVectorLayer.drawForegroundForEditMode(
      vectorLayer,
      viewKeyFrameLayer.vectorLayerKeyframe.geometry,
      documentData,
      operationUnitID,
      isEditMode,
      isSelectedLayer,
      drawStrokes,
      drawPoints,
      isModalToolRunning
    )

    if (vectorLayer.eyesSymmetryEnabled && vectorLayer.eyesSymmetryGeometry != null) {

      this.drawingVectorLayer.drawForegroundForEditMode(
        vectorLayer,
        vectorLayer.eyesSymmetryGeometry,
        documentData,
        operationUnitID,
        isEditMode,
        false,
        drawStrokes,
        drawPoints,
        isModalToolRunning
      )
    }
  }

  drawExportImage(canvasWindow: CanvasWindow, documentData: DocumentData, viewKeyframe: ViewKeyframe, imageLeft: int, imageTop: int, imageWidth: int, imageHeight: int, scale: float, backGroundType: DocumentBackGroundTypeID) {

    this.clearWindow(canvasWindow)

    if (backGroundType == DocumentBackGroundTypeID.lastPaletteColor) {

      this.canvasRender.setContext(canvasWindow)
      this.canvasRender.resetTransform()
      this.canvasRender.setFillColorV(documentData.paletteColors[documentData.paletteColors.length - 1].color)
      this.canvasRender.fillRect(0, 0, imageWidth, imageHeight)
    }

    canvasWindow.viewLocation[0] = imageLeft
    canvasWindow.viewLocation[1] = imageTop
    canvasWindow.viewScale = scale
    canvasWindow.viewRotation = 0.0
    canvasWindow.centerLocationRate[0] = 0.0
    canvasWindow.centerLocationRate[1] = 0.0

    const drawPathContext = new DrawPathContext()

    this.drawPathCollecting.collectDrawPaths(
      drawPathContext,
      documentData,
      viewKeyframe
    )

    drawPathContext.drawPathModeID = DrawPathModeID.export
    drawPathContext.startIndex = 0
    drawPathContext.endIndex = drawPathContext.steps.length - 1

    this.drawPathBuffering.prepareDrawPathBuffers(drawPathContext, canvasWindow, true)

    this.drawDrawPaths(canvasWindow, drawPathContext, true, canvasWindow)
  }

  // Layer picking

  pickLayer(canvasWindow: CanvasWindow, viewKeyframe: ViewKeyframe, documentData: DocumentData, pickLocationX: float, pickLocationY: float): Layer {

    let pickedLayer = null
    for (const viewKeyframeLayer of viewKeyframe.layers) {

      const layer = viewKeyframeLayer.layer

      if (!Layer.isVisible(layer) || !VectorLayer.isVectorLayer(layer)) {
        continue
      }

      const vectorLayer = <VectorLayer>layer

      this.clearWindow(canvasWindow)

      this.canvasRender.setContext(canvasWindow)

      this.drawingVectorLayer.drawBackground(
        vectorLayer,
        viewKeyframeLayer.vectorLayerKeyframe.geometry,
        documentData,
        Layer.isSelected(layer),
        false,
        false,
        false
      )

      this.drawingVectorLayer.drawForeground(
        vectorLayer,
        viewKeyframeLayer.vectorLayerKeyframe.geometry,
        documentData,
        false,
        false,
        false
      )

      this.canvasRender.pickColor(this.tempColor4, pickLocationX, pickLocationY)

      if (this.tempColor4[3] > 0.0) {

        pickedLayer = layer
        break
      }
    }

    return pickedLayer
  }

  // Draw path

  collectDrawPaths(documentData: DocumentData) {

    this.drawPathCollecting.collectDrawPaths(
      this.drawPathContext,
      documentData,
      this.currentViewKeyframe
    )

    this.lazy_DrawPathContext.steps = this.drawPathContext.steps
  }

  drawDrawPaths(canvasWindow: CanvasWindow, drawPathContext: DrawPathContext, clearState: boolean, transformWindow: CanvasWindow = null) {

    const startTime = Platform.getCurrentTime()
    const documentData = drawPathContext.documentData
    const isFullRendering = drawPathContext.isFullRendering()
    const isExporting = drawPathContext.isExporting()
    const isIncremental = drawPathContext.isIncremental()
    const isEditMode = drawPathContext.isEditMode()

    if (transformWindow == null) {

      transformWindow = this.appView.mainWindow
    }

    let bufferCanvasWindow = canvasWindow

    if (clearState) {

      drawPathContext.clearDrawingStates()

      drawPathContext.bufferStack.push(canvasWindow)

      this.canvasRender.setContext(canvasWindow)
    }
    else {

      bufferCanvasWindow = drawPathContext.bufferStack.pop()

      this.canvasRender.setContext(bufferCanvasWindow)
    }

    if (this.drawPath_logging) {

      console.debug('  DrawPath start clearState', clearState)
    }

    for (let i = drawPathContext.startIndex; i <= drawPathContext.endIndex; i++) {

      const drawPathStep = drawPathContext.steps[i]

      drawPathContext.lastDrawPathIndex = i

      const viewKeyFrameLayer = drawPathStep.viewKeyframeLayer
      const layer = viewKeyFrameLayer ? viewKeyFrameLayer.layer : null

      if (this.drawPath_logging) {

        console.debug('  DrawPath', i, drawPathStep._debugText, layer ? layer.name : '', 'stack:', drawPathContext.bufferStack.length)
      }

      if (drawPathStep.operationType == DrawPathOperationTypeID.beginDrawing) {

        if (!isExporting) {

          this.clearWindow(canvasWindow)
        }

        // transformWindow.copyTransformTo(canvasWindow)
        // this.canvasRender.setTransform(canvasWindow)
        this.canvasRender.copyTransformFromWindow(transformWindow)
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.drawForeground
        || drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

        if (isExporting && !layer.isRenderTarget) {

          continue
        }
        else if (!this.drawDrawPaths_isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {

          continue
        }

        // Draw layer to current buffer
        this.drawDrawPaths_setCompositeOperation(drawPathContext, drawPathStep)

        if (drawPathStep.operationType == DrawPathOperationTypeID.drawForeground) {

          if (isFullRendering) {

            // GPU rendering
            if (VectorLayer.isVectorLayer(layer)) {

              transformWindow.copyTransformTo(this.appView.drawGPUWindow)
              this.appView.drawGPUWindow.viewScale *= (this.appView.drawGPUWindow.width / transformWindow.width)

              this.renderingVectorLayer.renderForeground_VectorLayer(
                this.appView.drawGPUWindow,
                viewKeyFrameLayer,
                documentData,
                isEditMode,
                drawPathContext.isModalToolRunning)
            }
          }
          else {

            // CPU drawing
            this.drawForeground(
              viewKeyFrameLayer,
              documentData,
              isExporting,
              drawPathContext.isModalToolRunning,
              isEditMode
            )
          }
        }
        else if (drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

          this.drawBackground(
            viewKeyFrameLayer,
            documentData,
            isExporting,
            drawPathContext.isModalToolRunning,
            isEditMode
          )
        }

        this.canvasRender.setCompositeOperation('source-over')
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.prepareRendering) {

        if (isFullRendering) {

          this.renderingVectorLayer.renderClearBuffer(this.appView.drawGPUWindow)
        }
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.flushRendering) {

        if (isFullRendering) {

          this.canvasRender.setContext(bufferCanvasWindow)

          this.drawDrawPaths_setCompositeOperation(drawPathContext, drawPathStep)

          this.drawFullWindowImage(bufferCanvasWindow, this.appView.drawGPUWindow)

          this.canvasRender.setCompositeOperation('source-over')
        }
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.prepareBuffer) {

        if (!this.drawDrawPaths_isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {

          continue
        }

        // Prepare buffer

        const buffer = drawPathStep.getBuffer()

        drawPathContext.bufferStack.push(bufferCanvasWindow)

        bufferCanvasWindow = buffer.canvasWindow

        this.canvasRender.setContext(bufferCanvasWindow)
        this.clearWindow(bufferCanvasWindow)

        // transformWindow.copyTransformTo(bufferCanvasWindow)
        // this.canvasRender.setTransform(bufferCanvasWindow)
        this.canvasRender.copyTransformFromWindow(transformWindow)
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.flushBuffer) {

        if (!this.drawDrawPaths_isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {

          continue
        }

        // Flush buffered image to upper buffer

        const before_BufferCanvasWindow = drawPathContext.bufferStack.pop()

        this.canvasRender.setContext(before_BufferCanvasWindow)

        this.drawDrawPaths_setCompositeOperation(drawPathContext, drawPathStep)

        this.drawFullWindowImage(before_BufferCanvasWindow, bufferCanvasWindow)

        //this.canvasRender.setContext(before_BufferCanvasWindow)
        //this.canvasRender.resetTransform()
        //this.canvasRender.drawImage(bufferCanvasWindow.canvas
        //    , 0, 0, bufferCanvasWindow.width, bufferCanvasWindow.height
        //    , 0, 0, before_BufferCanvasWindow.width, before_BufferCanvasWindow.height)

        //this.canvasRender.setTransform(before_BufferCanvasWindow)

        bufferCanvasWindow = before_BufferCanvasWindow
      }

      const lastTime = Platform.getCurrentTime()

      if ((isIncremental && lastTime - startTime >= drawPathContext.lazyProcess.maxTime)
        || i == drawPathContext.endIndex) {

        drawPathContext.bufferStack.push(bufferCanvasWindow)
        break
      }
    }
  }

  private drawDrawPaths_isLayerDrawTarget(layer: Layer, currentLayerOnly: boolean) {

    if (currentLayerOnly) {

      if (!this.isdrawTargetForCurrentLayerOnly(layer)) {
        return false
      }
    }
    else {

      if (!Layer.isVisible(layer)) {
        return false
      }
    }

    return true
  }

  private drawDrawPaths_setCompositeOperation(drawPathContext: DrawPathContext, drawPathStep: DrawPathStep) {

    if (!drawPathContext.currentLayerOnly) {

      this.canvasRender.setCompositeOperation(drawPathStep.compositeOperation)
    }
    else {

      this.canvasRender.setCompositeOperation('source-over')
    }
  }

  isdrawTargetForCurrentLayerOnly(layer: Layer) {

    //return (layer != this.selectCurrentLayerAnimationLayer)
    return (Layer.isSelected(layer))
  }
}
