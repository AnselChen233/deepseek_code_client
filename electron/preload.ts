import { contextBridge, ipcRenderer } from 'electron'

export interface FileItem {
  name: string
  isDirectory: boolean
  isFile: boolean
  path: string
}

export interface FileResult {
  success: boolean
  content?: string
  error?: string
}

export interface ListDirResult {
  success: boolean
  items?: FileItem[]
  error?: string
}

export interface StatResult {
  success: boolean
  exists: boolean
  isDirectory?: boolean
  isFile?: boolean
  size?: number
}

export interface DialogResult {
  success: boolean
  path?: string
  canceled?: boolean
}

const api = {
  file: {
    read: (filePath: string): Promise<FileResult> =>
      ipcRenderer.invoke('file:read', filePath),
    write: (filePath: string, content: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('file:write', filePath, content),
    listDir: (dirPath: string): Promise<ListDirResult> =>
      ipcRenderer.invoke('file:listDir', dirPath),
    stat: (filePath: string): Promise<StatResult> =>
      ipcRenderer.invoke('file:stat', filePath),
  },
  dialog: {
    openFolder: (): Promise<DialogResult> =>
      ipcRenderer.invoke('dialog:openFolder'),
  },
  app: {
    version: (): Promise<string> => ipcRenderer.invoke('app:version'),
  },
}

contextBridge.exposeInMainWorld('deepcode', api)

// Type declaration for renderer
export type DeepCodeAPI = typeof api
