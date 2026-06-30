import { useMemo } from 'react'
import { marked } from 'marked'
import hljs from 'highlight.js'

// Configure marked with highlight.js
marked.setOptions({
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true,
})

interface MarkdownRendererProps {
  content: string
  onApplyCode?: (filePath: string, code: string) => void
}

export default function MarkdownRenderer({ content, onApplyCode }: MarkdownRendererProps) {
  const html = useMemo(() => {
    try {
      return marked.parse(content) as string
    } catch {
      return content
    }
  }, [content])

  // Extract file:path code blocks for apply button
  const parsedContent = useMemo(() => {
    if (!onApplyCode) return html
    
    // Parse file blocks: ```file:path/to/file.ext\n...\n```
    const fileBlockRegex = /<pre><code class="language-file:(.*?)">([\s\S]*?)<\/code><\/pre>/g
    
    return html.replace(fileBlockRegex, (_match, filePath: string, code: string) => {
      const decoded = code.replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&amp;/g, '&')
                          .replace(/&quot;/g, '"')
      const escaped = encodeURIComponent(decoded)
      return `
        <div class="file-code-block">
          <div class="file-code-header">
            <span class="file-path">📄 ${filePath}</span>
            <button class="apply-btn" data-file="${filePath}" data-code="${escaped}">
              ✅ Apply
            </button>
          </div>
          <pre><code>${hljs.highlightAuto(decoded).value}</code></pre>
        </div>
      `
    })
  }, [html, onApplyCode])

  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: parsedContent }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.classList.contains('apply-btn') && onApplyCode) {
          const filePath = target.getAttribute('data-file') || ''
          const code = decodeURIComponent(target.getAttribute('data-code') || '')
          onApplyCode(filePath, code)
        }
      }}
    />
  )
}
