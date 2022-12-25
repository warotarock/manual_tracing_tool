import { Platform } from '../platform'
import { App_Document } from './app-document'
import { App_Drawing } from './app-drawing'
import { AppEvent_Main_Interface, App_Event } from './app-event'
import { App_DefferedProcess } from './app-deffered-process'
import { App_Tool } from './app-tool'
import { App_UserSetting } from './app-user-setting'
import { App_View } from './app-view'
import { Command_Layer_CommandBase } from './commands'
import { int, Strings } from './common-logics'
import { DocumentContext, SubToolContext, SubToolContext_AppMain_Interface, SubToolDrawingContext } from './context'
import { DocumentData, ImageFileReferenceLayer, Layer, PosingModel } from './document-data'
import { DocumentDeserializingLogic, DocumentFileNameLogic, DocumentSerializingLogic, LayerLogic } from './document-logic'
import { SystemResourceLoading } from './loading'
import { CanvasWindow } from './render'
import { DialogWindow_Main_Interface, OpenFileDialogTargetID, SideBarContentID } from './ui'
import { ExportImageFileParam } from './ui-modal-window'
import { LocalSetting, ShortcutCommandID } from './user-setting'
import { ViewKeyframeLayer } from './view'
import { ToolPointerEvent } from './tool'

export enum MainProcessStateID {
  none,
  startup,
  pause,
  systemResourceLoading,
  documentJSONLoading,
  documentResourceLoading,
  running
}

export class App_Main implements AppEvent_Main_Interface, SubToolContext_AppMain_Interface, DialogWindow_Main_Interface {

  appView = new App_View()
  appDrawing = new App_Drawing()
  appTool = new App_Tool()
  appUserSetting = new App_UserSetting()
  appDocument = new App_Document()
  appEvent = new App_Event()
  appDefferedProcess = new App_DefferedProcess()

  docContext: DocumentContext = null
  subtoolContext: SubToolContext = null
  subtoolDrawingContext: SubToolDrawingContext = null

  systemResourceLoading = new SystemResourceLoading()

  mainProcessState = MainProcessStateID.startup
  isDeferredWindowResizeWaiting = false
  deferredWindowResizeWaitingDuration = 250
  deferredWindowResizeWaitingEndTime = 0
  lastTime = 0
  elapsedTime = 0

  isFirstStartup = true

  constructor() {

    this.appView.link(this.appDrawing.canvasRender, this.appDrawing.drawStyle, this)
    this.appDrawing.link(this.appView)
    this.appTool.link(this.appView, this.appDrawing)
    this.appUserSetting.link()
    this.appDocument.link(this.appView, this.appDrawing, this.appTool, this.appUserSetting.settingFile)
    this.appEvent.link(this.appView, this.appDrawing, this.appDocument, this.appTool, this.appUserSetting, this)
    this.appDefferedProcess.link(this.appDrawing, this.appDrawing.drawPathBuffering, this.appDocument.posing3D, this.appDrawing.posing3DView)
    this.systemResourceLoading.link(this.appDrawing.posing3DViewRender, this.appDocument.posing3DModel)
  }

  // Initializing devices not depending media resoures

  onInitializeSystemDevices() {

    this.appUserSetting.loadSettings()

    this.appView.initializeViewDevices()

    this.appDrawing.initializeDrawingDevices(this.appView.webglWindow, this.appView.drawGPUWindow)

    this.startLoadingSystemResources()
  }

  // Loading system resources

  private startLoadingSystemResources() {

    this.systemResourceLoading.startLoadingSystemResources(this.appView.modelFile, this.appView.imageResurces)

    this.mainProcessState = MainProcessStateID.systemResourceLoading
  }

