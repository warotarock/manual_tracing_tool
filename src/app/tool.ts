import { Command_Layer_CommandBase } from './commands/edit_layer'
import { DocumentContext } from './context/document_context'
import { SubToolContext } from './context/subtool_context'
import { AutoFillLayer, DocumentData, GroupLayer, ImageFileReferenceLayer, Layer, LayerTypeID, PosingLayer,
  VectorLayer } from './document_data'
import { App_Drawing } from './drawing'
import { int } from './logics/conversion'
import { HitTest_Line_IsCloseToMouse } from './logics/hittest'
import { EditModeID, OperationUnitID } from './tool/constants'
import { MainTool, MainToolID, MainToolTab, MainToolTabID, MainToolTabSet, MainToolTabTypeID } from './tool/main_tool'
import { ModalToolBase, SubTool, SubToolID, Tool_None } from './tool/sub_tool'
import { ToolKeyboardEvent } from './tool/tool_keyboard_event'
import { ToolPointerEvent } from './tool/tool_pointer_event'
import { Tool_AddAutoFillPoint, Tool_DeletePoints_DivideLine, Tool_DrawLine, Tool_EditDocumentFrame,
  Tool_EditModeMain, Tool_HideLinePoint_BrushSelect, Tool_OverWriteLineWidth,
  Tool_Posing3d_LocateBody, Tool_Posing3d_LocateHead, Tool_Posing3d_LocateHips, Tool_Posing3d_LocateLeftArm1,
  Tool_Posing3d_LocateLeftArm2, Tool_Posing3d_LocateLeftLeg1, Tool_Posing3d_LocateLeftLeg2, Tool_Posing3d_LocateLeftShoulder,
  Tool_Posing3d_LocateRightArm1, Tool_Posing3d_LocateRightArm2, Tool_Posing3d_LocateRightLeg1, Tool_Posing3d_LocateRightLeg2,
  Tool_Posing3d_LocateRightShoulder, Tool_Posing3d_RotateHead, Tool_Resample_Segment, Tool_ScratchLine, Tool_ScratchLineDraw,
  Tool_ScratchLineWidth, Tool_Select_All_LinePoint, Tool_Select_BrushSelect_Line, Tool_Select_BrushSelect_LinePoint,
  Tool_Select_BrushSelect_LineSegment, Tool_Transform_Lattice_GrabMove, Tool_Transform_Lattice_Rotate,
  Tool_Transform_Lattice_Scale, Tool_Transform_ReferenceImage_GrabMove, Tool_Transform_ReferenceImage_Rotate,
  Tool_Transform_ReferenceImage_Scale } from './tools'
import { MainTool_AutoFillLayer, MainTool_GroupLayer, MainTool_ImageFileReferenceLayer, MainTool_Poing3DLayer, MainTool_VectorLayer } from './tools_main'
import { App_View } from './view'
import { ViewKeyframe, ViewKeyframeLayer } from './view/view_keyframe'
import { ViewLayerListItem } from './view/view_layer_list'
import { RibbonUIControlID } from './window/constants'

export class App_Tool {

  // Dummy tool
  tool_None = new Tool_None()

  // All tools
  subTools: SubTool[] = []
  posing3dSubTools: SubTool[] = []

  // Tools
  tool_DrawLine = new Tool_DrawLine()
  tool_ScratchLine = new Tool_ScratchLine()
  tool_ExtrudeLine = new Tool_ScratchLineDraw()
  tool_OverWriteLineWidth = new Tool_OverWriteLineWidth()
  tool_ScratchLineWidth = new Tool_ScratchLineWidth()
  tool_DeletePoints_DivideLine = new Tool_DeletePoints_DivideLine()
  tool_EditLinePointWidth_BrushSelect = new Tool_HideLinePoint_BrushSelect()

  tool_AddAutoFillPoint = new Tool_AddAutoFillPoint()

