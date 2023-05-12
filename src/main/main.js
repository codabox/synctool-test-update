/* global MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY MAIN_WINDOW_WEBPACK_ENTRY */
/* global win:writable */
const {
    app,
    autoUpdater,
    dialog,
    ipcMain,
    nativeImage,
    safeStorage,
    shell,
    BrowserWindow,
    Menu,
    Tray,
} = require('electron')
const fs = require('fs')
const path = require('path')
const Client = require('ssh2-sftp-client')
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler')
const i18n = require('../i18n').default
const Store = require('electron-store')

const iconPath = path.join(__dirname, 'favicon.ico')
const store = new Store()

// Ensure only a single version of the app is running
const applicationLock = app.requestSingleInstanceLock()
if (!applicationLock) {
    // Another instance of the app was already running
    app.quit()
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore()
            }
            mainWindow.focus()
        }
    })
}

// const logger = require('electron').remote.require('./logger')
// const logger = require('electron-log')

// Auto update
// require('update-electron-app')()

const server = 'https://update.electronjs.org'
const feed = `${server}/codabox/synctool-test-update/${process.platform}-${process.arch}/${app.getVersion()}`

autoUpdater.setFeedURL(feed)

setInterval(() => {
    log('Interval print', 'test')
    log(feed, 'url')
    autoUpdater.checkForUpdates()
    log('Update downloaded', 'test')
}, 5 * 60 * 1000)

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    log('Update downloaded 1', 'test')
    log(feed, 'url')
    const dialogOpts = {
        type: 'info',
        buttons: ['Restartssss', 'Later'],
        title: 'CodaBox SyncTool Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail:
        'A new version of the CodaBox SyncTool has been downloaded. Restart the application to apply the updates.',
    }
    log('Update downloaded 2', 'test')

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
            log('Clicked the right button', 'test')
            app.isQuiting = true
            autoUpdater.quitAndInstall()
        }
    })
})
autoUpdater.on('error', (message) => {
    log('There was a problem updating the application', 'error')
    log(message, 'error')
})

function getLogPath () {
    return path.join(app.getPath('userData'), 'logs')
}

function getInfoPath () {
    return path.join(app.getPath('userData'), 'info.json')
}

function log (message, username) {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0') // January is 0!
    const yyyy = today.getFullYear()
    const logDir = getLogPath()
    fs.mkdir(logDir, { recursive: true }, (err) => {
        if (err) {
            console.error(`could not create log directory ${logDir}: ${err}`)
        }
    })
    const filepath = path.join(logDir, `${yyyy}.${mm}.${dd}.${username}.log`)
    fs.appendFile(filepath, `${today.toISOString()}: ${message}\n`, err => {
        if (err) {
            console.error(`could not write to log file ${filepath}: ${err}`)
        }
    })
}

function deleteOldLogs () {
    const today = new Date()
    const priorDate = new Date(new Date().setDate(today.getDate() - 30))
    const logDir = getLogPath()
    const files = fs.readdirSync(logDir)
    for (const file of files) {
        const stats = fs.statSync(path.join(logDir, file))
        if (stats.birthtime < priorDate) {
            const regex = /[0-9]+\.[0-9]+\.[0-9]+\.[A-Za-z0-9]+/i
            if (regex.test(file)) {
                fs.unlinkSync(path.join(logDir, file))
            }
        }
    }
}

const scheduleDeleteLogs = () => {
    scheduler = new ToadScheduler()
    const task = new Task('delete logs', () => { deleteOldLogs() })
    // Schedules this function to run everyday and on startup.
    // This way we are sure logs are deleted at least once a day.
    const job = new SimpleIntervalJob({ days: 1, runImmediately: true }, task)
    scheduler.addSimpleIntervalJob(job)
}

let mainWindow = null
let tray = null
let scheduler = null

// Keep at the top because Squirrel doesn't give much time to handle these events
if (process.argv[1] === '--squirrel-install') {
    app.setLoginItemSettings({
        openAtLogin: true,
        name: app.getName(),
        path: app.getPath('exe'),
        args: [MAIN_WINDOW_WEBPACK_ENTRY],
    })
} else if (process.argv[1] === '--squirrel-uninstall') {
    app.setLoginItemSettings({
        openAtLogin: false,
        name: app.getName(),
    })
}

// Only launch once under windows
if (require('electron-squirrel-startup')) {
    app.quit()
}

function getConnectionDetails (connection) {
    // Take a copy to not overwrite the connection details
    const connectionDetails = { ...connection }

    // Decrypt password
    if (connectionDetails.Password !== '') {
        const buffer = Buffer.from(connectionDetails.Password, 'base64')
        try {
            connectionDetails.Password = safeStorage.decryptString(buffer)
        } catch (err) {
            log(`Could not decrypt password for ${connectionDetails.Username}: ${err}`, connectionDetails.Username)
        }
    }

    const credentials = {
        host: process.env.SYNC_TOOL_HOST || 'sftp.codabox.com',
        port: process.env.SYNC_TOOL_PORT || 22,
        username: connectionDetails.Username,
        password: connectionDetails.Password,
        retry_minTimeout: 400,
        retries: 0,
    }

    return {
        credentials: credentials,
        destinationFolder: connectionDetails.Folder,
    }
}

