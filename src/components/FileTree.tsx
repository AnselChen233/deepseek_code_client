import { useState, useEffect, useCallback } from 'react'
import type { FileItem } from '../types'
import { parseGitignore, isIgnored } from '../utils/gitignore'
import type { IgnoreRule } from '../utils/gitignore'

interface FileTreeProps {
  rootPath: string
  onSelectFile: (filePath: string) => void
  selectedFile?: string
}

interface TreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: TreeNode[]
  loaded: boolean
  loading: boolean
}

export default function FileTree({ rootPath, onSelectFile, selectedFile }: FileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [ignoreRules, setIgnoreRules] = useState<IgnoreRule[]>([])

  // Load .gitignore from project root
  useEffect(() => {
    let cancelled = false
    async function loadGitignore() {
      try {
        const gitignorePath = `${rootPath}/.gitignore`
        const result = await window.deepcode.file.read(gitignorePath)
        if (!cancelled && result.success && result.content) {
          setIgnoreRules(parseGitignore(result.content))
        } else {
          setIgnoreRules([])
        }
      } catch {
        setIgnoreRules([])
      }
    }
    if (rootPath) {
      loadGitignore()
    }
    return () => { cancelled = true }
  }, [rootPath])

  const fetchDir = useCallback(
    async (dirPath: string): Promise<TreeNode[]> => {
      const result = await window.deepcode.file.listDir(dirPath)
      if (!result.success || !result.items) return []

      // Filter out ignored entries (gitignore + .git)
      const ignoreNames = new Set(['.git'])
      return result.items
        .filter((item) => {
          if (ignoreNames.has(item.name)) return false
          if (ignoreRules.length > 0) {
            return !isIgnored(item.name, item.isDirectory, ignoreRules)
          }
          return true
        })
        .map((item) => ({
          name: item.name,
          path: item.path,
          isDirectory: item.isDirectory,
          loaded: false,
          loading: false,
        }))
    },
    [ignoreRules]
  )

  useEffect(() => {
    if (rootPath) {
      setLoading(true)
      fetchDir(rootPath).then((nodes) => {
        setTree(nodes)
        setLoading(false)
      })
    }
  }, [rootPath, fetchDir])

  const toggleExpand = async (node: TreeNode) => {
    if (node.children) {
      // Collapse
      node.children = undefined
      setTree([...tree])
      return
    }

    node.loading = true
    setTree([...tree])

    const children = await fetchDir(node.path)
    node.children = children
    node.loaded = true
    node.loading = false
    setTree([...tree])
  }

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isSelected = node.path === selectedFile
    const paddingLeft = 12 + depth * 16

    return (
      <div key={node.path}>
        <div
          className={`file-tree-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (node.isDirectory) {
              toggleExpand(node)
            } else {
              onSelectFile(node.path)
            }
          }}
        >
          <span className="file-icon">
            {node.isDirectory ? (
              node.children ? '📂' : '📁'
            ) : getFileIcon(node.name)}
          </span>
          <span className="file-name">{node.name}</span>
          {node.loading && <span className="loading-spinner">⏳</span>}
        </div>
        {node.children && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="file-tree">
        <div className="file-tree-header">📁 Project Files</div>
        <div className="loading-text">Loading...</div>
      </div>
    )
  }

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        📁 {rootPath.split(/[/\\]/).pop() || rootPath}
      </div>
      <div className="file-tree-list">
        {tree.map((node) => renderNode(node))}
      </div>
    </div>
  )
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const icons: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️',
    py: '🐍', rs: '🦀', go: '🔵', java: '☕',
    html: '🌐', css: '🎨', scss: '🎨', less: '🎨',
    json: '📋', xml: '📋', yaml: '📋', yml: '📋', toml: '📋',
    md: '📝', txt: '📄', log: '📄',
    svg: '🖼️', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
    sh: '🐚', bash: '🐚', ps1: '💻', bat: '💻', cmd: '💻',
    gitignore: '⚙️', env: '⚙️', config: '⚙️',
  }
  return icons[ext || ''] || '📄'
}
