import { Platform } from '../platform'
import { UserStorage } from '../platform/user-strage'
import { App_Drawing } from './app-drawing'
import { App_Tool } from './app-tool'
import { App_View } from './app-view'
import {
  Command_Animation_DeleteKeyframeAllLayer, Command_Animation_InsertKeyframeAllLayer, Command_Layer_CommandBase,
  Command_Layer_CreateDefaultDocumentLayers
} from './commands'
import { DocumentContext, SubToolContext, SubToolContext_AppDocument_Interface } from './context'
import {
  AnimationSettingData,
  DocumentBackGroundTypeID, DocumentData, DocumentFileType, ImageFileTypeID, Layer, LayerTypeID, OnionSkinMode
} from './document-data'
import { DocumentDataSerializingState, DocumentDeserializingLogic, DocumentFileNameLogic, DocumentSerializingLogic, EditAnimationFrameLogic } from './document-logic'
import { DocumentLoaderOraSettings, DocumentLoading } from './loading'
import { float, int, Strings } from './common-logics'
import { ModelFile, Posing3DLogic, Posing3DModelLogic } from './posing3d'
import { CanvasWindow } from './render'
import { DeleteKeyframeTypeID, NewKeyframeTypeID } from './ui'
import { UserSettingFileLogic } from './user-setting'
import { ViewKeyframe } from './view'

export class App_Document implements SubToolContext_AppDocument_Interface {

  documentLoading = new DocumentLoading()
  oraSettings = new DocumentLoaderOraSettings()

  posing3D = new Posing3DLogic()
  posing3DModel = new Posing3DModelLogic()

  private appView: App_View = null
  private appDrawing: App_Drawing = null
  private appTool: App_Tool = null
  private userSetting: UserSettingFileLogic = null

  private docContext: DocumentContext = null
  private subtoolContext: SubToolContext = null

  link(appView: App_View, appDrawing: App_Drawing, appTool: App_Tool, userSetting: UserSettingFileLogic) {

    this.appView = appView
    this.appDrawing = appDrawing
    this.appTool = appTool
    this.userSetting = userSetting

    this.documentLoading.link(this.appDrawing.posing3DViewRender, this.posing3DModel, this.oraSettings)
  }

  linkContexts(docContext: DocumentContext, toolContext: SubToolContext) {

    this.docContext = docContext
    this.subtoolContext = toolContext
  }

  // Loading

  fixLoadedDocumentData(documentData: DocumentData, modelFile: ModelFile) {

    const state = new DocumentDataSerializingState()
    state.modelFile = modelFile

    const loadedVersiotn = documentData.version

    DocumentDeserializingLogic.fixLoadedDocumentData(documentData, state)

    if (documentData.version != loadedVersiotn) {
      console.log('Document migrated:', loadedVersiotn, '->', documentData.version)
    }
  }

  // Saving

  saveDocumentData(save_filePath: string, documentData: DocumentData, forceToLocal: boolean) {

    const save_DocumentData = this.createSaveDocumentData(documentData, save_filePath)

    this.userSetting.registerLastUsedFile(save_filePath)

    if (forceToLocal) {

      UserStorage.setItem(UserSettingFileLogic.localStorage_DefaultDocumentDataKey, save_DocumentData)

      return
    }

    const fileType = DocumentFileNameLogic.getDocumentFileTypeFromName(save_filePath)

    const documentDataString = JSON.stringify(save_DocumentData)

    if (fileType == DocumentFileType.json) {

      this.saveDocumentJsonFile(save_filePath, documentDataString)
    }
    else if (fileType == DocumentFileType.ora) {

      const margedImage = this.createExportImage(documentData, this.docContext.currentViewKeyframe, 1.0, documentData.exportImageSetting.backGroundType)

      this.saveDocumentOraFile(save_filePath, documentDataString, margedImage)
    }
  }

  saveDocumentJsonFile(filePath: string, documentDataString: string) {

    Platform.fileSystem.writeFile(filePath, documentDataString, 'utf8')
  }

  saveDocumentOraFile(filePath: string, documentDataString: string, margedImage: HTMLCanvasElement) {

    ora.scriptsPath = this.documentLoading.oraSettings.scriptsPath
    // ora.blending = false
    ora.enableWorkers = false // TODO: ElectronのあるバージョンからWebWorkerが挙動が変わったのかなんなのか動作しないので、そのうち自作するしかないかと思っています。WebAssemblyとか？

    const oraFile = new ora.Ora(margedImage.width, margedImage.height)

    const layer = oraFile.addLayer('marged', 0)
    layer.image = margedImage

    oraFile.save(
      this.documentLoading.oraSettings.vectorFileName
      , documentDataString
      , (dataURL: string) => {
        Platform.fileSystem.writeFile(filePath, dataURL, 'base64')
      }
    )
  }

  createSaveDocumentData(documentData: DocumentData, save_filePath: string): DocumentData {

    return DocumentSerializingLogic.duplicateDocumentDataForSave(documentData, save_filePath)
  }

  // Exporting

