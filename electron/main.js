const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const isDev = require("electron-is-dev");

let mainWindow;
let jarProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.webContents.openDevTools();
    let __dirname = app.getAppPath();
    console.log(__dirname);
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 选择 JAR 文件
ipcMain.on("select-jar", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JAR Files", extensions: ["jar"] }],
  });

  if (!result.canceled) {
    event.reply("jar-selected", result.filePaths[0]);
  }
});

// 启动 JAR
ipcMain.on("start-jar", (event, jarPath) => {
  if (jarProcess) {
    jarProcess.kill();
  }

  // 获取 JAR 文件所在的目录
  const jarDir = path.dirname(jarPath);

  jarProcess = spawn("java", ["-jar", jarPath], {
    cwd: jarDir,
    stdio: ["pipe", "pipe", "pipe"],
  });

  // 发送进程状态
  event.reply("jar-status", "started");

  // 处理标准输出
  jarProcess.stdout.on("data", (data) => {
    mainWindow.webContents.send("jar-output", data.toString());
  });

  // 处理标准错误
  jarProcess.stderr.on("data", (data) => {
    mainWindow.webContents.send("jar-output", data.toString());
  });

  // 处理进程退出
  jarProcess.on("close", (code) => {
    mainWindow.webContents.send("jar-output", `\n进程已退出，退出码: ${code}`);
    mainWindow.webContents.send("jar-status", "stopped");
    jarProcess = null;
  });

  // 处理进程错误
  jarProcess.on("error", (err) => {
    mainWindow.webContents.send("jar-output", `\n进程错误: ${err.message}`);
    mainWindow.webContents.send("jar-status", "stopped");
    jarProcess = null;
  });
});

// 停止 JAR
ipcMain.on("stop-jar", () => {
  if (jarProcess) {
    jarProcess.kill();
    jarProcess = null;
  }
});
