import { App_Document } from '../app/document'
import { float, int, Strings } from './logics/conversion'
import { Layer, PaletteColor } from './document_data'
import { EditModeID } from './tool/constants'
import { SubToolContext } from './context/subtool_context'
import { Command_DeleteSelectedPoints } from './commands/delete_points'
import { LayoutLogic, RectangleLayoutArea } from './logics/layout'
import { CanvasWindow } from './render/render2d'
import { UI_CommandButtonsItem } from './ui/command_buttons'
import { UI_FooterOperationPanel_ID } from './ui/footer_operation_panel'
import { UI_SelectBoxOption } from './ui/selectbox'
import { ViewOperationMode } from './view/view_operation'
import { OperationPanelButtonID } from './editor/operation_panel'
import { PaletteSelectorWindowButtonID } from './window/palette_selector_window'
import { SubToolViewItem } from './window/subtool_window'
import { MainCommandButtonID, RibbonUIControlID } from './window/constants'
import { ViewLayerListItem } from './view/view_layer_list'
import { LayerWindowButtonID } from './window/layer_window'
import { App_Drawing } from './drawing'
import { App_View } from './view'
import { App_Tool } from './tool'
import { UserSettingLogic } from './preferences/user_setting'
import { DocumentContext } from './context/document_context'
import { MainToolID, MainToolTabID } from './tool/main_tool'
import { ToolPointerEvent } from './tool/tool_pointer_event'
import { PointerInputWindow } from './view/pointer_input'
import { Command_CopyGeometry, Command_PasteGeometry } from './commands/edit_copy'
import { Command_Layer_CommandBase, Command_Layer_Delete, Command_Layer_MoveUp, Command_Layer_MoveDown,
  Command_VectorLayer_SetProperty } from './commands/edit_layer'
import { Command_SetReferenceImageToLayer } from './commands/image_reference_layer'
import { SubToolID } from './tool/sub_tool'

export interface AppEvent_Main_Interface {

  resetDocument()
  saveDocument()
  startReloadDocument(filepath: string)
  startReloadDocumentFromFile(file: File, url: string)
  isEventDisabled(): boolean
  isWhileLoading(): boolean
  onWindowBlur()
  onWindowFocus()
  setDefferedWindowResize()
  executeLayerCommand(layerCommand: Command_Layer_CommandBase)
  updateForLayerProperty()
}

export class App_Event {

  isEventSetDone = false
  lastHoverLayoutArea: RectangleLayoutArea = null

  private appView: App_View = null
  private appDrawing: App_Drawing = null
  private appTool: App_Tool = null
  private appdocument: App_Document = null
  private appMain: AppEvent_Main_Interface = null
  private userSetting: UserSettingLogic = null

  private docContext: DocumentContext = null
  private toolContext: SubToolContext = null

  private tempVec3 = vec3.create()
  private tempColor4 = vec4.create()

  link(view: App_View, drawing: App_Drawing, apptool: App_Tool, appdocument: App_Document, userSetting: UserSettingLogic, main: AppEvent_Main_Interface) {

    this.appView = view
    this.appDrawing = drawing
    this.appTool = apptool
    this.appdocument = appdocument
    this.appMain = main
    this.userSetting = userSetting
  }

  linkContexts(docContext: DocumentContext, toolContext: SubToolContext) {

    this.docContext = docContext
    this.toolContext = toolContext
  }

  setEvents() {

    if (this.isEventSetDone) {
      return
    }

    this.isEventSetDone = true

    this.setCanvasWindowMouseEvent(this.appView.editorWindow, this.appView.mainWindow
      , this.mainWindow_mousedown
      , this.mainWindow_mousemove
      , this.mainWindow_mouseup
      , this.mainWindow_mousewheel
      , false
    )

    this.appView.paletteSelectorWindow.uiRef.commandButton_Click = ((item) => {

        this.paletteSelectorWindow_CommandButton_Click(item)
    })

    this.appView.paletteSelectorWindow.uiRef.item_Click = ((paletteColorIndex, item) => {

        this.paletteSelectorWindow_Item_Click(paletteColorIndex, item)
    })

    this.setCanvasWindowMouseEvent(this.appView.timeLineWindow, this.appView.timeLineWindow
      , this.timeLineWindow_mousedown
      , this.timeLineWindow_mousemove
      , null
      , this.timeLineWindow_mousewheel
      , false
    )

    this.setCanvasWindowMouseEvent(this.appView.colorMixerWindow.colorCanvas, this.appView.colorMixerWindow.colorCanvas
      , this.colorMixerWindow_colorCanvas_mousedown
      , this.colorMixerWindow_colorCanvas_mousedown
      , null
      , null
      , true
    )

    document.addEventListener('keydown', (e: KeyboardEvent) => {

      if (this.appMain.isWhileLoading()) {
        return
      }

      if (this.appView.dialog.isDialogOpened()) {
        return
      }

      if (document.activeElement.nodeName == 'INPUT') {
        return
      }

      this.document_keydown(e)
    })

    document.addEventListener('keyup', (e: KeyboardEvent) => {

      if (this.appView.dialog.isDialogOpened()) {
        return
      }

      if (document.activeElement.nodeName == 'INPUT') {
        return
      }

      this.document_keyup(e)
    })

    window.addEventListener('resize', () => {

      this.htmlWindow_resize()
    })

    window.addEventListener('contextmenu', (e: Event) => {

      return this.htmlWindow_contextmenu(e)
    })

    window.addEventListener('blur', () => {

      this.appMain.onWindowBlur()
    })

    window.addEventListener('focus', () => {

      this.appMain.onWindowFocus()
    })

    document.addEventListener('dragover', (e: DragEvent) => {

      e.stopPropagation()
      e.preventDefault()

      let available = false
      if (e.dataTransfer.types.length > 0) {

        for (const type of e.dataTransfer.types) {

          if (type == 'Files') {

            available = true
            break
          }
        }
      }

      if (available) {

        e.dataTransfer.dropEffect = 'move'
      }
      else {

        e.dataTransfer.dropEffect = 'none'
      }
    })

    document.addEventListener('drop', (e: DragEvent) => {

      this.document_drop(e)
    })

    // React components

    this.appView.ribbonUIWindow.uiRibbonUITabsRef.item_Click = (tabID) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.ribbonUI_TabClick(tabID)
    }

    this.appView.headerWindow.uiHeaderWindowRef.commandButton_Click = (id) => {

      this.menuButton_Click(id)
    }

