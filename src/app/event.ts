import { float, StringIsNullOrEmpty, int } from '../base/conversion';
import { Layer, DocumentData, PaletteColor } from '../base/data';
import { EditModeID, MainToolID, InputableWindow, DrawLineToolSubToolID, ModalToolID, ToolMouseEvent } from '../base/tool';

import { ColorLogic } from '../logics/color';

import { CanvasWindow } from '../renders/render2d';

import { Command_DeleteSelectedPoints } from '../commands/delete_points';
import { Command_CopyGeometry, Command_PasteGeometry } from '../commands/edit_copy';
import { Command_Layer_CommandBase, Command_Layer_Delete, Command_Layer_MoveUp, Command_Layer_MoveDown, Command_VectorLayer_SetProperty } from '../commands/edit_layer';

import { SubToolViewItem, LayerWindowButtonID, PaletteSelectorWindowButtonID, LayerWindowItem, MainCommandButtonID, RibbonUIControlID } from '../app/view.class';
import { App_Document } from '../app/document';
import { OperationUI_ID } from '../app/view';
import { UI_CommandButtonsItem } from '../ui/command_buttons';
import { LayoutLogic, RectangleLayoutArea } from '../logics/layout';
import { ViewOperation, ViewOperationMode } from '../view_operations';
import { UI_FooterOperationPanel_ID } from '../ui/footer_operation_panel';
import { UI_SideBarContentInfo } from '../ui/side_bar_container';
import { UI_PaletteSelectorWindow } from '../ui/palette_selector_window';
import { UI_SelectBoxOption } from '../ui/selectbox';

export class App_Event extends App_Document {

  isEventSetDone = false;
  lastHoverLayoutArea: RectangleLayoutArea = null;
  viewOperation = new ViewOperation();

  // Backward interface definitions

  protected onWindowBlur() { // @virtual
  }

  protected onWindowFocus() { // @virtual
  }

  protected openDocumentSettingDialog() { // @virtual
  }

  protected setDefferedWindowResize() { // @virtual
  }

  protected onModalWindowClosed() { // @virtual
  }

  // Events

  protected setEvents() {

    if (this.isEventSetDone) {
      return;
    }

    this.isEventSetDone = true;

    this.setCanvasWindowMouseEvent(this.editorWindow, this.mainWindow
      , this.mainWindow_mousedown
      , this.mainWindow_mousemove
      , this.mainWindow_mouseup
      , this.mainWindow_mousewheel
      , false
    );

    this.uiPaletteSelectorWindowRef.commandButton_Click = ((item) => {

        this.paletteSelectorWindow_CommandButton_Click(item)
    });

    this.uiPaletteSelectorWindowRef.item_Click = ((paletteColorIndex, item) => {

        this.paletteSelectorWindow_Item_Click(paletteColorIndex, item)
    });

    this.setCanvasWindowMouseEvent(this.timeLineWindow, this.timeLineWindow
      , this.timeLineWindow_mousedown
      , this.timeLineWindow_mousemove
      , this.timeLineWindow_mouseup
      , this.timeLineWindow_mousewheel
      , false
    );

    this.setCanvasWindowMouseEvent(this.colorMixerWindow_colorCanvas, this.colorMixerWindow_colorCanvas
      , this.colorMixerWindow_colorCanvas_mousedown
      , this.colorMixerWindow_colorCanvas_mousedown
      , null
      , null
      , true
    );

    document.addEventListener('keydown', (e: KeyboardEvent) => {

      if (this.isWhileLoading()) {
        return;
      }

      if (this.isModalShown()) {
        return;
      }

      if (document.activeElement.nodeName == 'INPUT') {
        return;
      }

      this.document_keydown(e);
    });

    document.addEventListener('keyup', (e: KeyboardEvent) => {

      if (this.isModalShown()) {
        return;
      }

      if (document.activeElement.nodeName == 'INPUT') {
        return;
      }

      this.document_keyup(e);
    });

    window.addEventListener('resize', (e: Event) => {

      this.htmlWindow_resize();
    });

    window.addEventListener('contextmenu', (e: Event) => {

      return this.htmlWindow_contextmenu(e);
    });

    window.addEventListener('blur', () => {

      this.onWindowBlur();
    });

    window.addEventListener('focus', () => {

      this.onWindowFocus();
    });

    document.addEventListener('dragover', (e: DragEvent) => {

      e.stopPropagation();
      e.preventDefault();

      let available = false;
      if (e.dataTransfer.types.length > 0) {

        for (let type of e.dataTransfer.types) {

          if (type == 'Files') {

            available = true;
            break;
          }
        }
      }

      if (available) {

        e.dataTransfer.dropEffect = 'move';
      }
      else {

        e.dataTransfer.dropEffect = 'none';
      }
    });

    document.addEventListener('drop', (e: DragEvent) => {

      this.document_drop(e);
    });

    // Menu buttons

    this.getElement(this.ID.menu_btnOperationOption).addEventListener('mousedown', (e: Event) => {

      if (this.isEventDisabled()) {
        return;
      }

      this.openOperationOptionModal();
      e.preventDefault();
    });

    // React conponents

    this.uiMenuButtonsRef.item_Click = (mainToolID) => {

      this.mainTool_ItemClick(mainToolID);
    };

    this.uiHeaderWindowRef.commandButton_Click = (id) => {

      this.menuButton_Click(id);
    };

    this.uiSideBarContainerRef.contentOpen = (cotentInfo) => {

      if (cotentInfo.id == MainCommandButtonID[MainCommandButtonID.colorMixerWindow] && !this.colorMixerWindow_colorCanvas.isDrawingDone) {

        window.setTimeout(
          () => {

            this.resizeFromStyle(this.colorMixerWindow_colorCanvas);

            this.drawPaletteColorMixer(this.colorMixerWindow_colorCanvas);
          },
          100
        )
      }
    };

    this.uiRibbonUIRef.subtoolButton_Click = (subToolIndex) => {

      this.subtoolWindow_selectItem(subToolIndex);
    };

    this.uiRibbonUIRef.toggleButton_Click = (id, value) => {

      this.ribbonUI_toggleButton_Click(id, value);
    };

    this.uiRibbonUIRef.numberInput_Change = (id, value) => {

      this.ribbonUI_numberInput_Change(id, value);
    };

    this.uiRibbonUIRef.checkBox_Change = (id, checked, value) => {

      this.ribbonUI_checkBox_Change(id, checked, value);
    };

    this.uiRibbonUIRef.selectBox_Change = (id, selected_Option) => {

      this.ribbonUI_selectBox_Change(id, selected_Option);
    };

    this.uiFooterOperationpanelRef.button_Click = (id) => {

      this.footerOperationpanel_Button_Click(id);
    };

    this.uiSubToolWindowRef.item_Click = (item) => {

      this.subtoolWindow_Item_Click(item);
    }

    this.uiSubToolWindowRef.itemButton_Click = (item) => {

      this.subtoolWindow_Button_Click(item);
    }

    this.uiLayerwindowRef.commandButton_Click = ((item) => {

      this.layerWindow_mousedown_LayerCommandButton(item);
    });

    this.uiLayerwindowRef.item_Click = (item) => {

      this.layerWindow_Item_Click(item);
    }

    this.uiLayerwindowRef.visibility_Click = (item) => {

      this.layerWindow_Visibility_Click(item);
    }

    // Modal window

    document.addEventListener('custombox:content:open', () => {

      this.onModalWindowShown();
    });

    document.addEventListener('custombox:content:close', () => {

      this.onModalWindowClosed();
    });

    this.setEvents_ModalCloseButton(this.ID.messageDialogModal_ok);

    this.setEvents_ModalCloseButton(this.ID.openFileDialogModal_ok);
    this.setEvents_ModalCloseButton(this.ID.openFileDialogModal_cancel);

    this.setEvents_ModalCloseButton(this.ID.newLayerCommandOptionModal_ok);
    this.setEvents_ModalCloseButton(this.ID.newLayerCommandOptionModal_cancel);

    this.setEvents_ModalCloseButton(this.ID.exportImageFileModal_ok);
    this.setEvents_ModalCloseButton(this.ID.exportImageFileModal_cancel);

    this.setEvents_ModalCloseButton(this.ID.newKeyframeModal_ok);
    this.setEvents_ModalCloseButton(this.ID.newKeyframeModal_cancel);

    this.setEvents_ModalCloseButton(this.ID.deleteKeyframeModal_ok);
    this.setEvents_ModalCloseButton(this.ID.deleteKeyframeModal_cancel);

    this.uiColorMixerWindowRef.color_Change = (newColor: Vec4) => {

      this.colorMixerWindow_changeColor(newColor);
    };

    this.uiFileOpenDialogRef.value_Change = (filePath: string) => {

      this.startReloadDocument(filePath);
    }
  }

