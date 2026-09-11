export type RepoStatus = 'cloning' | 'building' | 'running' | 'stopped' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'cmd';
  message: string;
  tag?: 'git' | 'npm' | 'vite' | 'system' | 'runtime';
}

export interface RepoFile {
  path: string;
  size: string;
  type: 'file' | 'dir';
  content?: string;
  sha?: string;
  downloadUrl?: string;
  isModified?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  text: string;
  targetFile?: string;
  applied?: boolean;
  summary?: string;
  explanation?: string;
  previousCode?: string;
  updatedCode?: string;
  isGenerating?: boolean;
  error?: string;
  suggestedPrompts?: string[];
}

export interface RepositoryItem {
  id: string;
  name: string;
  fullName: string; // e.g. "usuario/repositorio"
  owner: string;
  gitUrl: string;
  branch: string;
  status: RepoStatus;
  port: number;
  addedAt: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  framework?: string;
  demoType: 'sparkle-box' | 'jarvis' | 'game-2048' | 'markdown-notes' | 'custom-iframe' | 'web-app' | 'generic-app';
  demoUrl?: string;
  logs: LogEntry[];
  files: RepoFile[];
  readmePreview: string;
  envVars?: Record<string, string>;
  dependencies?: Record<string, string>;
  cachedFiles?: Record<string, { content: string; sha?: string; isModified?: boolean }>;
  activePage?: string;
  activeFilePath?: string;
  chatHistory?: ChatMessage[];
}
