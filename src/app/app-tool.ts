import { App_Drawing } from './app-drawing'
import { App_View } from './app-view'
import { Command_Layer_CommandBase } from './commands'
import { DocumentContext, SubToolContext, SubToolContext_AppTool_Interface } from './context'
import {
  AutoFillLayer, DocumentData, ImageFileReferenceLayer, Layer, LayerTypeID, PosingLayer,
  VectorLayer
} from './document-data'
import { DrawPathContext } from './document-drawing'
import { HitTest_VectorStroke_IsCloseToMouse, LayerLogic } from './document-logic'
import { float, int, RectangleArea } from './common-logics'
import {
  BrushParameter, BrushParameterID, BrushTypeID, EditModeID, MainTool, MainToolCommonTabSet, MainToolID, MainToolTab, MainToolTabID,
  MainToolTabTypeID, ModalToolBase, OperationOriginTypeID, OperationUnitID, PointerParameter, PointerParameterID, PointerTypeID, SubTool, SubToolID, SubToolParameter,
  SubToolParameterID, ToolPointerEvent, Tool_None
} from './tool'
import {
  MainTool_AutoFillLayer, MainTool_GroupLayer, MainTool_ImageFileReferenceLayer, MainTool_Poing3DLayer,
  MainTool_PointBrushFillLayer,
  MainTool_VectorLayer
} from './tools-main'
import { MainToolTab_Document, MainToolTab_Edit, MainToolTab_EditDisabled, MainToolTab_Layer } from './tools-main-tab'
import { MainToolTab_View } from './tools-main-tab/view'
import {
  Tool_AddAutoFillPoint, Tool_DeleteAutoFillPoint, Tool_DeletePoints_DivideLine, Tool_DrawLine, Tool_DrawPointBrush, Tool_EditDocumentFrame,
  Tool_EditModeMain, Tool_HideLinePoint_BrushSelect as Tool_EditLinePointWidth_BrushSelect, Tool_LocateOperatorCursor, Tool_NoOperation, Tool_OverWriteLineWidth,
  Tool_Posing3d_LocateBody, Tool_Posing3d_LocateHead, Tool_Posing3d_LocateHips, Tool_Posing3d_LocateLeftArm1,
  Tool_Posing3d_LocateLeftArm2, Tool_Posing3d_LocateLeftLeg1, Tool_Posing3d_LocateLeftLeg2, Tool_Posing3d_LocateLeftShoulder,
  Tool_Posing3d_LocateRightArm1, Tool_Posing3d_LocateRightArm2, Tool_Posing3d_LocateRightLeg1, Tool_Posing3d_LocateRightLeg2,
  Tool_Posing3d_LocateRightShoulder, Tool_Posing3d_RotateHead, Tool_Posing3d_ToolBase, Tool_Resample_Segment, Tool_ScratchLine, Tool_ScratchLineDraw,
  Tool_ScratchLineWidth, Tool_Select_All_LinePoint, Tool_Select_BrushSelect,
  Tool_Transform_Lattice_GrabMove, Tool_Transform_Lattice_Rotate,
  Tool_Transform_Lattice_Scale, Tool_Transform_ReferenceImage_GrabMove, Tool_Transform_ReferenceImage_Rotate,
  Tool_Transform_ReferenceImage_Scale
} from './tools-sub'
import { RibbonUIControlID } from './ui'
import { ShortcutCommandID } from './user-setting'
import { ViewKeyframe, ViewKeyframeLayer, ViewLayerListItem } from './view'

export class App_Tool implements SubToolContext_AppTool_Interface {

  // SubTools

  tool_None = new Tool_None()

  subTools: SubTool[] = []
  modalSubTools: ModalToolBase[] = []
  posing3dSubTools: SubTool[] = []

  tool_NoOperation = new Tool_NoOperation()

  tool_DrawLine = new Tool_DrawLine()
  tool_ScratchLine = new Tool_ScratchLine()
  tool_ExtrudeLine = new Tool_ScratchLineDraw()
  tool_OverWriteLineWidth = new Tool_OverWriteLineWidth()
  tool_ScratchLineWidth = new Tool_ScratchLineWidth()
  tool_DeletePoints_DivideLine = new Tool_DeletePoints_DivideLine()
  tool_EditLinePointWidth_BrushSelect = new Tool_EditLinePointWidth_BrushSelect()
  tool_DrawPointBrush = new Tool_DrawPointBrush()
  tool_PointBrush_ExtrudeLine = new Tool_ScratchLineDraw()

