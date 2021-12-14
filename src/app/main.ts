import { float, int, Strings } from './logics/conversion'
import { AutoFillLayer, DocumentBackGroundTypeID, DocumentData, ImageFileReferenceLayer, Layer, PosingModel,
  VectorLayer
} from './document_data'
import { OperationUnitID } from './tool/constants'
import { Platform } from '../platform/platform'
import { CanvasWindow } from './render/render2d'
import { App_Document } from './document'
import { DocumentDeserializingLogic } from './document_logic'
import { App_Drawing } from './drawing'
import { DrawPathContext, DrawPathModeID, DrawPathOperationTypeID } from './drawing/draw_path'
import { App_Event, AppEvent_Main_Interface } from './event'
import { LoadingSystemResourceLogic } from './loading/loading_system_resource'
import { UserSettingLogic } from './preferences/user_setting'
import { App_Tool } from './tool'
import { App_View } from './view'
import { ViewKeyframeLayer } from './view/view_keyframe'
import { DeleteKeyframeTypeID } from './dialog/delete_keyframe_command_dialog'
import { DialogWindow_Main_Interface } from './dialog/dialog'
import { NewKeyframeTypeID } from './dialog/new_keyframe_command_dialog'
import { OpenFileDialogTargetID } from './dialog/open_file_dialog'
import { DocumentContext } from './context/document_context'
import { ModalToolBase, SubToolID } from './tool/sub_tool'
import { SubToolContext, SubToolContext_Main_Interface } from './context/subtool_context'
import { SubToolDrawingContext } from './context/subtool_drawing_context'
import { Command_Layer_CommandBase } from './commands/edit_layer'
import { LocalSetting } from './preferences/local_setting'
import { CanvasRulerOrientation } from './editor/canvas_ruler'

export enum MainProcessStateID {

  none,
  startup,
  pause,
  systemResourceLoading,
  documentJSONLoading,
  documentResourceLoading,
  running
}

export class App_Main implements SubToolContext_Main_Interface, AppEvent_Main_Interface, DialogWindow_Main_Interface {

  appView = new App_View()
  appDrawing = new App_Drawing()
  appTool = new App_Tool()
  appdocument = new App_Document()
  appEvent = new App_Event()

  docContext: DocumentContext = null
  subtoolContext: SubToolContext = null
  subtoolDrawingContext: SubToolDrawingContext = null

  loadingSystemResource = new LoadingSystemResourceLogic()
  userSetting = new UserSettingLogic()

  mainProcessState = MainProcessStateID.startup
  isDeferredWindowResizeWaiting = false
  deferredWindowResizeWaitingDuration = 250
  deferredWindowResizeWaitingEndTime = 0
  lastTime = 0
  elapsedTime = 0

  lastUsedDocumentFilePath: string = null

  isFirstStartup = true

  linkSubLogics() {

    this.appView.link(this.appDrawing.canvasRender, this.appDrawing.drawStyle, this)

    this.appDrawing.link(this.appView)

    this.appTool.link(this.appView, this.appDrawing)

    this.appdocument.link(this.appView, this.appDrawing, this.appTool, this.userSetting)

    this.appEvent.link(this.appView, this.appDrawing, this.appTool, this.appdocument, this.userSetting, this)

    this.loadingSystemResource.link(this.appDrawing.posing3DViewRender, this.appdocument.posing3DModel)
  }

  // Initializing devices not depending media resoures

  onInitializeSystemDevices() {

    this.userSetting.loadSettings()

    this.appView.initializeViewDevices()

    this.appDrawing.initializeDrawingDevices(this.appView.webglWindow, this.appView.drawGPUWindow)

    this.linkSubLogics()

    this.startLoadingSystemResources()
  }

  // Loading system resources

  private startLoadingSystemResources() {

    this.loadingSystemResource.startLoadingSystemResources(this.appView.modelFile, this.appView.imageResurces)

    this.mainProcessState = MainProcessStateID.systemResourceLoading
  }

  processLoadingSystemResources() {

    // Loading state polling

    if (this.loadingSystemResource.isLoading()) {
      return
    }

    // Loading finished

    if (this.userSetting.localSetting.lastUsedFilePaths.length == 0) {

      const documentData = this.appdocument.createDefaultDocumentData()

      this.start(documentData)
    }
    else {

      const lastURL = this.userSetting.localSetting.lastUsedFilePaths[0]

      const documentData = new DocumentData()
      this.appdocument.loadingDocument.startLoadingDocumentFromURL(documentData, lastURL)

      this.mainProcessState = MainProcessStateID.documentJSONLoading

      this.appView.headerWindow.setHeaderDocumentFileName(lastURL)
    }
  }

  // Loading document resources

