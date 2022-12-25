import { Platform } from '../platform'
import { App_Document } from './app-document'
import { App_Drawing } from './app-drawing'
import { App_Tool } from './app-tool'
import { App_UserSetting } from './app-user-setting'
import { App_View } from './app-view'
import {
  Command_CopyGeometry, Command_Layer_AddAutoFillLayerToCurrentPosition,
  Command_Layer_AddGroupLayerToCurrentPosition, Command_Layer_AddImageFileReferenceLayerToCurrentPosition,
  Command_Layer_AddPosingLayerToCurrentPosition, Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition,
  Command_Layer_AddVectorLayerToCurrentPosition, Command_Layer_CommandBase, Command_Layer_Delete,
  Command_Layer_MoveDown, Command_Layer_MoveUp, Command_PasteGeometry, Command_SetReferenceImageToLayer,
  Command_VectorLayer_SetProperty, Command_VectorLayer_DeleteSelected
} from './commands'
import { DocumentContext, SubToolContext } from './context'
import { Layer, LayerTypeID, PaletteColor } from './document-data'
import { LayerLogic } from './document-logic'
import { OperationPanelButtonID } from './editor'
import { float, int, LayoutLogic, RectangleLayoutArea, Strings } from './common-logics'
import { CanvasWindow } from './render'
import { EditModeID, MainToolTabID, SubToolID, ToolPointerEvent } from './tool'
import { DeleteKeyframeTypeID, MainCommandButtonID, NewKeyframeTypeID, NewLayerTypeID, NumberInputControlID, PaletteSelectorWindowButtonID, RibbonUIControlID, SideBarContentID, SubToolViewItem } from './ui'
import { UI_CommandButtonItem } from './ui-common-controls'
import { UI_Dialog_DocumentFiler_DialogType } from './ui-dialog-screen'
import { ExportImageFileParam } from './ui-modal-window'
import { UI_SelectBoxOption } from './ui-popover'
import { UI_SideBarContentInfo } from './ui-sidebar'
import { LocalSetting, ShortcutCommandID, UIStateNames } from './user-setting'
import { ViewCoordinateLogic, ViewOperationMode } from './view'
import { PointerInputWindow } from './view/view-pointer_event'
import { PointerInputLogic } from './view/pointer-input'

export interface AppEvent_Main_Interface {

  executeSubToolKeyDown(key: string, commandID: ShortcutCommandID): boolean
  executeSubToolMouseDown(e: ToolPointerEvent)
  executeSubToolMouseMove(e: ToolPointerEvent)
  executeSubToolMouseUp(e: ToolPointerEvent)
  executeUndo()
  executeRedo()
  executePostUpdateForCurrentLayer()
  executePostUpdate()

  resetDocument()
  saveDocument()
  saveAsDocument(directoryPath: string, fileName: string)
  startReloadDocument(filepath: string)
  startReloadDocumentFromFile(file: File, url: string)
  isEventDisabled(): boolean
  isWhileLoading(): boolean
  onWindowBlur()
  onWindowFocus()
  setDefferedWindowResize()
  executeLayerCommand(layerCommand: Command_Layer_CommandBase)
  updateForLayerProperty()
  setCurrentFrame(frame: int)
  getLocalSetting(): LocalSetting
  exportImageFile(param: ExportImageFileParam)
  setUIStateVisible(uiStateName: string, visible: boolean)
  setOperatorCursorLocationToMouse()
}

export class AppKeyboardEvent {

  e: KeyboardEvent = null
  key: string = ''
  shiftKey: boolean = false
  ctrlKey: boolean = false
  altKey: boolean = false

  attach(e: KeyboardEvent): AppKeyboardEvent {

    this.e = e
    this.key = e.key
    this.shiftKey = e.shiftKey
    this.ctrlKey = e.ctrlKey
    this.altKey = e.altKey

    return this
  }

  set(e: { key: string, ctrlKey?: boolean, altKey?: boolean, shiftKey?: boolean }): AppKeyboardEvent {

    this.key = e.key
    this.shiftKey = (e.shiftKey === true)
    this.ctrlKey = (e.ctrlKey === true)
    this.altKey = (e.altKey === true)

    return this
  }

  preventDefault() {

    if (this.e != null) {

      this.e.preventDefault()
    }
  }
}

export class App_Event {

  isEventSetDone = false

  private appView: App_View = null
  private appDrawing: App_Drawing = null
  private appDocument: App_Document = null
  private appUserSetting: App_UserSetting = null
  private appTool: App_Tool = null
  private appMain: AppEvent_Main_Interface = null

  private documentContext: DocumentContext = null
  private subtoolContext: SubToolContext = null

  private lastHoverLayoutArea: RectangleLayoutArea = null

  private tempVec3 = vec3.create()
  private tempColor4 = vec4.create()

  link(view: App_View, drawing: App_Drawing, appDocument: App_Document, apptool: App_Tool, appPreferences: App_UserSetting, main: AppEvent_Main_Interface) {

    this.appView = view
    this.appDrawing = drawing
    this.appDocument = appDocument
    this.appTool = apptool
    this.appMain = main
    this.appUserSetting = appPreferences
  }

  linkContexts(docContext: DocumentContext, toolContext: SubToolContext) {

    this.documentContext = docContext
    this.subtoolContext = toolContext
  }

  setEvents() {

    this.isEventSetDone = true

    this.setCanvasWindowMouseEvent(this.appView.editorWindow, this.appView.mainWindow
      , this.mainWindow_mousedown
      , this.mainWindow_mousemove
      , this.mainWindow_mouseup
      , this.mainWindow_mousewheel
      , false
    )

    this.setCanvasWindowMouseEvent(this.appView.timeLineWindow.canvasWindow, this.appView.timeLineWindow.canvasWindow
      , this.timeLineWindow_mousedown
      , this.timeLineWindow_mousemove
      , null
      , this.timeLineWindow_mousewheel
      , false
    )

    document.addEventListener('keydown', (e: KeyboardEvent) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      if (document.activeElement.nodeName == 'INPUT') {
        return
      }

      this.document_keydown(new AppKeyboardEvent().attach(e))
    })

