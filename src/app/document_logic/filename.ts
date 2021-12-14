import { Strings } from '../logics/conversion'
import { DocumentData, DocumentFileType} from '../document_data'
import { LocalSetting } from '../preferences/local_setting'

export class DocumentFileNameLogic {

  private static fileNameCount = 1

  static getDefaultDocumentFileName(localSetting: LocalSetting): string {

    const date = new Date()
    const fileName = (''
      + date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2)
      + '_' + ('0' + this.fileNameCount).slice(-2)
    )

    this.fileNameCount++

    return localSetting.currentDirectoryPath + '\\' + fileName + '.v.ora'
  }

  static getExportFileName(filePath: string, documentData: DocumentData) {

    let fileName = filePath

    let lastSeperatorIndex = Strings.lastIndexOf(fileName, '\\')
    if (lastSeperatorIndex == -1) {

      lastSeperatorIndex = Strings.lastIndexOf(fileName, '/')
    }

    const separatorDotIndex = Strings.indexOf(fileName, '.', lastSeperatorIndex)

    if (lastSeperatorIndex != -1 && separatorDotIndex != -1 && separatorDotIndex - lastSeperatorIndex > 0) {

      fileName = Strings.substring(fileName, lastSeperatorIndex + 1, separatorDotIndex - lastSeperatorIndex - 1)
    }

    fileName += '_' + ('00' + documentData.exportingCount).slice(-2)

    return fileName
  }

  static getDocumentFileTypeFromName(filePath: string): DocumentFileType {

    let fileType = DocumentFileType.json
    if (Strings.lastIndexOf(filePath, '.json') == filePath.length - 5) {

      fileType = DocumentFileType.json
    }
    else if (Strings.lastIndexOf(filePath, '.ora') == filePath.length - 4) {

      fileType = DocumentFileType.ora
    }

    return fileType
  }
}
