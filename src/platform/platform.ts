import { int } from '../app/logics/conversion'

interface PlatformFS {

  readFileSync(fileName: string): string
  writeFileSync(fileName: string, text: string, format: 'base64' | 'utf8')
  readDirSync(directoryPath: string, options: { withFileTypes: boolean }): any[]
  readUserDataFile(fileName: string): Promise<string>
  writeUserDataFile(fileName: string, data: string): Promise<void>
}

interface PlatformPath {

  basename(path: string): string
  join(path1: string, path2: string): string
}

interface PlatformClipboard {

  writeText(text: string, _type?: string)
  readText(_type: string): string
  availableFormats(_type: string): string
}

interface PlatformDialog {

  openFileDialog(defaultPath: string)
}

declare global {
  interface Window {
    api: NodeAPI
  }
}

export type NodeAPI = {
  fs: PlatformFS
  clipboard: PlatformClipboard
  path: PlatformPath
  dialog: PlatformDialog
}

export class Platform {

  static supportsNative(): boolean {

    return (typeof (window.api) != 'undefined')
  }

  static getCurrentTime(): int {

    return performance.now()
  }

  static readonly clipboard: PlatformClipboard = Platform.supportsNative() ? window.api.clipboard : {

    writeText(text: string, _type?: string) {

      window.localStorage.setItem('clipboard', text)
    },

    readText(_type: string): string {

      return window.localStorage.getItem('clipboard')
    },

    availableFormats(_type: string): string {

      return window.localStorage.getItem('clipboard') ? 'clipboard' : null
    }
  }

  static readonly path: PlatformPath = Platform.supportsNative() ? window.api.path : {

    basename(path: string): string {

      return path
    },

    join(path1: string, path2: string): string {

      return path1 + '/' + path2
    }
  }

  static readonly fileSystem = {

    writeFile(filePath: string, data: string, format: 'base64' | 'utf8') {

      if (format == 'base64') {

        if (Platform.supportsNative()) {

          const base64Data = data.substr(data.indexOf(',') + 1)

          Platform.fs.writeFileSync(filePath, base64Data, 'base64')
        }
        else {

          const link = document.createElement("a")
          link.download = filePath
          link.href = data
          link.click()
        }
      }
      else {

        Platform.fs.writeFileSync(filePath, data, 'utf8')
      }
    },

    readFile(filePath: string): string {

      return Platform.fs.readFileSync(filePath)
    },

    getFileInfos(directoryPath: string) {

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: any[] = Platform.fs.readDirSync(directoryPath, { withFileTypes: true })

      const files = entries
        .filter(dirent => dirent.isFile())
        .map(dirent => ({
          name: Platform.path.basename(dirent.name),
          path: Platform.path.join(directoryPath, dirent.name)
        }))

      return files
    },

    async readUserDataFile(fileName: string) {

      return await Platform.fs.readUserDataFile(fileName)
    },

    async writeUserDataFile(fileName: string, data: string) {

      return await Platform.fs.writeUserDataFile(fileName, data)
    },

    async openFileDialog(defaultPath: string): Promise<string> {

      if (!Platform.supportsNative()) {

        return new Promise((resolve) => resolve(null))
      }

      const openDialogResult = await window.api.dialog.openFileDialog(defaultPath)

      if (openDialogResult.filePaths && openDialogResult.filePaths.length > 0) {

        return openDialogResult.filePaths[0]
      }
      else {

        return null
      }
    }
  }

  private static readonly fs: PlatformFS = Platform.supportsNative() ? window.api.fs : {

    readFileSync(fileName: string): string {

      return window.localStorage.getItem(fileName)
    },

    writeFileSync(fileName: string, text: string) {

      window.localStorage.setItem(fileName, text)
    },

    readDirSync(_directoryPath: string, _options: { withFileTypes: boolean }) {

      return []
    },

    readUserDataFile(fileName: string): Promise<string> {

      return new Promise((resolve) => {
        resolve(window.localStorage.getItem(fileName))
      })
    },

    writeUserDataFile(fileName: string, data: string) {

      return new Promise((resolve) => {
        window.localStorage.setItem(fileName, data)
        resolve()
      })
    }
  }
}
