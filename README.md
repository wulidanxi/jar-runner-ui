# JAR 运行器

一个基于 Electron + React + Vite 的桌面应用，用于选择并运行本地 JAR 文件，支持参数输入与实时输出显示，适合开发/测试/运维场景快速调用 Java 程序。

## 特性
- 选择并运行本地 JAR 文件，支持参数传递
- 实时展示标准输出/错误输出，支持自动滚动和手动定位
- 一键停止运行、清空输出
- 自定义沉浸式标题栏，窗口拖拽与关闭控制
- 自动生成并集成应用图标，打包为 Windows 安装包
- 左侧设置抽屉（菜单按钮打开），分组配置外观/输出/日志/关于
- 深色模式与品牌色主题切换（Ant Design 主题）
- 输出区关键词高亮与过滤、滚动到底部/自动滚动
- 日志复制与默认目录导出
- 窗口置顶选项
- 设置页：Tabs 导航粘性固定、底部保存/取消固定
- 关于页：表格展示链接、描述与版本信息
- 版本显示：运行时展示 Electron/Ant Design/React 的实际版本

## 环境要求
- Node.js ≥ 18（推荐 20+，已在 24.13.0 验证）
- Java 运行时环境（JRE），用于实际执行 JAR
- Windows 系统（当前打包配置为 Windows/NSIS）

## 快速开始
```bash
# 安装依赖
npm install

# 并行开发：启动前端与 Electron（自动等待端口）
npm run start:dev

# 构建前端产物
npm run build

# 生产模式启动 Electron（使用 dist）
npm start

# 生成图标并打包安装包（NSIS）
npm run electron:build
```

## 使用指南
1. 打开应用后，点击右上角关闭按钮“×”可关闭窗口；窗口顶部可拖拽移动
2. 点击标题左侧“菜单”按钮，打开左侧设置抽屉
   - 外观：品牌色、深色模式、窗口置顶
   - 输出：输出区高度、默认自动滚动、默认高亮关键词与过滤词
   - 日志：设置默认导出目录
   - 关于：版本、许可证与链接（表格展示，含版本标签）
3. 在“选择与参数”中：
   - 输入或选择 JAR 文件路径
   - 在参数输入框中以空格分隔填写命令行参数（如 `--port 8080 -Xmx512m`）
4. 点击“运行 JAR”启动程序
5. 在“输出”中实时查看日志
   - 可点击“滚动到底部”
   - 可切换“自动滚动/停止滚动”
   - 支持复制全部与导出日志到默认目录
6. 点击“停止运行”结束当前 JAR 进程
7. 点击“清空输出”清除历史记录

## 项目脚本
- `npm run dev`：仅启动前端 Vite 开发服务（端口 5173）
- `npm run start:dev`：并行启动前端与 Electron（推荐）
- `npm run build`：TypeScript 编译 + Vite 生产构建（输出至 `dist`）
- `npm run start`：以生产模式启动 Electron，加载 `dist` 页面
- `npm run gen:icon`：生成 `assets/icon.png` 应用图标
- `npm run electron:build`：构建前端、生成图标、打包为安装包（输出目录见下文）

## 打包说明
- 打包工具：electron-builder（Windows/NSIS）
- 输出目录：`package.json` 的 `build.directories.output`（当前为 `release5`）
  - 安装包：`jar-runner Setup 1.0.0.exe`
  - 免安装版：`win-unpacked/jar-runner.exe`
