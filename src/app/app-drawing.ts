import { App_View } from './app-view'
import { float, int } from './common-logics'
import { DocumentContext } from './context'
import {
  AutoFillLayer, DocumentBackGroundTypeID, DocumentData, ImageFileReferenceLayer,
  Layer, OnionSkinMode, VectorLayer
} from './document-data'
import {
  DrawingEyesSymmetryLogic, DrawingImageFileReferenceLayerLogic, DrawingPointBrushLogic, DrawingPosing3DLogic, DrawingStrokeLogic,
  DrawingVectorLayerLogic, DrawPathBufferingLogic, DrawPathCollectingLogic, DrawPathContext, DrawPathModeID,
  DrawPathOperationTypeID, DrawPathStep, ToolDrawingStyle
} from "./document-drawing"
import { BezierDistanceLineShader, BezierLineShader, GPULineShader, Logic_GPULine, PolyLineShader, RenderingVectorLayerLogic } from './document-rendering'
import { MainCanvasEditorDrawer, OperatorCursorLogic } from './editor'
import { Posing3DView } from './posing3d'
import { CanvasRender, CanvasRenderBlendMode, CanvasWindow, WebGLRender } from './render'
import { OperationUnitID } from './tool'
import { ViewKeyframe, ViewKeyframeLayer } from './view'

enum DrawingLayerTargetID {

  foreLayer,
  backLayer
}

class OnionSiknDrawing {

  onionSkinMode = OnionSkinMode.disabled
  backward_DrawPathContexts: DrawPathContext[] = []
  forward_DrawPathContexts: DrawPathContext[] = []
}

export class App_Drawing {

  // Sub logics

  canvasRender = new CanvasRender()
  fullScreen_canvasRender = new CanvasRender()
  local_canvasRender = new CanvasRender()
  drawGPURender = new WebGLRender()
  drawingStroke = new DrawingStrokeLogic()
  drawingPointBrush = new DrawingPointBrushLogic()
  editorDrawer = new MainCanvasEditorDrawer()
  operatorCursor = new OperatorCursorLogic()
  drawingVectorLayer = new DrawingVectorLayerLogic()
  drawingIFRLayer = new DrawingImageFileReferenceLayerLogic()
  drawingEyesSymmetry = new DrawingEyesSymmetryLogic()
  drawingPosing3D = new DrawingPosing3DLogic()
  drawPathCollecting = new DrawPathCollectingLogic()
  drawPathBuffering = new DrawPathBufferingLogic()
  logic_GPULine = new Logic_GPULine()
  renderingVectorLayer = new RenderingVectorLayerLogic()
  posing3DViewRender = new WebGLRender()
  posing3DView = new Posing3DView()
  drawStyle = new ToolDrawingStyle()

  private appView: App_View = null

  // Own variables

  main_drawPathContext = new DrawPathContext()
  lazy_drawPathContext = new DrawPathContext()

  private layerPickingLocations = [[0.0, 0.0], [0.0, -2.0], [2.0, 0.0], [0.0, 2.0], [-2.0, 0.0]]
  private onionSiknDrawing = new OnionSiknDrawing()
  private polyLineShader = new PolyLineShader()
  private bezierLineShader = new BezierLineShader()
  private bezierDistanceLineShader = new BezierDistanceLineShader()
  private lineShader: GPULineShader = this.bezierDistanceLineShader
  private tempColor4 = vec4.create()
  private pickLayer_canvasWindow = new CanvasWindow()
  private drawPath_logging = false

  link(appView: App_View) {

    this.appView = appView
    this.drawingPointBrush.link(this.drawStyle)
    this.editorDrawer.link(this.canvasRender, this.drawStyle, this.appView.mainWindow, this.drawingStroke, this.drawingPointBrush)
    this.operatorCursor.link(this.canvasRender, this.drawStyle, this.editorDrawer)
    this.drawingVectorLayer.link(this.canvasRender, this.drawStyle, this.drawingStroke, this.drawingPointBrush, this.editorDrawer)
    this.drawingIFRLayer.link(this.canvasRender)
    this.drawingEyesSymmetry.link(this.canvasRender, this.drawStyle, this.editorDrawer)
    this.drawingPosing3D.link(this.posing3DViewRender, this.posing3DView)
    this.renderingVectorLayer.link(this.drawGPURender, this.lineShader, this.drawingVectorLayer, this.logic_GPULine)
  }

  // Initializing