async function testConnection (connection, index, info) {
    const connectionDetails = getConnectionDetails(connection)
    const username = connectionDetails.credentials.username
    const host = connectionDetails.credentials.host
    const port = connectionDetails.credentials.port

    const src = process.env.SYNC_TOOL_NO_REMOTE_ROOT ? '' : '/'
    const client = new Client()
    log(`Starting test connection for ${username} on ${host}:${port}`, username)
    try {
        await client.connect(connectionDetails.credentials)
        log(`Testing listing on the connection for ${username}`, username)
        await walk(client, src, username)
        log(`Successfully tested the connection for ${username}`, username)
        // Success: Update last connection details from the settings
        info[index].LastConnection = Date.now()
        info[index].LastConnectionFailed = false
        info[index].LastConnectionError = false
        return 'OK'
    } catch (e) {
        log(`An error occured while testing the connection for ${username}: ${e}`, username)
        info[index].LastConnectionFailed = true
        info[index].LastConnectionError = e.code
        return e.message
    } finally {
        await client.end()
    }
}

async function downloadConnection (connection, index, info) {
    const connectionDetails = getConnectionDetails(connection)
    const username = connectionDetails.credentials.username
    const host = connectionDetails.credentials.host
    const port = connectionDetails.credentials.port
    const dest = connectionDetails.destinationFolder

    const src = process.env.SYNC_TOOL_NO_REMOTE_ROOT ? '' : '/'
    const client = new Client()
    log(`Starting download of files for ${username} on ${host}:${port}`, username)
    try {
        await client.connect(connectionDetails.credentials)
        log(`Getting the list of available files for ${username}`, username)
        const remotePaths = await walk(client, src, username)
        log(
            `Starting download of ${remotePaths.length} file${remotePaths.length > 1 ? 's' : ''} for ${username}`,
            username,
        )
        await getAndDelete(client, remotePaths, src, dest, username)
        log(
            `Finished downloading ${remotePaths.length} file${remotePaths.length > 1 ? 's' : ''} for ${username}`,
            username,
        )
        // Success: Update last connection details from the settings
        info[index].LastConnection = Date.now()
        info[index].LastDownload = Date.now()
        info[index].LastConnectionFailed = false
        info[index].LastConnectionError = false
        return 'OK'
    } catch (e) {
        log(`An error occured while downloading files for ${username}: ${e}`, username)
        info[index].LastConnectionFailed = true
        info[index].LastConnectionError = e.code
        return e
    } finally {
        await client.end()
    }
}

async function downloadAllConnections () {
    // Retrieve settings from file
    let info = []
    const filepath = getInfoPath()
    if (!fs.existsSync(filepath)) {
        return
    }
    info = JSON.parse(fs.readFileSync(filepath))
    // Download for all configured connections and update info
    for (const [index, connection] of info.entries()) {
        try {
            if (connection.LastConnectionError !== 'ERR_GENERIC_CLIENT') {
                await downloadConnection(connection, index, info)
            }
        } catch (e) {
            log(`An error occurred while downloading files for ${connection.Username}: ${e}`, connection.Username)
        }
    }
    fs.writeFileSync(filepath, JSON.stringify(info))
    sendConnectionInfo(info)
}

const createMenu = () => {
    // Build menu
    Menu.setApplicationMenu(
        Menu.buildFromTemplate([
            {
                label: i18n.global.t('actions'),
                submenu: [
                    {
                        label: i18n.global.t('addConnection'),
                        click: async () => {
                            win.webContents.send('add-connection')
                        },
                    },
                    {
                        label: i18n.global.t('quit'),
                        click: async () => {
                            app.isQuiting = true
                            await app.quit()
                        },
                    },
                ],
            },
            {
                label: i18n.global.t('settings'),
                submenu: [
                    {
                        label: i18n.global.t('language'),
                        submenu: [
                            {
                                label: 'Nederlands',
                                click: async () => {
                                    store.set('language', 'nl')
                                    await updateLocale('nl')
                                },
                            },
                            {
                                label: 'Français',
                                click: async () => {
                                    store.set('language', 'fr')
                                    await updateLocale('fr')
                                },
                            },
                            {
                                label: 'English',
                                click: async () => {
                                    store.set('language', 'en')
                                    await updateLocale('en')
                                },
                            },
                        ],
                    },
                ],
            },
            {
                label: i18n.global.t('help'),
                submenu: [
                    {
                        label: i18n.global.t('manualLink'),
                        click: async () => {
                            await shell.openExternal(i18n.global.t('faqLink'))
                        },
                    },
                    {
                        label: i18n.global.t('showVersion'),
                        click: async () => {
                            dialog.showMessageBox(null, {
                                message: `${i18n.global.t('version')} ${app.getVersion()}`,
                                type: 'info',
                                title: app.getName(),
                                icon: nativeImage.createFromPath(iconPath),
                            })
                        },
                    },
                ],
            },
        ]),
    )
}