- 图标：`assets/icon.png`（打包时自动转换为 .ico）
- 主进程入口：[main.js](file:///d:/Study/printPlugin/main.js)
- 预加载脚本：[preload.js](file:///d:/Study/printPlugin/preload.js)

## 目录结构（关键文件）
- 前端入口：[index.html](file:///d:/Study/printPlugin/index.html)、[src/main.tsx](file:///d:/Study/printPlugin/src/main.tsx)
- 应用根组件与样式：[src/App.tsx](file:///d:/Study/printPlugin/src/App.tsx)、[src/App.css](file:///d:/Study/printPlugin/src/App.css)
- 核心功能组件：[src/components/JarRunner.tsx](file:///d:/Study/printPlugin/src/components/JarRunner.tsx)、[src/components/JarRunner.css](file:///d:/Study/printPlugin/src/components/JarRunner.css)
- 设置抽屉组件：[src/components/Settings.tsx](file:///d:/Study/printPlugin/src/components/Settings.tsx)、样式：[src/components/Settings.css](file:///d:/Study/printPlugin/src/components/Settings.css)
- 预加载与 IPC API：[preload.js](file:///d:/Study/printPlugin/preload.js)
- 构建配置：[vite.config.ts](file:///d:/Study/printPlugin/vite.config.ts)、[tsconfig.json](file:///d:/Study/printPlugin/tsconfig.json)
- 打包配置与脚本：[package.json](file:///d:/Study/printPlugin/package.json)、生成图标脚本：[scripts/generate-icon.js](file:///d:/Study/printPlugin/scripts/generate-icon.js)

## 配置项
- 端口：Vite 开发端口默认为 5173（见 [vite.config.ts](file:///d:/Study/printPlugin/vite.config.ts#L34-L36)）
- 资源与输出：
  - `build.files`：打包包含的文件（`dist`, `main.js`, `preload.js`, `assets/icon.png`）
  - `build.directories.buildResources`：默认 `assets`
  - `build.directories.output`：当前为 `release5`
- 安全策略：页面声明 CSP，限制资源来源（见 [index.html](file:///d:/Study/printPlugin/index.html#L7-L9)）
 - 设置持久化：用户目录 `settings.json`（主进程维护，保存后广播 `settings-updated`）
 - 预加载 API：
   - `selectJarFile()` 选择 JAR
   - `startJar(jarPath, args[])` 与 `stopJar()` 启停 JAR
   - `getSettings()` 与 `saveSettings(settings)` 读取/保存设置
   - `saveLog(text)` 保存当前输出到文件（默认目录可在设置中指定）
   - `selectDirectory()` 选择默认导出目录
   - `openExternal(url)` 在系统浏览器中打开链接
 - 版本显示来源（关于页）：
   - Electron：`process.versions.electron`（运行时真实版本）
   - Ant Design：`antd.version`（运行时真实版本）
   - React：`React.version`，不可用时回退到 `package.json` 中声明版本
   - Vite：构建工具版本（来自开发依赖）
 - 性能优化：
   - 最大保留日志行数（默认 2000，可在设置>输出中调整；超过后自动丢弃最早的日志）
  - 溢出转储：当超过上限时，自动将旧日志转储到文件；文件名为“运行 JAR 文件名 + 启动时间戳”，存放在默认导出目录（或文档目录）
  - 虚拟列表：输出区采用虚拟列表渲染，仅渲染可视范围（动态行高），在长日志场景显著降低渲染开销；支持自动滚动与滚动到底部

## macOS 构建
- 需求：在 macOS 上构建（Windows 无法直接构建 mac 安装包）
- 准备：
  - 安装 Xcode 与命令行工具（包含 codesign 与 notarytool）
  - Node.js 18+ 与 npm/yarn
  - 可选签名与公证：申请 Apple Developer 账号并准备 Team ID、Apple ID 和 App 专用密码
- 构建：
  - 安装依赖：npm ci
  - 生成前端：npm run build
  - 生成应用与安装包：npm run electron:build:mac（输出 dmg 与 zip，x64/arm64）
  - 若无需签名/公证：执行前设置环境变量 CSC_IDENTITY_AUTO=false
- 签名与公证（可选）：
  - 设置环境变量：
    - APPLE_ID, APPLE_TEAM_ID, APPLE_APP_SPECIFIC_PASSWORD
  - electron-builder 将使用 Hardened Runtime 与 entitlements（assets/entitlements.mac*.plist）
 - 产物命名：已按平台与架构命名（artifactName）
   - Windows 示例：jar-runner-1.0.0-win-x64.exe
   - macOS 示例：jar-runner-1.0.0-mac-arm64.dmg

## 常见问题
- 构建报错 `crypto.getRandomValues is not a function`
  - 请使用 Node ≥ 18。旧版本（Node 16）缺少 WebCrypto 导致报错
- 打包报错 “app.asar 正被占用”
  - 关闭之前运行的 `jar-runner.exe` 或更换输出目录；当前已使用 `release5` 作为输出目录
- 无法运行 JAR
  - 请确认系统已安装 JRE，并且 JAR 路径正确且可访问

## 贡献指南
- 欢迎提交 Issue 或 Pull Request，建议遵循以下步骤：
  - Fork 仓库并创建特性分支
  - 提前运行 `npm run start:dev` 验证
  - 提供清晰的描述与必要的截图或日志
- 代码风格：TypeScript 严格模式、React 18、Vite 7
- 安全建议：避免提交任何机密信息或密钥

## 许可证
本项目采用 ISC 许可证，允许商业与非商业使用、修改与分发。详情见 [ISC License](https://opensource.org/license/isc-license-txt)。

---
如需品牌化 UI 或增强功能（最小化/最大化按钮、主题切换、输出关键词高亮、日志导出等），欢迎提出需求，我们将协助实现。 
