const env = true ? 'debug' : 'release'
const { app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
const fs = require('fs');

if (env == 'debug') {
  const reloader = require('electron-reload');
  reloader(__dirname + '/dist');
}

let win

async function createWindow () {

  const { windowPosition } = await loadAppData()

  win = new BrowserWindow({
    x: windowPosition.left,
    y: windowPosition.top,
    width: windowPosition.width,
    height: windowPosition.height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      preload: path.join(__dirname, 'electron_preload.js')
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

function getUserDirectoryPath() {

  return path.join(app.getPath('appData'), 'mtt', '020')
}

function getAppDataPath() {

  return path.join(getUserDirectoryPath(), 'app-data.json')
}

async function loadAppData() {

  const userDirectoryPath = getUserDirectoryPath()
  if (!fs.existsSync(userDirectoryPath)) {
    fs.mkdirSync(userDirectoryPath, { recursive: true })
  }

  let windowPosition = { top: 0, left: 0, width: 1080, height: 1080 }

  try {
    const appDataPath = getAppDataPath()
    const appDataJson = await fs.promises.readFile(appDataPath)
    if (appDataJson) {
        const appData = JSON.parse(appDataJson)
        if (appData) {
          windowPosition = appData.windowPosition
        }
    }
  }
  catch (e) {
  }

  return { windowPosition }
}

async function saveAppData() {

  const windowBounds = win.getNormalBounds()

  const appDataPath = getAppDataPath()

  const appData = {
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

ipcMain.handle('readUserDataFile', (event, { fileName }) => {

  const filePath = path.join(getUserDirectoryPath(), fileName)

  return fs.readFileSync(filePath, { encoding: 'utf8' })
})

ipcMain.handle('writeUserDataFile', (event, { fileName, data }) => {

  const filePath = path.join(getUserDirectoryPath(), fileName)

  return fs.writeFileSync(filePath, data)
})

ipcMain.handle('openFileDialog', async (event, { defaultPath} ) => {

  let openDialogResult = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    defaultPath: defaultPath,
    filters: [
      { name: 'Vector files', extensions: ['json', 'ora'] },
    ]
  })

  return openDialogResult
})