  processLoadingSystemResources() {

    // Loading state polling

    if (this.systemResourceLoading.isLoading()) {
      return
    }

    // Loading finished

    this.appView.timeLineWindow.systemImage = this.appView.systemImage

    if (this.appUserSetting.settingFile.localSetting.lastUsedFilePaths.length == 0) {

      this.startWidhDefaultDocumentData()
    }
    else {

      const lastURL = this.appUserSetting.settingFile.localSetting.lastUsedFilePaths[0]

      const documentData = new DocumentData()
      this.appDocument.documentLoading.startLoadingDocumentFromURL(documentData, lastURL)

      this.mainProcessState = MainProcessStateID.documentJSONLoading
    }
  }

  // Loading document resources

  startReloadDocument(filepath: string) { // @implements AppEvent_Main_Interface

    const documentData = new DocumentData()

    this.appDocument.documentLoading.startLoadingDocumentFromURL(documentData, filepath)

    this.mainProcessState = MainProcessStateID.documentJSONLoading
  }

  startReloadDocumentFromFile(file: File, url: string) { // @implements AppEvent_Main_Interface

    if (Strings.isNullOrEmpty(url)) {

      throw new Error('ERROR 0001:both of url and file are null or empty')
    }

    const isAvailable = this.appDocument.documentLoading.startLoadingDocumentFromFile(file, url)

    if (isAvailable) {

      this.mainProcessState = MainProcessStateID.documentJSONLoading
    }
    else {

      console.debug('error: not supported file type.')
    }
  }

  processLoadingDocumentFile() {

    if (this.appDocument.documentLoading.hasErrorOnLoadingDocument()) {

      console.error('ERROR 0003:An error occured while loading document data.')

      this.startWidhDefaultDocumentData()
      return
    }

    if (!this.appDocument.documentLoading.isDocumentLoaded()) {
      return
    }

    this.appDocument.fixLoadedDocumentData(
      this.appDocument.documentLoading.loading_DocumentData,
      this.appView.modelFile
    )

    this.appDocument.documentLoading.startLoadingDocumentResources(
      this.appDocument.documentLoading.loading_DocumentData,
      this.appDocument.documentLoading.loading_DocumentFilePath
    )

    this.appDocument.documentLoading.finishDocumentDataLoading()

    this.mainProcessState = MainProcessStateID.documentResourceLoading
  }

  startLoadingDocumentResourcesProcess(document: DocumentData) { // @implements MainEditor

    this.appDocument.documentLoading.startLoadingDocumentResources(document, this.docContext.documentFilePath)

    this.mainProcessState = MainProcessStateID.documentResourceLoading
  }

  processLoadingDocumentResources() {

    // Check loading states

    if (this.appDocument.documentLoading.isDocumentResourceLoading()) {
      return
    }

    // TODO: ファイルの存在チェックとエラー対応
    if (this.appDocument.documentLoading.hasErrorOnLoadingDocumentResource()) {

      console.error('ERROR 0004:An error occured while loading document resource.')

      this.startWidhDefaultDocumentData()
      return
    }

    // Loading finished

    if (this.appDocument.documentLoading.isDocumentLoading()
      && this.docContext != null
      && this.docContext.documentData != null
    ) {

      DocumentSerializingLogic.releaseDocumentResources(this.docContext.documentData, this.appDrawing.drawGPURender)

      this.docContext.documentData = null
    }

    DocumentDeserializingLogic.finishResourceLoading(this.appDocument.documentLoading.resourceLoading_DocumentData)

    this.start(
      this.appDocument.documentLoading.resourceLoading_DocumentData,
      this.appDocument.documentLoading.loading_DocumentFilePath,
      false
    )

    if (!this.isFirstStartup) {

      this.appUserSetting.saveSettings()
    }
  }

  // Starting ups after loading resources