  tool_AddAutoFillPoint = new Tool_AddAutoFillPoint()
  tool_DeleteAutoFillPoint = new Tool_DeleteAutoFillPoint()

  tool_EditModeMain = new Tool_EditModeMain()
  tool_LocateOperatorCursor = new Tool_LocateOperatorCursor()
  tool_BrushSelect = new Tool_Select_BrushSelect()
  tool_ResampleSegment = new Tool_Resample_Segment()

  tool_Transform_Lattice_GrabMove = new Tool_Transform_Lattice_GrabMove()
  tool_Transform_Lattice_Rotate = new Tool_Transform_Lattice_Rotate()
  tool_Transform_Lattice_Scale = new Tool_Transform_Lattice_Scale()

  tool_EditDocumentFrame = new Tool_EditDocumentFrame()

  tool_Transform_ReferenceImage_GrabMove = new Tool_Transform_ReferenceImage_GrabMove()
  tool_Transform_ReferenceImage_Rotate = new Tool_Transform_ReferenceImage_Rotate()
  tool_Transform_ReferenceImage_Scale = new Tool_Transform_ReferenceImage_Scale()

  tool_SelectAllPoints = new Tool_Select_All_LinePoint()
  hittest_Line_IsCloseTo = new HitTest_VectorStroke_IsCloseToMouse()

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

  // Tool parameters

  pointerParameters: PointerParameter[] = [
    { parameterID: PointerParameterID.none, baseSize: 0.0, minSize: 0.0 },
    { parameterID: PointerParameterID.extrudeLine, baseSize: 20.0, minSize: 1.0 },
    { parameterID: PointerParameterID.eracer, baseSize: 20.0, minSize: 1.0 },
    { parameterID: PointerParameterID.scratchLine, baseSize: 25.0, minSize: 1.0 },
    { parameterID: PointerParameterID.setLineWidth, baseSize: 20.0, minSize: 1.0 },
    { parameterID: PointerParameterID.brushSelect, baseSize: 20.0, minSize: 1.0 },
  ]

  brushParameters: BrushParameter[] = [
    { parameterID: BrushParameterID.none, brushType: BrushTypeID.none, baseSize: 0.0, minSize: 0.0, stepRate: 1.0 },
    { parameterID: BrushParameterID.solidStroke, brushType: BrushTypeID.solidBrushStroke, baseSize: 1.0, minSize: 1.0, stepRate: 1.0 },
    { parameterID: BrushParameterID.pointBrush, brushType: BrushTypeID.radialBrush, baseSize: 25.0, minSize: 1.0, stepRate: 0.25 },
  ]

  subToolParameters: SubToolParameter[] = [
    { parameterID: SubToolParameterID.none, pointerType: PointerTypeID.none, pointerParameterID: PointerParameterID.none, brushParameterID: BrushParameterID.none },
    { parameterID: SubToolParameterID.drawLine, pointerType: PointerTypeID.brush, pointerParameterID: PointerParameterID.none, brushParameterID: BrushParameterID.solidStroke },
    { parameterID: SubToolParameterID.extrudeLine, pointerType: PointerTypeID.brushWithCircularRange, pointerParameterID: PointerParameterID.extrudeLine, brushParameterID: BrushParameterID.solidStroke },
    { parameterID: SubToolParameterID.eracer, pointerType: PointerTypeID.circularRange, pointerParameterID: PointerParameterID.eracer, brushParameterID: BrushParameterID.none },
    { parameterID: SubToolParameterID.scratchLine, pointerType: PointerTypeID.circularRange, pointerParameterID: PointerParameterID.extrudeLine, brushParameterID: BrushParameterID.none },
    { parameterID: SubToolParameterID.setLineWidth, pointerType: PointerTypeID.circularRange, pointerParameterID: PointerParameterID.extrudeLine, brushParameterID: BrushParameterID.none },
    { parameterID: SubToolParameterID.scratchLineWidth, pointerType: PointerTypeID.circularRange, pointerParameterID: PointerParameterID.extrudeLine, brushParameterID: BrushParameterID.none },
    { parameterID: SubToolParameterID.brushSelect, pointerType: PointerTypeID.circularRange, pointerParameterID: PointerParameterID.extrudeLine, brushParameterID: BrushParameterID.none },
    { parameterID: SubToolParameterID.drawPointBrush, pointerType: PointerTypeID.brush, pointerParameterID: PointerParameterID.none, brushParameterID: BrushParameterID.pointBrush },
    { parameterID: SubToolParameterID.pointBrush_extrudeLine, pointerType: PointerTypeID.brushWithCircularRange, pointerParameterID: PointerParameterID.extrudeLine, brushParameterID: BrushParameterID.pointBrush },
  ]

