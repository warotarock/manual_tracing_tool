const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'api',
  {
    fs: {

      writeFile(filePath, data, format) {

        return ipcRenderer.invoke('writeFile', { filePath, data, format });
      },

      getFileInfos(directoryPath) {

        return ipcRenderer.invoke('readDir', { directoryPath })
      },

      readUserDataFile(fileName) {
        return ipcRenderer.invoke('readUserDataFile', { fileName });
      },

      writeUserDataFile(fileName, data) {
        return ipcRenderer.invoke('writeUserDataFile', { fileName, data });
      },

      getUserDefaultDocumentDirectory(fileName, data) {
        return ipcRenderer.invoke('getUserDefaultDocumentDirectory');
      },

      openFileDialog(defaultPath) {
        return ipcRenderer.invoke('openFileDialog', { defaultPath });
      }
    },

    clipboard: {

      writeText(text) {

        return ipcRenderer.invoke('clipboard_writeText', { text });
      },

      readText() {
        return ipcRenderer.invoke('clipboard_readText');
      },

      availableFormats(type) {
        return ipcRenderer.invoke('clipboard_availableFormats', { type });
      }
    }
  }
)
