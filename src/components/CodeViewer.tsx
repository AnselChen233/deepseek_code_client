import { useState, useEffect } from 'react'
import hljs from 'highlight.js'

interface CodeViewerProps {
  filePath: string
  onClose: () => void
  onSave?: (filePath: string, content: string) => void
}

export default function CodeViewer({ filePath, onClose, onSave }: CodeViewerProps) {
  const [content, setContent] = useState<string>('')
  const [originalContent, setOriginalContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadFile()
  }, [filePath])

  const loadFile = async () => {
    setLoading(true)
    setError(null)
    const result = await window.deepcode.file.read(filePath)
    if (result.success && result.content !== undefined) {
      setContent(result.content)
      setOriginalContent(result.content)
    } else {
      setError(result.error || 'Failed to load file')
    }
    setLoading(false)
  }

  const handleEdit = (newContent: string) => {
    setContent(newContent)
    setHasChanges(newContent !== originalContent)
  }

  const handleSave = async () => {
    if (!onSave) {
      const result = await window.deepcode.file.write(filePath, content)
      if (result.success) {
        setOriginalContent(content)
        setHasChanges(false)
        setIsEditing(false)
      } else {
        setError(result.error || 'Failed to save')
      }
    } else {
      onSave(filePath, content)
    }
  }

  const handleCancel = () => {
    setContent(originalContent)
    setHasChanges(false)
    setIsEditing(false)
  }

  const language = getLanguage(filePath)
  const highlighted = hljs.highlight(content, { language }).value

  const fileName = filePath.split(/[/\\]/).pop() || filePath

  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <span className="code-viewer-title">📄 {fileName}</span>
        <span className="code-viewer-path">{filePath}</span>
        <div className="code-viewer-actions">
          {isEditing ? (
            <>
              <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={!hasChanges}>
                💾 Save
              </button>
              <button className="btn btn-sm btn-ghost" onClick={handleCancel}>
                ✖ Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-sm btn-ghost" onClick={() => setIsEditing(true)}>
              ✏️ Edit
            </button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            ✖ Close
          </button>
        </div>
      </div>
      <div className="code-viewer-body">
        {loading && <div className="loading-text">Loading file...</div>}
        {error && <div className="error-text">Error: {error}</div>}
        {!loading && !error && (
          isEditing ? (
            <textarea
              className="code-editor"
              value={content}
              onChange={(e) => handleEdit(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <pre className="code-display">
              <code
                className={`language-${language}`}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          )
        )}
      </div>
    </div>
  )
}

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    py: 'python', rs: 'rust', go: 'go',
    java: 'java', c: 'c', cpp: 'cpp', h: 'c',
    html: 'html', css: 'css', scss: 'scss',
    json: 'json', xml: 'xml', yaml: 'yaml', yml: 'yaml',
    md: 'markdown', sql: 'sql', sh: 'bash', bash: 'bash',
    ps1: 'powershell', bat: 'batch',
  }
  return map[ext || ''] || 'plaintext'
}