  initializeDrawingDevices(webglWindow: CanvasWindow, drawGPUWindow: CanvasWindow) {

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

  private drawFullWindowImage(dstWindow: CanvasWindow, srcWindow: CanvasWindow) {

    this.fullScreen_canvasRender.setContext(dstWindow)

    this.fullScreen_canvasRender.resetTransform()

    this.fullScreen_canvasRender.drawImage(
      srcWindow.canvas,
      0, 0,
      srcWindow.width, srcWindow.height,
      0, 0,
      dstWindow.width, dstWindow.height
    )
  }

  clearWindow(canvasWindow: CanvasWindow) {

    this.fullScreen_canvasRender.setContext(canvasWindow)
    this.fullScreen_canvasRender.clear()
  }

  // Collecting draw paths

  collectDrawPathsForDocument(docContext: DocumentContext) {

    this.drawPathCollecting.collectDrawPaths(
      this.main_drawPathContext,
      docContext.documentData,
      docContext.currentViewKeyframe
    )

    this.lazy_drawPathContext.steps = this.main_drawPathContext.steps

    if (docContext.documentData.animationSettingData.onionSkinMode != OnionSkinMode.disabled) {

      this.onionSiknDrawing.backward_DrawPathContexts = this.collectOnionSkinDrawPaths(docContext, false)
      this.onionSiknDrawing.forward_DrawPathContexts = this.collectOnionSkinDrawPaths(docContext, true)
    }
    else {

      this.onionSiknDrawing.backward_DrawPathContexts = []
      this.onionSiknDrawing.forward_DrawPathContexts = []
    }
  }

  private collectOnionSkinDrawPaths(docContext: DocumentContext, forward: boolean): DrawPathContext[] {

    const currentIndex = docContext.keyframes.findIndex(keyframe => keyframe == docContext.currentViewKeyframe)

    if (currentIndex === undefined) {
      throw new Error('ERROR 0000:Could not find current keyframe')
    }

    const indexStep = (forward ? 1 : -1)
    const oniokSkinLevelRate = (forward ? 1 : -1)
    const maxOnionSkinLevel = (forward ? docContext.documentData.animationSettingData.onionSkinForwardLevel : docContext.documentData.animationSettingData.onionSkinBackwardLevel)

    const result: DrawPathContext[] = []
    for (let index = currentIndex + indexStep; index >= 0 && index < docContext.keyframes.length;) {

      const viewKeyframe = docContext.keyframes[index]

      const drawPathContext = new DrawPathContext()
      drawPathContext.drawPathModeID = forward ? DrawPathModeID.onionSkinForward : DrawPathModeID.onionSkinBackward
      drawPathContext.onionSkinLevel = (1 + result.length) * oniokSkinLevelRate
      drawPathContext.maxOnionSkinLevel = maxOnionSkinLevel

      this.drawPathCollecting.collectDrawPaths(
        drawPathContext,
        docContext.documentData,
        viewKeyframe,
        false
      )

      result.push(drawPathContext)

      if (result.length >= maxOnionSkinLevel) {
        break
      }

      index += indexStep
    }

    return result
  }

  // Foundations for drawing draw path

  drawDrawPathContext(
    canvasWindow: CanvasWindow,
    drawPathContext: DrawPathContext,
    clearState = true,
    needsClearBackground = true,
    transformWindow: CanvasWindow = null
  ) {

    const documentData = drawPathContext.documentData
    const isFullRendering = drawPathContext.isFullRendering()
    const isExporting = drawPathContext.isExporting()
    const isLazyUpdate = drawPathContext.isLazyUpdate()
    const isEditMode = drawPathContext.isEditMode()

    // Preparing lazy process
    if (isLazyUpdate) {

      drawPathContext.lazyUpdateState.startPartialProcess()
    }

    // Transform for exporting
    if (transformWindow == null) {

      transformWindow = this.appView.mainWindow
    }

    // Determine a destination canvas
    let destination_canvasWindow = canvasWindow

    if (clearState) {

      drawPathContext.clearDrawingStates()

      drawPathContext.bufferStack.push(canvasWindow)

      drawPathContext.render.setContext(canvasWindow)
    }
    else {

      destination_canvasWindow = drawPathContext.bufferStack.pop()

      drawPathContext.render.setContext(destination_canvasWindow)
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

      // Process for each type of opetaion

      if (drawPathStep.operationType == DrawPathOperationTypeID.startDrawPaths) {

        if (needsClearBackground) {
          drawPathContext.render.clear()
        }

        drawPathContext.render.copyTransformFromWindow(transformWindow)
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.drawForeground
        || drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

        if (isExporting && !layer.isRenderTarget) {
          continue
        }

        if (!this.isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {
          continue
        }

        // Prepare for layer composition
        this.setCompositeOperation(drawPathContext, drawPathStep)

        // Prepare for render cache
        let render: CanvasRender
        let needsDraw = false
        if (drawPathStep.isCacheEnabled()) {

          if (drawPathStep.needsRedraw) {

            drawPathContext.local_render.setContext(drawPathStep.renderCache.canvasWindow)
            drawPathContext.local_render.clear()

            render = drawPathContext.local_render
            needsDraw = true

            // DEBUG
            // console.debug('drawDrawPathContext', drawPathStep.layer.name, drawPathStep.renderCache.width, drawPathStep.renderCache.height)
          }
        }
        else {

          drawPathContext.render.setContext(destination_canvasWindow)
          drawPathContext.render.copyTransformFromWindow(transformWindow)

          render = drawPathContext.render
          needsDraw = true
        }

        // Draw layer to current buffer
        if (needsDraw) {

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
              this.drawLayerForeground(
                render,
                drawPathStep,
                documentData,
                isExporting,
                drawPathContext.isModalToolRunning,
                isEditMode,
                drawPathContext.onionSkinLevel
              )
            }
          }
          else if (drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

            this.drawLayerBackground(
              render,
              drawPathStep,
              documentData,
              isExporting,
              drawPathContext.isModalToolRunning,
              isEditMode
            )
          }

          drawPathStep.needsRedraw = false
        }

        if (drawPathStep.isCacheEnabled()) {

          this.drawRenderCache(destination_canvasWindow, drawPathStep)
        }

        drawPathContext.render.setBlendMode(CanvasRenderBlendMode.default)
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.prepareRenderingForeground) {

        if (!isFullRendering) {
          continue
        }

        this.renderingVectorLayer.renderClearBuffer(this.appView.drawGPUWindow)
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.flushRenderingForeground) {

        if (!isFullRendering) {
          continue
        }

        drawPathContext.render.setContext(destination_canvasWindow)

        this.setCompositeOperation(drawPathContext, drawPathStep)

        this.drawFullWindowImage(destination_canvasWindow, this.appView.drawGPUWindow)

        drawPathContext.render.setBlendMode(CanvasRenderBlendMode.default)
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.prepareBuffer) {

        if (!this.isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {
          continue
        }

        // Prepare buffer

        drawPathContext.bufferStack.push(destination_canvasWindow)

        destination_canvasWindow = drawPathStep.buffer.canvasWindow

        drawPathContext.render.setContext(destination_canvasWindow)
        drawPathContext.render.clear()
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.flushBuffer) {

        if (!this.isLayerDrawTarget(layer, drawPathContext.currentLayerOnly)) {
          continue
        }

        // Flush buffered image to upper buffer

        const before_BufferCanvasWindow = drawPathContext.bufferStack.pop()

        drawPathContext.render.setContext(before_BufferCanvasWindow)

        this.setCompositeOperation(drawPathContext, drawPathStep)

        this.drawFullWindowImage(before_BufferCanvasWindow, destination_canvasWindow)

        destination_canvasWindow = before_BufferCanvasWindow
      }

      // Suspend for lazy process when over the max-time
      if ((isLazyUpdate && drawPathContext.lazyUpdateState.isOverPartialProcessMaxTime())
        || i == drawPathContext.endIndex) {

        drawPathContext.bufferStack.push(destination_canvasWindow)
        break
      }
    }
  }

  private drawDrawPathContexts(bufferCanvasWindow: CanvasWindow, drawPathContexts: DrawPathContext[], needsClearBackground: boolean) {

    for (const drawPathContext of drawPathContexts) {

      drawPathContext.startIndex = 0
      drawPathContext.endIndex = drawPathContext.steps.length - 1

      this.drawDrawPathContext(bufferCanvasWindow, drawPathContext, true, needsClearBackground)

      needsClearBackground = false
    }
  }

  private drawRenderCache(destination_canvasWindow: CanvasWindow, drawPathStep: DrawPathStep) {

    this.fullScreen_canvasRender.setContext(destination_canvasWindow)

    this.fullScreen_canvasRender.drawImage(
      drawPathStep.renderCache.canvasWindow.canvas,
      0, 0,
      drawPathStep.renderCache.width, drawPathStep.renderCache.height,
      drawPathStep.renderCache.location[0], drawPathStep.renderCache.location[1],
      drawPathStep.renderCache.width, drawPathStep.renderCache.height
    )
  }

  private isLayerDrawTarget(layer: Layer, currentLayerOnly: boolean) {

    if (currentLayerOnly) {

      return this.isdrawTargetForCurrentLayerOnly(layer)
    }
    else {

      return Layer.isVisible(layer)
    }
  }

  private isdrawTargetForCurrentLayerOnly(layer: Layer) {

    return (Layer.isSelected(layer))
  }

  private setCompositeOperation(drawPathContext: DrawPathContext, drawPathStep: DrawPathStep) {

    if (!drawPathContext.currentLayerOnly) {

      drawPathContext.render.setBlendMode(drawPathStep.compositeOperation)
    }
    else {

      drawPathContext.render.setBlendMode(CanvasRenderBlendMode.default)
    }
  }

  private drawLayerForeground(
    render: CanvasRender,
    drawPathStep: DrawPathStep,
    documentData: DocumentData,
    isExporting: boolean,
    isModalToolRunning: boolean,
    isEditMode: boolean,
    onionSkinLevel: int = 0,
    maxOnionSkinLevel: int = 1
  ) {

    const layer = drawPathStep.viewKeyframeLayer.layer

    if (VectorLayer.isVectorLayer(layer)) {

      const vectorLayer = <VectorLayer>layer

      this.drawingVectorLayer.drawForeground(
        render,
        vectorLayer,
        drawPathStep.viewKeyframeLayer.vectorLayerKeyframe.geometry,
        drawPathStep.renderCache,
        documentData,
        isEditMode,
        isExporting,
        isModalToolRunning,
        onionSkinLevel,
        maxOnionSkinLevel
      )

      if (vectorLayer.eyesSymmetryEnabled && vectorLayer.runtime.eyesSymmetryGeometry != null) {

        this.drawingVectorLayer.drawForeground(
          render,
          vectorLayer,
          vectorLayer.runtime.eyesSymmetryGeometry,
          drawPathStep.renderCache,
          documentData,
          isEditMode,
          isExporting,
          isModalToolRunning,
          onionSkinLevel,
          maxOnionSkinLevel
        )
      }
    }
    else if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      const ifrLayer = <ImageFileReferenceLayer>layer

      this.drawingIFRLayer.drawImageFileReferenceLayer(ifrLayer, isModalToolRunning)
    }
  }