  createExportImage(documentData: DocumentData, viewKeyframe: ViewKeyframe, scale: float, backGroundType: DocumentBackGroundTypeID): HTMLCanvasElement {

    const layout = DocumentData.getDocumentLayout(documentData, scale)

    if (layout.width <= 0 || layout.height <= 0) {
      return null
    }

    const exportRenderWindow = new CanvasWindow()

    exportRenderWindow.createCanvas(layout.width, layout.height)

    this.appDrawing.drawExportImage(
      exportRenderWindow,
      documentData,
      viewKeyframe,
      layout.left,
      layout.top,
      layout.width,
      layout.height,
      scale,
      backGroundType
    )

    const canvas = exportRenderWindow.releaseCanvas()

    return canvas
  }

  exportImageFile(fileName: string, exportPath: string, scale: float, imageFileType: ImageFileTypeID, backGroundType: DocumentBackGroundTypeID, exportingCount: int) {

    const documentData = this.docContext.documentData
    const viewKeyframe = this.docContext.currentViewKeyframe

    const canvas = this.createExportImage(documentData, viewKeyframe, scale, backGroundType)

    if (canvas == null) {
      return
    }

    let extText = '.png'
    if (imageFileType == 2) {
      extText = '.jpg'
    }

    // TODO: ファイルシステムかファイルごとの\か/かを統一してファイル名を作成する
    const fileFullPath = Platform.path.join(exportPath, fileName + extText)

    let imageFileTypeText = 'image/png'
    if (imageFileType == 2) {
      imageFileTypeText = 'image/jpeg'
    }

    const dataURL = canvas.toDataURL(imageFileTypeText, 0.9)

    Platform.fileSystem.writeFile(fileFullPath, dataURL, 'base64')

    // Free canvas memory
    canvas.width = 10
    canvas.height = 10

    // increment the count
    documentData.exportImageSetting.exportingCount = exportingCount + 1
  }

  // Document operation

  findLayers(layers: Layer[], matchingCallback: (layer: Layer) => boolean): Layer[] {

    const result: Layer[] = []

    this.findLayerRecursive(result, layers, matchingCallback)

    return result
  }

  private findLayerRecursive(result: Layer[], layers: Layer[], matchingCallback: (layer: Layer) => boolean) {

    for (const layer of layers) {

      if (matchingCallback(layer)) {
        result.push(layer)
      }

      this.findLayerRecursive(result, layer.childLayers, matchingCallback)
    }
  }

  createDefaultDocumentData(): DocumentData {

    const localData = UserStorage.getItem<string>(UserSettingFileLogic.localStorage_DefaultDocumentDataKey)
    if (!Strings.isNullOrEmpty(localData)) {

      const documentData: DocumentData = JSON.parse(localData)
      documentData.loaded = true

      return documentData
    }

    const documentData = new DocumentData()

    const createCommand = new Command_Layer_CreateDefaultDocumentLayers()
    createCommand.executeWithoutRedraw(documentData, this.subtoolContext)

    //{
    //    let layer1 = new PosingLayer()
    //    layer1.name = 'posing1'
    //    rootLayer.childLayers.push(layer1)
    //    layer1.posingModel = this.modelFile.posingModelDictionary['dummy_skin']
    //}

    documentData.loaded = true

    return documentData
  }

  executeNewKeyframe(typeID: NewKeyframeTypeID) {

    switch (typeID) {

      case NewKeyframeTypeID.insertToCurrentFrameAllLayer:
        {
          const command = new Command_Animation_InsertKeyframeAllLayer()
          command.rootLayer = this.subtoolContext.documentData.rootLayer
          command.frame = this.subtoolContext.documentData.animationSettingData.currentTimeFrame
          command.prepareEditData(this.subtoolContext)

          if (command.isAvailable(this.subtoolContext)) {

            this.subtoolContext.commandHistory.executeCommand(command, this.subtoolContext)
          }
        }
        break

      case NewKeyframeTypeID.insertToCurrentFrameActiveLayer:
        break

      case NewKeyframeTypeID.insertEmptyToAllLayer:
        break

      case NewKeyframeTypeID.insertEmptyToActiveLayer:
        break
    }
  }

  executeDeleteKeyframe(typeID: DeleteKeyframeTypeID) {

    switch (typeID) {

      case DeleteKeyframeTypeID.deleteCurrentFrameAllLayer: {

        const command = new Command_Animation_DeleteKeyframeAllLayer()
        command.rootLayer = this.subtoolContext.documentData.rootLayer
        command.frame = this.subtoolContext.documentData.animationSettingData.currentTimeFrame
        command.prepareEditData(this.subtoolContext)

        if (command.isAvailable(this.subtoolContext)) {

          this.subtoolContext.commandHistory.executeCommand(command, this.subtoolContext)
        }

        break
      }

      case DeleteKeyframeTypeID.deleteCurrentFrameActiveLayer:
        break
    }
  }

  executeLayerCommand(layerCommand: Command_Layer_CommandBase) {

    const currentLayerWindowItem = this.appView.viewLayerList.findItemForLayer(this.docContext, this.subtoolContext.currentLayer)

    if (currentLayerWindowItem == null) {

      return
    }

    this.appTool.setLayerCommandParameters(layerCommand, currentLayerWindowItem, this.subtoolContext.documentData)

    if (layerCommand.isAvailable(this.subtoolContext)) {

      this.subtoolContext.commandHistory.executeCommand(layerCommand, this.subtoolContext)
    }
  }