  startReloadDocument(filepath: string) { // @override

    const documentData = new DocumentData()

    this.appdocument.loadingDocument.startLoadingDocumentFromURL(documentData, filepath)

    this.mainProcessState = MainProcessStateID.documentJSONLoading
    this.lastUsedDocumentFilePath = filepath
  }

  startReloadDocumentFromFile(file: File, url: string) { // @override

    if (Strings.isNullOrEmpty(url)) {

      throw new Error('ERROR 0001:both of url and file are null or empty')
    }

    const isAvailable = this.appdocument.loadingDocument.startLoadingDocumentFromFile(file, url)

    if (isAvailable) {

      this.mainProcessState = MainProcessStateID.documentJSONLoading
      this.lastUsedDocumentFilePath = url
    }
    else {

      console.debug('error: not supported file type.')
    }
  }

  processLoadingDocumentFile() {

    if (this.appdocument.loadingDocument.hasErrorOnLoadingDocument()) {

      //this.showMessageBox('ドキュメントの読み込みに失敗しました。デフォルトのドキュメントを開きます。')

      this.appdocument.loadingDocument.loading_DocumentData = this.appdocument.createDefaultDocumentData()

      this.setHeaderDefaultDocumentFileName()

      this.mainProcessState = MainProcessStateID.documentResourceLoading

      return
    }

    if (!this.appdocument.loadingDocument.isDocumentLoaded()) {
      return
    }

    this.appdocument.fixLoadedDocumentData(this.appdocument.loadingDocument.loading_DocumentData, this.appView.modelFile)

    this.appdocument.loadingDocument.startLoadingDocumentResources(this.appdocument.loadingDocument.loading_DocumentData)

    this.appdocument.loadingDocument.finishDocumentDataLoading()

    this.mainProcessState = MainProcessStateID.documentResourceLoading
  }

  startLoadingDocumentResourcesProcess(document: DocumentData) { // @implements MainEditor

    this.appdocument.loadingDocument.startLoadingDocumentResources(document)

    this.mainProcessState = MainProcessStateID.documentResourceLoading
  }

  processLoadingDocumentResources() {

    // Check loading states

    if (this.appdocument.loadingDocument.isDocumentResourceLoading()) {
      return
    }

    // Loading finished

    if (this.appdocument.loadingDocument.isDocumentLoading()
      && this.docContext != null
      && this.docContext.document != null
    ) {

      this.appdocument.serializing.releaseDocumentResources(this.docContext.document, this.appDrawing.drawGPURender)

      this.docContext.document = null
    }

    this.appdocument.deserializing.finishResourceLoading(this.appdocument.loadingDocument.loadingResoure_DocumentData)

    this.start(this.appdocument.loadingDocument.loadingResoure_DocumentData)

    if (!this.isFirstStartup) {

      this.userSetting.saveSettings()
    }
  }

  // Starting ups after loading resources

  start(documentData: DocumentData) {

    this.initializeDocumentContext(documentData)

    this.appTool.initializeTools()

    this.appView.initializeViewState()

    this.updateLayerStructureInternal(true, true, false, false)

    this.appTool.setCurrentOperationUnitID(this.docContext.operationUnitID)

    this.appTool.selectLayer(documentData.rootLayer.childLayers[0])

    this.updateLayerStructureInternal(false, false, true, true)

    this.appView.mainWindow.viewScale = documentData.defaultViewScale
    this.appView.mainWindow.viewRotation = 0.0
    this.appView.mainWindow.mirrorX = false
    this.appView.mainWindow.mirrorY = false

    this.appView.viewOperation.copyLastViewLocation(false, this.appView.mainWindow)

    this.subtoolContext.updateContext()

    if (!Strings.isNullOrEmpty(this.lastUsedDocumentFilePath)) {

      this.appView.headerWindow.setHeaderDocumentFileName(this.lastUsedDocumentFilePath)

      this.userSetting.registerLastUsedFile(this.lastUsedDocumentFilePath)

      this.lastUsedDocumentFilePath = null
    }

    // 初回描画

    this.subtoolContext.setLazyRedraw()

    this.appView.ribbonUIWindow.updateTabAndRibbon(this.docContext)

    this.resizeWindowsAndBuffers() // TODO: これをしないとキャンバスの高さが足りなくなる。最初のリサイズのときは高さがなぜか少し小さい。2回リサイズする必要は本来ないはずなのでなんとかしたい。

    this.subtoolContext.setRedrawAllWindows()

    this.appTool.updateFooterMessage()

    this.appEvent.setEvents()

    this.mainProcessState = MainProcessStateID.running
    this.isFirstStartup = false
  }

