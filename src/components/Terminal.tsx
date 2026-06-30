import { useState, useRef, useEffect, useCallback } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import type { ChatMessage } from '../types'

interface TerminalProps {
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  projectRoot?: string
  onSend: (content: string) => void
  onClear: () => void
  onStop: () => void
  onApplyCode: (filePath: string, code: string) => void
}

export default function Terminal({
  messages,
  isStreaming,
  error,
  projectRoot,
  onSend,
  onClear,
  onStop,
  onApplyCode,
}: TerminalProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = inputRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    setCommandHistory((prev) => [...prev, trimmed])
    setHistoryIndex(-1)
    onSend(trimmed)
    setInput('')
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === 'ArrowUp' && !input) {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '')
      }
    } else if (e.key === 'ArrowDown' && !input) {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '')
      } else {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  return (
    <div className="terminal">
      {/* Welcome / header */}
      <div className="terminal-header">
        <span className="terminal-prompt">DeepCode</span>
        <span className="terminal-version">v1.0.0</span>
        {projectRoot && (
          <span className="terminal-project">📁 {projectRoot.split(/[/\\]/).pop()}</span>
        )}
        <div className="terminal-header-actions">
          <button className="btn btn-ghost btn-xs" onClick={onClear} title="Clear chat">
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="terminal-messages">
        {messages.length === 0 && (
          <div className="terminal-welcome">
            <div className="welcome-logo">🤖 DeepCode</div>
            <p>AI-powered coding assistant. Ask me anything about your code!</p>
            <div className="welcome-hints">
              <span>Try:</span>
              <code>/help</code> - Show available commands
              <code>/explain file.ts</code> - Explain a file
              <code>/fix bug in ...</code> - Fix an issue
              <code>write a function that...</code> - Generate code
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            <div className="message-role">
              {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
            </div>
            <div className="message-content">
              {msg.role === 'assistant' ? (
                <MarkdownRenderer
                  content={msg.content}
                  onApplyCode={onApplyCode}
                />
              ) : (
                <div className="message-text">{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="streaming-indicator">
            <span className="cursor-blink">▊</span> Generating...
          </div>
        )}

        {error && (
          <div className="message message-error">
            <div className="message-role">⚠️ Error</div>
            <div className="message-content error-text">{error}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="terminal-input-area">
        <div className="terminal-input-wrapper">
          <span className="input-prompt">❯</span>
          <textarea
            ref={inputRef}
            className="terminal-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              adjustHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'AI is generating...' : 'Type a message (Enter to send, Shift+Enter for newline)...'}
            disabled={isStreaming}
            rows={1}
          />
          {isStreaming ? (
            <button className="btn btn-sm btn-warning" onClick={onStop}>
              ⏹ Stop
            </button>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              ⏎ Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
