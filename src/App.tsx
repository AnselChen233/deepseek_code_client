import { useState, useCallback, useEffect } from 'react'
import Terminal from './components/Terminal'
import FileTree from './components/FileTree'
import CodeViewer from './components/CodeViewer'
import DiffView from './components/DiffView'
import { useAI } from './hooks/useAI'
import { loadConfig, saveConfig } from './utils/api'
import type { AIConfig, DiffHunk } from './types'
import './App.css'

type ViewMode = 'chat' | 'files'
type Panel = 'filetree' | 'code' | 'diff'

export default function App() {
  // AI hook
  const { messages, isStreaming, error, sendMessage, clearMessages, stopStreaming } = useAI()

  // App state
  const [config, setConfig] = useState<AIConfig>(loadConfig)
  const [projectRoot, setProjectRoot] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<Panel | null>(null)
  const [diffHunks, setDiffHunks] = useState<DiffHunk[]>([])

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<AIConfig>(config)

  // Load saved project root
  useEffect(() => {
    const saved = localStorage.getItem('deepcode-project')
    if (saved) setProjectRoot(saved)
  }, [])

  // ---- Settings ----
  const handleSaveSettings = () => {
    setConfig(settingsForm)
    saveConfig(settingsForm)
    setShowSettings(false)
  }

  // ---- Project ----
  const handleSelectFolder = async () => {
    const result = await window.deepcode.dialog.openFolder()
    if (result.success && result.path) {
      setProjectRoot(result.path)
      localStorage.setItem('deepcode-project', result.path)
    }
  }

  // ---- File operations ----
  const handleSelectFile = (filePath: string) => {
    setSelectedFile(filePath)
    setActivePanel('code')
  }

  const handleCloseCodeViewer = () => {
    setActivePanel(null)
    setSelectedFile(null)
  }

  // ---- Code application ----
  const handleApplyCode = useCallback(
    async (filePath: string, code: string) => {
      // Resolve relative paths against project root
      const fullPath = filePath.startsWith('/') || filePath.includes(':')
        ? filePath
        : projectRoot
          ? `${projectRoot}/${filePath}`
          : filePath

      // Add to diff hunks
      const existing = diffHunks.find((h) => h.filePath === fullPath)
      if (existing) {
        setDiffHunks((prev) =>
          prev.map((h) =>
            h.filePath === fullPath ? { ...h, modified: code } : h
          )
        )
      } else {
        // Try to read the original file
        let original = ''
        try {
          const result = await window.deepcode.file.read(fullPath)
          if (result.success && result.content) {
            original = result.content
          }
        } catch { /* file may not exist yet */ }

        const ext = fullPath.split('.').pop()?.toLowerCase() || ''
        const langMap: Record<string, string> = {
          ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
          py: 'python', rs: 'rust', go: 'go', java: 'java',
          html: 'html', css: 'css', json: 'json', md: 'markdown',
        }

        setDiffHunks((prev) => [
          ...prev,
          { filePath: fullPath, original, modified: code, language: langMap[ext] || ext },
        ])
      }

      setActivePanel('diff')
    },
    [projectRoot, diffHunks]
  )

  const handleApplySingleHunk = async (hunk: DiffHunk) => {
    const result = await window.deepcode.file.write(hunk.filePath, hunk.modified)
    if (result.success) {
      setDiffHunks((prev) => prev.filter((h) => h.filePath !== hunk.filePath))
    }
  }

  const handleApplyAllHunks = async () => {
    for (const hunk of diffHunks) {
      await window.deepcode.file.write(hunk.filePath, hunk.modified)
    }
    setDiffHunks([])
    setActivePanel(null)
  }

  const handleCloseDiff = () => {
    setDiffHunks([])
    setActivePanel(null)
  }

  // ---- Chat ----
  const handleSendMessage = (content: string) => {
    sendMessage(content, config, projectRoot || undefined)
  }

  // ---- Settings modal ----
  const renderSettings = () => (
    <div className="modal-overlay" onClick={() => setShowSettings(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Settings</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(false)}>✖</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>API Base URL</label>
            <input
              type="text"
              value={settingsForm.apiBase}
              onChange={(e) => setSettingsForm({ ...settingsForm, apiBase: e.target.value })}
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={settingsForm.apiKey}
              onChange={(e) => setSettingsForm({ ...settingsForm, apiKey: e.target.value })}
              placeholder="sk-..."
            />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input
              type="text"
              value={settingsForm.model}
              onChange={(e) => setSettingsForm({ ...settingsForm, model: e.target.value })}
              placeholder="gpt-4o"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setShowSettings(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveSettings}>Save</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${viewMode === 'files' ? 'sidebar-expanded' : ''}`}>
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${viewMode === 'chat' ? 'active' : ''}`}
            onClick={() => setViewMode('chat')}
            title="Chat"
          >
            💬
          </button>
          <button
            className={`sidebar-tab ${viewMode === 'files' ? 'active' : ''}`}
            onClick={() => setViewMode('files')}
            title="Files"
          >
            📁
          </button>
        </div>

        {viewMode === 'files' && (
          <div className="sidebar-content">
            {!projectRoot ? (
              <div className="sidebar-empty">
                <p>No project open</p>
                <button className="btn btn-primary btn-sm" onClick={handleSelectFolder}>
                  📂 Open Folder
                </button>
              </div>
            ) : (
              <FileTree
                rootPath={projectRoot}
                onSelectFile={handleSelectFile}
                selectedFile={selectedFile || undefined}
              />
            )}
          </div>
        )}

        {viewMode === 'chat' && (
          <div className="sidebar-content">
            <div className="chat-history-info">
              <p>{messages.length} messages</p>
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          {projectRoot && (
            <div className="project-indicator" title={projectRoot}>
              📁 {projectRoot.split(/[/\\]/).pop()}
            </div>
          )}
          <button
            className="btn btn-ghost btn-xs sidebar-settings"
            onClick={() => {
              setSettingsForm(config)
              setShowSettings(true)
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {activePanel === 'code' && selectedFile ? (
          <CodeViewer
            filePath={selectedFile}
            onClose={handleCloseCodeViewer}
          />
        ) : activePanel === 'diff' ? (
          <DiffView
            hunks={diffHunks}
            onApply={handleApplySingleHunk}
            onApplyAll={handleApplyAllHunks}
            onClose={handleCloseDiff}
          />
        ) : (
          <Terminal
            messages={messages}
            isStreaming={isStreaming}
            error={error}
            projectRoot={projectRoot || undefined}
            onSend={handleSendMessage}
            onClear={clearMessages}
            onStop={stopStreaming}
            onApplyCode={handleApplyCode}
          />
        )}
      </div>

      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">🤖 DeepCode</span>
        </div>
        <div className="topbar-right">
          {!projectRoot && (
            <button className="btn btn-sm btn-primary" onClick={handleSelectFolder}>
              📂 Open Project
            </button>
          )}
          {projectRoot && (
            <button className="btn btn-sm btn-ghost" onClick={handleSelectFolder}>
              📂 Switch Project
            </button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={() => { setSettingsForm(config); setShowSettings(true) }}>
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && renderSettings()}
    </div>
  )
}
