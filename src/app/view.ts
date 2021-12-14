import { ToolDrawingStyle } from "./drawing/drawing_style"
import { ImageResource, ModelFile, ModelResource } from './posing3d/posing3d_view'
import { CanvasRender, CanvasWindow } from './render/render2d'
import { UI_Dialog_DocumentFilerRef } from './ui/dialog_document_filer'
import { UI_SelectBoxOption } from './ui/selectbox'
import { UI_SideBarContainerRef } from './ui/side_bar_container'
import { ColorMixerWindow } from './window/color_mixer_window'
import { DOMOperationLogic } from './window/dom'
import { FooterWindow } from './window/footer_window'
import { HeaderWindow } from './window/header_window'
import { LayerWindow } from './window/layer_window'
import { OperationPanel } from './editor/operation_panel'
import { CanvasRuler } from './editor/canvas_ruler'
import { PaletteSelectorWindow } from './window/palette_selector_window'
import { SubToolWindow } from './window/subtool_window'
import { TimeLineWindow } from './window/timeline_window'
import { ViewKeyframeLogic } from './view/view_keyframe'
import { ViewLayerListLogic } from './view/view_layer_list'
import { ViewCoordinateLogic } from './view/view_coordinate'
import { PointerInputLogic, PointerInputWindow } from './view/pointer_input'
import { LayerHighlightingLogic } from './view/layer_highlighting'
import { DOMElementID } from './window/dom_element_id'
import { DOMResizingLogic } from './window/dom_resizing'
import { DialogWindow_Main_Interface, DialogWindowLogic } from './dialog/dialog'
import { ViewOperation } from "./view/view_operation"
import { RibbonUIWindow } from "./window/ribbon_ui_window"
import { CanvasFrame } from "./editor/canvas_frame"
import { ModalWindowLogic } from "./window/modal_window"
import { DocumentContext } from "./context/document_context"

export class App_View {

  // Sub logics

  viewOperation = new ViewOperation()
  layerHighlight = new LayerHighlightingLogic()
  viewKeyframe = new ViewKeyframeLogic()
  viewLayerList = new ViewLayerListLogic()
  viewCoordinate = new ViewCoordinateLogic()
  pointerInput = new PointerInputLogic()
  dom = new DOMOperationLogic()
  domResizing = new DOMResizingLogic()
  ID = new DOMElementID()
  dialog = new DialogWindowLogic()
  modalWindow = new ModalWindowLogic()

  // UI

  mainWindow = new PointerInputWindow()
  editorWindow = new PointerInputWindow()
  headerWindow = new HeaderWindow()
  ribbonUIWindow = new RibbonUIWindow()
  footerWindow = new FooterWindow()
  operationPanel = new OperationPanel()
  canvasRulerH = new CanvasRuler()
  canvasRulerV = new CanvasRuler()
  canvasFrame = new CanvasFrame()
  layerWindow = new LayerWindow()
  timeLineWindow = new TimeLineWindow()
  paletteSelectorWindow = new PaletteSelectorWindow()
  colorMixerWindow = new ColorMixerWindow()
  subToolWindow = new SubToolWindow()
  uiSideBarContainerRef: UI_SideBarContainerRef = {}
  uiDialogDocumentFilerRef: UI_Dialog_DocumentFilerRef = {}
  posingLayerOptions: UI_SelectBoxOption[] = []
  activeCanvasWindow: CanvasWindow = null

  // Drawing variables

  foreLayerRenderWindow = new CanvasWindow()
  backLayerRenderWindow = new CanvasWindow()
  drawGPUWindow = new CanvasWindow()
  webglWindow = new CanvasWindow()

  // Resources

