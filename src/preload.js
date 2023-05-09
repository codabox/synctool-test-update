const { contextBridge, ipcRenderer } = require('electron')

const validChannels = [
    'add-connection',
    'browse',
    'openDownloadFolder',
    'delete-connection',
    'download-connection',
    'download-status',
    'edit-info',
    'folder',
    'get-locale',
    'get-user-info',
    'get-version',
    'locale',
    'open-faq-link',
    'request-locale',
    'save-connection',
    'test-connection',
    'test-connection-status',
    'user-info',
    'version',
    'openLogs',
]

// Bridge between main and sandboxed renderer code
contextBridge.exposeInMainWorld('api', {
    // Send data from window to main
    send: (channel, data) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.invoke(channel, data)
        }
    },
    // Send data from main to window
    receive: (channel, func) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_, ...args) => func(...args))
        }
    },
})
