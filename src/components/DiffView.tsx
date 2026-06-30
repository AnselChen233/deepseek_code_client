import type { DiffHunk } from '../types'

interface DiffViewProps {
  hunks: DiffHunk[]
  onApply: (hunk: DiffHunk) => void
  onApplyAll: () => void
  onClose: () => void
}

export default function DiffView({ hunks, onApply, onApplyAll, onClose }: DiffViewProps) {
  if (hunks.length === 0) {
    return (
      <div className="diff-view">
        <div className="diff-header">
          <span>📊 Code Changes</span>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✖</button>
        </div>
        <div className="diff-empty">No changes to display.</div>
      </div>
    )
  }

  return (
    <div className="diff-view">
      <div className="diff-header">
        <span>📊 Code Changes ({hunks.length} file{hunks.length > 1 ? 's' : ''})</span>
        <div className="diff-actions">
          <button className="btn btn-sm btn-primary" onClick={onApplyAll}>
            ✅ Apply All
          </button>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✖</button>
        </div>
      </div>
      <div className="diff-list">
        {hunks.map((hunk, index) => (
          <div key={index} className="diff-hunk">
            <div className="diff-hunk-header">
              <span className="diff-file-path">📄 {hunk.filePath}</span>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onApply(hunk)}
              >
                ✅ Apply
              </button>
            </div>
            <div className="diff-content">
              <div className="diff-section diff-remove">
                <div className="diff-section-label">--- Original</div>
                <pre><code>{hunk.original}</code></pre>
              </div>
              <div className="diff-section diff-add">
                <div className="diff-section-label">+++ Modified</div>
                <pre><code>{hunk.modified}</code></pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