  tool_EditModeMain = new Tool_EditModeMain()
  tool_LinePointBrushSelect = new Tool_Select_BrushSelect_LinePoint()
  tool_LineSegmentBrushSelect = new Tool_Select_BrushSelect_LineSegment()
  tool_LineBrushSelect = new Tool_Select_BrushSelect_Line()
  tool_ResampleSegment = new Tool_Resample_Segment()

  tool_Transform_Lattice_GrabMove = new Tool_Transform_Lattice_GrabMove()
  tool_Transform_Lattice_Rotate = new Tool_Transform_Lattice_Rotate()
  tool_Transform_Lattice_Scale = new Tool_Transform_Lattice_Scale()

  tool_EditDocumentFrame = new Tool_EditDocumentFrame()

  tool_Transform_ReferenceImage_GrabMove = new Tool_Transform_ReferenceImage_GrabMove()
  tool_Transform_ReferenceImage_Rotate = new Tool_Transform_ReferenceImage_Rotate()
  tool_Transform_ReferenceImage_Scale = new Tool_Transform_ReferenceImage_Scale()

  tool_SelectAllPoints = new Tool_Select_All_LinePoint()
  hittest_Line_IsCloseTo = new HitTest_Line_IsCloseToMouse()

  tool_Posing3d_LocateHead = new Tool_Posing3d_LocateHead()
  tool_Posing3d_RotateHead = new Tool_Posing3d_RotateHead()
  tool_Posing3d_LocateBody = new Tool_Posing3d_LocateBody()
  tool_Posing3d_LocateHips = new Tool_Posing3d_LocateHips()
  tool_Posing3d_LocateLeftShoulder = new Tool_Posing3d_LocateLeftShoulder()
  tool_Posing3d_LocateRightShoulder = new Tool_Posing3d_LocateRightShoulder()
  tool_Posing3d_LocateLeftArm1 = new Tool_Posing3d_LocateLeftArm1()
  tool_Posing3d_LocateLeftArm2 = new Tool_Posing3d_LocateLeftArm2()
  tool_Posing3d_LocateRightArm1 = new Tool_Posing3d_LocateRightArm1()
  tool_Posing3d_LocateRightArm2 = new Tool_Posing3d_LocateRightArm2()
  tool_Posing3d_LocateLeftLeg1 = new Tool_Posing3d_LocateLeftLeg1()
  tool_Posing3d_LocateLeftLeg2 = new Tool_Posing3d_LocateLeftLeg2()
  tool_Posing3d_LocateRightLeg1 = new Tool_Posing3d_LocateRightLeg1()
  tool_Posing3d_LocateRightLeg2 = new Tool_Posing3d_LocateRightLeg2()

  // Tool state
  mainTools: MainTool[] = []
  current_MainTool: MainTool = null
  current_MainToolTab: MainToolTab = null
  private current_SubTool: SubTool = null
  current_ModalTool: ModalToolBase = null
  modalBeforeTool: SubTool = null

  private appView: App_View = null
  private appDrawing: App_Drawing = null

  private docContext: DocumentContext = null
  private toolContext: SubToolContext = null

  link(appView: App_View, appDrawing: App_Drawing) {

    this.appView = appView
    this.appDrawing = appDrawing
  }

  linkContexts(docContext: DocumentContext, toolContext: SubToolContext) {

    this.docContext = docContext
    this.toolContext = toolContext
  }

  // Initializing