  protected setCanvasWindowMouseEvent(
    eventCanvasWindow: CanvasWindow,
    drawCanvasWindew: InputableWindow,
    mousedown: Function,
    mousemove: Function,
    mouseup: Function,
    mousewheel: Function,
    isModal: boolean
  ) {

    const toolMouseEvent = drawCanvasWindew.toolMouseEvent;

    const eventElement = eventCanvasWindow.canvas;

    if (mousedown != null) {

      eventElement.addEventListener('pointerdown', (e: PointerEvent) => {

        if (this.isEventDisabled() && !isModal) {
          return;
        }

        if (toolMouseEvent.pointerID == -1) {

          toolMouseEvent.pointerID = e.pointerId;

          eventElement.setPointerCapture(e.pointerId);
        }

        this.processPointerEvent(drawCanvasWindew, e, true, false, false);

        mousedown.call(this);

        e.preventDefault();
      });
    }

    if (mousemove != null) {

      eventElement.addEventListener('pointermove', (e: PointerEvent) => {

        if (this.isEventDisabled() && !isModal) {
          return;
        }

        this.processPointerEvent(drawCanvasWindew, e, false, false, true);

        mousemove.call(this);

        e.preventDefault();
      });
    }

    if (mouseup != null) {

      eventElement.addEventListener('pointerup', (e: PointerEvent) => {

        if (this.isEventDisabled() && !isModal) {
          return;
        }

        toolMouseEvent.pointerID = -1;

        this.processPointerEvent(drawCanvasWindew, e, false, true, false);

        mouseup.call(this);

        e.preventDefault();
      });
    }

    if (mousewheel != null) {

      eventCanvasWindow.canvas.addEventListener('wheel', (e: MouseEvent) => {

        if (this.isEventDisabled() && !isModal) {
          return;
        }

        this.getWheelInfo(toolMouseEvent, e);

        mousewheel.call(this);

        e.preventDefault();
      });
    }

    eventCanvasWindow.canvas.addEventListener('touchstart', (e: TouchEvent) => {

      // Prevent page navigation by touch event
      e.preventDefault();
    });

    eventCanvasWindow.canvas.addEventListener('touchmove', (e: TouchEvent) => {

      // Prevent page navigation by touch event
      e.preventDefault();
    });

    eventCanvasWindow.canvas.addEventListener('touchend', (e: TouchEvent) => {

      // Prevent page navigation by touch event
      e.preventDefault();
    });
  }

  protected setEvents_ModalCloseButton(id: string) {

    this.getElement(id).addEventListener('click', (e: Event) => {

      this.currentModalDialogResult = id;

      this.closeModal();

      e.preventDefault();
    });
  }