    this.appView.uiSideBarContainerRef.contentOpen = (cotentInfo) => {

      if (cotentInfo.id == MainCommandButtonID[MainCommandButtonID.colorMixerWindow]
        && !this.appView.colorMixerWindow.colorCanvas.isDrawingDone
      ) {

        window.setTimeout(
          () => {

            this.appView.domResizing.resizeByStyle(this.appView.colorMixerWindow.colorCanvas)

            this.appView.colorMixerWindow.drawPaletteColorMixer()
          },
          100
        )
      }
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.button_Click = (id) => {

      this.ribbonUI_button_Click(id)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.subtoolButton_Click = (subtoolID) => {

      this.subtoolButton_Click(subtoolID)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.toggleButton_Click = (id, value) => {

      this.ribbonUI_toggleButton_Click(id, value)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.textInput_Change = (id, value) => {

      this.ribbonUI_textInput_Change(id, value)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.numberInput_Change = (id, value) => {

      this.ribbonUI_numberInput_Change(id, value)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.checkBox_Change = (id, checked, value) => {

      this.ribbonUI_checkBox_Change(id, checked, value)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.selectBox_Change = (id, selected_Option) => {

      this.ribbonUI_selectBox_Change(id, selected_Option)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.documentFrame_Change = (left, top, width, height) => {

      this.documentFrame_Change(left, top, width, height)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.documentViewSettings_change = (new_defaultViewScale) => {

      this.documentViewSettings_change(new_defaultViewScale)
    }

    this.appView.footerWindow.uiFooterOperationpanelRef.button_Click = (id) => {

      this.footerOperationpanel_Button_Click(id)
    }

    this.appView.subToolWindow.uiSubToolWindowRef.item_Click = (item) => {

      this.subtoolWindow_Item_Click(item)
    }

    this.appView.subToolWindow.uiSubToolWindowRef.itemButton_Click = (item) => {

      this.subtoolWindow_Button_Click(item)
    }

    this.appView.layerWindow.uiRef.commandButton_Click = ((item) => {

      this.layerWindow_mousedown_LayerCommandButton(item)
    })

    this.appView.layerWindow.uiRef.item_Click = (item) => {

      this.layerWindow_Item_Click(item)
    }

    this.appView.layerWindow.uiRef.visibility_Click = (item) => {

      this.layerWindow_Visibility_Click(item)
    }

    this.appView.modalWindow.openImageReference.uiRef.onClose = (filePath: string, image: HTMLImageElement) => {

      this.modal_ImageFileReference_Closed(filePath, image)
    }

    // Modal window

    document.addEventListener('custombox:content:open', () => {

      this.appView.dialog.onDialogShown()
    })

    document.addEventListener('custombox:content:close', () => {

      this.onModalWindowClosed()
    })

    this.setEvents_ModalCloseButton(this.appView.ID.messageDialogModal_ok)

    this.setEvents_ModalCloseButton(this.appView.ID.openFileDialogModal_ok)
    this.setEvents_ModalCloseButton(this.appView.ID.openFileDialogModal_cancel)

    this.setEvents_ModalCloseButton(this.appView.ID.newLayerCommandOptionModal_ok)
    this.setEvents_ModalCloseButton(this.appView.ID.newLayerCommandOptionModal_cancel)

    this.setEvents_ModalCloseButton(this.appView.ID.exportImageFileModal_ok)
    this.setEvents_ModalCloseButton(this.appView.ID.exportImageFileModal_cancel)

    this.setEvents_ModalCloseButton(this.appView.ID.newKeyframeModal_ok)
    this.setEvents_ModalCloseButton(this.appView.ID.newKeyframeModal_cancel)

    this.setEvents_ModalCloseButton(this.appView.ID.deleteKeyframeModal_ok)
    this.setEvents_ModalCloseButton(this.appView.ID.deleteKeyframeModal_cancel)

    this.appView.colorMixerWindow.uiRef.color_Change = (newColor: Vec4) => {

      this.colorMixerWindow_changeColor(newColor)
    }

    this.appView.uiDialogDocumentFilerRef.value_Change = (filePath: string) => {

      this.appMain.startReloadDocument(filePath)
    }
  }

  setCanvasWindowMouseEvent(
    eventCanvasWindow: CanvasWindow,
    drawCanvasWindew: PointerInputWindow,
    mousedown: () => void,
    mousemove: () => void,
    mouseup: () => void,
    mousewheel: () => void,
    isModal: boolean
  ) {

    const pointerEvent = drawCanvasWindew.pointerEvent
    const eventElement = eventCanvasWindow.canvas

    if (mousedown != null) {

      eventElement.addEventListener('pointerdown', (e: PointerEvent) => {

        if (this.appMain.isEventDisabled() && !isModal) {
          return
        }

        if (pointerEvent.pointerID == -1) {

          pointerEvent.pointerID = e.pointerId

          eventElement.setPointerCapture(e.pointerId)
        }

        this.appView.activeCanvasWindow = drawCanvasWindew
        this.appView.pointerInput.processPointerEvent(drawCanvasWindew, e, this.toolContext, this.appView.viewCoordinate, true, false, false)

        mousedown.call(this)

        e.preventDefault()
      })
    }

    if (mousemove != null) {

      eventElement.addEventListener('pointermove', (e: PointerEvent) => {

        if (this.appMain.isEventDisabled() && !isModal) {
          return
        }

        this.appView.pointerInput.processPointerEvent(drawCanvasWindew, e, this.toolContext, this.appView.viewCoordinate, false, false, true)

        mousemove.call(this)

        e.preventDefault()
      })
    }

    if (mouseup != null) {

      const func = (e: PointerEvent) => {

        if (this.appMain.isEventDisabled() && !isModal) {
          return
        }

        pointerEvent.pointerID = -1

        this.appView.pointerInput.processPointerEvent(drawCanvasWindew, e, this.toolContext, this.appView.viewCoordinate, false, true, false)

        mouseup.call(this)

        e.preventDefault()
      }

      eventElement.addEventListener('pointerup', func)

      eventElement.addEventListener('pointerleave', func)
    }

    if (mousewheel != null) {

      eventCanvasWindow.canvas.addEventListener('wheel', (e: MouseEvent) => {

        if (this.appMain.isEventDisabled() && !isModal) {
          return
        }

        this.appView.pointerInput.getWheelInfo(pointerEvent, e)

        mousewheel.call(this)

        e.preventDefault()
      })
    }

    eventCanvasWindow.canvas.addEventListener('touchstart', (e: TouchEvent) => {

      // Prevent page navigation by touch event
      e.preventDefault()
    })

    eventCanvasWindow.canvas.addEventListener('touchmove', (e: TouchEvent) => {

      // Prevent page navigation by touch event
      e.preventDefault()
    })

    eventCanvasWindow.canvas.addEventListener('touchend', (e: TouchEvent) => {

      // Prevent page navigation by touch event
      e.preventDefault()
    })
  }

  setEvents_ModalCloseButton(id: string) {

    this.appView.dom.getElement(id).addEventListener('click', (e: Event) => {

      this.appView.dialog.currentModalDialogResult = id

      this.appView.dialog.closeDialog()

      e.preventDefault()
    })
  }

  document_keydown(e: KeyboardEvent) {

    const docContext = this.docContext
    const toolContext = this.toolContext
    const wnd = this.appView.mainWindow

    let key = e.key
    if (key.length == 1) {
      key = key.toLowerCase()
    }

    e.preventDefault()

    docContext.shiftKey = e.shiftKey
    docContext.altKey = e.altKey
    docContext.ctrlKey = e.ctrlKey

    toolContext.updateContext()

    if (this.appView.activeCanvasWindow == this.appView.timeLineWindow) {

      if (this.document_keydown_timeLineWindow(key)) {

        return
      }
    }

    if (this.appTool.executeMainToolKeyDown(key)) {
      return
    }

    if (key == ' ') {

      if (this.appView.activeCanvasWindow == this.appView.mainWindow) {

        this.appView.viewOperation.startViewOperation(ViewOperationMode.move, wnd, null, toolContext)
      }

      return
    }

    if (key == '.' && toolContext.needsDrawOperatorCursor()) {

      this.setOperatorCursorLocationToMouse()
    }

    if (this.appTool.isModalToolRunning()) {

      this.document_keydown_modalTool(key, e)

      return
    }
    else if (toolContext.isEditMode()) {

      if (this.appTool.getCurrentSubTool().keydown(e, toolContext)) {
        return
      }
    }

    if (key == 'Tab') {

      // Change mode
      if (toolContext.isDrawMode()) {

        this.appTool.setCurrentMainToolTabForEditMode(EditModeID.editMode)
      }
      else {

        this.appTool.setCurrentMainToolTabForEditMode(EditModeID.drawMode)
      }

      toolContext.setRedrawLayerWindow()
      toolContext.setRedrawRibbonUI()

      return
    }

    if (key == 'n' && toolContext.isCtrlKeyPressing()) {

      this.appMain.resetDocument()

      return
    }

    if (key == 'b') {

      if (toolContext.isDrawMode()) {

        this.appTool.setCurrentSubTool(SubToolID.scratchLine)

        this.appTool.executeSubToolKeyDown(e)
        return
      }
    }

    if (key == 'e') {

      this.inputKey_eraser_down()
      return
    }

    if (key == 'p') {
      return
    }

    if (key == 'z') {

      this.inputKey_undo_down()
      return
    }

    if (key == 'y') {

      this.inputKey_redo_down()
      return
    }

    if (toolContext.isCtrlKeyPressing() && key == 'c') {

      this.inputKey_copy_down()
      return
    }

    if (toolContext.isCtrlKeyPressing() && key == 'v') {

      this.inputKey_paste_down()
      return
    }

    if (!toolContext.isCtrlKeyPressing() && (key == 'c' || key == 'v')) {

      let addFrame = 1
      if (key == 'c') {
        addFrame = -addFrame
      }

      const frame = this.appView.viewKeyframe.findNextViewKeyframeFrame(this.docContext, docContext.document.animationSettingData.currentTimeFrame, addFrame)

      this.appTool.setCurrentFrame(frame)

      toolContext.setRedrawMainWindowEditorWindow()
      toolContext.setRedrawTimeLineWindow()
    }

    if (key == 'Delete' || key == 'x') {

      const withCut = (key == 'x' && toolContext.isCtrlKeyPressing())

      this.inputKey_delete_down(withCut)
      return
    }

    if (key == 'Home' || key == 'q') {

      this.appView.viewOperation.reseTotHome(this.appView.mainWindow, toolContext)

      return
    }

    if (key == 't' || key == 'r') {

      if (toolContext.isDrawMode()) {

        const clockwise = (key == 't')

        this.appView.viewOperation.addViewRotation(10.0, clockwise, wnd, toolContext)
        return
      }
    }

    if (key == 'm') {

      this.appView.mainWindow.mirrorX = !this.appView.mainWindow.mirrorX
      toolContext.setRedrawMainWindowEditorWindow()
      return
    }

    if (key == 'f' || key == 'd') {

      let addScale = 1.0 + this.appDrawing.drawStyle.viewZoomAdjustingSpeedRate

      if (key == 'd') {

        addScale = 1 / addScale
      }

      this.appView.viewOperation.addViewScale(addScale, wnd, toolContext)

      return
    }

    if (toolContext.isCtrlKeyPressing() && (key == 'ArrowLeft' || key == 'ArrowRight' || key == 'ArrowUp' || key == 'ArrowDown')) {

      let x = 0.0
      let y = 0.0
      if (key == 'ArrowLeft') {
        x = -10.0
      }
      if (key == 'ArrowRight') {
        x = 10.0
      }
      if (key == 'ArrowUp') {
        y = -10.0
      }
      if (key == 'ArrowDown') {
        y = 10.0
      }

      this.appView.mainWindow.calculateViewUnitMatrix(wnd.view2DMatrix)
      mat4.invert(wnd.invView2DMatrix, wnd.view2DMatrix)
      vec3.set(this.tempVec3, x, y, 0.0)
      vec3.transformMat4(this.tempVec3, this.tempVec3, wnd.invView2DMatrix)

      vec3.add(this.appView.mainWindow.viewLocation, this.appView.mainWindow.viewLocation, this.tempVec3)

      const leftLimit = this.appView.mainWindow.width * (-0.5)
      const rightLimit = this.appView.mainWindow.width * 1.5
      const topLimit = this.appView.mainWindow.height * (-0.5)
      const bottomLimit = this.appView.mainWindow.height * 1.5

      if (this.appView.mainWindow.viewLocation[0] < leftLimit) {
        this.appView.mainWindow.viewLocation[0] = leftLimit
      }
      if (this.appView.mainWindow.viewLocation[0] > rightLimit) {
        this.appView.mainWindow.viewLocation[0] = rightLimit
      }
      if (this.appView.mainWindow.viewLocation[1] < topLimit) {
        this.appView.mainWindow.viewLocation[1] = topLimit
      }
      if (this.appView.mainWindow.viewLocation[1] > bottomLimit) {
        this.appView.mainWindow.viewLocation[1] = bottomLimit
      }

      toolContext.setRedrawMainWindowEditorWindow()

      return
    }

    if (!toolContext.isCtrlKeyPressing() && (key == 'ArrowLeft' || key == 'ArrowRight')) {

      let addFrame = 1
      if (key == 'ArrowLeft') {
        addFrame = -addFrame
      }

      this.appTool.setCurrentFrame(docContext.document.animationSettingData.currentTimeFrame + addFrame)

      toolContext.setRedrawMainWindowEditorWindow()
      toolContext.setRedrawTimeLineWindow()
    }

    if (key == 'i') {

      return
    }

    if (key == 'a') {

      if (toolContext.isEditMode()) {

        this.appTool.tool_SelectAllPoints.executeToggleSelection(toolContext)
        this.appTool.activateCurrentTool()
      }
      else {

        this.appTool.selectNextOrPreviousLayer(false)
        this.appView.layerHighlight.startShowingCurrentLayer(this.docContext, this.toolContext)
        toolContext.setRedrawLayerWindow()
        toolContext.setRedrawRibbonUI()
      }

      return
    }

    if (key == 'h') {

      if (!toolContext.isEditMode()) {

        this.appTool.setCurrentSubTool(SubToolID.extrudeLine)

        this.appTool.executeSubToolKeyDown(e)
      }

      return
    }

    if (key == 'w') {

      let pickedLayer: Layer = null
      for (const pickingPosition of this.appDrawing.layerPickingPositions) {

        const pickX = this.appView.mainWindow.pointerEvent.offsetX + pickingPosition[0]
        const pickY = this.appView.mainWindow.pointerEvent.offsetY + pickingPosition[1]

        pickedLayer = this.appDrawing.pickLayer(this.appView.mainWindow, this.appDrawing.currentViewKeyframe, docContext.document, pickX, pickY)

        if (pickedLayer != null) {
          break
        }
      }

      if (pickedLayer != null) {

        this.appTool.selectLayer(pickedLayer)
        this.appView.layerHighlight.startShowingCurrentLayer(this.docContext, this.toolContext)
      }
      else {

        toolContext.setRedrawMainWindowEditorWindow()
      }

      return
    }

    if (key == 'o') {

      if (toolContext.isCtrlKeyPressing()) {

        this.appView.uiDialogDocumentFilerRef.show(this.userSetting)
      }
      else {

        this.appTool.executeSubToolKeyDown(e)
      }

      return
    }

    if (key == 'g' || key == 'r' || key == 's') {

      if (key == 's' && toolContext.isCtrlKeyPressing()) {

        this.appMain.saveDocument()
        return
      }

      if (toolContext.isDrawMode()) {

        if (this.appTool.executeSubToolKeyDown(e)) {

          // Switch to scratch line tool
        }
        else if (key == 'g') {

          this.inputKey_draw_down()
        }
        else if (key == 's') {

          this.appTool.selectNextOrPreviousLayer(true)
          this.appView.layerHighlight.startShowingCurrentLayer(this.docContext, this.toolContext)
          toolContext.setRedrawLayerWindow()
          toolContext.setRedrawRibbonUI()
        }

        return
      }
      else if (toolContext.isEditMode()) {

        if (toolContext.isCurrentLayerVectorLayer() || toolContext.isCurrentLayerGroupLayer()) {

          let modalToolID = SubToolID.edit_GrabMove

          if (key == 'r') {

            modalToolID = SubToolID.edit_Rotate
          }
          else if (key == 's') {

            modalToolID = SubToolID.edit_Scale
          }

          this.appTool.startModalTool(modalToolID)
        }

        return
      }
    }

    if (key == 'Enter') {

      this.appTool.executeSubToolKeyDown(e)
    }

    if (key == '5') {

      this.appView.dialog.newLayerCommandOptionDialog()
    }

    if (key == '\\') {

      this.appView.dialog.exportImageFileDialog()
    }

    if (key == '-') {

      docContext.drawCPUOnly = !this.docContext.drawCPUOnly
      toolContext.setRedrawMainWindow()
    }
  }

  inputKey_undo_down() {

    this.docContext.commandHistory.undo(this.toolContext)

    this.appTool.activateCurrentTool()

    this.toolContext.setRedrawMainWindowEditorWindow()
  }

  inputKey_redo_down() {

    this.docContext.commandHistory.redo(this.toolContext)

    this.appTool.activateCurrentTool()

    this.toolContext.setRedrawMainWindowEditorWindow()
  }

  inputKey_copy_down() {

    if (!this.toolContext.isEditMode()) {
      return
    }

    if (this.docContext.currentVectorGroup != null) {

      const command = new Command_CopyGeometry()

      if (command.prepareEditData(this.toolContext)) {

        command.execute(this.toolContext)
      }
    }
  }

  inputKey_paste_down() {

    if (this.docContext.currentVectorGroup == null) {
      return
    }

    const command = new Command_PasteGeometry()

    if (command.prepareEditData(this.toolContext)) {

      this.appTool.tool_SelectAllPoints.executeClearSelectAll(this.toolContext)

      this.docContext.commandHistory.executeCommand(command, this.toolContext)
    }

    this.toolContext.setRedrawCurrentLayer()
  }

  inputKey_delete_down(withCut: boolean) {

    if (!this.toolContext.isEditMode()) {
      return
    }

    if (this.toolContext.isCurrentLayerVectorLayer() || this.toolContext.isCurrentLayerGroupLayer()) {

      const command = new Command_DeleteSelectedPoints()

      if (command.prepareEditTargets(this.toolContext)) {

        if (withCut) {

          const copyCommand = new Command_CopyGeometry()
          if (copyCommand.prepareEditData(this.toolContext)) {

            copyCommand.execute(this.toolContext)
          }
        }

        this.toolContext.commandHistory.executeCommand(command, this.toolContext)

        this.toolContext.setRedrawMainWindow()
      }
    }
  }

  inputKey_draw_down() {

    if (!this.toolContext.isDrawMode()) {
      return
    }

    this.appTool.setCurrentSubTool(SubToolID.drawLine)

    this.appTool.updateFooterMessage()
  }

  inputKey_eraser_down() {

    if (!this.toolContext.isDrawMode()) {
      return
    }

    if (this.docContext.subtoolID != SubToolID.deletePointBrush) {

      this.appTool.setCurrentSubTool(SubToolID.deletePointBrush)
    }
    else {

      this.appTool.setCurrentSubTool(SubToolID.drawLine)
    }

    this.appTool.updateFooterMessage()
  }

  document_keyup(e: KeyboardEvent) {

    this.docContext.shiftKey = e.shiftKey
    this.docContext.altKey = e.altKey
    this.docContext.ctrlKey = e.ctrlKey

    if (e.key == ' ') {

      if (this.appView.viewOperation.isViewOperationRunning()) {

        this.appView.viewOperation.endViewOperation(this.appView.mainWindow, true, this.toolContext)
      }
    }
  }

  document_keydown_modalTool(key: string, e: KeyboardEvent) {

    if (key == 'Escape') {

      this.appTool.cancelModalTool()
    }
    else {

      this.appTool.executeSubToolKeyDown(e)
    }
  }

  document_keydown_timeLineWindow(key: string): boolean {

    const aniSetting = this.docContext.document.animationSettingData

    if (key == 'i') {
      this.appView.dialog.newKeyframeDialog()
      return true
    }

    if (key == 'Delete' || key == 'x') {
      this.appView.dialog.deleteKeyframeDialog()
      return true
    }

    if (key == 'k' || key == 'l') {

      if (this.appDrawing.currentViewKeyframe != null) {

        let add_FrameTime = 1
        if (key == 'k') {
          add_FrameTime = -1
        }

        let newFrame = this.appDrawing.currentViewKeyframe.frame + add_FrameTime

        if (newFrame < 0) {

          newFrame = 0
        }

        if (add_FrameTime > 0
          && this.appDrawing.nextKeyframe != null
          && newFrame >= this.appDrawing.nextKeyframe.frame) {

          newFrame = this.appDrawing.nextKeyframe.frame - 1
        }

        if (add_FrameTime < 0
          && this.appDrawing.previousKeyframe != null
          && newFrame <= this.appDrawing.previousKeyframe.frame) {

          newFrame = this.appDrawing.previousKeyframe.frame + 1
        }

        if (this.appDrawing.currentViewKeyframe.frame != newFrame) {

          for (const viewKeyFrameLayer of this.appDrawing.currentViewKeyframe.layers) {

            if (viewKeyFrameLayer.hasKeyframe()) {

              viewKeyFrameLayer.vectorLayerKeyframe.frame = newFrame
            }
          }

          this.appDrawing.currentViewKeyframe.frame = newFrame

          this.toolContext.setRedrawMainWindowEditorWindow()
          this.toolContext.setRedrawTimeLineWindow()
        }
      }

      return true
    }

    if (key == 'o' || key == 'p') {

      let add_FrameTime = 1
      if (key == 'o') {
        add_FrameTime = -1
      }

      if (this.toolContext.isShiftKeyPressing()) {

        aniSetting.loopEndFrame += add_FrameTime
        if (aniSetting.loopEndFrame < 0) {
          aniSetting.loopEndFrame = 0
        }
      }
      else if (this.toolContext.isCtrlKeyPressing()) {

        aniSetting.loopStartFrame += add_FrameTime
        if (aniSetting.loopStartFrame < 0) {
          aniSetting.loopStartFrame = 0
        }
      }
      else {

        aniSetting.maxFrame += add_FrameTime
        if (aniSetting.maxFrame < 0) {
          aniSetting.maxFrame = 0
        }
      }

      this.toolContext.setRedrawMainWindowEditorWindow()
      this.toolContext.setRedrawTimeLineWindow()

      return true
    }

    return false
  }

  document_drop(e: DragEvent) {

    e.preventDefault()

    // Check file exists
    if (e.dataTransfer.files.length == 0) {

      console.error('no dropped files.')
      return
    }

    // Get file path or name
    const file = e.dataTransfer.files[0]

    let filePath = ''
    if ('path' in file) {
      filePath = file['path']
    }
    else {
      filePath = file.name
    }

    if (Strings.isNullOrEmpty(filePath)) {

      console.error('cannot get file path.')
      return
    }

    // Start loading document
    this.appMain.startReloadDocumentFromFile(file, filePath)
  }

  htmlWindow_resize() {

    this.appMain.setDefferedWindowResize()
  }

  htmlWindow_contextmenu(e): boolean {

    if (e.preventDefault) {
      e.preventDefault()
    }
    else if (e.returnValue) {
      e.returnValue = false
    }

    return false
  }

  mainWindow_mousedown() {

    const wnd = this.appView.mainWindow
    const e = wnd.pointerEvent

    this.toolContext.updateContext()

    // console.log('mainWindow_mousedown', e.offsetX, e.offsetY)

    // Operation UI
    if (!this.appTool.isModalToolRunning() && !this.appView.viewOperation.isViewOperationRunning()) {

      this.mainWindow_mousedown_OperationUI(e)
    }

    if (this.appView.viewOperation.isViewOperationRunning()) {

      this.appView.viewOperation.pointerDownAdditional(wnd)

      return
    }

    if (this.operationUI_IsHover(e)) {
      return
    }

    // Current tool
    if (this.appTool.isModalToolRunning()) {

      if (this.appTool.isCurrentSubToolAvailable()) {

        this.appTool.executeSubToolMouseDown(e)
      }
    }
    else {

      if (this.appTool.isCurrentSubToolAvailable()) {

        this.appTool.executeSubToolMouseDown(e)
      }
    }

    // View operations
    if (e.isRightButtonPressing() && this.toolContext.isShiftKeyPressing()) {

      this.setOperatorCursorLocationToMouse()
    }
    else if (e.isRightButtonPressing() || e.isCenterButtonPressing()) {

      this.appView.viewOperation.startViewOperation(ViewOperationMode.move, wnd, null, this.toolContext)
    }
    else {

      this.appView.viewOperation.endViewOperation(wnd, false, this.toolContext)
    }
  }

  mainWindow_mousemove() {

    const wnd = this.appView.mainWindow
    const e = wnd.pointerEvent

    this.toolContext.updateContext()

    // View operations
    if (this.appView.viewOperation.isViewOperationRunning()) {

      if (this.appView.viewOperation.processViewOperation(wnd, wnd.pointerEvent, this.toolContext)) {

        return
      }
    }

    // Operation UI
    if (!this.appTool.isModalToolRunning()) {

      if (this.mainWindow_mousemove_OperationUI(e)) {

        this.toolContext.setRedrawEditorWindow()
      }
    }

    // Current tool
    if (this.appTool.isModalToolRunning()) {

        // console.log(`mainWindow_mousemove (${e.location[0]} ${e.location[1]})`)

        if (!e.isMouseDragging) {

        if (this.appTool.isCurrentSubToolAvailable()) {

        this.appTool.executeSubToolMouseMove(e)
        }
      }
    }
    else if (this.toolContext.isDrawMode()) {

      this.appTool.executeSubToolMouseMove(e)
    }
    else if (this.toolContext.isEditMode()) {

      const isHitChanged = this.hittestToStrokes(e.location, this.toolContext.mouseCursorViewRadius)

      if (isHitChanged) {

        this.toolContext.setRedrawCurrentLayer()
      }

      this.appTool.executeSubToolMouseMove(e)
    }
  }

  mainWindow_mouseup() {

    const wnd = this.appView.mainWindow
    const e = wnd.pointerEvent

    this.toolContext.updateContext()

    if (this.appView.viewOperation.isViewOperationRunning()) {

      if (this.appView.viewOperation.endViewOperation(wnd, false, this.toolContext)) {

        return
      }
    }

    this.appTool.executeSubToolMouseUp(e)
  }

  mainWindow_mousewheel() {

    const wnd = this.appView.mainWindow
    const e = wnd.pointerEvent

    // View operations
    if (e.wheelDelta != 0.0 && !e.isMouseDragging) {

      let addScale = 1.0 + this.appDrawing.drawStyle.viewZoomAdjustingSpeedRate * 0.5

      if (e.wheelDelta < 0.0) {

        addScale = 1.0 / addScale
      }

      this.appView.viewOperation.addViewScale(addScale, wnd, this.toolContext)
    }

    this.appView.viewCoordinate.calculateTransfomredMouseParams(this.toolContext.mouseCursorLocation, e, wnd)
  }

  hittestToStrokes(location: Vec3, minDistance: float): boolean {

    if (this.toolContext.currentVectorGeometry == null) {

      return false
    }

    this.appTool.hittest_Line_IsCloseTo.startProcess()

    this.appTool.hittest_Line_IsCloseTo.processGeometry(this.toolContext.currentVectorGeometry, location, minDistance)

    this.appTool.hittest_Line_IsCloseTo.endProcess()

    return this.appTool.hittest_Line_IsCloseTo.isChanged
  }

  mainWindow_mousedown_OperationUI(e: ToolPointerEvent): boolean {

    const area = this.appView.operationPanel.hittestToButtons(e)

    if (area != null) {

      this.operationUI_Click(area, this.appView.mainWindow)

      return true
    }

    if (this.appView.operationPanel.hittestToPanel(e)) {

      return true
    }

    return false
  }

  operationUI_IsHover(e: ToolPointerEvent): boolean {

    return (this.appView.operationPanel.hittestToPanel(e) != null)
  }

  mainWindow_mousemove_OperationUI(e: ToolPointerEvent): boolean {

    // Operation UI
    if (this.operationUI_IsHover(e)) {

      this.appView.editorWindow.canvas.style.cursor = "default"
    }
    else {

      this.appView.editorWindow.canvas.style.cursor = "crosshair"
    }

    const area = this.appView.operationPanel.hittestToButtons(e)

    if (this.lastHoverLayoutArea != null) {

      this.lastHoverLayoutArea.saveState()
    }

    if (area != null) {

      area.saveState()
    }

    if (this.lastHoverLayoutArea != null) {

      this.lastHoverLayoutArea.hover = false
    }

    if (area != null) {

      area.hover = true
      this.lastHoverLayoutArea = area
    }

    const isChanged = (LayoutLogic.isChanged(area) || LayoutLogic.isChanged(this.lastHoverLayoutArea))

    return isChanged
  }

  menuButton_Click(id: MainCommandButtonID) {

    if (this.appMain.isEventDisabled()) {
      return
    }

    switch (id) {

      case MainCommandButtonID.open:
        this.appView.uiDialogDocumentFilerRef.show(this.userSetting)
        break

      case MainCommandButtonID.save:
        this.appMain.saveDocument()
        break

      case MainCommandButtonID.export:
        this.appView.dialog.exportImageFileDialog()
        break

      case MainCommandButtonID.undo:
        this.inputKey_undo_down()
        break

      case MainCommandButtonID.redo:
        this.inputKey_redo_down()
        break

      case MainCommandButtonID.layerWindow:
        this.appView.uiSideBarContainerRef.toggleContent(MainCommandButtonID[MainCommandButtonID.layerWindow])
        break

      case MainCommandButtonID.paletteWindow:
        this.appView.uiSideBarContainerRef.toggleContent(MainCommandButtonID[MainCommandButtonID.paletteWindow])
        break

      case MainCommandButtonID.colorMixerWindow:
        this.appView.uiSideBarContainerRef.toggleContent(MainCommandButtonID[MainCommandButtonID.colorMixerWindow])
        break

      case MainCommandButtonID.timeLineWindow:
        // TOTO: きちんと実装する
        if (this.appView.timeLineWindow.canvas.parentElement.classList.contains('hidden')) {

          this.appView.timeLineWindow.canvas.parentElement.classList.remove('hidden')

          setTimeout(() => {

            this.appView.domResizing.resizeCanvasToClientSize(this.appView.timeLineWindow)
            this.toolContext.setRedrawTimeLineWindow()
          }, 100)
        }
        else {

          this.appView.timeLineWindow.canvas.parentElement.classList.add('hidden')
        }
        break
    }
  }

  footerOperationpanel_Button_Click(id: UI_FooterOperationPanel_ID) {

    if (this.appMain.isEventDisabled()) {
      return
    }

    if (id == UI_FooterOperationPanel_ID.copy) {

      this.inputKey_copy_down()
      return
    }

    if (id == UI_FooterOperationPanel_ID.paste) {

      this.inputKey_paste_down()
      return
    }

    if (id == UI_FooterOperationPanel_ID.cut) {

      this.inputKey_delete_down(true)
      return
    }

    if (id == UI_FooterOperationPanel_ID.undo) {

      this.inputKey_undo_down()
      return
    }

    if (id == UI_FooterOperationPanel_ID.redo) {

      this.inputKey_redo_down()
      return
    }
  }

  operationUI_Click(area: RectangleLayoutArea, wnd: PointerInputWindow) {

    if (area.index == OperationPanelButtonID.view_move) {

      this.appView.viewOperation.startViewOperation(ViewOperationMode.move, wnd, area, this.toolContext)
      return
    }

    if (area.index == OperationPanelButtonID.view_rotate) {

      this.appView.viewOperation.startViewOperation(ViewOperationMode.rotate, wnd, area, this.toolContext)
      return
    }

    if (area.index == OperationPanelButtonID.view_zoom) {

      this.appView.viewOperation.startViewOperation(ViewOperationMode.zoom, wnd, area, this.toolContext)
      return
    }

    if (area.index == OperationPanelButtonID.draw) {

      this.inputKey_draw_down()
      return
    }

    if (area.index == OperationPanelButtonID.eraser) {

      this.inputKey_eraser_down()
      return
    }
  }

  layerWindow_mousedown_LayerCommandButton(hitedButton: UI_CommandButtonsItem) {

    if (hitedButton == null) {
      return
    }

    // Select command
    let layerCommand: Command_Layer_CommandBase = null

    if (hitedButton.index == <int>LayerWindowButtonID.addLayer) {

      this.appView.dialog.newLayerCommandOptionDialog()
    }
    else if (hitedButton.index == <int>LayerWindowButtonID.deleteLayer) {

      layerCommand = new Command_Layer_Delete()
    }
    else if (hitedButton.index == <int>LayerWindowButtonID.moveUp) {

      layerCommand = new Command_Layer_MoveUp()
    }
    else if (hitedButton.index == <int>LayerWindowButtonID.moveDown) {

      layerCommand = new Command_Layer_MoveDown()
    }

    if (layerCommand == null) {

      return
    }

    // Execute command
    this.appMain.executeLayerCommand(layerCommand)
  }

  layerWindow_Item_Click(item: ViewLayerListItem) {

    const selectedLayer = item.layer

    if (this.toolContext.isShiftKeyPressing()) {

      this.appTool.setLayerSelection(selectedLayer, !selectedLayer.isSelected)
      this.appTool.activateCurrentTool()
      this.appView.layerHighlight.startShowingLayerItem(item, this.toolContext)
    }
    else {

      this.appTool.selectLayer(selectedLayer)
      this.appView.layerHighlight.startShowingCurrentLayer(this.docContext, this.toolContext)
    }

    Layer.updateHierarchicalStatesRecursive(selectedLayer)
  }

  layerWindow_Visibility_Click(item: ViewLayerListItem) {

    this.appTool.setLayerVisiblity(item.layer, !item.layer.isVisible)

    Layer.updateHierarchicalStatesRecursive(this.toolContext.document.rootLayer)

    this.appTool.activateCurrentTool()

    this.toolContext.setRedrawMainWindowEditorWindow()
    this.toolContext.setRedrawLayerWindow()
    this.toolContext.setRedrawRibbonUI()
  }

  ribbonUI_TabClick(tabID: MainToolTabID) {

    this.appTool.setCurrentMainToolTab(tabID)
    this.appTool.setCurrentSubToolForCurrentTab()
  }

  subtoolWindow_Item_Click(item: SubToolViewItem) {

    this.subtoolButton_Click(item.subToolID)
  }

  subtoolWindow_Button_Click(item: SubToolViewItem) {

    const tool = item.tool

    if (!tool.isAvailable(this.toolContext)) {
      return
    }

    const buttonIndex = 0

    if (tool.optionButton_Click(buttonIndex, this.toolContext)) {

      item.buttonStateID = tool.getOptionButtonState(buttonIndex, this.toolContext)

      this.toolContext.setRedrawMainWindowEditorWindow()
      this.toolContext.setRedrawRibbonUI()
    }
  }

  subtoolButton_Click(subToolID: SubToolID) {

    this.appTool.setCurrentSubTool(subToolID)
    this.appTool.activateCurrentTool()
    this.appTool.getCurrentSubTool().toolWindowItemClick(this.toolContext)
  }

  ribbonUI_button_Click(id: RibbonUIControlID) {

    this.appTool.executeMainToolButtonClick(id)
  }

  ribbonUI_toggleButton_Click(id: RibbonUIControlID, value: number) {

    switch(id) {

      case RibbonUIControlID.vectorLayer_drawLineType:
        // TODO: undoの実装
        if (this.docContext.currentVectorLayer) {

          this.docContext.currentVectorLayer.drawLineType = value

          const color = this.docContext.getCurrentLayerLineColor()
          vec4.copy(this.docContext.currentVectorLayer.layerColor, color)

          this.appMain.updateForLayerProperty()

          this.toolContext.setRedrawRibbonUI()
          this.toolContext.setRedrawMainWindowEditorWindow()
        }
        break

        case RibbonUIControlID.vectorLayer_fillAreaType:
          // TODO: undoの実装
          if (this.docContext.currentVectorLayer) {

            this.docContext.currentVectorLayer.fillAreaType = value

            const color = this.docContext.getCurrentLayerFillColor()
            vec4.copy(this.docContext.currentVectorLayer.fillColor, color)

            this.appMain.updateForLayerProperty()

            this.toolContext.setRedrawRibbonUI()
            this.toolContext.setRedrawMainWindowEditorWindow()
          }
          break

      case RibbonUIControlID.vectorLayer_eyesSymmetryInputSide:

        if (this.toolContext.currentVectorLayer) {

          this.toolContext.currentVectorLayer.eyesSymmetryInputSide = value

          const command = new Command_VectorLayer_SetProperty()
          command.layer = this.toolContext.currentVectorLayer
          command.new_eyesSymmetryInputSide = value
          if (command.isAvailable(this.toolContext)) {

            this.toolContext.commandHistory.executeCommand(command, this.toolContext)
          }
        }

        break
    }
  }

  ribbonUI_textInput_Change(id: RibbonUIControlID, value: string) {

    if (typeof(value) != 'string') {
      return
    }

    switch(id) {

      case RibbonUIControlID.layer_name:
        this.docContext.currentLayer.name = value
        this.toolContext.setRedrawLayerWindow()
        break
    }
  }

  ribbonUI_numberInput_Change(id: RibbonUIControlID, value: float) {

    // console.log(id, value)
    if (!Number.isFinite(value)) {
      return
    }

    switch(id) {

      case RibbonUIControlID.brushWidth_Max:
        this.docContext.drawLineBaseWidth = value
        break

      case RibbonUIControlID.brushWidth_Min:
        this.docContext.drawLineMinWidth = value
        break

      case RibbonUIControlID.eraserWidth_Max:
        this.docContext.eraserLineBaseWidth = value
        this.toolContext.setRedrawEditorWindow()
        break

      case RibbonUIControlID.document_lineWidthBiasRate:
        this.docContext.document.lineWidthBiasRate = value
        this.toolContext.setRedrawMainWindowEditorWindow()
        break

      case RibbonUIControlID.vectorLayer_lineWidthBiasRate:
        if (this.docContext.currentVectorLayer) {

          this.docContext.currentVectorLayer.lineWidthBiasRate = value
          this.toolContext.setRedrawMainWindow()
        }
        break
    }
  }

  ribbonUI_checkBox_Change(id: RibbonUIControlID, checked: boolean, _value: boolean | number | null) {

    switch (id) {

      case RibbonUIControlID.document_hideOuterArea:
        // TODO: undoの実装
        this.toolContext.document.documentFrame_HideOuterArea = checked

        this.toolContext.setRedrawRibbonUI()
        this.toolContext.setRedrawMainWindowEditorWindow()
        break

      case RibbonUIControlID.layer_isRenderTarget:
        // TODO: undoの実装
        if (this.toolContext.currentLayer) {

          this.toolContext.currentLayer.isRenderTarget = checked

          this.appMain.updateForLayerProperty()

          this.toolContext.setRedrawRibbonUI()
          this.toolContext.setRedrawMainWindowEditorWindow()
        }
        break

      case RibbonUIControlID.layer_isMaskedByBelowLayer:
        // TODO: undoの実装
        if (this.toolContext.currentLayer) {

          this.toolContext.currentLayer.isMaskedByBelowLayer = checked

          this.appMain.updateForLayerProperty()

          this.toolContext.setRedrawRibbonUI()
          this.toolContext.setRedrawMainWindowEditorWindow()
        }
        break

      case RibbonUIControlID.vectorLayer_enableEyesSymmetry:

        if (this.toolContext.currentVectorLayer) {

          const command = new Command_VectorLayer_SetProperty()
          command.layer = this.toolContext.currentVectorLayer
          command.new_enableEyesSymmetry = checked
          if (command.isAvailable(this.toolContext)) {

            // console.log('ribbonUI_CheckBox_Change', id, checked, value)

            this.toolContext.commandHistory.executeCommand(command, this.toolContext)
          }
        }
        break
    }
  }

  ribbonUI_selectBox_Change(id: RibbonUIControlID, selected_Options: UI_SelectBoxOption[]) {

    switch (id) {

      case RibbonUIControlID.vectorLayer_posingLayer:
      {
        const selected_Option = (selected_Options.length > 0 ? selected_Options[0] : null)

        if (this.toolContext.currentVectorLayer && selected_Option) {

          // console.log('ribbonUI_SelectBox_Change', id, selected_Option, this.toolContext.currentVectorLayer)

          const command = new Command_VectorLayer_SetProperty()
          command.layer = this.toolContext.currentVectorLayer
          command.new_posingLayer = selected_Option.data
          if (command.isAvailable(this.toolContext)) {

            this.toolContext.commandHistory.executeCommand(command, this.toolContext)
          }
        }
        break
      }
    }
  }

  documentFrame_Change(left: float, top: float, width: float, height: float) {

    this.docContext.document.documentFrame[0] = left
    this.docContext.document.documentFrame[1] = top
    this.docContext.document.documentFrame[2] = left + width - 1
    this.docContext.document.documentFrame[3] = top + height - 1

    this.toolContext.setRedrawMainWindowEditorWindow()

    this.appTool.activateCurrentTool()
  }

  documentViewSettings_change(defaultViewScale: float) {

    this.docContext.document.defaultViewScale = defaultViewScale

    this.toolContext.setRedrawMainWindowEditorWindow()
  }

  paletteSelectorWindow_CommandButton_Click(item: UI_CommandButtonsItem) {

    this.appView.paletteSelectorWindow.setCurrentTarget(item.index)

    this.toolContext.setRedrawPalleteSelectorWindow()
    this.toolContext.setRedrawColorMixerWindow()
  }

  paletteSelectorWindow_Item_Click(paletteColorIndex: int, color: PaletteColor) {

    const wnd = this.appView.paletteSelectorWindow
    const ctx = this.docContext

    let needsUpdateForLayer = false
    let needsUpdateForPallete = false

    switch (wnd.currentTargetID) {

      case PaletteSelectorWindowButtonID.lineColor:
        if (ctx.currentStrokeDrawable != null) {

          ctx.currentStrokeDrawable.line_PaletteColorIndex = paletteColorIndex
          vec4.copy(ctx.currentStrokeDrawable.layerColor, color.color)
          needsUpdateForLayer = true
        }
        break

      case PaletteSelectorWindowButtonID.fillColor:
        if (ctx.currentFillDrawable) {

          ctx.currentFillDrawable.fill_PaletteColorIndex = paletteColorIndex
          vec4.copy(ctx.currentFillDrawable.fillColor, color.color)
          needsUpdateForLayer = true
        }
        break

      case PaletteSelectorWindowButtonID.adjustmentMode:
        wnd.setCurrentPaletteIndex(paletteColorIndex)
        needsUpdateForPallete = true
        break
    }

    if (needsUpdateForLayer) {

      this.appMain.updateForLayerProperty()

      this.toolContext.setRedrawLayerWindow()
      this.toolContext.setRedrawRibbonUI()
      this.toolContext.setRedrawMainWindowEditorWindow()
    }

    if (needsUpdateForPallete) {

      this.toolContext.setRedrawPaletteWindow()
    }
  }

  colorMixerWindow_colorCanvas_mousedown() {

    const wnd = this.appView.colorMixerWindow.colorCanvas
    const e = wnd.pointerEvent

    if (!e.isLeftButtonPressing()) {
      return
    }

    this.appDrawing.canvasRender.setContext(wnd)
    this.appDrawing.canvasRender.pickColor(this.tempColor4, e.offsetX, e.offsetY)

    this.updateCurrentLayerColor(this.tempColor4, true)
  }

  colorMixerWindow_changeColor(newColor: Vec4) {

    this.updateCurrentLayerColor(newColor, false)
  }

  updateCurrentLayerColor(newColor: Vec4, keepAlpha: boolean) {

    const isChanged = this.appView.paletteSelectorWindow.updateCurrentLayerColor(newColor, keepAlpha, this.docContext)

    if (isChanged) {

      this.toolContext.setRedrawMainWindow()
      this.toolContext.setRedrawPalleteSelectorWindow()
      this.toolContext.setRedrawColorMixerWindow()
      this.toolContext.setRedrawLayerWindow()
    }
  }

  timeLineWindow_mousedown() {

    const wnd = this.appView.timeLineWindow
    const e = wnd.pointerEvent

    const left = wnd.getTimeLineLeft()

    if (e.offsetX < left) {

      this.timeLineWindow_OnPlayPauseButton()
    }
    else {

      this.timeLineWindow_ProcessFrameInput()
    }
  }

  timeLineWindow_OnPlayPauseButton() {

    const aniSetting = this.docContext.document.animationSettingData

    if (this.docContext.animationPlaying) {

      this.docContext.animationPlaying = false

      this.toolContext.setRedrawTimeLineWindow()
    }
    else {

      this.docContext.animationPlaying = true
      this.docContext.animationPlayingFPS = aniSetting.animationFrameParSecond
    }
  }

  timeLineWindow_ProcessFrameInput() {

    const wnd = this.appView.timeLineWindow
    const e = wnd.pointerEvent
    const aniSetting = this.docContext.document.animationSettingData

    const clickedFrame = wnd.getFrameByLocation(e.offsetX, aniSetting)

    if (clickedFrame != -1 && clickedFrame != aniSetting.currentTimeFrame) {

      this.appTool.setCurrentFrame(clickedFrame)

      this.toolContext.setRedrawMainWindowEditorWindow()
      this.toolContext.setRedrawTimeLineWindow()
    }
  }

  timeLineWindow_mousemove() {

    const wnd = this.appView.timeLineWindow
    const e = wnd.pointerEvent

    if (e.isLeftButtonPressing()) {

      this.timeLineWindow_ProcessFrameInput()
    }
  }

  timeLineWindow_mousewheel() {

    const wnd = this.appView.timeLineWindow
    const e = wnd.pointerEvent
    const aniSetting = this.docContext.document.animationSettingData

    if (this.toolContext.isCtrlKeyPressing()) {

      const addScale = 0.2

      if (e.wheelDelta > 0) {

        aniSetting.timeLineWindowScale += addScale
      }
      else {

        aniSetting.timeLineWindowScale -= addScale
      }

      if (aniSetting.timeLineWindowScale < 1.0) {

        aniSetting.timeLineWindowScale = 1.0
      }

      if (aniSetting.timeLineWindowScale > aniSetting.timeLineWindowScaleMax) {

        aniSetting.timeLineWindowScale = aniSetting.timeLineWindowScaleMax
      }

      this.toolContext.setRedrawTimeLineWindow()
    }
  }

  setOperatorCursorLocationToMouse() {

    vec3.copy(this.docContext.operatorCursor.location, this.appView.mainWindow.pointerEvent.location)
    this.toolContext.setRedrawEditorWindow()
  }

  modal_ImageFileReference_Closed(filePath: string, image: HTMLImageElement) {

    const command = new Command_SetReferenceImageToLayer()
    command.targetLayer = this.toolContext.currentImageFileReferenceLayer
    command.image = image
    command.filePath = filePath

    this.toolContext.commandHistory.executeCommand(command, this.toolContext)
  }

  onModalWindowClosed() {

    // TODO: ダイアログの刷新後この関数は不要になるため削除する

    this.appView.dialog.onDialogClosed()

    this.toolContext.setRedrawMainWindowEditorWindow()
    this.toolContext.setRedrawLayerWindow()
    this.toolContext.setRedrawRibbonUI()
  }
}
