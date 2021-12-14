const { contextBridge, ipcRenderer, clipboard } = require('electron')
const fs = require('fs')
const path = require('path')

contextBridge.exposeInMainWorld(
  'api',
  {
    fs: {

      readFileSync(path) {
        return fs.readFileSync(path, { encoding: 'utf8' })
      },

      writeFileSync(path, data, format) {
        fs.writeFileSync(path, data, format)
      },

      readDirSync(path, options) {
        return fs.readdirSync(path, options)
      },

      readUserDataFile(fileName) {
        return ipcRenderer.invoke('readUserDataFile', { fileName });
      },

      writeUserDataFile(fileName, data) {
        return ipcRenderer.invoke('writeUserDataFile', { fileName, data });
      }
    },

    clipboard: {

      writeText(text, type) {
        clipboard.writeText(text, type)
      },

      readText(type) {
        return clipboard.readText(type)
      },

      availableFormats(type) {
        return clipboard.availableFormats(type)
      }
    },

    path: {

      basename(target_path) {
        return path.basename(target_path)
      },

      join(path1, path2) {
        return path.join(path1, path2)
      }
    },

    dialog: {

      async openFileDialog(defaultPath) {
        return await ipcRenderer.invoke('openFileDialog', { defaultPath });
      }
    }
  }
)