  private start(documentData: DocumentData, document_filePath: string, isNew: boolean) {

    this.initializeDocumentContext(documentData, document_filePath)

    this.appTool.initializeTools()

    this.appView.initializeViewState()

    this.updateLayerStructureInternal(true, true, false, false)

    const layers = LayerLogic.collectLayers(documentData.rootLayer)
    const selected_layers = layers.filter(layer => Layer.isSelected(layer))
    if (selected_layers.length > 0) {
      this.docContext.currentLayer = selected_layers[0]
      this.appTool.selectLayer(this.docContext.currentLayer, false, false)
    }
    else {
      this.appTool.selectLayer(documentData.rootLayer.childLayers[0])
    }

    this.updateLayerStructureInternal(false, false, true, true)

    this.appView.mainWindow.viewScale = documentData.defaultViewScale
    this.appView.mainWindow.viewRotation = 0.0
    this.appView.mainWindow.mirrorX = false
    this.appView.mainWindow.mirrorY = false

    this.appView.viewOperation.copyLastViewLocation(false, this.appView.mainWindow)

    this.subtoolContext.updateContext()

    if (!isNew) {

      this.appUserSetting.settingFile.registerLastUsedFile(document_filePath)
    }

    // 初回描画

    this.updateHeaderDocumentFileName(document_filePath)

    this.prepareDrawPathBuffers()

    this.setLazyUpdateNeeded()

    this.appView.updateTabs(this.docContext)
    this.appView.updateRibbonUI(this.docContext, true)

    this.resizeWindowsAndBuffers() // TODO: これをしないとキャンバスの高さが足りなくなる。最初のリサイズのときは高さがなぜか少し小さい。2回リサイズする必要は本来ないはずなのでなんとかしたい。

    this.appTool.updateFooterMessage()

    this.appView.restoreUIStatesFromUserSetting(this.appUserSetting.userUIState)

    if (!this.appEvent.isEventSetDone) { // このチェックはドキュメントを新規作成したとき再登録しないため必要です

      this.appEvent.setEvents()
    }

    this.initialUpdatesForLayers(this.collectVectorViewKeyframeLayersForEdit())

    this.subtoolContext.setRedrawAllWindows()

    if (this.appView.right_SideBarContainerRef.isContentOpened(SideBarContentID.colorMixerWindow)) {

      this.docContext.redrawColorMixerSample = true
    }

    this.mainProcessState = MainProcessStateID.running
    this.isFirstStartup = false
  }

  private startWidhDefaultDocumentData() {

    const documentData = this.appDocument.createDefaultDocumentData()

    const filePath = DocumentFileNameLogic.getDefaultDocumentFilePath(this.appUserSetting.settingFile.localSetting)

    this.start(documentData, filePath, true)
  }

  private initializeDocumentContext(documentData: DocumentData, document_filePath: string) {

    this.docContext = new DocumentContext()
    this.docContext.documentData = documentData
    this.docContext.drawStyle = this.appDrawing.drawStyle
    this.docContext.mainWindow = this.appView.mainWindow
    this.docContext.posing3DView = this.appDrawing.posing3DView
    this.docContext.posing3DLogic = this.appDocument.posing3D
    this.docContext.lazy_DrawPathContext = this.appDrawing.lazy_drawPathContext
    this.docContext.documentFilePath = document_filePath

    this.subtoolContext = new SubToolContext(this.docContext, this, this.appDocument, this.appTool)

    this.subtoolDrawingContext = new SubToolDrawingContext(this.appDrawing.editorDrawer, this.appDrawing.canvasRender, this.appDrawing.drawStyle)

    this.appTool.linkContexts(this.docContext, this.subtoolContext)
    this.appEvent.linkContexts(this.docContext, this.subtoolContext)
    this.appDocument.linkContexts(this.docContext, this.subtoolContext)
    this.appDefferedProcess.linkContexts(this.docContext, this.subtoolContext)

    this.appTool.updateBrushParameterReferences()

    this.appView.viewOperation.setViewToDefaultState(this.appView.mainWindow, 1.0)
  }