  initializeTools() {

    // Resoures
    this.appDrawing.posing3DView.storeResources(this.appView.modelFile, this.appView.imageResurces)

    // Constructs main tools and sub tools structure
    const tabs = new MainToolTabSet()
    this.mainTools.push(new MainTool_GroupLayer(tabs))
    this.mainTools.push(new MainTool_VectorLayer(tabs))
    this.mainTools.push(new MainTool_ImageFileReferenceLayer(tabs))
    this.mainTools.push(new MainTool_AutoFillLayer(tabs))
    this.mainTools.push(new MainTool_Poing3DLayer(tabs))

    this.addSubTool(this.tool_DrawLine, SubToolID.drawLine)
    this.addSubTool(this.tool_ScratchLine, SubToolID.scratchLine)
    this.addSubTool(this.tool_ExtrudeLine, SubToolID.extrudeLine)
    this.addSubTool(this.tool_OverWriteLineWidth, SubToolID.overWriteLineWidth)
    this.addSubTool(this.tool_ScratchLineWidth, SubToolID.scratchLineWidth)
    this.addSubTool(this.tool_DeletePoints_DivideLine, SubToolID.deletePointBrush)
    this.addSubTool(this.tool_EditLinePointWidth_BrushSelect, SubToolID.editLinePointWidth_BrushSelect)

    this.addSubTool(this.tool_AddAutoFillPoint, SubToolID.autoFill)

    this.addSubTool(this.tool_EditModeMain, SubToolID.editModeMain)
    this.addSubTool(this.tool_LineBrushSelect, SubToolID.lineBrushSelect)
    this.addSubTool(this.tool_LineSegmentBrushSelect, SubToolID.lineSegmentBrushSelect)
    this.addSubTool(this.tool_LinePointBrushSelect, SubToolID.linePointBrushSelect)
    this.addSubTool(this.tool_ResampleSegment, SubToolID.resampleSegment)

    this.addSubTool(this.tool_Transform_Lattice_GrabMove, SubToolID.edit_GrabMove)
    this.addSubTool(this.tool_Transform_Lattice_Rotate, SubToolID.edit_Rotate)
    this.addSubTool(this.tool_Transform_Lattice_Scale, SubToolID.edit_Scale)

    this.addSubTool(this.tool_EditDocumentFrame, SubToolID.editDocumentFrame)

    this.addSubTool(this.tool_Transform_ReferenceImage_GrabMove, SubToolID.image_GrabMove)
    this.addSubTool(this.tool_Transform_ReferenceImage_Rotate, SubToolID.image_Rotate)
    this.addSubTool(this.tool_Transform_ReferenceImage_Scale, SubToolID.image_Scale)

    this.addSubTool(this.tool_Posing3d_LocateHead, SubToolID.p3d_locateHead)

    this.addPosing3DSubTool(this.tool_Posing3d_LocateHead, SubToolID.p3d_locateHead, 0)
    this.addPosing3DSubTool(this.tool_Posing3d_RotateHead, SubToolID.p3d_rotateHead, 1)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateBody, SubToolID.p3d_locateBody, 2)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateHips, SubToolID.p3d_locateHips, 3)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateLeftShoulder , SubToolID.p3d_locateLeftShoulder, 4)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateLeftArm1     , SubToolID.p3d_locateLeftArm1, 4)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateLeftArm2     , SubToolID.p3d_locateLeftArm2, 5)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateRightShoulder, SubToolID.p3d_locateRightShoulder, 6)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateRightArm1    , SubToolID.p3d_locateRightArm1, 6)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateRightArm2    , SubToolID.p3d_locateRightArm2, 7)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateLeftLeg1     , SubToolID.p3d_locateLeftLeg1, 8)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateLeftLeg2     , SubToolID.p3d_locateLeftLeg2, 9)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateRightLeg1    , SubToolID.p3d_locateRightLeg1, 10)
    this.addPosing3DSubTool(this.tool_Posing3d_LocateRightLeg2    , SubToolID.p3d_locateRightLeg2, 11)

    this.current_MainTool = this.getMainTool(MainToolID.vectorLayer)
    this.current_MainToolTab = this.current_MainTool.mainToolTabs[0]
    this.current_MainToolTab.current_SubTool = this.getSubTool(this.current_MainToolTab.default_SubToolID)
    this.current_SubTool = this.current_MainToolTab.current_SubTool
  }

  private addSubTool(tool: SubTool, subtoolID: SubToolID) {

    tool.subtoolID = subtoolID

    this.subTools.push(tool)
  }

  private addPosing3DSubTool(tool: SubTool, subtoolID: SubToolID, toolBarImageIndex: int) {

    tool.subtoolID = subtoolID
    tool.toolBarImage = this.appView.subToolImages[2]
    tool.toolBarImageIndex = toolBarImageIndex

    this.subTools.push(tool)
    this.posing3dSubTools.push(tool)
  }

  // MainTool

  getCurrentMainTool(): MainTool {

    return this.current_MainTool
  }

  private getMainTool(mainToolID: MainToolID): MainTool {

    return this.mainTools.find(tool => tool.mainToolID == mainToolID)
  }

  private getMainToolForLayer(layer: Layer): MainTool {

    let mainToolID = MainToolID.none

    switch(layer.type) {

      case LayerTypeID.groupLayer:
        mainToolID = MainToolID.groupLayer
        break

      case LayerTypeID.autoFillLayer:
        mainToolID = MainToolID.autoFillLayer
        break

      case LayerTypeID.vectorLayer:
        mainToolID = MainToolID.vectorLayer
        break

      case LayerTypeID.imageFileReferenceLayer:
        mainToolID = MainToolID.imageFileReferenceLayer
        break

      case LayerTypeID.posingLayer:
        mainToolID = MainToolID.posing3DLayer
        break
    }

    const mainTool = this.mainTools.find(mainTool => mainTool.mainToolID == mainToolID)

    if (mainTool) {

      return mainTool
    }
    else {

      throw(new Error(`ERROR 0003:There is no main tool for the layer. (${LayerTypeID[layer.type]})`))
    }
  }

  private setCurrentMainTool(mainToolID: MainToolID) {

    let isChanged = (this.docContext.mainToolID != mainToolID)
    const mainTool = this.getMainTool(mainToolID)

    this.current_MainTool = mainTool

    this.docContext.mainToolID = mainToolID
    this.docContext.mainToolTabs = mainTool.mainToolTabs

    if (mainTool.mainToolID == MainToolID.posing3DLayer) {

      this.appView.subToolWindow.collectViewItems(this.posing3dSubTools, this.toolContext)
    }

    if (!mainTool.mainToolTabs.find(tab => (tab.tabID == this.docContext.mainToolTabID))) {

      this.setCurrentMainToolTab(mainTool.mainToolTabs[0].tabID)

      isChanged = true
    }

    if (isChanged) {

      this.toolContext.setRedrawHeaderWindow()
      this.toolContext.setRedrawRibbonUI()
      this.updateFooterMessage()
    }
  }

  executeMainToolKeyDown(key: string): boolean {

    return this.current_MainTool.keydown(key, this.toolContext, this)
  }

  executeMainToolButtonClick(id: RibbonUIControlID): boolean {

    return this.current_MainTool.buttonClick(id, this.toolContext, this)
  }

  // MainToolTab

  setCurrentMainToolTab(tabID: MainToolTabID) {

    const mainToolTab = this.getMainToolTab(tabID)

    if (mainToolTab.type == MainToolTabTypeID.editingTool) {

      this.docContext.editMode = EditModeID.editMode
    }
    else {

      this.docContext.editMode = EditModeID.drawMode
    }

    this.current_MainToolTab = mainToolTab

    if (mainToolTab.current_SubTool == null) {

      const subtool = this.getSubTool(mainToolTab.default_SubToolID)

      mainToolTab.current_SubTool = subtool
    }

    this.docContext.mainToolTabID = tabID

    if (this.toolContext.isDrawMode()) {

      const mainTool = this.getCurrentMainTool()
      mainTool.drawMode_MainToolTab = this.current_MainToolTab
    }

    this.toolContext.setRedrawRibbonUI()
  }

  private getMainToolTab(tabID: MainToolTabID): MainToolTab {

    const tab = this.current_MainTool.mainToolTabs
      .find(tab => tab.tabID == tabID)

    return tab
  }

  // SubTool

  getCurrentSubTool(): SubTool {

    return this.current_SubTool
  }

  isSubToolAvailable(subToolID: SubToolID): boolean {

    const ctx = this.toolContext
    const subTool = this.getSubTool(subToolID)

    return subTool.isAvailable(ctx)
  }

  isCurrentSubToolAvailable(): boolean {

    return this.current_SubTool.isAvailable(this.toolContext)
  }

  setCurrentMainToolTabForEditMode(editModeID: EditModeID) {

    const mainTool = this.getCurrentMainTool()

    let mainToolTab;

    if (editModeID == EditModeID.drawMode) {

      mainToolTab = mainTool.drawMode_MainToolTab
    }
    else {

      mainToolTab = this.getCurrentMainToolEditTab()
    }

    if (mainToolTab == null || mainToolTab.disabled) {
      // グループレイヤーの場合、drawModeのたぶが無いためnullになります
      return
    }

    this.setCurrentMainToolTab(mainToolTab.tabID)

    this.setCurrentSubToolForCurrentTab()

    this.updateFooterMessage()
    this.toolContext.setRedrawHeaderWindow()
    this.toolContext.setRedrawMainWindowEditorWindow()
    this.toolContext.setRedrawRibbonUI()
  }

  setCurrentSubTool(subtoolID: SubToolID) {

    const subtool = this.getSubTool(subtoolID)

    this.cancelModalTool()

    this.current_SubTool = subtool

    this.activateCurrentTool()

    this.current_MainToolTab.current_SubTool = subtool

    this.docContext.subtoolID = subtool.subtoolID

    this.toolContext.setRedrawRibbonUI()
    this.toolContext.setRedrawMainWindowEditorWindow()
    this.updateFooterMessage()
  }

  setCurrentSubToolForCurrentTab() {

    this.setCurrentSubTool(this.current_MainToolTab.current_SubTool.subtoolID)
  }

  private getSubTool(subtoolID: SubToolID) {

    const subTool = this.subTools.find(tool => tool.subtoolID == subtoolID)

    if (!subTool) {
      throw new Error('ERROR 0004:Sub tool does not exists.')
    }

    return subTool;
  }

  private getCurrentMainToolEditTab(): MainToolTab {

    const tab = this.current_MainTool.mainToolTabs
      .find(tab => tab.type == MainToolTabTypeID.editingTool)

    return tab
  }

  setCurrentOperationUnitID(operationUnitID: OperationUnitID) {

    this.docContext.operationUnitID = operationUnitID
  }

  updateFooterMessage() {

    this.appView.footerWindow.setFooterText(this.current_SubTool.helpText)

    this.docContext.redrawFooterWindow = true
  }

  updateContextCurrentRefferences() {

    const viewKeyframe = this.appDrawing.currentViewKeyframe
    const currentLayer = this.docContext.currentLayer

    // TODO: なんのためにnullにしているのかわからない。要調査。
    this.docContext.currentVectorLine = null

    this.docContext.currentStrokeDrawable = null
    this.docContext.currentFillDrawable = null

    if (VectorLayer.isVectorLayer(currentLayer) && viewKeyframe != null) {

      const viewKeyframeLayer = ViewKeyframe.findViewKeyframeLayer(viewKeyframe, currentLayer)
      const geometry = viewKeyframeLayer.vectorLayerKeyframe.geometry

      this.docContext.currentVectorLayer = <VectorLayer>currentLayer
      this.docContext.currentVectorGeometry = geometry

      this.docContext.currentStrokeDrawable = this.docContext.currentVectorLayer
      this.docContext.currentFillDrawable = this.docContext.currentVectorLayer

      if (geometry.units.length > 0) {

        this.docContext.currentVectorGroup = geometry.units[0].groups[0]
      }
      else {

        this.docContext.currentVectorGroup = null
      }
    }
    else {

      this.docContext.currentVectorLayer = null
      this.docContext.currentVectorGeometry = null
      this.docContext.currentVectorGroup = null
    }

    if (PosingLayer.isPosingLayer(currentLayer)) {

      const posingLayer = <PosingLayer>currentLayer

      this.docContext.currentPosingLayer = posingLayer
      this.docContext.currentPosingData = posingLayer.posingData
      this.docContext.currentPosingModel = posingLayer.posingModel
    }
    else {

      this.docContext.currentPosingLayer = null
      this.docContext.currentPosingData = null
      this.docContext.currentPosingModel = null
    }

    if (AutoFillLayer.isAutoFillLayer(currentLayer)) {

      this.docContext.currentAutoFillLayer = <AutoFillLayer>currentLayer

      this.docContext.currentFillDrawable = this.docContext.currentAutoFillLayer
    }
    else {

      this.docContext.currentAutoFillLayer = null
    }

    if (ImageFileReferenceLayer.isImageFileReferenceLayer(currentLayer)) {

      const imageFileReferenceLayer = <ImageFileReferenceLayer>currentLayer

      this.docContext.currentImageFileReferenceLayer = imageFileReferenceLayer
    }
    else {

      this.docContext.currentImageFileReferenceLayer = null
    }

  }

  executeSubToolKeyDown(e: ToolKeyboardEvent): boolean {

    return this.current_SubTool.keydown(e, this.toolContext)
  }

  executeSubToolMouseDown(e: ToolPointerEvent) {

    this.current_SubTool.mouseDown(e, this.toolContext)
  }

  executeSubToolMouseUp(e: ToolPointerEvent) {

    this.current_SubTool.mouseUp(e, this.toolContext)
  }

  executeSubToolMouseMove(e: ToolPointerEvent) {

    this.current_SubTool.mouseMove(e, this.toolContext)
  }

   // Layer operation

  setCurrentLayer(layer: Layer) {

    if (this.docContext.currentLayer == null
      || layer == null
      || this.docContext.currentLayer != layer) {

      this.toolContext.setRedrawRibbonUI()
    }

    this.docContext.currentLayer = layer

    this.updateContextCurrentRefferences()

    this.appView.paletteSelectorWindow.setCurrentTargetForLayer(this.docContext)
  }

  selectLayer(layer: Layer) {

    this.deselectAllLayer()

    if (layer == null) {
      throw new Error('ERROR 005 cannot select null layer')
    }

    this.setCurrentLayer(layer)

    this.setLayerSelection(layer, true)

    const mainTool = this.getMainToolForLayer(layer)
    this.setCurrentMainTool(mainTool.mainToolID)

    this.toolContext.updateContext()

    this.setCurrentSubToolForCurrentTab()

    this.activateCurrentTool()
  }

  setLayerSelection(layer: Layer, isSelected: boolean) {

    layer.isSelected = isSelected
  }

  private deselectAllLayer() {

    for (const item of this.docContext.items) {

      item.layer.isSelected = false
      item.layer.isHierarchicalSelected = false
    }
  }

  setLayerVisiblity(layer: Layer, isVisible: boolean) {

    layer.isVisible = isVisible
  }

  activateCurrentTool() {

    if (this.current_SubTool != null) {

      this.docContext.needsDrawOperatorCursor = this.current_SubTool.isEditTool

      this.current_SubTool.onActivated(this.toolContext)
    }
  }

  setLayerCommandParameters(layerCommand: Command_Layer_CommandBase, currentLayerWindowItem: ViewLayerListItem, documentData: DocumentData) {

    // Collects layer items for command
    const currentLayer: Layer = currentLayerWindowItem.layer
    const currentLayerParent: Layer = currentLayerWindowItem.parentLayer

    let previousLayer: Layer = null
    let previousLayerParent: Layer = null
    if (GroupLayer.isGroupLayer(currentLayerWindowItem.layer)) {

      if (currentLayerWindowItem.previousSiblingItem != null) {

        previousLayer = currentLayerWindowItem.previousSiblingItem.layer
        previousLayerParent = currentLayerWindowItem.previousSiblingItem.parentLayer
      }
    }
    else {

      if (currentLayerWindowItem.previousItem != null) {

        previousLayer = currentLayerWindowItem.previousItem.layer
        previousLayerParent = currentLayerWindowItem.previousItem.parentLayer
      }
    }

    let nextLayer: Layer = null
    let nextLayerParent: Layer = null
    if (GroupLayer.isGroupLayer(currentLayerWindowItem.layer)) {

      if (currentLayerWindowItem.nextSiblingItem != null) {

        nextLayer = currentLayerWindowItem.nextSiblingItem.layer
        nextLayerParent = currentLayerWindowItem.nextSiblingItem.parentLayer
      }
    }
    else {

      if (currentLayerWindowItem.nextItem != null) {

        nextLayer = currentLayerWindowItem.nextItem.layer
        nextLayerParent = currentLayerWindowItem.nextItem.parentLayer
      }
    }

    layerCommand.setPrameters(
      documentData
      , currentLayer
      , currentLayerParent
      , previousLayer
      , previousLayerParent
      , nextLayer
      , nextLayerParent
    )
  }

  selectNextOrPreviousLayer(selectNext: boolean) {

    const item = this.appView.viewLayerList.findItemForLayer(this.docContext, this.docContext.currentLayer)

    if (selectNext) {

      if (item.nextItem != null) {

        this.selectLayer(item.nextItem.layer)
      }
    }
    else {

      if (item.previousItem != null) {

        this.selectLayer(item.previousItem.layer)
      }
    }
  }

  // Modal tool

  startModalTool(subtoolID: SubToolID) {

    const modalTool = <ModalToolBase>this.getSubTool(subtoolID)

    const available = modalTool.prepareModal(this.appView.mainWindow.pointerEvent, this.toolContext)

    if (!available) {

      console.debug('Can\'t start modal tool.')
      return
    }

    modalTool.startModal(this.toolContext)

    this.modalBeforeTool = this.current_SubTool
    this.current_ModalTool = modalTool
    this.current_SubTool = modalTool
  }

  endModalTool() {

    this.toolContext.updateContext()
    this.current_ModalTool.endModal(this.toolContext)

    this.setModalToolBefore()

    this.activateCurrentTool()

    this.toolContext.setRedrawMainWindowEditorWindow()
  }

  cancelModalTool() {

    if (!this.isModalToolRunning()) {

      return
    }

    this.toolContext.updateContext()
    this.current_ModalTool.cancelModal(this.toolContext)

    this.setModalToolBefore()

    this.activateCurrentTool()
  }

  setModalToolBefore() {

    this.current_SubTool = this.modalBeforeTool
    this.current_ModalTool = null
    this.modalBeforeTool = null
  }

  isModalToolRunning(): boolean {

    return (this.current_ModalTool != null)
  }

  // Keyframe

  setCurrentFrame(frame: int, skipCollectDrawPaths = false) {

    const aniSetting = this.docContext.document.animationSettingData
    const viewKeyframes = this.docContext.keyframes

    aniSetting.currentTimeFrame = frame

    // Find current keyframe for frame

    if (aniSetting.currentTimeFrame < 0) {

      aniSetting.currentTimeFrame = 0
    }

    if (aniSetting.currentTimeFrame > aniSetting.maxFrame) {

      aniSetting.currentTimeFrame = aniSetting.maxFrame
    }

    const keyframeIndex = ViewKeyframe.findViewKeyframeIndex(viewKeyframes, aniSetting.currentTimeFrame)

    if (keyframeIndex != -1) {

      this.appDrawing.currentViewKeyframe = viewKeyframes[keyframeIndex]

      if (keyframeIndex - 1 >= 0) {

        this.appDrawing.previousKeyframe = viewKeyframes[keyframeIndex - 1]
      }
      else {

        this.appDrawing.previousKeyframe = null
      }

      if (keyframeIndex + 1 < viewKeyframes.length) {

        this.appDrawing.nextKeyframe = viewKeyframes[keyframeIndex + 1]
      }
      else {

        this.appDrawing.nextKeyframe = null
      }
    }

    // Update tool context

    this.updateContextCurrentRefferences()

    if (!skipCollectDrawPaths) {

      this.appDrawing.collectDrawPaths(this.docContext.document)
    }
  }
}
