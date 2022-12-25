const env = true ? 'debug' : 'release'
const { app, BrowserWindow, ipcMain, clipboard, dialog} = require('electron')
const path = require('path')
const fs = require('fs');

if (env == 'debug') {
  const reloader = require('electron-reload');
  reloader(__dirname + '/src/index.js');
}

let win

async function createWindow () {

  const { windowState, windowPosition } = await loadAppData()

  await prepareUserDocumentDirectory()

  win = new BrowserWindow({
    show: false,
    x: windowPosition.left,
    y: windowPosition.top,
    width: windowPosition.width,
    height: windowPosition.height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      preload: path.join(__dirname, 'electron-preload.js')
    }
    //frame: false
  })

  win.loadURL(`file://${__dirname}/index.html`)

  win.webContents.openDevTools()

  //win.maximize();
  win.setMenu(null);

  win.on('closed', () => {
    win = null
  })

  win.on('close', async () => {
    await saveAppData()
  })

  if (windowState.isMaximized) {
    win.maximize()
  }

  win.show()
}

app.on('ready', () => {
  createWindow().then()
})

app.on('activate', () => {
  if (win === null) {
    createWindow().then()
  }
})

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function getUserSettingDirectoryPath() {

  return path.join(app.getPath('documents'), 'ManualTracingTool', 'settings', '020')
}

function getUserDefaultDocumentDirectoryPath() {

  return path.join(app.getPath('documents'), 'ManualTracingTool', 'documents')
}

function getAppDataPath() {

  return path.join(getUserSettingDirectoryPath(), 'app-data.json')
}

async function loadAppData() {

  const userDirectoryPath = getUserSettingDirectoryPath()

  if (!fs.existsSync(userDirectoryPath)) {
    fs.mkdirSync(userDirectoryPath, { recursive: true })
  }

  let windowState = { isMaximized: false }
  let windowPosition = { top: 0, left: 0, width: 1080, height: 1080 }

  try {

    const appDataPath = getAppDataPath()
    const appDataJson = await fs.promises.readFile(appDataPath)

    if (appDataJson) {

        const appData = JSON.parse(appDataJson)

        if (appData?.windowState) {
          windowState = { ...windowState, ...appData.windowState }
        }

        if (appData?.windowPosition) {
          windowPosition = { ...windowPosition, ...appData.windowPosition }
        }
    }
  }
  catch (e) {
  }

  return { windowState, windowPosition }
}

async function saveAppData() {

  const windowBounds = win.getNormalBounds()

  const appDataPath = getAppDataPath()

  const appData = {
    windowState: {
      isMaximized: win.isMaximized()
    },
    windowPosition: {
      top: windowBounds.y,
      left: windowBounds.x,
      width: windowBounds.width,
      height: windowBounds.height,
    },
    appDataPath: appDataPath
   }

  await fs.promises.writeFile(appDataPath, JSON.stringify(appData))
}

async function prepareUserDocumentDirectory() {

  const directoryPath = getUserDefaultDocumentDirectoryPath()

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
  }
}

ipcMain.handle('writeFile', (event, { filePath, data, format }) => {

  if (format == 'base64') {

    const base64Data = data.substring(data.indexOf(',') + 1)
    fs.writeFileSync(filePath, base64Data, 'base64')
  }
  else {

    fs.writeFileSync(filePath, data, 'utf8')
  }
})

ipcMain.handle('readDir', (event, { directoryPath }) => {

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true })

  const files = entries
    .filter(dirent => dirent.isFile)
    .map(dirent => ({
      name: path.basename(dirent.name),
      path: path.join(directoryPath, dirent.name)
    }))

  return files
})

ipcMain.handle('readUserDataFile', (event, { fileName }) => {

  const filePath = path.join(getUserSettingDirectoryPath(), fileName)

  return fs.readFileSync(filePath, { encoding: 'utf8' })
})

ipcMain.handle('writeUserDataFile', (event, { fileName, data }) => {

  const filePath = path.join(getUserSettingDirectoryPath(), fileName)

  return fs.writeFileSync(filePath, data)
})

ipcMain.handle('getUserDefaultDocumentDirectory', (event) => {

  return getUserDefaultDocumentDirectoryPath()
})

ipcMain.handle('openFileDialog', async (event, { defaultPath }) => {

  let openDialogResult = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    defaultPath: defaultPath,
    filters: [
      { name: 'Vector files', extensions: ['json', 'ora'] },
    ]
  })

  if (openDialogResult.filePaths && openDialogResult.filePaths.length > 0) {

    return openDialogResult.filePaths[0]
  }
  else {

    return null
  }
})

ipcMain.handle('clipboard_writeText',async (event, { text }) => {

  clipboard.writeText(text, 'clipboard')
})

ipcMain.handle('clipboard_readText', (event) => {

  return clipboard.readText('clipboard')
})

ipcMain.handle('clipboard_availableFormats', (event) => {

  return clipboard.availableFormats('clipboard')
})