  // Tool state
  private mainTools: MainTool[] = []
  private current_MainTool: MainTool = null
  private current_MainToolTab: MainToolTab = null
  private current_SubTool: SubTool = null
  private current_ModalTool: ModalToolBase = null
  private modalBeforeTool: SubTool = null

  private appView: App_View = null
  private appDrawing: App_Drawing = null

  private docContext: DocumentContext = null
  private subToolContext: SubToolContext = null

  private baseColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0)

  link(appView: App_View, appDrawing: App_Drawing) {

    this.appView = appView
    this.appDrawing = appDrawing
  }

  linkContexts(docContext: DocumentContext, toolContext: SubToolContext) {

    this.docContext = docContext
    this.subToolContext = toolContext
  }

  // Initializing

  initializeTools() {

    // Resoures
    this.appDrawing.posing3DView.storeResources(this.appView.modelFile, this.appView.imageResurces)

    // Constructs main tools and sub tools structure
    const commonTabs = new MainToolCommonTabSet()
    commonTabs.edit = new MainToolTab_Edit()
    commonTabs.edit_disabled = new MainToolTab_EditDisabled()
    commonTabs.document = new MainToolTab_Document()
    commonTabs.layer = new MainToolTab_Layer()
    commonTabs.view = new MainToolTab_View()

    this.addMainTool(new MainTool_GroupLayer(commonTabs))
    this.addMainTool(new MainTool_VectorLayer(commonTabs))
    this.addMainTool(new MainTool_ImageFileReferenceLayer(commonTabs))
    this.addMainTool(new MainTool_AutoFillLayer(commonTabs))
    this.addMainTool(new MainTool_Poing3DLayer(commonTabs))
    this.addMainTool(new MainTool_PointBrushFillLayer(commonTabs))

    this.addSubTool(this.tool_NoOperation, SubToolID.noOperation, SubToolParameterID.none)

    this.addModalSubTool(this.tool_DrawLine, SubToolID.drawLine, SubToolParameterID.drawLine)
    this.addModalSubTool(this.tool_ScratchLine, SubToolID.scratchLine, SubToolParameterID.scratchLine)
    this.addModalSubTool(this.tool_ExtrudeLine, SubToolID.extrudeLine, SubToolParameterID.extrudeLine)
    this.addModalSubTool(this.tool_OverWriteLineWidth, SubToolID.overWriteLineWidth, SubToolParameterID.setLineWidth)
    this.addModalSubTool(this.tool_ScratchLineWidth, SubToolID.scratchLineWidth, SubToolParameterID.scratchLineWidth)
    this.addModalSubTool(this.tool_DeletePoints_DivideLine, SubToolID.deletePointBrush, SubToolParameterID.eracer)
    this.addModalSubTool(this.tool_EditLinePointWidth_BrushSelect, SubToolID.editLinePointWidth_BrushSelect, SubToolParameterID.brushSelect)
    this.addModalSubTool(this.tool_DrawPointBrush, SubToolID.drawPointBrush, SubToolParameterID.drawPointBrush)
    this.addModalSubTool(this.tool_PointBrush_ExtrudeLine, SubToolID.pointBrush_extrudeLine, SubToolParameterID.pointBrush_extrudeLine)

    this.addSubTool(this.tool_AddAutoFillPoint, SubToolID.addAutoFillPoint, SubToolParameterID.brushSelect)
    this.addSubTool(this.tool_DeleteAutoFillPoint, SubToolID.deleteAutoFillPoint, SubToolParameterID.brushSelect)

    this.addModalSubTool(this.tool_EditModeMain, SubToolID.editModeMain, SubToolParameterID.brushSelect)
    this.addSubTool(this.tool_LocateOperatorCursor, SubToolID.locateOperatorCursor)
    this.addModalSubTool(this.tool_BrushSelect, SubToolID.brushSelect, SubToolParameterID.brushSelect)
    this.addSubTool(this.tool_ResampleSegment, SubToolID.resampleSegment, SubToolParameterID.brushSelect)

    this.addModalSubTool(this.tool_Transform_Lattice_GrabMove, SubToolID.edit_GrabMove)
    this.addModalSubTool(this.tool_Transform_Lattice_Rotate, SubToolID.edit_Rotate)
    this.addModalSubTool(this.tool_Transform_Lattice_Scale, SubToolID.edit_Scale)

    this.addModalSubTool(this.tool_EditDocumentFrame, SubToolID.editDocumentFrame)

    this.addModalSubTool(this.tool_Transform_ReferenceImage_GrabMove, SubToolID.image_GrabMove)
    this.addModalSubTool(this.tool_Transform_ReferenceImage_Rotate, SubToolID.image_Rotate)
    this.addModalSubTool(this.tool_Transform_ReferenceImage_Scale, SubToolID.image_Scale)

    this.addModalSubTool(this.tool_Posing3d_LocateHead, SubToolID.p3d_locateHead)

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

    this.updateSubToolParameterReferences()

    this.current_MainTool = this.getMainTool(MainToolID.vector)
    this.current_MainToolTab = this.current_MainTool.mainToolTabs[0]
    this.current_MainToolTab.current_SubTool = this.getSubTool(this.current_MainToolTab.default_SubToolID)
    this.current_SubTool = this.current_MainToolTab.current_SubTool
  }

  private addMainTool(tool: MainTool) {

    tool.drawMode_MainToolTab = tool.mainToolTabs[0]
    this.mainTools.push(tool)
  }

  private addSubTool(tool: SubTool, subtoolID: SubToolID, parameterID?: SubToolParameterID) {

    tool.subtoolID = subtoolID
    tool.subToolParameterID = parameterID ?? SubToolParameterID.none

    this.subTools.push(tool)
  }

  private addModalSubTool(tool: ModalToolBase, subtoolID: SubToolID, parameterID?: SubToolParameterID) {

    this.addSubTool(tool, subtoolID, parameterID)

    this.modalSubTools.push(tool)
  }

  private addPosing3DSubTool(tool: Tool_Posing3d_ToolBase, subtoolID: SubToolID, toolBarImageIndex: int) {

    this.addModalSubTool(tool, subtoolID)

    tool.toolBarImage = this.appView.subToolImages[0]
    tool.toolBarImageIndex = toolBarImageIndex

    this.posing3dSubTools.push(tool)
  }

  updateBrushParameterReferences() {

    if (this.docContext != null) {

      this.docContext.currentBrushParameter = this.brushParameters[0]
    }
  }

  updateSubToolParameterReferences() {

    for (const subToolParameter of this.subToolParameters) {

      const pointerParameter = this.pointerParameters.find(param => param.parameterID == subToolParameter.pointerParameterID)
      subToolParameter.pointer = pointerParameter ?? null

      const brushParameter = this.brushParameters.find(param => param.parameterID == subToolParameter.brushParameterID)
      subToolParameter.brush = brushParameter ?? null
    }

    for (const subTool of this.subTools) {

      if (subTool.subToolParameterID != SubToolParameterID.none) {

        const subToolParameter = this.subToolParameters.find(param => param.parameterID == subTool.subToolParameterID)

        if (subToolParameter) {

          subTool.subToolParameter = subToolParameter
        }
      }
    }
  }

  // MainTool

  changeCurrentMainToolForEditMode(editModeID: EditModeID) {

    const mainTool = this.getCurrentMainTool()

    let mainToolTab: MainToolTab;

    if (editModeID == EditModeID.drawMode) {

      mainToolTab = mainTool.drawMode_MainToolTab
    }
    else {

      mainToolTab = this.getCurrentMainToolEditTab()
    }

    if (mainToolTab == null || mainToolTab.disabled) {
      // グループレイヤーの場合、drawModeのタブが無いためnullになります
      return
    }

    this.changeCurrentMainToolTab(mainToolTab.tabID)

    this.setCurrentSubToolForCurrentTab()
  }

  executeMainToolKeyDown(key: string, commandID: ShortcutCommandID): boolean {

    return this.current_MainToolTab.keydown(key, commandID, this.subToolContext)
  }

  executeMainToolButtonClick(id: RibbonUIControlID): boolean {

    return this.current_MainToolTab.buttonClick(id, this.subToolContext)
  }

  private getCurrentMainTool(): MainTool {

    return this.current_MainTool
  }

  private getMainTool(mainToolID: MainToolID): MainTool {

    return this.mainTools.find(tool => tool.mainToolID == mainToolID)
  }

  private getMainToolForLayer(layer: Layer): MainTool {

    let mainToolID = MainToolID.none

    switch(layer.type) {

      case LayerTypeID.groupLayer:
        mainToolID = MainToolID.group
        break

      case LayerTypeID.autoFillLayer:
        mainToolID = MainToolID.autoFill
        break

      case LayerTypeID.vectorLayer:
      case LayerTypeID.surroundingFillLayer:
        mainToolID = MainToolID.vector
        break

      case LayerTypeID.pointBrushFillLayer:
        mainToolID = MainToolID.pointBrushFill
        break

      case LayerTypeID.imageFileReferenceLayer:
        mainToolID = MainToolID.imageFileReference
        break

      case LayerTypeID.posingLayer:
        mainToolID = MainToolID.posing3D
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

    if (mainTool.mainToolID == MainToolID.posing3D) {

      this.appView.subToolWindow.collectViewItems(this.posing3dSubTools, this.subToolContext)
    }

    if (isChanged) {

      this.setCurrentMainToolTabForCurrentMainTool()

      this.setCurrentSubToolForCurrentTab()

      this.activateCurrentTool()

      this.subToolContext.setRedrawWindowsForCurrentToolChanging()
      this.updateFooterMessage()
    }
  }

  // MainToolTab

  changeCurrentMainToolTab(tabID: MainToolTabID) {

    this.setCurrentMainToolTab(tabID)

    this.setCurrentSubToolForCurrentTab()
  }

  private setCurrentMainToolTabForCurrentMainTool() {

    const mainToolTab = this.findMainToolTab(this.docContext.mainToolTabID)

    if (mainToolTab) {

      this.setCurrentMainToolTab(mainToolTab.tabID)
    }
    else {

      const mainTool = this.getCurrentMainTool()
      this.setCurrentMainToolTab(mainTool.mainToolTabs[0].tabID)
    }
  }

  private setCurrentMainToolTab(tabID: MainToolTabID) {

    const mainToolTab = this.findMainToolTab(tabID)

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

    if (this.subToolContext.isDrawMode()) {

      const mainTool = this.getCurrentMainTool()
      mainTool.drawMode_MainToolTab = this.current_MainToolTab
    }
  }

  private findMainToolTab(tabID: MainToolTabID): MainToolTab {

    const tab = this.current_MainTool.mainToolTabs
      .find(tab => tab.tabID == tabID)

    return tab
  }

  // SubTool

  getCurrentSubTool(): SubTool {

    return this.current_SubTool
  }

  isSubToolAvailable(subToolID: SubToolID): boolean {

    const ctx = this.subToolContext
    const subTool = this.getSubTool(subToolID)

    return subTool.isAvailable(ctx)
  }

  isCurrentSubToolAvailable(): boolean {

    return this.current_SubTool.isAvailable(this.subToolContext)
  }

  changeCurrentSubToolForSubtoolID(subToolID: SubToolID) { // @implements SubToolContext_AppTool_Interface

    this.setCurrentSubTool(subToolID)

    this.activateCurrentTool()

    this.getCurrentSubTool().toolWindowItemClick(this.subToolContext)
  }

  private setCurrentSubTool(subtoolID: SubToolID) {

    const subtool = this.getSubTool(subtoolID)

    this.cancelModalTool()

    this.current_SubTool = subtool

    this.current_MainToolTab.current_SubTool = subtool

    this.docContext.subtoolID = subtool.subtoolID
    this.docContext.currentSubToolParameter = (this.current_SubTool.subToolParameter ?? null)
    this.docContext.currentBrushParameter = (this.current_SubTool.subToolParameter?.brush ?? null)
    this.docContext.currentPointerParameter = (this.current_SubTool.subToolParameter?.pointer ?? null)

    this.subToolContext.updateContext()
    this.activateCurrentTool()

    this.subToolContext.setRedrawWindowsForCurrentToolChanging()
    this.updateFooterMessage()
  }

  private setCurrentSubToolForCurrentTab() {

    this.setCurrentSubTool(this.current_MainToolTab.current_SubTool.subtoolID)
  }

  private getSubTool(subtoolID: SubToolID): SubTool {

    const subTool = this.subTools.find(tool => tool.subtoolID == subtoolID)

    if (!subTool) {
      throw new Error('ERROR 0004:Sub tool does not exists.')
    }

    return subTool;
  }

  private getModalSubTool(subtoolID: SubToolID): ModalToolBase {

    const subTool = this.modalSubTools.find(tool => tool.subtoolID == subtoolID)

    if (!subTool) {
      throw new Error('ERROR 0004:Modal sub tool does not exists.')
    }

    return subTool;
  }

  private getCurrentMainToolEditTab(): MainToolTab {

    const tab = this.current_MainTool.mainToolTabs
      .find(tab => tab.type == MainToolTabTypeID.editingTool)

    return tab
  }

  updateFooterMessage() {

    this.appView.footerWindow.setFooterText(this.current_SubTool.helpText)

    this.docContext.redrawFooterWindow = true
  }

  updateContextCurrentRefferences() {

    const viewKeyframe = this.docContext.currentViewKeyframe
    const currentLayer = this.docContext.currentLayer

    this.docContext.currentStrokeDrawable = null
    this.docContext.currentFillDrawable = null

    this.docContext.currentVectorLayer = null
    this.docContext.currentVectorLayerKeyframe = null
    this.docContext.currentVectorLayerGeometry = null

    if (VectorLayer.isVectorLayer(currentLayer) && viewKeyframe != null) {

      const viewKeyframeLayer = ViewKeyframe.findViewKeyframeLayer(viewKeyframe, currentLayer)
      const geometry = viewKeyframeLayer.vectorLayerKeyframe.geometry

      this.docContext.currentVectorLayer = <VectorLayer>currentLayer
      this.docContext.currentVectorLayerKeyframe = viewKeyframeLayer.vectorLayerKeyframe
      this.docContext.currentVectorLayerGeometry = geometry

      this.docContext.currentStrokeDrawable = this.docContext.currentVectorLayer
      this.docContext.currentFillDrawable = this.docContext.currentVectorLayer
    }

    this.docContext.currentPosingLayer = null
    this.docContext.currentPosingData = null
    this.docContext.currentPosingModel = null
    if (PosingLayer.isPosingLayer(currentLayer)) {

      const posingLayer = <PosingLayer>currentLayer

      this.docContext.currentPosingLayer = posingLayer
      this.docContext.currentPosingData = posingLayer.posingData
      this.docContext.currentPosingModel = posingLayer.posingModel
    }

    this.docContext.currentAutoFillLayer = null
    if (AutoFillLayer.isAutoFillLayer(currentLayer) && viewKeyframe != null) {

      this.docContext.currentAutoFillLayer = <AutoFillLayer>currentLayer
      this.docContext.currentFillDrawable = this.docContext.currentAutoFillLayer
    }

    this.docContext.currentImageFileReferenceLayer = null
    if (ImageFileReferenceLayer.isImageFileReferenceLayer(currentLayer)) {

      const imageFileReferenceLayer = <ImageFileReferenceLayer>currentLayer

      this.docContext.currentImageFileReferenceLayer = imageFileReferenceLayer
    }

    this.updateCurrentPaintParameters()
    this.updateActiveRefferences()
  }

  updateActiveRefferences() {

    const viewKeyframe = this.docContext.currentViewKeyframe
    const currentLayer = this.docContext.currentLayer

    if (VectorLayer.isVectorLayer(currentLayer) && viewKeyframe != null) {

      const viewKeyframeLayer = ViewKeyframe.findViewKeyframeLayer(viewKeyframe, currentLayer)
      const geometry = viewKeyframeLayer.vectorLayerKeyframe.geometry
      const lastGroup = geometry.units.at(-1)?.groups.at(-1) ?? null

      if (VectorLayer.isSingleGroupVectorLayer(currentLayer)) {

        this.docContext.activeVectorGeometry = geometry
        this.docContext.activeVectorGroup = lastGroup
      }
    }
  }

  updateCurrentPaintParameters() {

    if (this.docContext.currentVectorLayer != null) {

      this.appDrawing.drawingVectorLayer.getStrokeColor(
        this.baseColor,
        this.docContext.currentVectorLayer,
        this.docContext.documentData,
        false,
        false
      )

      vec4.copy(this.docContext.currentPaintParameter.baseColor, this.baseColor)
    }
    else {

      vec4.set(this.docContext.currentPaintParameter.baseColor, 0.0, 0.0, 0.0, 1.0)
    }
  }

  executeSubToolKeyDown(key: string, commandID: ShortcutCommandID): boolean {

    return this.current_SubTool.keydown(key, commandID, this.subToolContext)
  }

  executeSubToolMouseDown(e: ToolPointerEvent) {

    this.current_SubTool.mouseDown(e, this.subToolContext)
  }

  executeSubToolMouseMove(e: ToolPointerEvent) {

    this.current_SubTool.mouseMove(e, this.subToolContext)
  }

  executeSubToolMouseUp(e: ToolPointerEvent) {

    this.current_SubTool.mouseUp(e, this.subToolContext)
  }

  executeUndo() {

    this.docContext.commandHistory.undo(this.subToolContext)
  }

  executeRedo() {

    this.docContext.commandHistory.redo(this.subToolContext)
  }

   // Layer operation

  selectLayer(layer: Layer, toggleSelection = false, deselectLayer = true) {

    if (layer == null) {
      throw new Error('ERROR 0005 cannot select null layer')
    }

    const isSelected = (toggleSelection ? !layer.isSelected : true)

    if (deselectLayer) {

      this.deselectAllLayer()
    }

    this.setCurrentLayer(layer)

    this.setLayerSelection(layer, isSelected)

    LayerLogic.updateHierarchicalSelectRecursive(layer)

    const mainTool = this.getMainToolForLayer(layer)
    this.setCurrentMainTool(mainTool.mainToolID)
  }

  activateCurrentTool() {

    if (this.current_SubTool == null) {
      return
    }

    this.docContext.needsDrawOperatorCursor = (this.current_SubTool.isEditTool || this.current_SubTool.usesOperatorCursor)

    this.current_SubTool.onActivated(this.subToolContext)
  }

  setLayerCommandParameters(layerCommand: Command_Layer_CommandBase, currentLayerWindowItem: ViewLayerListItem, documentData: DocumentData) {

    // Collects layer items for command
    const currentLayer: Layer = currentLayerWindowItem.layer
    const currentLayerParent: Layer = currentLayerWindowItem.parentLayer

    let previousLayer: Layer = null
    let previousLayerParent: Layer = null
    if (currentLayerWindowItem.previousItem != null) {

      previousLayer = currentLayerWindowItem.previousItem.layer
      previousLayerParent = currentLayerWindowItem.previousItem.parentLayer
    }

    let nextLayer: Layer = null
    let nextLayerParent: Layer = null
    // To prevent insert the layer to own child layer, check if next layer is sibling
    if (currentLayerWindowItem.nextSiblingItem != null) {

      nextLayer = currentLayerWindowItem.nextSiblingItem.layer
      nextLayerParent = currentLayerWindowItem.nextSiblingItem.parentLayer
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

  setLayerSelection(layer: Layer, isSelected: boolean) {

    layer.isSelected = isSelected
  }

  setLayerVisiblity(layer: Layer, isVisible: boolean) {

    layer.isVisible = isVisible
  }

  private setCurrentLayer(layer: Layer) {

    if (this.docContext.currentLayer == null
      || layer == null
      || this.docContext.currentLayer != layer) {

      this.subToolContext.setRedrawWindowsForCurrentLayerChanging()
    }

    this.docContext.currentLayer = layer

    this.subToolContext.unsetAcrtiveVectorStrokeAndGroup()

    this.updateContextCurrentRefferences()

    this.appView.paletteSelectorWindow.setCurrentTargetForLayer(this.docContext)
  }

  private deselectAllLayer() {

    this.deselectAllLayerRecursive(this.docContext.documentData.rootLayer)
  }

  private deselectAllLayerRecursive(layer: Layer) {

    layer.isSelected = false

    for (const childLayer of layer.childLayers) {

      this.deselectAllLayerRecursive(childLayer)
    }
  }

  // Common settings for all tools

  setOperationUnit(operationUnitID: OperationUnitID) {

    this.docContext.operationUnitID = operationUnitID
  }

  setOperationOriginType(operationOriginTypeID: OperationOriginTypeID) {

    this.docContext.operationOriginTypeID = operationOriginTypeID
  }

  updateOperationOriginByRectangleArea(rectangleArea: RectangleArea) { // @implements SubToolContext_AppTool_Interface

    if (this.docContext.operationOriginTypeID == OperationOriginTypeID.medianCenter) {

      this.docContext.operationOriginLocation[0] = rectangleArea.getMedianHrizontalPosition()
      this.docContext.operationOriginLocation[1] = rectangleArea.getMedianVerticalPosition()
    }
  }

  updateOperationOriginByPoints(points: { location: Vec3 }[]) { // @implements SubToolContext_AppTool_Interface

    if (this.docContext.operationOriginTypeID == OperationOriginTypeID.medianCenter
      && points.length > 0
    ) {

      let medianX = 0.0
      let medianY = 0.0
      for (const point of points) {

        medianX += point.location[0]
        medianY += point.location[1]
      }

      medianX /= points.length
      medianY /= points.length

      // this.docContext.operatorCursor.location[0] = medianX
      // this.docContext.operatorCursor.location[1] = medianY
      this.docContext.operationOriginLocation[0] = medianX
      this.docContext.operationOriginLocation[1] = medianY
    }
  }

  // Modal tool

  startModalTool(subtoolID: SubToolID) { // @implements SubToolContext_AppTool_Interface

    const modalTool = this.getModalSubTool(subtoolID)
    const toolPointerEvent = this.appView.tooPointerEvent.attach(this.appView.mainWindow)

    const available = modalTool.prepareModal(toolPointerEvent, this.subToolContext)

    if (!available) {

      console.debug('Can\'t start modal tool.')
      return
    }

    modalTool.startModal(this.subToolContext)

    this.modalBeforeTool = this.current_SubTool
    this.current_ModalTool = modalTool
    this.current_SubTool = modalTool
  }

  endModalTool() {

    if (!this.isModalToolRunning()) {
      return
    }

    this.subToolContext.updateContext()
    this.current_ModalTool.endModal(this.subToolContext)

    this.setModalToolBefore()

    this.activateCurrentTool()

    this.subToolContext.setRedrawMainWindowEditorWindow()
  }

  cancelModalTool() {

    if (!this.isModalToolRunning()) {

      return
    }

    this.subToolContext.updateContext()
    this.current_ModalTool.cancelModal(this.subToolContext)

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

  // Editing

  executeToggleSelection(): boolean { // @implements SubToolContext_AppTool_Interface

    const chenged = this.tool_SelectAllPoints.executeToggleSelection(this.subToolContext)
    this.activateCurrentTool()
    return chenged
  }

  executeClearSelection(): boolean { // @implements SubToolContext_AppTool_Interface

    const chenged = this.tool_SelectAllPoints.executeClearSelectAll(this.subToolContext)
    this.activateCurrentTool()
    return chenged
  }

  visualHittestToStrokes(location: Vec3, minDistance: float): boolean { // @implements SubToolContext_AppTool_Interface

    if (this.subToolContext.currentVectorLayer == null
    || this.subToolContext.currentVectorLayerGeometry == null) {

      return false
    }

    this.hittest_Line_IsCloseTo.startProcess()

    this.hittest_Line_IsCloseTo.processGeometry(
      this.subToolContext.currentVectorLayer,
      this.subToolContext.currentVectorLayerGeometry,
      location,
      minDistance
    )

    this.hittest_Line_IsCloseTo.endProcess()

    return this.hittest_Line_IsCloseTo.isChanged
  }
}