  protected document_keydown(e: KeyboardEvent) {

    const env = this.toolEnv;
    const wnd = this.mainWindow;
    const context = this.toolContext;

    let key = e.key;
    if (key.length == 1) {
      key = key.toLowerCase();
    }

    e.preventDefault();

    this.toolContext.shiftKey = e.shiftKey;
    this.toolContext.altKey = e.altKey;
    this.toolContext.ctrlKey = e.ctrlKey;

    env.updateContext();

    if (this.activeCanvasWindow == this.timeLineWindow) {

      if (this.document_keydown_timeLineWindow(key)) {

        return;
      }
    }

    if (key == ' ') {

      if (this.activeCanvasWindow == this.mainWindow) {

        this.viewOperation.startViewOperation(ViewOperationMode.move, wnd, null, env);
      }

      return;
    }

    if (key == '.' && env.needsDrawOperatorCursor()) {

      this.setOperatorCursorLocationToMouse();
    }

    if (this.isModalToolRunning()) {

      this.document_keydown_modalTool(key, e);

      return;
    }
    else if (env.isEditMode()) {

      if (this.currentTool.keydown(e, env)) {
        return;
      }
    }

    if (key == 'Tab') {

      // Change mode
      if (env.isDrawMode()) {

        this.setCurrentEditMode(EditModeID.editMode);
      }
      else {

        this.setCurrentEditMode(EditModeID.drawMode);
      }

      env.setRedrawLayerWindow();
      env.setRedrawSubtoolWindow();

      return;
    }

    if (key == 'n' && env.isCtrlKeyPressing()) {

      this.resetDocument();

      return;
    }

    if (key == 'b') {

      this.inputKey_draw_down();
      return;
    }

    if (key == 'e') {

      this.inputKey_eraser_down();
      return;
    }

    if (key == 'p') {
      return;
    }

    if (key == 'z') {

      this.inputKey_undo_down();
      return;
    }

    if (key == 'y') {

      this.inputKey_redo_down();
      return;
    }

    if (env.isCtrlKeyPressing() && key == 'c') {

      this.inputKey_copy_down();
      return;
    }

    if (env.isCtrlKeyPressing() && key == 'v') {

      this.inputKey_paste_down();
      return;
    }

    if (!env.isCtrlKeyPressing() && (key == 'c' || key == 'v')) {

      let addFrame = 1;
      if (key == 'c') {
        addFrame = -addFrame;
      }

      let frame = this.findNextViewKeyframeFrame(context.document.animationSettingData.currentTimeFrame, addFrame);

      this.setCurrentFrame(frame);

      env.setRedrawMainWindowEditorWindow();
      env.setRedrawTimeLineWindow();
    }

    if (key == 'Delete' || key == 'x') {

      const withCut = (key == 'x' && env.isCtrlKeyPressing());

      this.inputKey_delete_down(withCut);
      return;
    }

    if (key == 'Home' || key == 'q') {

      this.viewOperation.reseTotHome(this.mainWindow, env);

      return;
    }

    if (key == 't' || key == 'r') {

      if (env.isDrawMode()) {

        const clockwise = (key == 't');

        this.viewOperation.addViewRotation(10.0, clockwise, wnd, env);
        return;
      }
    }

    if (key == 'm') {

      this.mainWindow.mirrorX = !this.mainWindow.mirrorX;
      env.setRedrawMainWindowEditorWindow();
      return;
    }

    if (key == 'f' || key == 'd') {

      let addScale = 1.0 + this.drawStyle.viewZoomAdjustingSpeedRate;

      if (key == 'd') {

        addScale = 1 / addScale;
      }

      this.viewOperation.addViewScale(addScale, wnd, env);

      return;
    }

    if (env.isCtrlKeyPressing() && (key == 'ArrowLeft' || key == 'ArrowRight' || key == 'ArrowUp' || key == 'ArrowDown')) {

      let x = 0.0;
      let y = 0.0;
      if (key == 'ArrowLeft') {
        x = -10.0;
      }
      if (key == 'ArrowRight') {
        x = 10.0;
      }
      if (key == 'ArrowUp') {
        y = -10.0;
      }
      if (key == 'ArrowDown') {
        y = 10.0;
      }

      this.mainWindow.calculateViewUnitMatrix(wnd.view2DMatrix);
      mat4.invert(wnd.invView2DMatrix, wnd.view2DMatrix);
      vec3.set(this.tempVec3, x, y, 0.0);
      vec3.transformMat4(this.tempVec3, this.tempVec3, wnd.invView2DMatrix);

      vec3.add(this.mainWindow.viewLocation, this.mainWindow.viewLocation, this.tempVec3);

      let leftLimit = this.mainWindow.width * (-0.5);
      let rightLimit = this.mainWindow.width * 1.5
      let topLimit = this.mainWindow.height * (-0.5);
      let bottomLimit = this.mainWindow.height * 1.5

      if (this.mainWindow.viewLocation[0] < leftLimit) {
        this.mainWindow.viewLocation[0] = leftLimit;
      }
      if (this.mainWindow.viewLocation[0] > rightLimit) {
        this.mainWindow.viewLocation[0] = rightLimit;
      }
      if (this.mainWindow.viewLocation[1] < topLimit) {
        this.mainWindow.viewLocation[1] = topLimit;
      }
      if (this.mainWindow.viewLocation[1] > bottomLimit) {
        this.mainWindow.viewLocation[1] = bottomLimit;
      }

      env.setRedrawMainWindowEditorWindow();

      return;
    }

    if (!env.isCtrlKeyPressing() && (key == 'ArrowLeft' || key == 'ArrowRight')) {

      let addFrame = 1;
      if (key == 'ArrowLeft') {
        addFrame = -addFrame;
      }

      this.setCurrentFrame(context.document.animationSettingData.currentTimeFrame + addFrame);

      env.setRedrawMainWindowEditorWindow();
      env.setRedrawTimeLineWindow();
    }

    if (key == 'i') {

      return;
    }

    if (key == 'a') {

      if (env.isEditMode()) {

        this.tool_SelectAllPoints.executeToggleSelection(env);
        this.activateCurrentTool();
      }
      else {

        this.selectNextOrPreviousLayer(false);
        this.startShowingCurrentLayer();
        env.setRedrawLayerWindow();
        env.setRedrawSubtoolWindow();
      }

      return;
    }

    if (key == 'h') {

      if (env.isEditMode()) {

      }
      else {


        this.setCurrentMainTool(MainToolID.drawLine);
        this.setCurrentSubTool(<int>DrawLineToolSubToolID.extrudeLine);
        this.currentTool.keydown(e, env);
        env.setRedrawMainWindowEditorWindow();
        env.setRedrawSubtoolWindow();
      }

      return;
    }

    if (key == 'w') {

      let pickedLayer: Layer = null;
      for (let pickingPosition of this.layerPickingPositions) {

        let pickX = this.mainWindow.toolMouseEvent.offsetX + pickingPosition[0];
        let pickY = this.mainWindow.toolMouseEvent.offsetY + pickingPosition[1];

        pickedLayer = this.pickLayer(this.mainWindow, this.currentViewKeyframe, pickX, pickY);

        if (pickedLayer != null) {
          break;
        }
      }

      if (pickedLayer != null) {

        this.setCurrentLayer(pickedLayer);
        env.setRedrawLayerWindow();
        env.setRedrawSubtoolWindow();
        this.startShowingCurrentLayer();
      }
      else {

        env.setRedrawMainWindowEditorWindow();
      }

      return;
    }

    if (key == 'l') {
    }

    if (key == 'o') {

      if (env.isCtrlKeyPressing()) {

        this.uiFileOpenDialogRef.show();
      }
      else {

        this.currentTool.keydown(e, env);
      }

      return;
    }

    if (key == 'g' || key == 'r' || key == 's') {

      if (key == 's' && env.isCtrlKeyPressing()) {

        this.saveDocument();
        return;
      }

      if (env.isDrawMode()) {

        if (this.currentTool.keydown(e, env)) {

          // Switch to scratch line tool
        }
        else if (key == 'g') {

          this.setCurrentMainTool(MainToolID.drawLine);
          this.setCurrentSubTool(<int>DrawLineToolSubToolID.scratchLine);
          this.currentTool.keydown(e, env);
          env.setRedrawMainWindowEditorWindow();
          env.setRedrawSubtoolWindow();
        }
        else if (key == 's') {

          this.selectNextOrPreviousLayer(true);
          this.startShowingCurrentLayer();
          env.setRedrawLayerWindow();
          env.setRedrawSubtoolWindow();
        }

        return;
      }

      if (env.isEditMode()) {

        let modalToolID = ModalToolID.grabMove;

        if (key == 'r') {

          modalToolID = ModalToolID.rotate;
        }
        else if (key == 's') {

          modalToolID = ModalToolID.scale;
        }

        if (env.isCurrentLayerVectorLayer() || env.isCurrentLayerContainerLayer()) {

          this.startVectorLayerModalTool(modalToolID);
        }
        else if (env.isCurrentLayerImageFileReferenceLayer()) {

          this.startImageFileReferenceLayerModalTool(modalToolID);
        }

        return;
      }
    }

    if (key == 'Enter') {

      this.currentTool.keydown(e, env);
    }

    if (key == '1') {

      let layerItem = this.layerWindow_FindCurrentItem();
      this.openLayerPropertyModal(layerItem.layer);
    }

    /*
    if (key == '2') {

        let layerItem = this.findCurrentLayerLayerWindowItem();
        this.openPaletteColorModal(
            OpenPaletteColorModalMode.LineColor, this.toolContext.document, layerItem.layer);
    }

    if (key == '3') {

        let layerItem = this.findCurrentLayerLayerWindowItem();
        this.openPaletteColorModal(
            OpenPaletteColorModalMode.FillColor, this.toolContext.document, layerItem.layer);
    }
    */

    if (key == '4') {

      this.openDocumentSettingModal();
    }

    if (key == '5') {

      this.openNewLayerCommandOptionModal();
    }

    if (key == '^') {

      this.openOperationOptionModal();
    }

    if (key == '\\') {

      this.openExportImageFileModal();
    }

    if (key == '-') {

      context.drawCPUOnly = !this.toolContext.drawCPUOnly;
      env.setRedrawMainWindow();
    }
  }

