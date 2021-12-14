import { float, int, Strings } from './logics/conversion'
import {
  DocumentBackGroundTypeID, DocumentData, DocumentDataSerializingState, DocumentFileType,
  LayerTypeID, VectorDrawingUnit, VectorLayer, VectorStrokeGroup
} from './document_data'
import { SubToolContext } from './context/subtool_context'
import { Platform } from '../platform/platform'
import { UserStorage } from '../platform/user_strage'
import { ModelFile } from './posing3d/posing3d_view'
import { CanvasWindow } from './render/render2d'
import {
  DocumentFileNameLogic, DocumentDeserializingLogic, DocumentSerializingLogic
} from './document_logic'
import { DocumentLoaderOraSettings } from './loading/document_loader'
import { LoadingDocumentLogic } from './loading/loading_document'
import { UserSettingLogic } from './preferences/user_setting'
import { ViewKeyframe } from './view/view_keyframe'
import { App_Drawing } from './drawing'
import { DeleteKeyframeTypeID } from './dialog/delete_keyframe_command_dialog'
import { NewKeyframeTypeID } from './dialog/new_keyframe_command_dialog'
import { App_View } from './view'
import { App_Tool } from './tool'
import { DocumentContext } from './context/document_context'
import {
  Command_Animation_InsertKeyframeAllLayer, Command_Animation_DeleteKeyframeAllLayer
} from './commands/edit_animation'
import { Command_Layer_CommandBase } from './commands/edit_layer'
import { Posing3DLogic } from './posing3d/posing3d_logic'
import { Posing3DModelLogic } from './posing3d/posing3d_model'
import { EyesSymmetryLogic } from './document_logic/eyes_symmetry'

export class App_Document {

  deserializing = new DocumentDeserializingLogic()
  serializing = new DocumentSerializingLogic()
  loadingDocument = new LoadingDocumentLogic()
  oraSettings = new DocumentLoaderOraSettings()
  posing3DLogic = new Posing3DLogic()
  posing3DModel = new Posing3DModelLogic()
  eyesSymmetry = new EyesSymmetryLogic()

  private appView: App_View = null
  private appDrawing: App_Drawing = null
  private appTool: App_Tool = null
  private userSetting: UserSettingLogic = null

  private docContext: DocumentContext = null
  private toolContext: SubToolContext = null

  link(appView: App_View, appDrawing: App_Drawing, appTool: App_Tool, userSetting: UserSettingLogic) {

    this.appView = appView
    this.appDrawing = appDrawing
    this.appTool = appTool
    this.userSetting = userSetting

    this.loadingDocument.link(this.appDrawing.posing3DViewRender, this.posing3DModel, this.userSetting, this.oraSettings)
    this.eyesSymmetry.link(this.posing3DLogic, this.appDrawing.posing3DView)
  }

  linkContexts(docContext: DocumentContext, toolContext: SubToolContext) {

    this.docContext = docContext
    this.toolContext = toolContext
  }

  // Loading

  fixLoadedDocumentData(documentData: DocumentData, modelFile: ModelFile) {

    const state = new DocumentDataSerializingState()
    state.modelFile = modelFile

    this.deserializing.fixLoadedDocumentData(documentData, state)
  }

  // Saving

  saveDocumentData(filePath: string, documentData: DocumentData, forceToLocal: boolean) {

    const save_DocumentData = this.createSaveDocumentData(documentData)

    this.userSetting.registerLastUsedFile(filePath)

    if (forceToLocal) {

      UserStorage.setItem(UserSettingLogic.localStorage_DefaultDocumentDataKey, save_DocumentData)

      return
    }

    const fileType = DocumentFileNameLogic.getDocumentFileTypeFromName(filePath)

    const documentDataString = JSON.stringify(save_DocumentData)

    if (fileType == DocumentFileType.json) {

      this.saveDocumentJsonFile(filePath, documentDataString)
    }
    else if (fileType == DocumentFileType.ora) {

      const margedImage = this.createExportImage(documentData, this.appDrawing.currentViewKeyframe, 1.0, documentData.exportBackGroundType)

      this.saveDocumentOraFile(filePath, documentDataString, margedImage)
    }
  }

  saveDocumentJsonFile(filePath: string, documentDataString: string) {

    Platform.fileSystem.writeFile(filePath, documentDataString, 'utf8')
  }

  saveDocumentOraFile(filePath: string, documentDataString: string, margedImage: HTMLCanvasElement) {

    ora.scriptsPath = this.loadingDocument.oraSettings.scriptsPath
    // ora.blending = false
    ora.enableWorkers = false // TODO: ElectronのあるバージョンからWebWorkerが挙動が変わったのかなんなのか動作しないので、そのうち自作するしかないかと思っています。WebAssemblyとか？

    const oraFile = new ora.Ora(margedImage.width, margedImage.height)

    const layer = oraFile.addLayer('marged', 0)
    layer.image = margedImage

    oraFile.save(
      this.loadingDocument.oraSettings.vectorFileName
      , documentDataString
      , (dataURL: string) => {
        Platform.fileSystem.writeFile(filePath, dataURL, 'base64')
      }
    )
  }