  initializeDocumentContext(documentData: DocumentData) {

    this.docContext = new DocumentContext()
    this.docContext.document = documentData
    this.docContext.drawStyle = this.appDrawing.drawStyle
    this.docContext.mainWindow = this.appView.mainWindow
    this.docContext.posing3DView = this.appDrawing.posing3DView
    this.docContext.posing3DLogic = this.appdocument.posing3DLogic
    this.docContext.lazy_DrawPathContext = this.appDrawing.lazy_DrawPathContext

    this.subtoolContext = new SubToolContext(this, this.docContext)
    this.subtoolDrawingContext = new SubToolDrawingContext(this.appDrawing.editorDrawer, this.appDrawing.canvasRender, this.appDrawing.drawStyle)

    this.appDrawing.lazy_DrawPathContext.lazyProcess.resetLazyProcess()

    this.appdocument.linkContexts(this.docContext, this.subtoolContext)
    this.appTool.linkContexts(this.docContext, this.subtoolContext)
    this.appEvent.linkContexts(this.docContext, this.subtoolContext)
  }

  onWindowBlur() { // @override

    // console.debug('Window blur')

    if (this.mainProcessState == MainProcessStateID.running) {

      this.mainProcessState = MainProcessStateID.pause
      // console.debug('  mainProcessState -> pause')
    }
  }

  onWindowFocus() { // @override

    // console.debug('Window focus')

    if (this.mainProcessState == MainProcessStateID.pause) {

      this.mainProcessState = MainProcessStateID.running
      // console.debug('  mainProcessState -> running')
    }
  }

  // Continuous processes

  run() {

    if (this.isDeferredWindowResizeWaiting
      && Platform.getCurrentTime() > this.deferredWindowResizeWaitingEndTime) {

      this.isDeferredWindowResizeWaiting = false

      this.resizeWindowsAndBuffers()

      this.subtoolContext.setRedrawAllWindows()
    }

    // Process animation time

    const currentTime = Platform.getCurrentTime()
    if (this.lastTime == 0) {

      this.elapsedTime = 100
    }
    else {

      this.elapsedTime = currentTime - this.lastTime
    }
    this.lastTime = currentTime

    this.appView.layerHighlight.processHighlightingAnimation(this.elapsedTime, this.subtoolContext)

    // Process animation

    if (this.docContext.animationPlaying) {

      const aniSetting = this.docContext.document.animationSettingData

      aniSetting.currentTimeFrame += 1

      if (aniSetting.currentTimeFrame >= aniSetting.loopEndFrame) {

        aniSetting.currentTimeFrame = aniSetting.loopStartFrame
      }

      this.appTool.setCurrentFrame(aniSetting.currentTimeFrame)

      this.subtoolContext.setRedrawMainWindow()
      this.subtoolContext.setRedrawTimeLineWindow()
    }
  }

  resizeWindowsAndBuffers() {

    this.appView.resizeWindows()

    this.appView.operationPanel.updateLayout(this.appView.editorWindow)

    this.appView.canvasRulerH.updateLayout(this.appView.mainWindow, CanvasRulerOrientation.horizontalTop)
    this.appView.canvasRulerV.updateLayout(this.appView.mainWindow, CanvasRulerOrientation.verticalLeft)

    this.appView.canvasFrame.updateLayout(this.appView.mainWindow)

    this.prepareDrawPathBuffers()
  }

  prepareDrawPathBuffers() {

    this.appDrawing.drawPathBuffering.prepareDrawPathBuffers(
      this.appDrawing.drawPathContext,
      this.appView.mainWindow
    )

    this.appDrawing.drawPathBuffering.prepareDrawingBuffer(
      this.appDrawing.lazy_DrawPathContext.buffer,
      this.appView.mainWindow
    )
  }

  updateLayerStructureInternal(updateLayerWindowItems: boolean, updateViewKeyframes: boolean, updateHierarchicalStates: boolean, updateDrawPash: boolean) {

    const documentData = this.docContext.document

    // Update document data
    if (updateHierarchicalStates) {

      Layer.updateHierarchicalStatesRecursive(documentData.rootLayer)
    }

    // Update view level context
    if (updateViewKeyframes) {

      this.appView.viewKeyframe.collectViewKeyframeContext(this.docContext, documentData)

      // TODO: this.currentViewKeyframeを更新するために必要 updateContextCurrentRefferences() で必要なため。
      const skipCollectDrawPaths = (updateDrawPash == false)
      this.appTool.setCurrentFrame(documentData.animationSettingData.currentTimeFrame, skipCollectDrawPaths)
    }

    if (updateLayerWindowItems) {

      this.appView.viewLayerList.collectItems(this.docContext, documentData)

      this.appView.posingLayerOptions = this.appView.viewLayerList.collectPosingLayerOptions(this.docContext)
    }

    // Update draw path
    if (updateDrawPash) {

      this.appDrawing.collectDrawPaths(documentData)
    }

    // Update tool context
    this.appTool.updateContextCurrentRefferences()
  }