  protected inputKey_undo_down() {

    const env = this.toolEnv;

    this.toolContext.commandHistory.undo(env);

    this.activateCurrentTool();

    env.setRedrawMainWindowEditorWindow();
  }

  protected inputKey_redo_down() {

    const env = this.toolEnv;

    this.toolContext.commandHistory.redo(env);

    this.activateCurrentTool();

    env.setRedrawMainWindowEditorWindow();
  }

  protected inputKey_copy_down() {

    const env = this.toolEnv;

    if (!env.isEditMode()) {
      return;
    }

    if (this.toolContext.currentVectorGroup != null) {

      let command = new Command_CopyGeometry();
      if (command.prepareEditData(env)) {

        command.execute(env);
      }
    }
  }

  protected inputKey_paste_down() {

    const env = this.toolEnv;
    const context = this.toolContext;

    if (context.currentVectorGroup == null) {
      return;
    }

    let command = new Command_PasteGeometry();
    if (command.prepareEditData(env)) {

      this.tool_SelectAllPoints.executeClearSelectAll(env);

      context.commandHistory.executeCommand(command, env);
    }

    env.setRedrawCurrentLayer();
  }

  protected inputKey_delete_down(withCut: boolean) {

    const env = this.toolEnv;

    if (!env.isEditMode()) {
      return;
    }

    if (env.isCurrentLayerVectorLayer() || env.isCurrentLayerContainerLayer()) {

      let command = new Command_DeleteSelectedPoints();
      if (command.prepareEditTargets(env)) {

        if (withCut) {

          let copyCommand = new Command_CopyGeometry();
          if (copyCommand.prepareEditData(env)) {

            copyCommand.execute(env);
          }
        }

        env.commandHistory.executeCommand(command, env);

        env.setRedrawMainWindow();
      }
    }
  }

  protected inputKey_draw_down() {

    const env = this.toolEnv;

    if (!env.isDrawMode()) {
      return;
    }

    this.setCurrentMainTool(MainToolID.drawLine);
    this.setCurrentSubTool(<int>DrawLineToolSubToolID.drawLine);

    this.updateFooterMessage();
    env.setRedrawMainWindowEditorWindow();
    env.setRedrawLayerWindow();
    env.setRedrawSubtoolWindow();
  }

  protected inputKey_eraser_down() {

    const env = this.toolEnv;
    const context = this.toolContext;

    if (!env.isDrawMode()) {
      return;
    }

    this.setCurrentMainTool(MainToolID.drawLine);
    if (context.subToolIndex != <int>DrawLineToolSubToolID.deletePointBrush) {

      this.setCurrentSubTool(<int>DrawLineToolSubToolID.deletePointBrush);
    }
    else {

      this.setCurrentSubTool(<int>DrawLineToolSubToolID.drawLine);
    }

    this.updateFooterMessage();
    env.setRedrawMainWindowEditorWindow();
    env.setRedrawLayerWindow();
    env.setRedrawSubtoolWindow();
  }

  protected document_keyup(e: KeyboardEvent) {

    const env = this.toolEnv;

    this.toolContext.shiftKey = e.shiftKey;
    this.toolContext.altKey = e.altKey;
    this.toolContext.ctrlKey = e.ctrlKey;

    if (e.key == ' ') {

      if (this.viewOperation.isViewOperationRunning()) {

        this.viewOperation.endViewOperation(this.mainWindow, true, env);
      }
    }
  }

  protected document_keydown_modalTool(key: string, e: KeyboardEvent) {

    var env = this.toolEnv;

    if (key == 'Escape') {

      this.cancelModalTool();
    }
    else {

      this.currentTool.keydown(e, env);
    }
  }

  protected document_keydown_timeLineWindow(key: string): boolean {

    var env = this.toolEnv;
    let context = this.toolContext;
    let aniSetting = context.document.animationSettingData;

    if (key == 'i') {
      this.openNewKeyframeModal();
      return true;
    }

    if (key == 'Delete' || key == 'x') {
      this.openDeleteKeyframeModal();
      return true;
    }

    if (key == 'k' || key == 'l') {

      if (this.currentViewKeyframe != null) {

        var add_FrameTime = 1;
        if (key == 'k') {
          add_FrameTime = -1;
        }

        var newFrame = this.currentViewKeyframe.frame + add_FrameTime;

        if (newFrame < 0) {

          newFrame = 0;
        }

        if (add_FrameTime > 0
          && this.nextKeyframe != null
          && newFrame >= this.nextKeyframe.frame) {

          newFrame = this.nextKeyframe.frame - 1;
        }

        if (add_FrameTime < 0
          && this.previousKeyframe != null
          && newFrame <= this.previousKeyframe.frame) {

          newFrame = this.previousKeyframe.frame + 1;
        }

        if (this.currentViewKeyframe.frame != newFrame) {

          for (let viewKeyFrameLayer of this.currentViewKeyframe.layers) {

            if (viewKeyFrameLayer.hasKeyframe()) {

              viewKeyFrameLayer.vectorLayerKeyframe.frame = newFrame;
            }
          }

          this.currentViewKeyframe.frame = newFrame;

          env.setRedrawMainWindowEditorWindow();
          env.setRedrawTimeLineWindow();
        }
      }

      return true;
    }

    if (key == 'o' || key == 'p') {

      var add_FrameTime = 1;
      if (key == 'o') {
        add_FrameTime = -1;
      }

      if (env.isShiftKeyPressing()) {

        aniSetting.loopEndFrame += add_FrameTime;
        if (aniSetting.loopEndFrame < 0) {
          aniSetting.loopEndFrame = 0;
        }
      }
      else if (env.isCtrlKeyPressing()) {

        aniSetting.loopStartFrame += add_FrameTime;
        if (aniSetting.loopStartFrame < 0) {
          aniSetting.loopStartFrame = 0;
        }
      }
      else {

        aniSetting.maxFrame += add_FrameTime;
        if (aniSetting.maxFrame < 0) {
          aniSetting.maxFrame = 0;
        }
      }

      env.setRedrawMainWindowEditorWindow();
      env.setRedrawTimeLineWindow();

      return true;
    }

    return false;
  }

