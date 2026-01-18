const { ipcRenderer } = require("electron");

// DOM 元素
const selectJarBtn = document.getElementById("selectJar");
const jarPathInput = document.getElementById("jarPath");
const startJarBtn = document.getElementById("startJar");
const stopJarBtn = document.getElementById("stopJar");
const outputDiv = document.getElementById("output");
const scrollToBottomBtn = document.getElementById("scrollToBottom");
const toggleAutoScrollBtn = document.getElementById("toggleAutoScroll");

// 状态变量
let isAutoScroll = true;

// 初始化自动滚动按钮状态
toggleAutoScrollBtn.textContent = "停止滚动";
toggleAutoScrollBtn.classList.remove("auto-scroll");
toggleAutoScrollBtn.classList.add("stop-scroll");

// 选择 JAR 文件
selectJarBtn.addEventListener("click", () => {
  ipcRenderer.send("select-jar");
});

// 启动 JAR
startJarBtn.addEventListener("click", () => {
  const jarPath = jarPathInput.value;
  if (jarPath) {
    ipcRenderer.send("start-jar", jarPath);
    startJarBtn.disabled = true;
    stopJarBtn.disabled = false;
  }
});

// 停止 JAR
stopJarBtn.addEventListener("click", () => {
  const line = document.createElement("div");
  line.textContent = "\n正在停止运行...";
  outputDiv.appendChild(line);
  if (isAutoScroll) {
    outputDiv.scrollTop = outputDiv.scrollHeight;
  }
  ipcRenderer.send("stop-jar");
  startJarBtn.disabled = false;
  stopJarBtn.disabled = true;
});

// 滚动到底部
scrollToBottomBtn.addEventListener("click", () => {
  outputDiv.scrollTop = outputDiv.scrollHeight;
});

// 切换自动滚动
toggleAutoScrollBtn.addEventListener("click", () => {
  isAutoScroll = !isAutoScroll;
  if (!isAutoScroll) {
    toggleAutoScrollBtn.textContent = "自动滚动";
    toggleAutoScrollBtn.classList.remove("stop-scroll");
    toggleAutoScrollBtn.classList.add("auto-scroll");
  } else {
    toggleAutoScrollBtn.textContent = "停止滚动";
    toggleAutoScrollBtn.classList.remove("auto-scroll");
    toggleAutoScrollBtn.classList.add("stop-scroll");
    outputDiv.scrollTop = outputDiv.scrollHeight;
  }
});

// 监听输出
ipcRenderer.on("jar-output", (event, data) => {
  const line = document.createElement("div");
  line.textContent = data;
  outputDiv.appendChild(line);

  if (isAutoScroll) {
    outputDiv.scrollTop = outputDiv.scrollHeight;
  }
});

// 监听 JAR 进程状态
ipcRenderer.on("jar-status", (event, status) => {
  if (status === "started") {
    startJarBtn.disabled = true;
    stopJarBtn.disabled = false;
  } else if (status === "stopped") {
    startJarBtn.disabled = false;
    stopJarBtn.disabled = true;
  }
});

// 监听文件选择结果
ipcRenderer.on("jar-selected", (event, path) => {
  jarPathInput.value = path;
  startJarBtn.disabled = false;
});
