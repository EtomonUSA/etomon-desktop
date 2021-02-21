require('dotenv').config();
const path = require('path');
const os = require('os');
const fs = require('fs');

let paths = [
    path.join('.', '.env'),
    path.join('.', '.etomonrc'),
    path.join('~', '.etomonrc'),
];

paths.reverse();

for (let rcPath of paths) {
    let envFile = rcPath
        .replace(/\.\/|\.\\/g, process.cwd())
        .replace(/\~/g, os.homedir());

    require('dotenv').config({
        path: envFile
    });
}


let rcPath = require('path').join(
    require('os').homedir(),

)
if (require('fs').existsSync(

))

require('update-electron-app')();


const { app, BrowserWindow, Menu, session, globalShortcut } = require('electron');
const contextMenu = require('electron-context-menu');
const chromeHarCapturer = require('@etomon/chrome-har-capturer');
const msgpack = require('@msgpack/msgpack');
const _ = require('lodash');
const RequestHar = require('request-har').RequestHar;
const harRequest = new RequestHar(require('request-promise-native'));

// app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

contextMenu();

let urls = {
    'docker-dev': 'https://dev-etomon.com',
    'local': 'http://localhost:4200',
    'production': 'https://etomon.com'
}

let mode = global.mode = process.env.MODE || 'production';
let siteUri = global.siteUri = process.env.SITE_URI || urls[mode];
let isDev = mode !== 'production';