  protected document_drop(e: DragEvent) {

    e.preventDefault();

    // Check file exists
    if (e.dataTransfer.files.length == 0) {

      console.log('error: no dropped files.');
      return;
    }

    // Get file path or name
    let file = e.dataTransfer.files[0];

    let filePath = '';
    if ('path' in file) {
      filePath = file['path'];
    }
    else {
      filePath = file.name;
    }

    if (StringIsNullOrEmpty(filePath)) {

      console.log('error: cannot get file path.');
      return;
    }

    // Start loading document
    this.startReloadDocumentFromFile(file, filePath);
  }

  protected htmlWindow_resize() {

    this.setDefferedWindowResize();
  }

  protected htmlWindow_contextmenu(e): boolean {

    if (e.preventDefault) {
      e.preventDefault();
    }
    else if (e.returnValue) {
      e.returnValue = false;
    }

    return false;
  }

  protected mainWindow_mousedown() {

    let wnd = this.mainWindow;
    let e = wnd.toolMouseEvent;
    let env = this.toolEnv;

    env.updateContext();

    // console.log('mainWindow_mousedown', e.offsetX, e.offsetY);

    // Operation UI
    if (!this.isModalToolRunning() && !this.viewOperation.isViewOperationRunning()) {

      this.mainWindow_mousedown_OperationUI(e);
    }

    if (this.viewOperation.isViewOperationRunning()) {

      this.viewOperation.pointerDownAdditional(wnd, env);

      return;
    }

    if (this.operationUI_IsHover(e)) {
      return;
    }

    // Current tool
    if (this.isModalToolRunning()) {

      if (this.currentTool.isAvailable(env)) {

        this.currentTool.mouseDown(e, env);
      }
    }
    else {

      if (this.currentTool.isAvailable(env)) {

        this.currentTool.mouseDown(e, env);
      }
    }

    // View operations
    if (e.isRightButtonPressing() && env.isShiftKeyPressing()) {

      this.setOperatorCursorLocationToMouse();
    }
    else if (e.isRightButtonPressing() || e.isCenterButtonPressing()) {

      this.viewOperation.startViewOperation(ViewOperationMode.move, wnd, null, env);
    }
    else {

      this.viewOperation.endViewOperation(wnd, false, env);
    }
  }

  protected mainWindow_mousemove() {

    const wnd = this.mainWindow;
    const e = wnd.toolMouseEvent;
    const env = this.toolEnv;

    env.updateContext();

    // View operations
    if (this.viewOperation.isViewOperationRunning()) {

      if (this.viewOperation.processViewOperation(wnd, wnd.toolMouseEvent, env)) {

        return;
      }
    }

    // Operation UI
    if (!this.isModalToolRunning()) {

      if (this.mainWindow_mousemove_OperationUI(e)) {

        env.setRedrawEditorWindow();
      }
    }

    // Current tool
    if (this.isModalToolRunning()) {

      if (!e.isMouseDragging) {

        if (this.currentTool.isAvailable(env)) {

          this.currentTool.mouseMove(e, env);
        }
      }
    }
    else if (env.isDrawMode()) {

      this.currentTool.mouseMove(e, env);
    }
    else if (env.isEditMode()) {

      let isHitChanged = this.hittestToStrokes(e.location, env.mouseCursorViewRadius);

      if (isHitChanged) {

        env.setRedrawCurrentLayer();
      }

      this.currentTool.mouseMove(e, env);
    }
  }

  protected mainWindow_mouseup() {

    const wnd = this.mainWindow;
    const e = wnd.toolMouseEvent;
    const env = this.toolEnv;

    env.updateContext();

    if (this.viewOperation.isViewOperationRunning()) {

      if (this.viewOperation.endViewOperation(wnd, false, env)) {

        return;
      }
    }

    if (this.currentTool) {

      this.currentTool.mouseUp(e, env);
    }
  }

  protected mainWindow_mousewheel() {

    let wnd = this.mainWindow;
    let e = wnd.toolMouseEvent;
    let env = this.toolEnv;

    // View operations
    if (e.wheelDelta != 0.0 && !e.isMouseDragging) {

      let addScale = 1.0 + this.drawStyle.viewZoomAdjustingSpeedRate * 0.5;

      if (e.wheelDelta < 0.0) {

        addScale = 1.0 / addScale;
      }

      this.viewOperation.addViewScale(addScale, wnd, env);
    }

    this.calculateTransfomredMouseParams(e, wnd);
  }

  protected hittestToStrokes(location: Vec3, minDistance: float): boolean {

    let env = this.toolEnv;

    if (env.currentVectorGeometry == null) {

      return false;
    }

    this.hittest_Line_IsCloseTo.startProcess();

    this.hittest_Line_IsCloseTo.processLayer(env.currentVectorGeometry, location, minDistance);

    this.hittest_Line_IsCloseTo.endProcess();

    return this.hittest_Line_IsCloseTo.isChanged;
  }

  protected mainWindow_mousedown_OperationUI(e: ToolMouseEvent): boolean {

    const area = LayoutLogic.hitTestLayout(this.mainOperationUI_Area.children, e.offsetX, e.offsetY);

    if (area != null) {

      this.operationUI_Click(area, this.mainWindow);

      return true;
    }

    if (LayoutLogic.hitTestLayout(this.mainOperationUI_Area, e.offsetX, e.offsetY)) {

      return true;
    }

    return false;
  }

  protected operationUI_IsHover(e: ToolMouseEvent): boolean {

    return LayoutLogic.hitTestLayout(this.mainOperationUI_Area, e.offsetX, e.offsetY) != null;
  }