  private initialUpdatesForLayers(viewKeyframeLayers: ViewKeyframeLayer[]) {

    for (const viewKeyframeLayer of viewKeyframeLayers) {

      viewKeyframeLayer.layer.runtime.needsPostUpdate = true
    }

    this.appDefferedProcess.setPostUpdateNeeded()

    this.appDefferedProcess.executePostUpdate(
      this.appDrawing.main_drawPathContext,
      this.docContext.currentViewKeyframe,
      false,
      this.subtoolContext
    )

    this.appDrawing.drawPathBuffering.updateRenderCaches(
      this.appDrawing.main_drawPathContext,
      this.docContext.currentViewKeyframe
    )

    for (const viewKeyframeLayer of viewKeyframeLayers) {

      this.setRedrawDrawPathForLayer(viewKeyframeLayer.layer)
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

      const aniSetting = this.docContext.documentData.animationSettingData

      aniSetting.currentTimeFrame += 1

      if (aniSetting.currentTimeFrame >= aniSetting.loopEndFrame) {

        aniSetting.currentTimeFrame = aniSetting.loopStartFrame
      }

      this.setCurrentFrameInternal(aniSetting.currentTimeFrame)

      this.subtoolContext.setRedrawMainWindow()
      this.subtoolContext.setRedrawTimeLineWindow()
    }
  }

  // Main drawing process

  activeLayerBufferDrawn = false

  draw() {

    const currentLayerOnly = this.appView.layerHighlight.isAnimating()

    this.appView.mainWindow.caluclateViewMatrix(this.appView.mainWindow.view2DMatrix)
    mat4.invert(this.appView.mainWindow.invView2DMatrix, this.appView.mainWindow.view2DMatrix)

    this.subtoolContext.updateContext()

    if (this.docContext.redrawMainWindow) {

      this.appDrawing.drawMainWindow(
        this.appView.mainWindow,
        this.docContext,
        this.subtoolContext.isDrawMode(),
        this.subtoolContext.isEditMode(),
        this.subtoolContext.tool.isModalToolRunning(),
        this.docContext.drawCPUOnly,
        this.docContext.redrawCurrentLayer,
        currentLayerOnly
      )

      this.docContext.redrawMainWindow = false
    }

    if (this.docContext.redrawEditorWindow) {

      this.appDrawing.clearWindow(this.appView.editorWindow)

      this.drawEditorWindow(this.appView.editorWindow, this.appView.mainWindow)

      this.docContext.redrawEditorWindow = false
    }

    if (this.docContext.redrawLayerWindow) {

      this.appView.layerWindow.update(this.docContext, this.docContext.currentLayer)

      this.appView.layerWindow.uiRef.update(this.docContext.layerListItems)

      this.appView.updateRibbonUI_Layer(this.docContext)

      this.docContext.redrawLayerWindow = false
    }

    if (this.docContext.redrawRibbonUI) {

      this.appTool.updateCurrentPaintParameters()
      this.appView.subToolWindow.updateViewItemState(this.subtoolContext)
      this.appView.updateTabs(this.docContext)
      this.appView.updateRibbonUI(this.docContext, true)

      this.docContext.redrawRibbonUI = false
    }

    if (this.docContext.redrawPaletteSelectorWindow) {

      this.drawPaletteSelectorWindow()

      this.appView.paletteSelectorWindow.uiRef.update(this.docContext.documentData.paletteColors)

      this.docContext.redrawPaletteSelectorWindow = false
    }

    if (this.docContext.redrawColorMixerWindow) {

      this.drawColorMixerWindow()

      this.docContext.redrawColorMixerWindow = false
    }

    if (this.docContext.redrawColorMixerSample) {

      this.drawColorMixerSample()

      this.docContext.redrawColorMixerSample = false
    }

    if (this.docContext.redrawTimeLineWindow) {

      this.drawTimeLineWindow()

      this.docContext.redrawTimeLineWindow = false
    }

    if (this.docContext.redrawWebGLWindow) {

      this.appDrawing.drawingPosing3D.drawPosing3DView(
        this.appView.webglWindow,
        this.docContext.layerListItems,
        this.appView.mainWindow,
        this.docContext,
        currentLayerOnly
      )

      this.docContext.redrawWebGLWindow = false
    }

    if (this.docContext.redrawHeaderWindow) {

      this.docContext.redrawHeaderWindow = false
    }

    if (this.docContext.redrawFooterWindow) {

      this.appView.footerWindow.updateFooterText()

      this.docContext.redrawFooterWindow = false
    }

    this.executeLazyUpdates()

    this.docContext.redrawCurrentLayer = false
  }