  setHeaderDefaultDocumentFileName() {

    const fileName = DocumentDeserializingLogic.getDefaultDocumentFileName(this.userSetting.localSetting)
    this.appView.headerWindow.setHeaderDocumentFileName(fileName)
  }

  // Main drawing process

  activeLayerBufferDrawn = false

  draw() {

    const currentLayerOnly = this.appView.layerHighlight.isAnimating()

    this.appView.mainWindow.caluclateViewMatrix(this.appView.mainWindow.view2DMatrix)
    mat4.invert(this.appView.mainWindow.invView2DMatrix, this.appView.mainWindow.view2DMatrix)

    this.subtoolContext.updateContext()

    if (this.docContext.redrawMainWindow) {

      this.drawMainWindow(this.appView.mainWindow, this.docContext.redrawCurrentLayer, currentLayerOnly)

      this.docContext.redrawMainWindow = false
    }

    if (this.docContext.redrawEditorWindow) {

      this.appDrawing.clearWindow(this.appView.editorWindow)

      this.drawEditorWindow(this.appView.editorWindow, this.appView.mainWindow)

      this.docContext.redrawEditorWindow = false
    }

    if (this.docContext.redrawLayerWindow) {

      // this.clearWindow(this.view.layerWindow)
      this.appView.layerWindow.update(this.docContext, this.docContext.currentLayer)

      this.appView.layerWindow.uiRef.update(this.docContext.items)

      this.appView.updateRibbonUI_Layer(this.docContext)

      this.docContext.redrawLayerWindow = false
    }

    if (this.docContext.redrawRibbonUI) {

      //this.clearWindow(this.subtoolWindow)
      this.appView.subToolWindow.updateViewItemState(this.subtoolContext)
      this.appView.updateRibbonUI(this.docContext, true)

      this.docContext.redrawRibbonUI = false
    }

    if (this.docContext.redrawPaletteSelectorWindow) {

      // this.clearWindow(this.view.paletteSelectorWindow)
      this.drawPaletteSelectorWindow()

      this.appView.paletteSelectorWindow.uiRef.update(this.docContext.document.paletteColors)

      this.docContext.redrawPaletteSelectorWindow = false
    }

    if (this.docContext.redrawColorMixerWindow) {

      this.drawColorMixerWindow()

      this.docContext.redrawColorMixerWindow = false
    }

    if (this.docContext.redrawTimeLineWindow) {

      this.appDrawing.clearWindow(this.appView.timeLineWindow)
      this.drawTimeLineWindow()

      this.docContext.redrawTimeLineWindow = false
    }

    if (this.docContext.redrawWebGLWindow) {

      this.appDrawing.drawingPosing3D.drawPosing3DView(
        this.appView.webglWindow,
        this.docContext.items,
        this.appView.mainWindow,
        this.docContext,
        currentLayerOnly
      )

      this.docContext.redrawWebGLWindow = false
    }

    if (this.docContext.redrawHeaderWindow) {

      this.appView.ribbonUIWindow.updateTabAndRibbon(this.docContext)

      this.docContext.redrawHeaderWindow = false
    }

    if (this.docContext.redrawFooterWindow) {

      this.appView.footerWindow.updateFooterText()

      this.docContext.redrawFooterWindow = false
    }

    this.lazyProcess()

    this.docContext.redrawCurrentLayer = false
  }

  drawMainWindow(canvasWindow: CanvasWindow, redrawActiveLayerOnly: boolean, currentLayerOnly: boolean) {

    if (this.appDrawing.currentViewKeyframe == null) {
      return
    }

    this.appDrawing.drawPathContext.isEditModeDraw = this.subtoolContext.isEditMode()
    this.appDrawing.drawPathContext.isModalToolRunning = this.appTool.isModalToolRunning()
    this.appDrawing.drawPathContext.currentLayerOnly = currentLayerOnly
    this.appDrawing.drawPathContext.redrawActiveLayerOnly = redrawActiveLayerOnly
    this.appDrawing.drawPathContext.drawCPUOnly = this.docContext.drawCPUOnly

    // Draw edit mode ui
    if (this.subtoolContext.isDrawMode()) {

      this.drawMainWindow_drawDrawMode(canvasWindow, this.appDrawing.drawPathContext)
    }
    else if (this.subtoolContext.isEditMode()) {

      this.drawMainWindow_drawEditMode(canvasWindow, this.appDrawing.drawPathContext)
    }

    this.drawMainWindow_drawFrames()
  }

