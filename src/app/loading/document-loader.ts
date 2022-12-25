import { DocumentData, DocumentFileType } from '../document-data'
import { DocumentFileNameLogic } from '../document-logic'

export class DocumentLoader {

  oraSettings: DocumentLoaderOraSettings = null

  startLoadingDocumentFromURL(documentData: DocumentData, url: string) {

    const fileType = DocumentFileNameLogic.getDocumentFileTypeFromName(url)

    if (fileType == DocumentFileType.none) {

      console.error('not supported file type.')
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.timeout = 3000
    xhr.responseType = 'blob'

    xhr.addEventListener('load',
      () => {

        if (fileType == DocumentFileType.json) {

          this.startLoadingDocumentJsonFromFile(documentData, xhr.response)
        }
        else if (fileType == DocumentFileType.ora) {

          this.startLoadingDocumentOraFromFile(documentData, xhr.response)
        }
      }
    )

    xhr.addEventListener('timeout',
      () => {

        documentData.hasErrorOnLoading = true
      }
    )

    xhr.addEventListener('error',
      () => {

        documentData.hasErrorOnLoading = true
      }
    )

    xhr.send()
  }

  startLoadingDocumentJsonFromFile(documentData: DocumentData, file: File) {

    const reader = new FileReader()

    reader.addEventListener('load', () => {

      if (typeof(reader.result) == 'string') {

        const data = JSON.parse(reader.result)

        this.storeLoadedDocumentJSON(documentData, data)
      }
    })

    reader.readAsText(file)
  }

  startLoadingDocumentOraFromFile(documentData: DocumentData, file: File) {

    const zipfs = new zip.fs.FS()
    zip.workerScriptsPath = this.oraSettings.scriptsPath

    zipfs.importBlob(file, () => {

      const entry = zipfs.find(this.oraSettings.vectorFileName)

      if (entry) {

        entry.getText((text: string) => {

          const data = JSON.parse(text)
          this.storeLoadedDocumentJSON(documentData, data)
        })
      }
      else {

        console.error('failed to read from ora file.')
      }
    })
  }

  private storeLoadedDocumentJSON(documentData: DocumentData, loadedData: DocumentData) {

    // TODO: 項目を一つずつ移し替えているが、項目を増やした場合に自動的に対応できる方法を検討する
    documentData.version = loadedData.version
    documentData.rootLayer = loadedData.rootLayer
    documentData.documentFrame = loadedData.documentFrame
    documentData.documentFrame_HideOuterArea = loadedData.documentFrame_HideOuterArea

    if (loadedData['paletteColos']) {
      // TODO: タイポだったpaletteColosに対応するここの処理はテスト実装段階終了時に削除する
      documentData.paletteColors = loadedData['paletteColos']
    }
    else {
      documentData.paletteColors = loadedData.paletteColors
    }

    documentData.defaultViewScale = loadedData.defaultViewScale
    documentData.lineWidthBiasRate = loadedData.lineWidthBiasRate
    documentData.animationSettingData = loadedData.animationSettingData
    documentData.exportImageSetting = loadedData.exportImageSetting

    documentData.loaded = true
  }
}

export class DocumentLoaderOraSettings {

  readonly scriptsPath = './libs/ora_js/'
  readonly vectorFileName = 'mttf.json'
}