  private drawEditorWindow(editorWindow: CanvasWindow, mainWindow: CanvasWindow) {

    mainWindow.updateViewMatrix()
    mainWindow.copyTransformTo(editorWindow)

    this.appDrawing.canvasRender.setContext(editorWindow)

    if (this.subtoolContext.needsDrawOperatorCursor()) {

      this.appDrawing.operatorCursor.drawOperatorCursor(this.docContext.operatorCursor)
    }

    this.appDrawing.drawingEyesSymmetry.drawEyesSymmetries(this.docContext.layerListItems, this.subtoolContext)

    const current_SubTool = this.appTool.getCurrentSubTool()
    if (current_SubTool != null) {

      this.subtoolContext.updateContext()

      this.subtoolDrawingContext.setCanvasWindow(editorWindow)

      current_SubTool.onDrawEditor(this.subtoolContext, this.subtoolDrawingContext)
    }

    this.appView.operationPanel.draw(this.appDrawing.canvasRender)
  }

  private drawTimeLineWindow() {

    this.appView.dom.resizing.resizeCanvasToParent(this.appView.timeLineWindow.canvasWindow)

    this.appDrawing.clearWindow(this.appView.timeLineWindow.canvasWindow)

    this.appView.timeLineWindow.drawCommandButton(this.docContext)
    this.appView.timeLineWindow.drawTimeLine(this.docContext)
  }

  private drawPaletteSelectorWindow() {

    this.appView.paletteSelectorWindow.updateCommandButtons()

    this.appView.paletteSelectorWindow.updatePaletteItems(this.docContext)
  }

  private drawColorMixerWindow() {

    const color = this.appView.paletteSelectorWindow.getCurrentLayerTargetColorRef(this.docContext)

    this.appView.colorMixerWindow.updateInputControls(color)
  }

  private drawColorMixerSample() {

    if (this.appView.colorMixerWindow.isDrawingDone) {
      return
    }

    this.appView.dom.resizing.resizeCanvasToBoundingClientRect(this.appView.colorMixerWindow.colorCanvas)

    this.appView.colorMixerWindow.drawPaletteColorMixer()

    this.appView.colorMixerWindow.isDrawingDone = true
  }

  // Lazy process

  private executeLazyUpdates() {

    const drawPathContext = this.appDrawing.lazy_drawPathContext
    const state = this.appDefferedProcess.drawing_LazyUpdateState

    if (state.isFinished) {
      return
    }

    if (state.needsStartingLazyUpdate) {

      this.appDefferedProcess.startLazyUpdates()
      state.startLazyCalculation()
      return
    }

    if (state.isLazyUpdateWaiting()) {
      return
    }

    if (state.isFirstTime) {

      state.isFirstTime = false

      // TODO: 遅延処理の処理中であることのインジケータを実装する？
    }

    if (!this.appDefferedProcess.isLazyCalculationFinished()) {

      this.appDefferedProcess.executeLazyUpdate(
        drawPathContext,
        this.docContext.currentViewKeyframe
      )

      this.executePostUpdate()
    }
    else if (!state.isLazyDrawingFinished) {

      // TODO: GPU描画に対応する
      if (!this.docContext.drawCPUOnly) {

        this.appDefferedProcess.drawDrawPathForLazyDraw(
          this.appView.mainWindow,
          this.docContext,
          this.subtoolContext,
          drawPathContext
        )
      }
      else {

        this.subtoolContext.setRedrawMainWindowEditorWindow()
      }

      state.finishLazyDrawing()
    }
  }

  // Wide area structural management