  private drawLayerBackground(
    render: CanvasRender,
    drawPathStep: DrawPathStep,
    documentData: DocumentData,
    isExporting: boolean,
    isModalToolRunning: boolean,
    isEditMode: boolean
  ) {

    const layer = drawPathStep.viewKeyframeLayer.layer

    if (VectorLayer.isVectorLayer(layer)) {

      const vectorLayer = <VectorLayer>layer
      const geometry = drawPathStep.viewKeyframeLayer.vectorLayerKeyframe.geometry

      this.drawingVectorLayer.drawBackground(
        render,
        vectorLayer,
        geometry,
        documentData,
        Layer.isSelected(layer),
        isEditMode,
        isExporting,
        isModalToolRunning
      )

      if (isEditMode) {

        this.drawingVectorLayer.drawBackgroundExtra(
          render,
          vectorLayer,
          geometry,
          Layer.isSelected(layer),
          isEditMode,
          isModalToolRunning
        )
      }
    }
    else if (AutoFillLayer.isAutoFillLayer(layer)) {

      const autoFillLayer = <AutoFillLayer>layer
      const geometry = drawPathStep.viewKeyframeLayer.autoFillLayerKeyframe.geometry

      this.drawingVectorLayer.drawBackground(
        render,
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

  private drawForegroundForEditMode(
    render: CanvasRender,
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
      render,
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

    if (vectorLayer.eyesSymmetryEnabled && vectorLayer.runtime.eyesSymmetryGeometry != null) {

      this.drawingVectorLayer.drawForegroundForEditMode(
        render,
        vectorLayer,
        vectorLayer.runtime.eyesSymmetryGeometry,
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

  // Main window drawing

  drawMainWindow(
    result_canvasWindow: CanvasWindow,
    docContext: DocumentContext,
    isDrawMode: boolean,
    isEditMode: boolean,
    isModalToolRunning: boolean,
    drawCPUOnly: boolean,
    redrawActiveLayerOnly: boolean,
    currentLayerOnly: boolean
  ) {

    this.main_drawPathContext.render = this.canvasRender
    this.main_drawPathContext.local_render = this.local_canvasRender
    this.main_drawPathContext.isEditModeDraw = isEditMode
    this.main_drawPathContext.isModalToolRunning = isModalToolRunning
    this.main_drawPathContext.currentLayerOnly = currentLayerOnly
    this.main_drawPathContext.redrawActiveLayerOnly = redrawActiveLayerOnly
    this.main_drawPathContext.drawCPUOnly = drawCPUOnly

    this.onionSiknDrawing.onionSkinMode = docContext.documentData.animationSettingData.onionSkinMode

    this.main_drawPathContext.render.setContext(result_canvasWindow)
    this.main_drawPathContext.render.clear()

    if (isDrawMode) {

      this.drawDocumentForDrawMode(result_canvasWindow, this.main_drawPathContext, this.onionSiknDrawing)
    }
    else if (isEditMode) {

      this.drawDocumentForEditMode(result_canvasWindow, docContext, this.main_drawPathContext)
    }

    // Draw frames

    this.drawFrames(result_canvasWindow, docContext)
  }

  private drawDocumentForDrawMode(
    result_canvasWindow: CanvasWindow,
    drawPathContext: DrawPathContext,
    onionSiknDrawing: OnionSiknDrawing
  ) {

    // TODO: 必要なときだけ実行する
    this.drawPathCollecting.updateActiveDrawPathIndex(drawPathContext)
    const redrawActiveLayerOnly = drawPathContext.redrawActiveLayerOnly
    const activeRangeStartIndex = drawPathContext.activeDrawPathStartIndex
    const activeRangeEndIndex = drawPathContext.activeDrawPathEndIndex
    const maxStepIndex = drawPathContext.steps.length - 1

    const needsDrawForBackLayer = (redrawActiveLayerOnly && activeRangeStartIndex != -1)
    const needsDrawForForeLayer = (redrawActiveLayerOnly && activeRangeEndIndex < maxStepIndex)

    const needsOnionSkinDrawForBackLayer = (onionSiknDrawing.onionSkinMode == OnionSkinMode.showOnLowestLayer)
    const needsOnionSkinDrawForForeLayer = (onionSiknDrawing.onionSkinMode == OnionSkinMode.showOnTopLayer)

    const needsRedrawAllLayer = (!needsDrawForBackLayer && !needsDrawForForeLayer)

    // TODO: GPU描画に対応する
    // drawPathContext.drawPathModeID = DrawPathModeID.none
    // if (this.lazy_DrawPathContext.lazyUpdateState.isRendered && !isModalToolRunning && !drawCPUOnly) {
    //   drawPathContext.drawPathModeID = DrawPathModeID.lazyUpdate
    // }
    // else {
    //   drawPathContext.drawPathModeID = DrawPathModeID.editor
    // }
    drawPathContext.drawPathModeID = DrawPathModeID.editor

    drawPathContext.render.setContext(result_canvasWindow)

    let needsClearBackground = true

    // console.log('********')

    // Draw back layers
    if (needsDrawForBackLayer || needsOnionSkinDrawForBackLayer) {

      drawPathContext.startIndex = 0
      drawPathContext.endIndex = activeRangeStartIndex - 1

      // drawPathContext.log({tag: 'back', buffer: this.isBufferDrawnForNonActiveLayer, needsDrawForBackLayer, needsOnionSkinDrawForBackLayer})

      this.drawViaBufferForDrawMode(
        result_canvasWindow,
        this.appView.backLayerRenderBuffer,
        drawPathContext,
        DrawingLayerTargetID.backLayer,
        !drawPathContext.isNonActiveLayerBufferDrawingDone,
        needsDrawForBackLayer,
        needsOnionSkinDrawForBackLayer,
        onionSiknDrawing
      )

      needsClearBackground = false
    }

    // Draw current layers
    if (needsRedrawAllLayer) {

      drawPathContext.startIndex = 0
      drawPathContext.endIndex = maxStepIndex
    }
    else {

      drawPathContext.startIndex = activeRangeStartIndex
      drawPathContext.endIndex = activeRangeEndIndex
    }

    // drawPathContext.log({tag: 'current', redrawActiveLayerOnly})

    this.drawDrawPathContext(result_canvasWindow, drawPathContext, true, needsClearBackground)

    // Draw fore layers
    if (needsDrawForForeLayer || needsOnionSkinDrawForForeLayer) {

      drawPathContext.startIndex = activeRangeEndIndex + 1
      drawPathContext.endIndex = maxStepIndex

      // drawPathContext.log({tag: 'fore', buffer: this.isBufferDrawnForNonActiveLayer, needsDrawForForeLayer, needsOnionSkinDrawForForeLayer})

      this.drawViaBufferForDrawMode(
        result_canvasWindow,
        this.appView.foreLayerRenderBuffer,
        drawPathContext,
        DrawingLayerTargetID.foreLayer,
        !drawPathContext.isNonActiveLayerBufferDrawingDone,
        needsDrawForForeLayer,
        needsOnionSkinDrawForForeLayer,
        onionSiknDrawing
      )
    }

    drawPathContext.isNonActiveLayerBufferDrawingDone = !needsRedrawAllLayer
  }

  private drawViaBufferForDrawMode(
    result_canvasWindow: CanvasWindow,
    buffer_canvasWindow: CanvasWindow,
    drawPathContext: DrawPathContext,
    drawingLayerTarget: DrawingLayerTargetID,
    needsRedrawBuffer: boolean,
    needsDrawMainDrawPath: boolean,
    needsDrawOnionSkinDrawPath: boolean,
    onionSiknDrawing: OnionSiknDrawing
  ) {

    const isForeLayer = (drawingLayerTarget == DrawingLayerTargetID.foreLayer)

    // Draw layers to buffer if requested.

    if (needsRedrawBuffer || needsDrawOnionSkinDrawPath) {

      result_canvasWindow.copyTransformTo(buffer_canvasWindow)

      drawPathContext.render.setContext(buffer_canvasWindow)
      drawPathContext.render.clear()

      let needsClearBackground = true

      if (needsDrawOnionSkinDrawPath && !isForeLayer && onionSiknDrawing.onionSkinMode == OnionSkinMode.showOnLowestLayer) {

        this.drawDrawPathContexts(buffer_canvasWindow, onionSiknDrawing.backward_DrawPathContexts, true)
        this.drawDrawPathContexts(buffer_canvasWindow, onionSiknDrawing.forward_DrawPathContexts, false)
        needsClearBackground = false
      }

      if (needsDrawMainDrawPath) {

        this.drawDrawPathContext(buffer_canvasWindow, drawPathContext, true, needsClearBackground)
      }

      if (needsDrawOnionSkinDrawPath && isForeLayer && onionSiknDrawing.onionSkinMode == OnionSkinMode.showOnTopLayer) {

        this.drawDrawPathContexts(buffer_canvasWindow, onionSiknDrawing.backward_DrawPathContexts, false)
        this.drawDrawPathContexts(buffer_canvasWindow, onionSiknDrawing.forward_DrawPathContexts, false)
      }
    }

    // Draw layers from buffer.

    this.drawFullWindowImage(result_canvasWindow, buffer_canvasWindow)
  }

  drawDocumentForEditMode(
    result_canvasWindow: CanvasWindow,
    docContext: DocumentContext,
    drawPathContext: DrawPathContext
  ) {

    // TODO: 必要なときだけ実行する
    this.drawPathCollecting.updateActiveDrawPathIndex(drawPathContext)

    const isModalToolRunning = drawPathContext.isModalToolRunning
    const currentLayerOnly = drawPathContext.currentLayerOnly
    const redrawActiveLayerOnly = drawPathContext.redrawActiveLayerOnly
    const isEditMode = drawPathContext.isEditMode()
    const maxStepIndex = drawPathContext.steps.length - 1

    drawPathContext.render.setContext(result_canvasWindow)

    //redrawActiveLayerOnly = false

    if (redrawActiveLayerOnly && drawPathContext.activeDrawPathStartIndex != -1) {

      // Draw back layers
      if (drawPathContext.activeDrawPathStartIndex > 0) {

        drawPathContext.startIndex = 0
        drawPathContext.endIndex = drawPathContext.activeDrawPathStartIndex - 1

        this.drawViaBufferForEditMode(
          result_canvasWindow,
          this.appView.backLayerRenderBuffer,
          docContext,
          drawPathContext,
          !drawPathContext.isNonActiveLayerBufferDrawingDone,
          currentLayerOnly,
          isModalToolRunning,
          isEditMode
        )
      }

      // Draw current layers
      drawPathContext.startIndex = drawPathContext.activeDrawPathStartIndex
      drawPathContext.endIndex = drawPathContext.activeDrawPathEndIndex

      this.drawViaBufferForEditMode(
        result_canvasWindow,
        null,
        docContext,
        drawPathContext,
        true,
        currentLayerOnly,
        isModalToolRunning,
        isEditMode
      )

      // Draw fore layers
      if (drawPathContext.activeDrawPathEndIndex < maxStepIndex) {

        drawPathContext.startIndex = drawPathContext.activeDrawPathEndIndex + 1
        drawPathContext.endIndex = maxStepIndex

        this.drawViaBufferForEditMode(
          result_canvasWindow,
          this.appView.foreLayerRenderBuffer,
          docContext,
          drawPathContext,
          !drawPathContext.isNonActiveLayerBufferDrawingDone,
          currentLayerOnly,
          isModalToolRunning,
          isEditMode
        )
      }

      drawPathContext.isNonActiveLayerBufferDrawingDone = true
    }
    else {

      // Draw all layers
      drawPathContext.startIndex = 0
      drawPathContext.endIndex = maxStepIndex

      this.drawViaBufferForEditMode(
        result_canvasWindow,
        null,
        docContext,
        drawPathContext,
        true,
        currentLayerOnly,
        isModalToolRunning,
        isEditMode
      )

      drawPathContext.isNonActiveLayerBufferDrawingDone = false
    }
  }

  private drawViaBufferForEditMode(
    result_canvasWindow: CanvasWindow,
    buffer_canvasWindow: CanvasWindow,
    docContext: DocumentContext,
    drawPathContext: DrawPathContext,
    needsRedrawBuffer: boolean,
    currentLayerOnly: boolean,
    isModalToolRunning: boolean,
    isEditMode: boolean
  ) {

    const documentData = docContext.documentData
    const drawStrokes = true //!isFullRendering
    const drawPoints = true

    if (needsRedrawBuffer) {

      if (buffer_canvasWindow != null) {

        result_canvasWindow.copyTransformTo(buffer_canvasWindow)

        drawPathContext.render.setContext(buffer_canvasWindow)
        drawPathContext.render.clear()
      }
      else {

        drawPathContext.render.setContext(result_canvasWindow)
      }

      for (let i = drawPathContext.startIndex; i <= drawPathContext.endIndex; i++) {

        const drawPathStep = drawPathContext.steps[i]

        if (drawPathStep.operationType != DrawPathOperationTypeID.drawForeground
          && drawPathStep.operationType != DrawPathOperationTypeID.drawBackground) {

          continue
        }

        const viewKeyFrameLayer = drawPathStep.viewKeyframeLayer
        const layer = viewKeyFrameLayer ? viewKeyFrameLayer.layer : null

        //console.debug('  DrawPath EditMode', i, drawPathStep._debugText, layer ? layer.name : '')

        if (currentLayerOnly) {

          if (!this.isdrawTargetForCurrentLayerOnly(layer)) {
            continue
          }
        }
        else {

          if (!Layer.isVisible(layer)) {
            continue
          }
        }

        if (VectorLayer.isVectorLayer(layer)) {

          const vectorLayer = <VectorLayer>layer

          if (drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

            this.drawLayerBackground(
              drawPathContext.render,
              drawPathStep,
              documentData,
              false,
              isModalToolRunning,
              isEditMode
            )
          }

          this.drawForegroundForEditMode(
            drawPathContext.render,
            vectorLayer,
            viewKeyFrameLayer,
            documentData,
            docContext.operationUnitID,
            drawStrokes,
            drawPoints,
            isModalToolRunning,
            isEditMode
          )
        }
        else if (AutoFillLayer.isAutoFillLayer(layer)) {

          this.drawLayerBackground(
            drawPathContext.render,
            drawPathStep,
            documentData,
            false,
            isModalToolRunning,
            isEditMode
          )
        }
        else {

          this.drawLayerForeground(
            drawPathContext.render,
            drawPathStep,
            documentData,
            false,
            drawPathContext.isModalToolRunning,
            isEditMode
          )
        }
      }
    }

    if (buffer_canvasWindow != null) {

      this.drawFullWindowImage(result_canvasWindow, buffer_canvasWindow)
    }
  }

  drawFrames(canvasWindow: CanvasWindow, docContext: DocumentContext) {

    this.canvasRender.setContext(canvasWindow)

    this.drawDocumentFrame(this.canvasRender, docContext)

    this.drawRulers(this.canvasRender, docContext)
  }

  private drawDocumentFrame(render: CanvasRender,  docContext: DocumentContext) {

    if (!docContext.documentData.documentFrame_HideOuterArea) {
      return
    }

    render.resetTransform()

    const mirrorX = this.appView.mainWindow.mirrorX
    const mirrorY = this.appView.mainWindow.mirrorY
    const mirrored = ((!mirrorX && !mirrorY) || (mirrorX && mirrorY))

    this.appView.canvasFrame.draw(this.canvasRender, docContext.documentData, mirrored)
  }

  private drawRulers(render: CanvasRender, docContext: DocumentContext) {

    render.resetTransform()

    this.appView.canvasRulerH.draw(render, this.appView.mainWindow, docContext.documentData)
    this.appView.canvasRulerV.draw(render, this.appView.mainWindow, docContext.documentData)

    this.appView.canvasRulerH.drawCorner(render)
  }

  // Export drawing

  drawExportImage(canvasWindow: CanvasWindow, documentData: DocumentData, viewKeyframe: ViewKeyframe, imageLeft: int, imageTop: int, imageWidth: int, imageHeight: int, scale: float, backGroundType: DocumentBackGroundTypeID) {

    const drawPathContext = new DrawPathContext()
    drawPathContext.drawPathModeID = DrawPathModeID.export
    drawPathContext.render = this.canvasRender
    drawPathContext.local_render = this.local_canvasRender

    this.drawPathCollecting.collectDrawPaths(
      drawPathContext,
      documentData,
      viewKeyframe
    )

    drawPathContext.render.setContext(canvasWindow)
    drawPathContext.render.clear()

    if (backGroundType == DocumentBackGroundTypeID.lastPaletteColor) {

      drawPathContext.render.resetTransform()
      drawPathContext.render.setFillColorV(documentData.paletteColors[documentData.paletteColors.length - 1].color)
      drawPathContext.render.fillRect(0, 0, imageWidth, imageHeight)
    }

    canvasWindow.viewLocation[0] = imageLeft
    canvasWindow.viewLocation[1] = imageTop
    canvasWindow.viewScale = scale
    canvasWindow.viewRotation = 0.0
    canvasWindow.centerLocationRate[0] = 0.0
    canvasWindow.centerLocationRate[1] = 0.0

    drawPathContext.startIndex = 0
    drawPathContext.endIndex = drawPathContext.steps.length - 1

    this.drawPathBuffering.prepareDrawPathBuffers(
      drawPathContext,
      canvasWindow,
      true
    )

    this.drawPathBuffering.updateAllRenderCaches(
      drawPathContext,
      viewKeyframe
    )

    this.drawDrawPathContext(canvasWindow, drawPathContext, true, false, canvasWindow)
  }

  // Layer picking

  pickLayer(main_canvasWindow: CanvasWindow, documentData: DocumentData, pickLocationX: float, pickLocationY: float): Layer {

    if (!this.pickLayer_canvasWindow.isSameMetrics(main_canvasWindow)) {

      this.pickLayer_canvasWindow.createCanvas(main_canvasWindow.width, main_canvasWindow.height, true)
    }

    main_canvasWindow.copyTransformTo(this.pickLayer_canvasWindow)

    this.canvasRender.setContext(this.pickLayer_canvasWindow)
    this.canvasRender.clear()

    let pickedLayer = null
    for (let index = this.main_drawPathContext.steps.length - 1; index > 0; index--) {

      const drawPathStep = this.main_drawPathContext.steps[index]

      if (drawPathStep.operationType != DrawPathOperationTypeID.drawForeground
        && drawPathStep.operationType != DrawPathOperationTypeID.drawBackground) {
        continue
      }

      if (!Layer.isVisible(drawPathStep.viewKeyframeLayer.layer)) {
        continue
      }

      if (drawPathStep.isCacheEnabled()) {

        this.drawRenderCache(this.pickLayer_canvasWindow, drawPathStep)
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

        this.drawLayerBackground(
          this.canvasRender,
          drawPathStep,
          documentData,
          false,
          false,
          false
        )
      }
      else {

        this.drawLayerForeground(
          this.canvasRender,
          drawPathStep,
          documentData,
          false,
          false,
          false
        )
      }

      for (const location of this.layerPickingLocations) {

        this.canvasRender.pickColor(this.tempColor4, pickLocationX + location[0], pickLocationY + location[1])

        if (this.tempColor4[3] > 0.0) {

          pickedLayer = drawPathStep.viewKeyframeLayer.layer
          break
        }
      }

      if (pickedLayer != null) {
        break
      }
    }

    return pickedLayer
  }
}
