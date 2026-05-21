const { app, BrowserWindow, shell, Menu } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const net = require('net')

const PORT = 3000
const isDev = !app.isPackaged

let serverProcess = null
let mainWindow = null

function checkPort(port) {
  return new Promise((resolve) => {
    const client = net.connect({ port }, () => {
      client.destroy()
      resolve(true)
    })
    client.on('error', () => resolve(false))
  })
}

async function waitForServer(port, timeout = 90000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await checkPort(port)) return
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error('Server did not start in time')
}

function startServer() {
  if (isDev) {
    // In dev mode, Next.js is started separately via concurrently
    return
  }

  // Production: launch the standalone Next.js server
  const serverDir = path.join(process.resourcesPath, 'server')
  const serverScript = path.join(serverDir, 'server.js')

  serverProcess = spawn(process.execPath, [serverScript], {
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    },
  })

  serverProcess.stdout?.on('data', (d) => console.log('[next]', d.toString().trim()))
  serverProcess.stderr?.on('data', (d) => console.error('[next]', d.toString().trim()))
}

function buildMenu() {
  const template = [
    { role: 'appMenu' },
    {
      label: 'Bearbeiten',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Ansicht',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools' }] : []),
      ],
    },
    { role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createLoadingWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    frame: false,
    center: true,
    show: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })
  win.loadURL(`data:text/html,
    <html><body style="
      margin:0; display:flex; flex-direction:column;
      align-items:center; justify-content:center; height:100vh;
      background:#0f172a; color:#e2e8f0; font-family:system-ui;
    ">
      <div style="font-size:48px; margin-bottom:16px">🚆</div>
      <div style="font-size:20px; font-weight:600; margin-bottom:8px">BetterBahn</div>
      <div style="font-size:13px; color:#94a3b8">App wird gestartet…</div>
    </body></html>
  `)
  return win
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'BetterBahn',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  buildMenu()

  const loading = isDev ? null : createLoadingWindow()

  startServer()

  try {
    await waitForServer(PORT)
    createMainWindow()
    if (loading) loading.close()
  } catch (err) {
    console.error('Server failed to start:', err)
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
})