  private prepareDrawPathBuffers() {

    this.appDrawing.drawPathBuffering.prepareDrawPathBuffers(
      this.appDrawing.main_drawPathContext,
      this.appView.mainWindow
    )

    this.appDrawing.drawPathBuffering.prepareForLazyDrawComposition(
      this.appDrawing.lazy_drawPathContext,
      this.appView.mainWindow.width,
      this.appView.mainWindow.height,
      false
    )

    this.appDrawing.drawPathBuffering.updateAllRenderCaches(
      this.appDrawing.main_drawPathContext,
      this.docContext.currentViewKeyframe
    )
  }

  private resizeWindowsAndBuffers() {

    this.appView.resizeWindows()

    this.prepareDrawPathBuffers()
  }

  private updateLayerStructureInternal(updateLayerWindowItems: boolean, updateViewKeyframes: boolean, updateHierarchicalStates: boolean, updateDrawPath: boolean, updateContextCurrentRefferences = true) {

    if (updateHierarchicalStates) {

      LayerLogic.updateHierarchicalStatesRecursive(this.docContext.documentData.rootLayer)
    }

    if (updateViewKeyframes) {

      this.appView.viewKeyframe.collectViewKeyframesToContext(this.docContext)
    }

    if (updateLayerWindowItems) {

      this.appView.viewLayerList.collectItemsToContext(this.docContext)

      this.appView.posingLayerOptions = this.appView.viewLayerList.collectPosingLayerOptions(this.docContext)
    }

    if (updateDrawPath) {

      this.appDrawing.collectDrawPathsForDocument(this.docContext)

      this.prepareDrawPathBuffers()
    }

    if (updateContextCurrentRefferences) {

      this.appTool.updateContextCurrentRefferences()
    }
  }

  private setCurrentFrameInternal(frame: int, skipCollectDrawPaths = false) { // @implements AppEvent_Main_Interface

    const aniSetting = this.docContext.documentData.animationSettingData

    aniSetting.currentTimeFrame = frame

    if (aniSetting.currentTimeFrame < 0) {

      aniSetting.currentTimeFrame = 0
    }

    if (aniSetting.currentTimeFrame > aniSetting.maxFrame) {

      aniSetting.currentTimeFrame = aniSetting.maxFrame
    }

    const viewKeyframeChanged = this.appView.viewKeyframe.updateContextForViewKeyframeReferences(this.docContext, aniSetting.currentTimeFrame)

    if (viewKeyframeChanged) {

      if (!skipCollectDrawPaths) {

        this.updateLayerStructureInternal(false, false, false, true, false)
      }

      this.appTool.updateContextCurrentRefferences()
    }

    this.subtoolContext.setRedrawMainWindowEditorWindow()
    this.subtoolContext.setRedrawTimeLineWindow()
  }

  private updateHeaderDocumentFileName(filePath: string) {

    const fileName = Platform.path.getFileName(filePath)

    // TODO: ウィンドウタイトルに反映する
  }

  // AppEvent_Main_Interface implementations

  executeSubToolKeyDown(key: string, commandID: ShortcutCommandID): boolean { // @implements AppEvent_Main_Interface

    return this.appTool.executeSubToolKeyDown(key, commandID)
  }

  executeSubToolMouseDown(e: ToolPointerEvent) { // @implements AppEvent_Main_Interface

    this.appTool.executeSubToolMouseDown(e)

    this.executePostUpdate()
  }

  executeSubToolMouseMove(e: ToolPointerEvent) { // @implements AppEvent_Main_Interface

    this.appTool.executeSubToolMouseMove(e)

    this.executePostUpdate()
  }

  executeSubToolMouseUp(e: ToolPointerEvent) {

    this.appTool.executeSubToolMouseUp(e)

    this.executePostUpdate()
  }

  executeUndo() { // @implements AppEvent_Main_Interface

    this.appTool.executeUndo()

    this.executePostUpdate(true)

    this.appTool.activateCurrentTool()

    this.subtoolContext.setRedrawMainWindowEditorWindow()
  }