  protected mainWindow_mousemove_OperationUI(e: ToolMouseEvent): boolean {

    // Operation UI
    if (this.operationUI_IsHover(e)) {

      this.editorWindow.canvas.style.cursor = "default";
    }
    else {

      this.editorWindow.canvas.style.cursor = "crosshair";
    }

    const area = LayoutLogic.hitTestLayout(this.mainOperationUI_Area.children, e.offsetX, e.offsetY);

    if (this.lastHoverLayoutArea != null) {

      this.lastHoverLayoutArea.saveState();
    }

    if (area != null) {

      area.saveState();
    }

    if (this.lastHoverLayoutArea != null) {

      this.lastHoverLayoutArea.hover = false;
    }

    if (area != null) {

      area.hover = true;
      this.lastHoverLayoutArea = area;
    }

    const isChanged = (LayoutLogic.isChanged(area) || LayoutLogic.isChanged(this.lastHoverLayoutArea));

    return isChanged;
  }

  protected menuButton_Click(id: MainCommandButtonID) {

    if (this.isEventDisabled()) {
      return;
    }

    switch (id) {

      case MainCommandButtonID.open:
        this.uiFileOpenDialogRef.show();
        break;

      case MainCommandButtonID.save:
        this.saveDocument();
        break;

      case MainCommandButtonID.export:
        this.openExportImageFileModal();
        break;

      case MainCommandButtonID.undo:
        this.inputKey_undo_down();
        break;

      case MainCommandButtonID.redo:
        this.inputKey_redo_down();
        break;

      case MainCommandButtonID.settings:
        this.openDocumentSettingDialog();
        break;

      case MainCommandButtonID.layerWindow:
        this.uiSideBarContainerRef.toggleContent(MainCommandButtonID[MainCommandButtonID.layerWindow]);
        break;

      case MainCommandButtonID.paletteWindow:
        this.uiSideBarContainerRef.toggleContent(MainCommandButtonID[MainCommandButtonID.paletteWindow]);
        break;

      case MainCommandButtonID.colorMixerWindow:
        this.uiSideBarContainerRef.toggleContent(MainCommandButtonID[MainCommandButtonID.colorMixerWindow]);
        break;

      case MainCommandButtonID.timeLineWindow:
        // TOTO: きちんと実装する
        if (this.timeLineWindow.canvas.parentElement.classList.contains('hidden')) {

          this.timeLineWindow.canvas.parentElement.classList.remove('hidden');
        }
        else {

          this.timeLineWindow.canvas.parentElement.classList.add('hidden');
        }
        break;
    }
  }

  protected footerOperationpanel_Button_Click(id: UI_FooterOperationPanel_ID) {

    if (this.isEventDisabled()) {
      return;
    }

    if (id == UI_FooterOperationPanel_ID.copy) {

      this.inputKey_copy_down();
      return;
    }

    if (id == UI_FooterOperationPanel_ID.paste) {

      this.inputKey_paste_down();
      return;
    }

    if (id == UI_FooterOperationPanel_ID.cut) {

      this.inputKey_delete_down(true);
      return;
    }

    if (id == UI_FooterOperationPanel_ID.undo) {

      this.inputKey_undo_down();
      return;
    }

    if (id == UI_FooterOperationPanel_ID.redo) {

      this.inputKey_redo_down();
      return;
    }
  }

  protected operationUI_Click(area: RectangleLayoutArea, wnd: InputableWindow) {

    const env = this.toolEnv;

    if (area.index == OperationUI_ID.view_move) {

      this.viewOperation.startViewOperation(ViewOperationMode.move, wnd, area, env);
      return;
    }

    if (area.index == OperationUI_ID.view_rotate) {

      this.viewOperation.startViewOperation(ViewOperationMode.rotate, wnd, area, env);
      return;
    }

    if (area.index == OperationUI_ID.view_zoom) {

      this.viewOperation.startViewOperation(ViewOperationMode.zoom, wnd, area, env);
      return;
    }

    if (area.index == OperationUI_ID.draw) {

      this.inputKey_draw_down();
      return;
    }

    if (area.index == OperationUI_ID.eraser) {

      this.inputKey_eraser_down();
      return;
    }
  }

  protected layerWindow_mousedown_LayerCommandButton(hitedButton: UI_CommandButtonsItem) {

    if (hitedButton == null) {
      return;
    }

    // Select command
    let layerCommand: Command_Layer_CommandBase = null;

    if (hitedButton.index == <int>LayerWindowButtonID.addLayer) {

      this.openNewLayerCommandOptionModal();
    }
    else if (hitedButton.index == <int>LayerWindowButtonID.deleteLayer) {

      layerCommand = new Command_Layer_Delete();
    }
    else if (hitedButton.index == <int>LayerWindowButtonID.moveUp) {

      layerCommand = new Command_Layer_MoveUp();
    }
    else if (hitedButton.index == <int>LayerWindowButtonID.moveDown) {

      layerCommand = new Command_Layer_MoveDown();
    }

    if (layerCommand == null) {

      return;
    }

    // Execute command
    this.executeLayerCommand(layerCommand);
  }

  protected layerWindow_mousedown_LayerItem(clickedX: float, clickedY: float, doubleClicked: boolean) {

    const env = this.toolEnv;
    let wnd = this.layerWindow;

    if (wnd.layerWindowItems.length == 0) {
      return;
    }

    let firstItem = wnd.layerWindowItems[0];
    let selectedIndex = Math.floor((clickedY - firstItem.top) / firstItem.getHeight());

    if (selectedIndex >= 0 && selectedIndex < wnd.layerWindowItems.length) {

      let selectedItem = wnd.layerWindowItems[selectedIndex];
      let selectedLayer = selectedItem.layer;

      if (clickedX <= selectedItem.textLeft) {

        this.layerWindow_Visibility_Click(selectedItem);
      }
      else {

        if (doubleClicked) {

          // Layer property

          this.openLayerPropertyModal(selectedLayer);
        }
        else {

          // Select layer content

          this.layerWindow_Item_Click(selectedItem);
        }
      }
    }

    env.setRedrawLayerWindow();
    env.setRedrawSubtoolWindow();
  }

  protected layerWindow_Item_Click(item: LayerWindowItem) {

    let env = this.toolEnv;
    let selectedLayer = item.layer;

    if (env.isShiftKeyPressing()) {

      this.setLayerSelection(selectedLayer, !selectedLayer.isSelected);
      this.activateCurrentTool();
      this.startShowingLayerItem(item);
    }
    else {

      this.setCurrentLayer(selectedLayer);
      this.startShowingCurrentLayer();
    }

    Layer.updateHierarchicalStatesRecursive(selectedLayer);

    env.setRedrawMainWindowEditorWindow();
    env.setRedrawWebGLWindow();
    env.setRedrawLayerWindow();
    env.setRedrawSubtoolWindow();
  }

