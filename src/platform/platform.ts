import { Strings } from "../app/common-logics"

interface PlatformFS {

  writeFile(filePath: string, data: string, format: 'base64' | 'utf8'): Promise<void>
  getFileInfos(directoryPath: string): Promise<{ name: string, path: string}[]>
  getUserDefaultDocumentDirectory(): Promise<string>
  readUserDataFile(fileName: string): Promise<string>
  writeUserDataFile(fileName: string, data: string): Promise<void>
  openFileDialog(defaultPath: string): Promise<string | null>
}

interface PlatformClipboard {

  writeText(text: string): Promise<void>
  readText(): Promise<string>
  availableFormats(): Promise<string[]>
}

interface PlatformDialog {

  openFileDialog(defaultPath: string)
}

declare global {
  interface Window {
    api: PlatformAPI
  }
}

export type PlatformAPI = {
  fs: PlatformFS
  clipboard: PlatformClipboard
  path: PlatformPath
  dialog: PlatformDialog
}

class PlatformPath {

  platFormIndependentPathJoinLetter = '/'

  getPlatformPathJoinLetter(): string {

    // TODO: 実装する
    return '\\'
  }

  getPlatformOrientedPath(targetPath: string): string {

    const joinLetter = this.getPlatformPathJoinLetter()

    if (joinLetter == '\\') {

      return Strings.replaceAll(targetPath, this.platFormIndependentPathJoinLetter, '\\')
    }
    else if (joinLetter == this.platFormIndependentPathJoinLetter) {

      return Strings.replaceAll(targetPath, '\\\\', this.platFormIndependentPathJoinLetter)
    }
    else {

      return targetPath
    }
  }

  getPlatformIndependentPath(targetPath: string): string {

    return Strings.replaceAll(targetPath, '\\\\', this.platFormIndependentPathJoinLetter)
  }

  getFileName(targetPath: string): string {

    const piPath = this.getPlatformIndependentPath(targetPath)

    const lastIndex = Strings.lastIndexOf(piPath, this.platFormIndependentPathJoinLetter)

    if (lastIndex == -1) {

      return targetPath
    }
    else {

      return Strings.substring(piPath, lastIndex + 1)
    }
  }

  getDirectoryPath(targetPath: string): string {

    const piPath = this.getPlatformIndependentPath(targetPath)

    const lastIndex = Strings.lastIndexOf(piPath, this.platFormIndependentPathJoinLetter)

    if (lastIndex == -1) {

      return targetPath
    }
    else {

      return Strings.substring(piPath, 0, lastIndex)
    }
  }

  isRelativePath(targetPath: string): boolean {

    const piPath = this.getPlatformIndependentPath(targetPath)

    const lastIndex = Strings.lastIndexOf(piPath, this.platFormIndependentPathJoinLetter)

    if (lastIndex == -1) {

      return true
    }
    else {

      return Strings.startsWith(targetPath, './')
    }
  }

  getRelativePath(from: string, to: string): string {

    // TODO: 実装する
    return to
  }

  resolveRelativePath(baseDirectoryPath: string, targetPath: string): string {

    if (this.isRelativePath(targetPath)) {

      let localPath = targetPath

      if (Strings.startsWith(targetPath, './')) {

        localPath = Strings.substring(targetPath, 2)
      }

      return this.join(baseDirectoryPath, localPath)
    }
    else {

      return ''
    }
  }

  join(path1: string, path2: string): string {

    return `${path1}${this.platFormIndependentPathJoinLetter}${path2}`
  }
}

export class Platform {

  static supportsNative(): boolean {

    return (typeof (window.api) != 'undefined')
  }

  static getCurrentTime(): number {

    return performance.now()
  }

  static readonly clipboard: PlatformClipboard = Platform.supportsNative() ? window.api.clipboard : {

    async writeText(text: string) {

      window.localStorage.setItem('clipboard', text)
    },

    async readText() {

      return window.localStorage.getItem('clipboard')
    },

    async availableFormats() {

      return window.localStorage.getItem('clipboard') ? ['text/plain'] : null
    }
  }

  static readonly path = new PlatformPath()

  static readonly fileSystem: PlatformFS = Platform.supportsNative() ? window.api.fs : {

    async writeFile(filePath: string, data: string, format: 'base64' | 'utf8') {

      if (format == 'base64') {

        const link = document.createElement("a")
        link.download = filePath
        link.href = data
        link.click()
      }
      else {

        const blob = new Blob([data], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a")
        link.download = filePath
        link.href = url
        link.click()
      }
    },

    async getFileInfos(_directoryPath: string) {

      return []
    },

    async getUserDefaultDocumentDirectory(): Promise<string> {

      return './'
    },

    async readUserDataFile(fileName: string): Promise<string> {

      return window.localStorage.getItem(fileName)
    },

    async writeUserDataFile(fileName: string, data: string) {

      window.localStorage.setItem(fileName, data)
    },

    async openFileDialog(defaultPath: string): Promise<string | null> {

      return null
    }
  }
}
