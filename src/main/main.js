'use strict';

const path = require('node:path');
const fs = require('node:fs');
const {
  app, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu, nativeTheme, nativeImage, dialog, powerMonitor, shell,
} = require('electron');
const { Vault, VaultError } = require('./vault');

const QUICK_SHORTCUT = 'CommandOrControl+Shift+Space';
const RENDERER = path.join(__dirname, '..', 'renderer');
const ICON = path.join(RENDERER, 'assets', 'icon.png');

let win = null;
let tray = null;
let vault = null;
let quitting = false;

app.commandLine.appendSwitch('lang', 'pt-BR');
// O app se chamava Demandas: mantém a mesma pasta de dados para não perder nada.
app.setPath('userData', path.join(app.getPath('appData'), 'Demandas'));

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function titleBarColors() {
  return nativeTheme.shouldUseDarkColors
    ? { color: '#0f0f11', symbolColor: '#b4b4bc', height: 40 }
    : { color: '#f4f4f5', symbolColor: '#52525b', height: 40 };
}

function showWindow({ focusCapture = false } = {}) {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  if (focusCapture) win.webContents.send('app:focus-capture');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 520,
    show: false,
    title: 'Lumo',
    icon: ICON,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f0f11' : '#f4f4f5',
    titleBarStyle: 'hidden',
    titleBarOverlay: titleBarColors(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  win.webContents.session.setSpellCheckerLanguages(['pt-BR']);
  win.removeMenu();
  win.loadFile(path.join(RENDERER, 'index.html'));
  win.once('ready-to-show', () => win.show());

  // Nada de navegação para fora do app; links externos abrem no navegador.
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Fechar a janela só esconde: o atalho global continua funcionando.
  win.on('close', (e) => {
    if (!quitting && tray) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  try {
    const img = nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 });
    tray = new Tray(img);
    tray.setToolTip('Lumo — Ctrl+Shift+Espaço para anotar');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Nova demanda', accelerator: QUICK_SHORTCUT, click: () => showWindow({ focusCapture: true }) },
      { label: 'Abrir Lumo', click: () => showWindow() },
      { type: 'separator' },
      { label: 'Bloquear', click: () => lock() },
      { label: 'Sair', click: () => { quitting = true; app.quit(); } },
    ]));
    tray.on('click', () => showWindow());
  } catch {
    tray = null;
  }
}

function lock() {
  if (vault && vault.session) {
    vault.logout();
    if (win) win.webContents.send('app:locked');
  }
}

/* ---------- IPC ---------- */

function handle(channel, fn) {
  ipcMain.handle(channel, async (event, ...args) => {
    if (!win || event.sender !== win.webContents) return { ok: false, error: { code: 'forbidden', message: 'Origem inválida.' } };
    try {
      return { ok: true, value: await fn(...args) };
    } catch (err) {
      if (err instanceof VaultError) {
        return { ok: false, error: { code: err.code, message: err.message, retryInSeconds: err.retryInSeconds, attemptsLeft: err.attemptsLeft } };
      }
      console.error(err);
      return { ok: false, error: { code: 'internal', message: 'Algo deu errado ao salvar. Seus dados anteriores foram mantidos.' } };
    }
  });
}

function registerIpc() {
  handle('auth:state', () => vault.state());
  handle('auth:register', (u, p) => vault.register(u, p));
  handle('auth:login', (u, p) => vault.login(u, p));
  handle('auth:recover', (u, code, p) => vault.recover(u, code, p));
  handle('auth:change-password', (cur, next) => vault.changePassword(cur, next));
  handle('auth:regenerate-recovery', (cur) => vault.regenerateRecoveryCode(cur));
  handle('auth:logout', () => { vault.logout(); return true; });

  handle('demands:list', () => vault.listDemands());
  handle('demands:create', (input) => vault.createDemand(input || {}));
  handle('demands:update', (id, patch) => vault.updateDemand(String(id), patch || {}));
  handle('demands:delete', (id) => vault.deleteDemand(String(id)));
  handle('demands:restore', (demand) => vault.restoreDemand(demand));

  handle('data:export', async () => {
    const payload = vault.exportData();
    const stamp = new Date().toISOString().slice(0, 10);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Exportar demandas',
      defaultPath: path.join(app.getPath('documents'), `demandas-${stamp}.json`),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePath) return { saved: false };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return { saved: true, filePath };
  });

  handle('app:info', () => ({
    version: app.getVersion(),
    shortcut: 'Ctrl+Shift+Espaço',
    shortcutActive: globalShortcut.isRegistered(QUICK_SHORTCUT),
    dataDir: vault.dir,
  }));
  handle('app:open-data-dir', () => shell.openPath(vault.dir));
  handle('app:set-theme', (theme) => {
    nativeTheme.themeSource = ['light', 'dark'].includes(theme) ? theme : 'system';
    return true;
  });
  handle('app:copy', (text) => { clipboard.writeText(String(text || '').slice(0, 200)); return true; });
}

/* ---------- ciclo de vida ---------- */

app.on('second-instance', () => showWindow());

app.whenReady().then(() => {
  app.setAppUserModelId('br.com.adacompany.demandas');
  vault = new Vault(process.env.DEMANDAS_DATA_DIR || path.join(app.getPath('userData'), 'cofre'));
  registerIpc();
  createWindow();
  createTray();

  globalShortcut.register(QUICK_SHORTCUT, () => showWindow({ focusCapture: true }));

  nativeTheme.on('updated', () => {
    if (win) win.setTitleBarOverlay(titleBarColors());
  });

  // Bloqueia o app quando o Windows é bloqueado (Win+L) ou entra em suspensão.
  powerMonitor.on('lock-screen', lock);
  powerMonitor.on('suspend', lock);
});

app.on('before-quit', () => { quitting = true; });
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (vault) vault.logout();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