  drawMainWindow_drawDrawMode(canvasWindow: CanvasWindow, drawPathContext: DrawPathContext) {

    // TODO: 必要なときだけ実行する
    this.appDrawing.drawPathCollecting.collectDrawPasths_CollectSelectionInfo(drawPathContext)

    const activeRangeStartIndex = drawPathContext.activeDrawPathStartIndex
    const drawCPUOnly = drawPathContext.drawCPUOnly
    const isModalToolRunning = drawPathContext.isModalToolRunning
    const redrawActiveLayerOnly = drawPathContext.redrawActiveLayerOnly
    const activeRangeEndIndex = drawPathContext.activeDrawPathEndIndex
    const maxStepIndex = drawPathContext.steps.length - 1

    if (this.appDrawing.lazy_DrawPathContext.lazyProcess.isRendered && !isModalToolRunning && !drawCPUOnly) {

      drawPathContext.drawPathModeID = DrawPathModeID.editorPreview
    }
    else {

      drawPathContext.drawPathModeID = DrawPathModeID.editor
    }

    if (redrawActiveLayerOnly && activeRangeStartIndex != -1) {

      this.appDrawing.clearWindow(canvasWindow)

      // Draw back layers
      if (activeRangeStartIndex > 0) {

        drawPathContext.startIndex = 0
        drawPathContext.endIndex = activeRangeStartIndex - 1

        this.drawMainWindow_drawPathStepsToBuffer(
          canvasWindow
          , this.appView.backLayerRenderWindow
          , drawPathContext
          , this.activeLayerBufferDrawn
        )
      }

      // Draw current layers
      drawPathContext.startIndex = activeRangeStartIndex
      drawPathContext.endIndex = activeRangeEndIndex
      this.appDrawing.drawDrawPaths(canvasWindow, drawPathContext, true)

      // Draw fore layers
      if (activeRangeEndIndex < maxStepIndex) {

        drawPathContext.startIndex = activeRangeEndIndex + 1
        drawPathContext.endIndex = maxStepIndex

        this.drawMainWindow_drawPathStepsToBuffer(
          canvasWindow
          , this.appView.foreLayerRenderWindow
          , drawPathContext
          , this.activeLayerBufferDrawn
        )
      }

      this.activeLayerBufferDrawn = true
    }
    else {

      // Draw all layers
      drawPathContext.startIndex = 0
      drawPathContext.endIndex = maxStepIndex

      this.appDrawing.drawDrawPaths(canvasWindow, drawPathContext, true)

      this.activeLayerBufferDrawn = false
    }
  }

  drawMainWindow_drawPathStepsToBuffer(
    canvasWindow: CanvasWindow
    , bufferCanvasWindow: CanvasWindow
    , drawPathContext: DrawPathContext
    , activeLayerBufferDrawn: boolean
  ) {

    // Draw layers to buffer if requested

    if (!activeLayerBufferDrawn) {

      this.appDrawing.clearWindow(bufferCanvasWindow)

      canvasWindow.copyTransformTo(bufferCanvasWindow)

      this.appDrawing.drawDrawPaths(bufferCanvasWindow, drawPathContext, true)
    }

    // Draw layers from buffer

    this.appDrawing.drawFullWindowImage(canvasWindow, bufferCanvasWindow)
  }

  drawMainWindow_drawEditMode(canvasWindow: CanvasWindow, drawPathContext: DrawPathContext) {

    const activeRangeStartIndex = drawPathContext.activeDrawPathStartIndex
    const activeRangeEndIndex = drawPathContext.activeDrawPathEndIndex
    const isModalToolRunning = drawPathContext.isModalToolRunning
    const currentLayerOnly = drawPathContext.currentLayerOnly
    const redrawActiveLayerOnly = drawPathContext.redrawActiveLayerOnly
    const isEditMode = drawPathContext.isEditMode()
    const maxStepIndex = drawPathContext.steps.length - 1

    // TODO: 必要なときだけ実行する
    this.appDrawing.drawPathCollecting.collectDrawPasths_CollectSelectionInfo(drawPathContext)

    this.appDrawing.canvasRender.setContext(canvasWindow)

    this.appDrawing.clearWindow(canvasWindow)

    //redrawActiveLayerOnly = false

    if (redrawActiveLayerOnly && activeRangeStartIndex != -1) {

      // Draw back layers
      if (activeRangeStartIndex > 0) {

        drawPathContext.startIndex = 0
        drawPathContext.endIndex = activeRangeStartIndex - 1

        this.drawMainWindow_drawEditModeToBuffer(
          canvasWindow,
          this.appView.backLayerRenderWindow,
          drawPathContext,
          this.activeLayerBufferDrawn,
          currentLayerOnly,
          isModalToolRunning,
          isEditMode
        )
      }

      // Draw current layers
      drawPathContext.startIndex = activeRangeStartIndex
      drawPathContext.endIndex = activeRangeEndIndex

      this.drawMainWindow_drawEditModeToBuffer(
        canvasWindow,
        null,
        drawPathContext,
        false,
        currentLayerOnly,
        isModalToolRunning,
        isEditMode
      )

      // Draw fore layers
      if (activeRangeEndIndex < maxStepIndex) {

        drawPathContext.startIndex = activeRangeEndIndex + 1
        drawPathContext.endIndex = maxStepIndex

        this.drawMainWindow_drawEditModeToBuffer(
          canvasWindow,
          this.appView.foreLayerRenderWindow,
          drawPathContext,
          this.activeLayerBufferDrawn,
          currentLayerOnly,
          isModalToolRunning,
          isEditMode
        )
      }

      this.activeLayerBufferDrawn = true
    }
    else {

      // Draw all layers
      drawPathContext.startIndex = 0
      drawPathContext.endIndex = maxStepIndex

      this.drawMainWindow_drawEditModeToBuffer(
        canvasWindow,
        null,
        drawPathContext,
        false,
        currentLayerOnly,
        isModalToolRunning,
        isEditMode
      )

      this.activeLayerBufferDrawn = false
    }
  }