  moveKeyframe(moveForward: boolean) {

    const done = EditAnimationFrameLogic.moveKeyframeData(
      this.docContext.currentViewKeyframe,
      this.docContext.previousKeyframe,
      this.docContext.nextKeyframe,
      moveForward
    )

    if (done) {

      this.subtoolContext.setRedrawMainWindowEditorWindow()
      this.subtoolContext.setRedrawTimeLineWindow()
    }
  }

  changeAnimationMaxFrame(moveForward: boolean) {

    EditAnimationFrameLogic.changeAnimationMaxFrame(this.docContext.documentData.animationSettingData, moveForward)

    this.subtoolContext.setRedrawMainWindowEditorWindow()
    this.subtoolContext.setRedrawTimeLineWindow()
  }

  changeLoopStartFrame(moveForward: boolean) {

    EditAnimationFrameLogic.changeLoopStartFrame(this.docContext.documentData.animationSettingData, moveForward)

    this.subtoolContext.setRedrawMainWindowEditorWindow()
    this.subtoolContext.setRedrawTimeLineWindow()
  }

  changeLoopEndFrame(moveForward: boolean) {

    EditAnimationFrameLogic.changeLoopEndFrame(this.docContext.documentData.animationSettingData, moveForward)

    this.subtoolContext.setRedrawMainWindowEditorWindow()
    this.subtoolContext.setRedrawTimeLineWindow()
  }

  changeOnionSkinMode(mode: OnionSkinMode) {

    this.docContext.documentData.animationSettingData.onionSkinMode = mode

    this.subtoolContext.updateLayerStructure()
    this.subtoolContext.setRedrawMainWindowEditorWindow()
    this.subtoolContext.setRedrawTimeLineWindow()
  }

  changeOnionSkinBackwardLevel(add: boolean) {

    const newValue = this.docContext.documentData.animationSettingData.onionSkinBackwardLevel + (add ? 1 : -1)

    this.docContext.documentData.animationSettingData.onionSkinBackwardLevel = Math.min(AnimationSettingData.MAX_ONION_SIKIN_FRAMES, Math.max(newValue, 0))

    this.subtoolContext.updateLayerStructure()
    this.subtoolContext.setRedrawMainWindowEditorWindow()
    this.subtoolContext.setRedrawTimeLineWindow()
  }

  changeOnionSkinForwardLevel(add: boolean) {

    const newValue = this.docContext.documentData.animationSettingData.onionSkinForwardLevel + (add ? 1 : -1)

    this.docContext.documentData.animationSettingData.onionSkinForwardLevel = Math.min(AnimationSettingData.MAX_ONION_SIKIN_FRAMES, Math.max(newValue, 0))

    this.subtoolContext.updateLayerStructure()
    this.subtoolContext.setRedrawMainWindowEditorWindow()
    this.subtoolContext.setRedrawTimeLineWindow()
  }

  // SubToolContext_AppDocument_Interface implementations

  getLayerBaseName(layerType: LayerTypeID): string { // @implements SubToolContext_AppDocument_Interface

    let base_LayerName = ''

    switch (layerType) {

      case LayerTypeID.groupLayer:
        base_LayerName = 'グループ'
        break

      case LayerTypeID.vectorLayer:
        base_LayerName = '線画'
        break

      case LayerTypeID.surroundingFillLayer:
        base_LayerName = '囲み塗り'
        break

      case LayerTypeID.pointBrushFillLayer:
        base_LayerName = 'ブラシ塗り'
        break

      case LayerTypeID.vectorLayerReferenceLayer:
        base_LayerName = '線画参照'
        break

      case LayerTypeID.imageFileReferenceLayer:
        base_LayerName = '画像ファイル'
        break

      case LayerTypeID.autoFillLayer:
        base_LayerName = '自動囲み塗り'
        break

      case LayerTypeID.posingLayer:
        base_LayerName = 'ポージング'
        break

      default:
        throw new Error('ERROR 0000:No implementation for new layer name.')
    }

    return base_LayerName
  }

  getNewLayerName(layerType: LayerTypeID, isForDefaultDocument = false): string { // @implements SubToolContext_AppDocument_Interface

    let base_LayerName = this.getLayerBaseName(layerType)

    let new_index = 1

    if (!isForDefaultDocument) {

      const sameName_Layers = this.findLayers(
        this.docContext.documentData.rootLayer.childLayers,
        (layer) => Strings.startsWith(layer.name, base_LayerName)
      )

      for (const layer of sameName_Layers) {

        const afterName_Text = Strings.substring(layer.name, base_LayerName.length)

        if (Strings.isNullOrEmpty(afterName_Text)) {
          continue
        }

        const index = Number(afterName_Text)

        if (index && !isNaN(index) && index >= new_index) {

          new_index = index + 1
        }
      }
    }

    return `${base_LayerName}${new_index}`
  }
}