const createWindow = () => {
    mainWindow = new BrowserWindow({
        icon: iconPath,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
        width: 1000,
        height: 500,
    })

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
    mainWindow.webContents.openDevTools()

    if (process.env.SYNC_TOOL_DEV_TOOLS) {
        mainWindow.webContents.openDevTools()
    }

    return mainWindow
}

const createTray = () => {
    tray = new Tray(nativeImage.createFromPath(iconPath))
    const contextMenu = Menu.buildFromTemplate([
        {
            label: i18n.global.t('showApp'),
            click: () => {
                mainWindow.show()
            },
        },
        {
            label: i18n.global.t('quit'),
            click: () => {
                if (scheduler) {
                    scheduler.stop()
                }
                app.isQuiting = true
                app.quit()
            },
        },
    ])
    tray.setContextMenu(contextMenu)
    tray.setToolTip(app.getName())
    return tray
}

const scheduleDownloads = () => {
    // Schedule the downloads for every 2 hours, starting now.
    // For testing purposes, interval can be changed to minutes using SYNC_TOOL_SCHEDULE_MINUTES environment variable.
    scheduler = new ToadScheduler()

    const task = new Task('download files', () => { downloadAllConnections() })

    const job = process.env.SYNC_TOOL_SCHEDULE_MINUTES
        ? new SimpleIntervalJob({ minutes: process.env.SYNC_TOOL_SCHEDULE_MINUTES }, task)
        : new SimpleIntervalJob({ hours: 2 }, task)

    scheduler.addSimpleIntervalJob(job)
}

app.whenReady().then(() => {
    // init locale
    i18n.global.locale = process.env.SYNC_TOOL_LOCALE || store.get('language') || app.getLocale()?.substring(0, 2)

    scheduleDownloads()
    scheduleDeleteLogs()

    createMenu()

    win = createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    win.tray = createTray()

    win.tray.on('click', function () {
        win.show()
    })

    win.on('close', function (event) {
        log('close test', 'closeLogs')
        log(app.isQuiting, 'closeLogs')
        if (!app.isQuiting) {
            event.preventDefault()
            if (process.platform === 'darwin') {
                // Mac
                app.dock.hide()
            } else {
                win.hide()
            }
        }

        return false
    })
})

const sendConnectionInfo = (info) => {
    // Decrypt the password for the renderer
    for (const k in info) {
        if (info[k].Password !== '') {
            const buffer = Buffer.from(info[k].Password, 'base64')
            try {
                info[k].Password = safeStorage.decryptString(buffer)
            } catch (err) {
                log(`Could not decrypt password for ${info[k].Username}: ${err}`, info[k].Username)
            }
        }
    }
    win.webContents.send('user-info', info)
}

async function walk (client, dir, username) {
    const remotePaths = []
    const listing = await client.list(dir)
    listing.forEach(filepath => { filepath.path = filepath.name })
    while (listing.length > 0) {
        const fileobj = listing.pop()
        if (fileobj.path.includes('processed')) {
            continue
        }
        const pathname = fileobj.path.split(path.sep).join(path.posix.sep)
        const absPath = path.join(dir, pathname).split(path.sep).join(path.posix.sep)
        if (fileobj.type === 'd') {
            const subPaths = await client.list(absPath)
            subPaths.forEach(subPath => {
                subPath.path = path.join(pathname, subPath.name).split(path.sep).join(path.posix.sep)
                listing.push(subPath)
            })
        } else {
            if (fileobj.size > 0) {
                remotePaths.push({ name: pathname, size: fileobj.size })
            } else {
                log(`Skipping ${pathname} because it's empty`, username)
            }
        }
    }
    return remotePaths
}

