import { DocumentContext } from "./context"
import { ToolDrawingStyle } from "./document-drawing"
import { DOMLogic } from "./dom/dom"
import { CanvasFrame, CanvasRuler, CanvasRulerOrientation, OperationPanel } from './editor'
import { ImageResource, ModelFile, ModelResource } from './posing3d'
import { CanvasRender, CanvasWindow } from './render'
import { ToolPointerEventProvider } from "./tool"
import { ColorMixerWindow, DialogScreenLogic, DialogWindow_Main_Interface, FooterWindow, HeaderWindow, LayerWindow, ModalWindowLogic, PaletteSelectorWindow, PopoverLogic, RibbonUIWindow, SideBarContentID, SubToolWindow, TimeLineWindow } from "./ui"
import { UI_SelectBoxOption } from "./ui-popover"
import { UI_SideBarContainerRef } from "./ui-sidebar"
import { UIStateNames } from "./user-setting"
import { UserUIStateLogic } from "./user-setting/user-ui-state"
import {
  LayerHighlightingLogic, PointerInputLogic, PointerInputWindow, ViewKeyframeLogic,
  ViewLayerListLogic, ViewOperation
} from "./view"

export class App_View {

  // Sub logics

  viewOperation = new ViewOperation()
  layerHighlight = new LayerHighlightingLogic()
  viewKeyframe = new ViewKeyframeLogic()
  viewLayerList = new ViewLayerListLogic()
  pointerInput = new PointerInputLogic()
  dom = new DOMLogic()
  dialogScreen = new DialogScreenLogic()
  modalWindow = new ModalWindowLogic()
  popover = new PopoverLogic()
  tooPointerEvent = new ToolPointerEventProvider()

  // UI

  isForMobile = false
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
  posingLayerOptions: UI_SelectBoxOption[] = []
  activeCanvasWindow: CanvasWindow = null

  left_SideBarContainerRef: UI_SideBarContainerRef = { }
  right_SideBarContainerRef: UI_SideBarContainerRef = { }

  sideBarContentStateSettings: { contentID: SideBarContentID, uiStateName: string }[] = [
    { contentID: SideBarContentID.layerWindow, uiStateName: UIStateNames.layerWindow },
    { contentID: SideBarContentID.paletteWindow, uiStateName: UIStateNames.paletteSelectorWindow },
    { contentID: SideBarContentID.colorMixerWindow, uiStateName: UIStateNames.colorMixerWindow }
  ]

  // Drawing variables

  foreLayerRenderBuffer = new CanvasWindow()
  backLayerRenderBuffer = new CanvasWindow()
  drawGPUWindow = new CanvasWindow()
  webglWindow = new CanvasWindow()

  // Resources

  imageResurces: ImageResource[] = []
  systemImage: ImageResource = null
  subToolImages: ImageResource[] = []
  modelFile = new ModelFile().file('models.json')
  modelResources: ModelResource[] = []

  link(canvasRender: CanvasRender, drawStyle: ToolDrawingStyle, main: DialogWindow_Main_Interface) {

    this.layerHighlight.link(this.viewLayerList)
    this.colorMixerWindow.link(canvasRender)
    this.headerWindow.link(this.dom)
    this.footerWindow.link(this.dom)
    this.timeLineWindow.link(canvasRender, drawStyle, this.dom, this.popover.selectBoxPopoverRef)
    this.ribbonUIWindow.link(this.popover.mainMenuUIRef, this.popover.brushPropertyBoxRef, this.popover.selectBoxPopoverRef)
    this.operationPanel.link(drawStyle)
    this.canvasRulerH.link(drawStyle)
    this.canvasRulerV.link(drawStyle)
    this.canvasFrame.link(drawStyle)
    this.dialogScreen.link(main, this.dom, this.popover.selectBoxPopoverRef)
  }

  // Initializing without resources

