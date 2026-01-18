const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const isDev = require("electron-is-dev");
const fs = require("fs");

let mainWindow;
let jarProcess = null;
let settingsCache = null;

function getSettingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function readSettings() {
  try {
    const p = getSettingsPath();
    const raw = fs.readFileSync(p, "utf-8");
    settingsCache = JSON.parse(raw);
    return settingsCache;
  } catch {
    const defaults = {
      brandColor: "#2563eb",
      outputHeight: 320,
      darkMode: false,
      alwaysOnTop: false,
      autoScrollDefault: true,
      defaultHighlight: "",
      defaultFilter: "",
      exportDir: "",
      maxLogLines: 2000,
    };
    settingsCache = defaults;
    return defaults;
  }
}

function writeSettings(next) {
  const merged = { ...readSettings(), ...next };
  const p = getSettingsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(merged, null, 2), "utf-8");
  settingsCache = merged;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(!!merged.alwaysOnTop);
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("settings-updated", merged);
  }
  return merged;
}

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 840,
    minWidth: 1024,
    minHeight: 720,
    useContentSize: true,
    frame: false,
    icon: path.join(__dirname, "assets", "icon.png"),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    alwaysOnTop: !!readSettings().alwaysOnTop,
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      const policyDev =
        "default-src 'self';" +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
        "style-src 'self' 'unsafe-inline';" +
        "img-src 'self' data:;" +
        "connect-src 'self' http://localhost:*;";
      const policyProd =
        "default-src 'self';" +
        "script-src 'self' 'unsafe-inline';" +
        "style-src 'self' 'unsafe-inline';" +
        "img-src 'self' data:;";
      const policy =
        process.env.NODE_ENV === "development" ? policyDev : policyProd;
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [policy],
        },
      });
    }
  );

  // 根据环境加载不同的页面
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "dist/index.html");
    console.log("Loading production path:", indexPath);
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error("Failed to load index.html:", err);
    });
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  console.log(
    "当前环境:",
    process.env.NODE_ENV === "development" ? "开发环境" : "生产环境"
  );
  console.log(
    "Loading index from:",
    path.resolve(__dirname, "dist/index.html")
  );

  try {
    const content = fs.readFileSync(
      path.resolve(__dirname, "dist/index.html"),
      "utf-8"
    );
    console.log("文件内容:", content);
  } catch (err) {
    console.error("读取文件失败:", err);
  }

  // 监听页面加载失败
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("页面加载失败:", errorCode, errorDescription);
      if (isDev) {
        // 开发环境下，如果是连接被拒绝，可能是开发服务器还没启动
        if (errorCode === -3) {
          // ERR_CONNECTION_REFUSED
          console.log("等待开发服务器启动...");
          return;
        }
      }
      dialog.showErrorBox("加载错误", `页面加载失败: ${errorDescription}`);
    }
  );

  // 监听页面加载完成
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("页面加载完成");
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (jarProcess) {
    try {
      jarProcess.kill();
    } catch {}
    jarProcess = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 选择 JAR 文件
ipcMain.handle("select-jar", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JAR Files", extensions: ["jar"] }],
  });

  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

