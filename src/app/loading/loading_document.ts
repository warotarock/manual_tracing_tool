import { Strings } from '../logics/conversion'
import { DocumentData, DocumentFileType, ImageFileReferenceLayer, Layer } from '../document_data'
import { Posing3DModelLogic } from '../posing3d/posing3d_model'
import { ImageResource } from '../posing3d/posing3d_view'
import { WebGLRender } from '../render/render3d'
import { DocumentFileNameLogic } from '../document_logic/filename'
import { UserSettingLogic } from '../preferences/user_setting'
import { DocumentLoader, DocumentLoaderOraSettings } from './document_loader'
import { ResourceLoader } from './resource_loader'

export class LoadingDocumentLogic {

  private documentLoader = new DocumentLoader()
  private resourceLoader = new ResourceLoader()
  private userSetting: UserSettingLogic = null

  oraSettings: DocumentLoaderOraSettings = null

  loading_DocumentData: DocumentData = null
  loading_ImageResurces: ImageResource[] = []

  loadingResoure_DocumentData: DocumentData = null

  link(posing3DViewRender: WebGLRender, posing3DModel: Posing3DModelLogic, userSetting: UserSettingLogic, oraSettings: DocumentLoaderOraSettings) {

    this.documentLoader.oraSettings = oraSettings

    this.resourceLoader.posing3DModel = posing3DModel
    this.resourceLoader.posing3DViewRender = posing3DViewRender

    this.userSetting = userSetting

    this.oraSettings = oraSettings
  }

  // Document data

  isDocumentLoading(): boolean {

    return (this.loading_DocumentData != null)
  }

  isDocumentLoaded(): boolean {

    if (this.isDocumentLoading()) {

      return this.loading_DocumentData.loaded
    }

    return false
  }

  startLoadingDocumentFromFile(file: File, url: string): boolean {

    // Get document type from name
    const fileType = DocumentFileNameLogic.getDocumentFileTypeFromName(url)

    if (fileType == DocumentFileType.none) {

      console.debug('error: not supported file type.')
      return
    }

    let documentData: DocumentData = null

    if (file != null) {

      if (fileType == DocumentFileType.json) {

        documentData = new DocumentData()

        this.documentLoader.startLoadingDocumentJsonFromFile(documentData, file)
      }
      else if (fileType == DocumentFileType.ora) {

        documentData = new DocumentData()

        this.documentLoader.startLoadingDocumentOraFromFile(documentData, file)
      }
    }
    else if (file == null && !Strings.isNullOrEmpty(url)) {

      documentData = new DocumentData()

      this.documentLoader.startLoadingDocumentFromURL(documentData, url)
    }

    this.loading_DocumentData = documentData

    return this.isDocumentLoading()
  }

  startLoadingDocumentFromURL(documentData: DocumentData, url: string) {

    this.loading_DocumentData = documentData

    this.documentLoader.startLoadingDocumentFromURL(documentData, url)
  }

  finishDocumentDataLoading() {

    this.loading_DocumentData = null
  }

  hasErrorOnLoadingDocument(): boolean {

    return this.loading_DocumentData.hasErrorOnLoading
  }

  // Document resources

  startLoadingDocumentResources(document: DocumentData) {

    this.loadingResoure_DocumentData = document

    this.loading_ImageResurces = []

    for (const layer of document.rootLayer.childLayers) {

      this.startLoadingDocumentResourcesRecursive(layer, this.loading_ImageResurces)
    }
  }

  private startLoadingDocumentResourcesRecursive(layer: Layer, loadingDocumentImageResources: ImageResource[]) {

    if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      // Create an image resource

      const ifrLayer = <ImageFileReferenceLayer>layer

      if (ifrLayer.imageResource == null) {

        ifrLayer.imageResource = new ImageResource()
      }

      // Load an image file

      // TODO: いずれ同時読み込み数の限界の問題が発生するので、そのうち対処する

      const imageResource = ifrLayer.imageResource

      if (!imageResource.loaded && !Strings.isNullOrEmpty(ifrLayer.imageFilePath)) {

        const refFileBasePath = this.userSetting.localSetting.referenceDirectoryPath

        if (!Strings.isNullOrEmpty(refFileBasePath)) {

          imageResource.fileName = refFileBasePath + '/' + ifrLayer.imageFilePath
        }
        else {

          imageResource.fileName = ifrLayer.imageFilePath
        }

        this.resourceLoader.startLoadingImageResource(imageResource, imageResource.fileName)

        loadingDocumentImageResources.push(imageResource)
      }
    }

    for (const chldLayer of layer.childLayers) {

      this.startLoadingDocumentResourcesRecursive(chldLayer, loadingDocumentImageResources)
    }
  }

  isDocumentResourceLoading(): boolean {

    if (this.loading_ImageResurces.find(item => item.loaded == false)) {
      return true
    }

    return false
  }
}
