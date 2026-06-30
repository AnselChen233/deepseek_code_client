import type { AIConfig, ChatMessage } from '../types'
import { parseGitignore, isIgnored } from './gitignore'
import type { IgnoreRule } from './gitignore'

const STORAGE_KEY = 'deepcode-config'

// -- Config management --
export function loadConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { apiKey: '', apiBase: 'https://api.openai.com/v1', model: 'gpt-4o' }
}

export function saveConfig(config: AIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

// -- AI Chat API --

const DEFAULT_TIMEOUT_MS = 120_000 // 2 minutes

export interface StreamOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

export async function* streamChat(
  messages: ChatMessage[],
  config: AIConfig,
  systemPrompt?: string,
  options?: StreamOptions
): AsyncGenerator<string, void, unknown> {
  const fullMessages: { role: string; content: string }[] = []
  
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt })
  }
  
  for (const msg of messages) {
    fullMessages.push({ role: msg.role, content: msg.content })
  }

  // Combine external signal with timeout into a single abort signal
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timeoutController = typeof AbortSignal.timeout === 'function'
    ? undefined
    : new AbortController()
  
  let combinedSignal: AbortSignal
  if (typeof AbortSignal.any === 'function') {
    const signals: AbortSignal[] = []
    if (options?.signal) signals.push(options.signal)
    if (AbortSignal.timeout) {
      signals.push(AbortSignal.timeout(timeoutMs))
    } else {
      signals.push(timeoutController!.signal)
    }
    combinedSignal = signals.length === 1 ? signals[0] : AbortSignal.any(signals)
  } else {
    // Fallback: use external signal or create a timeout controller
    combinedSignal = options?.signal ?? timeoutController!.signal
  }

  // Start timeout timer if not using AbortSignal.timeout
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined
  if (timeoutController) {
    timeoutTimer = setTimeout(() => timeoutController.abort(), timeoutMs)
  }

  try {
    const response = await fetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: fullMessages,
        stream: true,
        temperature: 0.2,
      }),
      signal: combinedSignal,
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`API error ${response.status}: ${err}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          // skip unparseable chunks
        }
      }
    }
  } finally {
    if (timeoutTimer) clearTimeout(timeoutTimer)
  }
}

// -- Project context builder --
export async function buildProjectContext(rootPath: string): Promise<string> {
  const api = window.deepcode
  const result = await api.file.listDir(rootPath)
  if (!result.success || !result.items) return ''

  // Load .gitignore rules (fall back to built-in defaults if not found)
  let ignoreRules: IgnoreRule[] = []
  try {
    const gitignoreResult = await api.file.read(`${rootPath}/.gitignore`)
    if (gitignoreResult.success && gitignoreResult.content) {
      ignoreRules = parseGitignore(gitignoreResult.content)
    }
  } catch { /* proceed without .gitignore */ }

  // Built-in fallback ignores (always skip these)
  const builtinIgnores = new Set(['.git'])

  const lines: string[] = [`Project root: ${rootPath}\n`, '## File structure:\n']
  
  // Build a tree up to 3 levels deep, limited to 100 files
  const MAX_FILES = 100
  let fileCount = 0

  async function walk(dir: string, prefix: string, depth: number) {
    if (depth > 3 || fileCount >= MAX_FILES) return
    const res = await api.file.listDir(dir)
    if (!res.success || !res.items) return

    const filtered = res.items.filter((item) => {
      if (builtinIgnores.has(item.name)) return false
      if (ignoreRules.length > 0) {
        return !isIgnored(item.name, item.isDirectory, ignoreRules)
      }
      return true
    })

    for (let i = 0; i < filtered.length && fileCount < MAX_FILES; i++) {
      const item = filtered[i]
      const isLast = i === filtered.length - 1
      const connector = isLast ? '└── ' : '├── '
      lines.push(`${prefix}${connector}${item.name}${item.isDirectory ? '/' : ''}`)
      fileCount++

      if (item.isDirectory) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ')
        await walk(item.path, newPrefix, depth + 1)
      }
    }
  }

  await walk(rootPath, '', 0)

  if (fileCount >= MAX_FILES) {
    lines.push('... (truncated)')
  }

  return lines.join('\n')
}
