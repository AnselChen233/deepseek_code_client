# 🤖 DeepCode

> AI-powered desktop coding assistant — Codex CLI-style experience with direct local project file access.

## Features

- **💬 AI Chat** — Streaming chat via OpenAI-compatible API, supports any model
- **📁 File Tree** — Sidebar file browser, respects `.gitignore` rules
- **📄 Code Viewer / Editor** — Syntax-highlighted viewing with inline editing & save
- **📊 Diff View** — Preview AI-suggested changes before applying, single or batch
- **⚡ One-click Apply** — Code blocks with `file:` tag are auto-detected for instant application

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Desktop Shell | Electron 31 |
| Frontend | React 18 + TypeScript |
| Bundler | Vite 5 |
| Syntax Highlight | highlight.js |
| Markdown | marked |

## Project Structure

```
deepcode/
├── electron/
│   ├── main.ts          # Electron main process (file I/O, IPC handlers)
│   └── preload.ts       # Preload script, exposes API to renderer
├── src/
│   ├── components/
│   │   ├── Terminal.tsx          # Chat terminal UI
│   │   ├── FileTree.tsx          # File tree browser
│   │   ├── CodeViewer.tsx        # Code viewer / editor
│   │   ├── DiffView.tsx          # Side-by-side diff viewer
│   │   └── MarkdownRenderer.tsx  # Markdown + code block rendering
│   ├── hooks/
│   │   └── useAI.ts             # AI chat state & streaming logic
│   ├── utils/
│   │   ├── api.ts               # API client, SSE streaming, project context builder
│   │   └── gitignore.ts         # .gitignore pattern parser
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   ├── App.tsx                  # Root layout component
│   ├── App.css                  # Layout styles
│   ├── index.css                # Global styles (Tokyonight theme)
│   └── main.tsx                 # React entry point
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Environment Setup

### Prerequisites

| Dependency | Requirement | Check |
|------------|-------------|-------|
| **Node.js** | ≥ 18 (20+ recommended) | `node --version` |
| **npm** | ≥ 9 (bundled with Node.js) | `npm --version` |
| **Git** | Any version | `git --version` |
| **OS** | Windows / macOS / Linux | — |

### Installing Node.js

**Windows:**

```powershell
# Option 1: Official installer
# https://nodejs.org → download LTS (≥ 20.x)

# Option 2: fnm (recommended, supports version switching)
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
# fnm (recommended)
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 20
fnm use 20

# nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

### Verify

```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
git --version    # should print git version 2.x.x
```

---

## Quick Start

### Clone & Install

```bash
git clone <repo-url>
cd deepcode
npm install
```

### Development

```bash
# Electron desktop mode (recommended — full file-system access)
npm run electron:dev

# Browser-only mode (frontend only, no file I/O)
npm run dev
```

### Production Build

```bash
npm run electron:build
```

Output lands in `release/`.

---

## Configuration

Click the gear icon ⚙️ in the top-right corner on first launch:

| Field | Description | Default |
|-------|-------------|---------|
| API Base URL | OpenAI-compatible endpoint | `https://api.openai.com/v1` |
| API Key | Your API key | — |
| Model | Model name | `gpt-4o` |

> Config is stored in browser `localStorage` — never sent to any server.

### Compatible Providers

| Provider | API Base URL | Example Models |
|----------|-------------|----------------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| Ollama (local) | `http://localhost:11434/v1` | `llama3`, `codellama` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b-versatile` |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| vLLM (self-hosted) | `http://<host>:8000/v1` | per deployment |


## Usage

### Chatting

Type in the bottom input area. Press **Enter** to send, **Shift + Enter** for a newline.

Example prompts:
```
/help               — Show available commands
/explain file.ts    — Explain what a file does
/fix bug in ...     — Request a bug fix
write a function... — Generate code from scratch
```

### Applying Code

When the AI responds with a code block tagged as a file, an **✅ Apply** button appears:

````markdown
```file:src/utils/helper.ts
export function add(a: number, b: number): number {
  return a + b
}
```
````

Clicking Apply opens the **Diff View** where you can review changes side-by-side, then apply individual files or all at once.

### File Tree

- Click the 📁 tab on the left sidebar to open the file tree
- Click a directory to expand / collapse
- Click a file to open the code viewer
- Automatically reads your project's `.gitignore` to filter out irrelevant files

### Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Send message | `Enter` |
| Newline | `Shift + Enter` |
| Previous history | `↑` (when input is empty) |
| Next history | `↓` (when input is empty) |

## Theme

Tokyonight Night palette:

| Swatch | Usage |
|--------|-------|
| `#7aa2f7` | Primary / Accent |
| `#9ece6a` | Success / File paths |
| `#e0af68` | Warning |
| `#f7768e` | Error |
| `#1a1b26` | Main background |

## Sponsor

If this project helps you, consider buying the developer a coffee ☕

> All proceeds will be spent on delicious food for the author 🍕

![Alipay](alipay.jpg)

## License

MIT