// 启动 JAR
ipcMain.on("start-jar", (event, payload) => {
  const jarPath = typeof payload === "string" ? payload : payload?.jarPath;
  const args =
    typeof payload === "string"
      ? []
      : Array.isArray(payload?.args)
      ? payload.args
      : [];
  if (jarProcess) {
    console.log("JAR 已经在运行中");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("jar-output", "\nJAR 已经在运行中\n");
    }
    return;
  }

  console.log("启动 JAR:", jarPath);
  try {
    // 获取 JAR 文件所在的目录
    const jarDir = path.dirname(jarPath);

    jarProcess = spawn("java", ["-jar", jarPath, ...args], {
      cwd: jarDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("jar-output", `\n正在启动 JAR: ${jarPath}\n`);
    }

    // 标准输出
    jarProcess.stdout.on("data", (data) => {
      const output = data.toString("utf8");
      console.log("JAR 输出:", output);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("jar-output", output);
      }
    });

    // 标准错误
    jarProcess.stderr.on("data", (data) => {
      const output = data.toString("utf8");
      console.error("JAR 错误:", output);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("jar-output", output);
      }
    });

    // 进程结束
    jarProcess.on("close", (code) => {
      console.log("JAR 进程已结束，退出码:", code);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          "jar-output",
          `\nJAR 进程已结束，退出码: ${code}\n`
        );
      }
      jarProcess = null;
    });

    // 进程错误
    jarProcess.on("error", (err) => {
      console.error("启动 JAR 时出错:", err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          "jar-output",
          `\n启动 JAR 时出错: ${err.message}\n`
        );
      }
      jarProcess = null;
    });
  } catch (err) {
    console.error("创建进程时出错:", err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "jar-output",
        `\n创建进程时出错: ${err.message}\n`
      );
    }
  }
});

// 停止 JAR
ipcMain.on("stop-jar", () => {
  if (jarProcess) {
    console.log("停止 JAR 进程");
    try {
      jarProcess.kill();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("jar-output", "\n正在停止 JAR 进程...\n");
      }
    } catch (err) {
      console.error("停止进程时出错:", err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          "jar-output",
          `\n停止进程时出错: ${err.message}\n`
        );
      }
    }
    jarProcess = null;
  } else {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("jar-output", "\n没有正在运行的 JAR 进程\n");
    }
  }
});

ipcMain.handle("save-log", async (event, text) => {
  const s = readSettings();
  const defaultDir = (s && s.exportDir) || app.getPath("documents");
  const result = await dialog.showSaveDialog({
    title: "保存日志",
    filters: [{ name: "Text", extensions: ["txt"] }],
    defaultPath: path.join(defaultDir, "jar-runner-log.txt"),
  });
  if (result.canceled || !result.filePath) {
    return false;
  }
  await fs.promises.writeFile(result.filePath, text ?? "", "utf-8");
  return true;
});

ipcMain.handle("get-settings", async () => {
  return readSettings();
});

ipcMain.handle("save-settings", async (event, settings) => {
  writeSettings(settings || {});
  return true;
});

ipcMain.handle("dump-log", async (event, payload) => {
  try {
    const s = readSettings();
    const defaultDir = (s && s.exportDir) || app.getPath("documents");
    const jarPath = typeof payload?.jarPath === "string" ? payload.jarPath : "";
    const base =
      jarPath && typeof jarPath === "string"
        ? path.basename(jarPath, path.extname(jarPath))
        : "jar-output";
    const tag =
      typeof payload?.tag === "string" && payload.tag ? payload.tag : null;
    let filePath = "";
    if (tag) {
      filePath = path.join(defaultDir, `${base}-${tag}.log`);
    } else {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
      )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(
        now.getSeconds()
      )}`;
      filePath = path.join(defaultDir, `${base}-${ts}.log`);
    }
    fs.mkdirSync(defaultDir, { recursive: true });
    const content = payload?.text ?? "";
    if (tag && fs.existsSync(filePath)) {
      await fs.promises.appendFile(filePath, content, "utf-8");
    } else {
      await fs.promises.writeFile(filePath, content, "utf-8");
    }
    return filePath;
  } catch (err) {
    console.error("转储日志失败:", err);
    return null;
  }
});

ipcMain.handle("open-external", async (event, url) => {
  if (typeof url === "string" && url.startsWith("http")) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.handle("select-dir", async () => {
  const result = await dialog.showOpenDialog({
    title: "选择目录",
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) {
    return null;
  }
  return result.filePaths[0];
});

// 窗口控制
ipcMain.on("window-min", () => {
  mainWindow.minimize();
});

ipcMain.on("window-max", () => {
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on("window-close", () => {
  mainWindow.close();
});