  protected layerWindow_Visibility_Click(item: LayerWindowItem) {

    let env = this.toolEnv;

    this.setLayerVisiblity(item.layer, !item.layer.isVisible);

    Layer.updateHierarchicalStatesRecursive(env.document.rootLayer);

    this.activateCurrentTool();

    env.setRedrawMainWindowEditorWindow();
    env.setRedrawLayerWindow();
    env.setRedrawSubtoolWindow();
  }

  protected mainTool_ItemClick(mainToolID: MainToolID) {

    if (this.isEventDisabled()) {
      return;
    }

    const env = this.toolEnv;

    switch(mainToolID) {

      case MainToolID.drawLine:
      case MainToolID.posing: {

        this.setCurrentEditMode(EditModeID.drawMode);
        this.setCurrentMainToolForCurentLayer();

        this.toolEnv.setRedrawMainWindowEditorWindow();
        this.toolEnv.setRedrawSubtoolWindow();

        break;
      }

      case MainToolID.edit: {

        if (env.isDrawMode()) {

          this.setCurrentEditMode(EditModeID.editMode);
        }

        break;
      }

      case MainToolID.draw3D: {

        this.setCurrentEditMode(EditModeID.drawMode);
        this.setCurrentMainTool(MainToolID.draw3D);

        this.toolEnv.setRedrawMainWindowEditorWindow();
        this.toolEnv.setRedrawSubtoolWindow();
        break;
      }

      case MainToolID.misc: {

        this.setCurrentEditMode(EditModeID.drawMode);
        this.setCurrentMainTool(MainToolID.misc);

        this.toolEnv.setRedrawMainWindowEditorWindow();
        this.toolEnv.setRedrawSubtoolWindow();

        break;
      }
    }
  }

  protected subtoolWindow_Item_Click(item: SubToolViewItem) {

    this.subtoolWindow_selectItem(item.subToolIndex);
  }

  protected subtoolWindow_Button_Click(item: SubToolViewItem) {

    let tool = item.tool;
    let env = this.toolEnv;

    if (!tool.isAvailable(env)) {
      return;
    }

    let buttonIndex = 0;

    if (tool.optionButton_Click(buttonIndex, env)) {

      item.buttonStateID = tool.getOptionButtonState(buttonIndex, env);

      env.setRedrawMainWindowEditorWindow();
      env.setRedrawSubtoolWindow();

      this.updateUISubToolWindow();
    }
  }

  protected subtoolWindow_selectItem(subToolIndex: int) {

    let env = this.toolEnv;

    if (!this.isSubToolAvailable(subToolIndex)) {
      return;
    }

    // Change current sub tool
    this.setCurrentSubTool(subToolIndex);

    env.setRedrawMainWindowEditorWindow();

    // Tool event
    this.activateCurrentTool();
    this.currentTool.toolWindowItemClick(env);
  }

  protected ribbonUI_toggleButton_Click(id: RibbonUIControlID, value: float) {

    let env = this.toolEnv;

    switch(id) {

      case RibbonUIControlID.vectorLayer_eyesSymmetryInputSide:

        if (env.currentVectorLayer) {

          env.currentVectorLayer.eyesSymmetryInputSide = value;

          let command = new Command_VectorLayer_SetProperty();
          command.layer = env.currentVectorLayer;
          command.new_eyesSymmetryInputSide = value;
          if (command.isAvailable(env)) {

            env.commandHistory.executeCommand(command, env);
          }
        }

        break;
    }
  }

  protected ribbonUI_numberInput_Change(id: RibbonUIControlID, value: float) {

    // console.log(id, value);

    let env = this.toolEnv;

    switch(id) {

      case RibbonUIControlID.brushWidth_Max:
        this.toolContext.drawLineBaseWidth = value;
        break;

      case RibbonUIControlID.brushWidth_Min:
        this.toolContext.drawLineMinWidth = value;
        break;

      case RibbonUIControlID.eraserWidth_Max:
        this.toolContext.eraserLineBaseWidth = value;
        env.setRedrawEditorWindow();
        break;
    }
  }

  protected ribbonUI_checkBox_Change(id: RibbonUIControlID, checked: boolean, value: boolean | number | null) {

    let env = this.toolEnv;

    switch (id) {

      case RibbonUIControlID.vectorLayer_enableEyesSymmetry:

        if (env.currentVectorLayer) {

          let command = new Command_VectorLayer_SetProperty();
          command.layer = env.currentVectorLayer;
          command.new_enableEyesSymmetry = checked;
          if (command.isAvailable(env)) {

            // console.log('ribbonUI_CheckBox_Change', id, checked, value);

            env.commandHistory.executeCommand(command, env);
          }
        }
        break;
    }
  }

  protected ribbonUI_selectBox_Change(id: RibbonUIControlID, selected_Options: UI_SelectBoxOption[]) {

    let env = this.toolEnv;

    switch (id) {

      case RibbonUIControlID.vectorLayer_posingLayer:

        const selected_Option = (selected_Options.length > 0 ? selected_Options[0] : null);

        if (env.currentVectorLayer && selected_Option) {

          // console.log('ribbonUI_SelectBox_Change', id, selected_Option, env.currentVectorLayer);

          let command = new Command_VectorLayer_SetProperty();
          command.layer = env.currentVectorLayer;
          command.new_posingLayer = selected_Option.data;
          if (command.isAvailable(env)) {

            env.commandHistory.executeCommand(command, env);
          }
        }
        break;
    }
  }

  protected paletteSelectorWindow_CommandButton_Click(item: UI_CommandButtonsItem) {

    let wnd = this.paletteSelectorWindow;
    let env = this.toolEnv;

    wnd.currentTargetID = item.index;

    env.setRedrawColorSelectorWindow();
    env.setRedrawColorMixerWindow();
  }

  protected paletteSelectorWindow_Item_Click(paletteColorIndex: int, color: PaletteColor) {

    let wnd = this.paletteSelectorWindow;
    let env = this.toolEnv;

    if (env.currentVectorLayer == null) {
      return;
    }

    let destColor = this.getPaletteSelectorWindow_SelectedColor();
    vec4.copy(destColor, color.color);

    if (wnd.currentTargetID == PaletteSelectorWindowButtonID.lineColor) {

      env.currentVectorLayer.line_PaletteColorIndex = paletteColorIndex;
    }
    else if (wnd.currentTargetID == PaletteSelectorWindowButtonID.fillColor) {

      env.currentVectorLayer.fill_PaletteColorIndex = paletteColorIndex;
    }

    env.setRedrawLayerWindow();
    env.setRedrawMainWindowEditorWindow();
  }

