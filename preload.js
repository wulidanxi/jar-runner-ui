const { contextBridge, ipcRenderer } = require("electron");

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld("electron", {
  // 文件选择
  selectJarFile: () => ipcRenderer.invoke("select-jar"),
  selectDirectory: () => ipcRenderer.invoke("select-dir"),

  // JAR 操作
  startJar: (jarPath, args = []) =>
    ipcRenderer.send("start-jar", { jarPath, args }),
  stopJar: () => ipcRenderer.send("stop-jar"),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  saveLog: (text) => ipcRenderer.invoke("save-log", text),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  getRuntimeVersions: () => ({
    electron: process.versions?.electron || "",
    node: process.versions?.node || "",
    chrome: process.versions?.chrome || "",
  }),
  dumpLog: (text, jarPath, tag) =>
    ipcRenderer.invoke("dump-log", { text, jarPath, tag }),

  // 窗口控制
  send: (channel, data) => {
    const validChannels = ["window-min", "window-max", "window-close"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // 事件监听
  on: (channel, callback) => {
    const validChannels = ["jar-output", "settings-updated"];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // 移除事件监听
  removeAllListeners: (channel) => {
    const validChannels = ["jar-output", "settings-updated"];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
});
