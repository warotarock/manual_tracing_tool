import { Platform } from '../../platform'
import { int, Strings } from '../common-logics'
import { DocumentFileType } from '../document-data'
import { LocalSetting } from '../user-setting'

export class DocumentFileNameLogic {

  private static fileNameCount = 1

  static getDefaultDocumentFilePath(localSetting: LocalSetting): string {

    const date = new Date()
    const fileName = (''
      + date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2)
      + '_' + ('0' + this.fileNameCount).slice(-2)
    )

    this.fileNameCount++

    const filePath = Platform.path.join(localSetting.currentDirectoryPath, `${fileName}.v.ora`)

    return Platform.path.getPlatformIndependentPath(filePath)
  }

  static getExportFileName(filePath: string, autoNumberingEnabled: boolean, exportingCount: int) {

    let fileName = Platform.path.getFileName(filePath)

    const separatorDotIndex = Strings.indexOf(fileName, '.')

    if (separatorDotIndex != -1 ) {

      fileName = Strings.substring(fileName, 0, separatorDotIndex)
    }

    if (autoNumberingEnabled) {

      let maxLength = exportingCount.toString().length
      if (maxLength < 2) {
        maxLength = 2
      }
      else {

        maxLength = 4
      }

      fileName += ('0'.repeat(maxLength) + exportingCount).slice(-maxLength)
    }

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

  static getDocumentRelativeFilePath(documentFilePath: string, absoluteFilePath: string) {

    let relativeDir = Platform.path.getRelativePath(
      Platform.path.getDirectoryPath(documentFilePath),
      Platform.path.getDirectoryPath(absoluteFilePath)
    )

    return Platform.path.join(relativeDir, Platform.path.getFileName(absoluteFilePath))
  }
}
