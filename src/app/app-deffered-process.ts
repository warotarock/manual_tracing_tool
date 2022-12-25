import { App_Drawing } from './app-drawing'
import { Command_VectorLayer_DeleteEmpties } from './commands'
import { RectangleArea } from './common-logics'
import { DocumentContext, SubToolContext } from './context'
import { LazyUpdateState } from './deffered-process'
import {
  AutoFillLayer, Layer, PointBrushFillLayer, VectorLayer, VectorLayerGeometry, VectorStroke,
  VectorStrokeGroup, VectorStrokeModifyFlagID
} from './document-data'
import { DrawPathBufferingLogic, DrawPathContext, DrawPathModeID, DrawPathOperationTypeID } from './document-drawing'
import { AutoFillLogic, EyesSymmetryLogic, VectorStrokeLogic } from './document-logic'
import { Posing3DLogic, Posing3DView } from './posing3d'
import { CanvasWindow } from './render'
import { ViewKeyframe, ViewKeyframeLayer } from './view'

export class App_DefferedProcess {

  calculation_LazyUpdateState = new LazyUpdateState()
  drawing_LazyUpdateState = new LazyUpdateState()

  private appDrawing: App_Drawing = null
  private drawPathBuffering: DrawPathBufferingLogic = null
  private posing3DLogic: Posing3DLogic = null
  private posing3DView: Posing3DView = null

  private isPostUpdateNeeded = false

  private lookDirection = vec3.fromValues(0.0, 0.0, 0.0)
  private start_Location = vec3.fromValues(0.0, 0.0, 0.0)
  private mouseCursorRangeRate = 1.0

  private docContext: DocumentContext = null
  private subToolContext: SubToolContext = null

  link(appDrawing: App_Drawing, drawPathBuffering: DrawPathBufferingLogic, posing3DLogic: Posing3DLogic, posing3DView: Posing3DView) {

    this.appDrawing = appDrawing
    this.drawPathBuffering = drawPathBuffering
    this.posing3DLogic = posing3DLogic
    this.posing3DView = posing3DView
  }

  linkContexts(docContext: DocumentContext, toolContext: SubToolContext) {

    this.docContext = docContext
    this.subToolContext = toolContext
  }

  setPostUpdateNeeded() {

    this.isPostUpdateNeeded = true
  }

  executePostUpdate(drawPathContext: DrawPathContext, viewKeyframe: ViewKeyframe, isUndo: boolean, subToolContext: SubToolContext): boolean {

    if (!this.isPostUpdateNeeded) {
      return false
    }

    this.isPostUpdateNeeded = false

    // Cancel active stroke
    if (this.docContext.activeVectorLine != null
      && this.docContext.activeVectorLine.runtime.modifyFlag == VectorStrokeModifyFlagID.delete
    ) {

      this.subToolContext.unsetAcrtiveVectorStrokeAndGroup()
      this.subToolContext.setRedrawEditorWindow()
    }

    // Update all layers
    for (const viewKeyframeLayer of viewKeyframe.layers) {

      if (VectorLayer.isVectorLayerWithOwnData(viewKeyframeLayer.layer)) {

        this.updateVectorLayer(viewKeyframeLayer, drawPathContext, isUndo, subToolContext)
      }
    }

    return true
  }

  private updateVectorLayer(
    viewKeyframeLayer: ViewKeyframeLayer,
    drawPathContext: DrawPathContext,
    isUndo: boolean,
    subToolContext: SubToolContext
  ) {

    const isLayerUpdated = viewKeyframeLayer.layer.runtime.needsPostUpdate
    viewKeyframeLayer.layer.runtime.needsPostUpdate = false

    const geometry = viewKeyframeLayer.vectorLayerKeyframe.geometry

    // Deletes empty data
    if (geometry.runtime.needsPostUpdate) {

      if (!isUndo) {

        const deleteEmpties_command = new Command_VectorLayer_DeleteEmpties()
        if (deleteEmpties_command.prepareForGeometry(geometry, viewKeyframeLayer.layer)) {

          deleteEmpties_command.isContinued = true
          subToolContext.commandHistory.executeCommand(deleteEmpties_command, subToolContext)
        }
      }

      geometry.runtime.needsPostUpdate = false
    }

    // Update for changed data
    const isGeometryUpdated = this.updateGeometry(geometry)

    // Set update flags to draw path steps
    this.drawPathBuffering.setUpdateCacheToDrawPathSteps(
      viewKeyframeLayer.layer,
      drawPathContext,
      isLayerUpdated || isGeometryUpdated
    )
  }