global.bundles = {
    js: require('fs').readFileSync(require('path').join(__dirname, 'bundle.js'), 'utf8'),
    css: require('fs').readFileSync(require('path').join(__dirname, 'bundle.css'), 'utf8')
};
const isMac = process.platform === 'darwin';
let win;
const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
        label: app.name,
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac ? [
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
                { type: 'separator' },
                {
                    label: 'Speech',
                    submenu: [
                        { role: 'startSpeaking' },
                        { role: 'stopSpeaking' }
                    ]
                }
            ] : [
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' }
            ])
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'togglefullscreen' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            (
                isDev ?
                    { role: 'toggleDevTools' } : null
            )
        ].filter(Boolean)
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(isMac ? [
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ] : [
                { role: 'close' }
            ])
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Help',
                click: async () => {
                    return global.navFn.doNavigate(`/help`);
                }
            },
            {
                label: 'Contact Etomon',
                click: async () => {
                   return global.navFn.doNavigateToContactUs();
                }
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

let log = global.log = [];
const content = false;
const maxPerEntry = 1e6/4; // 1MB
const max = 100*maxPerEntry; // 100MB

async function getLog() {
    let har = await new Promise((resolve, reject) => {
        // on detach, write out the HAR
        chromeHarCapturer.fromLog(siteUri, log, {
            content
        }).then(function (har) {
            resolve(har);
        });
    });

    let data = Buffer.from(msgpack.encode(har));

    return data;
}

global.getLog = getLog;
global.getLogAsDataUri = async () => Buffer.from(JSON.stringify((await getLog()))).toString('base64');


function sizeOf(obj) {
    let buf;
    let body = _.get(obj, 'params.body');
    let b64 = _.get(obj, 'params.base64Encoded');
    if (body) {
        buf = Buffer.from(body, b64 ? 'base64' : 'utf8');
    }
    else buf = Buffer.from(JSON.stringify(obj));

    return buf.length;
};

let len  = 0;
function pushLog(entry, check = true) {
    len += sizeOf(entry);

    if (len > max) {
        len = 0;
        log = [];
    } else {
        log.push(entry);
    }
}

global.wireWebviewListeners = async function (id) {
    const webContents = require('electron').webContents.fromId(id);

    ipcBus = new (require('eventemitter2').EventEmitter2)({ wildcard: true, delimiter: '.' });


    function webContentsForward(ev,method, ...params) {
        webContents[method].apply(webContents, params);
    }

    ipcBus.on('globalWait', (ev, on) => global.navFn.staticGlobalWait(on));
    ipcBus.on('navbarOptions', (ev, opts) => {
        opts = {
            ...(opts || {}),
            ...defaultNavbarOpts
        };
        if (JSON.stringify(opts) === optsHash) return;

        optsHash = JSON.stringify(opts);

        return global.navFn && global.navFn.navbarInject && global.navFn.navbarInject(opts)
    });

    ipcBus.on('webContents', webContentsForward);
    ipcBus.on('doNotify', (ev, ...args) => global.navFn.doNotify(...args));
    ipcBus.on('notifyCompat', (ev, ...args) => {
        return global.navFn.notifyCompat(...args)
    });


    await harInner(webContents);
}

async function harInner(webContents) {
    // debugger
    let requestIds = new Map();

    webContents.debugger.on("message", async function(event, method, params) {
        try {

            if (method === 'Page.frameRequestedNavigation') {
                global.navFn.globalWait && global.navFn.globalWait(true);
            }
            else if (method === 'Page.domContentEventFired') {
                global.navFn.globalWait && global.navFn.globalWait(false);
            }

            // https://github.com/cyrus-and/chrome-har-capturer#fromlogurl-log-options
            if (![
                'Network.dataReceived',
                'Network.loadingFailed',
                'Network.loadingFinished',
                'Network.requestWillBeSent',
                'Network.resourceCha gngedPriority',
                'Network.responseReceived',
                'Page.domContentEventFired',
                'Page.loadEventFired'
            ].includes(method)) {
                // not relevant to us
                return
            }
            pushLog({
                method, params
            });

            if (method === 'Network.requestWillBeSent') { // the chrome events don't include the body, attach it manually if we want it in the HAR
                // requestIds.set(params.requestId, params.request);
            } else if (content && method === 'Network.loadingFinished') {
                // if (requestIds.has(params.requestId)) {
                // let req = requestIds.get(params.requestId);
                let result = await webContents.debugger.sendCommand('Network.getResponseBody', {
                    requestId: params.requestId
                });

                let buf = Buffer.from(result.body, result.base64Encoded ? 'base64' : 'utf8');
                if (buf.length <= maxPerEntry) {
                    result.requestId = params.requestId;
                    pushLog({
                        method: 'Network.getResponseBody',
                        params: result
                    });
                }
            }
        } catch (err) {
            console.warn(`Could not capture message: ${err.stack}`);
        }
    });

// subscribe to the required events
    webContents.debugger.attach()
    await webContents.debugger.sendCommand('Page.enable');
    await webContents.debugger.sendCommand('Network.enable');
    let nav = await webContents.debugger.sendCommand('Page.getNavigationHistory');

    if (nav.entries[nav.currentIndex].url === 'about:blank') {
        await webContents.debugger.sendCommand('Page.navigate', {url: siteUri});
        }
    // } else if (nav.entries[nav.currentIndex].url === 'about:blank#nav') {
    //     await webContents.debugger.sendCommand('Page.navigate', {url: siteUri+'/nav'});
    // }
}


async function harBase(browserWindow, id) {
    const webContents = require('electron').webContents.fromId(id);

    await harInner(webContents);
}

const {ipcMain} = require('electron')
let ipcBus = new (require('eventemitter2').EventEmitter2)({ wildcard: true, delimiter: '.' });

const defaultNavbarOpts = {
    forceShowOnDesktop: true,
    isDesktop: true
}

let optsHash;



ipcMain.on('ipc-message', (ev, arg) => {
    let rpcMessage = msgpack.decode(arg);

    ipcBus.emit(rpcMessage.method, ev, ...(rpcMessage.params || []));
});

function sendIpcMessage(method, ...args) {
    const {webContents} = require('electron');
    let wcs = webContents.getAllWebContents();
    for (let wc of wcs) {
        wc.send('ipc-message', msgpack.encode({
            method,
            params: args,
            jsonrpc: '2.0'
        }));
    }
}

async function createWindow () {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['etomon-desktop'] = '1';
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            webviewTag: true,
            nodeIntegration: true,
            enableRemoteModule: true,
            webSecurity: false
        },
        title: 'Etomon',
        icon: __dirname + '/assets/icon'
    });

    global.setTitle = (title) => win.title = title;

    global.har = harBase.bind(null, win);

    win.maximize();

    win.loadURL(siteUri+'/nav');


}

let navFn;


global.setFn = (opts) => {
    if (opts && Object.keys(opts).length) {
        global.navFn = navFn = opts;
        global.navFn._globalWait = global.navFn.globalWait;
        global.navFn.globalWait = (on) => {
            sendIpcMessage('globalWait', on);
            return global.navFn.staticGlobalWait(on);
        }


    }
}

app.whenReady().then(() => {
    globalShortcut.register("CommandOrControl+R", () => {
        return global.navFn.reloadWebview();
    });
}).then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.userAgentFallback = "Chrome; etomon-desktop";