async function getAndDelete (client, remotePaths, src, dst, username) {
    for (const filepath of remotePaths) {
        const srcPath = path.join(src, filepath.name).split(path.sep).join(path.posix.sep)
        const destPath = path.join(dst, filepath.name.replace('home/', '')).split(path.sep).join(path.posix.sep)
        const destDir = path.dirname(destPath).split(path.sep).join(path.posix.sep)

        log(`Creating local directory ${destDir}`, username)
        try {
            fs.mkdirSync(destDir, { recursive: true })
        } catch (e) {
            const message = `FOLDER_ACCESS_ERROR: ${destDir}`
            throw message
        }

        log(`Downloading file ${srcPath} to ${destPath}`, username)
        if (process.env.SYNC_TOOL_TEST_FILE_CORRUPTION) {
            await client.get(srcPath, destPath, { readStreamOptions: { encoding: 'utf-8' } })
        } else {
            await client.fastGet(srcPath, destPath)
        }

        const stats = fs.statSync(destPath)
        if (stats.size !== filepath.size) {
            const message = `The local file size ${stats.size} does not match the remote file size ${filepath.size}`
            log(`${message}: stopping download process`, username)
            throw message
        }

        log('Removing the file from the remote location', username)
        await client.delete(srcPath, true, username)
    }
}

async function updateLocale (locale) {
    // Distribute locale to whatever window is listening
    win.webContents.send('locale', locale)
    // Update the locale
    i18n.global.locale = locale
    // Call this function so that the menu is regenerated in the new language.
    // Outside of vue so not updated automatically
    createMenu()
}

// Event handlers
ipcMain.handle('browse', async () => {
    const result = dialog.showOpenDialogSync(mainWindow, { properties: ['openDirectory'] })
    if (result && result !== 'undefined') {
        mainWindow.webContents.send('folder', result[0])
    }
})

ipcMain.handle('openDownloadFolder', async (_, path) => {
    shell.openPath(path)
})

ipcMain.handle('delete-connection', async (_, index) => {
    const filepath = getInfoPath()
    const info = JSON.parse(fs.readFileSync(filepath))
    info.splice(index, 1)
    fs.writeFileSync(filepath, JSON.stringify(info))
    sendConnectionInfo(info)
})

ipcMain.handle('get-user-info', async () => {
    let info = []
    const filepath = getInfoPath()
    if (!fs.existsSync(filepath)) {
        return
    }
    info = JSON.parse(fs.readFileSync(filepath))
    sendConnectionInfo(info)
})

// Send app version when requested
ipcMain.handle('get-version', async () => {
    win.webContents.send('version', app.getVersion())
})

ipcMain.handle('save-connection', async (_, newInfo) => {
    let info = []
    const filepath = getInfoPath()
    if (fs.existsSync(filepath)) {
        info = JSON.parse(fs.readFileSync(filepath))
    }
    const encryptedBuffer = safeStorage.encryptString(newInfo.Password)
    newInfo.Password = encryptedBuffer.toString('base64')
    const index = newInfo.Index
    delete newInfo.Index
    if (index === -1) {
        info.push(newInfo)
    } else {
        newInfo.LastConnection = info[index].LastConnection
        newInfo.LastDownload = info[index].LastDownload
        newInfo.LastConnectionError = 'new'
        newInfo.LastConnectionFailed = false
        info[index] = newInfo
    }
    fs.writeFileSync(filepath, JSON.stringify(info))
    sendConnectionInfo(info)
})

// Handle a manual trigger to download for a given connection, indicated by the index
ipcMain.handle('download-connection', async (_, connection) => {
    // Retrieve settings from file
    let info = []
    const filepath = getInfoPath()
    if (!fs.existsSync(filepath)) {
        return
    }
    info = JSON.parse(fs.readFileSync(filepath))
    // Download requested connection and update the info
    try {
        const downloadStatus = await downloadConnection(info[connection.Index], connection.Index, info)
        win.webContents.send('download-status', downloadStatus, info[connection.Index])
    } catch (e) {
        win.webContents.send('download-status', e.message, info[connection.Index])
    }
    fs.writeFileSync(filepath, JSON.stringify(info))
    sendConnectionInfo(info)
})

ipcMain.handle('test-connection', async (_, connection) => {
    // Retrieve settings from file
    let info = []
    const filepath = getInfoPath()
    if (!fs.existsSync(filepath)) {
        return
    }
    info = JSON.parse(fs.readFileSync(filepath))
    // Test the requested connection and update the info
    try {
        const testConnectionStatus = await testConnection(info[connection.Index], connection.Index, info)
        win.webContents.send('test-connection-status', testConnectionStatus, info[connection.Index])
    } catch (e) {
        win.webContents.send('test-connection-status', e.message, info[connection.Index])
    }
    fs.writeFileSync(filepath, JSON.stringify(info))
    sendConnectionInfo(info)
})

ipcMain.handle('request-locale', async (_, locale) => {
    await updateLocale(locale)
})

// Request the back-end the latest locale set
ipcMain.handle('get-locale', async () => {
    // Distribute locale to whatever window is listening
    win.webContents.send('locale', i18n.global.locale)
})

// Request the back-end to open the FAQ link externally
ipcMain.handle('open-faq-link', async () => {
    await shell.openExternal(i18n.global.t('faqLink'))
})

ipcMain.handle('openLogs', async () => {
    shell.openPath(path.join(app.getPath('userData'), 'logs'))
})