  private updateGeometry(geometry: VectorLayerGeometry) {

    // Update geometry, drawing unit, stroke groups.
    // To update strokes or points, please do it in each sub tool or command, not here.

    let isUpdated = false

    const surroundingArea = RectangleArea.createMinumumValueRectangle()

    for (const unite of geometry.units) {

      for (const group of unite.groups) {

        if (group.runtime.needsPostUpdate) {

          group.runtime.needsPostUpdate = false

          isUpdated = true

          VectorStrokeLogic.calculateSurroundingArea(group.runtime.area, group.lines)
        }

        surroundingArea.expandByRectangle(group.runtime.area)

        if (VectorLayerGeometry.isSurroundingFill(geometry)) {

          group.runtime.connectionInfos = VectorStrokeLogic.createConnectionInfos(group)
        }
      }
    }

    if (isUpdated) {

      surroundingArea.calculateParams()
      surroundingArea.copyTo(geometry.runtime.area)
    }

    return isUpdated
  }

  startLazyUpdates() {

    this.calculation_LazyUpdateState.startLazyCalculation()
    this.drawing_LazyUpdateState.startLazyCalculation()
  }

  executeLazyUpdate(drawPathContext: DrawPathContext, viewKeyframe: ViewKeyframe) {

    const state = this.calculation_LazyUpdateState

    // execute drawing steps
    drawPathContext.drawPathModeID = DrawPathModeID.lazyUpdate
    drawPathContext.startIndex = state.processedIndex + 1
    drawPathContext.endIndex = drawPathContext.steps.length - 1
    drawPathContext.documentData = this.docContext.documentData

    state.startPartialProcess()

    for (let i = drawPathContext.startIndex; i <= drawPathContext.endIndex; i++) {

      const drawPathStep = drawPathContext.steps[i]

      drawPathContext.lastDrawPathIndex = i

      const viewKeyFrameLayer = drawPathStep.viewKeyframeLayer
      const layer = viewKeyFrameLayer ? viewKeyFrameLayer.layer : null

      if (drawPathStep.operationType == DrawPathOperationTypeID.drawForeground) {

        if (VectorLayer.isVectorLayer(layer)) {

          const vectorLayer = <VectorLayer>layer

          if (vectorLayer.eyesSymmetryEnabled && vectorLayer.runtime.posingLayer != null) {

            console.debug(`Lazy calculation updateEyesSymetries "${vectorLayer.name}"`)

            this.updateEyesSymetry(vectorLayer, viewKeyFrameLayer)

            // Set post update to related layers
            for (const vkfLayer of viewKeyframe.layers) {

              if (vkfLayer.layer.runtime.parentLayer == layer.runtime.parentLayer) {

                if (PointBrushFillLayer.isPointBrushFillLayer(vkfLayer.layer)) {

                  Layer.setPostUpdateNeeded(vkfLayer.layer)
                  this.setPostUpdateNeeded()
                }
              }
            }
          }
        }
      }
      else if (drawPathStep.operationType == DrawPathOperationTypeID.drawBackground) {

        // TODO: 自動塗りレイヤーの更新処理の実装
        if (AutoFillLayer.isAutoFillLayer(layer)) {

          const autoFillLayer = <AutoFillLayer>layer

          if (autoFillLayer.runtime.needsLazyUpdate) {

            console.debug(`Lazy calculation updateAutoFill "${autoFillLayer.name}"`)

            this.updateAutoFill(autoFillLayer, this.subToolContext)

            autoFillLayer.runtime.needsLazyUpdate = false
          }
        }
      }

      if (state.isOverPartialProcessMaxTime()) {
        break
      }
    }

    console.debug(`Lazy calculation from ${drawPathContext.startIndex} to ${drawPathContext.lastDrawPathIndex}`)

    state.processedIndex = drawPathContext.lastDrawPathIndex

    if (state.processedIndex >= drawPathContext.steps.length - 1) {

      console.debug('Lazy calculation finished at', state.processedIndex)

      state.finishLazyUpdate()

      this.subToolContext.setRedrawMainWindowEditorWindow()
    }
  }

  updateEyesSymetry(layer: VectorLayer, viewKeyFrameLayer: ViewKeyframeLayer) {

    EyesSymmetryLogic.updateEyesSymetries(
      layer,
      viewKeyFrameLayer.vectorLayerKeyframe.geometry,
      this.posing3DLogic,
      this.posing3DView
    )
  }

