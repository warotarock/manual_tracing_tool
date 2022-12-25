import { Strings } from '../common-logics'
import { DocumentData, DocumentFileType, ImageFileReferenceLayer, Layer } from '../document-data'
import { Posing3DModelLogic, ImageResource } from '../posing3d'
import { WebGLRender } from '../render'
import { DocumentFileNameLogic } from '../document-logic'
import { DocumentLoader, DocumentLoaderOraSettings } from './document-loader'
import { ResourceLoader } from './resource-loader'

export class DocumentLoading {

  private documentLoader = new DocumentLoader()
  private resourceLoader = new ResourceLoader()

  oraSettings: DocumentLoaderOraSettings = null

  loading_DocumentFilePath: string = ''
  loading_DocumentData: DocumentData = null
  loading_ImageResurces: ImageResource[] = []

  resourceLoading_DocumentData: DocumentData = null

  link(posing3DViewRender: WebGLRender, posing3DModel: Posing3DModelLogic, oraSettings: DocumentLoaderOraSettings) {

    this.documentLoader.oraSettings = oraSettings

    this.resourceLoader.posing3DModel = posing3DModel
    this.resourceLoader.posing3DViewRender = posing3DViewRender

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
    this.loading_DocumentFilePath = url

    return this.isDocumentLoading()
  }

  startLoadingDocumentFromURL(documentData: DocumentData, url: string) {

    this.loading_DocumentData = documentData
    this.loading_DocumentFilePath = url

    this.documentLoader.startLoadingDocumentFromURL(documentData, url)
  }

  finishDocumentDataLoading() {

    this.loading_DocumentData = null
  }

  hasErrorOnLoadingDocument(): boolean {

    return (
      this.loading_DocumentData == null
      || this.loading_DocumentData.hasErrorOnLoading
    )
  }

  hasErrorOnLoadingDocumentResource(): boolean {

    return (
      this.resourceLoading_DocumentData == null
      || this.resourceLoading_DocumentData.hasErrorOnLoading)
  }

  // Document resources

  startLoadingDocumentResources(documentData: DocumentData, documentFilePath: string) {

    this.resourceLoading_DocumentData = documentData

    this.loading_ImageResurces = []

    for (const layer of documentData.rootLayer.childLayers) {

      this.startLoadingDocumentResourcesRecursive(layer, this.loading_ImageResurces, documentFilePath)
    }
  }

  private startLoadingDocumentResourcesRecursive(layer: Layer, loadingDocumentImageResources: ImageResource[], documentFilePath: string) {

    if (ImageFileReferenceLayer.isImageFileReferenceLayer(layer)) {

      const ifrLayer = <ImageFileReferenceLayer>layer

      if (!Strings.isNullOrEmpty(ifrLayer.imageFilePath)) {

        // TODO: いずれ同時読み込み数の限界の問題が発生するので、そのうち対処する
        this.resourceLoader.startLoadingImageResource(ifrLayer.runtime.imageResource, ifrLayer.imageFilePath, documentFilePath)

        loadingDocumentImageResources.push(ifrLayer.runtime.imageResource)
      }
    }

    for (const chldLayer of layer.childLayers) {

      this.startLoadingDocumentResourcesRecursive(chldLayer, loadingDocumentImageResources, documentFilePath)
    }
  }

  isDocumentResourceLoading(): boolean {

    if (this.loading_ImageResurces.find(item => item.loaded == false && item.error == false)) {
      return true
    }

    return false
  }
}
