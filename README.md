# 🤖 DeepCode

> AI 驱动的桌面编程助手 — 类 Codex CLI 体验，直接操作你的本地项目文件。

## 功能

- **💬 AI 对话** — 基于 OpenAI 兼容 API 的流式聊天，支持任意模型
- **📁 文件树浏览** — 侧边栏文件树，遵循 `.gitignore` 过滤
- **📄 代码查看/编辑** — 语法高亮查看，支持直接编辑保存
- **📊 Diff 比对** — AI 建议的代码变更可预览、单文件或批量应用
- **⚡ 一键 Apply** — AI 回复中的代码块可通过 `file:` 标记自动应用

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Electron 31 |
| 前端 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 语法高亮 | highlight.js |
| Markdown | marked |

## 项目结构

```
deepcode/
├── electron/
│   ├── main.ts          # Electron 主进程（文件读写、IPC）
│   └── preload.ts       # 预加载脚本，暴露 API 到渲染进程
├── src/
│   ├── components/
│   │   ├── Terminal.tsx          # 聊天终端
│   │   ├── FileTree.tsx          # 文件树
│   │   ├── CodeViewer.tsx        # 代码查看/编辑器
│   │   ├── DiffView.tsx          # 变更对比
│   │   └── MarkdownRenderer.tsx  # Markdown 渲染
│   ├── hooks/
│   │   └── useAI.ts             # AI 聊天状态管理
│   ├── utils/
│   │   ├── api.ts               # API 调用、流式处理、项目上下文
│   │   └── gitignore.ts         # .gitignore 解析器
│   ├── types/
│   │   └── index.ts             # 全局类型定义
│   ├── App.tsx                  # 应用主组件
│   ├── App.css                  # 布局样式
│   ├── index.css                # 全局样式（Tokyonight 主题）
│   └── main.tsx                 # React 入口
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 环境配置

### 基础环境

| 依赖 | 版本要求 | 检查命令 |
|------|--------|----------|
| **Node.js** | ≥ 18（推荐 20+） | `node --version` |
| **npm** | ≥ 9（随 Node.js 附带） | `npm --version` |
| **Git** | 任意版本 | `git --version` |
| **操作系统** | Windows / macOS / Linux | — |

### 安装 Node.js

**Windows:**

```powershell
# 方式一：官网安装包
# https://nodejs.org → 下载 LTS 版本（≥ 20.x）

# 方式二：fnm（推荐，支持版本切换）
winget install Schniz.fnm
fnm install 20
fnm use 20
```

**macOS:**

```bash
# Homebrew
brew install node@20

# fnm
brew install fnm
fnm install 20
fnm use 20
```

**Linux:**

```bash
# fnm（推荐）
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 20
fnm use 20

# nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

### 验证环境

```bash
node --version   # 应输出 v20.x.x 或更高
npm --version    # 应输出 10.x.x 或更高
git --version    # 应输出 git version 2.x.x
```

---

## 快速开始

### 克隆 & 安装

```bash
git clone <repo-url>
cd deepcode
npm install
```

### 开发运行

```bash
# Electron 桌面模式（推荐，有文件系统能力）
npm run electron:dev

# 纯浏览器模式（只启动前端，无文件读写）
npm run dev
```

### 生产构建

```bash
npm run electron:build
```

构建产物在 `release/` 目录。

---

## 配置

首次启动后，点击右上角齿轮图标 ⚙️ 配置 API：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| API Base URL | OpenAI 兼容 API 地址 | `https://api.openai.com/v1` |
| API Key | 你的 API 密钥 | — |
| Model | 模型名称 | `gpt-4o` |

> 配置保存在浏览器 `localStorage` 中，不会上传到任何服务器。

### 常用第三方 API

| 提供商 | API Base URL | 示例模型 |
|--------|-------------|----------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o`、`gpt-4o-mini` |
| Ollama（本地） | `http://localhost:11434/v1` | `llama3`、`codellama` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b-versatile` |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| vLLM（自建） | `http://<host>:8000/v1` | 按部署配置 |

## 使用指南

### AI 对话

在底部输入框输入问题，按 **Enter** 发送，**Shift + Enter** 换行。

支持的命令格式：
```
/help              — 查看帮助
/explain file.ts   — 解释某文件
/fix bug in ...    — 修复问题
write a function... — 生成代码
```

### 代码应用

AI 回复中带有 `✅ Apply` 按钮的代码块可以直接应用到项目文件：

````markdown
```file:src/utils/helper.ts
export function add(a: number, b: number): number {
  return a + b
}
```
````

点击 Apply 后进入 Diff 视图，确认无误后可逐个或批量写入文件。

### 文件树

- 点击左侧 📁 图标展开文件树
- 单击目录展开/折叠
- 单击文件打开代码查看器
- 自动读取项目 `.gitignore` 过滤无关文件

### 快捷键

| 操作 | 按键 |
|------|------|
| 发送消息 | `Enter` |
| 换行 | `Shift + Enter` |
| 上一条历史 | `↑`（输入框为空时）|
| 下一条历史 | `↓`（输入框为空时）|

## 主题

采用 Tokyonight Night 配色：

| 颜色 | 用途 |
|------|------|
| `#7aa2f7` | 主色调 / 强调 |
| `#9ece6a` | 成功 / 文件路径 |
| `#e0af68` | 警告 |
| `#f7768e` | 错误 |
| `#1a1b26` | 主背景 |

## 在线乞讨

如果这个项目帮到了你，欢迎请开发者喝杯咖啡 ☕

> 本项目的所有收益将用于给作者买好吃的

![支付宝](alipay.jpg)

## License

MIT
