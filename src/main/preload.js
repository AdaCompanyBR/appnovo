'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const call = (channel) => (...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('api', {
  auth: {
    state: call('auth:state'),
    register: call('auth:register'),
    login: call('auth:login'),
    recover: call('auth:recover'),
    changePassword: call('auth:change-password'),
    regenerateRecovery: call('auth:regenerate-recovery'),
    logout: call('auth:logout'),
  },
  demands: {
    list: call('demands:list'),
    create: call('demands:create'),
    update: call('demands:update'),
    remove: call('demands:delete'),
    restore: call('demands:restore'),
  },
  settings: { get: call('settings:get'), set: call('settings:set') },
  data: { export: call('data:export') },
  app: { info: call('app:info'), openDataDir: call('app:open-data-dir'), copy: call('app:copy'), setTheme: call('app:set-theme') },
  on: (event, fn) => {
    const allowed = ['app:focus-capture', 'app:locked'];
    if (!allowed.includes(event)) return () => {};
    const listener = () => fn();
    ipcRenderer.on(event, listener);
    return () => ipcRenderer.removeListener(event, listener);
  },
});