  drawMainWindow_drawEditModeToBuffer(
    canvasWindow: CanvasWindow,
    bufferCanvasWindow: CanvasWindow,
    drawPathContext: DrawPathContext,
    activeLayerBufferDrawn: boolean,
    currentLayerOnly: boolean,
    isModalToolRunning: boolean,
    isEditMode: boolean
  ) {

    const documentData = this.docContext.document
    const drawStrokes = true //!isFullRendering
    const drawPoints = true

    if (!activeLayerBufferDrawn) {

      if (bufferCanvasWindow != null) {

        this.appDrawing.clearWindow(bufferCanvasWindow)

        canvasWindow.copyTransformTo(bufferCanvasWindow)
        this.appDrawing.canvasRender.copyTransformFromWindow(bufferCanvasWindow)
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

          //if (layer != this.selectCurrentLayerAnimationLayer) {
          if (!this.appDrawing.isdrawTargetForCurrentLayerOnly(layer)) {
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

            this.appDrawing.drawBackground(
              viewKeyFrameLayer,
              documentData,
              false,
              isModalToolRunning,
              isEditMode
            )
          }

          this.appDrawing.drawForegroundForEditMode(
            vectorLayer,
            viewKeyFrameLayer,
            documentData,
            this.docContext.operationUnitID,
            drawStrokes,
            drawPoints,
            isModalToolRunning,
            isEditMode
          )
        }
        else if (AutoFillLayer.isAutoFillLayer(layer)) {

          this.appDrawing.drawBackground(
            viewKeyFrameLayer,
            documentData,
            false,
            isModalToolRunning,
            isEditMode
          )
        }
        else {

          this.appDrawing.drawForeground(
            viewKeyFrameLayer,
            documentData,
            false,
            drawPathContext.isModalToolRunning,
            isEditMode
          )
        }
      }
    }

