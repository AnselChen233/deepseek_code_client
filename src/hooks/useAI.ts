import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, AIConfig } from '../types'
import { streamChat, buildProjectContext } from '../utils/api'
import type { StreamOptions } from '../utils/api'

const SYSTEM_PROMPT = `You are DeepCode, an AI coding assistant that runs inside a desktop application. You have direct access to the user's project files.

Your capabilities:
- Read any file in the project
- Write/modify files (the user can apply your suggested changes)
- Understand the full project context
- Explain code and architecture
- Debug issues
- Suggest improvements

Guidelines:
1. When suggesting code changes, always output the FULL file content or a clear diff format.
2. Use markdown code blocks with language identifiers for code.
3. Be concise but thorough.
4. When you propose file modifications, use the format:
   \`\`\`file:path/to/file.ext
   // full file content here
   \`\`\`
   This helps the app detect which file to modify.
5. Ask clarifying questions if the request is ambiguous.`

export function useAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string, config: AIConfig, projectRoot?: string) => {
      if (!content.trim()) return
      if (!config.apiKey) {
        setError('Please configure your API key first (click the gear icon).')
        return
      }

      setError(null)

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      }

      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)

      // Build project context if we have a project root
      let fullContent = content
      if (projectRoot) {
        try {
          const context = await buildProjectContext(projectRoot)
          if (context) {
            fullContent = `[Project Context]\n${context}\n\n[User Request]\n${content}`
          }
        } catch {
          // Proceed without context
        }
      }

      // Create a new messages array with the enhanced content for the API call
      const apiMessages = [
        ...messages,
        { ...userMsg, content: fullContent },
      ]

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMsg])
      setIsStreaming(true)

      // Create abort controller for this request
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const options: StreamOptions = { signal: controller.signal }
        const generator = streamChat(apiMessages, config, SYSTEM_PROMPT, options)

        for await (const chunk of generator) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: m.content + chunk }
                : m
            )
          )
        }
      } catch (err: any) {
        // Don't show error for user-initiated aborts
        if (err.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id && !m.content
                ? { ...m, content: '(stopped)' }
                : m
            )
          )
        } else {
          const errorMsg = err.message || 'Unknown error'
          setError(errorMsg)
          // Remove the empty assistant message on error
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id))
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    setIsStreaming(false)
  }, [])

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    stopStreaming,
  }
}