  initializeViewDevices() {

    this.imageResurces = []
    this.imageResurces.push(new ImageResource().set({ filePath: './res/texture01.png', isGLTexture: true }))
    this.imageResurces.push(new ImageResource().set({ filePath: './res/system_image01.png', cssImageClassName: 'image-splite-system' }))
    this.imageResurces.push(new ImageResource().set({ filePath: './res/toolbar_image03.png', cssImageClassName: 'image-splite-posing3d' }))

    this.systemImage = this.imageResurces[1]

    this.subToolImages = []
    this.subToolImages.push(this.imageResurces[2])

    this.modelFile.file('models.json')

    this.foreLayerRenderBuffer.createCanvas()
    this.backLayerRenderBuffer.createCanvas()
    this.drawGPUWindow.createCanvas()

    // this.resizeWindows()

    this.mainWindow.initializeContext()
    this.editorWindow.initializeContext()
    this.foreLayerRenderBuffer.initializeContext()
    this.backLayerRenderBuffer.initializeContext()

    this.colorMixerWindow.colorCanvas.initializeContext()
    this.timeLineWindow.canvasWindow.initializeContext()

    this.paletteSelectorWindow.initialize()

    this.startLoadingImageResources()

    this.activeCanvasWindow = this.mainWindow
  }

  startLoadingImageResources() {

    this.operationPanel.startLoadingImageResources()
  }

  // Initializing after loading resources

  initializeViewState() {

    this.mainWindow.centerLocationRate[0] = 0.5
    this.mainWindow.centerLocationRate[1] = 0.5
  }

  // View management

  resizeWindows() {

    this.dom.resizing.resizeCanvasToParent(this.mainWindow)

    this.dom.resizing.resizeCanvasToCanvasWindow(this.editorWindow, this.mainWindow, 1)
    this.dom.resizing.resizeCanvasToCanvasWindow(this.foreLayerRenderBuffer, this.mainWindow, 1)
    this.dom.resizing.resizeCanvasToCanvasWindow(this.backLayerRenderBuffer, this.mainWindow, 1)
    this.dom.resizing.resizeCanvasToCanvasWindow(this.webglWindow, this.mainWindow, 1)
    this.dom.resizing.resizeCanvasToCanvasWindow(this.drawGPUWindow, this.mainWindow, 2.0)

    this.dom.resizing.resizeCanvasToParent(this.timeLineWindow.canvasWindow)

    this.dom.resizing.fitFixedPositionToBoundingClientRect(this.dom.ID.leftSidePanel, this.dom.ID.leftSidePanelDock, true, true)
    this.dom.resizing.fitFixedPositionToBoundingClientRect(this.dom.ID.rightSidePanel, this.dom.ID.rightSidePanelDock, true, true)

    this.operationPanel.updateLayout(this.editorWindow)

    this.canvasRulerH.updateLayout(this.mainWindow, CanvasRulerOrientation.horizontalTop)
    this.canvasRulerV.updateLayout(this.mainWindow, CanvasRulerOrientation.verticalLeft)
  }

  setMobileMode() {

    const targets = [
      this.dom.ID.screenMain,
    ]

    for (const target of targets) {

      if (this.isForMobile) {

        this.dom.getElement<HTMLDivElement>(target).classList.add('mobile-screen')
      }
      else {

        this.dom.getElement<HTMLDivElement>(target).classList.remove('mobile-screen')
      }
    }
  }

  restoreUIStatesFromUserSetting(userUIState: UserUIStateLogic) {

    for (const setting of this.sideBarContentStateSettings) {

      const uiState = userUIState.getUIState(setting.uiStateName)

      if (uiState) {

        this.right_SideBarContainerRef.setContentOpened(setting.contentID, uiState.visible)
      }
    }

    this.right_SideBarContainerRef.update()

    {
      const uiState = userUIState.getUIState(UIStateNames.timeLineWindow)

      if (uiState) {

        this.timeLineWindow.setVisibility(uiState.visible)
      }
    }

    {
      const uiState = userUIState.getUIState(UIStateNames.touchOperationPanel)

      if (uiState) {

        this.operationPanel.setVisibility(uiState.visible)
      }
    }
  }

  // Ribbon UI

  updateTabs(docContext: DocumentContext) {

    this.ribbonUIWindow.switchTabAndRibbon(docContext)
  }

  updateRibbonUI(docContext: DocumentContext, forceRedraw = false) {

    // console.log("updateRibbonUI", forceRedraw, this.docContext.subToolIndex)

    this.ribbonUIWindow.updateMainToolRibbonUI(docContext)

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

  updateRibbonUI_Layer(docContext: DocumentContext) {

    this.ribbonUIWindow.updateLayerRibbonUI(docContext, this.posingLayerOptions)
  }
}