    if (bufferCanvasWindow != null) {

      this.appDrawing.drawFullWindowImage(canvasWindow, bufferCanvasWindow)
    }
  }

  drawMainWindow_drawFrames() {

    if (this.docContext.document.documentFrame_HideOuterArea) {

      this.appView.canvasFrame.draw(this.appDrawing.canvasRender, this.appView.mainWindow, this.docContext.document)
    }

    this.appView.canvasRulerH.draw(this.appDrawing.canvasRender, this.appView.mainWindow, this.docContext.document)
    this.appView.canvasRulerV.draw(this.appDrawing.canvasRender, this.appView.mainWindow, this.docContext.document)

    this.appView.canvasRulerH.drawCorner(this.appDrawing.canvasRender)
  }

  drawEditorWindow(editorWindow: CanvasWindow, mainWindow: CanvasWindow) {

    mainWindow.updateViewMatrix()
    mainWindow.copyTransformTo(editorWindow)

    this.appDrawing.canvasRender.setContext(editorWindow)

    if (this.subtoolContext.needsDrawOperatorCursor()) {

      this.appDrawing.operatorCursor.drawOperatorCursor(this.docContext.operatorCursor)
    }

    this.appDrawing.drawingEyesSymmetry.drawEyesSymmetries(this.docContext.items, this.subtoolContext)

    const current_SubTool = this.appTool.getCurrentSubTool()
    if (current_SubTool != null) {

      this.subtoolContext.updateContext()

      this.subtoolDrawingContext.setCanvasWindow(editorWindow)

      current_SubTool.onDrawEditor(this.subtoolContext, this.subtoolDrawingContext)
    }

    this.appView.operationPanel.draw(this.appDrawing.canvasRender)
  }

  drawTimeLineWindow() {

    this.appView.timeLineWindow.drawCommandButton(
      this.appView.timeLineWindow,
      this.docContext.animationPlaying
    )

    this.appView.timeLineWindow.drawTimeLine(
      this.appView.timeLineWindow,
      this.docContext.document,
      this.docContext.keyframes,
      this.subtoolContext.currentVectorLayer
    )
  }

  drawPaletteSelectorWindow() {

    this.appView.paletteSelectorWindow.updateCommandButtons()

    this.appView.paletteSelectorWindow.updatePaletteItems(this.docContext)
  }

  drawColorMixerWindow() {

    const color = this.appView.paletteSelectorWindow.getCurrentLayerTargetColorRef(this.docContext)

    this.appView.colorMixerWindow.updateInputControls(color)
  }

  // Lazy process

  lazyProcess() {

    const drawPathContext = this.appDrawing.lazy_DrawPathContext
    const lazyProcess = this.appDrawing.lazy_DrawPathContext.lazyProcess

    if (lazyProcess.isFinished) {

      return
    }

    if (lazyProcess.needsStartingLazyProcess) {

      lazyProcess.startLazyProcess()
      return
    }

    if (lazyProcess.isLazyDrawWaiting()) {

      return
    }

    if (lazyProcess.isFirstTime) {

      this.lazyProcess_EyesSymmetry()

      lazyProcess.isFirstTime = false

      this.subtoolContext.setRedrawMainWindow()
    }

    if (!this.docContext.drawCPUOnly) {

      this.lazyProcess_DrawPath(drawPathContext)
    }
  }

  lazyProcess_DrawPath(drawPathContext: DrawPathContext) {

    const lazyProcess = drawPathContext.lazyProcess

    // Draw steps
    drawPathContext.drawPathModeID = DrawPathModeID.editorPreview
    drawPathContext.startIndex = lazyProcess.processedIndex + 1
    drawPathContext.endIndex = drawPathContext.steps.length - 1
    drawPathContext.isModalToolRunning = this.subtoolContext.isModalToolRunning()
    drawPathContext.currentLayerOnly = false

    lazyProcess.maxTime = 10 // TODO: 適当な値を設定する

    const last_lazyDraw_ProcessedIndex = lazyProcess.processedIndex
    const clearState = lazyProcess.isLazyDrawBigining()
    const canvasWindow = drawPathContext.buffer.canvasWindow

    this.appDrawing.drawDrawPaths(canvasWindow, drawPathContext, clearState)

    console.debug(`LazyDraw${clearState ? ' begin' : ' draw'} from ${last_lazyDraw_ProcessedIndex} to ${lazyProcess.processedIndex} -? buffer[${drawPathContext.bufferStack.length}]`)

    if (!drawPathContext.isLastDrawExist()) {
      return
    }

    // Save states for drawing steps
    lazyProcess.processedIndex = drawPathContext.lastDrawPathIndex

    if (drawPathContext.isFinished()) {

      lazyProcess.finishLazyProcess()

      console.debug('LazyDraw finished at', lazyProcess.processedIndex)

      this.appDrawing.clearWindow(this.appView.mainWindow)

      this.appDrawing.canvasRender.resetTransform()

      this.appDrawing.canvasRender.drawImage(canvasWindow.canvas
        , 0, 0, this.appView.mainWindow.width, this.appView.mainWindow.height
        , 0, 0, this.appView.mainWindow.width, this.appView.mainWindow.height)

      if (this.subtoolContext.isEditMode()) {

        this.appDrawing.drawPathContext.isEditModeDraw = true
        this.appDrawing.drawPathContext.redrawActiveLayerOnly = true
        this.appDrawing.drawPathContext.currentLayerOnly = false
        this.appDrawing.drawPathContext.isModalToolRunning = false
        this.drawMainWindow_drawEditMode(this.appView.mainWindow, this.appDrawing.drawPathContext)
      }
    }
  }

  lazyProcess_EyesSymmetry() {

    // console.debug('lazyProcess_EyesSymmetry')

    const viewKeyframeLayers = this.appView.viewKeyframe.collectVectorViewKeyframeLayersForEdit(this.appDrawing.currentViewKeyframe)

    // console.debug('viewKeyframeLayers', viewKeyframeLayers.length)

    this.appdocument.eyesSymmetry.updateEyesSymetries(viewKeyframeLayers)
  }

  // MainController implementations

  isWhileLoading(): boolean { // @implements MainController

    return (
      this.mainProcessState == MainProcessStateID.systemResourceLoading
      || this.mainProcessState == MainProcessStateID.documentResourceLoading
    )
  }

  setDefferedWindowResize() { // @implements MainController

    this.isDeferredWindowResizeWaiting = true
    this.deferredWindowResizeWaitingEndTime = Platform.getCurrentTime() + this.deferredWindowResizeWaitingDuration
  }

  isEventDisabled(): boolean { // @implements MainController

    return (
      this.isWhileLoading()
      || this.appView.dialog.isDialogOpened()
    )
  }

  resetDocument() { // @implements MainController

    const documentData = this.appdocument.createDefaultDocumentData()

    this.initializeDocumentContext(documentData)

    this.updateLayerStructure()

    this.appTool.setCurrentLayer(null)

    this.appTool.setCurrentFrame(0)

    this.appTool.selectLayer(documentData.rootLayer.childLayers[0])

    this.setHeaderDefaultDocumentFileName()

    this.subtoolContext.setRedrawAllWindows()
  }

  saveDocument() { // @implements MainController

    const documentData = this.docContext.document

    const filePath = this.appView.dom.getInputElementText(this.appView.ID.fileName)

    if (Strings.isNullOrEmpty(filePath)) {

      this.appView.dialog.messageBox('ファイル名が指定されていません。')
      return
    }

    this.appdocument.saveDocumentData(filePath, documentData, false)

    this.userSetting.saveSettings()

    this.appView.dialog.messageBox('保存しました。')
  }

  // MainEditor implementations

  openFileDialog(targetID: OpenFileDialogTargetID) { // @implements MainEditor

    if (targetID == OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {

      if (!ImageFileReferenceLayer.isImageFileReferenceLayer(this.docContext.currentLayer)) {
        throw new Error('ERROR 0002:OpenFileDialog Invalid execution for current layer.')
      }

      // this.appView.dialog.openFileDialogModal(targetID)
      this.appView.modalWindow.open(this.appView.modalWindow.openImageReference)
    }
  }

  setCurrentOperationUnitID(operationUnitID: OperationUnitID) { // @implements MainEditor

    this.appTool.setCurrentOperationUnitID(operationUnitID)
  }

  setCurrentLayer(layer: Layer) { // @implements MainEditor

    this.appTool.selectLayer(layer)
  }

  startModalTool(subtoolID: SubToolID) { // @implements MainEditor

    this.appTool.startModalTool(subtoolID)
  }

  endModalTool() { // @implements MainEditor

    this.appTool.endModalTool()
  }

  cancelModalTool() { // @implements MainEditor

    this.appTool.cancelModalTool()
  }

  isModalToolRunning(): boolean { // @implements MainEditor

    return this.appTool.isModalToolRunning()
  }

  collectVectorViewKeyframeLayers(): ViewKeyframeLayer[] { // @implements MainEditor

    return this.appDrawing.currentViewKeyframe.layers
  }

  collectVectorViewKeyframeLayersForEdit(): ViewKeyframeLayer[] { // @implements MainEditor

    return this.appView.viewKeyframe.collectVectorViewKeyframeLayersForEdit(this.appDrawing.currentViewKeyframe, true)
  }

  updateLayerStructure() { // @implements MainEditor

    this.updateLayerStructureInternal(true, true, true, true)

    this.prepareDrawPathBuffers()
  }

  getPosingModelByName(name: string): PosingModel { // @implements MainEditor

    return this.appView.modelFile.posingModelDictionary.get(name)
  }

  // DialogMain implementations

  getLocalSetting(): LocalSetting { // @implements DialogMain

    return this.userSetting.localSetting
  }

  getDocumentData(): DocumentData { // @implements DialogMain

    return this.docContext.document
  }

  updateForLayerProperty() { // @implements DialogMain

    this.updateLayerStructureInternal(true, true, true, true)

    this.prepareDrawPathBuffers()
  }

  exportImageFile(fileName: string, exportPath: string, scale: float, imageType: int, backGroundType: DocumentBackGroundTypeID) { // @implements DialogMain

    this.appdocument.exportImageFile(fileName, exportPath, scale, imageType, backGroundType)
  }

  executeLayerCommand(layerCommand: Command_Layer_CommandBase) { // @implements DialogMain

    this.appdocument.executeLayerCommand(layerCommand)
  }

  executeNewKeyframe(typeID: NewKeyframeTypeID) { // @implements DialogMain

    this.appdocument.executeNewKeyframe(typeID)
  }

  executeDeleteKeyframe(typeID: DeleteKeyframeTypeID) { // @implements DialogMain

    this.appdocument.executeDeleteKeyframe(typeID)
  }
}