  createSaveDocumentData(documentData: DocumentData): DocumentData {

    const info = new DocumentDataSerializingState()
    this.serializing.fixSaveDocumentData_SetID_Recursive(documentData.rootLayer, info)
    this.serializing.fixSaveDocumentData_CopyID_Recursive(documentData.rootLayer, info)

    const save_documentData = JSON.parse(this.stringifyDocumentData(documentData))

    this.serializing.fixSaveDocumentData(save_documentData, info)

    return save_documentData
  }

  stringifyDocumentData(documentData: DocumentData): string {

    return JSON.stringify(documentData, (key, value) => {

      if (key == 'parentLayer'
      || key == 'imageResource') {

        return null
      }
      else {

        return value
      }
    })
  }

  // Exporting

  createExportImage(documentData: DocumentData, viewKeyframe: ViewKeyframe, scale: float, backGroundType: DocumentBackGroundTypeID): HTMLCanvasElement {

    const layout = DocumentData.getDocumentLayout(documentData, scale)

    if (layout.width <= 0 || layout.height <= 0) {
      return null
    }

    const exportRenderWindow = new CanvasWindow()

    exportRenderWindow.createCanvas()
    exportRenderWindow.setCanvasSize(layout.width, layout.height)
    exportRenderWindow.initializeContext()

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

  createDefaultDocumentData(): DocumentData {

    const localData = UserStorage.getItem<string>(UserSettingLogic.localStorage_DefaultDocumentDataKey)
    if (!Strings.isNullOrEmpty(localData)) {

      const document = JSON.parse(localData)
      document.loaded = true

      return document
    }

    const document = new DocumentData()

    const rootLayer = document.rootLayer
    rootLayer.type = LayerTypeID.rootLayer

    {
      const layer1 = new VectorLayer()
      layer1.name = 'layer1'
      rootLayer.childLayers.push(layer1)

      const unit = new VectorDrawingUnit()
      unit.groups.push(new VectorStrokeGroup())

      layer1.keyframes[0].geometry.units.push(unit)
    }

    //{
    //    let layer1 = new PosingLayer()
    //    layer1.name = 'posing1'
    //    rootLayer.childLayers.push(layer1)
    //    layer1.posingModel = this.modelFile.posingModelDictionary['dummy_skin']
    //}

    document.loaded = true

    return document
  }

  exportImageFile(fileName: string, exportPath: string, scale: float, imageType: int, backGroundType: DocumentBackGroundTypeID) {

    const documentData = this.docContext.document
    const viewKeyframe = this.appDrawing.currentViewKeyframe

    const canvas = this.createExportImage(documentData, viewKeyframe, scale, backGroundType)

    if (canvas == null) {
      return
    }

    let extText = '.png'
    if (imageType == 2) {
      extText = '.jpg'
    }

    const fileFullPath = exportPath + '/' + fileName + extText

    let imageTypeText = 'image/png'
    if (imageType == 2) {
      imageTypeText = 'image/jpeg'
    }

    const dataURL = canvas.toDataURL(imageTypeText, 0.9)

    Platform.fileSystem.writeFile(fileFullPath, dataURL, 'base64')

    // Free canvas memory
    canvas.width = 10
    canvas.height = 10

    // increment the count
    documentData.exportingCount++
  }

  // Document operation

  executeNewKeyframe(typeID: NewKeyframeTypeID) {

    switch (typeID) {

      case NewKeyframeTypeID.insertToCurrentFrameAllLayer: {

        const command = new Command_Animation_InsertKeyframeAllLayer()
        command.rootLayer = this.toolContext.document.rootLayer
        command.frame = this.toolContext.document.animationSettingData.currentTimeFrame
        command.prepareEditData(this.toolContext)

        if (command.isAvailable(this.toolContext)) {

          this.toolContext.commandHistory.executeCommand(command, this.toolContext)
        }

        break
      }
    }
  }

  executeDeleteKeyframe(typeID: DeleteKeyframeTypeID) {

    switch (typeID) {

      case DeleteKeyframeTypeID.deleteToCurrentFrameAllLayer: {

        const command = new Command_Animation_DeleteKeyframeAllLayer()
        command.rootLayer = this.toolContext.document.rootLayer
        command.frame = this.toolContext.document.animationSettingData.currentTimeFrame
        command.prepareEditData(this.toolContext)

        if (command.isAvailable(this.toolContext)) {

          this.toolContext.commandHistory.executeCommand(command, this.toolContext)
        }

        break
      }
    }
  }

  executeLayerCommand(layerCommand: Command_Layer_CommandBase) {

    const currentLayerWindowItem = this.appView.viewLayerList.findItemForLayer(this.docContext, this.toolContext.currentLayer)

    if (currentLayerWindowItem == null) {

      return
    }

    this.appTool.setLayerCommandParameters(layerCommand, currentLayerWindowItem, this.toolContext.document)

    if (layerCommand.isAvailable(this.toolContext)) {

      this.toolContext.commandHistory.executeCommand(layerCommand, this.toolContext)
    }
  }
}