  imageResurces: ImageResource[] = []
  systemImage: ImageResource = null
  subToolImages: ImageResource[] = []
  modelFile = new ModelFile().file('models.json')
  modelResources: ModelResource[] = []

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, main: DialogWindow_Main_Interface) {

    this.viewOperation.link(this.pointerInput)
    this.layerHighlight.link(this.layerWindow, this.viewLayerList)
    this.colorMixerWindow.link(canvasRender)
    this.headerWindow.link(this.dom, this.ID)
    this.footerWindow.link(this.dom, this.ID)
    this.timeLineWindow.link(canvasRender, drawStyle, this.systemImage)
    this.operationPanel.link(drawStyle)
    this.canvasRulerH.link(drawStyle)
    this.canvasRulerV.link(drawStyle)
    this.canvasFrame.link(drawStyle)
    this.dialog.link(this.dialog, this.dom, this.ID, main)
  }

  // Initializing without resources

  initializeViewDevices() {

    this.imageResurces = []
    this.imageResurces.push(new ImageResource().set({ fileName: 'texture01.png', isGLTexture: true }))
    this.imageResurces.push(new ImageResource().set({ fileName: 'system_image01.png', cssImageClassName: 'image-splite-system' }))
    this.imageResurces.push(new ImageResource().set({ fileName: 'toolbar_image01.png', cssImageClassName: 'image-splite-document' }))
    this.imageResurces.push(new ImageResource().set({ fileName: 'toolbar_image02.png', cssImageClassName: 'image-splite-subtool' }))
    this.imageResurces.push(new ImageResource().set({ fileName: 'toolbar_image03.png', cssImageClassName: 'image-splite-posing3d' }))
    this.imageResurces.push(new ImageResource().set({ fileName: 'layerbar_image01.png' }))

    this.systemImage = this.imageResurces[1]

    this.subToolImages = []
    this.subToolImages.push(this.imageResurces[2])
    this.subToolImages.push(this.imageResurces[3])
    this.subToolImages.push(this.imageResurces[4])

    this.modelFile.file('models.json')

    this.foreLayerRenderWindow.createCanvas()
    this.backLayerRenderWindow.createCanvas()
    this.drawGPUWindow.createCanvas()

    // this.resizeWindows()

    this.mainWindow.initializeContext()
    this.editorWindow.initializeContext()
    this.foreLayerRenderWindow.initializeContext()
    this.backLayerRenderWindow.initializeContext()

    this.colorMixerWindow.colorCanvas.initializeContext()
    this.timeLineWindow.initializeContext()

    this.paletteSelectorWindow.initialize()

    this.startLoadingImageResources()
  }

  startLoadingImageResources() {

    this.operationPanel.startLoadingImageResources()
  }

  // Initializing after loading resources

  initializeViewState() {

    this.mainWindow.centerLocationRate[0] = 0.5
    this.mainWindow.centerLocationRate[1] = 0.5

    this.domResizing.resizeByStyle(this.colorMixerWindow.colorCanvas)
  }

  // View management

  resizeWindows() {

    this.domResizing.resizeCanvasToParent(this.mainWindow)

    this.domResizing.fitCanvas(this.editorWindow, this.mainWindow, 1)
    this.domResizing.fitCanvas(this.foreLayerRenderWindow, this.mainWindow, 1)
    this.domResizing.fitCanvas(this.backLayerRenderWindow, this.mainWindow, 1)
    this.domResizing.fitCanvas(this.webglWindow, this.mainWindow, 1)
    this.domResizing.fitCanvas(this.drawGPUWindow, this.mainWindow, 2.0)

    this.domResizing.resizeCanvasToClientSize(this.timeLineWindow)
  }

  // Ribbon UI

  updateRibbonUI(docContext: DocumentContext, forceRedraw = false) {

    // console.log("updateRibbonUI", forceRedraw, this.docContext.subToolIndex)

    this.updateRibbonUI_Tabs(docContext)

    this.updateRibbonUI_Home(docContext)

    this.updateRibbonUI_Edit(docContext)

    this.updateRibbonUI_Settings(docContext)

    this.updateRibbonUI_Layer(docContext)

    if (this.subToolWindow.uiSubToolWindowRef.update) {

      if (forceRedraw) {

        this.subToolWindow.uiSubToolWindowRef.update(this.subToolWindow.subToolViewItems.slice(), docContext.subtoolID)
      }
      else {

        this.subToolWindow.uiSubToolWindowRef.update(this.subToolWindow.subToolViewItems, docContext.subtoolID)
      }
    }
  }

  updateRibbonUI_Tabs(docContext: DocumentContext) {

    this.ribbonUIWindow.updateTabAndRibbon(docContext)
  }

  updateRibbonUI_Home(docContext: DocumentContext) {

    this.ribbonUIWindow.updateHomeUI(docContext)
  }

  updateRibbonUI_Edit(docContext: DocumentContext) {

    this.ribbonUIWindow.updateEditUI(docContext)
  }

  updateRibbonUI_Settings(docContext: DocumentContext) {

    this.ribbonUIWindow.updateDocumentUI(docContext)
  }

  updateRibbonUI_Layer(docContext: DocumentContext) {

    this.ribbonUIWindow.updateLayerUI(docContext, this.posingLayerOptions)
  }
}