    document.addEventListener('keyup', (e: KeyboardEvent) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      if (document.activeElement.nodeName == 'INPUT') {
        return
      }

      this.document_keyup(new AppKeyboardEvent().attach(e))
    })

    window.addEventListener('resize', () => {

      this.htmlWindow_resize()
    })

    window.addEventListener('contextmenu', (e: Event) => {

      return this.htmlWindow_contextmenu(e)
    })

    window.addEventListener('blur', () => {

      // cancel all to flush invalid pointers
      PointerInputLogic.cancelAllPointers(this.appView.editorWindow.pointerEvent)

      this.appMain.onWindowBlur()
    })

    window.addEventListener('focus', () => {

      this.appMain.onWindowFocus()
    })

    document.addEventListener('dragover', (e: DragEvent) => {

      e.stopPropagation()
      e.preventDefault()

      if (this.appMain.isEventDisabled()) {
        return
      }

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

      e.stopPropagation()
      e.preventDefault()

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.document_drop(e)
    })

    // React components

    this.appView.headerWindow.uiHeaderWindowRef.commandButton_Click = (id) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.menuButton_Click(id)
    }

    this.appView.footerWindow.uiFooterOperationpanelRef.button_Click = (id) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.menuButton_Click(id)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.ribbonUITabsRef.item_Clicked = (tabID) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.ribbonUI_TabClick(tabID)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.button_Clicked = (id) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.ribbonUI_button_Click(id)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.subtoolButton_Clicked = (subtoolID) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.subtoolButton_Click(subtoolID)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.mainMenuButtonRef.commandButton_Clicked = (id) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.menuButton_Click(id)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.toggleButton_Clicked = (id, value) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.ribbonUI_toggleButton_Click(id, value)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.textInput_Changed = (id, value) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.ribbonUI_textInput_Change(id, value)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.numberInput_Changed = (id, value, isModal = false) => {

      if (this.appMain.isEventDisabled() && !isModal) {
        return
      }

      this.ribbonUI_NumberInput_Changed(id, value)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.checkBox_Changed = (id, checked, value) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.ribbonUI_checkBox_Change(id, checked, value)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.selectBox_Changed = (id, selected_Option) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.ribbonUI_selectBox_Change(id, selected_Option)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.documentFrame_Changed = (left, top, width, height) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.documentFrame_Change(left, top, width, height)
    }

    this.appView.ribbonUIWindow.uiRibbonUIRef.documentViewSettings_Changed = (new_defaultViewScale) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.documentViewSettings_change(new_defaultViewScale)
    }

    this.appView.subToolWindow.uiSubToolWindowRef.item_Click = (item) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.subtoolWindow_Item_Click(item)
    }

    this.appView.subToolWindow.uiSubToolWindowRef.itemButton_Click = (item) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.subtoolWindow_Button_Click(item)
    }

    const updateSideBarUIStateVisible = (cotentInfo: UI_SideBarContentInfo) => {

      const setting = this.appView.sideBarContentStateSettings.find(st => st.contentID == cotentInfo.id)

      this.appMain.setUIStateVisible(setting.uiStateName, cotentInfo.isOpened)
    }

    this.appView.right_SideBarContainerRef.onContentOpened = (cotentInfo) => {

      if (cotentInfo.id == SideBarContentID.colorMixerWindow) {

        this.documentContext.redrawColorMixerSample = true
      }

      updateSideBarUIStateVisible(cotentInfo)
    }

    this.appView.right_SideBarContainerRef.onContentClosed = (cotentInfo) => {

      updateSideBarUIStateVisible(cotentInfo)
    }

    this.layerWindow_SetEvents()

    this.appView.paletteSelectorWindow.uiRef.commandButton_Click = ((item) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

        this.paletteSelectorWindow_CommandButton_Click(item)
    })

    this.appView.paletteSelectorWindow.uiRef.item_Click = ((paletteColorIndex, item) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

        this.paletteSelectorWindow_Item_Click(paletteColorIndex, item)
    })

    this.setCanvasWindowMouseEvent(this.appView.colorMixerWindow.colorCanvas, this.appView.colorMixerWindow.colorCanvas
      , this.colorMixerWindow_colorCanvas_mousedown
      , this.colorMixerWindow_colorCanvas_mousedown
      , null
      , null
      , false
    )

    this.appView.colorMixerWindow.uiRef.color_Change = (newColor: Vec4) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.colorMixerWindow_changeColor(newColor)
    }

    this.appView.timeLineWindow.uiTimeLineWindowRef.numberInput_Changed = (id, value) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.numberInput_Changed(id, value)
    }

    this.appView.timeLineWindow.uiTimeLineWindowRef.commandButton_Clicked = (item) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.menuButton_Click(item.index)
    }

    this.appView.modalWindow.uiImageFileReferenceRef.onClose = (filePath, image) => {

      this.modal_ImageFileReference_Closed(filePath, image)
    }

    this.appView.modalWindow.uiExportImageRef.onClose = (param) => {

      this.modal_ExportImage_Closed(param)
    }

    this.appView.dialogScreen.uiDocumentFilerRef.fileItem_Selected = (filePath: string) => {

      this.dialog_DocumentFiler_fileItemSelected(filePath)
    }

    this.appView.dialogScreen.uiDocumentFilerRef.filePath_Fixed = (directoryPath: string, fileName: string) => {

      this.dialog_DocumentFiler_filePathFixed(directoryPath, fileName)
    }

    // Custmbox dialogs
    // TODO: replace to React
    document.addEventListener('custombox:content:open', () => {
      this.appView.dialogScreen.onDialogWindowShown()
    })

    document.addEventListener('custombox:content:close', () => {
      this.onModalWindowClosed()
    })
    this.setEvents_ModalCloseButton(this.appView.dom.ID.messageDialogModal_ok)
    this.setEvents_ModalCloseButton(this.appView.dom.ID.openFileDialogModal_ok)
    this.setEvents_ModalCloseButton(this.appView.dom.ID.openFileDialogModal_cancel)
  }

  setCanvasWindowMouseEvent(
    eventCanvasWindow: CanvasWindow,
    drawCanvasWindew: PointerInputWindow,
    pointerDown: () => void,
    pointerMove: () => void,
    pointerUp: () => void,
    wheel: () => void,
    isModal: boolean
  ) {

    const eventElement = eventCanvasWindow.canvas

    const getActivePointerText = () => {
      return drawCanvasWindew.pointerEvent.activePointers.map(p => `${p.identifier.toString()}:${p.pressed}`).join(' ')
    }

    if (pointerDown != null) {

      eventElement.addEventListener('pointerdown', (e: PointerEvent) => {

        if (this.appMain.isEventDisabled() && !isModal) {
          return
        }

        // if (drawCanvasWindew.pointerEvent.activePointers.length > 0) {
        //   console.log('pointerdown active pointer', drawCanvasWindew.pointerEvent.activePointers[0].identifier)
        // }

        if (!PointerInputLogic.hasActivePointer(e.pointerId, drawCanvasWindew.pointerEvent)) {

          // console.log('setPointerCapture', e.pointerId)
          eventElement.setPointerCapture(e.pointerId)
        }

        if (this.appView.activeCanvasWindow != drawCanvasWindew) {

          this.appView.activeCanvasWindow = drawCanvasWindew

          // console.log('pointerdown active window changed')
        }

        PointerInputLogic.processSinglePointerEvent(
          drawCanvasWindew,
          e,
          this.documentContext,
          true,
          false
        )

        PointerInputLogic.processMultiPointerEvent(
          drawCanvasWindew,
          e,
          true,
          false
        )

        pointerDown.call(this)

        e.preventDefault()

        // console.debug('pointerdown after', e.pointerId, 'actives:', getActivePointerText())
      })
    }

    if (pointerMove != null) {

      eventElement.addEventListener('pointermove', (e: PointerEvent) => {

        if (this.appMain.isEventDisabled() && !isModal) {
          return
        }

        // console.debug('pointermove', e.pointerId, 'actives:', getActivePointerText())

        // skip if pointermove event occurred after pointer up in iOS Safari
        const isMoved = PointerInputLogic.isPointerMovedOnDevice(drawCanvasWindew.pointerEvent, e)

        if (isMoved) {

          PointerInputLogic.processSinglePointerEvent(
            drawCanvasWindew,
            e,
            this.documentContext,
            false,
            false
          )

          PointerInputLogic.processMultiPointerEvent(
            drawCanvasWindew,
            e,
            false,
            false
          )

          pointerMove.call(this)
        }

        e.preventDefault()

        // console.debug('pointermove after', e.pointerId, 'actives:', getActivePointerText())
      })
    }

    if (pointerUp != null) {

      const callback = (e: PointerEvent) => {

        if (this.appMain.isEventDisabled() && !isModal) {
          return
        }

        // console.debug('pointerup before', e.pointerId, 'actives:', getActivePointerText())

        if (PointerInputLogic.hasActivePointer(e.pointerId, drawCanvasWindew.pointerEvent)) { // preventing duplicate pointerup event in safari

          PointerInputLogic.processSinglePointerEvent(
            drawCanvasWindew,
            e,
            this.documentContext,
            false,
            true
          )

          PointerInputLogic.processMultiPointerEvent(
            drawCanvasWindew,
            e,
            false,
            true
          )

          pointerUp.call(this)
        }

        // console.debug('pointerup after', e.pointerId, 'actives:', getActivePointerText())

        e.preventDefault()
      }

      eventElement.addEventListener('pointerup', (e) => {

        // console.debug('pointerup', e.pointerId)

        callback(e)
      })

      eventElement.addEventListener('pointerleave', (e) => {

        callback(e)

        PointerInputLogic.processMultiPointerLeaveEvent(
          drawCanvasWindew,
          e
        )

        // console.debug('pointerleave', e.pointerId, 'actives:', getActivePointerText())
      })
    }

    eventElement.addEventListener('pointerenter', (e) => {

      if (this.appView.activeCanvasWindow != drawCanvasWindew) {
        this.appView.activeCanvasWindow = drawCanvasWindew
        // console.log('pointerenter active window changed', e.pointerId)
      }

      // console.debug('pointerenter', e.pointerId, 'actives:', getActivePointerText())
    })

    if (wheel != null) {

      eventCanvasWindow.canvas.addEventListener('wheel', (e: MouseEvent) => {

        if (this.appMain.isEventDisabled() && !isModal) {
          return
        }

        PointerInputLogic.getWheelInfo(drawCanvasWindew.pointerEvent, e)

        wheel.call(this)

        e.preventDefault()
      })
    }

    eventElement.addEventListener('touchstart', (e: TouchEvent) => {

      // Prevent page navigation by touch event
      e.preventDefault()
    })

    eventElement.addEventListener('touchmove', (e: TouchEvent) => {

      // Prevent page navigation by touch event
      e.preventDefault()
    })

    eventElement.addEventListener('touchend', (e: TouchEvent) => {

      // Prevent page navigation by touch event
      e.preventDefault()
    })
  }

  setEvents_ModalCloseButton(id: string) {

    this.appView.dom.getElement<HTMLElement>(id).addEventListener('click', (e: Event) => {

      this.appView.dialogScreen.currentModalDialogResult = id

      this.appView.dialogScreen.closeDialogWindow()

      e.preventDefault()
    })
  }

  updateHierarchicalStatesRecursive() {

    LayerLogic.updateHierarchicalStatesRecursive(this.documentContext.documentData.rootLayer)
  }

  document_keydown(e: AppKeyboardEvent) {

    const docContext = this.documentContext
    const subtoolContext = this.subtoolContext
    const wnd = this.appView.mainWindow
    const isModalToolRunning = this.appTool.isModalToolRunning()

    e.preventDefault()

    docContext.shiftKey = e.shiftKey
    docContext.ctrlKey = e.ctrlKey
    docContext.altKey = e.altKey

    subtoolContext.updateContext()

    const commandID = this.appUserSetting.shortcutKey.getCommandIDFromKeyInput(e.key, e.shiftKey, e.ctrlKey, e.altKey)

    if (!isModalToolRunning) {

      if (this.appTool.executeMainToolKeyDown(e.key, commandID)) {
        return
      }
    }

    if (isModalToolRunning && e.key == 'Escape') {

      this.appTool.cancelModalTool()
      return
    }

    if (this.appMain.executeSubToolKeyDown(e.key, ShortcutCommandID.none)) {
      return
    }

    if (isModalToolRunning) {
      return
    }

    if (this.appView.viewOperation.isViewOperationRunning()) {
      e.preventDefault()
      return
    }

    if (commandID == ShortcutCommandID.view_pan
      && !this.appView.viewOperation.isViewOperationRunning()
      && this.appView.activeCanvasWindow == this.appView.mainWindow
    ) {

      this.appView.viewOperation.startViewOperation(ViewOperationMode.pan, wnd, null, subtoolContext)
      return
    }

    if (commandID == ShortcutCommandID.edit_setPibot && subtoolContext.needsDrawOperatorCursor()) {

      this.appMain.setOperatorCursorLocationToMouse()
    }

    if (subtoolContext.isEditMode()) {

      if (this.appMain.executeSubToolKeyDown(e.key, commandID)) {
        return
      }
    }

    if (commandID == ShortcutCommandID.tool_toggleMainEdit) {

      // Change mode
      if (subtoolContext.isDrawMode()) {

        this.appTool.changeCurrentMainToolForEditMode(EditModeID.editMode)
      }
      else {

        this.appTool.changeCurrentMainToolForEditMode(EditModeID.drawMode)
      }

      subtoolContext.setRedrawWindowsForCurrentToolChanging()

      return
    }

    if (commandID == ShortcutCommandID.edit_undo) {

      this.inputKey_undo_down()
      return
    }

    if (commandID == ShortcutCommandID.document_new) {

      this.menuButton_Click(MainCommandButtonID.newFile)

      return
    }

    if (commandID == ShortcutCommandID.edit_redo) {

      this.inputKey_redo_down()
      return
    }

    if (commandID == ShortcutCommandID.edit_copy) {

      this.inputKey_copy_down()
      return
    }

    if (commandID == ShortcutCommandID.edit_paste) {

      this.inputKey_paste_down()
      return
    }

    if (commandID == ShortcutCommandID.timeline_previousKeyframe || commandID == ShortcutCommandID.timeline_nextKeyframe) {

      let addFrame = 1
      if (commandID == ShortcutCommandID.timeline_previousKeyframe) {
        addFrame = -addFrame
      }

      const frame = this.appView.viewKeyframe.findNextViewKeyframeFrame(this.documentContext, docContext.documentData.animationSettingData.currentTimeFrame, addFrame)

      this.appMain.setCurrentFrame(frame)
    }

    if (commandID == ShortcutCommandID.edit_cut || commandID == ShortcutCommandID.edit_delete) {

      const withCut = (commandID == ShortcutCommandID.edit_cut)

      this.inputKey_delete_down(withCut)
      return
    }

    if (commandID == ShortcutCommandID.view_reset || commandID == ShortcutCommandID.view_toggleHome) {

      const reset = (commandID == ShortcutCommandID.view_reset)
      this.appView.viewOperation.toggletHome(this.appView.mainWindow, reset, subtoolContext)

      return
    }

    if (commandID == ShortcutCommandID.view_rotateCW || commandID == ShortcutCommandID.view_rotateCCW) {

      const clockwise = (commandID == ShortcutCommandID.view_rotateCW)

      this.appView.viewOperation.addViewRotation(10.0, clockwise, wnd, subtoolContext)
      return
    }

    if (commandID == ShortcutCommandID.view_mirrorX) {

      this.appView.mainWindow.mirrorX = !this.appView.mainWindow.mirrorX
      subtoolContext.setRedrawMainWindowEditorWindow()
      return
    }

    if (commandID == ShortcutCommandID.view_zoomIn || commandID == ShortcutCommandID.view_zoomOut) {

      let addScale = 1.0 + this.appDrawing.drawStyle.viewZoomAdjustingSpeedRate

      if (commandID == ShortcutCommandID.view_zoomOut) {

        addScale = 1 / addScale
      }

      this.appView.viewOperation.addViewScale(addScale, wnd, subtoolContext)

      return
    }

    if (subtoolContext.isCtrlKeyPressing() && (e.key == 'ArrowLeft' || e.key == 'ArrowRight' || e.key == 'ArrowUp' || e.key == 'ArrowDown')) {

      let x = 0.0
      let y = 0.0
      if (e.key == 'ArrowLeft') {
        x = -10.0
      }
      else if (e.key == 'ArrowRight') {
        x = 10.0
      }
      else if (e.key == 'ArrowUp') {
        y = -10.0
      }
      else if (e.key == 'ArrowDown') {
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

      subtoolContext.setRedrawMainWindowEditorWindow()

      return
    }

    if (!subtoolContext.isCtrlKeyPressing() && (e.key == 'ArrowLeft' || e.key == 'ArrowRight')) {

      let addFrame = 1
      if (e.key == 'ArrowLeft') {
        addFrame = -addFrame
      }

      this.appMain.setCurrentFrame(docContext.documentData.animationSettingData.currentTimeFrame + addFrame)
    }

    if (commandID == ShortcutCommandID.layer_previousLayer || commandID == ShortcutCommandID.layer_nextLayer) {

      const moveDown = (commandID == ShortcutCommandID.layer_nextLayer)

      this.appTool.selectNextOrPreviousLayer(moveDown)

      this.appView.layerHighlight.startShowingCurrentLayer(this.documentContext, this.subtoolContext)
      this.appView.layerWindow.scrollToLayer(this.documentContext.currentLayer, this.documentContext)

      subtoolContext.setRedrawWindowsForCurrentLayerChanging()
      return
    }

    if (commandID == ShortcutCommandID.document_save) {

      this.appMain.saveDocument()
      return
    }

    if (commandID == ShortcutCommandID.layer_pickLayer) {

      const pickX = this.appView.mainWindow.pointerEvent.offsetX
      const pickY = this.appView.mainWindow.pointerEvent.offsetY
      const pickedLayer = this.appDrawing.pickLayer(this.appView.mainWindow, docContext.documentData, pickX, pickY)

      if (pickedLayer != null) {

        this.appTool.selectLayer(pickedLayer)
        this.appView.layerHighlight.startShowingCurrentLayer(this.documentContext, this.subtoolContext)
        this.appView.layerWindow.scrollToLayer(pickedLayer, this.documentContext)
      }
      else {

        subtoolContext.setRedrawMainWindowEditorWindow()
      }

      return
    }

    if (commandID == ShortcutCommandID.edit_fix) {

      this.appMain.executeSubToolKeyDown(e.key, commandID)
    }

    if (e.key == '-') {

      docContext.drawCPUOnly = !this.documentContext.drawCPUOnly
      subtoolContext.setRedrawMainWindow()
    }
  }

  document_keyup(e: AppKeyboardEvent) {

    this.documentContext.shiftKey = e.shiftKey
    this.documentContext.altKey = e.altKey
    this.documentContext.ctrlKey = e.ctrlKey

    const commandID = this.appUserSetting.shortcutKey.getCommandIDFromKeyInput(e.key, e.shiftKey, e.ctrlKey, e.altKey)

    if (commandID == ShortcutCommandID.view_pan) {

      if (this.appView.viewOperation.isViewOperationRunning()) {

        this.appView.viewOperation.endViewOperation(this.appView.mainWindow, true, this.subtoolContext)
      }
    }
  }

  inputKey_undo_down() {

    this.appMain.executeUndo()
  }

  inputKey_redo_down() {

    this.appMain.executeRedo()
  }

  inputKey_copy_down() {

    if (!this.subtoolContext.isEditMode()) {
      return
    }

    if (this.documentContext.activeVectorGroup != null) {

      const command = new Command_CopyGeometry()

      if (command.prepareEditData(this.subtoolContext)) {

        command.execute(this.subtoolContext)
      }
    }
  }

  inputKey_paste_down() {

    const command = new Command_PasteGeometry()

    command.prepareEditData(this.subtoolContext)
      .then((isAvailable) => {

        if (!isAvailable) {
          return
        }

        this.appTool.tool_SelectAllPoints.executeClearSelectAll(this.subtoolContext)

        this.documentContext.commandHistory.executeCommand(command, this.subtoolContext)

        this.appMain.executePostUpdate()

        this.subtoolContext.setRedrawCurrentLayer()

        if (this.subtoolContext.isEditMode()) {
          // TODO: 決め打ちではなくす
          this.appTool.executeMainToolKeyDown('', ShortcutCommandID.tool_subTool3)
        }
      })
  }

  inputKey_delete_down(withCut: boolean) {

    if (!this.subtoolContext.isEditMode()) {
      return
    }

    if (this.subtoolContext.isCurrentLayerStrokeDrawableLayer() || this.subtoolContext.isCurrentLayerGroupLayer()) {

      const command = new Command_VectorLayer_DeleteSelected()

      if (command.prepare(this.subtoolContext)) {

        if (withCut) {

          const copyCommand = new Command_CopyGeometry()
          if (copyCommand.prepareEditData(this.subtoolContext)) {

            copyCommand.execute(this.subtoolContext)
          }
        }

        this.subtoolContext.commandHistory.executeCommand(command, this.subtoolContext)

        this.appMain.executePostUpdate()

        this.subtoolContext.setRedrawMainWindow()
      }
    }
  }

  inputKey_draw_down() {

    if (!this.subtoolContext.isDrawMode()) {
      return
    }

    this.appTool.changeCurrentSubToolForSubtoolID(SubToolID.drawLine)

    this.appTool.updateFooterMessage()
  }

  inputKey_eraser_down() {

    if (!this.subtoolContext.isDrawMode()) {
      return
    }

    if (this.documentContext.subtoolID != SubToolID.deletePointBrush) {

      this.appTool.changeCurrentSubToolForSubtoolID(SubToolID.deletePointBrush)
    }
    else {

      this.appTool.changeCurrentSubToolForSubtoolID(SubToolID.drawLine)
    }

    this.appTool.updateFooterMessage()
  }

  inputKey_scratchLine_down() {

    this.document_keydown(new AppKeyboardEvent().set({ key: '3' }))
  }

  document_drop(e: DragEvent) {

    // Check file exists
    if (e.dataTransfer.files.length == 0) {

      console.error(new Error('ERROR-0000:no dropped files'))
      return
    }

    // Get file path or name
    const file = e.dataTransfer.files[0]

    let filePath = ''
    if ('path' in file) {
      filePath = file['path'] as string
    }
    else {
      filePath = file.name
    }

    if (Strings.isNullOrEmpty(filePath)) {

      console.error(new Error('ERROR-0000:cannot get file path'))
      return
    }

    // Start loading document
    this.appMain.startReloadDocumentFromFile(
      file,
      Platform.path.getPlatformIndependentPath(filePath)
    )
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
    const toolPointerEvent = this.appView.tooPointerEvent.attach(wnd)

    this.subtoolContext.updateContext()

    // console.log('mainWindow_mousedown', e.offsetX, e.offsetY)

    // Operation UI
    if (!this.appTool.isModalToolRunning() && !this.appView.viewOperation.isViewOperationRunning()) {

      this.mainWindow_mousedown_OperationUI(toolPointerEvent)
    }

    if (this.appView.viewOperation.isViewOperationRunning()) {

      this.appView.viewOperation.pointerDownAdditional(wnd)
      return
    }

    if (this.operationUI_IsHoverWhenNoModalTool(toolPointerEvent)) {
      return
    }

    // Current tool
    if (this.appTool.isModalToolRunning()) {

      if (this.appTool.isCurrentSubToolAvailable()) {

        this.appMain.executeSubToolMouseDown(toolPointerEvent)
      }
    }
    else {

      if (this.appTool.isCurrentSubToolAvailable()) {

        this.appMain.executeSubToolMouseDown(toolPointerEvent)
      }
    }

    // View operations
    if (toolPointerEvent.isRightButtonPressing && this.subtoolContext.isShiftKeyPressing()) {

      this.appMain.setOperatorCursorLocationToMouse()
    }
    else if (toolPointerEvent.isRightButtonPressing || toolPointerEvent.isCenterButtonPressing) {

      this.appView.viewOperation.startViewOperation(ViewOperationMode.pan, wnd, null, this.subtoolContext)
    }
    else if (this.appView.viewOperation.isViewOperationRunning()) {

      this.appView.viewOperation.endViewOperation(wnd, false, this.subtoolContext)
    }
  }

  mainWindow_mousemove() {

    const wnd = this.appView.mainWindow
    const toolPointerEvent = this.appView.tooPointerEvent.attach(wnd)

    this.subtoolContext.updateContext()

    // View operations
    if (this.appView.viewOperation.isViewOperationRunning()) {

      this.appView.viewOperation.processViewOperation(wnd, toolPointerEvent, this.subtoolContext)
      return
    }

    // Operation UI
    if (!this.appTool.isModalToolRunning()) {

      if (this.mainWindow_mousemove_OperationUI(toolPointerEvent)) {

        this.subtoolContext.setRedrawEditorWindow()
      }
    }

    if (this.operationUI_IsHoverWhenNoModalTool(toolPointerEvent)) {
      return
    }

    // Current tool
    if (this.appTool.isModalToolRunning()) {

      // console.log(`mainWindow_mousemove (${e.location[0]} ${e.location[1]})`)

      if (this.appTool.isCurrentSubToolAvailable()) {

        this.appMain.executeSubToolMouseMove(toolPointerEvent)
      }
    }
    else if (this.subtoolContext.isDrawMode()) {

      this.appMain.executeSubToolMouseMove(toolPointerEvent)
    }
    else if (this.subtoolContext.isEditMode()) {

      this.appMain.executeSubToolMouseMove(toolPointerEvent)
    }
  }

  mainWindow_mouseup() {

    const wnd = this.appView.mainWindow
    const toolPointerEvent = this.appView.tooPointerEvent.attach(wnd)

    this.subtoolContext.updateContext()

    if (this.appView.viewOperation.isViewOperationRunning()) {

      this.appView.viewOperation.endViewOperation(wnd, false, this.subtoolContext)
      return
    }

    if (this.operationUI_IsHoverWhenNoModalTool(toolPointerEvent)) {
      return
    }

    this.appMain.executeSubToolMouseUp(toolPointerEvent)
  }

  mainWindow_mousewheel() {

    const wnd = this.appView.mainWindow
    const toolPointerEvent = wnd.pointerEvent

    // View operations
    if (toolPointerEvent.wheelDelta != 0.0) {

      let addScale = 1.0 + this.appDrawing.drawStyle.viewZoomAdjustingSpeedRate * 0.5

      if (toolPointerEvent.wheelDelta < 0.0) {

        addScale = 1.0 / addScale
      }

      this.appView.viewOperation.addViewScale(addScale, wnd, this.subtoolContext)
    }

    ViewCoordinateLogic.calculateTransfomredMouseParams(this.subtoolContext.mouseCursorLocation, toolPointerEvent, wnd)
  }

  mainWindow_mousedown_OperationUI(e: ToolPointerEvent): boolean {

    const area = this.appView.operationPanel.hittestToButtons(e)

    if (area != null) {

      this.operationUI_Click(area, this.appView.mainWindow)

      return true
    }

    if (this.operationUI_IsHover(e)) {

      return true
    }

    return false
  }

  operationUI_IsHover(e: ToolPointerEvent): boolean {

    return (this.appView.operationPanel.hittestToPanel(e) != null)
  }

  operationUI_IsHoverWhenNoModalTool(e: ToolPointerEvent): boolean {

    return !this.appTool.isModalToolRunning() && (this.appView.operationPanel.hittestToPanel(e) != null)
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

    switch (id) {

      case MainCommandButtonID.openFile:
        this.appView.dialogScreen.openDocumentFilerDialog(
          UI_Dialog_DocumentFiler_DialogType.open,
          '',
          this.appUserSetting.settingFile
        )
        break

      case MainCommandButtonID.newFile:
        this.appMain.resetDocument()
        break

      case MainCommandButtonID.saveFile:
        this.appMain.saveDocument()
        break

      case MainCommandButtonID.saveAs:
        this.appView.dialogScreen.openDocumentFilerDialog(
          UI_Dialog_DocumentFiler_DialogType.saveAS,
          this.documentContext.documentFilePath,
          this.appUserSetting.settingFile
        )
        break

      case MainCommandButtonID.export:
        this.appView.modalWindow.openExportImageModal(
          this.documentContext,
          this.appMain.getLocalSetting()
        )
        break

      case MainCommandButtonID.shortcutKeys:
        this.appView.dialogScreen.openShortcutKeysDialog(
          this.appUserSetting.settingFile,
          this.appUserSetting.shortcutKey
        )
        break

      case MainCommandButtonID.copy:
        this.inputKey_copy_down()
        break

      case MainCommandButtonID.paste:
        this.inputKey_paste_down()
        break

      case MainCommandButtonID.cut:
        this.inputKey_delete_down(true)
        break

      case MainCommandButtonID.undo:
        this.inputKey_undo_down()
        break

      case MainCommandButtonID.redo:
        this.inputKey_redo_down()
        break

      case MainCommandButtonID.touchOperationPanel:
        this.appView.operationPanel.toggleVisibility()
        this.appMain.setUIStateVisible(UIStateNames.touchOperationPanel, this.appView.operationPanel.isVisible())
        this.subtoolContext.setRedrawEditorWindow()
        break

      case MainCommandButtonID.layerWindow:
        this.appView.right_SideBarContainerRef.toggleVisibility(SideBarContentID.layerWindow)
        break

      case MainCommandButtonID.paletteWindow:
        this.appView.right_SideBarContainerRef.toggleVisibility(SideBarContentID.paletteWindow)
        break

      case MainCommandButtonID.colorMixerWindow:
        this.appView.right_SideBarContainerRef.toggleVisibility(SideBarContentID.colorMixerWindow)
        break

      case MainCommandButtonID.timeLineWindow:
        this.appView.timeLineWindow.toggleVisibility()
        this.appMain.setUIStateVisible(UIStateNames.timeLineWindow, this.appView.timeLineWindow.isVisible())
        this.subtoolContext.setRedrawTimeLineWindow()
        break

      case MainCommandButtonID.timeLine_inertKeyframe:
        this.appView.modalWindow.showRadioSelectionModal(
          'キーフレームの挿入',
          [
            { index: NewKeyframeTypeID.insertToCurrentFrameAllLayer, label: 'コピーを挿入（全レイヤー）' },
            { index: NewKeyframeTypeID.insertToCurrentFrameActiveLayer, label: 'コピーを挿入（アクティブなレイヤー）' },
            { index: NewKeyframeTypeID.insertEmptyToAllLayer, label: '空のキーを挿入（全レイヤー）' },
            { index: NewKeyframeTypeID.insertEmptyToActiveLayer, label: '空のキーを挿入（アクティブなレイヤー）' },
          ],
          NewKeyframeTypeID.insertToCurrentFrameAllLayer,
          (option) => {
            this.appDocument.executeNewKeyframe(option.index)
          }
        )
        break

      case MainCommandButtonID.timeLine_deleteKeyframe:
        this.appView.modalWindow.showRadioSelectionModal(
          'キーフレームの削除',
          [
            { index: DeleteKeyframeTypeID.deleteCurrentFrameAllLayer, label: 'キーを削除（全レイヤー）' },
            { index: DeleteKeyframeTypeID.deleteCurrentFrameActiveLayer, label: 'キーを削除（アクティブなレイヤー）' },
          ],
          NewKeyframeTypeID.insertToCurrentFrameAllLayer,
          (option) => {
            this.appDocument.executeDeleteKeyframe(option.index)
          }
        )
        break

      case MainCommandButtonID.timeLine_moveKeyframe_minus:
      case MainCommandButtonID.timeLine_moveKeyframe_plus:
        this.appDocument.moveKeyframe(id == MainCommandButtonID.timeLine_moveKeyframe_plus)
        break

      case MainCommandButtonID.timeLine_changeMaxFrame_minus:
      case MainCommandButtonID.timeLine_changeMaxFrame_plus:
        this.appDocument.changeAnimationMaxFrame(id == MainCommandButtonID.timeLine_changeMaxFrame_plus)
        break

      case MainCommandButtonID.timeLine_changeLoopStartFrame_minus:
      case MainCommandButtonID.timeLine_changeLoopStartFrame_plus:
        this.appDocument.changeLoopStartFrame(id == MainCommandButtonID.timeLine_changeLoopStartFrame_plus)
        break

      case MainCommandButtonID.timeLine_changeLoopEndFrame_minus:
      case MainCommandButtonID.timeLine_changeLoopEndFrame_plus:
        this.appDocument.changeLoopEndFrame(id == MainCommandButtonID.timeLine_changeLoopEndFrame_plus)
        break

      case MainCommandButtonID.timeLine_changeOnionSkinBackwardLevel_minus:
      case MainCommandButtonID.timeLine_changeOnionSkinBackwardLevel_plus:
        this.appDocument.changeOnionSkinBackwardLevel(id == MainCommandButtonID.timeLine_changeOnionSkinBackwardLevel_plus)
        break

      case MainCommandButtonID.timeLine_changeOnionSkinForwardLevel_minus:
      case MainCommandButtonID.timeLine_changeOnionSkinForwardLevel_plus:
        this.appDocument.changeOnionSkinForwardLevel(id == MainCommandButtonID.timeLine_changeOnionSkinForwardLevel_plus)
        break
    }
  }

  numberInput_Changed(id: NumberInputControlID, value: int) {

    switch(id) {

      case NumberInputControlID.onionSkinMode:
        this.appDocument.changeOnionSkinMode(value)
        break
    }
  }

  operationUI_Click(area: RectangleLayoutArea, wnd: PointerInputWindow) {

    switch(area.index) {

      case OperationPanelButtonID.view_move:
        this.appView.viewOperation.startViewOperation(ViewOperationMode.pan, wnd, area, this.subtoolContext)
        break

      case OperationPanelButtonID.view_rotate:
        this.appView.viewOperation.startViewOperation(ViewOperationMode.rotate, wnd, area, this.subtoolContext)
        break

      case OperationPanelButtonID.view_zoom:
        this.appView.viewOperation.startViewOperation(ViewOperationMode.zoom, wnd, area, this.subtoolContext)
        break

      case OperationPanelButtonID.draw:
        this.inputKey_draw_down()
        break

      case OperationPanelButtonID.eraser:
        this.inputKey_eraser_down()
        break

      case OperationPanelButtonID.scratchLine:
        this.inputKey_scratchLine_down()
        break
    }
  }

  onNewLayerDiaglogClosed(newLayerType: int) {

    let layerCommand: Command_Layer_CommandBase = null

    switch(newLayerType) {

      case NewLayerTypeID.vectorLayer:{
        const command = new Command_Layer_AddVectorLayerToCurrentPosition()
        command.newLayer_layerType = LayerTypeID.vectorLayer
        layerCommand = command
        break
      }

      case NewLayerTypeID.surroundingFill: {
        const command = new Command_Layer_AddVectorLayerToCurrentPosition()
        command.newLayer_layerType = LayerTypeID.surroundingFillLayer
        layerCommand = command
        break
      }

      case NewLayerTypeID.pointBrushFill:{
        const command = new Command_Layer_AddVectorLayerToCurrentPosition()
        command.newLayer_layerType = LayerTypeID.pointBrushFillLayer
        layerCommand = command
        break
      }

      case NewLayerTypeID.autoFill:
        layerCommand = new Command_Layer_AddAutoFillLayerToCurrentPosition()
        break

      case NewLayerTypeID.vectorLayerReferenceLayer:
        layerCommand = new Command_Layer_AddVectorLayerReferenceLayerToCurrentPosition()
        break

      case NewLayerTypeID.groupLayer:
        layerCommand = new Command_Layer_AddGroupLayerToCurrentPosition()
        break

      case NewLayerTypeID.posingLayer:
        layerCommand = new Command_Layer_AddPosingLayerToCurrentPosition()
        break

      case NewLayerTypeID.imageFileReferenceLayer:
        layerCommand = new Command_Layer_AddImageFileReferenceLayerToCurrentPosition()
        break
    }


    if (layerCommand == null) {
      return
    }

    this.appMain.executeLayerCommand(layerCommand)
  }

  layerWindow_SetEvents() {

    this.appView.layerWindow.uiRef.commandButton_Clicked = ((item) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.layerWindow_CommandButton_Clicked(item)
    })

    this.appView.layerWindow.uiRef.item_Clicked = (item) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      const selectedLayer = item.layer

      if (this.subtoolContext.isShiftKeyPressing()) {

        this.appTool.selectLayer(selectedLayer, true, false)
        this.appTool.activateCurrentTool()
        this.appView.layerHighlight.startShowingLayerItem(item, this.subtoolContext)
      }
      else {

        this.appTool.selectLayer(selectedLayer)
        this.appView.layerHighlight.startShowingCurrentLayer(this.documentContext, this.subtoolContext)
      }
    }

    this.appView.layerWindow.uiRef.visibility_Clicked = (item) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      this.appTool.setLayerVisiblity(item.layer, !item.layer.isVisible)

      this.updateHierarchicalStatesRecursive()

      this.appTool.activateCurrentTool()

      this.subtoolContext.setRedrawWindowsForLayerPropertyChanging()
      this.subtoolContext.setRedrawLayerWindow()
    }

    this.appView.layerWindow.uiRef.expander_Clicked = (item) => {

      if (this.appMain.isEventDisabled()) {
        return
      }

      item.layer.isListExpanded = !item.layer.isListExpanded

      this.updateHierarchicalStatesRecursive()

      this.subtoolContext.updateLayerStructure()
    }
  }

  layerWindow_CommandButton_Clicked(hitedButton: UI_CommandButtonItem) {

    if (hitedButton == null) {
      return
    }

    let layerCommand: Command_Layer_CommandBase = null

    switch(hitedButton.index) {

      case MainCommandButtonID.layer_addLayer:
        this.appView.modalWindow.showRadioSelectionModal(
          '新規レイヤー作成',
          [
            { index: NewLayerTypeID.vectorLayer, label: '線画' },
            { index: NewLayerTypeID.pointBrushFill, label: 'ブラシ塗り' },
            { index: NewLayerTypeID.surroundingFill, label: '囲み塗り' },
            { index: NewLayerTypeID.autoFill, label: '自動囲み塗り' },
            { index: NewLayerTypeID.groupLayer, label: 'グループ' },
            { index: NewLayerTypeID.imageFileReferenceLayer, label: '画像ファイル' },
            { index: NewLayerTypeID.posingLayer, label: '３Ｄポーズ' },
          ],
          NewLayerTypeID.vectorLayer,
          (option) => {
            this.onNewLayerDiaglogClosed(option.index)
          }
        )
        break

      case MainCommandButtonID.layer_deleteLayer:
        layerCommand = new Command_Layer_Delete()
        break

      case MainCommandButtonID.layer_moveUp:
        layerCommand = new Command_Layer_MoveUp()
        break

      case MainCommandButtonID.layer_moveDown:
        layerCommand = new Command_Layer_MoveDown()
        break
    }

    if (layerCommand == null) {
      return
    }

    // Execute command
    this.appMain.executeLayerCommand(layerCommand)
  }

  ribbonUI_TabClick(tabID: MainToolTabID) {

    this.appTool.changeCurrentMainToolTab(tabID)
  }

  subtoolWindow_Item_Click(item: SubToolViewItem) {

    this.subtoolButton_Click(item.subToolID)
  }

  subtoolWindow_Button_Click(item: SubToolViewItem) {

    const tool = item.tool

    if (!tool.isAvailable(this.subtoolContext)) {
      return
    }

    const buttonIndex = 0

    if (tool.optionButton_Click(buttonIndex, this.subtoolContext)) {

      item.buttonStateID = tool.getOptionButtonState(buttonIndex, this.subtoolContext)

      this.subtoolContext.setRedrawMainWindowEditorWindow()
      this.subtoolContext.setRedrawRibbonUI()
    }
  }

  subtoolButton_Click(subToolID: SubToolID) {

    this.appTool.changeCurrentSubToolForSubtoolID(subToolID)
  }

  ribbonUI_button_Click(id: RibbonUIControlID) {

    this.appTool.executeMainToolButtonClick(id)
  }

  ribbonUI_toggleButton_Click(id: RibbonUIControlID, value: number) {

    switch(id) {

      case RibbonUIControlID.edit_operationUnit:
        this.appTool.setOperationUnit(value)
        this.appTool.activateCurrentTool()
        this.subtoolContext.setRedrawCurrentLayer()
        this.subtoolContext.setRedrawEditorWindow()
        break

      case RibbonUIControlID.edit_operationOrigin:
        this.appTool.setOperationOriginType(value)
        this.appTool.activateCurrentTool()
        this.subtoolContext.setRedrawCurrentLayer()
        this.subtoolContext.setRedrawEditorWindow()
        break

      case RibbonUIControlID.vectorLayer_drawLineType:
        // TODO: undoの実装
        if (this.documentContext.currentVectorLayer) {

          this.documentContext.currentVectorLayer.drawLineType = value

          const color = this.documentContext.getCurrentLayerLineColor()
          vec4.copy(this.documentContext.currentVectorLayer.layerColor, color)

          this.appMain.updateForLayerProperty()

          this.subtoolContext.setRedrawWindowsForLayerPropertyChanging()
        }
        break

      case RibbonUIControlID.vectorLayer_fillAreaType:
        // TODO: undoの実装
        if (this.documentContext.currentVectorLayer) {

          this.documentContext.currentVectorLayer.fillAreaType = value

          const color = this.documentContext.getCurrentLayerFillColor()
          vec4.copy(this.documentContext.currentVectorLayer.fillColor, color)

          this.appMain.updateForLayerProperty()

          this.subtoolContext.setRedrawWindowsForLayerPropertyChanging()
        }
        break

      case RibbonUIControlID.vectorLayer_eyesSymmetryInputSide:

        if (this.subtoolContext.currentVectorLayer) {

          this.subtoolContext.currentVectorLayer.eyesSymmetryInputSide = value

          const command = new Command_VectorLayer_SetProperty()
          command.layer = this.subtoolContext.currentVectorLayer
          command.new_eyesSymmetryInputSide = value
          if (command.isAvailable(this.subtoolContext)) {

            this.subtoolContext.commandHistory.executeCommand(command, this.subtoolContext)
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
        this.documentContext.currentLayer.name = value
        this.subtoolContext.setRedrawLayerWindow()
        break
    }
  }

  ribbonUI_NumberInput_Changed(id: RibbonUIControlID, value: float) {

    // console.log(id, value)
    if (!Number.isFinite(value)) {
      return
    }

    switch(id) {

      case RibbonUIControlID.brushBaseSize:
        if (this.documentContext.currentBrushParameter) {
          this.documentContext.currentBrushParameter.baseSize = value
        }
        this.appView.ribbonUIWindow.updateMainToolRibbonUI(this.documentContext)
        break

      case RibbonUIControlID.brushMinSize:
        if (this.documentContext.currentBrushParameter) {
          this.documentContext.currentBrushParameter.minSize = value
        }
        this.appView.ribbonUIWindow.updateMainToolRibbonUI(this.documentContext)
        break

      case RibbonUIControlID.pointerBaseSize:
        if (this.documentContext.currentPointerParameter) {
          this.documentContext.currentPointerParameter.baseSize = value
        }
        this.appView.ribbonUIWindow.updateMainToolRibbonUI(this.documentContext)
        break

      case RibbonUIControlID.document_lineWidthBiasRate:
        this.documentContext.documentData.lineWidthBiasRate = value
        this.subtoolContext.setRedrawMainWindowEditorWindow()
        break

      case RibbonUIControlID.vectorLayer_lineWidthBiasRate:
        if (this.documentContext.currentVectorLayer) {
          this.documentContext.currentVectorLayer.lineWidthBiasRate = value
          this.subtoolContext.setRedrawMainWindow()
        }
        break
    }
  }

  ribbonUI_checkBox_Change(id: RibbonUIControlID, checked: boolean, _value: boolean | number | null) {

    switch (id) {

      case RibbonUIControlID.document_hideOuterArea:
        // TODO: undoの実装
        this.subtoolContext.documentData.documentFrame_HideOuterArea = checked

        this.subtoolContext.setRedrawWindowsForLayerPropertyChanging()
        break

      case RibbonUIControlID.layer_isRenderTarget:
        // TODO: undoの実装
        if (this.subtoolContext.currentLayer) {

          this.subtoolContext.currentLayer.isRenderTarget = checked

          this.appMain.updateForLayerProperty()

          this.subtoolContext.setRedrawWindowsForLayerPropertyChanging()
        }
        break

      case RibbonUIControlID.layer_isMaskedByBelowLayer:
        // TODO: undoの実装
        if (this.subtoolContext.currentLayer) {

          this.subtoolContext.currentLayer.isMaskedByBelowLayer = checked

          this.appMain.updateForLayerProperty()

          this.subtoolContext.setRedrawWindowsForLayerPropertyChanging()
        }
        break

      case RibbonUIControlID.vectorLayer_enableEyesSymmetry:

        if (this.subtoolContext.currentVectorLayer) {

          const command = new Command_VectorLayer_SetProperty()
          command.layer = this.subtoolContext.currentVectorLayer
          command.new_enableEyesSymmetry = checked
          if (command.isAvailable(this.subtoolContext)) {

            // console.log('ribbonUI_CheckBox_Change', id, checked, value)

            this.subtoolContext.commandHistory.executeCommand(command, this.subtoolContext)
          }
        }
        break
    }
  }

  ribbonUI_selectBox_Change(id: RibbonUIControlID, selected_Option: UI_SelectBoxOption) {

    switch (id) {

      case RibbonUIControlID.vectorLayer_posingLayer:
        if (this.subtoolContext.currentVectorLayer && selected_Option) {

          // console.log('ribbonUI_SelectBox_Change', id, selected_Option, this.toolContext.currentVectorLayer)

          const command = new Command_VectorLayer_SetProperty()
          command.layer = this.subtoolContext.currentVectorLayer
          command.new_posingLayer = selected_Option.data
          if (command.isAvailable(this.subtoolContext)) {

            this.subtoolContext.commandHistory.executeCommand(command, this.subtoolContext)
          }
        }
        break
    }
  }

  documentFrame_Change(left: float, top: float, width: float, height: float) {

    this.documentContext.documentData.documentFrame[0] = left
    this.documentContext.documentData.documentFrame[1] = top
    this.documentContext.documentData.documentFrame[2] = left + width - 1
    this.documentContext.documentData.documentFrame[3] = top + height - 1

    this.subtoolContext.setRedrawMainWindowEditorWindow()

    this.appTool.activateCurrentTool()
  }

  documentViewSettings_change(defaultViewScale: float) {

    this.documentContext.documentData.defaultViewScale = defaultViewScale

    this.subtoolContext.setRedrawMainWindowEditorWindow()
  }

  paletteSelectorWindow_CommandButton_Click(item: UI_CommandButtonItem) {

    this.appView.paletteSelectorWindow.setCurrentTarget(item.index)

    this.subtoolContext.setRedrawPalleteSelectorWindow()
    this.subtoolContext.setRedrawColorMixerWindow()
  }

  paletteSelectorWindow_Item_Click(paletteColorIndex: int, color: PaletteColor) {

    const wnd = this.appView.paletteSelectorWindow
    const ctx = this.documentContext

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

      this.appMain.executePostUpdateForCurrentLayer()
    }

    if (needsUpdateForPallete) {

      this.subtoolContext.setRedrawPaletteWindow()
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

    this.appView.paletteSelectorWindow.updateCurrentLayerColor(newColor, keepAlpha, this.documentContext)

    this.appMain.executePostUpdateForCurrentLayer()
  }

  timeLineWindow_mousedown() {

    const e = this.appView.timeLineWindow.canvasWindow.pointerEvent

    const left = this.appView.timeLineWindow.getTimeLineLeft()

    if (e.offsetX < left) {

      this.timeLineWindow_OnPlayPauseButton()
    }
    else {

      this.timeLineWindow_ProcessFrameInput()
    }
  }

  timeLineWindow_OnPlayPauseButton() {

    const aniSetting = this.documentContext.documentData.animationSettingData

    if (this.documentContext.animationPlaying) {

      this.documentContext.animationPlaying = false

      this.subtoolContext.setRedrawTimeLineWindow()
    }
    else {

      this.documentContext.animationPlaying = true
      this.documentContext.animationPlayingFPS = aniSetting.animationFrameParSecond
    }
  }

  timeLineWindow_ProcessFrameInput() {

    const wnd = this.appView.timeLineWindow.canvasWindow
    const e = wnd.pointerEvent
    const aniSetting = this.documentContext.documentData.animationSettingData

    const clickedFrame = this.appView.timeLineWindow.getFrameByLocation(e.offsetX, aniSetting)

    if (clickedFrame != -1 && clickedFrame != aniSetting.currentTimeFrame) {

      this.appMain.setCurrentFrame(clickedFrame)
    }
  }

  timeLineWindow_mousemove() {

    const e = this.appView.timeLineWindow.canvasWindow.pointerEvent

    if (e.isLeftButtonPressing()) {

      this.timeLineWindow_ProcessFrameInput()
    }
  }

  timeLineWindow_mousewheel() {

    const e = this.appView.timeLineWindow.canvasWindow.pointerEvent
    const aniSetting = this.documentContext.documentData.animationSettingData

    if (this.subtoolContext.isCtrlKeyPressing()) {

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

      this.subtoolContext.setRedrawTimeLineWindow()
    }
  }

  dialog_Closed() {
  }

  dialog_DocumentFiler_fileItemSelected(filePath: string) {

    this.appMain.startReloadDocument(filePath)
  }

  dialog_DocumentFiler_filePathFixed(directoryPath: string, fileName: string) {

    this.appMain.saveAsDocument(directoryPath, fileName)
  }

  modal_ImageFileReference_Closed(filePath: string, image: HTMLImageElement) {

    const command = new Command_SetReferenceImageToLayer()
    command.targetLayer = this.subtoolContext.currentImageFileReferenceLayer
    command.image = image
    command.filePath = filePath

    this.subtoolContext.commandHistory.executeCommand(command, this.subtoolContext)
  }

  modal_ExportImage_Closed(param: ExportImageFileParam) {

    this.appMain.exportImageFile(param)
  }

  onModalWindowClosed() {

    // TODO: ダイアログの刷新後この関数は不要になるため削除する

    this.appView.dialogScreen.onDialogWindowClosed()

    this.subtoolContext.setRedrawMainWindowEditorWindow()
    this.subtoolContext.setRedrawWindowsForCurrentLayerChanging()
  }
}
