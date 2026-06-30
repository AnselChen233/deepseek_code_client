// File system types
export interface FileItem {
  name: string
  isDirectory: boolean
  isFile: boolean
  path: string
}

// Chat message types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

// AI configuration
export interface AIConfig {
  apiKey: string
  apiBase: string
  model: string
}

// Code diff hunk
export interface DiffHunk {
  filePath: string
  original: string
  modified: string
  language: string
}

// App state
export interface ProjectContext {
  rootPath: string
  files: FileItem[]
}

// IPC API exposed via preload
export interface DeepCodeAPI {
  file: {
    read: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
    write: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
    listDir: (dirPath: string) => Promise<{ success: boolean; items?: FileItem[]; error?: string }>
    stat: (filePath: string) => Promise<{ success: boolean; exists: boolean; isDirectory?: boolean; isFile?: boolean; size?: number }>
  }
  dialog: {
    openFolder: () => Promise<{ success: boolean; path?: string; canceled?: boolean }>
  }
  app: {
    version: () => Promise<string>
  }
}

declare global {
  interface Window {
    deepcode: DeepCodeAPI
  }
}