  updateAutoFill(layer: AutoFillLayer, subtoolContext: SubToolContext) {

    const newGroup = new VectorStrokeGroup()

    // TODO: 編集後すぐに表示時刻を移動したときに編集したキーフレームでなく移動後のキーフレームで遅延処理が行われてしまう問題に対応する
    const viewKeyframeLayers = subtoolContext.main.collectVectorViewKeyframeLayers()

    const target_ViewKeyframeLayer = viewKeyframeLayers
      .find(vkfl => vkfl.layer == layer)

    if (target_ViewKeyframeLayer === undefined) {
      throw new Error('ERROR 0000:invalid ViewKeyframeLayers')
    }

    const sibling_ViewKeyframeLayers = viewKeyframeLayers
      .filter(vkfl => vkfl.layer != layer
        && VectorLayer.isVectorLayer(vkfl.layer)
        && vkfl.layer.runtime.parentLayer == layer.runtime.parentLayer)

    AutoFillLayer.forEachFillPoint(target_ViewKeyframeLayer.autoFillLayerKeyframe, (group, autoFillPoint) => {

      vec3.add(this.start_Location, autoFillPoint.location, autoFillPoint.lookDirection)

      const start_Stroke = AutoFillLogic.findStartStroke(
        this.start_Location,
        this.mouseCursorRangeRate,
        sibling_ViewKeyframeLayers
      )

      if (start_Stroke == null) {
        return
      }

      const fill_Stroke = new VectorStroke()

      const isAvailable = AutoFillLogic.generate(
        fill_Stroke,
        this.lookDirection,
        start_Stroke,
        autoFillPoint.location,
        autoFillPoint.minDistanceRange,
        sibling_ViewKeyframeLayers
      )

      if (!isAvailable) {
        return
      }

      vec3.copy(autoFillPoint.lookDirection, this.lookDirection)

      newGroup.lines.push(fill_Stroke)
    })

    newGroup.runtime.needsPostUpdate = true

    target_ViewKeyframeLayer.autoFillLayerKeyframe.geometry.units[0].groups[0] = newGroup

    this.updateGeometry(target_ViewKeyframeLayer.autoFillLayerKeyframe.geometry)
  }

  isLazyCalculationFinished() {

    return this.calculation_LazyUpdateState.isFinished
  }

  drawDrawPathForLazyDraw(
    mainWindow: CanvasWindow,
    docContext: DocumentContext,
    subtoolContext: SubToolContext,
    drawPathContext: DrawPathContext
  ) {

    // execute drawing steps
    drawPathContext.drawPathModeID = DrawPathModeID.lazyUpdate
    drawPathContext.startIndex = this.drawing_LazyUpdateState.processedIndex + 1
    drawPathContext.endIndex = drawPathContext.steps.length - 1
    drawPathContext.documentData = docContext.documentData
    drawPathContext.isModalToolRunning = subtoolContext.tool.isModalToolRunning()
    drawPathContext.currentLayerOnly = false
    drawPathContext.lazyUpdateState = this.drawing_LazyUpdateState

    const clearState = this.drawing_LazyUpdateState.isLazyDrawBigining()
    const buffer_CanvasWindow = drawPathContext.lazyDraw_compositionBuffer.canvasWindow

    mainWindow.copyTransformTo(buffer_CanvasWindow)
    this.appDrawing.drawDrawPathContext(buffer_CanvasWindow, drawPathContext, clearState)

    console.debug(`Lazy drawing ${clearState ? 'begin' : 'draw'} from ${drawPathContext.startIndex} to ${drawPathContext.lastDrawPathIndex} -> buffer[${drawPathContext.bufferStack.length}]`)

    if (!drawPathContext.existsDrawnStepsAtLastTime()) {
      return
    }

    // Save states for drawing steps
    this.drawing_LazyUpdateState.processedIndex = drawPathContext.lastDrawPathIndex

    if (drawPathContext.isFinished()) {

      this.drawing_LazyUpdateState.finishLazyUpdate()

      console.debug('Lazy drawing finished at', this.drawing_LazyUpdateState.processedIndex)

      this.appDrawing.clearWindow(mainWindow)

      this.appDrawing.canvasRender.resetTransform()

      this.appDrawing.canvasRender.drawImage(buffer_CanvasWindow.canvas
        , 0, 0, mainWindow.width, mainWindow.height
        , 0, 0, mainWindow.width, mainWindow.height)

      if (subtoolContext.isEditMode()) {

        this.appDrawing.main_drawPathContext.isEditModeDraw = true
        this.appDrawing.main_drawPathContext.redrawActiveLayerOnly = true
        this.appDrawing.main_drawPathContext.currentLayerOnly = false
        this.appDrawing.main_drawPathContext.isModalToolRunning = false
        this.appDrawing.drawDocumentForEditMode(mainWindow, docContext, this.appDrawing.main_drawPathContext)
      }

      this.appDrawing.drawFrames(mainWindow, docContext)
    }
  }
}