  executeRedo() { // @implements AppEvent_Main_Interface

    this.appTool.executeRedo()

    this.executePostUpdate()

    this.appTool.activateCurrentTool()

    this.subtoolContext.setRedrawMainWindowEditorWindow()
  }

  executePostUpdateForCurrentLayer() { // @implements AppEvent_Main_Interface

    this.docContext.currentLayer.runtime.needsPostUpdate = true

    this.appDefferedProcess.setPostUpdateNeeded()
    this.executePostUpdate()

    this.setRedrawDrawPathForLayer(this.docContext.currentLayer)

    this.subtoolContext.setRedrawWindowsForLayerColorChanging()
  }

  executePostUpdate(isUndo = false) { // @implements AppEvent_Main_Interface

    const isUpdated = this.appDefferedProcess.executePostUpdate(
      this.appDrawing.main_drawPathContext,
      this.docContext.currentViewKeyframe,
      isUndo,
      this.subtoolContext
    )

    if (!isUpdated) {
      return
    }

    this.appDrawing.drawPathBuffering.updateRenderCaches(
      this.appDrawing.main_drawPathContext,
      this.docContext.currentViewKeyframe
    )

    this.appTool.updateActiveRefferences() // 線画レイヤーでグループが削除されたりアンドゥ/リドゥ後に再選択するためここで更新が必要
  }

  setRedrawDrawPathForLayer(layer: Layer) { // @implements SubToolContext_AppTool_Interface

    for (const drawPathStep of this.appDrawing.main_drawPathContext.steps) {

      if (drawPathStep.layer == layer) {

        drawPathStep.needsRedraw = true
      }
    }
  }

  setCurrentFrame(frame: int) { // @implements AppEvent_Main_Interface

    this.setCurrentFrameInternal(frame, false)
  }

  onWindowBlur() { // @implements AppEvent_Main_Interface

    // console.debug('Window blur')

    if (this.mainProcessState == MainProcessStateID.running) {

      this.mainProcessState = MainProcessStateID.pause
      // console.debug('  mainProcessState -> pause')
    }
  }

  onWindowFocus() { // @implements AppEvent_Main_Interface

    // console.debug('Window focus')

    if (this.mainProcessState == MainProcessStateID.pause) {

      this.mainProcessState = MainProcessStateID.running
      // console.debug('  mainProcessState -> running')
    }
  }

  isWhileLoading(): boolean { // @implements AppEvent_Main_Interface

    return (
      this.mainProcessState == MainProcessStateID.systemResourceLoading
      || this.mainProcessState == MainProcessStateID.documentResourceLoading
    )
  }

  setDefferedWindowResize() { // @implements AppEvent_Main_Interface

    this.isDeferredWindowResizeWaiting = true
    this.deferredWindowResizeWaitingEndTime = Platform.getCurrentTime() + this.deferredWindowResizeWaitingDuration
  }

  isEventDisabled(): boolean { // @implements AppEvent_Main_Interface

    return (
      this.isWhileLoading()
      || this.isDeferredWindowResizeWaiting
      || this.appView.modalWindow.isActive()
      || this.appView.dialogScreen.isActive()
      || this.appView.dialogScreen.isDialogWindowOpened()
      || this.appView.popover.isActive()
    )
  }

  resetDocument() { // @implements AppEvent_Main_Interface

    DocumentSerializingLogic.releaseDocumentResources(this.docContext.documentData, this.appDrawing.drawGPURender)

    this.startWidhDefaultDocumentData()
  }

  saveDocument() { // @implements AppEvent_Main_Interface

    this.saveDocumentToFile(this.docContext.documentFilePath)
  }

  saveAsDocument(directoryPath: string, fileName: string) { // @implements AppEvent_Main_Interface

    const filePath = Platform.path.join(directoryPath, fileName)

    this.saveDocumentToFile(filePath)
  }