  protected setColorMixerRGBElementEvent(id: string, elementID: int) {

    let env = this.toolEnv;

    this.getElement(id + this.ID.colorMixer_id_number).addEventListener('change', () => {

      let numberValue = this.getInputElementNumber(id + this.ID.colorMixer_id_number, 0.0);

      let color = this.getPaletteSelectorWindow_CurrentColor();

      if (color != null) {

        color[elementID] = numberValue;
      }

      env.setRedrawMainWindow();
      env.setRedrawColorSelectorWindow();
      env.setRedrawColorMixerWindow();
    });

    this.getElement(id + this.ID.colorMixer_id_range).addEventListener('change', () => {

      let rangeValue = this.getInputElementRangeValue(id + this.ID.colorMixer_id_range, 1.0, 1.0);

      let color = this.getPaletteSelectorWindow_CurrentColor();

      if (color != null) {

        color[elementID] = rangeValue;
      }

      env.setRedrawMainWindow();
      env.setRedrawColorSelectorWindow();
      env.setRedrawColorMixerWindow();
    });
  }

  protected setColorMixerHSVElementEvent(id: string) {

    let env = this.toolEnv;

    this.getElement(id + this.ID.colorMixer_id_number).addEventListener('change', () => {

      let hueValue = this.getInputElementNumber(this.ID.colorMixer_hue + this.ID.colorMixer_id_number, 0.0);
      let satValue = this.getInputElementNumber(this.ID.colorMixer_sat + this.ID.colorMixer_id_number, 0.0);
      let valValue = this.getInputElementNumber(this.ID.colorMixer_val + this.ID.colorMixer_id_number, 0.0);

      let color = this.getPaletteSelectorWindow_CurrentColor();

      if (color != null) {

        ColorLogic.hsvToRGB(color, hueValue, satValue, valValue);

        env.setRedrawMainWindow();
        env.setRedrawColorSelectorWindow();
        env.setRedrawColorMixerWindow();
      }
    });

    this.getElement(id + this.ID.colorMixer_id_range).addEventListener('change', () => {

      let hueValue = this.getInputElementRangeValue(this.ID.colorMixer_hue + this.ID.colorMixer_id_range, 1.0, 1.0);
      let satValue = this.getInputElementRangeValue(this.ID.colorMixer_sat + this.ID.colorMixer_id_range, 1.0, 1.0);
      let valValue = this.getInputElementRangeValue(this.ID.colorMixer_val + this.ID.colorMixer_id_range, 1.0, 1.0);

      let color = this.getPaletteSelectorWindow_CurrentColor();

      if (color != null) {

        ColorLogic.hsvToRGB(color, hueValue, satValue, valValue);

        env.setRedrawMainWindow();
        env.setRedrawColorSelectorWindow();
        env.setRedrawColorMixerWindow();
      }
    });
  }

  protected colorMixerWindow_colorCanvas_mousedown() {

    let wnd = this.colorMixerWindow_colorCanvas;
    let e = wnd.toolMouseEvent;
    let env = this.toolEnv;

    if (!e.isLeftButtonPressing()) {
      return;
    }

    this.canvasRender.setContext(wnd);
    this.canvasRender.pickColor(this.tempColor4, wnd, e.offsetX, e.offsetY);

    let color = this.getPaletteSelectorWindow_CurrentColor();

    if (color != null) {

      color[0] = this.tempColor4[0];
      color[1] = this.tempColor4[1];
      color[2] = this.tempColor4[2];

      env.setRedrawMainWindow();
      env.setRedrawColorSelectorWindow();
      env.setRedrawColorMixerWindow();
    }
  }

  protected colorMixerWindow_changeColor(newColor: Vec4) {

    let env = this.toolEnv;

    let color = this.getPaletteSelectorWindow_CurrentColor();

    if (color != null) {

      vec4.copy(color, newColor);

      env.setRedrawMainWindow();
      env.setRedrawColorSelectorWindow();
    }

  }

  protected timeLineWindow_mousedown() {

    let wnd = this.timeLineWindow;
    let e = wnd.toolMouseEvent;

    let context = this.toolContext;

    let left = wnd.getTimeLineLeft();

    if (e.offsetX < left) {

      this.timeLineWindow_OnPlayPauseButton();
    }
    else {

      this.timeLineWindow_ProcessFrameInput();
    }
  }

  protected timeLineWindow_OnPlayPauseButton() {

    let context = this.toolContext;
    let env = this.toolEnv;
    let aniSetting = context.document.animationSettingData;

    if (context.animationPlaying) {

      context.animationPlaying = false;

      env.setRedrawTimeLineWindow();
    }
    else {

      context.animationPlaying = true;
      context.animationPlayingFPS = aniSetting.animationFrameParSecond;
    }
  }

  protected timeLineWindow_ProcessFrameInput() {

    let wnd = this.timeLineWindow;
    let e = wnd.toolMouseEvent;

    let context = this.toolContext;
    let env = this.toolEnv;
    let aniSetting = context.document.animationSettingData;

    let clickedFrame = wnd.getFrameByLocation(e.offsetX, aniSetting);

    if (clickedFrame != -1 && clickedFrame != aniSetting.currentTimeFrame) {

      this.setCurrentFrame(clickedFrame);
      env.setRedrawMainWindowEditorWindow();
      env.setRedrawTimeLineWindow();
    }
  }

  protected timeLineWindow_mousemove() {

    let wnd = this.timeLineWindow;
    let e = wnd.toolMouseEvent;

    if (e.isLeftButtonPressing()) {

      this.timeLineWindow_ProcessFrameInput();
    }
  }

  protected timeLineWindow_mouseup() {
  }

  protected timeLineWindow_mousewheel() {

    let wnd = this.timeLineWindow;
    let e = wnd.toolMouseEvent;

    let context = this.toolContext;
    let env = this.toolEnv;
    let aniSetting = context.document.animationSettingData;

    if (env.isCtrlKeyPressing()) {

      let addScale = 0.2;

      if (e.wheelDelta > 0) {

        aniSetting.timeLineWindowScale += addScale;
      }
      else {

        aniSetting.timeLineWindowScale -= addScale;
      }

      if (aniSetting.timeLineWindowScale < 1.0) {

        aniSetting.timeLineWindowScale = 1.0;
      }

      if (aniSetting.timeLineWindowScale > aniSetting.timeLineWindowScaleMax) {

        aniSetting.timeLineWindowScale = aniSetting.timeLineWindowScaleMax;
      }

      env.setRedrawTimeLineWindow();
    }
  }

  protected setOperatorCursorLocationToMouse() {

    vec3.copy(this.toolContext.operatorCursor.location, this.mainWindow.toolMouseEvent.location);
    this.toolEnv.setRedrawEditorWindow();
  }
}