  private saveDocumentToFile(filePath: string) {

    const documentData = this.docContext.documentData

    if (Strings.isNullOrEmpty(filePath)) {

      this.appView.dialogScreen.messageBox('ファイル名が指定されていません。')
      return
    }

    this.appDocument.saveDocumentData(filePath, documentData, false)

    this.appUserSetting.saveSettings()

    this.appView.dialogScreen.messageBox('保存しました。')
  }

  getLocalSetting(): LocalSetting { // @implements AppEvent_Main_Interface

    return this.appUserSetting.settingFile.localSetting
  }

  setUIStateVisible(uiStateName: string, visible: boolean) { // @implements AppEvent_Main_Interface

    const uiState = this.appUserSetting.userUIState.getUIState(uiStateName)

    if (uiState) {

      uiState.visible = visible
      // this.userSetting.saveSettings()
    }
  }

  setOperatorCursorLocationToMouse() { // @implements AppEvent_Main_Interface

    vec3.copy(this.docContext.operatorCursor.location, this.appView.mainWindow.pointerEvent.location)
    this.subtoolContext.setRedrawEditorWindow()
  }

  // SubToolContext_Main_Interface implementations

  setLazyUpdateNeeded() { // @implements SubToolContext_Main_Interface

    this.appDefferedProcess.startLazyUpdates()
  }

  setPostUpdateNeeded() { // @implements SubToolContext_Main_Interface

    this.appDefferedProcess.setPostUpdateNeeded()
  }

  openFileDialog(targetID: OpenFileDialogTargetID) { // @implements SubToolContext_Main_Interface

    if (targetID == OpenFileDialogTargetID.imageFileReferenceLayerFilePath) {

      if (!ImageFileReferenceLayer.isImageFileReferenceLayer(this.docContext.currentLayer)) {
        throw new Error('ERROR 0002:OpenFileDialog Invalid execution for current layer.')
      }

      this.appView.modalWindow.openImageFileReferenceModal()
    }
  }

  collectVectorViewKeyframeLayers(): ViewKeyframeLayer[] { // @implements SubToolContext_Main_Interface

    return this.docContext.currentViewKeyframe.layers.slice()
  }

  collectVectorViewKeyframeLayersForEdit(): ViewKeyframeLayer[] { // @implements SubToolContext_Main_Interface

    return this.appView.viewKeyframe.collectVectorViewKeyframeLayersForEdit(this.docContext.currentViewKeyframe, true)
  }

  updateLayerStructure() { // @implements SubToolContext_Main_Interface

    this.updateLayerStructureInternal(true, true, true, true)
  }

  getPosingModelByName(name: string): PosingModel { // @implements SubToolContext_Main_Interface

    return this.appView.modelFile.posingModelDictionary.get(name)
  }

  // DialogWindow_Main_Interface implementations

  getDocumentData(): DocumentData { // @implements DialogWindow_Main_Interface

    return this.docContext.documentData
  }

  updateForLayerProperty() { // @implements DialogWindow_Main_Interface

    this.updateLayerStructureInternal(true, true, true, true)
  }

  exportImageFile(param: ExportImageFileParam) { // @implements DialogWindow_Main_Interface

    this.docContext.documentData.exportImageSetting.fileName = param.fileName
    this.docContext.documentData.exportImageSetting.exportDirectory = param.exportDirectory
    this.docContext.documentData.exportImageSetting.imageFileType = param.imageFileType
    this.docContext.documentData.exportImageSetting.backGroundType = param.backGroundType
    this.docContext.documentData.exportImageSetting.scale = param.scale
    this.docContext.documentData.exportImageSetting.autoNumberingEnabled = param.autoNumberingEnabled
    this.docContext.documentData.exportImageSetting.exportingCount = param.exportingCount

    this.appDocument.exportImageFile(param.fileName, param.exportDirectory, param.scale, param.imageFileType, param.backGroundType, param.exportingCount)
  }

  executeLayerCommand(layerCommand: Command_Layer_CommandBase) { // @implements DialogWindow_Main_Interface

    this.appDocument.executeLayerCommand(layerCommand)
  }
}
